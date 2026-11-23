import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { user } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { getEntitlement } from '@/server/lib/plus-entitlement.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export default async function handler(req: Request, res: Response): Promise<void> {
  const session = await getAuthSession(req);
  if (!session) { res.status(401).json({ error: 'Unauthorized' }); return; }

  // Custom avatar upload is a Spellful Plus feature
  const ent = await getEntitlement(session.user.id);
  if (!ent.isPlus) {
    res.status(403).json({ error: 'Custom avatar upload requires Spellful Plus.', code: 'PLUS_REQUIRED' });
    return;
  }

  // Express with urlencoded/json middleware doesn't parse multipart.
  // We read the raw body manually from the stream.
  const contentType = req.headers['content-type'] ?? '';
  if (!contentType.startsWith('multipart/form-data')) {
    res.status(400).json({ error: 'Expected multipart/form-data' });
    return;
  }

  // Use busboy for multipart parsing
  const busboy = (await import('busboy')).default;
  const bb = busboy({ headers: req.headers as Record<string, string | string[]>, limits: { fileSize: MAX_SIZE, files: 1 } });

  let saved = false;

  bb.on('file', (_field: string, file: NodeJS.ReadableStream & { on(event: 'data', cb: (chunk: Buffer) => void): void; on(event: 'end', cb: () => void): void; on(event: 'limit', cb: () => void): void; resume(): void }, info: { mimeType: string }) => {
    const { mimeType } = info;
    if (!ALLOWED_TYPES.includes(mimeType)) {
      file.resume();
      res.status(400).json({ error: 'Invalid file type. Use JPEG, PNG, WebP, or GIF.' });
      return;
    }

    const chunks: Buffer[] = [];
    file.on('data', (chunk: Buffer) => chunks.push(chunk));
    file.on('limit', () => {
      res.status(413).json({ error: 'File too large. Maximum 5 MB.' });
    });
    file.on('end', async () => {
      if (res.headersSent) return;
      const buffer = Buffer.concat(chunks);
      const ext = mimeType === 'image/jpeg' ? '.jpg' : mimeType === 'image/png' ? '.png' : mimeType === 'image/webp' ? '.webp' : '.gif';
      const filename = randomUUID() + ext;
      const uploadDir = '/shared-storage/public/assets/uploads/avatars';
      await mkdir(uploadDir, { recursive: true });
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      await writeFile(join(uploadDir, filename), buffer); // safe: filename is a UUID from randomUUID()
      const url = '/airo-assets/uploads/avatars/' + filename;

      // Update user record
      await db!.update(user).set({ image: url }).where(eq(user.id, session.user.id));
      saved = true;
      res.json({ url });
    });
  });

  bb.on('finish', () => {
    if (!saved && !res.headersSent) {
      res.status(400).json({ error: 'No file received' });
    }
  });

  bb.on('error', (err: Error) => {
    if (!res.headersSent) res.status(500).json({ error: err.message });
  });

  req.pipe(bb);
}
