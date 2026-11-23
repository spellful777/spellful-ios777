import { useState, useRef, useCallback, useEffect } from 'react';
import MoonNightSky from '@/components/MoonNightSky';
import TwinkleStars from '@/components/TwinkleStars';
import { Helmet } from '@dr.pogodin/react-helmet';
import { birth_chart } from 'virtual:content';
import { calculateChart } from '@/lib/astro-calculator';
import { calculateSynastry } from '@/lib/synastry';
import type { SynastryResult } from '@/lib/synastry';
import type { ChartData, PlanetPosition } from '@/lib/astro-calculator';
import {
  SIGN_INTERPRETATIONS,
  PLANET_INTERPRETATIONS,
  HOUSE_INTERPRETATIONS,
  ASPECT_INTERPRETATIONS,
  SIGN_ELEMENTS,
  SIGN_MODALITIES,
  ELEMENT_DESCRIPTIONS,
} from '@/lib/astro-interpretations';
import DualWheelChart from '@/components/synastry/DualWheelChart';
import CompatibilityScoreCards from '@/components/synastry/CompatibilityScoreCards';
import SynastryNarrative from '@/components/synastry/SynastryNarrative';
import { useSession } from '@/lib/auth/auth-client';
import ShareBar from '@/components/ShareBar';

interface SavedPartner {
  id: number;
  partnerName: string;
  birthDate: string;
  birthCity: string;
  scores: { love: number; stability: number; sexual: number; communication: number; longterm: number; overall: number };
  summary: string;
  createdAt: string;
}

const TIMEZONES = [
  { label: 'UTC-12:00 (Baker Island)', value: -12 },
  { label: 'UTC-11:00 (Samoa)', value: -11 },
  { label: 'UTC-10:00 (Hawaii)', value: -10 },
  { label: 'UTC-09:00 (Alaska)', value: -9 },
  { label: 'UTC-08:00 (Pacific Time)', value: -8 },
  { label: 'UTC-07:00 (Mountain Time)', value: -7 },
  { label: 'UTC-06:00 (Central Time)', value: -6 },
  { label: 'UTC-05:00 (Eastern Time)', value: -5 },
  { label: 'UTC-04:00 (Atlantic Time)', value: -4 },
  { label: 'UTC-03:00 (Buenos Aires)', value: -3 },
  { label: 'UTC-02:00 (Mid-Atlantic)', value: -2 },
  { label: 'UTC-01:00 (Azores)', value: -1 },
  { label: 'UTC+00:00 (London / GMT)', value: 0 },
  { label: 'UTC+01:00 (Paris / Berlin)', value: 1 },
  { label: 'UTC+02:00 (Cairo / Athens)', value: 2 },
  { label: 'UTC+03:00 (Moscow / Istanbul)', value: 3 },
  { label: 'UTC+04:00 (Dubai)', value: 4 },
  { label: 'UTC+05:00 (Karachi)', value: 5 },
  { label: 'UTC+05:30 (India)', value: 5.5 },
  { label: 'UTC+06:00 (Dhaka)', value: 6 },
  { label: 'UTC+07:00 (Bangkok)', value: 7 },
  { label: 'UTC+08:00 (Beijing / Singapore)', value: 8 },
  { label: 'UTC+09:00 (Tokyo / Seoul)', value: 9 },
  { label: 'UTC+10:00 (Sydney)', value: 10 },
  { label: 'UTC+11:00 (Solomon Islands)', value: 11 },
  { label: 'UTC+12:00 (Auckland)', value: 12 },
];

const PLANET_KEYS = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'] as const;
type PlanetKey = typeof PLANET_KEYS[number];

// All colors via CSS variables
const SIGN_COLOR_VARS: Record<string, string> = {
  Aries: 'hsl(var(--astro-aries))', Taurus: 'hsl(var(--astro-taurus))',
  Gemini: 'hsl(var(--astro-gemini))', Cancer: 'hsl(var(--astro-cancer))',
  Leo: 'hsl(var(--astro-leo))', Virgo: 'hsl(var(--astro-virgo))',
  Libra: 'hsl(var(--astro-libra))', Scorpio: 'hsl(var(--astro-scorpio))',
  Sagittarius: 'hsl(var(--astro-sagittarius))', Capricorn: 'hsl(var(--astro-capricorn))',
  Aquarius: 'hsl(var(--astro-aquarius))', Pisces: 'hsl(var(--astro-pisces))',
};

const ELEMENT_COLOR_VARS: Record<string, string> = {
  Fire: 'hsl(var(--astro-fire))', Earth: 'hsl(var(--astro-earth))',
  Air: 'hsl(var(--astro-air))', Water: 'hsl(var(--astro-water))',
};

const PLANET_COLOR_VARS: Record<PlanetKey, string> = {
  sun: 'hsl(var(--astro-sun))', moon: 'hsl(var(--astro-moon))',
  mercury: 'hsl(var(--astro-mercury))', venus: 'hsl(var(--astro-venus))',
  mars: 'hsl(var(--astro-mars))', jupiter: 'hsl(var(--astro-jupiter))',
  saturn: 'hsl(var(--astro-saturn))', uranus: 'hsl(var(--astro-uranus))',
  neptune: 'hsl(var(--astro-neptune))', pluto: 'hsl(var(--astro-pluto))',
};

const ASPECT_NATURE_VARS: Record<string, string> = {
  Harmonious: 'hsl(var(--astro-taurus))', Flowing: 'hsl(var(--astro-water))',
  Intense: 'hsl(var(--astro-sun))', Challenging: 'hsl(var(--astro-mars))',
  Polarizing: 'hsl(var(--astro-pluto))', Adjusting: 'hsl(var(--astro-saturn))',
};

function ChartWheel({ chart }: { chart: ChartData }) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 140;
  const signR = 120;
  const innerR = 90;
  const planetR = 70;
  const signSymbols = ['\u2648','\u2649','\u264A','\u264B','\u264C','\u264D','\u264E','\u264F','\u2650','\u2651','\u2652','\u2653'];
  const signNames = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

  function toRad(d: number) { return d * Math.PI / 180; }
  function norm360(d: number) { return ((d % 360) + 360) % 360; }
  function chartAngle(lon: number) { return norm360(lon - chart.ascendant.longitude + 180); }

  const planets: { key: PlanetKey; symbol: string }[] = [
    { key: 'sun', symbol: '\u2609' }, { key: 'moon', symbol: '\u263D' },
    { key: 'mercury', symbol: '\u263F' }, { key: 'venus', symbol: '\u2640' },
    { key: 'mars', symbol: '\u2642' }, { key: 'jupiter', symbol: '\u2643' },
    { key: 'saturn', symbol: '\u2644' }, { key: 'uranus', symbol: '\u2645' },
    { key: 'neptune', symbol: '\u2646' }, { key: 'pluto', symbol: '\u2647' },
  ];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: '100%' }}>
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="hsl(var(--border))" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={signR} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="hsl(var(--border))" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={planetR - 10} fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="0.5" />
      {Array.from({ length: 12 }, (_, i) => {
        const startAngle = chartAngle(i * 30) - 90;
        const startRad = toRad(startAngle);
        const x1 = cx + outerR * Math.cos(startRad);
        const y1 = cy + outerR * Math.sin(startRad);
        const x2 = cx + signR * Math.cos(startRad);
        const y2 = cy + signR * Math.sin(startRad);
        const midAngle = chartAngle(i * 30 + 15) - 90;
        const midRad = toRad(midAngle);
        const symR = (outerR + signR) / 2;
        const sx = cx + symR * Math.cos(midRad);
        const sy = cy + symR * Math.sin(midRad);
        // eslint-disable-next-line security/detect-object-injection
        const col = SIGN_COLOR_VARS[signNames[i]];
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--border))" strokeWidth="0.5" />
            {/* eslint-disable-next-line security/detect-object-injection */}
            <text x={sx} y={sy} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill={col} style={{ fontFamily: 'serif' }}>{signSymbols[i]}</text>
          </g>
        );
      })}
      {chart.houses.map((houseLon, i) => {
        const angle = chartAngle(houseLon) - 90;
        const rad = toRad(angle);
        const x1 = cx + innerR * Math.cos(rad);
        const y1 = cy + innerR * Math.sin(rad);
        const x2 = cx + (planetR - 10) * Math.cos(rad);
        const y2 = cy + (planetR - 10) * Math.sin(rad);
        const isAngular = [0,3,6,9].includes(i);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={isAngular ? 'hsl(var(--primary))' : 'hsl(var(--border))'} strokeWidth={isAngular ? 1.5 : 0.5} />;
      })}
      {chart.houses.map((houseLon, i) => {
        // eslint-disable-next-line security/detect-object-injection
        const nextLon = chart.houses[(i + 1) % 12];
        const midLon = houseLon + norm360(nextLon - houseLon) / 2;
        const angle = chartAngle(midLon) - 90;
        const rad = toRad(angle);
        const r = (innerR + planetR - 10) / 2;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);
        return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="hsl(var(--muted-foreground))" style={{ fontFamily: 'var(--font-sans)' }}>{i + 1}</text>;
      })}
      {planets.map(({ key, symbol }) => {
        // eslint-disable-next-line security/detect-object-injection
        const pos = chart[key] as PlanetPosition;
        const angle = chartAngle(pos.longitude) - 90;
        const rad = toRad(angle);
        const r = planetR - 22;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);
        // eslint-disable-next-line security/detect-object-injection
        const color = PLANET_COLOR_VARS[key];
        return (
          <g key={key}>
            <circle cx={x} cy={y} r={9} fill="hsl(var(--card))" stroke={color} strokeWidth="1" />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill={color} style={{ fontFamily: 'serif' }}>{symbol}</text>
          </g>
        );
      })}
      <text x={cx - outerR + 4} y={cy + 4} textAnchor="middle" fontSize="8" fill="hsl(var(--primary))" style={{ fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>ASC</text>
    </svg>
  );
}

function PlanetRow({ label, symbol, pos }: { label: string; symbol: string; pos: PlanetPosition }) {
  const signColor = SIGN_COLOR_VARS[pos.sign] || 'hsl(var(--foreground))';
  return (
    <div className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
      <span className="text-lg w-6 text-center" style={{ color: 'hsl(var(--primary))' }}>{symbol}</span>
      <span className="text-sm w-20 shrink-0" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{label}</span>
      <span className="text-sm font-medium flex-1" style={{ color: signColor, fontFamily: 'var(--font-sans)' }}>
        {pos.degree}\u00b0 {pos.sign} {pos.minute > 0 ? `${pos.minute}'` : ''}
        {pos.retrograde && <span className="ml-1 text-xs" style={{ color: 'hsl(var(--accent))' }}>\u211e</span>}
      </span>
      <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>H{pos.house}</span>
    </div>
  );
}

export default function BirthChartPage() {
  const [form, setForm] = useState({
    name: '', year: '', month: '', day: '',
    hour: '12', minute: '0', city: '', lat: '', lon: '', utcOffset: -7,
  });
  const [chart, setChart] = useState<ChartData | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'planets' | 'houses' | 'aspects' | 'elements' | 'connection'>('planets');
  const [expandedPlanet, setExpandedPlanet] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [partnerForm, setPartnerForm] = useState({
    name: '', year: '', month: '', day: '',
    hour: '12', minute: '0', city: '', lat: '', lon: '', utcOffset: -7,
  });
  const [partnerChart, setPartnerChart] = useState<ChartData | null>(null);
  const [partnerGeocoding, setPartnerGeocoding] = useState(false);
  const [partnerGeocodeError, setPartnerGeocodeError] = useState('');
  const [partnerError, setPartnerError] = useState('');
  const [synastry, setSynastry] = useState<SynastryResult | null>(null);

  // Saved partners
  const { isAuthenticated } = useSession();
  const [savedPartners, setSavedPartners] = useState<SavedPartner[]>([]);
  const [savingPartner, setSavingPartner] = useState(false);
  const [partnerSaved, setPartnerSaved] = useState(false);
  const [showSavedPartners, setShowSavedPartners] = useState(false);
  const [synastryTab, setSynastryTab] = useState<'analysis' | 'wheel' | 'patterns' | 'timing'>('analysis');
  const [expandedScore, setExpandedScore] = useState<string | null>(null);

  // Birth Chart 2.0 — mode selector, unknown time, chapter nav, layered interpretations
  const [chartMode, setChartMode] = useState<'natal' | 'synastry' | 'transit' | 'composite'>('natal');
  const [unknownTime, setUnknownTime] = useState(false);
  const [activeChapter, setActiveChapter] = useState<string>('overview');
  const [expandedAspectLayer, setExpandedAspectLayer] = useState<number | null>(null);
  const chapterRefs = useRef<Record<string, HTMLElement | null>>({});

  // Transit mode state
  const [transitDate, setTransitDate] = useState(() => {
    const t = new Date();
    return { year: String(t.getFullYear()), month: String(t.getMonth() + 1), day: String(t.getDate()) };
  });
  const [transitChart, setTransitChart] = useState<ChartData | null>(null);
  const [transitLoading, setTransitLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/synastry-partners', { credentials: 'include' })
      .then(r => r.json())
      .then((data: SavedPartner[]) => setSavedPartners(data))
      .catch(() => {/* silent */});
  }, [isAuthenticated]);

  // Chapter scroll-spy
  useEffect(() => {
    if (!chart) return;
    const entries = Object.entries(chapterRefs.current);
    if (entries.length === 0) return;
    const observer = new IntersectionObserver(
      (obs) => {
        const visible = obs.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          const top = visible.reduce((a, b) => a.boundingClientRect.top < b.boundingClientRect.top ? a : b);
          setActiveChapter(top.target.getAttribute('data-chapter') ?? 'overview');
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );
    entries.forEach(([, el]) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [chart]);

  async function savePartner() {
    if (!synastry || !partnerChart || !partnerForm.city) return;
    setSavingPartner(true);
    try {
      const body = {
        partnerName: partnerForm.name || 'Partner',
        birthDate: `${partnerForm.year}-${String(partnerForm.month).padStart(2,'0')}-${String(partnerForm.day).padStart(2,'0')}`,
        birthTime: `${String(partnerForm.hour).padStart(2,'0')}:${String(partnerForm.minute).padStart(2,'0')}`,
        birthCity: partnerForm.city,
        lat: partnerForm.lat,
        lon: partnerForm.lon,
        utcOffset: String(partnerForm.utcOffset),
        scores: synastry.scores,
        summary: synastry.summary,
      };
      const res = await fetch('/api/synastry-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const { id } = await res.json() as { id: number };
        setSavedPartners(prev => [{
          id,
          partnerName: body.partnerName,
          birthDate: body.birthDate,
          birthCity: body.birthCity,
          scores: synastry.scores,
          summary: synastry.summary,
          createdAt: new Date().toISOString(),
        }, ...prev]);
        setPartnerSaved(true);
        setTimeout(() => setPartnerSaved(false), 3000);
      }
    } catch {/* silent */}
    setSavingPartner(false);
  }

  async function deletePartner(id: number) {
    await fetch(`/api/synastry-partners/${id}`, { method: 'DELETE', credentials: 'include' });
    setSavedPartners(prev => prev.filter(p => p.id !== id));
  }

  const ogImageUrl = useCallback(() => {
    if (!chart) return '';
    const base = 'https://spellful.com/api/birth-chart/og-image';
    const params = new URLSearchParams({
      sun: chart.sun.sign,
      moon: chart.moon.sign,
      rising: chart.ascendant.sign,
      ...(form.name ? { name: form.name } : {}),
    });
    return `${base}?${params.toString()}`;
  }, [chart, form.name]);

  const shareUrl = 'https://spellful.com/birth-chart';

  function getShareTagline() {
    if (!chart) return '';
    const name = form.name ? `${form.name}'s` : 'My';
    return `${name} Big Three: ☉ ${chart.sun.sign} · ☽ ${chart.moon.sign} · ↑ ${chart.ascendant.sign} — Cast your natal chart at Spellful ✨`;
  }

  function trackBirthChartShare(platform: string) {
    void fetch('/api/birth-chart/share', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    });
  }

  function copyLink() {
    trackBirthChartShare('copy');
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function shareToX() {
    trackBirthChartShare('x');
    const text = encodeURIComponent(getShareTagline());
    const url = encodeURIComponent(shareUrl);
    window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener');
  }

  function shareToFacebook() {
    trackBirthChartShare('facebook');
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener');
  }

  function shareToLinkedIn() {
    trackBirthChartShare('linkedin');
    const url = encodeURIComponent(shareUrl);
    const title = encodeURIComponent(getShareTagline());
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, '_blank', 'noopener');
  }

  function shareToInstagram() {
    trackBirthChartShare('instagram');
    // Instagram doesn't support direct URL sharing — copy to clipboard instead
    navigator.clipboard.writeText(`${getShareTagline()} ${shareUrl}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setGeocodeError('');
    const year = parseInt(form.year);
    const month = parseInt(form.month);
    const day = parseInt(form.day);
    const hour = unknownTime ? 12 : parseInt(form.hour);
    const minute = unknownTime ? 0 : parseInt(form.minute);
    if (!year || !month || !day || !form.city.trim()) {
      setError('Please fill in date and birth city.');
      return;
    }
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      setError('Please enter a valid date.');
      return;
    }
    setGeocoding(true);
    let lat: number;
    let lon: number;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.city)}&format=json&limit=1`);
      const data = await res.json() as { lat: string; lon: string }[];
      if (!data || data.length === 0) {
        setGeocodeError(`Could not find "${form.city}". Try adding the country, e.g. "Paris, France".`);
        setGeocoding(false);
        return;
      }
      lat = parseFloat(data[0].lat);
      lon = parseFloat(data[0].lon);
      setForm(f => ({ ...f, lat: String(lat.toFixed(4)), lon: String(lon.toFixed(4)) }));
    } catch {
      setGeocodeError('Location lookup failed. Please check your connection and try again.');
      setGeocoding(false);
      return;
    }
    setGeocoding(false);
    try {
      const result = calculateChart(year, month, day, hour, minute, lat, lon, Number(form.utcOffset));
      setChart(result);
      setActiveTab('planets');
      setExpandedPlanet(null);
      setTimeout(() => { chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
    } catch {
      setError('Could not calculate chart. Please check your inputs.');
    }
  }

  function getElementCounts() {
    if (!chart) return {} as Record<string, number>;
    const counts: Record<string, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
    PLANET_KEYS.forEach(k => {
      // eslint-disable-next-line security/detect-object-injection
      const sign = (chart[k] as PlanetPosition).sign;
      // eslint-disable-next-line security/detect-object-injection
      const el = SIGN_ELEMENTS[sign];
      // eslint-disable-next-line security/detect-object-injection
      if (el) counts[el]++;
    });
    return counts;
  }

  function getModalityCounts() {
    if (!chart) return {} as Record<string, number>;
    const counts: Record<string, number> = { Cardinal: 0, Fixed: 0, Mutable: 0 };
    PLANET_KEYS.forEach(k => {
      // eslint-disable-next-line security/detect-object-injection
      const sign = (chart[k] as PlanetPosition).sign;
      // eslint-disable-next-line security/detect-object-injection
      const mod = SIGN_MODALITIES[sign];
      // eslint-disable-next-line security/detect-object-injection
      if (mod) counts[mod]++;
    });
    return counts;
  }

  function getDominantElement() {
    const counts = getElementCounts();
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Fire';
  }

  function downloadChart() {
    if (!chart) return;
    const name = form.name || 'Birth Chart';
    const date = `${form.year}-${String(form.month).padStart(2,'0')}-${String(form.day).padStart(2,'0')}`;
    const time = `${String(form.hour).padStart(2,'0')}:${String(form.minute).padStart(2,'0')}`;
    const lines: string[] = [
      '='.repeat(56),
      `NATAL BIRTH CHART -- ${name.toUpperCase()}`,
      '='.repeat(56),
      '',
      `Date: ${date}  Time: ${time}  Location: ${form.lat}, ${form.lon}`,
      '',
      '--- PLANETARY POSITIONS ---',
      '',
    ];
    PLANET_KEYS.forEach(k => {
      // eslint-disable-next-line security/detect-object-injection
      const pos = chart[k] as PlanetPosition;
      // eslint-disable-next-line security/detect-object-injection
      const interp = PLANET_INTERPRETATIONS[k];
      lines.push(`${interp.symbol} ${interp.title.padEnd(10)} ${pos.degree}deg ${pos.sign.padEnd(13)} House ${pos.house}${pos.retrograde ? ' Rx' : ''}`);
    });
    lines.push(`ASC Ascendant  ${chart.ascendant.degree}deg ${chart.ascendant.sign.padEnd(13)} House 1`);
    lines.push(`MC  Midheaven  ${chart.midheaven.degree}deg ${chart.midheaven.sign.padEnd(13)} House 10`);
    lines.push('', '--- INTERPRETATIONS ---', '');
    PLANET_KEYS.forEach(k => {
      // eslint-disable-next-line security/detect-object-injection
      const pos = chart[k] as PlanetPosition;
      // eslint-disable-next-line security/detect-object-injection
      const interp = PLANET_INTERPRETATIONS[k];
      // eslint-disable-next-line security/detect-object-injection
      const signInterp = SIGN_INTERPRETATIONS[pos.sign];
      lines.push(`== ${interp.title} in ${pos.sign} ==`);
      lines.push(interp.meaning);
      lines.push('');
      lines.push(`${pos.sign}: ${signInterp.description}`);
      if (signInterp.shadow) lines.push(`Shadow: ${signInterp.shadow}`);
      lines.push('');
    });
    lines.push('--- ASPECTS ---', '');
    chart.aspects.slice(0, 20).forEach(asp => {
      const aspInterp = ASPECT_INTERPRETATIONS[asp.type];
      lines.push(`${asp.planet1} ${asp.type} ${asp.planet2} (orb: ${asp.orb}deg) -- ${aspInterp?.nature || ''}`);
      if (aspInterp?.meaning) lines.push(`  ${aspInterp.meaning}`);
    });
    lines.push('', '--- ELEMENT BALANCE ---', '');
    const elCounts = getElementCounts();
    Object.entries(elCounts).forEach(([el, count]) => {
      // eslint-disable-next-line security/detect-object-injection
      lines.push(`${el}: ${count} planets -- ${ELEMENT_DESCRIPTIONS[el]}`);
    });
    lines.push('', 'Generated by Spellful -- spellful.com');
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\s+/g, '-').toLowerCase() || 'birth'}-chart.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const elementCounts = getElementCounts();
  const modalityCounts = getModalityCounts();
  const dominantElement = getDominantElement();

  // Transit calculation
  function calculateTransits() {
    if (!chart) return;
    setTransitLoading(true);
    try {
      const y = parseInt(transitDate.year);
      const mo = parseInt(transitDate.month);
      const d = parseInt(transitDate.day);
      if (!y || !mo || !d) return;
      const tc = calculateChart(y, mo, d, 12, 0, parseFloat(form.lat) || 0, parseFloat(form.lon) || 0, 0);
      setTransitChart(tc);
    } catch {/* silent */}
    setTransitLoading(false);
  }

  // Compute transit hits: transiting planet aspecting natal planet
  function getTransitHits() {
    if (!chart || !transitChart) return [];
    const hits: { transitPlanet: string; natalPlanet: string; type: string; orb: number; nature: string; meaning: string }[] = [];
    const ORB = 3;
    const ASPECT_ANGLES: Record<string, number> = { Conjunction: 0, Sextile: 60, Square: 90, Trine: 120, Opposition: 180 };
    PLANET_KEYS.forEach(tk => {
      // eslint-disable-next-line security/detect-object-injection
      const tPos = transitChart[tk] as PlanetPosition;
      PLANET_KEYS.forEach(nk => {
        // eslint-disable-next-line security/detect-object-injection
        const nPos = chart[nk] as PlanetPosition;
        Object.entries(ASPECT_ANGLES).forEach(([aspType, angle]) => {
          const diff = Math.abs(((tPos.longitude - nPos.longitude + 540) % 360) - 180);
          const orb = Math.abs(diff - angle);
          if (orb <= ORB) {
            const aspInterp = ASPECT_INTERPRETATIONS[aspType];
            hits.push({
              transitPlanet: tk,
              natalPlanet: nk,
              type: aspType,
              orb: Math.round(orb * 10) / 10,
              nature: aspInterp?.nature || '',
              meaning: aspInterp?.meaning || '',
            });
          }
        });
      });
    });
    return hits.sort((a, b) => a.orb - b.orb).slice(0, 20);
  }

  // CSS style applied to all form inputs

  return (
    <>
      <Helmet>
        <title>{chart && form.name ? `${form.name}'s Birth Chart — Spellful` : 'Birth Chart Calculator — Spellful'}</title>
        <meta name="description" content={chart ? `${form.name ? form.name + "'s" : 'Your'} natal chart: ☉ ${chart.sun.sign} · ☽ ${chart.moon.sign} · ↑ ${chart.ascendant.sign}. Discover your planetary positions, houses, and astrological interpretations.` : 'Calculate your full natal birth chart. Enter your birth date, time, and location to reveal your planetary positions, houses, aspects, and personalized astrological interpretations.'} />
        <link rel="canonical" href="https://spellful.com/birth-chart" />
        <meta property="og:title" content={chart ? `${form.name ? form.name + "'s" : 'My'} Big Three: ☉ ${chart.sun.sign} · ☽ ${chart.moon.sign} · ↑ ${chart.ascendant.sign} — Spellful` : 'Birth Chart Calculator — Spellful'} />
        <meta property="og:description" content={chart ? `Cast your natal chart at Spellful. Sun in ${chart.sun.sign}, Moon in ${chart.moon.sign}, ${chart.ascendant.sign} Rising.` : 'Reveal your natal chart — planetary positions, houses, aspects, and deep astrological interpretations.'} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://spellful.com/birth-chart" />
        <meta property="og:image" content={chart ? ogImageUrl() : 'https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png'} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={chart ? `${form.name ? form.name + "'s" : 'My'} Birth Chart — Spellful` : 'Birth Chart Calculator — Spellful'} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={chart ? `${form.name ? form.name + "'s" : 'My'} Big Three: ☉ ${chart.sun.sign} · ☽ ${chart.moon.sign} · ↑ ${chart.ascendant.sign} — Spellful` : 'Birth Chart Calculator — Spellful'} />
        <meta name="twitter:description" content={chart ? `Cast your natal chart at Spellful. Sun in ${chart.sun.sign}, Moon in ${chart.moon.sign}, ${chart.ascendant.sign} Rising.` : 'Reveal your natal chart — planetary positions, houses, aspects, and deep astrological interpretations.'} />
        <meta name="twitter:image" content={chart ? ogImageUrl() : 'https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png'} />
        <meta name="twitter:image:alt" content={chart ? `${form.name ? form.name + "'s" : 'My'} Birth Chart — Spellful` : 'Birth Chart Calculator — Spellful'} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          '@id': 'https://spellful.com/birth-chart#webpage',
          name: 'Birth Chart Calculator — Spellful',
          url: 'https://spellful.com/birth-chart',
          description: 'Free natal birth chart calculator. Enter your birth date, time, and location to reveal planetary positions, houses, aspects, and astrological interpretations.',
          applicationCategory: 'LifestyleApplication',
          isPartOf: { '@id': 'https://spellful.com/#website' },
          about: { '@id': 'https://spellful.com/#organization' },
          keywords: 'birth chart calculator, natal chart, astrology, planetary positions, ascendant, midheaven, free birth chart',
        }).replace(/</g, '\u003c')}</script>
      </Helmet>

      <main>
        {/* HERO */}
        <section className="relative py-xxxl text-center overflow-hidden" style={{ background: 'linear-gradient(to bottom, hsl(var(--background)), hsl(var(--card)))' }}>
          <MoonNightSky moonPosition="top-right" moonSize={76} opacity={0.65} shootingStars={true} />
          <TwinkleStars count={36} opacity={0.45} />
          <div className="relative max-w-content mx-auto px-base">
            <p className="text-sm tracking-widest uppercase mb-4" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}>{birth_chart.hero.eyebrow}</p>
            <h1 className="text-5xl md:text-7xl mb-6" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{birth_chart.hero.title}</h1>
            <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              {birth_chart.hero.subtitle}
            </p>
          </div>
        </section>

        {/* ── Mode Selector ── */}
        <div className="flex justify-center py-5 border-b border-border" style={{ background: 'hsl(var(--card))' }}>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
            {([
              { key: 'natal',     label: 'Natal',     glyph: '☉' },
              { key: 'synastry',  label: 'Synastry',  glyph: '♡' },
              { key: 'transit',   label: 'Transits',  glyph: '⟳' },
              { key: 'composite', label: 'Composite', glyph: '⊕' },
            ] as { key: 'natal' | 'synastry' | 'transit' | 'composite'; label: string; glyph: string }[]).map(({ key, label, glyph }) => (
              <button
                key={key}
                onClick={() => { setChartMode(key); setChart(null); setSynastry(null); setPartnerChart(null); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                style={{
                  fontFamily: 'var(--font-sans)',
                  background: chartMode === key ? 'hsl(var(--card))' : 'transparent',
                  color: chartMode === key ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                  boxShadow: chartMode === key ? '0 1px 4px hsl(var(--background) / 0.6)' : 'none',
                }}
              >
                <span>{glyph}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FORM */}
        <section className="py-xxl" style={{ background: 'hsl(var(--background))' }}>
          <div className="max-w-content mx-auto px-base">
            <div className="max-w-2xl mx-auto rounded-2xl p-8 md:p-12" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <h2 className="text-3xl mb-2 text-center" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{birth_chart.form.title}</h2>
              <p className="text-sm text-center mb-8" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{birth_chart.form.subtitle}</p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}>Name (optional)</label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="Your name" className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }} />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}>Birth Date *</label>
                  <div className="grid grid-cols-3 gap-3">
                    <select name="month" value={form.month} onChange={handleChange} className="w-full px-3 py-3 rounded-lg text-sm outline-none" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: form.month ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                      <option value="">Month</option>
                      {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                        <option key={m} value={i + 1}>{m}</option>
                      ))}
                    </select>
                    <select name="day" value={form.day} onChange={handleChange} className="w-full px-3 py-3 rounded-lg text-sm outline-none" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: form.day ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                      <option value="">Day</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <input name="year" value={form.year} onChange={handleChange} placeholder="Year" type="number" min="1900" max="2100" className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs tracking-widest uppercase" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}>Birth Time</label>
                    <button
                      type="button"
                      onClick={() => {
                        setUnknownTime(v => !v);
                        if (!unknownTime) setForm(f => ({ ...f, hour: '12', minute: '0' }));
                      }}
                      className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80"
                      style={{ color: unknownTime ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
                    >
                      <span className="w-8 h-4 rounded-full flex items-center transition-all duration-200 px-0.5" style={{ background: unknownTime ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}>
                        <span className="w-3 h-3 rounded-full bg-white transition-transform duration-200" style={{ transform: unknownTime ? 'translateX(16px)' : 'translateX(0)' }} />
                      </span>
                      Unknown time
                    </button>
                  </div>
                  {unknownTime ? (
                    <div className="px-4 py-3 rounded-lg text-sm" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                      Using noon (12:00) — house positions and Rising sign will be approximate
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <select name="hour" value={form.hour} onChange={handleChange} className="w-full px-3 py-3 rounded-lg text-sm outline-none" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                        ))}
                      </select>
                      <select name="minute" value={form.minute} onChange={handleChange} className="w-full px-3 py-3 rounded-lg text-sm outline-none" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                        {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                          <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}>Timezone *</label>
                  <select name="utcOffset" value={form.utcOffset} onChange={handleChange} className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                    {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}>Birth City *</label>
                  <input name="city" value={form.city} onChange={handleChange} placeholder="e.g. New York, London, Sydney" className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }} />
                  <p className="text-xs mt-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Include country for smaller cities, e.g. "Cork, Ireland"</p>
                  {geocodeError && (
                    <p className="text-xs mt-2" style={{ color: 'hsl(var(--astro-error))', fontFamily: 'var(--font-sans)' }}>{geocodeError}</p>
                  )}
                  {form.lat && form.lon && (
                    <p className="text-xs mt-1" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}>Located: {parseFloat(form.lat).toFixed(4)}°, {parseFloat(form.lon).toFixed(4)}°</p>
                  )}
                </div>
                {error && (
                  <p className="text-sm text-center py-3 rounded-lg" style={{ color: 'hsl(var(--astro-error))', background: 'hsl(var(--background))', border: '1px solid hsl(var(--astro-error))', fontFamily: 'var(--font-sans)' }}>{error}</p>
                )}
                <button type="submit" className="w-full py-4 rounded-xl text-sm tracking-widest uppercase transition-all duration-300"
                  style={{ background: 'hsl(var(--primary) / 0.15)', border: '1px solid hsl(var(--primary) / 0.5)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--primary) / 0.25)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 24px hsl(var(--primary) / 0.3)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--primary) / 0.15)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}>
                  {geocoding ? 'Locating city…' : 'Reveal My Chart'}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* CHART RESULTS */}
        {chart && (
          <section ref={chartRef} className="py-xxl" style={{ background: 'hsl(var(--card))' }}>
            <div className="max-w-content mx-auto px-base">
              <div className="text-center mb-12">
                <p className="text-sm tracking-widest uppercase mb-3" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}>Natal Chart</p>
                <h2 className="text-4xl md:text-5xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                  {form.name ? `${form.name}'s Chart` : 'Your Celestial Map'}
                </h2>
                <p className="text-sm mb-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  {form.month}/{form.day}/{form.year} at {String(form.hour).padStart(2,'0')}:{String(form.minute).padStart(2,'0')}
                </p>
                <a
                  href="/astronomical-accuracy#birth-chart"
                  className="text-xs underline opacity-50 hover:opacity-90 transition-opacity block mb-6"
                  style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
                >
                  How we calculate this →
                </a>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button onClick={downloadChart} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs tracking-widest uppercase transition-all duration-300"
                    style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--primary) / 0.4)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 16px hsl(var(--primary) / 0.25)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}>
                    Download Full Chart
                  </button>
                  <button onClick={() => setShowShareModal(true)} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs tracking-widest uppercase transition-all duration-300"
                    style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--background))', fontFamily: 'var(--font-sans)', letterSpacing: '0.15em', border: 'none' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 24px hsl(var(--primary) / 0.45)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    Share My Chart
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('connection');
                      setTimeout(() => { tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs tracking-widest uppercase transition-all duration-300"
                    style={{ background: 'hsl(var(--accent) / 0.15)', border: '1px solid hsl(var(--accent) / 0.5)', color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 16px hsl(var(--accent) / 0.3)'; (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--accent) / 0.25)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--accent) / 0.15)'; }}>
                    ♡ Add Partner
                  </button>
                </div>
              </div>

              {/* Big 3 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {([
                  { label: 'Sun Sign', symbol: '\u2609', pos: chart.sun, desc: 'Your core identity' },
                  { label: 'Moon Sign', symbol: '\u263D', pos: chart.moon, desc: 'Your emotional nature' },
                  { label: 'Rising Sign', symbol: '\u2191', pos: chart.ascendant, desc: 'How the world sees you' },
                ] as { label: string; symbol: string; pos: PlanetPosition; desc: string }[])
                .filter((_, idx) => idx < 2 || !unknownTime)
                .map(({ label, symbol, pos, desc }) => {
                  const signColor = SIGN_COLOR_VARS[pos.sign] || 'hsl(var(--foreground))';
                  const signInterp = SIGN_INTERPRETATIONS[pos.sign];
                  return (
                    <div key={label} className="rounded-2xl p-6 text-center" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}>
                      <div className="text-4xl mb-2" style={{ color: 'hsl(var(--primary))' }}>{symbol}</div>
                      <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}>{label}</p>
                      <h3 className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)', color: signColor }}>{pos.sign}</h3>
                      <p className="text-sm mb-3" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{desc}</p>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {signInterp?.keywords.slice(0, 3).map(kw => (
                          <span key={kw} className="text-xs px-2 py-1 rounded-full" style={{ background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{kw}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {unknownTime && (
                <div className="mb-8 px-4 py-3 rounded-xl flex items-start gap-3" style={{ background: 'hsl(var(--accent) / 0.1)', border: '1px solid hsl(var(--accent) / 0.3)' }}>
                  <span style={{ color: 'hsl(var(--accent))' }}>✦</span>
                  <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    <span style={{ color: 'hsl(var(--accent))' }}>Unknown birth time: </span>
                    Using noon (12:00). Rising sign and house placements are approximate. Planetary sign positions are accurate.
                  </p>
                </div>
              )}

              {/* Wheel + Planets */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                <div className="rounded-2xl p-6 flex flex-col items-center" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}>
                  <h3 className="text-xl mb-4 text-center" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>Natal Wheel</h3>
                  <ChartWheel chart={chart} />
                  <p className="text-xs mt-4 text-center" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>ASC on left · Houses 1–12 · Planets by symbol</p>
                </div>
                <div className="rounded-2xl p-6" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}>
                  <h3 className="text-xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>Planetary Positions</h3>
                  {PLANET_KEYS.map(k => {
                    // eslint-disable-next-line security/detect-object-injection
                    const interp = PLANET_INTERPRETATIONS[k];
                    return <PlanetRow key={k} label={interp.title} symbol={interp.symbol} pos={
                      // eslint-disable-next-line security/detect-object-injection
                      chart[k] as PlanetPosition} />;
                  })}
                  <PlanetRow label="Ascendant" symbol="\u2191" pos={chart.ascendant} />
                  <PlanetRow label="Midheaven" symbol="MC" pos={chart.midheaven} />
                </div>
              </div>

              {/* ── Share ── */}
              <div className="mb-8 flex justify-center">
                <ShareBar
                  url="https://spellful.com/birth-chart"
                  text={getShareTagline()}
                  label="Share your birth chart"
                />
              </div>

              {/* ── Chapter Nav ── */}
              <div
                className="sticky top-0 z-10 -mx-8 md:-mx-12 px-8 md:px-12 py-3 mb-8 flex gap-1 overflow-x-auto scrollbar-none"
                style={{ background: 'hsl(var(--card) / 0.96)', backdropFilter: 'blur(12px)', borderBottom: '1px solid hsl(var(--border))' }}
              >
                {([
                  { id: 'overview',  label: 'Overview',  tab: null },
                  { id: 'planets',   label: 'Planets',   tab: 'planets' as const },
                  { id: 'houses',    label: 'Houses',    tab: 'houses' as const },
                  { id: 'aspects',   label: 'Aspects',   tab: 'aspects' as const },
                  { id: 'elements',  label: 'Elements',  tab: 'elements' as const },
                  { id: 'connection',label: 'Connection',tab: 'connection' as const },
                ] as { id: string; label: string; tab: 'planets' | 'houses' | 'aspects' | 'elements' | 'connection' | null }[]).map(({ id, label, tab }) => (
                  <button
                    key={id}
                    onClick={() => {
                      if (tab) {
                        setActiveTab(tab);
                        setTimeout(() => tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                      } else {
                        chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                      setActiveChapter(id);
                    }}
                    className="shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
                    style={{
                      fontFamily: 'var(--font-sans)',
                      background: activeChapter === id ? 'hsl(var(--primary) / 0.15)' : 'transparent',
                      color: activeChapter === id
                        ? (id === 'connection' ? 'hsl(var(--accent))' : 'hsl(var(--primary))')
                        : 'hsl(var(--muted-foreground))',
                      border: activeChapter === id
                        ? (id === 'connection' ? '1px solid hsl(var(--accent) / 0.4)' : '1px solid hsl(var(--primary) / 0.4)')
                        : '1px solid transparent',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Tabs */}
              <div ref={tabsRef} className="rounded-2xl overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
                <div className="flex overflow-x-auto scrollbar-none" style={{ background: 'hsl(var(--background))', borderBottom: '1px solid hsl(var(--border))' }}>
                  {(['connection','planets','houses','aspects','elements'] as const).map(tab => (
                    <button key={tab} onClick={() => { setActiveTab(tab); setActiveChapter(tab); }} className="shrink-0 px-4 py-4 text-xs tracking-widest uppercase transition-all duration-200"
                      style={{
                        fontFamily: 'var(--font-sans)',
                        letterSpacing: '0.1em',
                        color: activeTab === tab
                          ? (tab === 'connection' ? 'hsl(var(--accent))' : 'hsl(var(--primary))')
                          : (tab === 'connection' ? 'hsl(var(--accent) / 0.7)' : 'hsl(var(--muted-foreground))'),
                        borderBottom: activeTab === tab
                          ? (tab === 'connection' ? '2px solid hsl(var(--accent))' : '2px solid hsl(var(--primary))')
                          : '2px solid transparent',
                        background: tab === 'connection' && activeTab === tab ? 'hsl(var(--accent) / 0.08)' : 'transparent',
                        whiteSpace: 'nowrap',
                        fontWeight: tab === 'connection' ? '600' : '400',
                      }}>
                      {tab === 'connection' ? '♡ Connection' : tab === 'planets' ? 'Planets' : tab === 'houses' ? 'Houses' : tab === 'aspects' ? 'Aspects' : 'Elements'}
                    </button>
                  ))}
                </div>
                <div className="p-6 md:p-8" style={{ background: 'hsl(var(--card))' }}>

                  {/* PLANETS */}
                  <div style={{ display: activeTab === 'planets' ? 'block' : 'none' }}>
                    <p className="text-sm mb-6" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Click any planet to read its layered interpretation — planet meaning, sign expression, and house placement.</p>
                    <div className="flex flex-col gap-3">
                      {PLANET_KEYS.map(k => {
                        // eslint-disable-next-line security/detect-object-injection
                        const pos = chart[k] as PlanetPosition;
                        // eslint-disable-next-line security/detect-object-injection
                        const interp = PLANET_INTERPRETATIONS[k];
                        // eslint-disable-next-line security/detect-object-injection
                        const signInterp = SIGN_INTERPRETATIONS[pos.sign];
                        const signColor = SIGN_COLOR_VARS[pos.sign] || 'hsl(var(--foreground))';
                        const isOpen = expandedPlanet === k;
                        return (
                          <div key={k} className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
                            <button onClick={() => setExpandedPlanet(isOpen ? null : k)} className="w-full flex items-center gap-4 p-4 text-left transition-all duration-200" style={{ background: isOpen ? 'hsl(var(--background))' : 'transparent' }}>
                              <span className="text-2xl w-8 text-center shrink-0" style={{ color: 'hsl(var(--primary))' }}>{interp.symbol}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-base font-medium" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{interp.title}</span>
                                  <span className="text-sm" style={{ color: signColor, fontFamily: 'var(--font-sans)' }}>in {pos.sign}</span>
                                  {pos.retrograde && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--accent) / 0.15)', color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}>Retrograde</span>}
                                </div>
                                <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{pos.degree}° {pos.sign} · House {pos.house} · {interp.rules}</p>
                              </div>
                              <span className="text-lg shrink-0" style={{ color: 'hsl(var(--muted-foreground))', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>↓</span>
                            </button>
                            {isOpen && (
                              <div className="px-6 pb-6" style={{ background: 'hsl(var(--background))' }}>
                                <div className="pt-4" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                                  <h4 className="text-sm font-medium mb-2" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>What {interp.title} Represents</h4>
                                  <p className="text-sm leading-relaxed mb-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{interp.meaning}</p>
                                  <h4 className="text-sm font-medium mb-2" style={{ color: signColor, fontFamily: 'var(--font-sans)' }}>{interp.title} in {pos.sign}</h4>
                                  <p className="text-sm leading-relaxed mb-3" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{signInterp?.description}</p>
                                  {signInterp?.shadow && (
                                    <div className="rounded-lg p-3 mb-3" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                                        <span style={{ color: 'hsl(var(--accent))' }}>Shadow work: </span>{signInterp.shadow}
                                      </p>
                                    </div>
                                  )}
                                  <div className="flex flex-wrap gap-2 mb-5">
                                    {signInterp?.keywords.map(kw => (
                                      <span key={kw} className="text-xs px-3 py-1 rounded-full" style={{ background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))', fontFamily: 'var(--font-sans)' }}>{kw}</span>
                                    ))}
                                  </div>
                                  {/* Layer 3: House placement */}
                                  {(() => {
                                    const houseInterp = HOUSE_INTERPRETATIONS[pos.house as keyof typeof HOUSE_INTERPRETATIONS];
                                    if (!houseInterp) return null;
                                    return (
                                      <div className="rounded-xl p-4" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
                                            House {pos.house}
                                          </span>
                                          <span className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{houseInterp.title}</span>
                                        </div>
                                        <p className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                                          <span style={{ color: 'hsl(var(--primary))' }}>Life area: </span>{houseInterp.keywords}
                                        </p>
                                        <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                                          {interp.title} in House {pos.house} places your {interp.title.toLowerCase()} energy in the domain of {houseInterp.title.toLowerCase()}. {houseInterp.meaning}
                                        </p>
                                        {unknownTime && (
                                          <p className="text-xs mt-2 italic" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}>
                                            ✦ House placement is approximate — birth time unknown
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* HOUSES */}
                  <div style={{ display: activeTab === 'houses' ? 'block' : 'none' }}>
                    <p className="text-sm mb-6" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>The 12 houses represent different areas of life. The sign on each house cusp colors how you experience that domain.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from({ length: 12 }, (_, i) => {
                        const houseNum = i + 1;
                        // eslint-disable-next-line security/detect-object-injection
                        const houseLon = chart.houses[i];
                        const signIdx = Math.floor(houseLon / 30);
                        const signNames2 = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
                        // eslint-disable-next-line security/detect-object-injection
                        const signName = signNames2[signIdx % 12];
                        // eslint-disable-next-line security/detect-object-injection
                        const signColor = SIGN_COLOR_VARS[signName] || 'hsl(var(--foreground))';
                        // eslint-disable-next-line security/detect-object-injection
                        const houseInterp = HOUSE_INTERPRETATIONS[houseNum];
                        // eslint-disable-next-line security/detect-object-injection
                        const planetsInHouse = PLANET_KEYS.filter(k => (chart[k] as PlanetPosition).house === houseNum);
                        return (
                          <div key={houseNum} className="rounded-xl p-4" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="text-sm font-medium" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{houseInterp.title}</h4>
                              <span className="text-sm shrink-0" style={{ color: signColor, fontFamily: 'var(--font-sans)' }}>{signName}</span>
                            </div>
                            <p className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{houseInterp.keywords}</p>
                            <p className="text-xs leading-relaxed mb-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{houseInterp.meaning}</p>
                            {planetsInHouse.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {planetsInHouse.map(k => {
                                  // eslint-disable-next-line security/detect-object-injection
                                  const pi = PLANET_INTERPRETATIONS[k];
                                  return <span key={k} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--card))', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.3)', fontFamily: 'var(--font-sans)' }}>{pi.symbol} {pi.title}</span>;
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ASPECTS */}
                  <div style={{ display: activeTab === 'aspects' ? 'block' : 'none' }}>
                    <p className="text-sm mb-6" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Aspects are angular relationships between planets — they reveal how different parts of your psyche interact. Click the top aspects for a layered reading.</p>
                    {chart.aspects.length === 0 ? (
                      <p className="text-sm text-center py-8" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>No major aspects found.</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {chart.aspects.map((asp, i) => {
                          const aspInterp = ASPECT_INTERPRETATIONS[asp.type];
                          const col = ASPECT_NATURE_VARS[aspInterp?.nature || ''] || 'hsl(var(--foreground))';
                          const isLayered = i < 5;
                          const isOpen = expandedAspectLayer === i;
                          // Planet interpretations for the two planets in this aspect
                          const p1Interp = PLANET_INTERPRETATIONS[asp.planet1 as keyof typeof PLANET_INTERPRETATIONS];
                          const p2Interp = PLANET_INTERPRETATIONS[asp.planet2 as keyof typeof PLANET_INTERPRETATIONS];
                          const p1Pos = chart[asp.planet1 as keyof typeof chart] as PlanetPosition | undefined;
                          const p2Pos = chart[asp.planet2 as keyof typeof chart] as PlanetPosition | undefined;
                          return (
                            <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
                              <button
                                onClick={() => isLayered ? setExpandedAspectLayer(isOpen ? null : i) : undefined}
                                className="w-full flex items-center gap-3 p-4 text-left transition-all duration-200"
                                style={{ background: isOpen ? 'hsl(var(--background))' : 'transparent', cursor: isLayered ? 'pointer' : 'default' }}
                              >
                                <span className="text-lg shrink-0" style={{ color: col }}>{aspInterp?.symbol}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium capitalize" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{asp.planet1} {asp.type} {asp.planet2}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--card))', color: col, fontFamily: 'var(--font-sans)' }}>{aspInterp?.nature}</span>
                                  </div>
                                  <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{asp.orb}° orb{isLayered ? ' · click for full reading' : ''}</p>
                                </div>
                                {isLayered && (
                                  <span className="text-lg shrink-0" style={{ color: 'hsl(var(--muted-foreground))', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>↓</span>
                                )}
                              </button>
                              {isOpen && (
                                <div className="px-5 pb-5" style={{ background: 'hsl(var(--background))' }}>
                                  <div className="pt-4 flex flex-col gap-4" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                                    {/* Layer 1: Aspect meaning */}
                                    <div>
                                      <p className="text-xs font-semibold mb-1.5" style={{ color: col, fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>The Aspect</p>
                                      <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{aspInterp?.meaning}</p>
                                    </div>
                                    {/* Layer 2: Planet 1 context */}
                                    {p1Interp && p1Pos && (
                                      <div className="rounded-lg p-3" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                                        <p className="text-xs font-semibold mb-1" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>{p1Interp.symbol} {p1Interp.title} in {p1Pos.sign} (House {p1Pos.house})</p>
                                        <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{p1Interp.meaning}</p>
                                      </div>
                                    )}
                                    {/* Layer 3: Planet 2 context */}
                                    {p2Interp && p2Pos && (
                                      <div className="rounded-lg p-3" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                                        <p className="text-xs font-semibold mb-1" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>{p2Interp.symbol} {p2Interp.title} in {p2Pos.sign} (House {p2Pos.house})</p>
                                        <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{p2Interp.meaning}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ELEMENTS */}
                  <div style={{ display: activeTab === 'elements' ? 'block' : 'none' }}>
                    <p className="text-sm mb-8" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>The balance of elements and modalities in your chart reveals your fundamental temperament and approach to life.</p>
                    <div className="rounded-2xl p-6 mb-8 text-center" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}>
                      <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}>Dominant Element</p>
                      {/* eslint-disable-next-line security/detect-object-injection */}
                      <h3 className="text-4xl mb-3" style={{ fontFamily: 'var(--font-heading)', color: ELEMENT_COLOR_VARS[dominantElement] }}>{dominantElement}</h3>
                      {/* eslint-disable-next-line security/detect-object-injection */}
                      <p className="text-sm leading-relaxed max-w-md mx-auto" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{ELEMENT_DESCRIPTIONS[dominantElement]}</p>
                    </div>
                    <h4 className="text-sm font-medium mb-4" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>Element Distribution</h4>
                    <div className="flex flex-col gap-4 mb-8">
                      {Object.entries(elementCounts).map(([el, count]) => (
                        <div key={el}>
                          <div className="flex justify-between mb-1">
                            {/* eslint-disable-next-line security/detect-object-injection */}
                            <span className="text-sm" style={{ color: ELEMENT_COLOR_VARS[el], fontFamily: 'var(--font-sans)' }}>{el}</span>
                            <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{count} planets</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'hsl(var(--border))' }}>
                            {/* eslint-disable-next-line security/detect-object-injection */}
                            <div className="h-full rounded-full" style={{ width: `${(count / 10) * 100}%`, background: ELEMENT_COLOR_VARS[el] }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <h4 className="text-sm font-medium mb-4" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>Modality Distribution</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(modalityCounts).map(([mod, count]) => (
                        <div key={mod} className="rounded-xl p-4 text-center" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}>
                          <div className="text-2xl font-bold mb-1" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-heading)' }}>{count}</div>
                          <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{mod}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 rounded-xl p-4" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}>
                      <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                        <span style={{ color: 'hsl(var(--primary))' }}>Cardinal</span> signs initiate and lead. <span style={{ color: 'hsl(var(--primary))' }}>Fixed</span> signs sustain and deepen. <span style={{ color: 'hsl(var(--primary))' }}>Mutable</span> signs adapt and transform.
                      </p>
                    </div>
                  </div>

                  {/* CONNECTION TAB */}
                  <div style={{ display: activeTab === 'connection' ? 'block' : 'none' }}>
                    <div className="mb-8 text-center">
                      <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}>Synastry Reading</p>
                      <h3 className="text-3xl md:text-4xl mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>Romantic Connection Chart</h3>
                      <p className="text-sm leading-relaxed max-w-lg mx-auto" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                        Enter your partner's birth details to reveal the astrological chemistry between your charts — love resonance, emotional stability, sexual attraction, and long-term potential.
                      </p>
                    </div>

                    {/* Partner form */}
                    <div className="rounded-2xl p-6 mb-8" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--accent) / 0.35)' }}>
                      <h4 className="text-xl mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--accent))' }}>
                        {partnerForm.name ? partnerForm.name + "'s Birth Details" : "Partner's Birth Details"}
                      </h4>
                      <p className="text-xs mb-5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>All fields required except name</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs mb-1.5 font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>Partner's Name <span style={{ color: 'hsl(var(--muted-foreground))' }}>(optional)</span></label>
                          <input name="name" value={partnerForm.name} onChange={e => setPartnerForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="e.g. Alex" className="w-full px-4 py-3 rounded-xl text-sm bg-card border border-border text-foreground"
                            style={{ fontFamily: 'var(--font-sans)' }} />
                        </div>
                        <div>
                          <label className="block text-xs mb-1.5 font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>Birth City</label>
                          <input name="city" value={partnerForm.city} onChange={e => setPartnerForm(f => ({ ...f, city: e.target.value }))}
                            placeholder="e.g. New York, USA" className="w-full px-4 py-3 rounded-xl text-sm bg-card border border-border text-foreground"
                            style={{ fontFamily: 'var(--font-sans)' }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {(['month','day','year'] as const).map(field => (
                          <div key={field}>
                            <label className="block text-xs mb-1.5 font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                            {/* eslint-disable-next-line security/detect-object-injection */}
                            <input value={partnerForm[field]} onChange={e => setPartnerForm(f => ({ ...f, [field]: e.target.value }))}
                              placeholder={field === 'month' ? 'MM' : field === 'day' ? 'DD' : 'YYYY'} type="number"
                              className="w-full px-4 py-3 rounded-xl text-sm bg-card border border-border text-foreground"
                              style={{ fontFamily: 'var(--font-sans)' }} />
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-5">
                        <div>
                          <label className="block text-xs mb-1.5 font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>Hour</label>
                          <input value={partnerForm.hour} onChange={e => setPartnerForm(f => ({ ...f, hour: e.target.value }))}
                            placeholder="HH" type="number" min="0" max="23"
                            className="w-full px-4 py-3 rounded-xl text-sm bg-card border border-border text-foreground"
                            style={{ fontFamily: 'var(--font-sans)' }} />
                        </div>
                        <div>
                          <label className="block text-xs mb-1.5 font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>Minute</label>
                          <input value={partnerForm.minute} onChange={e => setPartnerForm(f => ({ ...f, minute: e.target.value }))}
                            placeholder="MM" type="number" min="0" max="59"
                            className="w-full px-4 py-3 rounded-xl text-sm bg-card border border-border text-foreground"
                            style={{ fontFamily: 'var(--font-sans)' }} />
                        </div>
                        <div>
                          <label className="block text-xs mb-1.5 font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>UTC Offset</label>
                          <select value={partnerForm.utcOffset} onChange={e => setPartnerForm(f => ({ ...f, utcOffset: Number(e.target.value) }))}
                            className="w-full px-4 py-3 rounded-xl text-sm bg-card border border-border text-foreground"
                            style={{ fontFamily: 'var(--font-sans)' }}>
                            {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                          </select>
                        </div>
                      </div>
                      {partnerGeocodeError && <p className="text-xs mb-3 text-destructive" style={{ fontFamily: 'var(--font-sans)' }}>{partnerGeocodeError}</p>}
                      {partnerError && <p className="text-xs mb-3 text-destructive" style={{ fontFamily: 'var(--font-sans)' }}>{partnerError}</p>}
                      <button
                        onClick={async () => {
                          setPartnerError('');
                          setPartnerGeocodeError('');
                          const year = parseInt(partnerForm.year);
                          const month = parseInt(partnerForm.month);
                          const day = parseInt(partnerForm.day);
                          const hour = parseInt(partnerForm.hour);
                          const minute = parseInt(partnerForm.minute);
                          if (!year || !month || !day || !partnerForm.city.trim()) {
                            setPartnerError('Please fill in date and birth city.');
                            return;
                          }
                          setPartnerGeocoding(true);
                          try {
                            const res = await fetch('https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(partnerForm.city) + '&format=json&limit=1');
                            const data = await res.json() as { lat: string; lon: string }[];
                            if (!data || data.length === 0) {
                              setPartnerGeocodeError('Could not find "' + partnerForm.city + '". Try adding the country.');
                              setPartnerGeocoding(false);
                              return;
                            }
                            const lat = parseFloat(data[0].lat);
                            const lon = parseFloat(data[0].lon);
                            setPartnerForm(f => ({ ...f, lat: String(lat.toFixed(4)), lon: String(lon.toFixed(4)) }));
                            const result = calculateChart(year, month, day, hour, minute, lat, lon, Number(partnerForm.utcOffset));
                            setPartnerChart(result);
                            if (chart) setSynastry(calculateSynastry(chart, result));
                          } catch {
                            setPartnerError('Could not calculate chart. Please check your inputs.');
                          }
                          setPartnerGeocoding(false);
                        }}
                        className="w-full py-4 rounded-xl text-sm tracking-widest uppercase transition-all duration-300 bg-primary text-background border-0"
                        style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.15em', opacity: partnerGeocoding ? 0.7 : 1 }}
                        disabled={partnerGeocoding}>
                        {partnerGeocoding ? 'Calculating...' : 'Reveal Our Connection'}
                      </button>
                    </div>

                    {/* Synastry results */}
                    {synastry && partnerChart && (
                      <div>
                        <div className="text-center mb-6">
                          <p className="text-xs tracking-widest uppercase mb-2 text-accent" style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}>Synastry Reading</p>
                          <h3 className="text-3xl mb-2 text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                            {form.name || 'You'} & {partnerForm.name || 'Partner'}
                          </h3>
                          <p className="text-sm leading-relaxed max-w-xl mx-auto text-muted-foreground" style={{ fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>
                            {synastry.summary}
                          </p>
                        </div>

                        <div className="rounded-2xl p-6 mb-6 text-center bg-background" style={{ border: '1px solid hsl(var(--primary) / 0.3)' }}>
                          <p className="text-xs tracking-widest uppercase mb-2 text-muted-foreground" style={{ fontFamily: 'var(--font-sans)' }}>Overall Compatibility</p>
                          <div className="text-6xl font-light mb-2 text-primary" style={{ fontFamily: 'var(--font-heading)' }}>{synastry.scores.overall}%</div>
                          <div className="w-full rounded-full h-2 mx-auto max-w-xs bg-border">
                            <div className="h-2 rounded-full transition-all duration-700" style={{ width: synastry.scores.overall + '%', background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))' }} />
                          </div>
                        </div>

                        {isAuthenticated && (
                          <div className="flex justify-end mb-4">
                            <button
                              onClick={() => void savePartner()}
                              disabled={savingPartner || partnerSaved}
                              className="px-4 py-2 rounded-xl text-xs tracking-wide uppercase transition-all"
                              style={{
                                background: partnerSaved ? 'hsl(var(--success) / 0.2)' : 'hsl(var(--primary) / 0.15)',
                                color: partnerSaved ? 'hsl(var(--success))' : 'hsl(var(--primary))',
                                border: `1px solid ${partnerSaved ? 'hsl(var(--success) / 0.4)' : 'hsl(var(--primary) / 0.4)'}`,
                                fontFamily: 'var(--font-sans)',
                              }}
                            >
                              {partnerSaved ? '✓ Saved' : savingPartner ? 'Saving…' : 'Save Reading'}
                            </button>
                          </div>
                        )}

                        <CompatibilityScoreCards
                          scores={synastry.scores}
                          expandedScore={expandedScore}
                          setExpandedScore={setExpandedScore}
                        />

                        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
                          {([
                            { key: 'analysis', label: 'Analysis' },
                            { key: 'wheel',    label: 'Dual Wheel' },
                            { key: 'patterns', label: 'Patterns' },
                            { key: 'timing',   label: 'Timing' },
                          ] as const).map(({ key, label }) => (
                            <button
                              key={key}
                              onClick={() => setSynastryTab(key)}
                              className="flex-1 py-2 rounded-lg text-xs transition-all"
                              style={{
                                background: synastryTab === key ? 'hsl(var(--card))' : 'transparent',
                                color: synastryTab === key ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                                fontFamily: 'var(--font-sans)',
                                fontWeight: synastryTab === key ? '600' : '400',
                              }}
                            >
                              {label}
                            </button>
                          ))}
                        </div>

                        {synastryTab === 'analysis' && (
                          <div>
                            <SynastryNarrative
                              synastry={synastry}
                              nameA={form.name || 'You'}
                              nameB={partnerForm.name || 'Partner'}
                            />
                            <div className="rounded-2xl overflow-hidden border border-border mt-8">
                              <div className="px-6 py-4 bg-background border-b border-border">
                                <h4 className="text-base text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Key Synastry Aspects</h4>
                                <p className="text-xs mt-1 text-muted-foreground" style={{ fontFamily: 'var(--font-sans)' }}>
                                  {form.name || 'Your'} planets aspecting {partnerForm.name || 'Partner'}&apos;s planets
                                </p>
                              </div>
                              <div className="divide-y divide-border">
                                {synastry.aspects
                                  .filter(a => {
                                    const imp = ['sun','moon','venus','mars','ascendant','saturn','jupiter'];
                                    return imp.includes(a.planet1) && imp.includes(a.planet2);
                                  })
                                  .slice(0, 12)
                                  .map((asp, i) => {
                                    const isHarmonious = asp.score > 0;
                                    return (
                                      <div key={i} className="px-6 py-4">
                                        <div className="flex items-center gap-3 mb-1">
                                          <span className="text-xs font-medium capitalize text-foreground" style={{ fontFamily: 'var(--font-sans)', minWidth: 60 }}>{asp.planet1}</span>
                                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: isHarmonious ? 'hsl(var(--success) / 0.15)' : 'hsl(var(--accent) / 0.15)', color: isHarmonious ? 'hsl(var(--success))' : 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}>{asp.type}</span>
                                          <span className="text-xs font-medium capitalize text-foreground" style={{ fontFamily: 'var(--font-sans)' }}>{asp.planet2}</span>
                                          <span className="ml-auto text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-sans)' }}>{asp.orb}° orb</span>
                                        </div>
                                        <p className="text-xs leading-relaxed text-muted-foreground" style={{ fontFamily: 'var(--font-sans)' }}>{asp.description}</p>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          </div>
                        )}

                        {synastryTab === 'wheel' && (
                          <div>
                            <p className="text-sm text-center text-muted-foreground mb-4" style={{ fontFamily: 'var(--font-sans)' }}>
                              Inner ring: {form.name || 'your'} planets · Outer ring: {partnerForm.name || "partner"}'s planets · Lines: synastry aspects
                            </p>
                            <DualWheelChart
                              chartA={chart!}
                              chartB={partnerChart}
                              nameA={form.name || 'You'}
                              nameB={partnerForm.name || 'Partner'}
                              aspects={synastry.aspects}
                              size={340}
                            />
                            <div className="mt-6 rounded-xl p-4" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                              <p className="text-xs font-semibold mb-3 text-muted-foreground" style={{ fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Aspect Lines</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {[
                                  { type: 'Conjunction', colorVar: '--primary',        desc: 'Merging energy' },
                                  { type: 'Trine',       colorVar: '--grimoire-herb',  desc: 'Harmonious flow' },
                                  { type: 'Sextile',     colorVar: '--grimoire-dream', desc: 'Opportunity' },
                                  { type: 'Square',      colorVar: '--astro-mars',     desc: 'Creative tension' },
                                  { type: 'Opposition',  colorVar: '--accent',         desc: 'Polarity' },
                                ].map(({ type, colorVar, desc }) => (
                                  <div key={type} className="flex items-center gap-2">
                                    <div className="w-6 h-0.5 rounded" style={{ background: 'hsl(var(' + colorVar + '))' }} />
                                    <div>
                                      <p className="text-xs font-medium text-foreground" style={{ fontFamily: 'var(--font-sans)' }}>{type}</p>
                                      <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-sans)' }}>{desc}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {synastryTab === 'patterns' && (
                          <div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                              <div className="rounded-xl p-5" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--primary) / 0.3)' }}>
                                <p className="text-xs font-semibold mb-2 text-primary" style={{ fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>☉ Composite Sun</p>
                                <p className="text-sm leading-relaxed text-foreground" style={{ fontFamily: 'var(--font-sans)' }}>{synastry.compositeSun}</p>
                              </div>
                              <div className="rounded-xl p-5" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--astro-moon) / 0.3)' }}>
                                <p className="text-xs font-semibold mb-2" style={{ color: 'hsl(var(--astro-moon))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>☽ Composite Moon</p>
                                <p className="text-sm leading-relaxed text-foreground" style={{ fontFamily: 'var(--font-sans)' }}>{synastry.compositeMoon}</p>
                              </div>
                            </div>
                            <div className="rounded-2xl p-6" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}>
                              <h4 className="text-base mb-4 text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Relationship Patterns</h4>
                              <div className="flex flex-col gap-4">
                                {synastry.relationshipPatterns.map((pattern, i) => (
                                  <div key={i} className="flex gap-3">
                                    <span className="text-primary mt-0.5 shrink-0">✦</span>
                                    <p className="text-sm leading-relaxed text-muted-foreground" style={{ fontFamily: 'var(--font-sans)' }}>{pattern}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {synastryTab === 'timing' && (
                          <div className="rounded-2xl p-6" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}>
                            <h4 className="text-base mb-2 text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Relationship Timing & Transits</h4>
                            <p className="text-xs text-muted-foreground mb-5" style={{ fontFamily: 'var(--font-sans)' }}>
                              Astrological timing insights for when this relationship is most activated, supported, or tested.
                            </p>
                            <div className="flex flex-col gap-5">
                              {synastry.timingInsights.map((insight, i) => (
                                <div key={i} className="flex gap-3">
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
                                    {i + 1}
                                  </div>
                                  <p className="text-sm leading-relaxed text-muted-foreground" style={{ fontFamily: 'var(--font-sans)' }}>{insight}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Saved partners panel */}
                    {isAuthenticated && savedPartners.length > 0 && (
                      <div className="mt-8">
                        <button
                          onClick={() => setShowSavedPartners(v => !v)}
                          className="flex items-center gap-2 text-sm mb-4 transition-colors"
                          style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}
                        >
                          <span>{showSavedPartners ? '▾' : '▸'}</span>
                          Saved Readings ({savedPartners.length})
                        </button>
                        {showSavedPartners && (
                          <div className="rounded-2xl overflow-hidden border border-border">
                            <div className="px-5 py-4 border-b border-border" style={{ background: 'hsl(var(--muted))' }}>
                              <p className="text-sm font-medium text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Saved Compatibility Readings</p>
                            </div>
                            <div className="divide-y divide-border">
                              {savedPartners.map(partner => (
                                <div key={partner.id} className="px-5 py-4 flex flex-wrap items-start gap-4" style={{ background: 'hsl(var(--background))' }}>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate" style={{ fontFamily: 'var(--font-sans)' }}>{partner.partnerName}</p>
                                    <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-sans)' }}>{partner.birthCity} · {partner.birthDate}</p>
                                    <p className="text-xs mt-1 text-muted-foreground line-clamp-1" style={{ fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>{partner.summary}</p>
                                  </div>
                                  <div className="text-center flex-shrink-0">
                                    <div className="text-2xl font-light text-primary" style={{ fontFamily: 'var(--font-heading)' }}>{partner.scores.overall}%</div>
                                    <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-sans)' }}>overall</p>
                                  </div>
                                  <button
                                    onClick={() => void deletePartner(partner.id)}
                                    className="text-xs px-2 py-1 rounded-lg transition-colors flex-shrink-0"
                                    style={{ color: 'hsl(var(--destructive))', background: 'hsl(var(--destructive) / 0.1)', fontFamily: 'var(--font-sans)' }}
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Download CTA */}
              <div className="text-center mt-12">
                <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Save your complete chart with all interpretations</p>
                <button onClick={downloadChart} className="inline-flex items-center gap-3 px-8 py-4 rounded-xl text-sm tracking-widest uppercase transition-all duration-300"
                  style={{ background: 'hsl(var(--primary) / 0.15)', border: '1px solid hsl(var(--primary) / 0.5)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--primary) / 0.25)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 24px hsl(var(--primary) / 0.3)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--primary) / 0.15)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}>
                  Download Full Chart & Interpretations
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── TRANSIT MODE ── */}
        {chartMode === 'transit' && chart && (
          <section className="py-xxl" style={{ background: 'hsl(var(--background))' }}>
            <div className="max-w-content mx-auto px-base">
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10">
                  <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}>Transit Reading</p>
                  <h2 className="text-3xl md:text-4xl mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>Current Sky vs. Your Natal Chart</h2>
                  <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    Choose a date to see which transiting planets are forming aspects to your natal planets.
                  </p>
                </div>

                {/* Transit date picker */}
                <div className="rounded-2xl p-6 mb-8" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}>Transit Date</label>
                      <div className="grid grid-cols-3 gap-3">
                        <select
                          value={transitDate.month}
                          onChange={(e) => setTransitDate(d => ({ ...d, month: e.target.value }))}
                          className="w-full px-3 py-3 rounded-lg text-sm outline-none"
                          style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
                        >
                          {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                            <option key={m} value={i + 1}>{m}</option>
                          ))}
                        </select>
                        <select
                          value={transitDate.day}
                          onChange={(e) => setTransitDate(d => ({ ...d, day: e.target.value }))}
                          className="w-full px-3 py-3 rounded-lg text-sm outline-none"
                          style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
                        >
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={transitDate.year}
                          onChange={(e) => setTransitDate(d => ({ ...d, year: e.target.value }))}
                          placeholder="Year"
                          min="1900" max="2100"
                          className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                          style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={calculateTransits}
                      disabled={transitLoading}
                      className="px-6 py-3 rounded-xl text-sm tracking-wide uppercase transition-all duration-200"
                      style={{ background: 'hsl(var(--primary) / 0.15)', border: '1px solid hsl(var(--primary) / 0.5)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}
                    >
                      {transitLoading ? 'Calculating…' : 'Calculate Transits'}
                    </button>
                  </div>
                </div>

                {/* Transit hits */}
                {transitChart && (() => {
                  const hits = getTransitHits();
                  return (
                    <div>
                      <h3 className="text-xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                        Active Transits — {transitDate.month}/{transitDate.day}/{transitDate.year}
                      </h3>
                      {hits.length === 0 ? (
                        <p className="text-sm text-center py-8" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                          No major transits within 3° orb on this date.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {hits.map((hit, i) => {
                            const tInterp = PLANET_INTERPRETATIONS[hit.transitPlanet as keyof typeof PLANET_INTERPRETATIONS];
                            const nInterp = PLANET_INTERPRETATIONS[hit.natalPlanet as keyof typeof PLANET_INTERPRETATIONS];
                            const aspInterp = ASPECT_INTERPRETATIONS[hit.type];
                            const col = ASPECT_NATURE_VARS[hit.nature] || 'hsl(var(--foreground))';
                            const nPos = chart[hit.natalPlanet as keyof typeof chart] as PlanetPosition | undefined;
                            return (
                              <div key={i} className="rounded-xl p-4" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <span className="text-base" style={{ color: 'hsl(var(--accent))' }}>{tInterp?.symbol}</span>
                                  <span className="text-sm font-medium capitalize" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                                    Transit {tInterp?.title || hit.transitPlanet}
                                  </span>
                                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--muted))', color: col, fontFamily: 'var(--font-sans)' }}>
                                    {aspInterp?.symbol} {hit.type}
                                  </span>
                                  <span className="text-base" style={{ color: 'hsl(var(--primary))' }}>{nInterp?.symbol}</span>
                                  <span className="text-sm font-medium capitalize" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                                    Natal {nInterp?.title || hit.natalPlanet}
                                    {nPos ? ' in ' + nPos.sign : ''}
                                  </span>
                                  <span className="ml-auto text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{hit.orb}° orb</span>
                                </div>
                                <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                                  {hit.meaning}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </section>
        )}

        {/* ABOUT */}
        <section className="py-xxl" style={{ background: 'hsl(var(--background))' }}>
          <div className="max-w-content mx-auto px-base">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl mb-6" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>What Is a Natal Chart?</h2>
              <p className="text-base leading-relaxed mb-6" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                A natal chart — also called a birth chart or horoscope — is a snapshot of the sky at the exact moment and location of your birth. It maps the positions of the Sun, Moon, and planets across the 12 signs of the zodiac and the 12 houses of life experience.
              </p>
              <p className="text-base leading-relaxed mb-10" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                Astrologers read this map as a symbolic language — not as fate, but as a blueprint of potential. Your chart reveals your gifts, your challenges, your deepest needs, and the themes your soul is here to explore in this lifetime.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { symbol: '☉☽↑', title: 'The Big Three', desc: 'Sun, Moon, and Rising signs form the core trinity of your astrological identity.' },
                  { symbol: '♃♄', title: 'Social Planets', desc: 'Jupiter and Saturn shape your relationship with growth, luck, discipline, and life lessons.' },
                  { symbol: '♅♆♇', title: 'Outer Planets', desc: 'Uranus, Neptune, and Pluto mark generational themes and deep soul-level transformation.' },
                ].map(({ symbol, title, desc }) => (
                  <div key={title} className="rounded-xl p-6" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                    <div className="text-2xl mb-3" style={{ color: 'hsl(var(--primary))' }}>{symbol}</div>
                    <h3 className="text-lg mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{desc}</p>
                  </div>
                ))}


              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(12px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowShareModal(false); }}>
          <div className="relative w-full max-w-md rounded-2xl p-8"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--primary) / 0.3)', boxShadow: '0 0 60px hsl(var(--primary) / 0.15)' }}>
            {/* Close */}
            <button onClick={() => setShowShareModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
              style={{ color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--background))' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}>Share Your Chart</p>
              <h3 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                {form.name ? `${form.name}'s Big Three` : 'Your Big Three'}
              </h3>
              {chart && (
                <p className="text-sm" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
                  ☉ {chart.sun.sign} · ☽ {chart.moon.sign} · ↑ {chart.ascendant.sign}
                </p>
              )}
            </div>

            {/* Preview image */}
            {chart && (
              <div className="rounded-xl overflow-hidden mb-6" style={{ border: '1px solid hsl(var(--border))' }}>
                <img src={ogImageUrl()} alt="Birth chart share preview" width={600} height={315} className="w-full h-auto" loading="lazy" />
              </div>
            )}

            {/* Tagline */}
            <p className="text-xs text-center mb-6 leading-relaxed px-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>
              "{chart ? getShareTagline() : 'Cast your natal chart at Spellful ✨'}"
            </p>

            {/* Platform buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* X / Twitter */}
              <button onClick={shareToX} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs tracking-wide uppercase transition-all duration-200"
                style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(var(--primary) / 0.6)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(var(--border))'; }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Post on X
              </button>

              {/* Facebook */}
              <button onClick={shareToFacebook} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs tracking-wide uppercase transition-all duration-200"
                style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(var(--primary) / 0.6)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(var(--border))'; }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </button>

              {/* LinkedIn */}
              <button onClick={shareToLinkedIn} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs tracking-wide uppercase transition-all duration-200"
                style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(var(--primary) / 0.6)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(var(--border))'; }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </button>

              {/* Instagram (copy) */}
              <button onClick={shareToInstagram} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs tracking-wide uppercase transition-all duration-200"
                style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(var(--primary) / 0.6)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(var(--border))'; }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                {copied ? 'Copied!' : 'Instagram'}
              </button>
            </div>

            {/* Copy link */}
            <button onClick={copyLink} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs tracking-wide uppercase transition-all duration-200"
              style={{ background: copied ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--background))', border: `1px solid ${copied ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`, color: copied ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              )}
              {copied ? 'Link Copied!' : 'Copy Link'}
            </button>

            <p className="text-center text-xs mt-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', opacity: 0.6 }}>
              Instagram doesn't support direct sharing — use "Copy Link" or paste the caption from the Instagram button.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
