/**
 * Server-side session helper for protected API routes.
 * Uses BetterAuth's api.getSession to validate the session cookie.
 */
import type { Request } from 'express';
import { getAuth } from '../../lib/auth/auth.js';
import { toWebRequest } from '../../lib/auth/express-adapter.js';

export async function getAuthSession(req: Request) {
  try {
    const auth = getAuth();
    const webReq = toWebRequest(req);
    const session = await auth.api.getSession({ headers: webReq.headers });
    return session ?? null;
  } catch {
    return null;
  }
}
