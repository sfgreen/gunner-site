import { useWebAccount, api } from '../lib/webAccount';
import StudyDesk from '../components/study/StudyDesk';

// stepgunner.com/study: the study desk (gunner repo, decision 0082). The desk itself is
// components/study/StudyDesk.tsx; this page hands it the student's account and the API.
export default function Study() {
  const account = useWebAccount();
  return <StudyDesk account={account} call={api} />;
}
