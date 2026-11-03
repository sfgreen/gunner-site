// Run /pro locally against Stripe TEST mode, webhooks included.
//
//   node scripts/stripe_dev.mjs        then open http://localhost:3000/pro
//
// Needs scripts/stripe_setup.mjs --mode test to have run. Starts `stripe listen`
// (forwarding to /api/pro/webhook) and `next dev` with the test key, the test
// ids and the Firebase service account in their environment. Nothing secret is
// written to disk or printed. Pay with Stripe's test card 4242 4242 4242 4242.
//
// The API writes to PROD Firestore (users/{uid}.webPro and the grant fields)
// for whoever signs in, so test only with a QA account.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 3000;
// What pages/api/pro/webhook.ts handles (the same list stripe_setup.mjs gives the
// live endpoint). Stripe CLI 1.52+ forwards nothing without --events.
const EVENTS = [
  'checkout.session.completed', 'checkout.session.async_payment_succeeded',
  'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted',
  'customer.subscription.paused', 'customer.subscription.resumed',
  'invoice.paid', 'invoice.payment_failed', 'charge.refunded', 'charge.dispute.created',
];

const key = readFileSync(join(homedir(), '.config', 'firebase', 'stripe_test_secret_key.txt'), 'utf8').trim();
if (!/^(sk|rk)_test_/.test(key)) throw new Error('stripe_test_secret_key.txt does not hold a test key.');
const ids = JSON.parse(readFileSync(join(REPO, 'scripts', 'stripe_ids.json'), 'utf8')).test;
if (!ids?.prices?.yearly) throw new Error('Run scripts/stripe_setup.mjs --mode test first.');
const serviceAccount = readFileSync(join(homedir(), '.config', 'firebase', 'stepgunner-service-account.json'), 'utf8');

const stripeEnv = { ...process.env, STRIPE_API_KEY: key };
const secret = spawnSync('stripe', ['listen', '--print-secret'], { env: stripeEnv, encoding: 'utf8' });
const whsec = (secret.stdout || '').trim();
if (secret.status !== 0 || !whsec.startsWith('whsec_')) throw new Error('stripe listen --print-secret failed.');

const env = {
  ...process.env,
  STRIPE_SECRET_KEY: key,
  STRIPE_WEBHOOK_SECRET: whsec,
  STRIPE_PRICE_YEARLY: ids.prices.yearly,
  STRIPE_PRICE_MONTHLY: ids.prices.monthly,
  STRIPE_COUPON_CHIEF: ids.coupons?.chief || '',
  STRIPE_COUPON_FRIEND_YEARLY: ids.coupons?.friendYearly || '',
  STRIPE_COUPON_FRIEND_MONTHLY: ids.coupons?.friendMonthly || '',
  STRIPE_MANAGED: '1',
  STRIPE_PORTAL_CONFIG: ids.portalConfig || '',
  PRO_ORIGIN: `http://localhost:${PORT}`,
  FIREBASE_SERVICE_ACCOUNT_KEY: serviceAccount,
};

const kids = [
  spawn('stripe', ['listen', '--events', EVENTS.join(','), '--forward-to', `localhost:${PORT}/api/pro/webhook`], { env: stripeEnv, stdio: 'inherit' }),
  spawn('npx', ['next', 'dev', '-p', String(PORT)], { cwd: REPO, env, stdio: 'inherit' }),
];
const stop = () => kids.forEach((k) => k.kill('SIGINT'));
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
kids.forEach((k) => k.on('exit', stop));
console.log(`stripe_dev: test mode on http://localhost:${PORT}/pro (account ${ids.account})`);
