import { useState } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { ChevronLeft, Plus, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from '@/lib/auth/auth-client';
import { spell_submit } from 'virtual:content';

const INTENTIONS = ['protection', 'love', 'abundance', 'healing', 'clarity', 'banishing', 'divination', 'grounding'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const MOON_PHASES = [
  { value: '', label: 'Any / Not specified' },
  { value: 'new_moon', label: '🌑 New Moon' },
  { value: 'waxing_crescent', label: '🌒 Waxing Crescent' },
  { value: 'first_quarter', label: '🌓 First Quarter' },
  { value: 'waxing_gibbous', label: '🌔 Waxing Gibbous' },
  { value: 'full_moon', label: '🌕 Full Moon' },
  { value: 'waning_gibbous', label: '🌖 Waning Gibbous' },
  { value: 'last_quarter', label: '🌗 Last Quarter' },
  { value: 'waning_moon', label: '🌘 Waning Moon' },
];

interface Step {
  title: string;
  description: string;
}

export default function SubmitSpellPage() {
  const { session, isPending } = useSession();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [intention, setIntention] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [duration, setDuration] = useState('');
  const [moonPhase, setMoonPhase] = useState('');
  const [bestTiming, setBestTiming] = useState('');
  const [materials, setMaterials] = useState<string[]>(['']);
  const [steps, setSteps] = useState<Step[]>([{ title: '', description: '' }]);
  const [safetyNotes, setSafetyNotes] = useState('');
  const [herbs, setHerbs] = useState('');
  const [crystals, setCrystals] = useState('');
  const [elements, setElements] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (isPending) return null;

  if (!session) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <p className="text-lg" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
{spell_submit.signInPrompt}
          </p>
        <Link to="/login?return=/spells/submit">
          <Button style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
            {spell_submit.signInCta}
          </Button>
        </Link>
      </main>
    );
  }

  const addMaterial = () => setMaterials((m) => [...m, '']);
  const removeMaterial = (i: number) => setMaterials((m) => m.filter((_, idx) => idx !== i));
  const updateMaterial = (i: number, v: string) => setMaterials((m) => m.map((x, idx) => idx === i ? v : x));

  const addStep = () => setSteps((s) => [...s, { title: '', description: '' }]);
  const removeStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i));
  const updateStep = (i: number, field: keyof Step, v: string) =>
    setSteps((s) => s.map((x, idx) => idx === i ? { ...x, [field]: v } : x));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanMaterials = materials.filter((m) => m.trim());
    const cleanSteps = steps.filter((s) => s.title.trim() && s.description.trim());

    if (!title.trim()) return setError('Title is required');
    if (!purpose.trim()) return setError('Purpose is required');
    if (!intention) return setError('Intention is required');
    if (!difficulty) return setError('Difficulty is required');
    if (!duration || isNaN(parseInt(duration, 10))) return setError('Duration must be a number');
    if (cleanMaterials.length === 0) return setError('At least one material is required');
    if (cleanSteps.length === 0) return setError('At least one step is required');

    setSubmitting(true);
    const r = await fetch('/api/spells', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        subtitle: subtitle.trim(),
        purpose: purpose.trim(),
        intention,
        difficulty,
        durationMinutes: parseInt(duration, 10),
        moonPhase,
        bestTiming: bestTiming.trim(),
        materials: cleanMaterials,
        steps: cleanSteps.map((s, i) => ({ order: i + 1, title: s.title.trim(), description: s.description.trim() })),
        safetyNotes: safetyNotes.trim(),
        herbCorrespondences: herbs.split(',').map((h) => h.trim()).filter(Boolean),
        crystalCorrespondences: crystals.split(',').map((c) => c.trim()).filter(Boolean),
        elementCorrespondences: elements.split(',').map((e) => e.trim()).filter(Boolean),
      }),
    });

    const data = await r.json() as { error?: string };
    if (!r.ok) {
      setError(data.error ?? 'Submission failed');
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
  };

  if (success) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background px-4">
        <Helmet>
          <title>Spell Submitted — Spellful</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'hsl(var(--primary) / 0.12)' }}
          >
            <Sparkles className="w-7 h-7" style={{ color: 'hsl(var(--primary))' }} />
          </div>
          <h1 className="text-3xl mb-3" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
{spell_submit.successTitle}
            </h1>
          <p className="text-base mb-6" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
            {spell_submit.successDescription}
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/spells"><Button variant="outline">{spell_submit.browseCta}</Button></Link>
            <Button onClick={() => { setSuccess(false); setTitle(''); setPurpose(''); setIntention(''); setDifficulty(''); setDuration(''); setMaterials(['']); setSteps([{ title: '', description: '' }]); }} style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
              {spell_submit.submitAnotherCta}
            </Button>
          </div>
        </motion.div>
      </main>
    );
  }


  return (
    <>
      <Helmet>
        <title>Submit a Spell — Spellful</title>
        <meta name="description" content="Share your original spell with the Spellful community. Submitted spells are reviewed before publication." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="min-h-screen bg-background pb-24">
        <div className="max-w-2xl mx-auto px-4 md:px-8 pt-8">

          <nav aria-label="Breadcrumb" className="mb-6">
            <Link
              to="/spells"
              className="flex items-center gap-1.5 text-sm w-fit"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              <ChevronLeft className="w-3.5 h-3.5" /> {spell_submit.breadcrumb}
            </Link>
          </nav>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl mb-2" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
              {spell_submit.title}
            </h1>
            <p className="text-sm mb-8" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              {spell_submit.description}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

              {/* Basic info */}
              <div
                className="p-5 rounded-xl flex flex-col gap-4"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              >
                <h2 className="text-lg" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>{spell_submit.basicInfoHeading}</h2>

                <div className="flex flex-col gap-1.5">
                  <label style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 500 }}>Spell Title *</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} placeholder="e.g. Candle Spell for Clarity" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 500 }}>Subtitle <span style={{ color: 'hsl(var(--muted-foreground))' }}>(optional)</span></label>
                  <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} maxLength={500} style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} placeholder="A short description of the spell's purpose" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 500 }}>Purpose / Description *</label>
                  <Textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={4} style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} placeholder="Describe what this spell does, when to use it, and what it is intended for." />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 500 }}>Intention *</label>
                    <select value={intention} onChange={(e) => setIntention(e.target.value)} style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', width: '100%', fontSize: '0.875rem' }}>
                      <option value="">Select intention…</option>
                      {INTENTIONS.map((i) => <option key={i} value={i} className="capitalize">{i.charAt(0).toUpperCase() + i.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 500 }}>Difficulty *</label>
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', width: '100%', fontSize: '0.875rem' }}>
                      <option value="">Select difficulty…</option>
                      {DIFFICULTIES.map((d) => <option key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 500 }}>Duration (minutes) *</label>
                    <Input type="number" min="1" max="480" value={duration} onChange={(e) => setDuration(e.target.value)} style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} placeholder="30" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 500 }}>Moon Phase</label>
                    <select value={moonPhase} onChange={(e) => setMoonPhase(e.target.value)} style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', width: '100%', fontSize: '0.875rem' }}>
                      {MOON_PHASES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 500 }}>Best Timing <span style={{ color: 'hsl(var(--muted-foreground))' }}>(optional)</span></label>
                  <Input value={bestTiming} onChange={(e) => setBestTiming(e.target.value)} style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} placeholder="e.g. Saturday, waning moon, dusk" />
                </div>
              </div>

              {/* Materials */}
              <div
                className="p-5 rounded-xl flex flex-col gap-4"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              >
                <h2 className="text-lg" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>{spell_submit.materialsHeading} *</h2>
                {materials.map((m, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={m}
                      onChange={(e) => updateMaterial(i, e.target.value)}
                      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      placeholder={`Material ${i + 1}`}
                      className="flex-1"
                    />
                    {materials.length > 1 && (
                      <Button type="button" variant="outline" size="sm" onClick={() => removeMaterial(i)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addMaterial} className="gap-1.5 w-fit">
                  <Plus className="w-3.5 h-3.5" /> Add Material
                </Button>
              </div>

              {/* Steps */}
              <div
                className="p-5 rounded-xl flex flex-col gap-4"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              >
                <h2 className="text-lg" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>{spell_submit.stepsHeading} *</h2>
                {steps.map((step, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg flex flex-col gap-3"
                    style={{ background: 'hsl(var(--muted) / 0.5)', border: '1px solid hsl(var(--border))' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: 'hsl(var(--primary))' }}>Step {i + 1}</span>
                      {steps.length > 1 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => removeStep(i)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                    <Input
                      value={step.title}
                      onChange={(e) => updateStep(i, 'title', e.target.value)}
                      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      placeholder="Step title (e.g. Light the candle)"
                    />
                    <Textarea
                      value={step.description}
                      onChange={(e) => updateStep(i, 'description', e.target.value)}
                      rows={3}
                      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      placeholder="Describe this step in detail…"
                    />
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addStep} className="gap-1.5 w-fit">
                  <Plus className="w-3.5 h-3.5" /> Add Step
                </Button>
              </div>

              {/* Correspondences & safety */}
              <div
                className="p-5 rounded-xl flex flex-col gap-4"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              >
                <h2 className="text-lg" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>{spell_submit.correspondencesHeading}</h2>
                <div className="flex flex-col gap-1.5">
                  <label style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 500 }}>Herb Correspondences <span style={{ color: 'hsl(var(--muted-foreground))' }}>(comma-separated)</span></label>
                  <Input value={herbs} onChange={(e) => setHerbs(e.target.value)} style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} placeholder="rosemary, lavender, sage" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 500 }}>Crystal Correspondences <span style={{ color: 'hsl(var(--muted-foreground))' }}>(comma-separated)</span></label>
                  <Input value={crystals} onChange={(e) => setCrystals(e.target.value)} style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} placeholder="amethyst, clear quartz" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 500 }}>Elements <span style={{ color: 'hsl(var(--muted-foreground))' }}>(comma-separated)</span></label>
                  <Input value={elements} onChange={(e) => setElements(e.target.value)} style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} placeholder="fire, water, earth, air, spirit" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 500 }}>Safety Notes <span style={{ color: 'hsl(var(--muted-foreground))' }}>(optional but encouraged)</span></label>
                  <Textarea value={safetyNotes} onChange={(e) => setSafetyNotes(e.target.value)} rows={3} style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} placeholder="Any safety considerations, contraindications, or important warnings." />
                </div>
              </div>

              {error && (
                <p className="text-sm" style={{ color: 'hsl(var(--destructive))' }}>{error}</p>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="gap-2 self-start"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              >
                <Sparkles className="w-4 h-4" />
                {submitting ? spell_submit.submittingLabel : spell_submit.submitCta}
              </Button>
            </form>
          </motion.div>
        </div>
      </main>
    </>
  );
}
