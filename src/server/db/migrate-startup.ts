/**
 * Startup migration — adds any missing user-table columns.
 *
 * Runs automatically when the server starts. Each ALTER is guarded by a
 * SHOW COLUMNS check so it is safe to re-run on every boot.
 *
 * This handles the case where a project restore rolls back schema.ts changes
 * without touching the live database, leaving the two out of sync.
 */
import mysql from 'mysql2/promise';
import { getDatabaseCredentials } from './config.js';

interface ColumnRow {
  Field: string;
}

export async function runStartupMigration(): Promise<void> {
  const cfg = getDatabaseCredentials();
  let conn: mysql.Connection | null = null;

  try {
    conn = await mysql.createConnection({
      host: cfg.host,
      user: cfg.user,
      password: cfg.password,
      database: cfg.database,
      port: cfg.port,
      ssl: { rejectUnauthorized: false },
    });

    // ── user table ────────────────────────────────────────────────────────────
    const [cols] = await (conn.execute('SHOW COLUMNS FROM user') as unknown as Promise<[ColumnRow[], unknown]>);
    const existing = new Set(cols.map((c) => c.Field));

    const userAlters: Array<{ col: string; sql: string }> = [
      { col: 'is_admin',            sql: 'ALTER TABLE user ADD COLUMN is_admin BOOLEAN DEFAULT FALSE' },
      { col: 'phone_number',        sql: 'ALTER TABLE user ADD COLUMN phone_number VARCHAR(30)' },
      { col: 'two_factor_enabled',  sql: 'ALTER TABLE user ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE' },
      { col: 'birth_date',          sql: 'ALTER TABLE user ADD COLUMN birth_date VARCHAR(20)' },
      { col: 'birth_time',          sql: 'ALTER TABLE user ADD COLUMN birth_time VARCHAR(10)' },
      { col: 'birth_location',      sql: 'ALTER TABLE user ADD COLUMN birth_location VARCHAR(255)' },
      { col: 'sun_sign',            sql: 'ALTER TABLE user ADD COLUMN sun_sign VARCHAR(50)' },
      { col: 'moon_sign',           sql: 'ALTER TABLE user ADD COLUMN moon_sign VARCHAR(50)' },
      { col: 'rising_sign',         sql: 'ALTER TABLE user ADD COLUMN rising_sign VARCHAR(50)' },
      { col: 'backup_email',        sql: 'ALTER TABLE user ADD COLUMN backup_email VARCHAR(255)' },
      { col: 'referral_source',     sql: 'ALTER TABLE user ADD COLUMN referral_source VARCHAR(100)' },
      { col: 'username',            sql: 'ALTER TABLE user ADD COLUMN username VARCHAR(50) UNIQUE' },
      { col: 'bio',                 sql: "ALTER TABLE user ADD COLUMN bio VARCHAR(160) DEFAULT ''" },
      { col: 'location',            sql: "ALTER TABLE user ADD COLUMN location VARCHAR(100) DEFAULT ''" },
      { col: 'witch_path',          sql: "ALTER TABLE user ADD COLUMN witch_path VARCHAR(100) DEFAULT ''" },
      { col: 'profile_visibility',  sql: "ALTER TABLE user ADD COLUMN profile_visibility VARCHAR(20) DEFAULT 'private'" },
      { col: 'avatar_style',        sql: "ALTER TABLE user ADD COLUMN avatar_style VARCHAR(50) DEFAULT 'mystic-purple'" },
      { col: 'welcome_sent',        sql: 'ALTER TABLE user ADD COLUMN welcome_sent BOOLEAN DEFAULT FALSE' },
      { col: 'cover_image',         sql: 'ALTER TABLE user ADD COLUMN cover_image TEXT NULL DEFAULT NULL' },
      { col: 'cover_preset',        sql: "ALTER TABLE user ADD COLUMN cover_preset VARCHAR(50) NOT NULL DEFAULT ''" },
      { col: 'accent_color',        sql: "ALTER TABLE user ADD COLUMN accent_color VARCHAR(30) NOT NULL DEFAULT ''" },
      { col: 'pronouns',            sql: "ALTER TABLE user ADD COLUMN pronouns VARCHAR(60) NOT NULL DEFAULT ''" },
      { col: 'interest_tags',       sql: 'ALTER TABLE user ADD COLUMN interest_tags JSON NULL DEFAULT NULL' },
      { col: 'social_links',        sql: 'ALTER TABLE user ADD COLUMN social_links JSON NULL DEFAULT NULL' },
      { col: 'hide_online_status',        sql: 'ALTER TABLE user ADD COLUMN hide_online_status BOOLEAN DEFAULT FALSE' },
      { col: 'message_permission',         sql: "ALTER TABLE user ADD COLUMN message_permission VARCHAR(20) NOT NULL DEFAULT 'everyone'" },
      { col: 'invite_permission',          sql: "ALTER TABLE user ADD COLUMN invite_permission VARCHAR(20) NOT NULL DEFAULT 'everyone'" },
      { col: 'notification_preferences',   sql: 'ALTER TABLE user ADD COLUMN notification_preferences JSON NULL DEFAULT NULL' },
      // Profile 3.0
      { col: 'avatar_preset',               sql: "ALTER TABLE user ADD COLUMN avatar_preset VARCHAR(60) NOT NULL DEFAULT ''" },
      { col: 'username_normalized',        sql: 'ALTER TABLE user ADD COLUMN username_normalized VARCHAR(50) NULL' },
      { col: 'username_changed_at',        sql: 'ALTER TABLE user ADD COLUMN username_changed_at TIMESTAMP NULL DEFAULT NULL' },
      { col: 'profile_theme',              sql: "ALTER TABLE user ADD COLUMN profile_theme VARCHAR(50) NOT NULL DEFAULT ''" },
      { col: 'avatar_frame',               sql: "ALTER TABLE user ADD COLUMN avatar_frame VARCHAR(50) NOT NULL DEFAULT ''" },
      { col: 'practice_labels',            sql: 'ALTER TABLE user ADD COLUMN practice_labels JSON NULL DEFAULT NULL' },
      { col: 'profile_status',             sql: "ALTER TABLE user ADD COLUMN profile_status VARCHAR(100) NOT NULL DEFAULT ''" },
      { col: 'profile_sections',           sql: 'ALTER TABLE user ADD COLUMN profile_sections JSON NULL DEFAULT NULL' },
      // Profile 4.0
      { col: 'profile_layout',              sql: "ALTER TABLE user ADD COLUMN profile_layout VARCHAR(20) NOT NULL DEFAULT 'classic'" },
      // Profile 5.0 — field-level visibility
      { col: 'bio_visibility',              sql: "ALTER TABLE user ADD COLUMN bio_visibility VARCHAR(20) NOT NULL DEFAULT 'public'" },
      { col: 'location_visibility',         sql: "ALTER TABLE user ADD COLUMN location_visibility VARCHAR(20) NOT NULL DEFAULT 'public'" },
      { col: 'zodiac_visibility',           sql: "ALTER TABLE user ADD COLUMN zodiac_visibility VARCHAR(20) NOT NULL DEFAULT 'public'" },
      { col: 'social_links_visibility',     sql: "ALTER TABLE user ADD COLUMN social_links_visibility VARCHAR(20) NOT NULL DEFAULT 'public'" },
      // Social links — public opt-in
      { col: 'instagram_handle',            sql: "ALTER TABLE user ADD COLUMN instagram_handle VARCHAR(100) NOT NULL DEFAULT ''" },
      { col: 'show_instagram_public',       sql: 'ALTER TABLE user ADD COLUMN show_instagram_public BOOLEAN NOT NULL DEFAULT FALSE' },
    ];

    for (const { col, sql } of userAlters) {
      if (existing.has(col)) continue;
      try {
        await conn.execute(sql);
        console.log(JSON.stringify({ event: 'startup.migration.column.added', col }));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // Duplicate column is harmless — another instance beat us to it
        if (!msg.includes('Duplicate column')) {
          console.error(JSON.stringify({ event: 'startup.migration.column.error', col, msg: msg.slice(0, 120) }));
        }
      }
    }

    // ── two_factor table ──────────────────────────────────────────────────────
    try {
      await conn.execute(`CREATE TABLE IF NOT EXISTS two_factor (
        id VARCHAR(36) PRIMARY KEY,
        secret VARCHAR(255) NOT NULL,
        backup_codes TEXT NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        failed_verification_count INT DEFAULT 0,
        locked_until TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.two_factor.error', msg: msg.slice(0, 120) }));
    }

    // ── messages: system_message column ─────────────────────────────────────
    try {
      const [msgCols] = await (conn.execute('SHOW COLUMNS FROM messages') as unknown as Promise<[ColumnRow[], unknown]>);
      const msgColSet = new Set((msgCols as ColumnRow[]).map((c) => c.Field));
      if (!msgColSet.has('system_message')) {
        await conn.execute('ALTER TABLE messages ADD COLUMN system_message TEXT');
        console.log(JSON.stringify({ event: 'startup.migration.column.added', col: 'system_message' }));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes('Duplicate column')) {
        console.error(JSON.stringify({ event: 'startup.migration.messages.error', msg: msg.slice(0, 120) }));
      }
    }

    // ── push_subscriptions table ──────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          endpoint TEXT NOT NULL,
          p256dh TEXT NOT NULL,
          auth VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_push_user (user_id),
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.push_subscriptions.error', msg: msg.slice(0, 120) }));
    }


    // ── dashboard_preferences table ───────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS dashboard_preferences (
          user_id VARCHAR(36) PRIMARY KEY,
          onboarding_complete BOOLEAN DEFAULT FALSE,
          interests JSON DEFAULT ('[]'),
          theme VARCHAR(30) DEFAULT 'celestial',
          density VARCHAR(20) DEFAULT 'comfortable',
          dashboard_title VARCHAR(80) DEFAULT '',
          timezone VARCHAR(100) DEFAULT 'UTC',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.dashboard_preferences.error', msg: msg.slice(0, 120) }));
    }

    // ── dashboard_widgets table ───────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS dashboard_widgets (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          widget_type VARCHAR(50) NOT NULL,
          sort_order INT NOT NULL DEFAULT 0,
          is_visible BOOLEAN DEFAULT TRUE,
          settings JSON DEFAULT ('{}'),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_dashboard_widgets_user (user_id),
          UNIQUE KEY uq_dashboard_widget (user_id, widget_type),
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.dashboard_widgets.error', msg: msg.slice(0, 120) }));
    }

    // ── typing_indicators table ─────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS typing_indicators (
          user_id VARCHAR(36) NOT NULL,
          conversation_id INT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, conversation_id),
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
          FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.typing_indicators.error', msg: msg.slice(0, 120) }));
    }

    // ── messages: reply_to_id, edited_at, deleted_at columns ────────────────
    for (const colDef of [
      `ALTER TABLE messages ADD COLUMN reply_to_id INT NULL DEFAULT NULL`,
      `ALTER TABLE messages ADD COLUMN edited_at TIMESTAMP NULL DEFAULT NULL`,
      `ALTER TABLE messages ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL`,
    ]) {
      try {
        await conn.execute(colDef);
      } catch (e) {
        // Ignore "Duplicate column" — column already exists
        const msg = e instanceof Error ? e.message : String(e);
        if (!msg.includes('Duplicate column')) {
          console.error(JSON.stringify({ event: 'startup.migration.messages_phase3.error', msg: msg.slice(0, 120) }));
        }
      }
    }

    // ── message_reactions table ──────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS message_reactions (
          id INT NOT NULL AUTO_INCREMENT,
          message_id INT NOT NULL,
          user_id VARCHAR(36) NOT NULL,
          emoji VARCHAR(16) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_reaction (message_id, user_id, emoji),
          FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.message_reactions.error', msg: msg.slice(0, 120) }));
    }

    // ── messenger_wallpapers table ────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS messenger_wallpapers (
          id INT NOT NULL AUTO_INCREMENT,
          conversation_id INT NOT NULL,
          theme_id VARCHAR(50) NOT NULL DEFAULT 'default',
          custom_image_url TEXT,
          dim_amount TINYINT UNSIGNED NOT NULL DEFAULT 40,
          blur_amount TINYINT UNSIGNED NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_wallpaper_conv (conversation_id),
          FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.messenger_wallpapers.error', msg: msg.slice(0, 120) }));
    }
    // ── messenger_wallpapers: migrate to shared (conversation-keyed) wallpaper ─
    try {
      // Drop old per-user unique key if it exists (idempotent)
      await conn.execute(`ALTER TABLE messenger_wallpapers DROP INDEX uq_wallpaper`);
    } catch { /* index may not exist — safe to ignore */ }
    try {
      // Drop user_id FK and column if they exist (idempotent)
      await conn.execute(`ALTER TABLE messenger_wallpapers DROP FOREIGN KEY messenger_wallpapers_ibfk_1`);
    } catch { /* may not exist */ }
    try {
      await conn.execute(`ALTER TABLE messenger_wallpapers DROP COLUMN user_id`);
    } catch { /* may not exist */ }
    try {
      // Add shared unique key on conversation_id if not already present
      await conn.execute(`ALTER TABLE messenger_wallpapers ADD UNIQUE KEY uq_wallpaper_conv (conversation_id)`);
    } catch { /* already exists — safe to ignore */ }

    // ── quotes table ──────────────────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS quotes (
          id INT NOT NULL AUTO_INCREMENT,
          text TEXT NOT NULL,
          normalized_hash VARCHAR(64) NOT NULL,
          theme VARCHAR(50) NOT NULL DEFAULT 'general',
          accent VARCHAR(20) NOT NULL DEFAULT 'gold',
          active TINYINT(1) NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_quote_hash (normalized_hash),
          INDEX idx_quotes_active (active)
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.quotes.error', msg: msg.slice(0, 120) }));
    }

    // ── user_quote_history table ──────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS user_quote_history (
          id INT NOT NULL AUTO_INCREMENT,
          user_id VARCHAR(36) NOT NULL,
          quote_id INT NOT NULL,
          shown_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_user_quote (user_id, quote_id),
          INDEX idx_uqh_user (user_id),
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
          FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.user_quote_history.error', msg: msg.slice(0, 120) }));
    }

    // ── message_requests table ──────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS message_requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          conversation_id INT NOT NULL,
          requester_id VARCHAR(36) NOT NULL,
          recipient_id VARCHAR(36) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_msg_req (conversation_id),
          INDEX idx_msg_req_recipient (recipient_id),
          INDEX idx_msg_req_requester (requester_id),
          FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
          FOREIGN KEY (requester_id) REFERENCES user(id) ON DELETE CASCADE,
          FOREIGN KEY (recipient_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.message_requests.error', msg: msg.slice(0, 120) }));
    }

    // ── community_posts: audience + edited_at columns ────────────────────────
    for (const colDef of [
      `ALTER TABLE community_posts ADD COLUMN audience VARCHAR(20) NOT NULL DEFAULT 'public'`,
      `ALTER TABLE community_posts ADD COLUMN edited_at TIMESTAMP NULL DEFAULT NULL`,
    ]) {
      try {
        await conn.execute(colDef);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!msg.includes('Duplicate column')) {
          console.error(JSON.stringify({ event: 'startup.migration.community_posts_cols.error', msg: msg.slice(0, 120) }));
        }
      }
    }

    // ── username_normalized: backfill + unique index ────────────────────────
    try {
      // Backfill normalized usernames for existing rows
      await conn.execute(`
        UPDATE user
        SET username_normalized = LOWER(username)
        WHERE username IS NOT NULL AND username_normalized IS NULL
      `);
      // Add unique index if not present (safe to re-run)
      await conn.execute(`
        ALTER TABLE user ADD UNIQUE INDEX uq_username_normalized (username_normalized)
      `).catch((e: unknown) => {
        const m = e instanceof Error ? e.message : String(e);
        if (!m.includes('Duplicate key name') && !m.includes('already exists')) throw e;
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.username_normalized.error', msg: msg.slice(0, 120) }));
    }

    // ── username_history table ────────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS username_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          old_username VARCHAR(50) NOT NULL,
          old_username_normalized VARCHAR(50) NOT NULL,
          changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_username_history_user (user_id),
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.username_history.error', msg: msg.slice(0, 120) }));
    }

    // ── profile_gallery table ─────────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS profile_gallery (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          image_url TEXT NOT NULL,
          caption VARCHAR(200) DEFAULT '',
          alt_text VARCHAR(200) DEFAULT '',
          visibility VARCHAR(20) DEFAULT 'public',
          sort_order INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_profile_gallery_user (user_id),
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.profile_gallery.error', msg: msg.slice(0, 120) }));
    }

    // ── profile_featured table ────────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS profile_featured (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          item_type VARCHAR(20) NOT NULL,
          item_id INT NOT NULL,
          sort_order INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_profile_featured_user (user_id),
          UNIQUE KEY uq_profile_featured (user_id, item_type, item_id),
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.profile_featured.error', msg: msg.slice(0, 120) }));
    }

    // ── profile_identity_fields table ──────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS profile_identity_fields (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          field_key VARCHAR(50) NOT NULL,
          value TEXT NOT NULL,
          visibility VARCHAR(20) DEFAULT 'private',
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_pif_user (user_id),
          UNIQUE KEY uq_pif_user_key (user_id, field_key),
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.profile_identity_fields.error', msg: msg.slice(0, 120) }));
    }

    // ── profile_collections table ─────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS profile_collections (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          type VARCHAR(30) NOT NULL,
          title VARCHAR(80) NOT NULL,
          visibility VARCHAR(20) DEFAULT 'private',
          position INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_pc_user (user_id),
          UNIQUE KEY uq_pc_user_type (user_id, type),
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.profile_collections.error', msg: msg.slice(0, 120) }));
    }

    // ── profile_collection_items table ────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS profile_collection_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          collection_id INT NOT NULL,
          name VARCHAR(120) NOT NULL,
          note VARCHAR(200) DEFAULT '',
          emoji VARCHAR(10) DEFAULT '',
          visibility VARCHAR(20) DEFAULT 'public',
          position INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_pci_collection (collection_id),
          FOREIGN KEY (collection_id) REFERENCES profile_collections(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.profile_collection_items.error', msg: msg.slice(0, 120) }));
    }

    // ── profile_playlists table ──────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS profile_playlists (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          provider VARCHAR(20) NOT NULL,
          canonical_url TEXT NOT NULL,
          provider_playlist_id VARCHAR(120) NOT NULL,
          custom_title VARCHAR(100) DEFAULT '',
          description VARCHAR(300) DEFAULT '',
          visibility VARCHAR(20) DEFAULT 'private',
          position INT DEFAULT 0,
          is_featured TINYINT DEFAULT 0,
          is_current_vibe TINYINT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_pp_user (user_id),
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.profile_playlists.error', msg: msg.slice(0, 120) }));
    }

    // ── profile_soundscapes_settings table ────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS profile_soundscapes_settings (
          user_id VARCHAR(36) PRIMARY KEY,
          enabled TINYINT DEFAULT 0,
          visibility VARCHAR(20) DEFAULT 'private',
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.profile_soundscapes_settings.error', msg: msg.slice(0, 120) }));
    }

    // ── profile_guestbook_settings table ─────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS profile_guestbook_settings (
          user_id VARCHAR(36) PRIMARY KEY,
          enabled TINYINT DEFAULT 0,
          allowed_submitters VARCHAR(20) DEFAULT 'coven',
          visibility VARCHAR(20) DEFAULT 'coven',
          require_approval TINYINT DEFAULT 1,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.profile_guestbook_settings.error', msg: msg.slice(0, 120) }));
    }

    // ── profile_guestbook_entries table ───────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS profile_guestbook_entries (
          id INT AUTO_INCREMENT PRIMARY KEY,
          profile_user_id VARCHAR(36) NOT NULL,
          author_user_id VARCHAR(36) NOT NULL,
          text VARCHAR(300) NOT NULL,
          moderation_state VARCHAR(20) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_pge_profile (profile_user_id),
          INDEX idx_pge_author (author_user_id),
          FOREIGN KEY (profile_user_id) REFERENCES user(id) ON DELETE CASCADE,
          FOREIGN KEY (author_user_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.profile_guestbook_entries.error', msg: msg.slice(0, 120) }));
    }

    // ── profile_guestbook_bans table ──────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS profile_guestbook_bans (
          id INT AUTO_INCREMENT PRIMARY KEY,
          profile_user_id VARCHAR(36) NOT NULL,
          banned_user_id VARCHAR(36) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_pgb (profile_user_id, banned_user_id),
          INDEX idx_pgb_profile (profile_user_id),
          FOREIGN KEY (profile_user_id) REFERENCES user(id) ON DELETE CASCADE,
          FOREIGN KEY (banned_user_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.profile_guestbook_bans.error', msg: msg.slice(0, 120) }));
    }

    // ── profile_milestones table ──────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS profile_milestones (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          source_type VARCHAR(30) DEFAULT 'manual',
          title VARCHAR(120) NOT NULL,
          milestone_date VARCHAR(20) DEFAULT '',
          note VARCHAR(300) DEFAULT '',
          visibility VARCHAR(20) DEFAULT 'private',
          position INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_pm_user (user_id),
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.profile_milestones.error', msg: msg.slice(0, 120) }));
    }

    // ── community_blocks table ──────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS community_blocks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          blocker_id VARCHAR(36) NOT NULL,
          blocked_id VARCHAR(36) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_block (blocker_id, blocked_id),
          INDEX idx_block_blocker (blocker_id),
          INDEX idx_block_blocked (blocked_id),
          FOREIGN KEY (blocker_id) REFERENCES user(id) ON DELETE CASCADE,
          FOREIGN KEY (blocked_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.community_blocks.error', msg: msg.slice(0, 120) }));
    }

    // ── user: deletion_requested_at for soft-delete ─────────────────────────────
    try {
      await conn.execute(
        `ALTER TABLE user ADD COLUMN deletion_requested_at TIMESTAMP NULL DEFAULT NULL`
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes('Duplicate column')) {
        console.error(JSON.stringify({ event: 'startup.migration.user_deletion_requested_at.error', msg: msg.slice(0, 120) }));
      }
    }

    // ── community_reports: target_string_id for profile/string targets ────────
    try {
      await conn.execute(
        `ALTER TABLE community_reports ADD COLUMN target_string_id VARCHAR(36) NULL DEFAULT NULL`
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes('Duplicate column')) {
        console.error(JSON.stringify({ event: 'startup.migration.community_reports_string_id.error', msg: msg.slice(0, 120) }));
      }
    }

    // ── RBAC Phase 1: platform_role + account_type on user ───────────────────
    for (const { col, sql } of [
      { col: 'platform_role', sql: "ALTER TABLE user ADD COLUMN platform_role VARCHAR(30) NOT NULL DEFAULT 'member'" },
      { col: 'account_type',  sql: "ALTER TABLE user ADD COLUMN account_type VARCHAR(30) NOT NULL DEFAULT 'community_member'" },
    ]) {
      if (!existing.has(col)) {
        try {
          await conn.execute(sql);
          console.log(JSON.stringify({ event: 'startup.migration.column.added', col }));
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (!msg.includes('Duplicate column')) {
            console.error(JSON.stringify({ event: 'startup.migration.rbac.error', col, msg: msg.slice(0, 120) }));
          }
        }
      }
    }

    // ── Seed bw@spellful.com as Platform Owner ────────────────────────────────
    try {
      await conn.execute(
        `UPDATE user SET platform_role = 'owner' WHERE email = 'bw@spellful.com' AND platform_role != 'owner'`
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.owner_seed.error', msg: msg.slice(0, 120) }));
    }

    // ── audit_events table ────────────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS audit_events (
          id INT AUTO_INCREMENT PRIMARY KEY,
          actor_id VARCHAR(36) NOT NULL,
          target_id VARCHAR(36) NULL,
          action VARCHAR(80) NOT NULL,
          old_value VARCHAR(100) NULL,
          new_value VARCHAR(100) NULL,
          reason VARCHAR(300) DEFAULT '',
          ip_address VARCHAR(45) DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_audit_actor (actor_id),
          INDEX idx_audit_target (target_id),
          INDEX idx_audit_action (action),
          FOREIGN KEY (actor_id) REFERENCES user(id) ON DELETE CASCADE,
          FOREIGN KEY (target_id) REFERENCES user(id) ON DELETE SET NULL
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.audit_events.error', msg: msg.slice(0, 120) }));
    }

    // ── user_badges table ─────────────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS user_badges (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          badge_key VARCHAR(60) NOT NULL,
          badge_type VARCHAR(20) NOT NULL DEFAULT 'interest',
          issued_by VARCHAR(36) NULL,
          is_visible TINYINT DEFAULT 1,
          sort_order INT DEFAULT 0,
          reason VARCHAR(200) DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_user_badge (user_id, badge_key),
          INDEX idx_ub_user (user_id),
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
          FOREIGN KEY (issued_by) REFERENCES user(id) ON DELETE SET NULL
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.user_badges.error', msg: msg.slice(0, 120) }));
    }

    // ── account_type_history table ────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS account_type_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          from_type VARCHAR(30) NOT NULL,
          to_type VARCHAR(30) NOT NULL,
          changed_by VARCHAR(36) NULL,
          reason VARCHAR(200) DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_ath_user (user_id),
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
          FOREIGN KEY (changed_by) REFERENCES user(id) ON DELETE SET NULL
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.account_type_history.error', msg: msg.slice(0, 120) }));
    }

    // ── creator_applications table ────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS creator_applications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          reference_id VARCHAR(36) NOT NULL,
          user_id VARCHAR(36) NOT NULL,
          status VARCHAR(30) NOT NULL DEFAULT 'pending_review',
          creator_name VARCHAR(255) NOT NULL,
          contact_email VARCHAR(255) NOT NULL,
          website_url VARCHAR(500) DEFAULT '',
          instagram_handle VARCHAR(100) DEFAULT '',
          bluesky_handle VARCHAR(100) DEFAULT '',
          threads_handle VARCHAR(100) DEFAULT '',
          x_handle VARCHAR(100) DEFAULT '',
          other_social VARCHAR(300) DEFAULT '',
          creator_category VARCHAR(100) NOT NULL,
          work_description TEXT NOT NULL,
          work_samples TEXT NOT NULL,
          reason_for_applying TEXT NOT NULL,
          additional_notes TEXT NULL,
          agreed_to_guidelines TINYINT NOT NULL DEFAULT 0,
          reviewed_by VARCHAR(36) NULL,
          reviewed_at TIMESTAMP NULL,
          review_decision VARCHAR(30) DEFAULT '',
          review_reason TEXT NULL,
          notification_sent TINYINT DEFAULT 0,
          notification_sent_at TIMESTAMP NULL,
          notification_retries INT DEFAULT 0,
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_ca_ref (reference_id),
          INDEX idx_ca_user (user_id),
          INDEX idx_ca_status (status),
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
          FOREIGN KEY (reviewed_by) REFERENCES user(id) ON DELETE SET NULL
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.creator_applications.error', msg: msg.slice(0, 120) }));
    }

    // ── creator_applications: add requested_account_type column ──────────────
    try {
      const [cacols] = await conn.execute(`SHOW COLUMNS FROM creator_applications LIKE 'requested_account_type'`) as unknown as [unknown[]];
      if ((cacols as unknown[]).length === 0) {
        await conn.execute(`ALTER TABLE creator_applications ADD COLUMN requested_account_type VARCHAR(30) NOT NULL DEFAULT 'creator' AFTER status`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.creator_applications.requested_account_type.error', msg: msg.slice(0, 120) }));
    }

    // ── creator_application_events table ─────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS creator_application_events (
          id INT AUTO_INCREMENT PRIMARY KEY,
          application_id INT NOT NULL,
          actor_id VARCHAR(36) NULL,
          event_type VARCHAR(50) NOT NULL,
          note TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_cae_app (application_id),
          FOREIGN KEY (application_id) REFERENCES creator_applications(id) ON DELETE CASCADE,
          FOREIGN KEY (actor_id) REFERENCES user(id) ON DELETE SET NULL
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.creator_application_events.error', msg: msg.slice(0, 120) }));
    }

    // ── Performance indexes for messages ──────────────────────────────────────
    for (const { name, sql: indexSql } of [
      { name: 'idx_messages_conv_status', sql: 'ALTER TABLE messages ADD INDEX idx_messages_conv_status (conversation_id, status, created_at)' },
      { name: 'idx_messages_conv_read', sql: 'ALTER TABLE messages ADD INDEX idx_messages_conv_read (conversation_id, sender_id, read_at)' },
      { name: 'idx_conversations_p1', sql: 'ALTER TABLE conversations ADD INDEX idx_conversations_p1 (participant1_id, updated_at)' },
      { name: 'idx_conversations_p2', sql: 'ALTER TABLE conversations ADD INDEX idx_conversations_p2 (participant2_id, updated_at)' },
    ]) {
      try {
        await conn.execute(indexSql);
        console.log(JSON.stringify({ event: 'startup.migration.index.added', name }));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!msg.includes('Duplicate key name') && !msg.includes('already exists')) {
          console.error(JSON.stringify({ event: 'startup.migration.index.error', name, msg: msg.slice(0, 120) }));
        }
      }
    }

    // ── user_follows table ────────────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS user_follows (
          id INT AUTO_INCREMENT PRIMARY KEY,
          follower_id VARCHAR(36) NOT NULL,
          following_id VARCHAR(36) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_follow (follower_id, following_id),
          INDEX idx_follow_follower (follower_id),
          INDEX idx_follow_following (following_id),
          FOREIGN KEY (follower_id) REFERENCES user(id) ON DELETE CASCADE,
          FOREIGN KEY (following_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.user_follows.error', msg: msg.slice(0, 120) }));
    }

    // ── spellful_circles table ────────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS spellful_circles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          slug VARCHAR(80) NOT NULL,
          name VARCHAR(120) NOT NULL,
          description TEXT NOT NULL,
          icon VARCHAR(10) DEFAULT '🔮',
          membership_type VARCHAR(20) NOT NULL DEFAULT 'open',
          created_by VARCHAR(36) NULL,
          member_count INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_circle_slug (slug),
          INDEX idx_circle_created_by (created_by),
          FOREIGN KEY (created_by) REFERENCES user(id) ON DELETE SET NULL
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.spellful_circles.error', msg: msg.slice(0, 120) }));
    }

    // ── circle_memberships table ──────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS circle_memberships (
          id INT AUTO_INCREMENT PRIMARY KEY,
          circle_id INT NOT NULL,
          user_id VARCHAR(36) NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'member',
          status VARCHAR(20) NOT NULL DEFAULT 'active',
          joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_circle_member (circle_id, user_id),
          INDEX idx_cm_user (user_id),
          INDEX idx_cm_circle (circle_id),
          FOREIGN KEY (circle_id) REFERENCES spellful_circles(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.circle_memberships.error', msg: msg.slice(0, 120) }));
    }

    // ── Seed default Spellful Circles ─────────────────────────────────────────
    try {
      const defaultCircles = [
        { slug: 'herbalists-circle', name: "Herbalists' Circle", description: 'A gathering place for those who work with plant medicine, herbal remedies, and botanical magic.', icon: '🌿' },
        { slug: 'tarot-study-circle', name: 'Tarot Study Circle', description: 'Explore the cards together — from beginner pulls to deep symbolic study and spreads.', icon: '🔮' },
        { slug: 'lunar-practice-circle', name: 'Lunar Practice Circle', description: 'Moon rituals, lunar cycles, and celestial timing for your magical practice.', icon: '🌙' },
        { slug: 'beginners-coven', name: "Beginner's Coven", description: 'A welcoming, judgment-free space for those just beginning their magical journey.', icon: '✨' },
      ];
      for (const c of defaultCircles) {
        await conn.execute(
          `INSERT IGNORE INTO spellful_circles (slug, name, description, icon, membership_type) VALUES (?, ?, ?, ?, 'open')`,
          [c.slug, c.name, c.description, c.icon],
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.circles_seed.error', msg: msg.slice(0, 120) }));
    }

    // ── tarot_shares table ────────────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS tarot_shares (
          id INT AUTO_INCREMENT PRIMARY KEY,
          public_id VARCHAR(36) NOT NULL,
          owner_user_id VARCHAR(36) NOT NULL,
          source_reading_id INT NULL,
          spread_type VARCHAR(60) NOT NULL,
          spread_name VARCHAR(80) NOT NULL,
          cards_snapshot JSON NOT NULL,
          share_mode VARCHAR(30) NOT NULL DEFAULT 'cards_and_summary',
          public_title VARCHAR(120) NOT NULL DEFAULT '',
          public_summary VARCHAR(400) NOT NULL DEFAULT '',
          published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          revoked_at TIMESTAMP NULL DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_tarot_share_public_id (public_id),
          INDEX idx_ts_owner (owner_user_id),
          INDEX idx_ts_revoked (revoked_at),
          FOREIGN KEY (owner_user_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.tarot_shares.error', msg: msg.slice(0, 120) }));
    }

    // ── share_birthday_in_feed column on user ─────────────────────────────────
    if (!existing.has('share_birthday_in_feed')) {
      try {
        await conn.execute(`ALTER TABLE user ADD COLUMN share_birthday_in_feed BOOLEAN NOT NULL DEFAULT FALSE`);
        console.log(JSON.stringify({ event: 'startup.migration.column.added', col: 'share_birthday_in_feed' }));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!msg.includes('Duplicate column')) {
          console.error(JSON.stringify({ event: 'startup.migration.share_birthday.error', msg: msg.slice(0, 120) }));
        }
      }
    }

    // ── birthday_reflections table ────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS birthday_reflections (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          year INT NOT NULL,
          reflection TEXT NOT NULL,
          generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          journal_saved BOOLEAN NOT NULL DEFAULT FALSE,
          journal_saved_at TIMESTAMP NULL,
          dismissed BOOLEAN NOT NULL DEFAULT FALSE,
          dismissed_at TIMESTAMP NULL,
          UNIQUE KEY uq_birthday_reflection (user_id, year),
          INDEX idx_br_user (user_id),
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.birthday_reflections.error', msg: msg.slice(0, 120) }));
    }


    // ── community_moderator_assignments table ─────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS community_moderator_assignments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          forum_slug VARCHAR(80) NOT NULL,
          role VARCHAR(30) NOT NULL DEFAULT 'moderator',
          assigned_by VARCHAR(36) NULL,
          expires_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_cma_user_forum (user_id, forum_slug),
          INDEX idx_cma_user (user_id),
          INDEX idx_cma_forum (forum_slug),
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
          FOREIGN KEY (assigned_by) REFERENCES user(id) ON DELETE SET NULL
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.community_moderator_assignments.error', msg: msg.slice(0, 120) }));
    }

    // ── friend_feed_events table ──────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS friend_feed_events (
          id INT AUTO_INCREMENT PRIMARY KEY,
          actor_id VARCHAR(36) NOT NULL,
          event_type VARCHAR(30) NOT NULL,
          payload JSON,
          audience VARCHAR(20) NOT NULL DEFAULT 'followers',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_ffe_actor (actor_id),
          INDEX idx_ffe_created (created_at),
          FOREIGN KEY (actor_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.friend_feed_events.error', msg: msg.slice(0, 120) }));
    }

    // ── friend_feed_reactions table ───────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS friend_feed_reactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          event_id INT NOT NULL,
          user_id VARCHAR(36) NOT NULL,
          emoji VARCHAR(16) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_feed_reaction (event_id, user_id, emoji),
          INDEX idx_ffr_event (event_id),
          FOREIGN KEY (event_id) REFERENCES friend_feed_events(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.friend_feed_reactions.error', msg: msg.slice(0, 120) }));
    }

    // ── friend_feed_hidden table ──────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS friend_feed_hidden (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          event_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_feed_hidden (user_id, event_id),
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
          FOREIGN KEY (event_id) REFERENCES friend_feed_events(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.friend_feed_hidden.error', msg: msg.slice(0, 120) }));
    }

    // ── plus_subscriptions table ──────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS plus_subscriptions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          apple_original_transaction_id VARCHAR(255) NOT NULL,
          apple_product_id VARCHAR(100) NOT NULL DEFAULT 'com.spellful.plus.monthly',
          status VARCHAR(30) NOT NULL DEFAULT 'pending',
          environment VARCHAR(20) NOT NULL DEFAULT 'sandbox',
          expires_at TIMESTAMP NULL,
          grace_period_until TIMESTAMP NULL,
          cancelled_at TIMESTAMP NULL,
          last_verified_at TIMESTAMP NULL,
          raw_notification_payload TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_ps_original_txn (apple_original_transaction_id),
          INDEX idx_ps_user (user_id),
          INDEX idx_ps_status (status),
          INDEX idx_ps_expires (expires_at),
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.plus_subscriptions.error', msg: msg.slice(0, 120) }));
    }

    // ── plus_settings table ───────────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS plus_settings (
          user_id VARCHAR(36) PRIMARY KEY,
          show_supporter_badge BOOLEAN NOT NULL DEFAULT FALSE,
          active_theme VARCHAR(50) NOT NULL DEFAULT '',
          active_layout VARCHAR(30) NOT NULL DEFAULT '',
          practice_widget_order JSON NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.plus_settings.error', msg: msg.slice(0, 120) }));
    }

    // ── practice_routines table ───────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS practice_routines (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          name VARCHAR(100) NOT NULL,
          description VARCHAR(300) NOT NULL DEFAULT '',
          steps JSON NULL,
          reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE,
          reminder_time VARCHAR(10) NOT NULL DEFAULT '',
          reminder_days JSON NULL,
          is_template BOOLEAN NOT NULL DEFAULT FALSE,
          sort_order INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_pr_user (user_id),
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.practice_routines.error', msg: msg.slice(0, 120) }));
    }

    // ── community_posts: share_count column ─────────────────────────────────
    try {
      await conn.execute(
        `ALTER TABLE community_posts ADD COLUMN share_count INT NOT NULL DEFAULT 0`
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes('Duplicate column')) {
        console.error(JSON.stringify({ event: 'startup.migration.community_posts_share_count.error', msg: msg.slice(0, 120) }));
      }
    }

    // ── user: signup_source column ────────────────────────────────────────────
    try {
      await conn.execute(
        `ALTER TABLE user ADD COLUMN signup_source VARCHAR(60) NOT NULL DEFAULT ''`
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes('Duplicate column')) {
        console.error(JSON.stringify({ event: 'startup.migration.user_signup_source.error', msg: msg.slice(0, 120) }));
      }
    }

    // ── bug_reports table ──────────────────────────────────────────────────────
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS bug_reports (
          id INT AUTO_INCREMENT PRIMARY KEY,
          reporter_id VARCHAR(36) NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          page_url VARCHAR(500) DEFAULT '',
          status VARCHAR(20) NOT NULL DEFAULT 'new',
          assigned_to VARCHAR(36) NULL,
          resolved_at TIMESTAMP NULL,
          resolved_by VARCHAR(36) NULL,
          admin_note TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_br_reporter (reporter_id),
          INDEX idx_br_status (status),
          INDEX idx_br_created (created_at),
          FOREIGN KEY (reporter_id) REFERENCES user(id) ON DELETE SET NULL,
          FOREIGN KEY (assigned_to) REFERENCES user(id) ON DELETE SET NULL,
          FOREIGN KEY (resolved_by) REFERENCES user(id) ON DELETE SET NULL
        )`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({ event: 'startup.migration.bug_reports.error', msg: msg.slice(0, 120) }));
    }

  } catch (e) {
    // Non-fatal — log and continue; the server still starts
    const msg = e instanceof Error ? e.message : String(e);
    console.error(JSON.stringify({ event: 'startup.migration.failed', msg: msg.slice(0, 200) }));
  } finally {
    if (conn) await conn.end().catch(() => undefined);
  }
}
