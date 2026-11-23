/**
 * Username validation rules — client-safe (no server imports).
 * ^[A-Za-z0-9]{3,12}$ — ASCII alphanumeric only, 3–12 chars.
 */

export const USERNAME_REGEX = /^[A-Za-z0-9]{3,12}$/;

const RESERVED = new Set([
  'admin', 'administrator', 'admins', 'adm1n', 'adm1ns',
  'moderator', 'moderators', 'mod', 'mods', 'm0d', 'm0ds',
  'support', 'supports', 'supp0rt',
  'spellful', 'spellfu1', 'sp3llful',
  'staff', 'team', 'official', 'help', 'helpdesk',
  'system', 'root', 'null', 'undefined', 'anonymous',
  'test', 'testuser', 'demo', 'guest',
  'abuse', 'security', 'privacy', 'legal', 'billing',
  'info', 'contact', 'noreply', 'no_reply',
  'api', 'www', 'mail', 'email', 'smtp',
]);

export type UsernameError =
  | 'too_short'
  | 'too_long'
  | 'invalid_chars'
  | 'reserved'
  | 'taken'
  | 'cooldown';

export function validateUsernameFormat(username: string): UsernameError | null {
  if (username.length < 3) return 'too_short';
  if (username.length > 12) return 'too_long';
  if (!USERNAME_REGEX.test(username)) return 'invalid_chars';
  if (RESERVED.has(username.toLowerCase())) return 'reserved';
  return null;
}

export function usernameErrorMessage(err: UsernameError): string {
  switch (err) {
    case 'too_short':     return 'Username must be at least 3 characters.';
    case 'too_long':      return 'Username must be 12 characters or fewer.';
    case 'invalid_chars': return 'Only letters A–Z and digits 0–9 are allowed.';
    case 'reserved':      return 'That username is reserved. Please choose another.';
    case 'taken':         return 'That username is already taken.';
    case 'cooldown':      return 'You can only change your username once every 30 days.';
  }
}

export function normalizeUsername(username: string): string {
  return username.toLowerCase();
}

export const USERNAME_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
