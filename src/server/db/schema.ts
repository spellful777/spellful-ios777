import { mysqlTable, int, tinyint, varchar, text, boolean, timestamp, json, index, uniqueIndex } from 'drizzle-orm/mysql-core';
// Note: tinyint imported above; used for TINYINT columns

// ─── BetterAuth tables ───────────────────────────────────────────────────────
export const user = mysqlTable('user', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').default(false),
  image: text('image'),
  isAdmin: boolean('is_admin').default(false),
  phoneNumber: varchar('phone_number', { length: 30 }),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  // Spellful profile fields
  birthDate: varchar('birth_date', { length: 20 }),
  birthTime: varchar('birth_time', { length: 10 }),
  birthLocation: varchar('birth_location', { length: 255 }),
  sunSign: varchar('sun_sign', { length: 50 }),
  moonSign: varchar('moon_sign', { length: 50 }),
  risingSign: varchar('rising_sign', { length: 50 }),
  // Onboarding / recovery fields
  backupEmail: varchar('backup_email', { length: 255 }),
  referralSource: varchar('referral_source', { length: 100 }),
  // Public profile fields
  username: varchar('username', { length: 50 }).unique(),
  usernameNormalized: varchar('username_normalized', { length: 50 }).unique(), // lowercase, for uniqueness checks
  usernameChangedAt: timestamp('username_changed_at'),                         // for 30-day cooldown
  bio: varchar('bio', { length: 160 }).default(''),
  location: varchar('location', { length: 100 }).default(''),
  witchPath: varchar('witch_path', { length: 100 }).default(''), // e.g. Eclectic, Green, Hedge, etc.
  profileVisibility: varchar('profile_visibility', { length: 20 }).default('private'), // public | coven | private
  // Profile 2.0 fields
  coverImage: text('cover_image'),
  coverPreset: varchar('cover_preset', { length: 50 }).default(''),
  accentColor: varchar('accent_color', { length: 30 }).default(''),
  pronouns: varchar('pronouns', { length: 60 }).default(''),
  interestTags: json('interest_tags').$type<string[]>(),
  socialLinks: json('social_links').$type<Record<string, string>>(),
  welcomeSent: boolean('welcome_sent').default(false),
  hideOnlineStatus: boolean('hide_online_status').default(false),
  messagePermission: varchar('message_permission', { length: 20 }).default('coven'), // everyone | coven | nobody
  invitePermission: varchar('invite_permission', { length: 20 }).default('coven'),   // everyone | nobody
  notificationPreferences: json('notification_preferences').$type<Record<string, boolean>>(),
  // Profile 3.0 fields
  avatarPreset: varchar('avatar_preset', { length: 60 }).default(''),           // default-hat-black | default-hat-blue | etc.
  profileTheme: varchar('profile_theme', { length: 50 }).default(''),          // celestial | forest | lunar | gothic | cottage | crystal
  avatarFrame: varchar('avatar_frame', { length: 50 }).default(''),             // moon | celestial | botanical | crystal | ornate | ''
  practiceLabels: json('practice_labels').$type<string[]>(),                   // e.g. ['Green Witch', 'Tarot Reader']
  profileStatus: varchar('profile_status', { length: 100 }).default(''),       // short mood/status
  profileSections: json('profile_sections').$type<{ id: string; enabled: boolean; order: number }[]>(), // modular sections config
  // Profile 4.0 fields
  profileLayout: varchar('profile_layout', { length: 20 }).default('classic'), // compact | classic | immersive
  // Profile 5.0 — field-level visibility
  bioVisibility: varchar('bio_visibility', { length: 20 }).default('public'),           // public | coven | private
  locationVisibility: varchar('location_visibility', { length: 20 }).default('public'), // public | coven | private
  zodiacVisibility: varchar('zodiac_visibility', { length: 20 }).default('public'),     // public | coven | private
  socialLinksVisibility: varchar('social_links_visibility', { length: 20 }).default('public'), // public | coven | private
  deletionRequestedAt: timestamp('deletion_requested_at'),
  // Social links — public opt-in
  instagramHandle: varchar('instagram_handle', { length: 100 }).default(''),
  showInstagramPublic: boolean('show_instagram_public').default(false),
  // RBAC — Phase 1
  platformRole: varchar('platform_role', { length: 30 }).default('member'), // owner | admin | moderator | support | member
  accountType: varchar('account_type', { length: 30 }).default('community_member'), // community_member | creator | organization | official
  // Registration source — how the member joined
  signupSource: varchar('signup_source', { length: 60 }).default(''),
  // Birthday & feed sharing
  shareBirthdayInFeed: boolean('share_birthday_in_feed').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const session = mysqlTable('session', {
  id: varchar('id', { length: 36 }).primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const account = mysqlTable('account', {
  id: varchar('id', { length: 36 }).primaryKey(),
  accountId: varchar('account_id', { length: 255 }).notNull(),
  providerId: varchar('provider_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: varchar('password', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const verification = mysqlTable('verification', {
  id: varchar('id', { length: 36 }).primaryKey(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  value: varchar('value', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
// ─────────────────────────────────────────────────────────────────────────────

// ─── BetterAuth Two-Factor ──────────────────────────────────────────────────
export const twoFactorTable = mysqlTable('two_factor', {
  id: varchar('id', { length: 36 }).primaryKey(),
  secret: varchar('secret', { length: 255 }).notNull(),
  backupCodes: text('backup_codes').notNull(),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  // BetterAuth twoFactor plugin additional fields
  verified: boolean('verified').default(false),
  failedVerificationCount: int('failed_verification_count').default(0),
  lockedUntil: timestamp('locked_until'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
// ─────────────────────────────────────────────────────────────────────────────

// ─── Grimoire (Book of Shadows) ─────────────────────────────────────────────
export const grimoireEntries = mysqlTable('grimoire_entries', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // spell | herb | crystal | ritual | tarot | dream | journal
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  notes: text('notes').default(''),
  tags: varchar('tags', { length: 500 }).default(''), // comma-separated
  category: varchar('category', { length: 100 }).default(''),
  isFavorite: boolean('is_favorite').default(false),
  moonPhase: varchar('moon_phase', { length: 100 }).default(''),
  entryDate: varchar('entry_date', { length: 20 }).default(''), // ISO date string
  metadata: json('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
// ─────────────────────────────────────────────────────────────────────────────

// ─── Tarot Readings ──────────────────────────────────────────────────────────
export const tarotReadings = mysqlTable('tarot_readings', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 36 })
    .references(() => user.id, { onDelete: 'cascade' }),
  spreadType: varchar('spread_type', { length: 50 }).notNull(), // one-card | three-card | love | career | spiritual
  spreadName: varchar('spread_name', { length: 100 }).notNull(),
  intention: varchar('intention', { length: 500 }).default(''),
  cards: json('cards').$type<Array<{ position: string; cardId: number; reversed: boolean }>>().notNull(),
  notes: text('notes').default(''),
  moonPhase: varchar('moon_phase', { length: 100 }).default(''),
  createdAt: timestamp('created_at').defaultNow(),
});
// ─────────────────────────────────────────────────────────────────────────────

// ─── Moon Rituals ─────────────────────────────────────────────────────────────
export const moonRituals = mysqlTable('moon_rituals', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 36 })
    .references(() => user.id, { onDelete: 'cascade' }),
  moonPhase: varchar('moon_phase', { length: 100 }).notNull(),
  intention: varchar('intention', { length: 100 }).notNull(),
  ritualName: varchar('ritual_name', { length: 200 }).notNull(),
  herbs: json('herbs').$type<string[]>().notNull(),
  crystals: json('crystals').$type<string[]>().notNull(),
  affirmations: json('affirmations').$type<string[]>().notNull(),
  journalPrompts: json('journal_prompts').$type<string[]>().notNull(),
  steps: json('steps').$type<string[]>().notNull(),
  scheduledDate: varchar('scheduled_date', { length: 20 }).default(''),
  notes: text('notes').default(''),
  savedToGrimoire: boolean('saved_to_grimoire').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});
// ─────────────────────────────────────────────────────────────────────────────

// ─── Login Activity ──────────────────────────────────────────────────────────
export const loginActivity = mysqlTable('login_activity', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  ipAddress: varchar('ip_address', { length: 45 }).default(''),
  userAgent: text('user_agent').default(''),
  device: varchar('device', { length: 100 }).default(''), // parsed device type
  location: varchar('location', { length: 100 }).default(''),
  createdAt: timestamp('created_at').defaultNow(),
});
// ─────────────────────────────────────────────────────────────────────────────

// ─── Coven Connections ────────────────────────────────────────────────────────
export const covenConnections = mysqlTable('coven_connections', {
  id: int('id').primaryKey().autoincrement(),
  requesterId: varchar('requester_id', { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  receiverId: varchar('receiver_id', { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).default('pending'), // pending | accepted | declined
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
// ─────────────────────────────────────────────────────────────────────────────

// ─── Online Presence ─────────────────────────────────────────────────────────
export const userPresence = mysqlTable('user_presence', {
  userId: varchar('user_id', { length: 36 })
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  lastSeen: timestamp('last_seen').defaultNow().onUpdateNow(),
});
// ─────────────────────────────────────────────────────────────────────────────

// ─── Direct Messages ──────────────────────────────────────────────────────────
export const conversations = mysqlTable('conversations', {
  id: int('id').primaryKey().autoincrement(),
  participant1Id: varchar('participant1_id', { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  participant2Id: varchar('participant2_id', { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const messages = mysqlTable('messages', {
  id: int('id').primaryKey().autoincrement(),
  conversationId: int('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: varchar('sender_id', { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  ciphertext: text('ciphertext').notNull(),   // base64 AES-GCM encrypted
  iv: varchar('iv', { length: 64 }).notNull(), // base64 IV
  status: varchar('status', { length: 16 }).notNull().default('sent'), // sent | draft | trashed
  systemMessage: text('system_message'),       // plaintext for system-originated messages (no E2E)
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
// ─────────────────────────────────────────────────────────────────────────────

// ─── User Public Keys (E2E encryption) ───────────────────────────────────────
export const messageRequests = mysqlTable('message_requests', {
  id: int('id').primaryKey().autoincrement(),
  conversationId: int('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  requesterId: varchar('requester_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  recipientId: varchar('recipient_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending | accepted | declined
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const userPublicKeys = mysqlTable('user_public_keys', {
  userId: varchar('user_id', { length: 36 })
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  publicKey: text('public_key').notNull(), // JWK JSON string of ECDH public key
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
// ─────────────────────────────────────────────────────────────────────────────

export const herbs = mysqlTable('herbs', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  aliases: varchar('aliases', { length: 500 }).default(''),
  category: varchar('category', { length: 100 }).notNull(),
  element: varchar('element', { length: 50 }).default(''),
  planet: varchar('planet', { length: 50 }).default(''),
  zodiac: varchar('zodiac', { length: 100 }).default(''),
  magicalUses: text('magical_uses').notNull(),
  spellTypes: varchar('spell_types', { length: 500 }).notNull(),
  bestTiming: varchar('best_timing', { length: 500 }).notNull(),
  moonPhase: varchar('moon_phase', { length: 200 }).default(''),
  notes: text('notes').default(''),
  spellComponents: text('spell_components').default(''),
  // ── Botanical identity (Phase 2) ─────────────────────────────────────────
  botanicalName: varchar('botanical_name', { length: 255 }).default(''),
  plantFamily: varchar('plant_family', { length: 100 }).default(''),
  plantPart: varchar('plant_part', { length: 100 }).default(''),
  region: varchar('region', { length: 255 }).default(''),
  identityWarning: text('identity_warning'),
  // ── Safety lens ──────────────────────────────────────────────────────────
  safetyNotes: text('safety_notes'),
  pregnancyCaution: boolean('pregnancy_caution').default(false),
  petToxicity: boolean('pet_toxicity').default(false),
  drugInteractions: text('drug_interactions'),
  ingestionWarning: text('ingestion_warning'),
  smokeWarning: text('smoke_warning'),
  topicalWarning: text('topical_warning'),
  // ── Source transparency ───────────────────────────────────────────────────
  sourceLabel: varchar('source_label', { length: 60 }).default('TRADITIONAL CORRESPONDENCE'),
  citationUrl: varchar('citation_url', { length: 500 }).default(''),
  lastVerifiedDate: varchar('last_verified_date', { length: 20 }).default(''),
  // ── Tradition & provenance ────────────────────────────────────────────────
  traditionAttribution: text('tradition_attribution'),
  correspondenceProvenance: text('correspondence_provenance'),
  // ── Editorial workflow ────────────────────────────────────────────────────
  status: varchar('status', { length: 20 }).default('approved'),
  reportedAt: timestamp('reported_at'),
});


// ─── Cosmic Life Timeline ─────────────────────────────────────────────────────
export const timelineEntries = mysqlTable('timeline_entries', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // milestone | journal | tarot | ritual | dream | relationship
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  tags: varchar('tags', { length: 500 }).default(''), // comma-separated
  moonPhase: varchar('moon_phase', { length: 100 }).default(''),
  eventDate: varchar('event_date', { length: 20 }).notNull(), // ISO date YYYY-MM-DD
  isPrivate: boolean('is_private').default(true),
  metadata: json('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
// ─────────────────────────────────────────────────────────────────────────────
// ─── Synastry Partners ────────────────────────────────────────────────────────
export const synastryPartners = mysqlTable('synastry_partners', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  partnerName: varchar('partner_name', { length: 255 }).notNull(),
  birthDate: varchar('birth_date', { length: 20 }).notNull(),
  birthTime: varchar('birth_time', { length: 10 }).default('12:00'),
  birthCity: varchar('birth_city', { length: 255 }).notNull(),
  lat: varchar('lat', { length: 20 }).notNull(),
  lon: varchar('lon', { length: 20 }).notNull(),
  utcOffset: varchar('utc_offset', { length: 10 }).default('0'),
  scores: json('scores').$type<{ love: number; stability: number; sexual: number; communication: number; longterm: number; overall: number }>().notNull(),
  summary: text('summary').notNull(),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
// ─────────────────────────────────────────────────────────────────────────────

// ─── Spell Library ───────────────────────────────────────────────────────────

export const spells = mysqlTable('spells', {
  id: int('id').primaryKey().autoincrement(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  subtitle: varchar('subtitle', { length: 500 }).default(''),
  purpose: text('purpose').notNull(),
  intention: varchar('intention', { length: 100 }).notNull(), // protection | love | abundance | healing | clarity | banishing | divination | grounding
  difficulty: varchar('difficulty', { length: 50 }).notNull(), // beginner | intermediate | advanced
  durationMinutes: int('duration_minutes').notNull().default(30),
  moonPhase: varchar('moon_phase', { length: 100 }).default(''),
  bestTiming: varchar('best_timing', { length: 255 }).default(''),
  materials: json('materials').$type<string[]>().notNull().default([]),
  steps: json('steps').$type<Array<{ order: number; title: string; description: string }>>().notNull().default([]),
  safetyNotes: text('safety_notes').default(''),
  herbCorrespondences: json('herb_correspondences').$type<string[]>().default([]),
  crystalCorrespondences: json('crystal_correspondences').$type<string[]>().default([]),
  elementCorrespondences: json('element_correspondences').$type<string[]>().default([]),
  relatedSpellIds: json('related_spell_ids').$type<number[]>().default([]),
  // Authorship & moderation
  submittedByUserId: varchar('submitted_by_user_id', { length: 36 }).references(() => user.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 50 }).notNull().default('approved'), // approved | pending | rejected
  isFeatured: boolean('is_featured').default(false),
  isAdminCreated: boolean('is_admin_created').default(true),
  rejectionReason: text('rejection_reason').default(''),
  // Denormalized counters (updated on write for fast reads)
  saveCount: int('save_count').notNull().default(0),
  ratingCount: int('rating_count').notNull().default(0),
  ratingSum: int('rating_sum').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const spellRatings = mysqlTable('spell_ratings', {
  id: int('id').primaryKey().autoincrement(),
  spellId: int('spell_id').notNull().references(() => spells.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  rating: int('rating').notNull(), // 1–5
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const spellReviews = mysqlTable('spell_reviews', {
  id: int('id').primaryKey().autoincrement(),
  spellId: int('spell_id').notNull().references(() => spells.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  rating: int('rating').notNull(), // 1–5 (review always includes a rating)
  body: text('body').notNull(),
  isModerated: boolean('is_moderated').default(false), // hidden by admin
  moderationNote: text('moderation_note').default(''),
  helpfulCount: int('helpful_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const reviewReplies = mysqlTable('review_replies', {
  id: int('id').primaryKey().autoincrement(),
  reviewId: int('review_id').notNull().references(() => spellReviews.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  isModerated: boolean('is_moderated').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const reviewHelpfulVotes = mysqlTable('review_helpful_votes', {
  id: int('id').primaryKey().autoincrement(),
  reviewId: int('review_id').notNull().references(() => spellReviews.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const reviewReports = mysqlTable('review_reports', {
  id: int('id').primaryKey().autoincrement(),
  reviewId: int('review_id').notNull().references(() => spellReviews.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  reason: varchar('reason', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const spellSaves = mysqlTable('spell_saves', {
  id: int('id').primaryKey().autoincrement(),
  spellId: int('spell_id').notNull().references(() => spells.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});
// ─────────────────────────────────────────────────────────────────────────────

export const candles = mysqlTable('candles', {
  id: int('id').primaryKey().autoincrement(),
  color: varchar('color', { length: 100 }).notNull(),
  hex: varchar('hex', { length: 7 }).notNull(),
  element: varchar('element', { length: 50 }).default(''),
  planet: varchar('planet', { length: 50 }).default(''),
  zodiac: varchar('zodiac', { length: 100 }).default(''),
  magicalUses: text('magical_uses').notNull(),
  spellTypes: varchar('spell_types', { length: 500 }).notNull(),
  bestTiming: varchar('best_timing', { length: 500 }).notNull(),
  moonPhase: varchar('moon_phase', { length: 200 }).default(''),
  spellRecipe: text('spell_recipe').default(''),
  notes: text('notes').default(''),
});


// ─── Spellful Community ───────────────────────────────────────────────────────

export const communityCategories = mysqlTable('community_categories', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description').notNull(),
  icon: varchar('icon', { length: 50 }).notNull(),
  sortOrder: int('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const communityPosts = mysqlTable('community_posts', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  categoryId: int('category_id').notNull().references(() => communityCategories.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).notNull().default('discussion'), // discussion | question
  title: varchar('title', { length: 300 }).notNull(),
  body: text('body').notNull(),
  imageUrl: text('image_url'),
  tags: varchar('tags', { length: 500 }).default(''),
  isPinned: boolean('is_pinned').default(false),
  isLocked: boolean('is_locked').default(false),
  isHidden: boolean('is_hidden').default(false),
  acceptedReplyId: int('accepted_reply_id'),
  audience: varchar('audience', { length: 20 }).default('public'), // public | coven
  likeCount: int('like_count').default(0),
  replyCount: int('reply_count').default(0),
  viewCount: int('view_count').default(0),
  shareCount: int('share_count').default(0),
  editedAt: timestamp('edited_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const communityReplies = mysqlTable('community_replies', {
  id: int('id').primaryKey().autoincrement(),
  postId: int('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  parentId: int('parent_id'),
  body: text('body').notNull(),
  isHidden: boolean('is_hidden').default(false),
  likeCount: int('like_count').default(0),
  depth: int('depth').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const communityLikes = mysqlTable('community_likes', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  targetType: varchar('target_type', { length: 10 }).notNull(), // post | reply
  targetId: int('target_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const communityBookmarks = mysqlTable('community_bookmarks', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  postId: int('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const communityFollows = mysqlTable('community_follows', {
  id: int('id').primaryKey().autoincrement(),
  followerId: varchar('follower_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  followingId: varchar('following_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const communityBlocks = mysqlTable('community_blocks', {
  id: int('id').primaryKey().autoincrement(),
  blockerId: varchar('blocker_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  blockedId: varchar('blocked_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const communityPolls = mysqlTable('community_polls', {
  id: int('id').primaryKey().autoincrement(),
  postId: int('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
  question: varchar('question', { length: 500 }).notNull(),
  choices: json('choices').$type<string[]>().notNull(),
  closesAt: timestamp('closes_at'),
  isClosed: boolean('is_closed').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const communityPollVotes = mysqlTable('community_poll_votes', {
  id: int('id').primaryKey().autoincrement(),
  pollId: int('poll_id').notNull().references(() => communityPolls.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  choiceIndex: int('choice_index').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const communityReports = mysqlTable('community_reports', {
  id: int('id').primaryKey().autoincrement(),
  reporterId: varchar('reporter_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  targetType: varchar('target_type', { length: 10 }).notNull(), // post | reply | profile
  targetId: int('target_id').notNull().default(0), // 0 for profile reports (use targetStringId)
  targetStringId: varchar('target_string_id', { length: 36 }), // userId for profile reports
  reason: varchar('reason', { length: 100 }).notNull(),
  details: text('details'),
  status: varchar('status', { length: 20 }).default('pending'), // pending | resolved | dismissed
  resolvedBy: varchar('resolved_by', { length: 36 }),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const communityModActions = mysqlTable('community_mod_actions', {
  id: int('id').primaryKey().autoincrement(),
  modId: varchar('mod_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  targetType: varchar('target_type', { length: 20 }).notNull(),
  targetId: varchar('target_id', { length: 100 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const communityBadges = mysqlTable('community_badges', {
  id: int('id').primaryKey().autoincrement(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  icon: varchar('icon', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const communityUserBadges = mysqlTable('community_user_badges', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  badgeId: int('badge_id').notNull().references(() => communityBadges.id, { onDelete: 'cascade' }),
  isHidden: boolean('is_hidden').default(false),
  awardedAt: timestamp('awarded_at').defaultNow(),
});

export const communityNotifications = mysqlTable('community_notifications', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // reply | mention | accepted | mod_notice
  actorId: varchar('actor_id', { length: 36 }),
  postId: int('post_id'),
  replyId: int('reply_id'),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});


// ─── Dashboard Preferences ────────────────────────────────────────────────────
export const dashboardPreferences = mysqlTable('dashboard_preferences', {
  userId: varchar('user_id', { length: 36 })
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  // Onboarding
  onboardingComplete: boolean('onboarding_complete').default(false),
  interests: json('interests').$type<string[]>().default([]),
  // Theme / density
  theme: varchar('theme', { length: 30 }).default('celestial'), // calm | celestial | botanical | dark-grimoire
  density: varchar('density', { length: 20 }).default('comfortable'), // compact | comfortable
  // Personalisation
  dashboardTitle: varchar('dashboard_title', { length: 80 }).default(''),
  timezone: varchar('timezone', { length: 100 }).default('UTC'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
// ─────────────────────────────────────────────────────────────────────────────

// ─── Dashboard Widgets ────────────────────────────────────────────────────────
export const dashboardWidgets = mysqlTable(
  'dashboard_widgets',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    widgetType: varchar('widget_type', { length: 50 }).notNull(),
    // moon | tarot | affirmation | herb-crystal | grimoire | events | journal | spell | messages | quick-links
    sortOrder: int('sort_order').notNull().default(0),
    isVisible: boolean('is_visible').default(true),
    settings: json('settings').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (t) => [
    index('idx_dashboard_widgets_user').on(t.userId),
    uniqueIndex('uq_dashboard_widget').on(t.userId, t.widgetType),
  ],
);
// ─────────────────────────────────────────────────────────────────────────────

export const communityMutes = mysqlTable('community_mutes', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  postId: int('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const grimoireCommunityRefs = mysqlTable('grimoire_community_refs', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  postId: int('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 300 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});
// ─────────────────────────────────────────────────────────────────────────────

// ─── Reminder Preferences ────────────────────────────────────────────────────
export const reminderPreferences = mysqlTable('reminder_preferences', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  // Moon event reminders
  fullMoonReminder: boolean('full_moon_reminder').default(false),
  newMoonReminder: boolean('new_moon_reminder').default(false),
  quarterMoonReminder: boolean('quarter_moon_reminder').default(false),
  // Practice reminders
  tarotReminder: boolean('tarot_reminder').default(false),
  dreamJournalReminder: boolean('dream_journal_reminder').default(false),
  ritualReminder: boolean('ritual_reminder').default(false),
  // Notification settings
  emailNotifications: boolean('email_notifications').default(true),
  reminderDaysBefore: int('reminder_days_before').default(1), // 0=same day, 1=day before, 2=two days before
  timezone: varchar('timezone', { length: 100 }).default('UTC'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
// ─────────────────────────────────────────────────────────────────────────────

// ─── Spellful Academy ────────────────────────────────────────────────────────
export const academyLessonProgress = mysqlTable(
  'academy_lesson_progress',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
    topicSlug: varchar('topic_slug', { length: 100 }).notNull(),
    lessonSlug: varchar('lesson_slug', { length: 100 }).notNull(),
    completed: boolean('completed').default(false),
    quizScore: int('quiz_score'),
    lastViewedAt: timestamp('last_viewed_at').defaultNow().onUpdateNow(),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [
    uniqueIndex('uq_user_lesson').on(t.userId, t.topicSlug, t.lessonSlug),
    index('idx_academy_user').on(t.userId),
    index('idx_academy_topic').on(t.userId, t.topicSlug),
  ],
);

export const academyBookmarks = mysqlTable(
  'academy_bookmarks',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
    topicSlug: varchar('topic_slug', { length: 100 }).notNull(),
    lessonSlug: varchar('lesson_slug', { length: 100 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [
    uniqueIndex('uq_user_bookmark').on(t.userId, t.topicSlug, t.lessonSlug),
    index('idx_bookmark_user').on(t.userId),
  ],
);
// ─── PWA Push Subscriptions ───────────────────────────────────────────────────
export const pushSubscriptions = mysqlTable(
  'push_subscriptions',
  {
    id: int('id').autoincrement().primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),
    endpoint: text('endpoint').notNull(),
    p256dh: text('p256dh').notNull(),
    auth: varchar('auth', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (t) => [
    index('idx_push_user').on(t.userId),
  ],
);
// ─────────────────────────────────────────────────────────────────────────────

// ─── Username History ─────────────────────────────────────────────────────────
export const usernameHistory = mysqlTable(
  'username_history',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
    oldUsername: varchar('old_username', { length: 50 }).notNull(),
    oldUsernameNormalized: varchar('old_username_normalized', { length: 50 }).notNull(),
    changedAt: timestamp('changed_at').defaultNow(),
  },
  (t) => [index('idx_username_history_user').on(t.userId)],
);

// ─── Profile Gallery ──────────────────────────────────────────────────────────
export const profileGallery = mysqlTable(
  'profile_gallery',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
    imageUrl: text('image_url').notNull(),
    caption: varchar('caption', { length: 200 }).default(''),
    altText: varchar('alt_text', { length: 200 }).default(''),
    visibility: varchar('visibility', { length: 20 }).default('public'), // public | coven | private
    sortOrder: int('sort_order').default(0),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [index('idx_profile_gallery_user').on(t.userId)],
);

// ─── Profile Featured Items ───────────────────────────────────────────────────
export const profileFeatured = mysqlTable(
  'profile_featured',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
    itemType: varchar('item_type', { length: 20 }).notNull(), // post | grimoire
    itemId: int('item_id').notNull(),
    sortOrder: int('sort_order').default(0),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [
    index('idx_profile_featured_user').on(t.userId),
    uniqueIndex('uq_profile_featured').on(t.userId, t.itemType, t.itemId),
  ],
);

// ─── Profile Identity Fields ──────────────────────────────────────────────────
// Stores optional magical identity fields per member.
// field_key: magical_name | magical_path | experience_level | favorite_element | personal_motto
export const profileIdentityFields = mysqlTable(
  'profile_identity_fields',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
    fieldKey: varchar('field_key', { length: 50 }).notNull(),
    value: text('value').notNull(),
    visibility: varchar('visibility', { length: 20 }).default('private'), // public | coven | private
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (t) => [
    index('idx_pif_user').on(t.userId),
    uniqueIndex('uq_pif_user_key').on(t.userId, t.fieldKey),
  ],
);

// ─── Profile Collections ──────────────────────────────────────────────────────
// Six optional magical favorites collections per member.
// type: crystals | herbs | tarot_decks | bookshelf | tools | inspirations
export const profileCollections = mysqlTable(
  'profile_collections',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 30 }).notNull(),
    title: varchar('title', { length: 80 }).notNull(),
    visibility: varchar('visibility', { length: 20 }).default('private'), // public | coven | private
    position: int('position').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (t) => [
    index('idx_pc_user').on(t.userId),
    uniqueIndex('uq_pc_user_type').on(t.userId, t.type),
  ],
);

// ─── Profile Collection Items ─────────────────────────────────────────────────
export const profileCollectionItems = mysqlTable(
  'profile_collection_items',
  {
    id: int('id').primaryKey().autoincrement(),
    collectionId: int('collection_id').notNull().references(() => profileCollections.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    note: varchar('note', { length: 200 }).default(''),
    emoji: varchar('emoji', { length: 10 }).default(''),
    visibility: varchar('visibility', { length: 20 }).default('public'), // public | coven | private
    position: int('position').default(0),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [index('idx_pci_collection').on(t.collectionId)],
);

// ─── Profile Playlists (Magical Soundscapes) ─────────────────────────────────
// provider: spotify | tidal
export const profilePlaylists = mysqlTable(
  'profile_playlists',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 20 }).notNull(),
    canonicalUrl: text('canonical_url').notNull(),
    providerPlaylistId: varchar('provider_playlist_id', { length: 120 }).notNull(),
    customTitle: varchar('custom_title', { length: 100 }).default(''),
    description: varchar('description', { length: 300 }).default(''),
    visibility: varchar('visibility', { length: 20 }).default('private'),
    position: int('position').default(0),
    isFeatured: tinyint('is_featured').default(0),
    isCurrentVibe: tinyint('is_current_vibe').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (t) => [index('idx_pp_user').on(t.userId)],
);

// ─── Profile Soundscapes Settings ────────────────────────────────────────────
export const profileSoundscapesSettings = mysqlTable(
  'profile_soundscapes_settings',
  {
    userId: varchar('user_id', { length: 36 }).primaryKey().references(() => user.id, { onDelete: 'cascade' }),
    enabled: tinyint('enabled').default(0),
    visibility: varchar('visibility', { length: 20 }).default('private'),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
);

// ─── Profile Guestbook Settings ──────────────────────────────────────────────
export const profileGuestbookSettings = mysqlTable(
  'profile_guestbook_settings',
  {
    userId: varchar('user_id', { length: 36 }).primaryKey().references(() => user.id, { onDelete: 'cascade' }),
    enabled: tinyint('enabled').default(0),
    allowedSubmitters: varchar('allowed_submitters', { length: 20 }).default('coven'),
    visibility: varchar('visibility', { length: 20 }).default('coven'),
    requireApproval: tinyint('require_approval').default(1),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
);

// ─── Profile Guestbook Entries ────────────────────────────────────────────────
// moderation_state: pending | approved | rejected | hidden
export const profileGuestbookEntries = mysqlTable(
  'profile_guestbook_entries',
  {
    id: int('id').primaryKey().autoincrement(),
    profileUserId: varchar('profile_user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
    authorUserId: varchar('author_user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
    text: varchar('text', { length: 300 }).notNull(),
    moderationState: varchar('moderation_state', { length: 20 }).default('pending'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (t) => [
    index('idx_pge_profile').on(t.profileUserId),
    index('idx_pge_author').on(t.authorUserId),
  ],
);

// ─── Profile Guestbook Bans ───────────────────────────────────────────────────
export const profileGuestbookBans = mysqlTable(
  'profile_guestbook_bans',
  {
    id: int('id').primaryKey().autoincrement(),
    profileUserId: varchar('profile_user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
    bannedUserId: varchar('banned_user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [
    uniqueIndex('uq_pgb').on(t.profileUserId, t.bannedUserId),
    index('idx_pgb_profile').on(t.profileUserId),
  ],
);

// ─── Profile Milestones ───────────────────────────────────────────────────────
// source_type: manual | join_date | first_post
export const profileMilestones = mysqlTable(
  'profile_milestones',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
    sourceType: varchar('source_type', { length: 30 }).default('manual'),
    title: varchar('title', { length: 120 }).notNull(),
    milestoneDate: varchar('milestone_date', { length: 20 }).default(''),
    note: varchar('note', { length: 300 }).default(''),
    visibility: varchar('visibility', { length: 20 }).default('private'),
    position: int('position').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (t) => [index('idx_pm_user').on(t.userId)],
);

// ─── RBAC — Account Type History ────────────────────────────────────────────
export const accountTypeHistory = mysqlTable(
  'account_type_history',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
    fromType: varchar('from_type', { length: 30 }).notNull(),
    toType: varchar('to_type', { length: 30 }).notNull(),
    changedBy: varchar('changed_by', { length: 36 }).references(() => user.id, { onDelete: 'set null' }),
    reason: varchar('reason', { length: 200 }).default(''),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [index('idx_ath_user').on(t.userId)],
);

// ─── RBAC — Audit Events ──────────────────────────────────────────────────────
// Append-only tamper-evident log for all privileged role/type/badge changes.
export const auditEvents = mysqlTable(
  'audit_events',
  {
    id: int('id').primaryKey().autoincrement(),
    actorId: varchar('actor_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
    targetId: varchar('target_id', { length: 36 }).references(() => user.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 80 }).notNull(), // e.g. role.grant, role.revoke, account_type.change, badge.grant
    oldValue: varchar('old_value', { length: 100 }),
    newValue: varchar('new_value', { length: 100 }),
    reason: varchar('reason', { length: 300 }).default(''),
    ipAddress: varchar('ip_address', { length: 45 }).default(''),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [
    index('idx_audit_actor').on(t.actorId),
    index('idx_audit_target').on(t.targetId),
    index('idx_audit_action').on(t.action),
  ],
);

// ─── Creator Applications ─────────────────────────────────────────────────────
// Private application workflow for Creator account type.
// status: pending_review | info_requested | approved | rejected | withdrawn
export const creatorApplications = mysqlTable(
  'creator_applications',
  {
    id: int('id').primaryKey().autoincrement(),
    referenceId: varchar('reference_id', { length: 36 }).notNull().unique(), // immutable UUID
    userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 30 }).notNull().default('pending_review'),
    requestedAccountType: varchar('requested_account_type', { length: 30 }).notNull().default('creator'), // creator | organization
    // Applicant-supplied fields
    creatorName: varchar('creator_name', { length: 255 }).notNull(),
    contactEmail: varchar('contact_email', { length: 255 }).notNull(),
    websiteUrl: varchar('website_url', { length: 500 }).default(''),
    instagramHandle: varchar('instagram_handle', { length: 100 }).default(''),
    blueskyHandle: varchar('bluesky_handle', { length: 100 }).default(''),
    threadsHandle: varchar('threads_handle', { length: 100 }).default(''),
    xHandle: varchar('x_handle', { length: 100 }).default(''),
    otherSocial: varchar('other_social', { length: 300 }).default(''),
    creatorCategory: varchar('creator_category', { length: 100 }).notNull(),
    workDescription: text('work_description').notNull(),
    workSamples: text('work_samples').notNull(), // newline-separated URLs / descriptions
    reasonForApplying: text('reason_for_applying').notNull(),
    additionalNotes: text('additional_notes').default(''),
    agreedToGuidelines: tinyint('agreed_to_guidelines').notNull().default(0),
    // Review workflow
    reviewedBy: varchar('reviewed_by', { length: 36 }).references(() => user.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at'),
    reviewDecision: varchar('review_decision', { length: 30 }).default(''), // approved | rejected | info_requested
    reviewReason: text('review_reason').default(''), // shown to applicant (no internal notes)
    // Email delivery
    notificationSent: tinyint('notification_sent').default(0),
    notificationSentAt: timestamp('notification_sent_at'),
    notificationRetries: int('notification_retries').default(0),
    submittedAt: timestamp('submitted_at').defaultNow(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (t) => [
    index('idx_ca_user').on(t.userId),
    index('idx_ca_status').on(t.status),
    index('idx_ca_ref').on(t.referenceId),
  ],
);

// ─── Creator Application Events ───────────────────────────────────────────────
// Append-only log of all status transitions and reviewer actions.
export const creatorApplicationEvents = mysqlTable(
  'creator_application_events',
  {
    id: int('id').primaryKey().autoincrement(),
    applicationId: int('application_id').notNull().references(() => creatorApplications.id, { onDelete: 'cascade' }),
    actorId: varchar('actor_id', { length: 36 }).references(() => user.id, { onDelete: 'set null' }),
    eventType: varchar('event_type', { length: 50 }).notNull(), // submitted | info_requested | approved | rejected | withdrawn | note_added
    note: text('note').default(''), // public-facing message (no internal staff notes)
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [index('idx_cae_app').on(t.applicationId)],
);

// ─── RBAC — User Badges ───────────────────────────────────────────────────────
// Stores both official (staff-issued) and self-selected interest badges.
export const userBadges = mysqlTable(
  'user_badges',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
    badgeKey: varchar('badge_key', { length: 60 }).notNull(), // e.g. 'interest.tarot', 'official.verified_creator'
    badgeType: varchar('badge_type', { length: 20 }).notNull().default('interest'), // interest | official
    issuedBy: varchar('issued_by', { length: 36 }).references(() => user.id, { onDelete: 'set null' }),
    isVisible: tinyint('is_visible').default(1),
    sortOrder: int('sort_order').default(0),
    reason: varchar('reason', { length: 200 }).default(''),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (t) => [
    index('idx_ub_user').on(t.userId),
    uniqueIndex('uq_user_badge').on(t.userId, t.badgeKey),
  ],
);

// ─── Birthday Reflections ─────────────────────────────────────────────────────
export const birthdayReflections = mysqlTable(
  'birthday_reflections',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
    year: int('year').notNull(), // calendar year of the birthday (e.g. 2026)
    reflection: text('reflection').notNull(),
    generatedAt: timestamp('generated_at').defaultNow(),
    journalSaved: boolean('journal_saved').default(false),
    journalSavedAt: timestamp('journal_saved_at'),
    dismissed: boolean('dismissed').default(false),
    dismissedAt: timestamp('dismissed_at'),
  },
  (t) => [
    uniqueIndex('uq_birthday_reflection').on(t.userId, t.year),
    index('idx_br_user').on(t.userId),
  ],
);


// ─── Community Moderator Assignments ─────────────────────────────────────────
// Forum-scoped moderator and community-admin assignments.
// A user may hold multiple independent assignments across different forums.
export const communityModeratorAssignments = mysqlTable(
  'community_moderator_assignments',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
    forumSlug: varchar('forum_slug', { length: 80 }).notNull(), // matches community_categories.slug
    role: varchar('role', { length: 30 }).notNull().default('moderator'), // moderator | community_admin
    assignedBy: varchar('assigned_by', { length: 36 }).references(() => user.id, { onDelete: 'set null' }),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (t) => [
    uniqueIndex('uq_cma_user_forum').on(t.userId, t.forumSlug),
    index('idx_cma_user').on(t.userId),
    index('idx_cma_forum').on(t.forumSlug),
  ],
);

// ─── Friend Feed Events ───────────────────────────────────────────────────────
// eventType: 'birthday' | 'post' | 'milestone' | 'achievement'
// audience: 'public' | 'followers' | 'coven'
export const friendFeedEvents = mysqlTable(
  'friend_feed_events',
  {
    id: int('id').primaryKey().autoincrement(),
    actorId: varchar('actor_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
    eventType: varchar('event_type', { length: 30 }).notNull(),
    payload: json('payload').$type<Record<string, unknown>>(),
    audience: varchar('audience', { length: 20 }).notNull().default('followers'), // public | followers | coven
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [
    index('idx_ffe_actor').on(t.actorId),
    index('idx_ffe_created').on(t.createdAt),
  ],
);

// ─── Friend Feed Reactions ────────────────────────────────────────────────────
export const friendFeedReactions = mysqlTable(
  'friend_feed_reactions',
  {
    id: int('id').primaryKey().autoincrement(),
    eventId: int('event_id').notNull().references(() => friendFeedEvents.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
    emoji: varchar('emoji', { length: 16 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [
    uniqueIndex('uq_feed_reaction').on(t.eventId, t.userId, t.emoji),
    index('idx_ffr_event').on(t.eventId),
  ],
);

// ─── Friend Feed Hidden Events ────────────────────────────────────────────────
export const friendFeedHidden = mysqlTable(
  'friend_feed_hidden',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
    eventId: int('event_id').notNull().references(() => friendFeedEvents.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [uniqueIndex('uq_feed_hidden').on(t.userId, t.eventId)],
);

// ─── Spellful Plus Subscriptions ─────────────────────────────────────────────
// Server-side entitlement record. Never trust client-supplied flags.
// status: active | grace_period | expired | cancelled | refunded | pending
// environment: sandbox | production
export const plusSubscriptions = mysqlTable(
  'plus_subscriptions',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
    appleOriginalTransactionId: varchar('apple_original_transaction_id', { length: 255 }).notNull(),
    appleProductId: varchar('apple_product_id', { length: 100 }).notNull().default('com.spellful.plus.monthly'),
    status: varchar('status', { length: 30 }).notNull().default('pending'), // active | grace_period | expired | cancelled | refunded | pending
    environment: varchar('environment', { length: 20 }).notNull().default('sandbox'), // sandbox | production
    expiresAt: timestamp('expires_at'),
    gracePeriodUntil: timestamp('grace_period_until'),
    cancelledAt: timestamp('cancelled_at'),
    lastVerifiedAt: timestamp('last_verified_at'),
    rawNotificationPayload: text('raw_notification_payload'), // last Apple server notification (truncated)
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (t) => [
    uniqueIndex('uq_ps_original_txn').on(t.appleOriginalTransactionId),
    index('idx_ps_user').on(t.userId),
    index('idx_ps_status').on(t.status),
    index('idx_ps_expires').on(t.expiresAt),
  ],
);

// ─── Spellful Plus Settings ───────────────────────────────────────────────────
// Per-user opt-in preferences for Plus features.
// showSupporterBadge defaults to FALSE — subscriber must explicitly opt in.
export const plusSettings = mysqlTable(
  'plus_settings',
  {
    userId: varchar('user_id', { length: 36 }).primaryKey().references(() => user.id, { onDelete: 'cascade' }),
    showSupporterBadge: boolean('show_supporter_badge').notNull().default(false),
    activeTheme: varchar('active_theme', { length: 50 }).notNull().default(''), // plus celestial theme key
    activeLayout: varchar('active_layout', { length: 30 }).notNull().default(''), // plus layout key
    practiceWidgetOrder: json('practice_widget_order').$type<string[]>(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
);

// ─── Practice Routines ────────────────────────────────────────────────────────
// Free users: max 1 routine. Plus users: unlimited.
export const practiceRoutines = mysqlTable(
  'practice_routines',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    description: varchar('description', { length: 300 }).notNull().default(''),
    steps: json('steps').$type<Array<{ id: string; type: string; label: string; durationMin: number }>>(),
    reminderEnabled: boolean('reminder_enabled').notNull().default(false),
    reminderTime: varchar('reminder_time', { length: 10 }).notNull().default(''), // HH:MM
    reminderDays: json('reminder_days').$type<number[]>(), // 0=Sun … 6=Sat
    isTemplate: boolean('is_template').notNull().default(false),
    sortOrder: int('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (t) => [
    index('idx_pr_user').on(t.userId),
  ],
);

// ─── Bug Reports ──────────────────────────────────────────────────────────────
// Community-submitted bug reports. status: new | in_progress | resolved
export const bugReports = mysqlTable(
  'bug_reports',
  {
    id: int('id').primaryKey().autoincrement(),
    reporterId: varchar('reporter_id', { length: 36 }).references(() => user.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    pageUrl: varchar('page_url', { length: 500 }).default(''),
    status: varchar('status', { length: 20 }).notNull().default('new'), // new | in_progress | resolved
    assignedTo: varchar('assigned_to', { length: 36 }).references(() => user.id, { onDelete: 'set null' }),
    resolvedAt: timestamp('resolved_at'),
    resolvedBy: varchar('resolved_by', { length: 36 }).references(() => user.id, { onDelete: 'set null' }),
    adminNote: text('admin_note').default(''),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (t) => [
    index('idx_br_reporter').on(t.reporterId),
    index('idx_br_status').on(t.status),
    index('idx_br_created').on(t.createdAt),
  ],
);
