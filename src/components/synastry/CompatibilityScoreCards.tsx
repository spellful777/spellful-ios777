import type { CompatibilityScores } from '@/lib/synastry';

interface Props {
  scores: CompatibilityScores;
  expandedScore: string | null;
  setExpandedScore: (key: string | null) => void;
}

interface ScoreCard {
  key: keyof Omit<CompatibilityScores, 'overall'>;
  label: string;
  symbol: string;
  colorVar: string;
  tagline: string;
  howToLove: string[];
  watchFor: string;
}

const SCORE_CARDS: ScoreCard[] = [
  {
    key: 'love',
    label: 'Love & Romance',
    symbol: '♡',
    colorVar: '--astro-venus',
    tagline: 'How you love each other',
    howToLove: [
      'Express affection in the specific ways your partner receives it — words, touch, acts of service, or quality time. Ask them directly how they feel most loved, and share your own answer honestly.',
      'Create rituals of connection: a morning check-in, a weekly date, or a shared evening practice that keeps the romantic thread alive even during busy or stressful seasons.',
      'Celebrate small moments. This connection thrives when you notice and name what you appreciate about each other daily — not just on anniversaries or milestones.',
      'When the spark feels dim, return to the beginning. Revisit places, songs, or activities that meant something early on. Nostalgia is a powerful tool for rekindling warmth.',
    ],
    watchFor:
      'Love can feel one-sided if one partner expresses affection more openly than the other. Check in regularly about whether both of you feel seen and cherished — not just assumed to be. Unspoken needs become resentments over time.',
  },
  {
    key: 'stability',
    label: 'Stability & Trust',
    symbol: '⚖',
    colorVar: '--astro-saturn',
    tagline: 'The foundation you build on',
    howToLove: [
      'Build trust through consistency — follow through on small promises before the big ones. Trust is not declared, it is accumulated in hundreds of small reliable moments.',
      'Create shared structures: finances, routines, or long-term goals you both feel ownership over. When both people have a stake in the foundation, it holds.',
      'When conflict arises, return to your shared foundation. Remind each other of what you are building together before addressing what went wrong.',
      'Be honest about your fears around security and commitment. Vulnerability about what you need to feel safe is not weakness — it is the fastest path to genuine stability.',
    ],
    watchFor:
      'Stability can tip into rigidity. Make room for spontaneity and change so the relationship feels alive, not just secure. A relationship that never evolves can start to feel like a contract rather than a choice.',
  },
  {
    key: 'sexual',
    label: 'Physical Attraction',
    symbol: '♂',
    colorVar: '--astro-mars',
    tagline: 'The magnetic pull between you',
    howToLove: [
      'Physical chemistry is a living thing — it deepens with emotional safety. Prioritize emotional intimacy as much as physical. The more seen and accepted you each feel, the more freely desire flows.',
      'Be curious about each other\'s desires. Ask, listen, and stay open to how attraction evolves over time. What worked at the start may shift — that is natural, not a warning sign.',
      'Keep novelty alive: new experiences together — travel, creative projects, or even new environments — rekindle physical energy. Novelty activates the same brain chemistry as early attraction.',
      'Do not let physical connection become routine or obligatory. Approach it with the same intention and presence you would bring to any meaningful shared experience.',
    ],
    watchFor:
      'High physical chemistry can mask emotional incompatibility early on. Make sure you are building depth alongside desire. A connection built primarily on attraction will need deeper roots to last.',
  },
  {
    key: 'communication',
    label: 'Communication',
    symbol: '☿',
    colorVar: '--astro-mercury',
    tagline: 'How you think and talk together',
    howToLove: [
      'Learn each other\'s communication style — one of you may process internally while the other thinks out loud. Neither is wrong. Knowing this prevents you from misreading silence as withdrawal or words as aggression.',
      'Practice reflective listening: repeat back what you heard before responding. This one habit prevents the majority of misunderstandings before they escalate.',
      'Disagree with curiosity, not defensiveness. Ask "help me understand your perspective" before making your case. You are on the same team, even when you see things differently.',
      'Name your emotional state before you discuss the issue. "I am feeling hurt and I want to talk about last night" lands very differently than launching straight into the complaint.',
    ],
    watchFor:
      'Communication gaps widen under stress. Build the habit of checking in during calm times so you have the tools when things get hard. Couples who only talk deeply during conflict are always playing catch-up.',
  },
  {
    key: 'longterm',
    label: 'Long-Term Potential',
    symbol: '✦',
    colorVar: '--astro-sun',
    tagline: 'Where this connection can grow',
    howToLove: [
      'Talk about your individual visions for the future — not just shared goals, but personal dreams. A lasting relationship holds space for both people to grow into who they are becoming.',
      'Revisit your relationship\'s purpose regularly. What are you building together? How has it evolved from where you started? Relationships that last are ones that are consciously tended.',
      'Growth requires friction. The challenges in this connection are not signs of incompatibility — they are the curriculum of your relationship. What you work through together becomes the bedrock of your bond.',
      'Invest in the relationship as an entity in itself — not just in each other as individuals. Date nights, shared projects, and rituals of reconnection keep the relationship alive as a third presence between you.',
    ],
    watchFor:
      'Long-term potential is only realized through sustained effort. Complacency is the quiet threat — the assumption that because things are good now, they will stay good without tending. Keep investing in each other, especially when nothing is wrong.',
  },
];

export default function CompatibilityScoreCards({ scores, expandedScore, setExpandedScore }: Props) {
  return (
    <div className="flex flex-col gap-4 mb-8">
      {SCORE_CARDS.map(({ key, label, symbol, colorVar, tagline, howToLove, watchFor }) => {
        // eslint-disable-next-line security/detect-object-injection
        const score = scores[key];
        const isOpen = expandedScore === key;
        const colorStyle = `hsl(var(${colorVar}))`;

        return (
          <div key={key} className="rounded-2xl overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
            {/* Score header — always visible */}
            <button
              onClick={() => setExpandedScore(isOpen ? null : key)}
              className="w-full text-left p-5 transition-all duration-200"
              style={{ background: isOpen ? 'hsl(var(--background))' : 'hsl(var(--card))' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl shrink-0" style={{ color: colorStyle }}>{symbol}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground" style={{ fontFamily: 'var(--font-sans)' }}>{label}</p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-sans)' }}>{tagline}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xl font-light" style={{ fontFamily: 'var(--font-heading)', color: colorStyle }}>{score}%</span>
                  <span
                    className="text-sm"
                    style={{
                      color: 'hsl(var(--muted-foreground))',
                      display: 'inline-block',
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                    }}
                  >↓</span>
                </div>
              </div>
              <div className="w-full rounded-full h-1.5 bg-border">
                <div
                  className="h-1.5 rounded-full transition-all duration-700"
                  style={{ width: score + '%', background: colorStyle }}
                />
              </div>
              {!isOpen && (
                <p className="text-xs mt-2" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}>
                  Tap to learn more ↓
                </p>
              )}
            </button>

            {/* Expanded detail */}
            {isOpen && (
              <div className="px-5 pb-6" style={{ background: 'hsl(var(--background))', borderTop: '1px solid hsl(var(--border))' }}>
                <div className="pt-5">
                  <h5
                    className="text-sm font-semibold mb-3"
                    style={{ color: colorStyle, fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
                  >
                    How to nurture this
                  </h5>
                  <div className="flex flex-col gap-4 mb-5">
                    {howToLove.map((tip, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="text-xs mt-1 shrink-0" style={{ color: colorStyle }}>✦</span>
                        <p className="text-sm leading-relaxed text-foreground" style={{ fontFamily: 'var(--font-sans)' }}>{tip}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl p-4" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                    <p
                      className="text-xs font-semibold mb-1.5"
                      style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
                    >
                      ◇ Something to watch
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground" style={{ fontFamily: 'var(--font-sans)' }}>{watchFor}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
