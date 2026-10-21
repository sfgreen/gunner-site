import WardsPage from '../../components/WardsPage';
import { abgHtml } from '../../lib/wards/render';
import { articleLd } from '../../lib/wards/seo';
import ABG from '../../lib/wards/content/abg_interpretation.json';
import CASES from '../../lib/wards/cases.json';

// ABG interpretation: the interpreter (interpreter_spec, every constant sourced), the
// method, worked cases, and a live Next Best Step case (NBS 1020) word for word from
// the app. Content: lib/wards/content/abg_interpretation.json; case: scripts/sync_wards_cases.py.
const PATH = '/wards/abg-interpretation';
const html = abgHtml(ABG, CASES);

export default function AbgInterpretation() {
  return (
    <WardsPage
      page="abg"
      html={html}
      mountOpts={{ abg: ABG, content: ABG }}
      head={{ title: `${ABG.seo_title} | Step Gunner`.length > 65 ? ABG.seo_title : `${ABG.seo_title} | Step Gunner`, description: ABG.meta_description, path: PATH, jsonLd: articleLd(ABG, PATH, 'ABG interpretation') }}
    />
  );
}
