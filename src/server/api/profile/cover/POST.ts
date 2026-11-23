import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { user } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { getEntitlement } from '@/server/lib/plus-entitlement.js';
import busboy from 'busboy';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = '/shared-storage/public/assets/uploads/covers';
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export default async function handler(req: Request, res: Response) {
  try {
    if (!db) return res.status(503).json({ error: 'Database unavailable' });
    const session = await getAuthSession(req);
    if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const userId = session.user.id;

    // Custom cover photo upload is a Spellful Plus feature
    const ent = await getEntitlement(userId);
    if (!ent.isPlus) {
      return res.status(403).json({ error: 'Custom cover photo requires Spellful Plus.', code: 'PLUS_REQUIRED' });
    }

    await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });

    const bb = busboy({ headers: req.headers, limits: { fileSize: MAX_SIZE, files: 1 } });
    let savedUrl: string | null = null;
    let sizeError = false;

    bb.on('file', (_field, file, info) => {
      const { mimeType } = info;
      if (!ALLOWED.has(mimeType)) { file.resume(); return; }
      const ext = mimeType.split('/')[1].replace('jpeg', 'jpg');
      // Sanitize: ext and userId are server-controlled; guard against any unexpected traversal
      const safeExt = ext.replace(/[^a-z0-9]/g, '');
      const safeUserId = userId.replace(/[^a-zA-Z0-9]/g, '');
      const filename = `cover-${safeUserId}-${Date.now()}.${safeExt}`;
      const filepath = path.resolve(UPLOAD_DIR, filename);
      // Ensure resolved path stays within the upload directory
      if (!filepath.startsWith(UPLOAD_DIR + path.sep) && filepath !== UPLOAD_DIR) {
        file.resume();
        return;
      }
      const ws = fs.createWriteStream(filepath);
      file.on('limit', () => { sizeError = true; ws.destroy(); fs.unlink(filepath, () => undefined); });
      file.pipe(ws);
      savedUrl = `/airo-assets/uploads/covers/${filename}`;
    });

    bb.on('finish', async () => {
      if (sizeError) return res.status(413).json({ error: 'File too large (max 5 MB)' });
      if (!savedUrl) return res.status(400).json({ error: 'No valid image uploaded' });
      await db.update(user).set({ coverImage: savedUrl }).where(eq(user.id, userId));
      res.json({ ok: true, url: savedUrl });
    });

    bb.on('error', () => res.status(500).json({ error: 'Upload failed' }));
    req.pipe(bb);
  } catch (err) {
    console.error(JSON.stringify({ event: 'profile.cover.error', msg: String(err).slice(0, 120) }));
    res.status(500).json({ error: 'Upload failed' });
  }
}
