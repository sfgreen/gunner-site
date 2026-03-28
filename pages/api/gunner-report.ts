import type { NextApiRequest, NextApiResponse } from 'next';

// Bot token and chat ID live in Vercel env vars — never in the app binary
const BOT_TOKEN = process.env.GUNNER_TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.GUNNER_TELEGRAM_CHAT_ID;

interface ReportBody {
  questionId?: number;
  questionText: string;
  correctAnswer: string;
  selectedAnswer?: string;
  choices?: string[];
  category: string;
  reason: string;
  notes?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate env vars
  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('Missing GUNNER_TELEGRAM_BOT_TOKEN or GUNNER_TELEGRAM_CHAT_ID');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  // Validate body
  const body = req.body as ReportBody;
  if (!body.questionText || !body.correctAnswer || !body.reason || !body.category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Build Telegram message
  let message = '⚠️ GUNNER REPORT\n\n';
  message += `📋 Reason: ${body.reason}\n`;
  message += `📂 Category: ${body.category}\n`;
  if (body.questionId) {
    message += `🆔 Question #${body.questionId}\n`;
  }
  message += `\n❓ Question:\n${body.questionText}\n\n`;
  if (body.choices && body.choices.length > 0) {
    message += '📝 Choices:\n';
    body.choices.forEach((choice, i) => {
      const letter = String.fromCharCode(65 + i);
      message += `  ${letter}. ${choice}\n`;
    });
    message += '\n';
  }
  message += `✅ Correct: ${body.correctAnswer}\n`;
  if (body.selectedAnswer) {
    message += `❌ Selected: ${body.selectedAnswer}\n`;
  }
  if (body.notes && body.notes.trim()) {
    message += `\n📝 Notes: ${body.notes}\n`;
  }
  message += `\n🕐 ${new Date().toISOString()}`;

  // Send to Telegram
  try {
    const telegramRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
        }),
      }
    );

    if (!telegramRes.ok) {
      const err = await telegramRes.text();
      console.error('Telegram API error:', err);
      return res.status(502).json({ error: 'Failed to send report' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Telegram send error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
