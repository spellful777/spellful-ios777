/**
 * /tarot/share/:publicId — Public tarot reading share page.
 *
 * Renders the shared reading with actual card artwork, spread layout,
 * and a "Try your own reading" CTA. Includes full SSR Open Graph tags
 * so Facebook, X, and other crawlers receive a rich link preview.
 *
 * The og:image points to /api/tarot/shares/:publicId/og-image which
 * returns a 1200×630 SVG — no authentication required.
 */

import { useLoaderData, useParams } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link } from 'react-router';
import type { RouteObject } from 'react-router';
import { tarot_share } from 'virtual:content';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CardSnapshot {
  cardId: string;
  position: string;
  reversed: boolean;
  displayOrder: number;
}

interface ShareData {
  publicId: string;
  spreadType: string;
  spreadName: string;
  cards: CardSnapshot[];
  shareMode: string;
  publicTitle: string;
  publicSummary: string;
  publishedAt: string;
}

interface LoaderData {
  share: ShareData | null;
  error?: string;
}

// ── Loader ────────────────────────────────────────────────────────────────────

export const loader: RouteObject['loader'] = async ({ params }) => {
  const { publicId } = params as { publicId: string };
  const base = typeof window === 'undefined'
    ? 'http://localhost:3000'
    : window.location.origin;

  try {
    const res = await fetch(`${base}/api/tarot/shares/${publicId}`);
    if (!res.ok) {
      return { share: null, error: 'This reading share is no longer available.' };
    }
    const share = await res.json() as ShareData;
    return { share };
  } catch {
    return { share: null, error: 'Unable to load this reading.' };
  }
};

// ── Card image URL helper ─────────────────────────────────────────────────────

function cardSlotUrl(cardId: string): string {
  const majorArcana = new Set([
    'the-fool','the-magician','the-high-priestess','the-empress','the-emperor',
    'the-hierophant','the-lovers','the-chariot','strength','the-hermit',
    'wheel-of-fortune','justice','the-hanged-man','death','temperance',
    'the-devil','the-tower','the-star','the-moon','the-sun','judgement','the-world',
  ]);
  if (majorArcana.has(cardId)) return `/airo-assets/images/tarot/major-arcana/${cardId}`;
  if (cardId.endsWith('-of-cups'))      return `/airo-assets/images/tarot/cups/${cardId}`;
  if (cardId.endsWith('-of-wands'))     return `/airo-assets/images/tarot/wands/${cardId}`;
  if (cardId.endsWith('-of-swords'))    return `/airo-assets/images/tarot/swords/${cardId}`;
  if (cardId.endsWith('-of-pentacles')) return `/airo-assets/images/tarot/pentacles/${cardId}`;
  return `/airo-assets/images/tarot/major-arcana/${cardId}`;
}

function formatCardName(cardId: string): string {
  return cardId.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TarotSharePage() {
  const { publicId } = useParams<{ publicId: string }>();
  const { share, error } = useLoaderData() as LoaderData;

  const siteUrl = 'https://spellful.com';
  const pageUrl = `${siteUrl}/tarot/share/${publicId ?? ''}`;
  const ogImageUrl = `${siteUrl}/api/tarot/shares/${publicId ?? ''}/og-image`;

  // ── Unavailable state ──────────────────────────────────────────────────────
  if (!share || error) {
    return (
      <>
        <Helmet>
          <title>Reading Unavailable | Spellful</title>
          <meta name="description" content="This tarot reading share is no longer available." />
          <meta name="robots" content="noindex" />
        </Helmet>
        <main className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
          <div className="text-5xl mb-6">🌙</div>
          <h1 className="text-2xl font-light mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
            <span>{tarot_share.unavailableTitle}</span>
          </h1>
          <p className="text-base mb-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {error ?? tarot_share.unavailableBody}
          </p>
          <Link
            to="/tarot"
            className="px-6 py-3 rounded-full text-sm font-medium transition-all"
            style={{
              background: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
            }}
          >
            <span>{tarot_share.unavailableCta}</span>
          </Link>
        </main>
      </>
    );
  }

  // ── OG metadata ───────────────────────────────────────────────────────────
  const cardNames = share.cards.slice(0, 3).map((c) => formatCardName(c.cardId));
  const cardList  = cardNames.join(', ') + (share.cards.length > 3 ? ` +${share.cards.length - 3} more` : '');
  const ogTitle   = share.publicTitle || `My ${share.spreadName} Tarot Reading`;
  const ogDesc    = share.shareMode === 'cards_and_summary' && share.publicSummary
    ? `${cardList} — ${share.publicSummary.slice(0, 120)}… Discover your own reading at Spellful.`
    : `${cardList} — See the cards from this tarot reading and try your own at Spellful.`;

  // ── Sorted cards ──────────────────────────────────────────────────────────
  const sortedCards = [...share.cards].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <>
      <Helmet>
        <title>{ogTitle} | Spellful</title>
        <meta name="description" content={ogDesc} />
        <meta name="robots" content="noindex, nofollow" />

        {/* Open Graph */}
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDesc} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/svg+xml" />
        <meta property="og:site_name" content="Spellful" />

        {/* Twitter / X */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDesc} />
        <meta name="twitter:image" content={ogImageUrl} />
      </Helmet>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs font-medium tracking-widest mb-3" style={{ color: 'hsl(var(--primary))' }}>
            <span>{tarot_share.sectionLabel}</span>
          </p>
          <h1
            className="text-3xl md:text-4xl font-light italic mb-4"
            style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
          >
            {share.publicTitle || `A ${share.spreadName} Reading`}
          </h1>
          <div
            className="w-16 h-px mx-auto mb-4"
            style={{ background: 'hsl(var(--primary))' }}
          />
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {share.spreadName}
          </p>
        </div>

        {/* Cards grid — spread-aware layout */}
        {/* 1 card: centered single; 3: row of 3; 4: 2×2; 5: row of 3 + row of 2; other: auto rows of 3 */}
        <div
          className="grid gap-4 mb-10"
          style={{
            gridTemplateColumns: sortedCards.length === 1
              ? '1fr'
              : sortedCards.length === 4
                ? 'repeat(2, 1fr)'
                : `repeat(${Math.min(sortedCards.length, 3)}, 1fr)`,
            maxWidth: sortedCards.length === 1 ? '200px' : undefined,
            margin: sortedCards.length === 1 ? '0 auto' : undefined,
          }}
        >
          {sortedCards.map((card) => (
            <div key={`${card.cardId}-${card.displayOrder}`} className="flex flex-col items-center gap-2">
              <div
                className="relative rounded-xl overflow-hidden border"
                style={{
                  aspectRatio: '5/9',
                  borderColor: 'hsl(var(--border))',
                  background: 'hsl(var(--card))',
                }}
              >
                <img
                  src={cardSlotUrl(card.cardId)}
                  alt={formatCardName(card.cardId)}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  style={card.reversed ? { transform: 'rotate(180deg)' } : undefined}
                />
                {card.reversed && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/70 text-accent text-[10px]">
                    <span>{tarot_share.reversedLabel}</span>
                  </div>
                )}
              </div>
              <p
                className="text-center text-xs font-medium"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                {formatCardName(card.cardId)}
              </p>
              {card.position && (
                <p
                  className="text-center text-xs"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  {card.position}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        {share.shareMode === 'cards_and_summary' && share.publicSummary && (
          <div
            className="rounded-2xl p-6 mb-10 border"
            style={{
              background: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))',
            }}
          >
            <p
              className="text-base leading-relaxed italic"
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'hsl(var(--foreground))',
                fontSize: '1.1rem',
              }}
            >
              "{share.publicSummary}"
            </p>
          </div>
        )}

        {/* CTA */}
        <div
          className="rounded-2xl p-8 text-center border"
          style={{
            background: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
          }}
        >
          <div className="text-3xl mb-3">🔮</div>
          <h2
            className="text-xl font-light italic mb-2"
            style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
          >
            <span>{tarot_share.ctaHeading}</span>
          </h2>
          <p className="text-sm mb-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <span>{tarot_share.ctaBody}</span>
          </p>
          <Link
            to="/tarot"
            className="inline-block px-8 py-3 rounded-full text-sm font-medium transition-all"
            style={{
              background: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
            }}
          >
            <span>{tarot_share.ctaButton}</span>
          </Link>
        </div>

        {/* Disclaimer */}
        <p
          className="text-center text-xs mt-8"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          <span>{tarot_share.disclaimer}</span>
        </p>
      </main>
    </>
  );
}
