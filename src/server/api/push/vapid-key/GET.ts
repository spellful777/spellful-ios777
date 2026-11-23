import type { Request, Response } from 'express';
import { getSecret } from '#airo/secrets';

export default function handler(_req: Request, res: Response): void {
  const publicKey = getSecret('VAPID_PUBLIC_KEY');
  if (!publicKey) {
    res.status(503).json({ error: 'Push not configured' });
    return;
  }
  res.json({ publicKey });
}
