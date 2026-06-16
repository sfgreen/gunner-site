import type { NextApiRequest, NextApiResponse } from 'next';

// DEPRECATED 2026-06-15. Referral redemption moved to the `redeem_referral`
// Firebase callable, which grants weekly-leaderboard XP (250 each side) instead
// of a free month of Pro. This endpoint used to write `proGrantExpiresAt`; it is
// now an inert 410 stub so it can never mint another Pro grant, while any old
// client that still pings it gets a clear "update the app" signal (not a 404).
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).json({
    error: 'This referral endpoint has been retired. Update Step Gunner to the latest version to redeem a code.',
  });
}
