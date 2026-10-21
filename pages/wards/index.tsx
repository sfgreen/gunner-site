import WardsPage from '../../components/WardsPage';
import { hubHtml } from '../../lib/wards/render';
import { crumbsLd } from '../../lib/wards/seo';

// The wards hub: every page students reach for between patients, grouped by the moment
// they need it. Live pages link; planned ones are listed as Coming and never link.
// The list lives in lib/wards/site.json (a page goes live when it gets an href).
const html = hubHtml();

export default function Wards() {
  return (
    <WardsPage
      page="wards"
      html={html}
      head={{
        title: 'On the wards: ABG, SOAP note and lab templates | Step Gunner',
        description: 'Templates, lab reads and bedside math for the clerkship year: an ABG interpreter, a SOAP note template with a filled example, and the Step 2 angle on each.',
        path: '/wards',
        jsonLd: [crumbsLd([['Home', '/'], ['On the wards', '/wards']])],
      }}
    />
  );
}
