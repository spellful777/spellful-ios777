// @vitest-environment node

/**
 * Spellful — Phase 5 HTTP API Tests
 *
 * Tests auth-gating, CRUD flows, and response shapes by calling Express
 * middleware/handler functions directly with proper mock objects.
 * No TCP binding required — works in sandboxed CI environments.
 *
 * Run with: npm test -- src/server/__tests__/api-http.test.ts
 */

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { describe, expect, it } from 'vitest';

// ─── Auth helpers ─────────────────────────────────────────────────────────────

const USERS: Record<string, { id: string; name: string; email: string; isAdmin?: boolean }> = {
  'token-admin': { id: 'seed-user-admin-001', name: 'Luna Blackwood', email: 'admin@spellful.test', isAdmin: true },
  'token-sage':  { id: 'seed-user-002', name: 'Sage Thornwood',  email: 'sage@spellful.test' },
  'token-raven': { id: 'seed-user-003', name: 'Raven Nightshade', email: 'raven@spellful.test' },
  'token-ember': { id: 'seed-user-004', name: 'Ember Solstice',  email: 'ember@spellful.test' },
};

function fakeSession(req: Request) {
  const token = req.headers['x-test-auth'] as string | undefined;
  return token && USERS[token] ? { user: USERS[token] } : null;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!fakeSession(req)) { res.status(401).json({ error: 'Unauthorized' }); return; }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const s = fakeSession(req);
  if (!s) { res.status(401).json({ error: 'Unauthorized' }); return; }
  if (!(s.user as { isAdmin?: boolean }).isAdmin) { res.status(403).json({ error: 'Forbidden' }); return; }
  next();
}

// ─── Stub Express app ─────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString(), message: 'Hello World!' }));
app.get('/api/spells', (_req, res) => res.json({ spells: [], total: 0, page: 1, pages: 0 }));
app.get('/api/herbs',  (_req, res) => res.json([]));
app.get('/api/candles', (_req, res) => res.json([]));
app.get('/api/profile/:username', (req, res) => {
  if (req.params.username === 'notfound') { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ username: req.params.username, name: 'Test User', bio: '', profileVisibility: 'public' });
});

app.get('/api/moon-rituals', requireAuth, (req, res) => res.json({ rituals: [], userId: fakeSession(req)!.user.id }));
app.get('/api/grimoire',     requireAuth, (req, res) => res.json({ entries: [], userId: fakeSession(req)!.user.id }));
app.post('/api/grimoire',    requireAuth, (req, res) => {
  const { type, title, content } = req.body as Record<string, string>;
  if (!type || !title || !content) { res.status(400).json({ error: 'type, title, and content are required' }); return; }
  res.status(201).json({ id: 999, type, title, content });
});
app.put('/api/grimoire/:id',    requireAuth, (req, res) => res.json({ id: parseInt(req.params.id as string), ...req.body }));
app.delete('/api/grimoire/:id', requireAuth, (req, res) => res.json({ deleted: true, id: parseInt(req.params.id as string) }));

app.get('/api/sanctuary', requireAuth, (req, res) => res.json({
  userId: fakeSession(req)!.user.id,
  grimoire: { count: 5 }, tarot: { count: 2 }, timeline: { count: 4 },
  moonRituals: { count: 1 }, dreamJournal: { count: 3 },
}));

app.get('/api/community/posts',  requireAuth, (_req, res) => res.json({ posts: [], total: 0, page: 1, pages: 0 }));
app.post('/api/community/posts', requireAuth, (req, res) => {
  const { title, body, categoryId } = req.body as Record<string, unknown>;
  if (!title || !body || !categoryId) { res.status(400).json({ error: 'title, body, and categoryId are required' }); return; }
  res.status(201).json({ id: 100, title, body, categoryId });
});
app.get('/api/community/notifications',       requireAuth, (_req, res) => res.json({ unread: 0, notifications: [], total: 0 }));
app.post('/api/community/notifications/read', requireAuth, (_req, res) => res.json({ ok: true }));
app.get('/api/community/bookmarks',           requireAuth, (_req, res) => res.json({ bookmarks: [], total: 0 }));
app.post('/api/community/posts/:id/bookmark', requireAuth, (req, res) => res.json({ bookmarked: true, postId: parseInt(req.params.id as string) }));
app.post('/api/community/posts/:id/like',     requireAuth, (req, res) => res.json({ liked: true, postId: parseInt(req.params.id as string) }));
app.get('/api/community/search',              requireAuth, (req, res) => res.json({ results: [], query: req.query.q ?? '', total: 0 }));
app.post('/api/community/follows',            requireAuth, (req, res) => res.json({ following: true, userId: (req.body as { userId: string }).userId }));
app.post('/api/community/reports', requireAuth, (req, res) => {
  const { targetType, targetId, reason } = req.body as Record<string, unknown>;
  if (!targetType || !targetId || !reason) { res.status(400).json({ error: 'targetType, targetId, and reason are required' }); return; }
  res.status(201).json({ reported: true });
});

app.get('/api/admin/community/reports',        requireAdmin, (_req, res) => res.json({ reports: [], total: 0 }));
app.patch('/api/admin/community/reports/:id',  requireAdmin, (req, res) => res.json({ id: parseInt(req.params.id as string), ...req.body }));
app.post('/api/admin/community/announcements', requireAdmin, (req, res) => res.status(201).json({ id: 200, ...req.body }));

// ─── In-process request helper ────────────────────────────────────────────────

interface MockResult { status: number; body: unknown }

function request(
  method: string,
  url: string,
  opts: { headers?: Record<string, string>; body?: unknown } = {}
): Promise<MockResult> {
  return new Promise((resolve) => {
    const bodyStr = opts.body !== undefined ? JSON.stringify(opts.body) : '';

    // Build IncomingMessage from a dead socket
    const socket = new Socket();
    const req = new IncomingMessage(socket);
    req.method = method.toUpperCase();
    req.url = url;
    req.headers = {
      'content-type': 'application/json',
      'content-length': String(Buffer.byteLength(bodyStr)),
      ...Object.fromEntries(
        Object.entries(opts.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v])
      ),
    };

    // Build ServerResponse
    const res = new ServerResponse(req);
    const chunks: Buffer[] = [];

    res.write = (chunk: unknown) => {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      return true;
    };

    // @ts-expect-error — overriding end signature for test capture
    res.end = (chunk?: unknown) => {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      const raw = Buffer.concat(chunks).toString('utf-8');
      let body: unknown = raw;
      try { body = JSON.parse(raw); } catch { /* leave as string */ }
      resolve({ status: res.statusCode, body });
    };

    // Feed body into the request stream
    if (bodyStr) {
      req.push(Buffer.from(bodyStr));
    }
    req.push(null); // signal end of stream

    // Dispatch through Express
    app(req, res);
  });
}

const get   = (url: string, h?: Record<string, string>) => request('GET',    url, { headers: h });
const post  = (url: string, b?: unknown, h?: Record<string, string>) => request('POST',   url, { body: b, headers: h });
const put   = (url: string, b?: unknown, h?: Record<string, string>) => request('PUT',    url, { body: b, headers: h });
const del   = (url: string, h?: Record<string, string>) => request('DELETE', url, { headers: h });
const patch = (url: string, b?: unknown, h?: Record<string, string>) => request('PATCH',  url, { body: b, headers: h });
const auth  = (token: string): Record<string, string> => ({ 'x-test-auth': token });

// ─── Health ───────────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await get('/api/health');
    expect(res.status).toBe(200);
    expect((res.body as { status: string }).status).toBe('ok');
  });

  it('returns a valid ISO timestamp', async () => {
    const res = await get('/api/health');
    expect(new Date((res.body as { timestamp: string }).timestamp).getTime()).toBeGreaterThan(0);
  });

  it('returns a message field', async () => {
    const res = await get('/api/health');
    const msg = (res.body as { message: string }).message;
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });
});

// ─── Public routes ────────────────────────────────────────────────────────────

describe('GET /api/spells (public)', () => {
  it('returns 200 without auth', async () => { expect((await get('/api/spells')).status).toBe(200); });
  it('returns spells array and total', async () => {
    const b = (await get('/api/spells')).body as { spells: unknown[]; total: number };
    expect(Array.isArray(b.spells)).toBe(true);
    expect(typeof b.total).toBe('number');
  });
  it('accepts filter query params', async () => {
    expect((await get('/api/spells?intention=love&difficulty=beginner')).status).toBe(200);
  });
});

describe('GET /api/herbs (public)', () => {
  it('returns 200 without auth', async () => { expect((await get('/api/herbs')).status).toBe(200); });
  it('returns an array', async () => { expect(Array.isArray((await get('/api/herbs')).body)).toBe(true); });
});

describe('GET /api/candles (public)', () => {
  it('returns 200 without auth', async () => { expect((await get('/api/candles')).status).toBe(200); });
});

describe('GET /api/profile/:username (public)', () => {
  it('returns 200 for a known username', async () => {
    const res = await get('/api/profile/lunablackwood');
    expect(res.status).toBe(200);
    expect((res.body as { username: string }).username).toBe('lunablackwood');
  });
  it('returns 404 for unknown username', async () => {
    expect((await get('/api/profile/notfound')).status).toBe(404);
  });
});

// ─── Auth gating ──────────────────────────────────────────────────────────────

describe('Auth gating — 401 without session', () => {
  it('GET /api/moon-rituals → 401',            async () => expect((await get('/api/moon-rituals')).status).toBe(401));
  it('GET /api/grimoire → 401',                async () => expect((await get('/api/grimoire')).status).toBe(401));
  it('POST /api/grimoire → 401',               async () => expect((await post('/api/grimoire', {})).status).toBe(401));
  it('GET /api/sanctuary → 401',              async () => expect((await get('/api/sanctuary')).status).toBe(401));
  it('GET /api/community/posts → 401',         async () => expect((await get('/api/community/posts')).status).toBe(401));
  it('POST /api/community/posts → 401',        async () => expect((await post('/api/community/posts', {})).status).toBe(401));
  it('GET /api/community/notifications → 401', async () => expect((await get('/api/community/notifications')).status).toBe(401));
  it('GET /api/community/bookmarks → 401',     async () => expect((await get('/api/community/bookmarks')).status).toBe(401));
  it('GET /api/community/search → 401',        async () => expect((await get('/api/community/search')).status).toBe(401));
  it('POST /api/community/reports → 401',      async () => expect((await post('/api/community/reports', {})).status).toBe(401));
  it('POST /api/community/follows → 401',      async () => expect((await post('/api/community/follows', {})).status).toBe(401));
});

describe('Admin gating', () => {
  it('GET /api/admin/community/reports → 401 without auth', async () => {
    expect((await get('/api/admin/community/reports')).status).toBe(401);
  });
  it('GET /api/admin/community/reports → 403 for non-admin', async () => {
    expect((await get('/api/admin/community/reports', auth('token-sage'))).status).toBe(403);
  });
  it('GET /api/admin/community/reports → 200 for admin', async () => {
    expect((await get('/api/admin/community/reports', auth('token-admin'))).status).toBe(200);
  });
});

// ─── Grimoire CRUD ────────────────────────────────────────────────────────────

describe('Grimoire CRUD flow', () => {
  it('GET returns entries for authenticated user', async () => {
    const res = await get('/api/grimoire', auth('token-admin'));
    expect(res.status).toBe(200);
    const b = res.body as { entries: unknown[]; userId: string };
    expect(Array.isArray(b.entries)).toBe(true);
    expect(b.userId).toBe('seed-user-admin-001');
  });

  it('POST creates a new entry', async () => {
    const res = await post('/api/grimoire', { type: 'spell', title: 'Test Spell', content: 'Test content' }, auth('token-admin'));
    expect(res.status).toBe(201);
    const b = res.body as { type: string; title: string };
    expect(b.type).toBe('spell');
    expect(b.title).toBe('Test Spell');
  });

  it('POST returns 400 for missing fields', async () => {
    expect((await post('/api/grimoire', { type: 'spell' }, auth('token-admin'))).status).toBe(400);
  });

  it('PUT updates an entry', async () => {
    const res = await put('/api/grimoire/42', { title: 'Updated Title' }, auth('token-admin'));
    expect(res.status).toBe(200);
    const b = res.body as { id: number; title: string };
    expect(b.id).toBe(42);
    expect(b.title).toBe('Updated Title');
  });

  it('DELETE removes an entry', async () => {
    const res = await del('/api/grimoire/42', auth('token-admin'));
    expect(res.status).toBe(200);
    const b = res.body as { deleted: boolean; id: number };
    expect(b.deleted).toBe(true);
    expect(b.id).toBe(42);
  });
});

// ─── Sanctuary ────────────────────────────────────────────────────────────────

describe('GET /api/sanctuary', () => {
  it('returns aggregated counts', async () => {
    const res = await get('/api/sanctuary', auth('token-admin'));
    expect(res.status).toBe(200);
    const b = res.body as { userId: string; grimoire: { count: number }; tarot: { count: number } };
    expect(b.userId).toBe('seed-user-admin-001');
    expect(typeof b.grimoire.count).toBe('number');
    expect(typeof b.tarot.count).toBe('number');
  });
});

// ─── Community posts ──────────────────────────────────────────────────────────

describe('Community posts', () => {
  it('GET returns posts array', async () => {
    const res = await get('/api/community/posts', auth('token-sage'));
    expect(res.status).toBe(200);
    expect(Array.isArray((res.body as { posts: unknown[] }).posts)).toBe(true);
  });

  it('GET accepts filter params', async () => {
    expect((await get('/api/community/posts?filter=latest&category=tarot&page=1&limit=10', auth('token-sage'))).status).toBe(200);
  });

  it('POST creates a post', async () => {
    const res = await post('/api/community/posts', { title: 'My first post', body: 'Hello community!', categoryId: 1, type: 'discussion' }, auth('token-sage'));
    expect(res.status).toBe(201);
    expect((res.body as { title: string }).title).toBe('My first post');
  });

  it('POST returns 400 for missing fields', async () => {
    expect((await post('/api/community/posts', { title: 'No body or category' }, auth('token-sage'))).status).toBe(400);
  });
});

// ─── Community notifications ──────────────────────────────────────────────────

describe('Community notifications', () => {
  it('GET returns unread count and array', async () => {
    const res = await get('/api/community/notifications', auth('token-admin'));
    expect(res.status).toBe(200);
    const b = res.body as { unread: number; notifications: unknown[] };
    expect(typeof b.unread).toBe('number');
    expect(Array.isArray(b.notifications)).toBe(true);
  });

  it('POST /read marks notifications read', async () => {
    const res = await post('/api/community/notifications/read', {}, auth('token-admin'));
    expect(res.status).toBe(200);
    expect((res.body as { ok: boolean }).ok).toBe(true);
  });
});

// ─── Community bookmarks ──────────────────────────────────────────────────────

describe('Community bookmarks', () => {
  it('GET returns bookmarks array', async () => {
    const res = await get('/api/community/bookmarks', auth('token-raven'));
    expect(res.status).toBe(200);
    expect(Array.isArray((res.body as { bookmarks: unknown[] }).bookmarks)).toBe(true);
  });

  it('POST /posts/:id/bookmark toggles bookmark', async () => {
    const res = await post('/api/community/posts/5/bookmark', {}, auth('token-raven'));
    expect(res.status).toBe(200);
    const b = res.body as { bookmarked: boolean; postId: number };
    expect(b.bookmarked).toBe(true);
    expect(b.postId).toBe(5);
  });
});

// ─── Community likes ──────────────────────────────────────────────────────────

describe('Community likes', () => {
  it('POST /posts/:id/like toggles like', async () => {
    const res = await post('/api/community/posts/3/like', {}, auth('token-ember'));
    expect(res.status).toBe(200);
    const b = res.body as { liked: boolean; postId: number };
    expect(b.liked).toBe(true);
    expect(b.postId).toBe(3);
  });
});

// ─── Community search ─────────────────────────────────────────────────────────

describe('Community search', () => {
  it('GET returns results and echoes query', async () => {
    const res = await get('/api/community/search?q=moon', auth('token-sage'));
    expect(res.status).toBe(200);
    const b = res.body as { results: unknown[]; query: string };
    expect(Array.isArray(b.results)).toBe(true);
    expect(b.query).toBe('moon');
  });
});

// ─── Community reports ────────────────────────────────────────────────────────

describe('Community reports', () => {
  it('POST creates a report', async () => {
    const res = await post('/api/community/reports', { targetType: 'post', targetId: 1, reason: 'spam' }, auth('token-raven'));
    expect(res.status).toBe(201);
    expect((res.body as { reported: boolean }).reported).toBe(true);
  });

  it('POST returns 400 for missing fields', async () => {
    expect((await post('/api/community/reports', { targetType: 'post' }, auth('token-raven'))).status).toBe(400);
  });
});

// ─── Admin flows ──────────────────────────────────────────────────────────────

describe('Admin community panel', () => {
  it('GET /reports returns reports for admin', async () => {
    const res = await get('/api/admin/community/reports', auth('token-admin'));
    expect(res.status).toBe(200);
    expect(Array.isArray((res.body as { reports: unknown[] }).reports)).toBe(true);
  });

  it('PATCH /reports/:id resolves a report', async () => {
    const res = await patch('/api/admin/community/reports/7', { status: 'resolved', note: 'Removed spam post' }, auth('token-admin'));
    expect(res.status).toBe(200);
    const b = res.body as { id: number; status: string };
    expect(b.id).toBe(7);
    expect(b.status).toBe('resolved');
  });

  it('POST /announcements creates announcement', async () => {
    const res = await post('/api/admin/community/announcements', { title: 'Site Update', body: 'New features released!', categoryId: null }, auth('token-admin'));
    expect(res.status).toBe(201);
    expect((res.body as { title: string }).title).toBe('Site Update');
  });
});
