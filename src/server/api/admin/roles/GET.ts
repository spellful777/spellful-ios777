/**
 * GET /api/admin/roles
 * Returns a paginated list of members with their platform role and account type.
 * Requires: admin or owner role.
 * Query: ?q=username&role=admin&limit=25&offset=0
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { user } from '@/server/db/schema.js';
import { eq, sql, or } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { hasRole } from '@/server/lib/require-role.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id || !hasRole(session as { user?: Record<string, unknown> }, 'admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const roleFilter = typeof req.query.role === 'string' ? req.query.role : '';
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const offset = Number(req.query.offset) || 0;

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      image: user.image,
      platformRole: user.platformRole,
      accountType: user.accountType,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(
      q
        ? or(
            sql`${user.username} LIKE ${'%' + q + '%'}`,
            sql`${user.name} LIKE ${'%' + q + '%'}`,
            sql`${user.email} LIKE ${'%' + q + '%'}`,
          )
        : roleFilter
          ? eq(user.platformRole, roleFilter)
          : sql`1=1`
    )
    .orderBy(user.createdAt)
    .limit(limit + 1)
    .offset(offset);

  const hasMore = rows.length > limit;
  return res.json({ members: rows.slice(0, limit), hasMore });
}
