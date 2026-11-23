/**
 * Migration: create all Spellful Community tables and seed the 8 categories.
 * Safe to re-run — every CREATE uses IF NOT EXISTS.
 */
import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const configPath = join(process.env.NOMAD_TASK_DIR || '/local', 'config.json');
// eslint-disable-next-line security/detect-non-literal-fs-filename
const cfg = JSON.parse(readFileSync(configPath, 'utf-8')).DATABASE.VALUE; // safe: platform-controlled path

const conn = await createConnection({
  host: cfg.HOST, user: cfg.USERNAME, password: cfg.PASSWORD,
  database: cfg.NAME, port: parseInt(cfg.PORT),
  ssl: { rejectUnauthorized: false },
  multipleStatements: true,
});

const run = async (label, sql) => {
  try { await conn.execute(sql); console.log('OK:', label); }
  catch (e) { console.log('ERR:', label, (e.message || String(e)).slice(0, 120)); }
};

// ── Categories ────────────────────────────────────────────────────────────────
await run('community_categories', `
  CREATE TABLE IF NOT EXISTS community_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// ── Posts ─────────────────────────────────────────────────────────────────────
await run('community_posts', `
  CREATE TABLE IF NOT EXISTS community_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    category_id INT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'discussion',
    title VARCHAR(300) NOT NULL,
    body LONGTEXT NOT NULL,
    image_url TEXT,
    tags VARCHAR(500) DEFAULT '',
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    accepted_reply_id INT,
    like_count INT DEFAULT 0,
    reply_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES community_categories(id) ON DELETE CASCADE,
    INDEX idx_category (category_id),
    INDEX idx_user (user_id),
    INDEX idx_created (created_at),
    INDEX idx_type (type)
  )
`);

// ── Replies ───────────────────────────────────────────────────────────────────
await run('community_replies', `
  CREATE TABLE IF NOT EXISTS community_replies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    parent_id INT,
    body LONGTEXT NOT NULL,
    is_hidden BOOLEAN DEFAULT FALSE,
    like_count INT DEFAULT 0,
    depth INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES community_replies(id) ON DELETE SET NULL,
    INDEX idx_post (post_id),
    INDEX idx_user (user_id),
    INDEX idx_parent (parent_id)
  )
`);

// ── Likes ─────────────────────────────────────────────────────────────────────
await run('community_likes', `
  CREATE TABLE IF NOT EXISTS community_likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    target_type VARCHAR(10) NOT NULL,
    target_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_like (user_id, target_type, target_id),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    INDEX idx_target (target_type, target_id)
  )
`);

// ── Bookmarks ─────────────────────────────────────────────────────────────────
await run('community_bookmarks', `
  CREATE TABLE IF NOT EXISTS community_bookmarks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    post_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_bookmark (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
  )
`);

// ── Follows ───────────────────────────────────────────────────────────────────
await run('community_follows', `
  CREATE TABLE IF NOT EXISTS community_follows (
    id INT PRIMARY KEY AUTO_INCREMENT,
    follower_id VARCHAR(36) NOT NULL,
    following_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_follow (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES user(id) ON DELETE CASCADE,
    INDEX idx_follower (follower_id),
    INDEX idx_following (following_id)
  )
`);

// ── Blocks ────────────────────────────────────────────────────────────────────
await run('community_blocks', `
  CREATE TABLE IF NOT EXISTS community_blocks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    blocker_id VARCHAR(36) NOT NULL,
    blocked_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_block (blocker_id, blocked_id),
    FOREIGN KEY (blocker_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_id) REFERENCES user(id) ON DELETE CASCADE,
    INDEX idx_blocker (blocker_id)
  )
`);

// ── Polls ─────────────────────────────────────────────────────────────────────
await run('community_polls', `
  CREATE TABLE IF NOT EXISTS community_polls (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL UNIQUE,
    question VARCHAR(500) NOT NULL,
    choices JSON NOT NULL,
    closes_at TIMESTAMP NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
  )
`);

await run('community_poll_votes', `
  CREATE TABLE IF NOT EXISTS community_poll_votes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    poll_id INT NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    choice_index INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_vote (poll_id, user_id),
    FOREIGN KEY (poll_id) REFERENCES community_polls(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  )
`);

// ── Reports ───────────────────────────────────────────────────────────────────
await run('community_reports', `
  CREATE TABLE IF NOT EXISTS community_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reporter_id VARCHAR(36) NOT NULL,
    target_type VARCHAR(10) NOT NULL,
    target_id INT NOT NULL,
    reason VARCHAR(100) NOT NULL,
    details TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    resolved_by VARCHAR(36),
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES user(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_target (target_type, target_id)
  )
`);

// ── Moderation actions ────────────────────────────────────────────────────────
await run('community_mod_actions', `
  CREATE TABLE IF NOT EXISTS community_mod_actions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    mod_id VARCHAR(36) NOT NULL,
    target_type VARCHAR(20) NOT NULL,
    target_id VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mod_id) REFERENCES user(id) ON DELETE CASCADE,
    INDEX idx_mod (mod_id),
    INDEX idx_target (target_type, target_id)
  )
`);

// ── Badges ────────────────────────────────────────────────────────────────────
await run('community_badges', `
  CREATE TABLE IF NOT EXISTS community_badges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

await run('community_user_badges', `
  CREATE TABLE IF NOT EXISTS community_user_badges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    badge_id INT NOT NULL,
    is_hidden BOOLEAN DEFAULT FALSE,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_badge (user_id, badge_id),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES community_badges(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
  )
`);

// ── Notifications ─────────────────────────────────────────────────────────────
await run('community_notifications', `
  CREATE TABLE IF NOT EXISTS community_notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    actor_id VARCHAR(36),
    post_id INT,
    reply_id INT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    INDEX idx_user_unread (user_id, is_read),
    INDEX idx_created (created_at)
  )
`);

// ── Thread mutes ──────────────────────────────────────────────────────────────
await run('community_mutes', `
  CREATE TABLE IF NOT EXISTS community_mutes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    post_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_mute (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
  )
`);

// ── Grimoire community refs ───────────────────────────────────────────────────
await run('grimoire_community_refs', `
  CREATE TABLE IF NOT EXISTS grimoire_community_refs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    post_id INT NOT NULL,
    title VARCHAR(300) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ref (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
  )
`);

// ── Seed 8 categories ─────────────────────────────────────────────────────────
const categories = [
  { name: 'Beginner Witchcraft',       slug: 'beginner-witchcraft',      description: 'Questions, advice, and learning the basics.',                           icon: 'Wand2',       sort: 1 },
  { name: 'Tarot & Divination',        slug: 'tarot-divination',         description: 'Card interpretations, spreads, and reading exchanges.',                  icon: 'Layers',      sort: 2 },
  { name: 'Moon Magic & Rituals',      slug: 'moon-magic-rituals',       description: 'Lunar traditions, intentions, and seasonal practices.',                  icon: 'Moon',        sort: 3 },
  { name: 'Herbs, Crystals & Nature',  slug: 'herbs-crystals-nature',    description: 'Plant folklore, crystals, and correspondences.',                         icon: 'Leaf',        sort: 4 },
  { name: 'Astrology & Birth Charts',  slug: 'astrology-birth-charts',   description: 'Zodiac placements, charts, and planetary symbolism.',                    icon: 'Globe2',      sort: 5 },
  { name: 'Spells & Grimoires',        slug: 'spells-grimoires',         description: 'Original rituals, creative ideas, and shared knowledge.',                icon: 'BookOpen',    sort: 6 },
  { name: "The Witch's Lounge",        slug: 'witches-lounge',           description: 'Introductions, friendships, and general conversations.',                 icon: 'Heart',       sort: 7 },
  { name: 'LGBTQ+ Magical Community', slug: 'lgbtq-magical-community',  description: 'An inclusive space for LGBTQ+ members and allies.',                      icon: 'Rainbow',     sort: 8 },
];

for (const cat of categories) {
  try {
    await conn.execute(
      `INSERT INTO community_categories (name, slug, description, icon, sort_order)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), icon=VALUES(icon), sort_order=VALUES(sort_order)`,
      [cat.name, cat.slug, cat.description, cat.icon, cat.sort]
    );
    console.log('OK: category', cat.name);
  } catch (e) {
    console.log('ERR: category', cat.name, (e.message || String(e)).slice(0, 80));
  }
}

// ── Seed 6 badges ─────────────────────────────────────────────────────────────
const badges = [
  { slug: 'helpful-witch',         name: 'Helpful Witch',          description: 'Recognized for consistently helpful answers.',         icon: 'Star' },
  { slug: 'tarot-guide',           name: 'Tarot Guide',            description: 'Shared deep tarot knowledge with the community.',      icon: 'Layers' },
  { slug: 'moon-keeper',           name: 'Moon Keeper',            description: 'Active contributor to Moon Magic & Rituals.',          icon: 'Moon' },
  { slug: 'grimoire-contributor',  name: 'Grimoire Contributor',   description: 'Shared original spells and grimoire content.',         icon: 'BookOpen' },
  { slug: 'community-storyteller', name: 'Community Storyteller',  description: 'Captivating posts that inspire the community.',        icon: 'Feather' },
  { slug: 'welcoming-spirit',      name: 'Welcoming Spirit',       description: 'Goes out of their way to welcome new members.',        icon: 'Heart' },
];

for (const badge of badges) {
  try {
    await conn.execute(
      `INSERT INTO community_badges (slug, name, description, icon)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), icon=VALUES(icon)`,
      [badge.slug, badge.name, badge.description, badge.icon]
    );
    console.log('OK: badge', badge.name);
  } catch (e) {
    console.log('ERR: badge', badge.name, (e.message || String(e)).slice(0, 80));
  }
}

await conn.end();
console.log('\nCommunity migration complete.');
