import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, Sparkles, Heart, Briefcase, Leaf } from 'lucide-react';
import { TAROT_CARDS, getSuitColor, type TarotCard } from '@/lib/tarot-data';
import { ShareBar } from '@/components/ShareBar';
import { tarot_card_detail } from 'virtual:content';

const siteUrl = 'https://spellful.com';

function cardToSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function slugToCard(slug: string): TarotCard | undefined {
  return TAROT_CARDS.find((c) => cardToSlug(c.name) === slug);
}

// Derive love/career/growth interpretations from existing meanings
function getLoveInterpretation(card: TarotCard): string {
  const love: Record<number, string> = {
    0: 'A new romantic adventure awaits. The Fool in love suggests an open heart ready for unexpected connections. Embrace vulnerability and let love surprise you.',
    1: 'You have the power to manifest the relationship you desire. Communicate clearly and use your natural charm to create meaningful connections.',
    2: 'Trust your intuition in matters of the heart. There may be hidden feelings or unspoken truths — listen to what is not being said.',
    3: 'A deeply nurturing, sensual relationship is possible. The Empress brings fertility, abundance, and deep emotional connection to love.',
    4: 'Seek stability and commitment in relationships. The Emperor energy calls for clear boundaries and a partner who is reliable and grounded.',
    5: 'Traditional relationships and shared spiritual values are highlighted. Consider whether your relationship aligns with your deeper beliefs.',
    6: 'A significant romantic choice or deep soul connection is at hand. The Lovers speaks of alignment, harmony, and choosing with your heart.',
    7: 'Drive and determination can win the heart you seek. The Chariot suggests pursuing love with confidence and clear intention.',
    8: 'Approach relationships with gentleness and patience. True strength in love comes from compassion, not control.',
    9: 'A period of solitude may be needed before love can flourish. The Hermit suggests inner work is the foundation for meaningful partnership.',
    10: 'A fated turn in your love life is coming. The Wheel of Fortune brings unexpected romantic developments — embrace the change.',
    11: 'Fairness and honesty are essential in your relationships. Justice asks you to examine whether your partnerships are balanced and truthful.',
    12: 'Surrender and see your relationship from a new perspective. The Hanged Man suggests letting go of expectations to find deeper connection.',
    13: 'A relationship may be ending to make way for something new. Death in love is transformation — honor what was and open to what comes.',
    14: 'Balance and patience are the keys to lasting love. Temperance asks you to blend your energies harmoniously with a partner.',
    15: 'Examine unhealthy patterns or attachments in your relationships. The Devil illuminates where fear or obsession may be masquerading as love.',
    16: 'A sudden revelation may shake your relationship to its foundations. The Tower clears away what was not built on truth — painful but ultimately freeing.',
    17: 'Hope and healing are available in your love life. The Star brings renewal, self-love, and the faith that the right connection is coming.',
    18: 'Confusion or illusion may cloud your romantic perceptions. The Moon asks you to trust your intuition over what appears on the surface.',
    19: 'Joy, warmth, and vitality radiate in your love life. The Sun brings happiness, playfulness, and a relationship that feels genuinely good.',
    20: "A relationship may be calling you to a higher purpose. Judgement asks whether your partnerships are aligned with your soul's evolution.",
    21: 'A complete, fulfilling relationship or the successful completion of a romantic journey. The World brings wholeness and deep satisfaction in love.',
  };
  if (card.arcana === 'major' && love[card.id] !== undefined) return love[card.id];
  const suit = card.suit ?? '';
  if (suit === 'cups') return `The ${card.name} in love speaks to emotional depth and the flow of feelings. ${card.uprightMeaning.split('.')[0]}.`;
  if (suit === 'wands') return `The ${card.name} in love brings passionate, fiery energy. ${card.uprightMeaning.split('.')[0]}.`;
  if (suit === 'swords') return `The ${card.name} in love calls for honest communication and clear thinking. ${card.uprightMeaning.split('.')[0]}.`;
  return `The ${card.name} in love suggests a grounded, practical approach to relationships. ${card.uprightMeaning.split('.')[0]}.`;
}

function getCareerInterpretation(card: TarotCard): string {
  const suit = card.suit ?? '';
  if (card.arcana === 'major') {
    return `The ${card.name} in career and work: ${card.keywords.slice(0, 2).join(' and ')} are the themes at play. ${card.uprightMeaning.split('.')[0]} in your professional life.`;
  }
  if (suit === 'pentacles') return `The ${card.name} is especially powerful for career and finances. ${card.uprightMeaning.split('.')[0]} in your work and material world.`;
  if (suit === 'wands') return `The ${card.name} brings creative fire to your career. ${card.uprightMeaning.split('.')[0]} in your professional endeavors.`;
  if (suit === 'swords') return `The ${card.name} in career calls for strategic thinking. ${card.uprightMeaning.split('.')[0]} in your work life.`;
  return `The ${card.name} in career suggests emotional intelligence is key. ${card.uprightMeaning.split('.')[0]} in your professional path.`;
}

function getGrowthInterpretation(card: TarotCard): string {
  return `For personal growth, the ${card.name} invites you to embody ${card.keywords.slice(0, 3).join(', ')}. ${card.uprightMeaning.split('.').slice(1, 2).join('.') || card.uprightMeaning.split('.')[0]}.`;
}

export default function TarotCardDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const card = slug ? slugToCard(slug) : undefined;

  if (!card) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--background))' }}>
        <div className="text-center px-6">
          <h1 className="text-3xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>Card Not Found</h1>
          <Link to="/tarot" className="text-sm" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>← Back to Tarot</Link>
        </div>
      </main>
    );
  }

  const suitColor = getSuitColor(card.suit);
  const pageUrl = `${siteUrl}/tarot/cards/${slug}`;
  const title = `${card.name} Tarot Card Meaning | Spellful`;
  const description = `${card.name}: ${card.keywords.join(', ')}. Upright: ${card.uprightMeaning.substring(0, 100)}...`;

  // Find adjacent cards
  const idx = TAROT_CARDS.findIndex((c) => c.id === card.id);
  const prevCard = idx > 0 ? TAROT_CARDS[idx - 1] : null;
  const nextCard = idx < TAROT_CARDS.length - 1 ? TAROT_CARDS[idx + 1] : null;

  // Related cards (same suit or same element)
  const related = TAROT_CARDS.filter((c) =>
    c.id !== card.id && (
      (card.suit && c.suit === card.suit) ||
      (card.element && c.element === card.element)
    )
  ).slice(0, 4);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${pageUrl}#article`,
    name: `${card.name} Tarot Card Meaning`,
    headline: `${card.name}: Upright & Reversed Meanings`,
    url: pageUrl,
    keywords: card.keywords.join(', '),
    isPartOf: { '@id': `${siteUrl}/#website` },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Tarot', item: `${siteUrl}/tarot` },
        { '@type': 'ListItem', position: 3, name: card.name, item: pageUrl },
      ],
    },
  };

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={card.image ?? 'https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png'} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={card.image ?? 'https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png'} />
        <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main style={{ background: 'hsl(var(--background))' }}>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="pt-6 pb-0 px-6 md:px-10 max-w-5xl mx-auto">
          <ol className="flex items-center gap-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
            <li><Link to="/" style={{ color: 'hsl(var(--muted-foreground))' }}>Home</Link></li>
            <li>/</li>
            <li><Link to="/tarot" style={{ color: 'hsl(var(--muted-foreground))' }}>Tarot</Link></li>
            <li>/</li>
            <li style={{ color: 'hsl(var(--foreground))' }}>{card.name}</li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="pt-8 pb-16 px-6 md:px-10">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr] gap-12 items-start">
            {/* Card image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="mx-auto w-full max-w-[260px] md:max-w-none"
            >
              <div
                className="rounded-2xl overflow-hidden shadow-2xl"
                style={{ aspectRatio: '5/9', border: `2px solid ${suitColor || 'hsl(var(--border))'}` }}
              >
                {card.image ? (
                  <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: 'hsl(var(--card))' }}>
                    <Sparkles size={48} style={{ color: suitColor || 'hsl(var(--primary))' }} />
                  </div>
                )}
              </div>
              {/* Card meta */}
              <div className="mt-4 space-y-2">
                {card.element && (
                  <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontFamily: 'var(--font-sans)' }}>
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>Element</span>
                    <span style={{ color: 'hsl(var(--foreground))' }}>{card.element}</span>
                  </div>
                )}
                {(card.planet || card.zodiac) && (
                  <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontFamily: 'var(--font-sans)' }}>
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>{card.planet ? 'Planet' : 'Zodiac'}</span>
                    <span style={{ color: 'hsl(var(--foreground))' }}>{card.planet ?? card.zodiac}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontFamily: 'var(--font-sans)' }}>
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>Arcana</span>
                  <span style={{ color: 'hsl(var(--foreground))' }}>{card.arcana === 'major' ? 'Major Arcana' : `Minor Arcana — ${card.suit ? card.suit.charAt(0).toUpperCase() + card.suit.slice(1) : ''}`}</span>
                </div>
              </div>
            </motion.div>

            {/* Card info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <p className="text-xs tracking-widest uppercase mb-2" style={{ color: suitColor || 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
                {card.arcana === 'major' ? 'Major Arcana' : `${card.suit ? card.suit.charAt(0).toUpperCase() + card.suit.slice(1) : ''} — Minor Arcana`}
              </p>
              <h1 className="text-4xl md:text-6xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                {card.name}
              </h1>

              {/* Keywords */}
              <div className="flex flex-wrap gap-2 mb-8">
                {card.keywords.map((kw) => (
                  <span key={kw} className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: `${suitColor || 'hsl(var(--primary))'  }22`, color: suitColor || 'hsl(var(--primary))', border: `1px solid ${suitColor || 'hsl(var(--primary))'}44`, fontFamily: 'var(--font-sans)' }}>
                    {kw}
                  </span>
                ))}
              </div>

              {/* Upright */}
              <div className="mb-6 p-6 rounded-2xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">☀️</span>
                  <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{tarot_card_detail.labels.upright}</h2>
                </div>
                <p className="leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{card.uprightMeaning}</p>
              </div>

              {/* Reversed */}
              <div className="p-6 rounded-2xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🌙</span>
                  <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{tarot_card_detail.labels.reversed}</h2>
                </div>
                <p className="leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{card.reversedMeaning}</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Interpretations */}
        <section className="py-16 px-6 md:px-10" style={{ background: 'hsl(var(--muted))' }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl mb-8 text-center" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              {tarot_card_detail.labels.interpretations}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Heart, label: tarot_card_detail.labels.love, text: getLoveInterpretation(card), color: '--grimoire-ritual' },
                { icon: Briefcase, label: tarot_card_detail.labels.career, text: getCareerInterpretation(card), color: '--primary' },
                { icon: Leaf, label: tarot_card_detail.labels.growth, text: getGrowthInterpretation(card), color: '--grimoire-herb' },
              ].map(({ icon: Icon, label, text, color }) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="p-6 rounded-2xl"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={18} style={{ color: `hsl(var(${color}))` }} />
                    <h3 className="font-semibold text-sm" style={{ fontFamily: 'var(--font-sans)', color: 'hsl(var(--foreground))' }}>{label}</h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Symbolism */}
        <section className="py-16 px-6 md:px-10">
          <div className="max-w-3xl mx-auto">
            <div className="p-8 rounded-2xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <h2 className="text-2xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{tarot_card_detail.labels.symbolism}</h2>
              <p className="leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{card.description}</p>
            </div>
          </div>
        </section>

        {/* Related cards */}
        {related.length > 0 && (
          <section className="py-16 px-6 md:px-10" style={{ background: 'hsl(var(--muted))' }}>
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl mb-8 text-center" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                {tarot_card_detail.labels.related}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {related.map((rc) => (
                  <Link key={rc.id} to={`/tarot/cards/${cardToSlug(rc.name)}`} className="group">
                    <div className="rounded-xl overflow-hidden mb-2 transition-transform group-hover:scale-105" style={{ aspectRatio: '5/9', border: '1px solid hsl(var(--border))' }}>
                      {rc.image ? (
                        <img src={rc.image} alt={rc.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'hsl(var(--card))' }}>
                          <Sparkles size={24} style={{ color: getSuitColor(rc.suit) || 'hsl(var(--primary))' }} />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-center" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{rc.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Share */}
        <section className="py-8 px-6 md:px-10 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="max-w-5xl mx-auto flex justify-center">
            <ShareBar
              text={`✨ ${card.name} — ${card.keywords.slice(0, 3).join(', ')}. Explore all 78 tarot cards on Spellful.`}
              url={`${siteUrl}/tarot/cards/${cardToSlug(card.name)}`}
              label="Share this card"
            />
          </div>
        </section>

        {/* Prev / Next navigation */}
        <section className="py-12 px-6 md:px-10 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            {prevCard ? (
              <Link to={`/tarot/cards/${cardToSlug(prevCard.name)}`} className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                <ArrowLeft size={16} />
                <span>{prevCard.name}</span>
              </Link>
            ) : <div />}
            <Link to="/tarot" className="px-4 py-2 rounded-full text-sm" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}>
              {tarot_card_detail.labels.all_cards}
            </Link>
            {nextCard ? (
              <Link to={`/tarot/cards/${cardToSlug(nextCard.name)}`} className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                <span>{nextCard.name}</span>
                <ArrowRight size={16} />
              </Link>
            ) : <div />}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6 md:px-10 text-center" style={{ background: 'hsl(var(--muted))' }}>
          <h2 className="text-2xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
            {tarot_card_detail.labels.cta_heading}
          </h2>
          <p className="mb-6 text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
            {tarot_card_detail.labels.cta_body}
          </p>
          <Link to="/tarot" className="inline-block px-6 py-3 rounded-full font-medium" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}>
            {tarot_card_detail.labels.cta_button}
          </Link>
        </section>
      </main>
    </>
  );
}
