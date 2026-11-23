import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { user } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';

const ALLOWED_DEFAULT_AVATARS = new Set([
  '/airo-assets/images/avatars/default-hat-black',
  '/airo-assets/images/avatars/default-hat-orange',
  '/airo-assets/images/avatars/default-hat-red',
  '/airo-assets/images/avatars/default-hat-blue',
  '/airo-assets/images/avatars/default-hat-green',
  '/airo-assets/images/avatars/default-hat-purple',
  '/airo-assets/images/avatars/default-hat-rainbow',
  '/airo-assets/images/avatars/default-hat-lesbian',
  '/airo-assets/images/avatars/default-hat-trans',
]);

export default async function handler(req: Request, res: Response): Promise<void> {
  const session = await getAuthSession(req);
  if (!session?.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const { url } = req.body as { url?: string };
  if (!url || !ALLOWED_DEFAULT_AVATARS.has(url)) {
    res.status(400).json({ error: 'Invalid avatar selection.' });
    return;
  }

  await db.update(user).set({ image: url }).where(eq(user.id, session.user.id));
  res.json({ url });
}
