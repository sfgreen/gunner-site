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
