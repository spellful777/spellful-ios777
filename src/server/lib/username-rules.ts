/**
 * Server-side username rules — re-exports from shared lib.
 * The .js extension is needed for ESM server imports.
 */
export {
  USERNAME_REGEX,
  validateUsernameFormat,
  usernameErrorMessage,
  normalizeUsername,
  USERNAME_COOLDOWN_MS,
} from '../../lib/username-rules.js';
export type { UsernameError } from '../../lib/username-rules.js';
