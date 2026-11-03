// Stripe setup for Pro on the web (decision 0051). Safe to run again: it finds
// what exists, checks it, and creates only what is missing.
//
//   node scripts/stripe_setup.mjs --mode test
//   node scripts/stripe_setup.mjs --mode live --push-vercel
//
// Options:
//   --mode test|live         which Stripe mode (the key must match)
//   --webhook-url URL        live default https://stepgunner.com/api/pro/webhook;
//                            test makes none (scripts/stripe_dev.mjs listens locally)
//   --recreate-webhook       delete and remake the endpoint (new signing secret)
//   --push-vercel            live only: write the key, webhook secret and ids to
//                            Vercel production env (they apply on the next deploy)
//   --dry-run                read and report, change nothing
//
// The secret key is read from ~/.config/firebase/stripe_<mode>_secret_key.txt and
// is never printed. A new webhook signing secret is saved to
// ~/.config/firebase/stripe_<mode>_webhook_secret.txt (mode 600), never printed.
// The ids (not secret) go to scripts/stripe_ids.json.
import Stripe from 'stripe';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const IDS_FILE = join(REPO, 'scripts', 'stripe_ids.json');
const SECRETS = join(homedir(), '.config', 'firebase');
const REZUMAB_ACCOUNT = 'acct_1TEcloLO2v1BQxUH';

const PRODUCT_ID = 'step_gunner_pro';
// Managed Payments (Stripe as merchant of record) needs an eligible tax code on the
// product. Self-study web-based training; the CPA may pick another eligible code.
const TAX_CODE = 'txcd_20060058';
const PRODUCT_NAME = 'Step Gunner Pro';
// Same prices as the App Store (0051).
const PRICES = {
  yearly: { lookup: 'gunner_pro_yearly', amount: 9999, interval: 'year', nickname: 'Yearly' },
  monthly: { lookup: 'gunner_pro_monthly', amount: 1499, interval: 'month', nickname: 'Monthly' },
};
// Chiefs (0041): 40% off the first year. The server only applies it to yearly.
const CHIEF = { id: 'gunner_chief_40', name: 'Chief code', percent_off: 40 };
// Friend codes (0057, Danny 2026-11-03): 40% off a first year, or $5 off a first
// month. The server picks the coupon by plan.
const FRIEND_YEARLY = { id: 'gunner_friend_40pct', name: 'Friend code (yearly)', percent_off: 40 };
const FRIEND_MONTHLY = { id: 'gunner_friend_500c', name: 'Friend code (monthly)', amount_off: 500, currency: 'usd' };
// What pages/api/pro/webhook.ts handles.
const EVENTS = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
  'invoice.paid',
  'invoice.payment_failed',
  'charge.refunded',
  'charge.dispute.created',
];
const SITE = { test: 'http://localhost:3000', live: 'https://stepgunner.com' };
const PORTAL_TAG = 'stepgunner_web_pro';

function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) throw new Error(`Unexpected argument ${a}`);
    const k = a.slice(2);
    if (['push-vercel', 'dry-run', 'recreate-webhook'].includes(k)) out[k] = true;
    else out[k] = argv[++i];
  }
  return out;
}

function readKey(mode) {
  const file = join(SECRETS, `stripe_${mode}_secret_key.txt`);
  if (!existsSync(file)) {
    throw new Error(`No key file. Copy the ${mode} secret key in Stripe, then run:\n  pbpaste > ${file} && chmod 600 ${file}`);
  }
  const key = readFileSync(file, 'utf8').trim();
  const ok = mode === 'live' ? /^(sk|rk)_live_/.test(key) : /^(sk|rk)_test_/.test(key);
  if (!ok) throw new Error(`The key in ${file} is not a ${mode} secret key.`);
  return key;
}

const log = (s) => console.log(s);

async function main() {
  const a = args(process.argv.slice(2));
  const mode = a.mode;
  if (mode !== 'test' && mode !== 'live') throw new Error('--mode test|live is required.');
  if (a['push-vercel'] && mode !== 'live') throw new Error('--push-vercel is for live mode. Test mode runs locally with scripts/stripe_dev.mjs.');
  const dry = !!a['dry-run'];
  const st = new Stripe(readKey(mode));
  const all = existsSync(IDS_FILE) ? JSON.parse(readFileSync(IDS_FILE, 'utf8')) : {};
  const prev = all[mode] || {};
  const ids = { ...prev };
  const act = (what) => log(`${dry ? 'would ' : ''}${what}`);

  // ---- the right account ----
  const acct = await st.accounts.retrieveCurrent();
  const name = acct.settings?.dashboard?.display_name || acct.business_profile?.name || '(no name)';
  if (acct.id === REZUMAB_ACCOUNT) throw new Error('This key belongs to the Rezumab account. Use the Step Gunner account.');
  if (prev.account && prev.account !== acct.id) throw new Error(`scripts/stripe_ids.json has ${mode} account ${prev.account}, but this key is ${acct.id}.`);
  ids.account = acct.id;
  log(`account  ${acct.id} "${name}", ${mode} mode, Stripe API ${Stripe.API_VERSION}`);
  const descriptor = acct.settings?.payments?.statement_descriptor || '';
  if (descriptor !== 'STEP GUNNER') log(`  note: statement descriptor is "${descriptor}"; 0051 wants STEP GUNNER (Settings, Public details)`);
  if (mode === 'live' && !acct.charges_enabled) log('  note: live charges are not enabled yet; finish account activation before launch');

  // ---- product ----
  let product = null;
  try {
    product = await st.products.retrieve(PRODUCT_ID);
  } catch (e) {
    if (e?.code !== 'resource_missing') throw e;
  }
  if (product) {
    log(`product  ${product.id} exists`);
    if (!product.active) throw new Error(`Product ${product.id} is archived. Unarchive it in Stripe first.`);
    if (product.tax_code !== TAX_CODE) {
      act(`set product tax code ${TAX_CODE} (was ${product.tax_code || 'none'})`);
      if (!dry) await st.products.update(PRODUCT_ID, { tax_code: TAX_CODE });
    }
  } else {
    act(`create product ${PRODUCT_ID}`);
    if (!dry) product = await st.products.create({ id: PRODUCT_ID, name: PRODUCT_NAME, tax_code: TAX_CODE, metadata: { app: 'stepgunner' } });
  }
  ids.product = PRODUCT_ID;

  // ---- prices (found by lookup key; amounts are checked, never changed) ----
  ids.prices = { ...(prev.prices || {}) };
  const found = await st.prices.list({ lookup_keys: Object.values(PRICES).map((p) => p.lookup), limit: 10 });
  for (const [plan, p] of Object.entries(PRICES)) {
    const hit = found.data.find((x) => x.lookup_key === p.lookup);
    if (hit) {
      const same = hit.unit_amount === p.amount && hit.currency === 'usd' && hit.recurring?.interval === p.interval
        && hit.product === PRODUCT_ID && hit.active;
      if (!same) throw new Error(`Price ${hit.id} (${p.lookup}) is not ${p.amount} usd per ${p.interval} on ${PRODUCT_ID}, or is archived. Fix it in Stripe; this script never edits a price.`);
      log(`price    ${plan} ${hit.id} exists ($${(p.amount / 100).toFixed(2)}/${p.interval})`);
      // Tax goes on top of the price (Danny 2026-11-03). Stripe lets an unspecified
      // tax behavior be set once; a price already inclusive needs a new price.
      if (hit.tax_behavior === 'unspecified') {
        act(`set price ${plan} tax behavior exclusive (tax on top)`);
        if (!dry) await st.prices.update(hit.id, { tax_behavior: 'exclusive' });
      } else if (hit.tax_behavior !== 'exclusive') {
        throw new Error(`Price ${hit.id} (${p.lookup}) is tax-inclusive; 0051 adds tax on top. Make a new price.`);
      }
      ids.prices[plan] = hit.id;
    } else {
      act(`create price ${plan} $${(p.amount / 100).toFixed(2)}/${p.interval}`);
      if (!dry) {
        const made = await st.prices.create({
          product: PRODUCT_ID,
          currency: 'usd',
          unit_amount: p.amount,
          recurring: { interval: p.interval },
          tax_behavior: 'exclusive',
          lookup_key: p.lookup,
          nickname: p.nickname,
          metadata: { app: 'stepgunner', plan },
        });
        ids.prices[plan] = made.id;
      }
    }
  }

  // ---- coupons (immutable in Stripe, so a changed amount gets a new id) ----
  async function coupon(spec) {
    let c = null;
    try {
      c = await st.coupons.retrieve(spec.id);
    } catch (e) {
      if (e?.code !== 'resource_missing') throw e;
    }
    if (c) {
      const same = (c.percent_off ?? null) === (spec.percent_off ?? null)
        && (c.amount_off ?? null) === (spec.amount_off ?? null) && c.duration === 'once' && c.valid;
      if (!same) throw new Error(`Coupon ${spec.id} exists but differs or is no longer valid.`);
      log(`coupon   ${spec.id} exists`);
      return spec.id;
    }
    act(`create coupon ${spec.id}`);
    if (!dry) {
      await st.coupons.create({
        id: spec.id,
        name: spec.name,
        duration: 'once',
        percent_off: spec.percent_off,
        amount_off: spec.amount_off,
        currency: spec.currency,
        applies_to: { products: [PRODUCT_ID] },
        metadata: { app: 'stepgunner' },
      });
    }
    return spec.id;
  }
  ids.coupons = { ...(prev.coupons || {}) };
  ids.coupons.chief = await coupon(CHIEF);
  ids.coupons.friendYearly = await coupon(FRIEND_YEARLY);
  ids.coupons.friendMonthly = await coupon(FRIEND_MONTHLY);
  delete ids.coupons.friend;

  // ---- customer portal ----
  const site = SITE[mode];
  const portal = {
    business_profile: {
      headline: 'Manage your Step Gunner Pro plan',
      privacy_policy_url: 'https://stepgunner.com/privacy',
      terms_of_service_url: 'https://stepgunner.com/terms',
    },
    default_return_url: `${site}/pro`,
    features: {
      customer_update: { enabled: true, allowed_updates: ['email', 'name', 'address'] },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: {
        enabled: true,
        mode: 'at_period_end',
        proration_behavior: 'none',
        cancellation_reason: {
          enabled: true,
          options: ['too_expensive', 'unused', 'missing_features', 'switched_service', 'low_quality', 'other'],
        },
      },
      // Switching plans: an upgrade charges the difference now; a move to
      // monthly waits for the end of the paid year.
      subscription_update: {
        enabled: true,
        default_allowed_updates: ['price'],
        products: [{ product: PRODUCT_ID, prices: Object.values(ids.prices).filter(Boolean) }],
        proration_behavior: 'always_invoice',
        schedule_at_period_end: { conditions: [{ type: 'decreasing_item_amount' }, { type: 'shortening_interval' }] },
      },
    },
    metadata: { app: PORTAL_TAG },
  };
  const configs = await st.billingPortal.configurations.list({ active: true, limit: 100 });
  const mine = configs.data.find((c) => c.metadata?.app === PORTAL_TAG);
  if (mine) {
    act(`update portal ${mine.id}`);
    if (!dry) await st.billingPortal.configurations.update(mine.id, portal);
    ids.portalConfig = mine.id;
  } else {
    act('create portal configuration');
    if (!dry) ids.portalConfig = (await st.billingPortal.configurations.create(portal)).id;
  }

  // ---- webhook endpoint ----
  let newSecret = null;
  const hookUrl = a['webhook-url'] || (mode === 'live' ? `${SITE.live}/api/pro/webhook` : null);
  if (hookUrl) {
    const hooks = await st.webhookEndpoints.list({ limit: 100 });
    let hook = hooks.data.find((h) => h.url === hookUrl);
    if (hook && a['recreate-webhook']) {
      act(`delete webhook ${hook.id}`);
      if (!dry) await st.webhookEndpoints.del(hook.id);
      hook = null;
    }
    if (hook) {
      if (hook.api_version && hook.api_version !== Stripe.API_VERSION) {
        log(`  note: webhook ${hook.id} sends API ${hook.api_version}, the code reads ${Stripe.API_VERSION}; rerun with --recreate-webhook`);
      }
      act(`update webhook ${hook.id} events`);
      if (!dry) await st.webhookEndpoints.update(hook.id, { enabled_events: EVENTS, disabled: false });
      ids.webhookEndpoint = hook.id;
    } else {
      act(`create webhook ${hookUrl}`);
      if (!dry) {
        const made = await st.webhookEndpoints.create({
          url: hookUrl,
          enabled_events: EVENTS,
          api_version: Stripe.API_VERSION,
          description: 'Step Gunner Pro on the web (decision 0051)',
          metadata: { app: 'stepgunner' },
        });
        ids.webhookEndpoint = made.id;
        newSecret = made.secret;
        const f = join(SECRETS, `stripe_${mode}_webhook_secret.txt`);
        writeFileSync(f, newSecret, { mode: 0o600 });
        chmodSync(f, 0o600);
        log(`  signing secret saved to ${f}`);
      }
    }
  } else {
    log('webhook  none in test mode (scripts/stripe_dev.mjs forwards events to localhost)');
  }

  if (dry) {
    log('dry run: nothing changed');
    return;
  }
  ids.apiVersion = Stripe.API_VERSION;
  ids.updatedAt = new Date().toISOString();
  all[mode] = ids;
  writeFileSync(IDS_FILE, JSON.stringify(all, null, 2) + '\n');
  log(`ids      written to scripts/stripe_ids.json`);

  // ---- Vercel production env ----
  if (a['push-vercel']) {
    const hookSecretFile = join(SECRETS, `stripe_${mode}_webhook_secret.txt`);
    const hookSecret = newSecret || (existsSync(hookSecretFile) ? readFileSync(hookSecretFile, 'utf8').trim() : null);
    if (!hookSecret) throw new Error('No webhook signing secret on file. Rerun with --recreate-webhook --push-vercel.');
    const env = [
      ['STRIPE_SECRET_KEY', readKey(mode), true],
      ['STRIPE_WEBHOOK_SECRET', hookSecret, true],
      ['STRIPE_PRICE_YEARLY', ids.prices.yearly, false],
      ['STRIPE_PRICE_MONTHLY', ids.prices.monthly, false],
      ['STRIPE_COUPON_CHIEF', ids.coupons.chief, false],
      ['STRIPE_PORTAL_CONFIG', ids.portalConfig, false],
      ['STRIPE_COUPON_FRIEND_YEARLY', ids.coupons.friendYearly, false],
      ['STRIPE_COUPON_FRIEND_MONTHLY', ids.coupons.friendMonthly, false],
      // Managed Payments (Stripe as merchant of record, 2026-11-03): checkout sends
      // managed_payments and never its own tax settings.
      ['STRIPE_MANAGED', '1', false],
    ];
    for (const [k, v, secret] of env) {
      // The value goes in on stdin, so it never shows in a process list or log.
      const r = spawnSync('vercel', ['env', 'add', k, 'production', '--force', '--yes', secret ? '--sensitive' : '--no-sensitive'], {
        cwd: REPO, input: v, encoding: 'utf8',
      });
      if (r.status !== 0) throw new Error(`vercel env add ${k} failed: ${(r.stderr || '').split('\n').slice(-3).join(' ')}`);
      log(`vercel   ${k} set on production${secret ? ' (secret)' : ''}`);
    }
    log('vercel   applies on the next production deploy');
  }
}

main().catch((e) => {
  console.error(`stripe_setup: ${e?.message || e}`);
  process.exit(1);
});
