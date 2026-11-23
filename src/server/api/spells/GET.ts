import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { spells } from '../../db/schema.js';
import { eq, and, like, or, desc, asc, sql } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  const {
    search,
    intention,
    difficulty,
    moonPhase,
    minDuration,
    maxDuration,
    sort = 'newest',
    page = '1',
    limit = '12',
    featured,
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [eq(spells.status, 'approved')];

  if (intention) conditions.push(eq(spells.intention, intention));
  if (difficulty) conditions.push(eq(spells.difficulty, difficulty));
  if (moonPhase) conditions.push(eq(spells.moonPhase, moonPhase));
  if (featured === 'true') conditions.push(eq(spells.isFeatured, true));
  if (minDuration) conditions.push(sql`${spells.durationMinutes} >= ${parseInt(minDuration, 10)}`);
  if (maxDuration) conditions.push(sql`${spells.durationMinutes} <= ${parseInt(maxDuration, 10)}`);

  if (search) {
    const term = `%${search}%`;
    conditions.push(
      or(
        like(spells.title, term),
        like(spells.subtitle, term),
        like(spells.purpose, term),
      )!
    );
  }

  const where = and(...conditions);

  let orderBy;
  switch (sort) {
    case 'most_saved':
      orderBy = desc(spells.saveCount);
      break;
    case 'highest_rated':
      orderBy = desc(sql`CASE WHEN ${spells.ratingCount} = 0 THEN 0 ELSE ${spells.ratingSum} / ${spells.ratingCount} END`);
      break;
    case 'oldest':
      orderBy = asc(spells.createdAt);
      break;
    case 'newest':
    default:
      orderBy = desc(spells.createdAt);
  }

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: spells.id,
        slug: spells.slug,
        title: spells.title,
        subtitle: spells.subtitle,
        intention: spells.intention,
        difficulty: spells.difficulty,
        durationMinutes: spells.durationMinutes,
        moonPhase: spells.moonPhase,
        materials: spells.materials,
        herbCorrespondences: spells.herbCorrespondences,
        crystalCorrespondences: spells.crystalCorrespondences,
        isFeatured: spells.isFeatured,
        saveCount: spells.saveCount,
        ratingCount: spells.ratingCount,
        ratingSum: spells.ratingSum,
        createdAt: spells.createdAt,
      })
      .from(spells)
      .where(where)
      .orderBy(orderBy)
      .limit(limitNum)
      .offset(offset),
    db.$count(spells, where),
  ]);

  const total = countResult ?? 0;

  res.json({
    spells: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
}
