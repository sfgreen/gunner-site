import type { OnboardingStatus, Payout, PayoutsClient } from './referral';

// Stripe Global Payouts (decision 0057 amendment, 2026-11-04): a sharer is a v2
// recipient Account, fills in their bank on Stripe's hosted form (an Account Link),
// and gets one PayoutIntent per monthly run from our financial account. Built from
// docs.stripe.com/global-payouts (get-started, recipient-creation-options,
// stripe-hosted-recipient-creation, send-money), fetched 2026-11-04. The GA SDK has no
// money_management resources yet, so every call is a rawRequest pinned to
// GP_API_VERSION. Only type imports here, so node --test can run it with a mocked
// Stripe (scripts/test_referral.mjs).
//
// PayoutIntents, not bare OutboundPayments: the docs recommend them for US senders,
// they are GA on the endive version (OutboundPayments still show .preview), and a
// failed or returned payout lands back on the same object.

export const GP_API_VERSION = '2026-10-28.endive';

export type RawStripe = {
  rawRequest(method: string, path: string, params?: Record<string, unknown> | null, options?: Record<string, unknown>): Promise<any>;
};

export type RecipientState = {
  onboardingStatus: OnboardingStatus;
  /** identity.country as Stripe holds it, uppercase ISO alpha-2. */
  country: string | null;
  /** bank_accounts.ach capability status as Stripe reports it. */
  capability: string | null;
  payoutMethodId: string | null;
  /** "Chase ••6789", never the full number. */
  destination: string | null;
};

export interface GlobalPayouts extends PayoutsClient {
  createRecipient(r: { uid: string; email: string; name: string; country: string }): Promise<string>;
  onboardingLink(recipientId: string, kind: 'account_onboarding' | 'account_update', urls: { returnUrl: string; refreshUrl: string }): Promise<string>;
  recipientState(recipientId: string): Promise<RecipientState>;
  /** Every open Step Gunner recipient, with the uid it was made for. */
  listRecipients(): Promise<{ id: string; uid: string | null }[]>;
  /** Close a recipient (it holds bank details), e.g. after the account was deleted. */
  closeRecipient(recipientId: string): Promise<void>;
}

/** A Stripe refusal that a retry cannot fix (4xx other than 429) is permanent. */
function classify(e: unknown): never {
  const s = (e as { statusCode?: number })?.statusCode;
  if (typeof s === 'number' && s >= 400 && s < 500 && s !== 429 && e && typeof e === 'object') {
    (e as { permanent?: boolean }).permanent = true;
  }
  throw e;
}

function query(params: Record<string, string[]>): string {
  const parts: string[] = [];
  for (const [k, vals] of Object.entries(params)) vals.forEach((v, i) => parts.push(`${k}[${i}]=${encodeURIComponent(v)}`));
  return parts.length ? `?${parts.join('&')}` : '';
}

export function onboardingStatusOf(capability: string | null, hasMethod: boolean): OnboardingStatus {
  if (capability === 'restricted' || capability === 'unsupported') return 'restricted';
  if (capability === 'active' && hasMethod) return 'complete';
  return 'pending';
}

type PayoutMethodObj = {
  id: string; type?: string; archived?: boolean; restricted?: boolean;
  usage_status?: { payments?: string };
  bank_account?: { bank_name?: string; last4?: string; archived?: boolean } | null;
};

function usable(m: PayoutMethodObj): boolean {
  return m.type === 'bank_account' && !m.archived && !m.bank_account?.archived && !m.restricted && m.usage_status?.payments === 'eligible';
}

export function globalPayouts(st: RawStripe, o: { financialAccount?: string | null; statementDescriptor?: string } = {}): GlobalPayouts {
  const v = { apiVersion: GP_API_VERSION };
  let fa: string | null = o.financialAccount || null;

  async function financialAccount(): Promise<string> {
    if (fa) return fa;
    const list = await st.rawRequest('GET', '/v2/money_management/financial_accounts', null, v).catch(classify);
    const open = (list?.data || []).find((x: { status?: string }) => x.status === 'open') || null;
    // Not permanent: a missing financial account is set-up work, and the run retries daily until it exists.
    if (!open) throw new Error('No open Stripe financial account. Turn on Global Payouts and fund it.');
    fa = String(open.id);
    return fa;
  }

  return {
    async createRecipient(r) {
      const acct = await st.rawRequest('POST', '/v2/core/accounts', {
        contact_email: r.email,
        display_name: r.name.slice(0, 100),
        identity: { country: r.country.toLowerCase(), entity_type: 'individual' },
        configuration: { recipient: { capabilities: { bank_accounts: { ach: { requested: true } } } } },
        metadata: { app: 'stepgunner', uid: r.uid },
        include: ['identity', 'configuration.recipient', 'requirements'],
      }, { ...v, idempotencyKey: `gunner_recipient_${r.uid}` }).catch(classify);
      return String(acct.id);
    },

    async onboardingLink(recipientId, kind, urls) {
      const link = await st.rawRequest('POST', '/v2/core/account_links', {
        account: recipientId,
        use_case: { type: kind, [kind]: { configurations: ['recipient'], return_url: urls.returnUrl, refresh_url: urls.refreshUrl } },
      }, v).catch(classify);
      return String(link.url);
    },

    async recipientState(recipientId) {
      const acct = await st.rawRequest('GET', `/v2/core/accounts/${encodeURIComponent(recipientId)}${query({ include: ['configuration.recipient', 'defaults', 'identity'] })}`, null, v).catch(classify);
      const capability = acct?.configuration?.recipient?.capabilities?.bank_accounts?.ach?.status || null;
      const list = await st.rawRequest('GET', '/v2/money_management/payout_methods', null, { ...v, stripeContext: recipientId }).catch(classify);
      const methods: PayoutMethodObj[] = (list?.data || []).filter(usable);
      const preferred = acct?.defaults?.payout_methods?.usd;
      const m = methods.find((x) => x.id === preferred) || methods[0] || null;
      return {
        onboardingStatus: onboardingStatusOf(capability, !!m),
        country: typeof acct?.identity?.country === 'string' ? acct.identity.country.toUpperCase() : null,
        capability,
        payoutMethodId: m ? m.id : null,
        destination: m ? `${m.bank_account?.bank_name || 'Bank'} ••${m.bank_account?.last4 || ''}`.trim() : null,
      };
    },

    async listRecipients() {
      const out: { id: string; uid: string | null }[] = [];
      let path: string | null = `/v2/core/accounts${query({ applied_configurations: ['recipient'] })}&limit=100`;
      while (path) {
        const page = await st.rawRequest('GET', path, null, v).catch(classify);
        for (const a of page?.data || []) {
          if (a?.metadata?.app === 'stepgunner') out.push({ id: String(a.id), uid: typeof a.metadata.uid === 'string' ? a.metadata.uid : null });
        }
        path = typeof page?.next_page_url === 'string' && page.next_page_url ? page.next_page_url : null;
      }
      return out;
    },

    async closeRecipient(recipientId) {
      await st.rawRequest('POST', `/v2/core/accounts/${encodeURIComponent(recipientId)}/close`, { applied_configurations: ['recipient'] }, v).catch(classify);
    },

    async send(p: Payout) {
      if (!p.recipientId) throw Object.assign(new Error('payout has no recipient'), { permanent: true });
      if (!(p.cents > 0)) throw Object.assign(new Error('payout has no amount'), { permanent: true });
      const from = await financialAccount();
      const pi = await st.rawRequest('POST', '/v2/money_management/payout_intents', {
        amount: { value: p.cents, currency: 'usd' },
        from: { financial_account: from, currency: 'usd' },
        to: { recipient: p.recipientId, currency: 'usd', ...(p.payoutMethodId ? { payout_method: p.payoutMethodId } : {}) },
        description: `Step Gunner friend rewards, ${p.runId}`,
        statement_descriptor: o.statementDescriptor || 'STEP GUNNER',
        recipient_notification: { setting: 'configured' },
        metadata: { app: 'stepgunner', payoutId: p.id, runId: p.runId, sharerUid: p.sharerUid, rows: String(p.rowIds.length) },
      }, { ...v, idempotencyKey: `gunner_payout_${p.id}` }).catch(classify);
      return { stripeId: String(pi.id), stripeStatus: String(pi.status || '') };
    },

    async outcome(stripeId) {
      const pi = await st.rawRequest('GET', `/v2/money_management/payout_intents/${encodeURIComponent(stripeId)}`, null, v).catch(classify);
      const status = String(pi?.status || '');
      const failure = pi?.next_action?.type === 'handle_failure' ? String(pi.next_action.handle_failure?.failure_reason || 'failed') : '';
      if (status === 'posted') return { state: 'posted', stripeStatus: status };
      if (status === 'canceled' || failure) return { state: 'failed', stripeStatus: failure ? `${status}:${failure}` : status };
      return { state: 'open', stripeStatus: status };
    },

    async cancel(stripeId) {
      await st.rawRequest('POST', `/v2/money_management/payout_intents/${encodeURIComponent(stripeId)}/cancel`, {}, v).catch(classify);
    },
  };
}
