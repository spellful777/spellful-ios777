/**
 * Spellful Brand Component System
 *
 * All product features that need the official Spellful logo or cosmic branding
 * must import from this barrel — never hardcode logo URLs or filenames directly.
 *
 * Official logo assets:
 *   WHITE: /airo-assets/images/logo/official-white  (for dark surfaces)
 *   BLACK: /airo-assets/images/logo/official-black  (for light surfaces)
 */

export { default as BrandLogo } from './BrandLogo';
export { default as CosmicBrandBackground } from './CosmicBrandBackground';
export type { LogoVariant, LogoContext, MagicalLevel, LogoSize } from './BrandLogo';
