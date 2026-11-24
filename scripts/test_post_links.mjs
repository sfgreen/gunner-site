// Tracked post links (lib/postLinks.ts): source cleaning, bot filter, device, destination, Central day.
//   node --experimental-transform-types --no-warnings --import ./scripts/ts-resolve.mjs --test scripts/test_post_links.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanSource, isBot, deviceOf, destination, centralDay } from '../lib/postLinks.ts';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const REDDIT_APP = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Reddit/Version 2024.45.0/Build 123/iOS Version 18.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36';
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';

test('sources are short lowercase slugs', () => {
  assert.equal(cleanSource('reddit-buddy'), 'reddit-buddy');
  assert.equal(cleanSource('Reddit_Buddy '), 'reddit-buddy');
  assert.equal(cleanSource('r/Step2 buddy!!'), 'r-step2-buddy');
  assert.equal(cleanSource('x'), null);
  assert.equal(cleanSource(undefined), null);
  assert.equal(cleanSource('a'.repeat(80)).length, 40);
});

test('people count, previews and scripts do not', () => {
  for (const ua of [IPHONE, REDDIT_APP, ANDROID, MAC]) assert.equal(isBot(ua), false, ua);
  for (const ua of ['Mozilla/5.0 (compatible; redditbot/1.0; +http://www.reddit.com/feedback)',
    'facebookexternalhit/1.1 Facebot Twitterbot/1.0', 'Slackbot-LinkExpanding 1.0', 'Discordbot/2.0',
    'WhatsApp/2.23', 'curl/8.4.0', 'python-requests/2.31', 'Googlebot/2.1', undefined, '']) {
    assert.equal(isBot(ua), true, String(ua));
  }
});

test('an iPhone goes to the App Store with the post campaign; everyone else to the site', () => {
  assert.equal(deviceOf(IPHONE), 'ios');
  assert.equal(deviceOf(REDDIT_APP), 'ios');
  assert.equal(deviceOf(ANDROID), 'android');
  assert.equal(deviceOf(MAC), 'desktop');
  const ios = destination('reddit-buddy', 'ios');
  assert.match(ios, /^https:\/\/apps\.apple\.com\/us\/app\/step-gunner\/id6761317357\?pt=128505861&ct=post_reddit-buddy&mt=8$/);
  assert.equal(destination('reddit-buddy', 'desktop'), '/?utm_source=post&utm_medium=link&utm_campaign=reddit-buddy');
});

test('days are Central', () => {
  // 2026-11-25 03:30 UTC is still Nov 24 in Chicago (CST, UTC-6).
  assert.equal(centralDay(Date.UTC(2026, 10, 25, 3, 30)), '2026-11-24');
  assert.equal(centralDay(Date.UTC(2026, 10, 25, 7, 0)), '2026-11-25');
});
