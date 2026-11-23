import { useState } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Shuffle } from 'lucide-react';

type Rune = { name: string; symbol: string; meaning: string; keywords: string[]; reversed: string };

const ELDER_FUTHARK: Rune[] = [
  { name: 'Fehu', symbol: 'ᚠ', meaning: 'Cattle, wealth, and abundance. Fehu speaks of material prosperity, new beginnings, and the energy required to manifest your desires into the physical world.', keywords: ['Wealth', 'Abundance', 'Manifestation', 'New beginnings'], reversed: 'Loss of wealth, greed, or stagnation in material matters.' },
  { name: 'Uruz', symbol: 'ᚢ', meaning: 'Wild ox, primal strength. Uruz represents raw power, vitality, and the untamed force of nature. It calls you to embrace your inner strength and endurance.', keywords: ['Strength', 'Vitality', 'Courage', 'Health'], reversed: 'Weakness, missed opportunities, or lack of motivation.' },
  { name: 'Thurisaz', symbol: 'ᚦ', meaning: 'Thorn, giant. Thurisaz is a rune of protection and conflict. It warns of obstacles ahead but also grants the power to overcome them through directed force.', keywords: ['Protection', 'Conflict', 'Willpower', 'Boundaries'], reversed: 'Danger, compulsion, or vulnerability to attack.' },
  { name: 'Ansuz', symbol: 'ᚨ', meaning: 'Divine breath, communication. Ansuz is the rune of Odin and divine wisdom. It speaks of messages, inspiration, and the power of words to shape reality.', keywords: ['Communication', 'Wisdom', 'Inspiration', 'Truth'], reversed: 'Deception, miscommunication, or blocked inspiration.' },
  { name: 'Raidho', symbol: 'ᚱ', meaning: 'Journey, wheel. Raidho speaks of travel, both physical and spiritual. It represents the right path, rhythm, and the journey toward your highest purpose.', keywords: ['Journey', 'Movement', 'Rhythm', 'Right action'], reversed: 'Disruption, crisis, or being off your true path.' },
  { name: 'Kenaz', symbol: 'ᚲ', meaning: 'Torch, inner fire. Kenaz illuminates the darkness with creative fire. It speaks of knowledge, craft, and the transformative power of inner light and passion.', keywords: ['Creativity', 'Knowledge', 'Illumination', 'Passion'], reversed: 'Loss of direction, false hope, or creative blocks.' },
  { name: 'Gebo', symbol: 'ᚷ', meaning: 'Gift, exchange. Gebo represents the sacred exchange between humans and the divine. It speaks of gifts, partnerships, and the balance of giving and receiving.', keywords: ['Gift', 'Partnership', 'Balance', 'Generosity'], reversed: 'Gebo has no reversed meaning — its energy is always balanced.' },
  { name: 'Wunjo', symbol: 'ᚹ', meaning: 'Joy, harmony. Wunjo is the rune of happiness and belonging. It speaks of wishes fulfilled, harmony within community, and the deep satisfaction of being in alignment.', keywords: ['Joy', 'Harmony', 'Fulfillment', 'Community'], reversed: 'Sorrow, alienation, or delayed success.' },
  { name: 'Hagalaz', symbol: 'ᚺ', meaning: 'Hail, disruption. Hagalaz is the rune of sudden change and natural forces beyond our control. It clears the old to make way for new growth.', keywords: ['Change', 'Disruption', 'Transformation', 'Release'], reversed: 'Hagalaz has no reversed meaning — its energy is always transformative.' },
  { name: 'Nauthiz', symbol: 'ᚾ', meaning: 'Need, necessity. Nauthiz speaks of constraint and the lessons found in hardship. It teaches that our greatest growth comes from facing our deepest needs.', keywords: ['Need', 'Patience', 'Endurance', 'Lessons'], reversed: 'Constraint, want, or being trapped by your own needs.' },
  { name: 'Isa', symbol: 'ᛁ', meaning: 'Ice, stillness. Isa is the rune of pause and reflection. It calls you to be still, to look inward, and to wait for the right moment before taking action.', keywords: ['Stillness', 'Patience', 'Clarity', 'Introspection'], reversed: 'Isa has no reversed meaning — its energy is always stillness.' },
  { name: 'Jera', symbol: 'ᛃ', meaning: 'Year, harvest. Jera speaks of natural cycles and the rewards of patient effort. What you have sown is now ready to be harvested — trust the process.', keywords: ['Harvest', 'Cycles', 'Reward', 'Patience'], reversed: 'Jera has no reversed meaning — its energy is always cyclical.' },
  { name: 'Eihwaz', symbol: 'ᛇ', meaning: 'Yew tree, endurance. Eihwaz is the rune of the world tree and the axis between worlds. It speaks of resilience, transformation, and the ability to navigate between realms.', keywords: ['Endurance', 'Transformation', 'Protection', 'Depth'], reversed: 'Confusion, instability, or difficulty navigating change.' },
  { name: 'Perthro', symbol: 'ᛈ', meaning: 'Fate, mystery. Perthro is the rune of the unknown and hidden forces. It speaks of fate, chance, and the mysteries that lie beneath the surface of reality.', keywords: ['Mystery', 'Fate', 'Magic', 'Hidden knowledge'], reversed: 'Stagnation, addiction, or secrets working against you.' },
  { name: 'Algiz', symbol: 'ᛉ', meaning: 'Elk, protection. Algiz is the rune of divine protection and higher connection. It speaks of a shield around you and your connection to higher spiritual forces.', keywords: ['Protection', 'Higher self', 'Sanctuary', 'Instinct'], reversed: 'Vulnerability, hidden danger, or loss of protection.' },
  { name: 'Sowilo', symbol: 'ᛊ', meaning: 'Sun, victory. Sowilo is the rune of the sun and wholeness. It speaks of success, vitality, and the life-giving power of solar energy to illuminate your path.', keywords: ['Success', 'Vitality', 'Wholeness', 'Clarity'], reversed: 'Sowilo has no reversed meaning — its energy is always victorious.' },
  { name: 'Tiwaz', symbol: 'ᛏ', meaning: 'Tyr, justice. Tiwaz is the rune of the warrior god Tyr. It speaks of justice, sacrifice, and the courage to stand for truth even at great personal cost.', keywords: ['Justice', 'Courage', 'Sacrifice', 'Honor'], reversed: 'Injustice, defeat, or loss of faith in your cause.' },
  { name: 'Berkano', symbol: 'ᛒ', meaning: 'Birch, new beginnings. Berkano is the rune of the birch goddess and new life. It speaks of birth, growth, and the nurturing energy that supports new beginnings.', keywords: ['New beginnings', 'Growth', 'Nurturing', 'Fertility'], reversed: 'Stagnation, family troubles, or blocked growth.' },
  { name: 'Ehwaz', symbol: 'ᛖ', meaning: 'Horse, partnership. Ehwaz speaks of the sacred bond between horse and rider — trust, cooperation, and moving forward together in harmony toward a shared goal.', keywords: ['Partnership', 'Trust', 'Progress', 'Harmony'], reversed: 'Restlessness, betrayal, or movement in the wrong direction.' },
  { name: 'Mannaz', symbol: 'ᛗ', meaning: 'Humanity, self. Mannaz is the rune of the human being and our place in the cosmos. It speaks of self-awareness, community, and our shared humanity.', keywords: ['Self', 'Humanity', 'Community', 'Intelligence'], reversed: 'Isolation, self-deception, or conflict with others.' },
  { name: 'Laguz', symbol: 'ᛚ', meaning: 'Water, intuition. Laguz is the rune of water and the unconscious. It speaks of flow, intuition, and the deep emotional currents that shape our lives beneath the surface.', keywords: ['Intuition', 'Flow', 'Emotions', 'The unconscious'], reversed: 'Fear, confusion, or being overwhelmed by emotions.' },
  { name: 'Ingwaz', symbol: 'ᛜ', meaning: 'Ing, inner work. Ingwaz speaks of gestation and inner completion. It is a rune of rest and internal development — the seed gathering strength before it bursts forth.', keywords: ['Inner work', 'Gestation', 'Completion', 'Rest'], reversed: 'Ingwaz has no reversed meaning — its energy is always internal.' },
  { name: 'Dagaz', symbol: 'ᛞ', meaning: 'Dawn, breakthrough. Dagaz is the rune of the new day and awakening. It speaks of breakthrough moments, clarity after darkness, and the transformative power of a new dawn.', keywords: ['Breakthrough', 'Awakening', 'Clarity', 'New day'], reversed: 'Dagaz has no reversed meaning — its energy is always dawning.' },
  { name: 'Othala', symbol: 'ᛟ', meaning: 'Ancestral home, heritage. Othala speaks of inheritance — both material and spiritual. It connects you to your ancestors, your roots, and the wisdom passed down through your lineage.', keywords: ['Heritage', 'Ancestors', 'Home', 'Inheritance'], reversed: 'Homelessness, loss of heritage, or ancestral trauma.' },
];

type DrawCount = 1 | 3 | 5;
const POSITIONS: Record<DrawCount, string[]> = {
  1: ['Your Message'],
  3: ['Past', 'Present', 'Future'],
  5: ['Situation', 'Challenge', 'Advice', 'Hidden Influence', 'Outcome'],
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // eslint-disable-next-line security/detect-object-injection
    [a[i], a[j]] = [a[j], a[i]]; // safe: i and j are numeric indices from Math.floor(Math.random())
  }
  return a;
}

export default function RunesPage() {
  const [count, setCount] = useState<DrawCount>(3);
  const [drawn, setDrawn] = useState<Array<{ rune: Rune; reversed: boolean }>>([]);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [isDrawing, setIsDrawing] = useState(false);

  function drawRunes() {
    setIsDrawing(true);
    setRevealed(new Set());
    setTimeout(() => {
      const shuffled = shuffle(ELDER_FUTHARK).slice(0, count);
      setDrawn(shuffled.map(r => ({ rune: r, reversed: Math.random() > 0.7 })));
      setIsDrawing(false);
    }, 600);
  }

  function reveal(i: number) {
    setRevealed(prev => new Set([...prev, i]));
  }

  // eslint-disable-next-line security/detect-object-injection
  const positions = POSITIONS[count]; // safe: count is a typed DrawCount (1 | 3 | 5)

  return (
    <>
      <Helmet>
        <title>Rune Reading — Spellful</title>
        <meta name="description" content="Draw Elder Futhark runes for guidance. Free rune reading with full meanings and interpretations." />
        <meta property="og:title" content="Rune Reading — Spellful" />
        <meta property="og:description" content="Draw Elder Futhark runes for guidance. Free rune reading with full meanings and interpretations." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://spellful.com/runes" />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Rune Reading — Spellful" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Rune Reading — Spellful" />
        <meta name="twitter:description" content="Draw Elder Futhark runes for guidance. Free rune reading with full meanings and interpretations." />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta name="twitter:image:alt" content="Rune Reading — Spellful" />
      </Helmet>
      <main className="min-h-screen py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
            <p className="text-3xl">ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ</p>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">Rune Reading</h1>
            <p className="text-muted-foreground">Draw from the Elder Futhark and receive ancient wisdom</p>
          </motion.div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <p className="text-sm text-muted-foreground text-center">How many runes would you like to draw?</p>
            <div className="flex gap-3 justify-center">
              {([1, 3, 5] as DrawCount[]).map(n => (
                <button key={n} onClick={() => { setCount(n); setDrawn([]); setRevealed(new Set()); }}
                  className={`px-6 py-3 rounded-lg border text-sm font-medium transition-all ${count === n ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                  {n} {n === 1 ? 'Rune' : 'Runes'}
                </button>
              ))}
            </div>
            <Button onClick={drawRunes} disabled={isDrawing} className="w-full bg-primary text-primary-foreground hover:opacity-90">
              <Shuffle className="w-4 h-4 mr-2" />
              {drawn.length > 0 ? 'Draw Again' : 'Draw Runes'}
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {drawn.length > 0 && (
              <motion.div key={drawn.map(d => d.rune.name).join()} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={`grid gap-4 ${count === 1 ? 'grid-cols-1 max-w-sm mx-auto' : count === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                {drawn.map((d, i) => {
                  const isRevealed = revealed.has(i);
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                      <div className="rounded-xl border border-border bg-card overflow-hidden">
                        <div className="bg-muted/30 px-4 py-2 border-b border-border">
                          {/* eslint-disable-next-line security/detect-object-injection */}
                          <p className="text-xs text-muted-foreground text-center">{positions[i]}</p>
                        </div>
                        {!isRevealed ? (
                          <button onClick={() => reveal(i)} className="w-full p-8 flex flex-col items-center gap-3 hover:bg-muted/20 transition-colors">
                            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                              <span className="text-2xl text-primary/40">?</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Tap to reveal</p>
                          </button>
                        ) : (
                          <div className="p-5 space-y-3">
                            <div className="text-center">
                              <span className={`text-5xl text-primary ${d.reversed ? 'inline-block rotate-180' : ''}`}>{d.rune.symbol}</span>
                              <p className="text-lg font-serif font-bold text-foreground mt-2">{d.rune.name}</p>
                              {d.reversed && <span className="text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">Reversed</span>}
                            </div>
                            <div className="flex flex-wrap gap-1 justify-center">
                              {d.rune.keywords.map(k => <span key={k} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{k}</span>)}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {d.reversed ? d.rune.reversed : d.rune.meaning}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {drawn.length > 0 && revealed.size === drawn.length && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center space-y-2">
              <p className="text-sm font-medium text-primary">All runes revealed</p>
              <p className="text-xs text-muted-foreground">Sit with these messages. The runes speak in symbols — trust your intuition to find their meaning for you.</p>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
}