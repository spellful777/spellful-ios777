/**
 * Spellful Plus — Free Access Policy
 *
 * FREE_CORE: Features that MUST remain accessible to all users regardless of
 * subscription status. These cannot be gated, restricted, or degraded for
 * non-subscribers. This is a non-negotiable product rule.
 *
 * PLUS_ENHANCEMENT: Optional convenience, personalization, and organizational
 * features that are available only to active Spellful Plus subscribers.
 * These are genuine additions — they do not restrict existing free functionality.
 *
 * IMPORTANT: Never add a FREE_CORE feature to PLUS_ENHANCEMENT. If a feature
 * was previously free, it must remain free unless the product owner explicitly
 * approves a change after reviewing this policy.
 */

export const FREE_CORE = {
  // Education
  ACADEMY_LESSONS: 'academy_lessons',
  ACADEMY_QUIZZES: 'academy_quizzes',
  ACADEMY_PROGRESS_TRACKING: 'academy_progress_tracking',
  LIBRARY_ARTICLES: 'library_articles',
  LIBRARY_REFERENCES: 'library_references',
  TAROT_READINGS: 'tarot_readings',
  TAROT_MEANINGS: 'tarot_meanings',
  MOON_INFORMATION: 'moon_information',

  // Community
  COMMUNITY_BROWSE: 'community_browse',
  COMMUNITY_POST: 'community_post',
  COMMUNITY_REPLY: 'community_reply',
  COMMUNITY_FORUMS: 'community_forums',
  COMMUNITY_GROUPS: 'community_groups',
  COMMUNITY_CONNECTIONS: 'community_connections',
  COMMUNITY_DISCOVERY: 'community_discovery',

  // Personal practice
  BASIC_JOURNALING: 'basic_journaling',
  BASIC_SAVING: 'basic_saving',
  BASIC_REMINDERS: 'basic_reminders',
  ONE_PRACTICE_ROUTINE: 'one_practice_routine',

  // Account & safety
  ACCOUNT_REGISTRATION: 'account_registration',
  ACCOUNT_DELETION: 'account_deletion',
  DATA_EXPORT: 'data_export',
  PRIVACY_CONTROLS: 'privacy_controls',
  REPORTING: 'reporting',
  BLOCKING: 'blocking',
  APPEALS: 'appeals',
  ACCESSIBILITY: 'accessibility',

  // Applications & roles
  CREATOR_APPLICATION: 'creator_application',
  APPLICATION_STATUS_TRACKING: 'application_status_tracking',
  ROLE_BASED_ADMIN: 'role_based_admin',
  ROLE_BASED_MODERATION: 'role_based_moderation',
} as const;

export const PLUS_ENHANCEMENT = {
  // Practice Studio
  PRACTICE_STUDIO_WIDGETS: 'practice_studio_widgets',
  PRACTICE_STUDIO_REARRANGE: 'practice_studio_rearrange',

  // Routine Builder Pro
  UNLIMITED_ROUTINES: 'unlimited_routines',
  ROUTINE_TEMPLATES: 'routine_templates',
  ADVANCED_REMINDER_SCHEDULES: 'advanced_reminder_schedules',

  // Personalization
  PLUS_CELESTIAL_THEMES: 'plus_celestial_themes',
  PLUS_DASHBOARD_LAYOUTS: 'plus_dashboard_layouts',
  PLUS_CARD_BACK_THEMES: 'plus_card_back_themes',
  PLUS_JOURNAL_THEMES: 'plus_journal_themes',

  // Organization
  ADVANCED_TAGGING: 'advanced_tagging',
  CROSS_CONTENT_COLLECTIONS: 'cross_content_collections',
  ADVANCED_SEARCH_FILTERING: 'advanced_search_filtering',
  EXPORT_TEMPLATES: 'export_templates',

  // Insights
  PRACTICE_FREQUENCY_CHARTS: 'practice_frequency_charts',
  REFLECTION_PATTERNS: 'reflection_patterns',

  // Recognition
  SUPPORTER_BADGE_OPT_IN: 'supporter_badge_opt_in',
} as const;

export type FreeCoreFeature = (typeof FREE_CORE)[keyof typeof FREE_CORE];
export type PlusEnhancement = (typeof PLUS_ENHANCEMENT)[keyof typeof PLUS_ENHANCEMENT];

/**
 * Asserts at compile time that a feature key is in FREE_CORE.
 * Use this in tests to verify free-access invariants.
 */
export function assertFreeCore(feature: FreeCoreFeature): void {
  if (!Object.values(FREE_CORE).includes(feature)) {
    throw new Error(`Feature "${feature}" is not in FREE_CORE — this is a policy violation.`);
  }
}
