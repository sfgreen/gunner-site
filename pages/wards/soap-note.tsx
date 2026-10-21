import WardsPage from '../../components/WardsPage';
import { soapHtml } from '../../lib/wards/render';
import { articleLd } from '../../lib/wards/seo';
import SOAP from '../../lib/wards/content/soap_note.json';
import CASES from '../../lib/wards/cases.json';

// How to write a SOAP note: copy-ready progress note and H&P templates, a sourced day-2
// DKA example, the one-liner builder, and a live Next Best Step case (NBS 1021) word
// for word from the app. Content: lib/wards/content/soap_note.json.
const PATH = '/wards/soap-note';
const html = soapHtml(SOAP, CASES);

export default function SoapNote() {
  return (
    <WardsPage
      page="soap"
      html={html}
      mountOpts={{ soap: SOAP, content: SOAP }}
      head={{ title: `${SOAP.seo_title} | Step Gunner`.length > 65 ? SOAP.seo_title : `${SOAP.seo_title} | Step Gunner`, description: SOAP.meta_description, path: PATH, jsonLd: articleLd(SOAP, PATH, 'SOAP note') }}
    />
  );
}
