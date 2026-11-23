/**
 * Shared Open Graph / social meta constants for Spellful.
 *
 * og:image must be an absolute URL to a raster image (JPEG or PNG).
 * Facebook, Threads, and LinkedIn reject SVG. The og-image.png file in
 * public/ is a 1200×630 PNG served at this path.
 */
export const SITE_URL = 'https://spellful.com';
export const SITE_NAME = 'Spellful';

/** Absolute URL to the default OG image (uploaded PNG, served via airo-assets). */
export const OG_IMAGE = `${SITE_URL}/airo-assets/uploads/pages-og-image-7ff4c824.png`;
export const OG_IMAGE_WIDTH = '1200';
export const OG_IMAGE_HEIGHT = '630';
export const OG_IMAGE_ALT = 'Spellful — Witchcraft, Tarot & Intuitive Resources';

/** Build a full set of OG + Twitter Card meta tags for a page. */
export interface OgMetaOptions {
  title: string;
  description: string;
  url: string;
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'article';
}

export function ogMeta(opts: OgMetaOptions) {
  return {
    title: opts.title,
    description: opts.description,
    ogTitle: opts.title,
    ogDescription: opts.description,
    ogUrl: opts.url,
    ogType: opts.type ?? 'website',
    ogImage: opts.image ?? OG_IMAGE,
    ogImageAlt: opts.imageAlt ?? OG_IMAGE_ALT,
    twitterTitle: opts.title,
    twitterDescription: opts.description,
    twitterImage: opts.image ?? OG_IMAGE,
    twitterImageAlt: opts.imageAlt ?? OG_IMAGE_ALT,
  };
}
