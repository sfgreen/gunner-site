import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import {
  AutopsyInput,
  Classification,
  ONE_TAP_REASONS,
  OneTapReason,
  SIBLINGS_PER_CLASS,
  SIBLING_DUE_DAYS,
  MODEL,
  armFor,
  classifyByRule,
  classifyWithModel,
} from '../../lib/missAutopsy';

// Miss Autopsy prototype. The app POSTs here after a wrong answer, with the
// student's reasoning (or a one-tap reason, or nothing if they skipped). Returns
// either one follow-up question, or the error class, remedy and scheduled
// siblings. Every call costs a model request, so it requires a Firebase ID token
// from the signed-in app user; anonymous web visitors cannot reach it.
if (!getApps().length && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)) });
}
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);
const int = (v: unknown) => (Number.isInteger(v) ? (v as number) : undefined);

function parseBody(b: any): AutopsyInput | null {
  const q = b?.question;
  const options = Array.isArray(q?.options) ? q.options.filter((o: unknown) => typeof o === 'string') : [];
  const correctIndex = int(q?.correctIndex);
  const chosenIndex = int(b?.chosenIndex);
  const id = str(q?.id, 64);
  const stem = str(q?.stem, 4000);
  if (!id || !stem || options.length < 2 || options.length > 8) return null;
  if (correctIndex == null || chosenIndex == null) return null;
  if (correctIndex < 0 || correctIndex >= options.length || chosenIndex < 0 || chosenIndex >= options.length) return null;
  if (correctIndex === chosenIndex) return null; // not a miss
  const responseMs = Number(b?.responseMs);
  const priorMisses = int(b?.priorMisses);
  return {
    question: {
      id,
      stem,
      options: options.map((o: string) => o.slice(0, 300)),
      correctIndex,
      explanation: str(q?.explanation, 4000),
      conceptId: str(q?.conceptId, 64),
      conceptName: str(q?.conceptName, 120),
    },
    chosenIndex,
    reasoning: str(b?.reasoning, 600),
    oneTap: ONE_TAP_REASONS.includes(b?.oneTap) ? (b.oneTap as OneTapReason) : undefined,
    responseMs: Number.isFinite(responseMs) && responseMs >= 0 ? Math.round(responseMs) : undefined,
    followUpQuestion: str(b?.followUpQuestion, 200),
    followUpAnswer: str(b?.followUpAnswer, 400),
    priorMisses: priorMisses != null && priorMisses >= 0 ? priorMisses : undefined,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!getApps().length) return res.status(503).json({ error: 'no-credential' });

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  let uid: string;
  try {
    uid = (await getAuth().verifyIdToken(token)).uid;
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const input = parseBody(req.body);
  if (!input) return res.status(400).json({ error: 'Invalid miss' });

  const arm = armFor(uid);
  const db = getFirestore();
  const conceptId = input.question.conceptId;

  try {
    let result: Classification | null = null;
    if (arm === 'treatment') {
      result = classifyByRule(input);
      if (!result && anthropic) {
        try {
          result = await classifyWithModel(anthropic, input);
        } catch (err) {
          console.error('miss-autopsy classify failed', err); // timeout, rate limit or API error
        }
      }
      result ??= { errorClass: 'unspecified', confidence: 0, discriminator: null, remedy: null, followUpQuestion: null, source: 'fallback' };

      // Low confidence: ask once, persist nothing yet. The app re-POSTs with the answer.
      if (result.followUpQuestion) {
        return res.status(200).json({ arm, status: 'follow_up', question: result.followUpQuestion });
      }
    }

    // Siblings from the verified pool only (FR4): the student never waits on generation.
    // A short pool is flagged for the background refill job.
    const want = result ? SIBLINGS_PER_CLASS[result.errorClass] : 0;
    let siblings: { itemId: string; dueAt: string }[] = [];
    if (want && conceptId) {
      const snap = await db
        .collection('items')
        .where('concept_id', '==', conceptId)
        .where('status', '==', 'live')
        .limit(want + 1)
        .get();
      const now = Date.now();
      siblings = snap.docs
        .filter((d) => d.id !== input.question.id)
        .slice(0, want)
        .map((d, i) => ({
          itemId: d.id,
          dueAt: new Date(now + SIBLING_DUE_DAYS[i % SIBLING_DUE_DAYS.length] * 864e5).toISOString(),
        }));
    }

    await db.collection('autopsies').add({
      student_id: uid,
      arm,
      item_id: input.question.id,
      concept_id: conceptId ?? null,
      chosen: input.chosenIndex,
      one_tap_reason: input.oneTap ?? null,
      reasoning_text: input.reasoning ?? null,
      follow_up_answer: input.followUpAnswer ?? null,
      response_ms: input.responseMs ?? null,
      error_class: result?.errorClass ?? null,
      confidence: result?.confidence ?? null,
      discriminator: result?.discriminator ?? null,
      classified_by: result?.source ?? null,
      model: result?.source === 'model' ? MODEL : null,
      sibling_ids: siblings.map((s) => s.itemId),
      sibling_due: siblings.map((s) => s.dueAt),
      pool_short: siblings.length < want,
      created_at: Timestamp.now(),
    });

    // Both arms count misses per concept: the repeat-miss rate is the primary metric.
    if (conceptId) {
      await db
        .collection('concept_state')
        .doc(`${uid}_${conceptId}`)
        .set(
          {
            student_id: uid,
            concept_id: conceptId,
            miss_count: FieldValue.increment(1),
            last_class: result?.errorClass ?? null,
            last_miss_at: Timestamp.now(),
          },
          { merge: true },
        );
    }

    if (arm === 'control') return res.status(200).json({ arm, status: 'control' });
    return res.status(200).json({
      arm,
      status: 'done',
      errorClass: result!.errorClass,
      confidence: result!.confidence,
      discriminator: result!.discriminator,
      remedy: result!.remedy,
      siblings,
    });
  } catch (err) {
    console.error('miss-autopsy failed', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
