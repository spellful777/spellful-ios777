import { useState } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Hash } from 'lucide-react';

const MEANINGS: Record<number, { title: string; description: string; strengths: string[]; challenges: string[] }> = {
  1: { title: 'The Leader', description: 'You are a natural pioneer — independent, driven, and original. You came here to forge your own path and inspire others through your courage and individuality.', strengths: ['Leadership', 'Independence', 'Creativity', 'Ambition'], challenges: ['Stubbornness', 'Ego', 'Impatience'] },
  2: { title: 'The Peacemaker', description: 'You are a natural diplomat — sensitive, cooperative, and deeply intuitive. You came here to bring harmony and balance to the world through partnership and compassion.', strengths: ['Empathy', 'Diplomacy', 'Intuition', 'Patience'], challenges: ['Indecision', 'Over-sensitivity', 'Self-doubt'] },
  3: { title: 'The Creator', description: 'You are a natural artist — expressive, joyful, and imaginative. You came here to uplift others through creative self-expression and communication.', strengths: ['Creativity', 'Communication', 'Optimism', 'Charm'], challenges: ['Scattered energy', 'Superficiality', 'Moodiness'] },
  4: { title: 'The Builder', description: 'You are a natural architect — disciplined, reliable, and hardworking. You came here to build lasting foundations through dedication and practicality.', strengths: ['Discipline', 'Reliability', 'Organization', 'Loyalty'], challenges: ['Rigidity', 'Stubbornness', 'Resistance to change'] },
  5: { title: 'The Freedom Seeker', description: 'You are a natural adventurer — versatile, curious, and freedom-loving. You came here to experience life fully and inspire others to embrace change.', strengths: ['Adaptability', 'Curiosity', 'Versatility', 'Charisma'], challenges: ['Restlessness', 'Impulsiveness', 'Commitment issues'] },
  6: { title: 'The Nurturer', description: 'You are a natural caretaker — loving, responsible, and harmonious. You came here to serve others through love, healing, and creating beauty in the world.', strengths: ['Compassion', 'Responsibility', 'Healing', 'Creativity'], challenges: ['Perfectionism', 'Self-sacrifice', 'Worry'] },
  7: { title: 'The Seeker', description: 'You are a natural mystic — analytical, introspective, and spiritually attuned. You came here to seek deeper truths and share your wisdom with the world.', strengths: ['Intuition', 'Analysis', 'Wisdom', 'Spirituality'], challenges: ['Isolation', 'Secrecy', 'Skepticism'] },
  8: { title: 'The Powerhouse', description: 'You are a natural executive — ambitious, authoritative, and materially focused. You came here to master the material world and use power wisely for the greater good.', strengths: ['Ambition', 'Authority', 'Business acumen', 'Resilience'], challenges: ['Materialism', 'Control', 'Workaholism'] },
  9: { title: 'The Humanitarian', description: 'You are a natural healer — compassionate, idealistic, and universally loving. You came here to serve humanity and complete a cycle of spiritual evolution.', strengths: ['Compassion', 'Generosity', 'Wisdom', 'Idealism'], challenges: ['Martyrdom', 'Impracticality', 'Emotional intensity'] },
  11: { title: 'The Illuminator', description: 'You carry a master number — highly intuitive, spiritually aware, and visionary. You came here to inspire and illuminate others through your heightened sensitivity and insight.', strengths: ['Intuition', 'Inspiration', 'Spiritual insight', 'Empathy'], challenges: ['Anxiety', 'Overwhelm', 'High sensitivity'] },
  22: { title: 'The Master Builder', description: 'You carry a master number — the most powerful in numerology. You came here to turn grand visions into reality and leave a lasting legacy for humanity.', strengths: ['Vision', 'Practicality', 'Leadership', 'Manifestation'], challenges: ['Perfectionism', 'Pressure', 'Overwhelm'] },
  33: { title: 'The Master Teacher', description: 'You carry the rarest master number — the master teacher. You came here to uplift humanity through unconditional love, healing, and spiritual guidance.', strengths: ['Compassion', 'Healing', 'Teaching', 'Selflessness'], challenges: ['Self-sacrifice', 'Idealism', 'Burnout'] },
};

function reduceToSingleDigit(n: number): number {
  if (n === 11 || n === 22 || n === 33) return n;
  if (n < 10) return n;
  return reduceToSingleDigit(String(n).split('').reduce((a, d) => a + parseInt(d), 0));
}

function calcLifePath(dateStr: string): number {
  const digits = dateStr.replace(/\D/g, '');
  if (digits.length < 8) return 0;
  const sum = digits.split('').reduce((a, d) => a + parseInt(d), 0);
  return reduceToSingleDigit(sum);
}

const LETTER_MAP: Record<string, number> = {
  a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:1,k:2,l:3,m:4,n:5,o:6,p:7,q:8,r:9,s:1,t:2,u:3,v:4,w:5,x:6,y:7,z:8
};
const VOWELS = new Set(['a','e','i','o','u']);

function calcDestiny(name: string): number {
  // eslint-disable-next-line security/detect-object-injection
  const sum = name.toLowerCase().replace(/[^a-z]/g,'').split('').reduce((a,c) => a + (LETTER_MAP[c] ?? 0), 0);
  return reduceToSingleDigit(sum);
}

function calcSoulUrge(name: string): number {
  // eslint-disable-next-line security/detect-object-injection
  const sum = name.toLowerCase().replace(/[^a-z]/g,'').split('').filter(c => VOWELS.has(c)).reduce((a,c) => a + (LETTER_MAP[c] ?? 0), 0);
  return reduceToSingleDigit(sum);
}

function calcPersonality(name: string): number {
  // eslint-disable-next-line security/detect-object-injection
  const sum = name.toLowerCase().replace(/[^a-z]/g,'').split('').filter(c => !VOWELS.has(c)).reduce((a,c) => a + (LETTER_MAP[c] ?? 0), 0);
  return reduceToSingleDigit(sum);
}

function NumberCard({ label, number, icon }: { label: string; number: number; icon: string }) {
  // eslint-disable-next-line security/detect-object-injection
  const meaning = MEANINGS[number];
  if (!meaning) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-4xl font-bold text-primary font-serif">{number}</p>
          <p className="text-lg font-semibold text-foreground">{icon} {meaning.title}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{meaning.description}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-accent mb-1 font-medium">Strengths</p>
          <ul className="space-y-1">{meaning.strengths.map(s => <li key={s} className="text-xs text-muted-foreground">✦ {s}</li>)}</ul>
        </div>
        <div>
          <p className="text-xs text-destructive mb-1 font-medium">Challenges</p>
          <ul className="space-y-1">{meaning.challenges.map(c => <li key={c} className="text-xs text-muted-foreground">✦ {c}</li>)}</ul>
        </div>
      </div>
    </motion.div>
  );
}

export default function NumerologyPage() {
  const [tab, setTab] = useState('birthdate');
  const [birthdate, setBirthdate] = useState('');
  const [fullName, setFullName] = useState('');
  const [results, setResults] = useState<{ lifePath?: number; destiny?: number; soulUrge?: number; personality?: number } | null>(null);

  function calculate() {
    if (tab === 'birthdate' && birthdate) {
      setResults({ lifePath: calcLifePath(birthdate) });
    } else if (tab === 'name' && fullName.trim()) {
      setResults({
        destiny: calcDestiny(fullName),
        soulUrge: calcSoulUrge(fullName),
        personality: calcPersonality(fullName),
      });
    } else if (tab === 'both' && birthdate && fullName.trim()) {
      setResults({
        lifePath: calcLifePath(birthdate),
        destiny: calcDestiny(fullName),
        soulUrge: calcSoulUrge(fullName),
        personality: calcPersonality(fullName),
      });
    }
  }

  return (
    <>
      <Helmet>
        <title>Numerology Calculator — Spellful</title>
        <meta name="description" content="Discover your Life Path, Destiny, Soul Urge, and Personality numbers. Free numerology calculator with full meanings." />
        <meta property="og:title" content="Numerology Calculator — Spellful" />
        <meta property="og:description" content="Discover your Life Path, Destiny, Soul Urge, and Personality numbers. Free numerology calculator with full meanings." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://spellful.com/numerology" />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Numerology Calculator — Spellful" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Numerology Calculator — Spellful" />
        <meta name="twitter:description" content="Discover your Life Path, Destiny, Soul Urge, and Personality numbers. Free numerology calculator with full meanings." />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta name="twitter:image:alt" content="Numerology Calculator — Spellful" />
      </Helmet>
      <main className="min-h-screen py-16 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Hash className="w-6 h-6" /><Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">Numerology Calculator</h1>
            <p className="text-muted-foreground">Uncover the sacred numbers woven into your name and birthdate</p>
          </motion.div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <Tabs value={tab} onValueChange={v => { setTab(v); setResults(null); }}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="birthdate">Life Path</TabsTrigger>
                <TabsTrigger value="name">Name Numbers</TabsTrigger>
                <TabsTrigger value="both">Full Reading</TabsTrigger>
              </TabsList>
              <TabsContent value="birthdate" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Your Birthdate</Label>
                  <Input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} className="bg-background" />
                </div>
              </TabsContent>
              <TabsContent value="name" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Your Full Birth Name</Label>
                  <Input placeholder="Enter your full name as on birth certificate" value={fullName} onChange={e => setFullName(e.target.value)} className="bg-background" />
                  <p className="text-xs text-muted-foreground">Use the name on your birth certificate for the most accurate reading</p>
                </div>
              </TabsContent>
              <TabsContent value="both" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Your Birthdate</Label>
                  <Input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Your Full Birth Name</Label>
                  <Input placeholder="Enter your full name as on birth certificate" value={fullName} onChange={e => setFullName(e.target.value)} className="bg-background" />
                </div>
              </TabsContent>
            </Tabs>
            <Button onClick={calculate} className="w-full bg-primary text-primary-foreground hover:opacity-90">
              <Sparkles className="w-4 h-4 mr-2" /> Calculate My Numbers
            </Button>
          </div>

          {results && (
            <div className="space-y-4">
              {results.lifePath ? <NumberCard label="Life Path Number" number={results.lifePath} icon="🌙" /> : null}
              {results.destiny ? <NumberCard label="Destiny Number" number={results.destiny} icon="⭐" /> : null}
              {results.soulUrge ? <NumberCard label="Soul Urge Number" number={results.soulUrge} icon="🔮" /> : null}
              {results.personality ? <NumberCard label="Personality Number" number={results.personality} icon="✨" /> : null}
            </div>
          )}
        </div>
      </main>
    </>
  );
}