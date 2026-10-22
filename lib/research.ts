// The research archive, newest first. One entry per published piece; the
// /research index and the sitemap read this list, so a new article is one
// line here plus its page. No em or en dashes in the copy (site rule).

export type ResearchEntry = {
  href: string;
  title: string;
  finding: string;
  sample: string;
  published: string; // YYYY-MM-DD
};

export const RESEARCH: ResearchEntry[] = [
  {
    href: '/research/which-nbme-is-most-predictive',
    title: 'Which NBME is the real you?',
    finding: 'One student’s forms land a median 23 points apart, much of it noise; no single form predicts better, and when your best form misleads you.',
    sample: '230 students with two or more forms',
    published: '2026-10-22',
  },
  {
    href: '/research/most-missed-step-2-ck-topics',
    title: 'Everyone misses the same questions',
    finding: 'Strong and weak students find the same questions hard, and the hard ones are the less famous half of familiar topics.',
    sample: '998 people, 315,216 first tries',
    published: '2026-10-22',
  },
  {
    href: '/research/step-2-ck-time-per-question',
    title: 'Going slower did not come with more right answers',
    finding: 'The slowest quarter took 2.6 times as long per question as the fastest and got the same share right.',
    sample: '383 people, 427,282 timed answers',
    published: '2026-10-22',
  },
  {
    href: '/research/model-misses-app-users',
    title: 'Why our own model is worse on our own users',
    finding: 'The score model misses app users twice as much as the Reddit posters it learned from, and the reason is not the one the folklore gives.',
    sample: '29 app users against 40 unseen posters',
    published: '2026-10-22',
  },
  {
    href: '/research/dedicated-calendar',
    title: 'The dedicated schedule nobody wrote down',
    finding: 'When each NBME and UWSA actually gets sat, how many forms people take, and what another week of dedicated is worth.',
    sample: '269 students, 3,737 practice scores',
    published: '2026-09-19',
  },
  {
    href: '/research/free-120-to-step-2',
    title: 'What a Free 120 percentage is actually worth',
    finding: 'The Free 120 to Step 2 conversion table nobody publishes, and why most people sit it too late to use it.',
    sample: '215 students with a current-form Free 120 and a real score',
    published: '2026-09-15',
  },
  {
    href: '/research/nbme-to-step-2',
    title: 'What actually predicts your Step 2 score',
    finding: 'One calibrated model of practice forms against real scores, with its out-of-sample record updated every Monday.',
    sample: '269 r/step2 score reports',
    published: '2026-08-23',
  },
];
