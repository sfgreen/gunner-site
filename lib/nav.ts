// The one site nav: the desktop dropdowns, the phone menu and the footer columns.
//
// lib/app/chrome.js turns this into HTML once, and the same string is the nav on
// every page: the wards pages (lib/wards/render.js) and every React page
// (components/app/AppShell). Only live pages link. A page joins the nav in the
// commit that makes it live; ED Pathways link to the web pages, which are live,
// and no label here promises them in the app (lib/pathways/config PATHWAYS_LIVE).
import SITE from './wards/site.json';

/** The four top-level sections; `cur` on a page underlines its section. */
export type Section = 'wards' | 'shelf' | 'step2' | 'research';

/** [label, one-line description ('' for none), href] */
export type NavLink = [string, string, string];
export type NavGroup = { t: string; links: NavLink[] };
export type NavItem = {
  id: Section;
  label: string;
  /** A plain link instead of a dropdown. */
  href?: string;
  panel?: 'wide' | 'narrow';
  /** The "see everything" row at the foot of the dropdown: [href, label]. */
  all?: [string, string];
  groups?: NavGroup[];
};

const SHELF: NavLink[] = [
  ...SITE.shelf.map(([, name, slug]) => [name, '', `/guides/${slug}`] as NavLink),
  ['Ethics and biostats', '', '/guides/foundations'],
];

export const NAV: NavItem[] = [
  { id: 'wards', label: 'On the wards', panel: 'wide', all: ['/wards', 'Everything on the wards'], groups: [
    { t: 'Labs and ABGs', links: [
      ['ABG interpretation', 'Interpreter and step by step', '/wards/abg-interpretation'],
      ["Winter's formula", 'Expected PaCO2', '/wards/abg-interpretation#abg-fx-winters'],
      ['Delta-delta gap', 'The second disorder', '/wards/abg-interpretation#abg-fx-delta_gap'],
      ['A-a gradient', 'Calculator and normal for age', '/wards/abg-interpretation#abg-fx-aa_gradient'],
    ] },
    { t: 'Notes', links: [
      ['SOAP note', 'Template and example', '/wards/soap-note'],
      ['H&P template', 'Ready to paste', '/wards/soap-note#soap-tool'],
      ['One-liner builder', 'The first line of the note', '/wards/soap-note#soap-oneliner'],
    ] },
  ] },
  { id: 'shelf', label: 'Shelf exams', panel: 'narrow', all: ['/guides', 'Every shelf guide'], groups: [
    { t: 'By rotation', links: SHELF },
  ] },
  { id: 'step2', label: 'Step 2', panel: 'wide', groups: [
    { t: 'Your number', links: [
      ['Readiness check', 'NBME and UWSA scores to a Step 2 range', '/readiness'],
      ['Score predictor', 'One page per form', '/step-2-score-predictor'],
      ['Percentiles', 'What a Step 2 score means', '/step-2-ck-percentiles'],
      ['Score by specialty', 'Your odds, not the average', '/step-2-score-by-specialty'],
    ] },
    { t: 'Your plan', links: [
      ['Study schedule', 'The dedicated calendar, week by week', '/research/dedicated-calendar'],
      ['Free 120', 'Your own PDF in the real interface', '/free120'],
      ['ED study guide', 'The next best step, presentation by presentation', '/step-2-ck-emergency-medicine'],
      ['ED Pathways', 'Each ED presentation, fork by fork', '/pathways'],
    ] },
  ] },
  { id: 'research', label: 'Research', href: '/research' },
];

/** The phone menu: a shorter list, one group per section. [label, href] */
export const MENU: [string, [string, string][]][] = [
  ['On the wards', [['ABG interpretation', '/wards/abg-interpretation'], ['SOAP note', '/wards/soap-note'], ['Everything on the wards', '/wards']]],
  ['Shelf exams', [['Shelf guides by rotation', '/guides']]],
  ['Step 2', [['Readiness check', '/readiness'], ['Score predictor', '/step-2-score-predictor'], ['Percentiles', '/step-2-ck-percentiles'], ['Score by specialty', '/step-2-score-by-specialty'], ['Study schedule', '/research/dedicated-calendar'], ['Free 120', '/free120'], ['ED study guide', '/step-2-ck-emergency-medicine'], ['ED Pathways', '/pathways']]],
  ['Research', [['All research', '/research'], ['NBME to Step 2', '/research/nbme-to-step-2']]],
];

/** Footer columns. A null href is the App Store link, carrying the page's campaign. */
export const FOOT: [string, [string, string | null][]][] = [
  ['On the wards', [['ABG interpretation', '/wards/abg-interpretation'], ['SOAP note', '/wards/soap-note'], ['Everything on the wards', '/wards']]],
  ['Shelf exams', [['By rotation', '/guides'], ['Internal medicine', '/guides/internal-medicine'], ['Surgery', '/guides/surgery'], ['Pediatrics', '/guides/pediatrics']]],
  ['Step 2', [['Readiness check', '/readiness'], ['Score predictor', '/step-2-score-predictor'], ['Percentiles', '/step-2-ck-percentiles'], ['Score by specialty', '/step-2-score-by-specialty'], ['Study schedule', '/research/dedicated-calendar'], ['Free 120', '/free120'], ['ED study guide', '/step-2-ck-emergency-medicine'], ['ED Pathways', '/pathways']]],
  ['Research', [['All research', '/research'], ['NBME to Step 2', '/research/nbme-to-step-2'], ['Free 120 to Step 2', '/research/free-120-to-step-2'], ['How the check works', '/readiness/methodology']]],
  ['App', [['Step Gunner for iPhone', null], ['Chiefs', '/chiefs'], ['Support', '/support']]],
  ['Legal', [['Privacy', '/privacy'], ['Terms', '/terms']]],
];

/** Which section a route belongs to, for the nav underline. */
export function sectionOf(path: string): Section | undefined {
  if (path.startsWith('/wards')) return 'wards';
  if (path.startsWith('/guides')) return 'shelf';
  if (path.startsWith('/research')) return 'research';
  if (/^\/(readiness|step-2-|pathways)/.test(path)) return 'step2';
  return undefined;
}
