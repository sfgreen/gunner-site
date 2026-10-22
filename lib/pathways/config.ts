// Pathway pages: the launch switch, the world map and the store-slot copy.

/**
 * ED Pathways in the app. False until the app build that carries them (2.3) is
 * LIVE on the App Store. While false, no page promises ED Pathways in the app:
 * every store slot says "Practice the next best step" and sells the Next Best
 * Step drills, which are live today. Flip to true in the same commit that marks
 * the build LIVE; nothing else changes.
 */
export const PATHWAYS_LIVE = false;

/** Hub group order and labels. `guide` is the clerkship guide a pathway in that
 *  world links to (SITE_REDESIGN 2.3, "world to clerkship guide"). */
export const WORLDS: Record<string, { label: string; guide: string }> = {
  cardio: { label: 'Cardiovascular', guide: 'internal-medicine' },
  pulm: { label: 'Pulmonary', guide: 'internal-medicine' },
  neuro: { label: 'Neurology', guide: 'neurology' },
  gi: { label: 'Gastrointestinal', guide: 'internal-medicine' },
  renal: { label: 'Renal and electrolytes', guide: 'internal-medicine' },
  endo: { label: 'Endocrine', guide: 'internal-medicine' },
  id: { label: 'Infectious disease', guide: 'internal-medicine' },
  pharm: { label: 'Toxicology', guide: 'internal-medicine' },
  em: { label: 'Emergency medicine', guide: 'emergency-medicine' },
  surgery: { label: 'Surgery', guide: 'surgery' },
  msk: { label: 'Musculoskeletal', guide: 'emergency-medicine' },
  obgyn: { label: 'Obstetrics', guide: 'obgyn' },
  peds: { label: 'Pediatrics', guide: 'pediatrics' },
  psych: { label: 'Psychiatry', guide: 'psychiatry' },
  ophtho: { label: 'Ophthalmology', guide: 'emergency-medicine' },
  derm: { label: 'Dermatology', guide: 'emergency-medicine' },
};
export const WORLD_ORDER = Object.keys(WORLDS);

export function worldLabel(world: string): string {
  return WORLDS[world]?.label || world;
}

/** Where a store button sits. One value per slot on a page, so GA4 store_click
 *  splits cleanly (SITE_REDESIGN 4: inline, toc, end, case, sticky). */
export type StoreLoc = 'inline' | 'toc' | 'end' | 'case' | 'sticky';

export type SlotCopy = { kicker?: string; heading?: string; body?: string; button: string };

/** Store-slot copy for an article. `count` is the app's pathway count, `term`
 *  what a student would type to find this one, `short` its short name. */
export function articleSlot(loc: StoreLoc, live: boolean, ctx: { count: number; term: string; short: string }): SlotCopy {
  if (!live) {
    switch (loc) {
      case 'inline':
        return {
          kicker: 'Practice the next best step',
          heading: 'Reading an algorithm is not the same as answering one.',
          body: 'Step Gunner drills the next best step case by case, walks each management chain one decision at a time, and brings back the steps you miss until they stick. Free to start.',
          button: 'Get Step Gunner free',
        };
      case 'toc':
        return { heading: 'Practice the next best step', body: 'Chains like this one, as questions, with spaced repetition.', button: 'Get the app' };
      case 'end':
        return {
          kicker: 'Practice the next best step',
          heading: 'On the exam, each of these steps is a vignette with plausible wrong answers.',
          body: 'Step Gunner turns the chain into questions: which step comes next, which drug, which dose, which contraindication.',
          button: 'Get Step Gunner free',
        };
      case 'case':
        return { button: 'Practice the next best step' };
      case 'sticky':
        return { heading: 'Practice the next best step', body: 'Free to start on iPhone', button: 'Get it free' };
    }
  }
  switch (loc) {
    case 'inline':
      return {
        kicker: 'Step Gunner',
        heading: 'On an EM or IM rotation?',
        body: `All ${ctx.count} ED pathways in your pocket, searchable between patients: type ${ctx.term} and land on the fork you are at, with the doses.`,
        button: 'Get Step Gunner free',
      };
    case 'toc':
      return { heading: 'Play it as a patient', body: 'Every fork here is a case in Step Gunner.', button: 'Get the app' };
    case 'end':
      return {
        kicker: 'Step Gunner',
        heading: `${ctx.count} ED pathways. Every dose cited.`,
        body: 'Chest pain to the febrile infant, each one branching, searchable and playable. Free to start.',
        button: 'Get Step Gunner free',
      };
    case 'case':
      return { button: 'Play this patient in the app' };
    case 'sticky':
      return { heading: `${ctx.short}, fork by fork, in Step Gunner`, body: 'Free to start on iPhone', button: 'Get it free' };
  }
  return { button: 'Get Step Gunner free' };
}

/** Store-slot copy for the hub. */
export function hubSlot(loc: 'inline' | 'end' | 'sticky', live: boolean): SlotCopy {
  if (loc === 'inline') {
    return live
      ? { kicker: 'Step Gunner', heading: 'Every pathway here, in your pocket.', body: 'Searchable between patients and playable as cases. Free to start.', button: 'Get Step Gunner free' }
      : {
          kicker: 'Practice the next best step',
          heading: 'Reading an algorithm is not the same as answering one.',
          body: 'Step Gunner drills the next best step case by case and brings back the steps you miss with spaced repetition until they stick. Free to start.',
          button: 'Get Step Gunner free',
        };
  }
  if (loc === 'end') {
    return live
      ? { heading: 'Walk the forks until they are automatic.', body: 'Free to start. The pathways stay free to read here.', button: 'Get Step Gunner free' }
      : { kicker: 'Practice the next best step', heading: 'Drill the next best step until it is automatic.', body: 'Free to start. The pathways stay free to read here.', button: 'Get Step Gunner free' };
  }
  return live
    ? { heading: 'Every ED pathway, in Step Gunner', body: 'Free to start on iPhone', button: 'Get it free' }
    : { heading: 'Practice the next best step', body: 'Free to start on iPhone', button: 'Get it free' };
}
