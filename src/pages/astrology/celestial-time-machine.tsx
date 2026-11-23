/**
 * Celestial Time Machine — Astrology 2.0
 *
 * Explore the night sky at any past or future date and time from any location.
 * Reuses the sky-engine and SVG dome from Live Sky Explorer, but lets the user
 * pick an arbitrary moment instead of "now".
 */

import { useState, useRef, useCallback, type ReactNode } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { MapPin, Locate, X } from 'lucide-react';
import { calculateChart } from '@/lib/astro-calculator';
import {
  buildSkySnapshot,
  altAzToXY,
  starToXY,
  riseTransitSet,
  compassLabel,
  skyPhase,
  SKY_DOME_BG,
  SKY_DOME_HORIZON,
  BRIGHT_STARS,
  CONSTELLATION_LINES,
  type PlanetSkyData,
  type SkySnapshot,
} from '@/lib/sky-engine';
import { celestial_time_machine } from 'virtual:content';
import ShareBar from '@/components/ShareBar';

const siteUrl = 'https://spellful.com';
const pageUrl = `${siteUrl}/astrology/celestial-time-machine`;

// ── Constants ─────────────────────────────────────────────────────────────────

const SVG_SIZE = 500;
const SVG_R = 230;
const SVG_CX = SVG_SIZE / 2;
const SVG_CY = SVG_SIZE / 2;

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
  { label: 'UTC+09:30 (Adelaide)', value: 9.5 },
  { label: 'UTC+10:00 (Sydney)', value: 10 },
  { label: 'UTC+11:00 (Solomon Islands)', value: 11 },
  { label: 'UTC+12:00 (Auckland)', value: 12 },
];

const COMPASS_POINTS = [
  { label: 'N', az: 0 },
  { label: 'E', az: 90 },
  { label: 'S', az: 180 },
  { label: 'W', az: 270 },
];

// Quick-jump presets: historically interesting or astrologically notable moments
const PRESETS = [
  { label: 'Great Conjunction 2020', year: 2020, month: 12, day: 21, hour: 18, minute: 0, tz: 0 },
  { label: 'Total Solar Eclipse 2024', year: 2024, month: 4, day: 8, hour: 18, minute: 30, tz: -5 },
  { label: 'Harmonic Convergence 1987', year: 1987, month: 8, day: 16, hour: 12, minute: 0, tz: 0 },
  { label: 'New Millennium 2000', year: 2000, month: 1, day: 1, hour: 0, minute: 0, tz: 0 },
  { label: 'Summer Solstice 2025', year: 2025, month: 6, day: 21, hour: 2, minute: 42, tz: 0 },
];

function planetGlyph(key: string): string {
  if (key === 'sun') return '☉';
  if (key === 'moon') return '☽';
  if (key === 'mercury') return '☿';
  if (key === 'venus') return '♀';
  if (key === 'mars') return '♂';
  if (key === 'jupiter') return '♃';
  if (key === 'saturn') return '♄';
  if (key === 'uranus') return '♅';
  if (key === 'neptune') return '♆';
  if (key === 'pluto') return '♇';
  return '';
}

const PLANET_ORDER = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDeg(degree: number, minute: number, sign: string, retro: boolean) {
  return `${degree}°${minute.toString().padStart(2, '0')}′ ${sign}${retro ? ' ℞' : ''}`;
}

function formatTime(d: Date | null): string {
  if (!d) return '—';
  return d.toUTCString().slice(17, 22) + ' UTC';
}

function pad2(n: number) { return String(n).padStart(2, '0'); }

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function nowTimeString() {
  const now = new Date();
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

// Derive astronomical events from a snapshot
function deriveEvents(snapshot: SkySnapshot): string[] {
  const events: string[] = [];
  const planets = snapshot.planets;

  const sun = planets.find(p => p.key === 'sun');
  const moon = planets.find(p => p.key === 'moon');

  // Moon phase approximation from elongation
  if (sun && moon) {
    const elong = ((moon.eclipticLon - sun.eclipticLon) + 360) % 360;
    if (elong < 10 || elong > 350) events.push('New Moon — Sun and Moon conjunct');
    else if (elong > 170 && elong < 190) events.push('Full Moon — Sun and Moon in opposition');
    else if (elong > 85 && elong < 95) events.push('First Quarter Moon');
    else if (elong > 265 && elong < 275) events.push('Last Quarter Moon');
  }

  // Retrograde planets
  const retros = planets.filter(p => p.retrograde && p.key !== 'sun' && p.key !== 'moon');
  if (retros.length > 0) {
    events.push(`${retros.map(p => p.name).join(', ')} ${retros.length === 1 ? 'is' : 'are'} retrograde`);
  }

  // Planets near ecliptic conjunctions (within 5°)
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i];
      const b = planets[j];
      if (a.key === 'sun' || b.key === 'sun') continue; // skip sun conjunctions for brevity
      const diff = Math.abs(((a.eclipticLon - b.eclipticLon) + 360) % 360);
      const angle = diff > 180 ? 360 - diff : diff;
      if (angle < 5) {
        events.push(`${a.name} conjunct ${b.name} in ${a.sign}`);
      }
    }
  }

  // Sun in sign
  if (sun) events.push(`Sun in ${sun.sign}`);

  return events.slice(0, 6); // cap at 6
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FilterPill({
  children, active, onToggle, icon,
}: { children: ReactNode; active: boolean; onToggle: () => void; icon: ReactNode }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
      style={{
        background: active ? 'hsl(var(--primary) / 0.18)' : 'hsl(var(--muted))',
        border: active ? '1px solid hsl(var(--primary) / 0.5)' : '1px solid hsl(var(--border))',
        color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function PlanetDetailPanel({
  planet, snapshot, onClose,
}: { planet: PlanetSkyData; snapshot: SkySnapshot; onClose: () => void }) {
  const rts = riseTransitSet(planet.ra, planet.dec, snapshot.date, snapshot.lat, snapshot.lon);
  const compassDir = compassLabel(planet.azimuth);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25 }}
      className="absolute top-4 right-4 w-64 rounded-2xl p-4 z-20"
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        boxShadow: '0 8px 32px hsl(var(--background) / 0.8)',
      }}
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: 'hsl(var(--muted-foreground))' }}
        aria-label="Close panel"
      >
        <X size={14} />
      </button>

      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl" style={{ color: `hsl(var(${planet.colorVar}))` }}>{planet.glyph}</span>
        <div>
          <div className="font-semibold text-sm" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
            {planet.name}
          </div>
          <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
            {formatDeg(planet.degree, planet.minute, planet.sign, planet.retrograde)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {[
          { label: 'Altitude', value: `${planet.altitude.toFixed(1)}°` },
          { label: 'Azimuth', value: `${planet.azimuth.toFixed(1)}° ${compassDir}` },
          { label: 'Status', value: planet.aboveHorizon ? celestial_time_machine.results.aboveHorizon : celestial_time_machine.results.belowHorizon },
          { label: 'Motion', value: planet.retrograde ? celestial_time_machine.results.retrograde : celestial_time_machine.results.direct },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg p-2" style={{ background: 'hsl(var(--muted))' }}>
            <div className="text-xs mb-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{label}</div>
            <div className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg p-2.5" style={{ background: 'hsl(var(--muted))' }}>
        <div className="text-xs font-medium mb-1.5" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>Sky times</div>
        {rts.alwaysAbove && <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{celestial_time_machine.results.circumpolar}</div>}
        {rts.alwaysBelow && <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{celestial_time_machine.results.alwaysBelow}</div>}
        {!rts.alwaysAbove && !rts.alwaysBelow && (
          <div className="grid grid-cols-3 gap-1 text-center">
            {[
              { label: '↑ Rise', time: rts.rise },
              { label: '⊙ Transit', time: rts.transit },
              { label: '↓ Set', time: rts.set },
            ].map(({ label, time }) => (
              <div key={label}>
                <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{label}</div>
                <div className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{formatTime(time)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Sky Dome SVG ──────────────────────────────────────────────────────────────

function SkyDomeSVG({
  snapshot,
  showPlanets,
  showConstellations,
  showStars,
  selectedPlanet,
  onPlanetClick,
}: {
  snapshot: SkySnapshot;
  showPlanets: boolean;
  showConstellations: boolean;
  showStars: boolean;
  selectedPlanet: PlanetSkyData | null;
  onPlanetClick: (p: PlanetSkyData) => void;
}) {
  const sun = snapshot.planets.find(p => p.key === 'sun');
  const phase = skyPhase(sun?.altitude ?? -20);
  const bgColor = SKY_DOME_BG[phase];
  const horizonColor = SKY_DOME_HORIZON[phase];

  // SVG pan/zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom(z => Math.max(1, Math.min(4, z - e.deltaY * 0.001)));
  }

  function handleMouseDown(e: React.MouseEvent) {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPan(p => ({ x: p.x + dx / zoom, y: p.y + dy / zoom }));
  }

  function handleMouseUp() { dragging.current = false; }



  return (
    <div className="relative w-full" style={{ maxWidth: SVG_SIZE, margin: '0 auto' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        width="100%"
        style={{ borderRadius: '50%', cursor: dragging.current ? 'grabbing' : 'grab', touchAction: 'none' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        role="img"
        aria-label="Sky dome showing planetary positions"
      >
        <defs>
          <radialGradient id="ctm-skyGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={bgColor} />
            <stop offset="100%" stopColor={horizonColor} />
          </radialGradient>
          <clipPath id="ctm-domeClip">
            <circle cx={SVG_CX} cy={SVG_CY} r={SVG_R} />
          </clipPath>
          <filter id="ctm-planetGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="ctm-starGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Sky background */}
        <circle cx={SVG_CX} cy={SVG_CY} r={SVG_R} fill="url(#ctm-skyGrad)" />

        <g clipPath="url(#ctm-domeClip)">
          <g transform={`scale(${zoom}) translate(${(SVG_CX / zoom - SVG_CX) + pan.x / zoom} ${(SVG_CY / zoom - SVG_CY) + pan.y / zoom})`}>

            {/* Altitude rings */}
            {[30, 60].map(alt => {
              const r = SVG_R * Math.cos((alt * Math.PI) / 180);
              return (
                <circle key={alt} cx={SVG_CX} cy={SVG_CY} r={r}
                  fill="none" stroke="hsl(var(--border) / 0.2)" strokeWidth={0.5} strokeDasharray="4 4" />
              );
            })}

            {/* Ecliptic arc */}
            {(() => {
              const pts: string[] = [];
              for (let lon = 0; lon <= 360; lon += 5) {
                const { x, y } = altAzToXY(0, lon); // approximate ecliptic as horizon arc
                pts.push(`${SVG_CX + x * SVG_R},${SVG_CY - y * SVG_R}`);
              }
              return null; // ecliptic arc omitted for simplicity — planets show positions
            })()}

            {/* Constellation lines */}
            {showConstellations && CONSTELLATION_LINES.map((cl, ci) => {
              const pts = cl.stars.map(s => {
                const { x, y } = starToXY(s.ra, s.dec, snapshot.jd, snapshot.lat, snapshot.lon);
                return { px: SVG_CX + x * SVG_R, py: SVG_CY - y * SVG_R };
              });
              return (
                <g key={ci}>
                  {pts.slice(0, -1).map((p, pi) => (
                    <line key={pi}
                      x1={p.px} y1={p.py}
                      x2={pts[pi + 1].px} y2={pts[pi + 1].py}
                      stroke="hsl(var(--accent) / 0.25)" strokeWidth={0.8 / zoom} />
                  ))}
                  {/* Constellation label at centroid */}
                  {pts.length > 0 && (() => {
                    const cx2 = pts.reduce((s, p) => s + p.px, 0) / pts.length;
                    const cy2 = pts.reduce((s, p) => s + p.py, 0) / pts.length;
                    return (
                      <text x={cx2} y={cy2} textAnchor="middle" fontSize={7 / zoom}
                        fill="hsl(var(--accent) / 0.5)"
                        style={{ fontFamily: 'var(--font-sans)', pointerEvents: 'none' }}>
                        {cl.name}
                      </text>
                    );
                  })()}
                </g>
              );
            })}

            {/* Fixed stars */}
            {showStars && BRIGHT_STARS.map((star, si) => {
              const { x, y } = starToXY(star.ra, star.dec, snapshot.jd, snapshot.lat, snapshot.lon);
              const px = SVG_CX + x * SVG_R;
              const py = SVG_CY - y * SVG_R;
              const r = Math.max(0.8, (7 - star.magnitude) * 0.6) / zoom;
              const below = y < -0.98;
              if (below) return null;
              return (
                <circle key={si} cx={px} cy={py} r={r}
                  fill="hsl(var(--foreground) / 0.7)"
                  opacity={0.6}
                  filter="url(#ctm-starGlow)" />
              );
            })}

            {/* Planets */}
            {showPlanets && snapshot.planets.map(planet => {
              const { x, y } = altAzToXY(planet.altitude, planet.azimuth);
              const px = SVG_CX + x * SVG_R + pan.x;
              const py = SVG_CY - y * SVG_R + pan.y;
              const r2 = planet.size / zoom;
              const belowHorizon = !planet.aboveHorizon;
              const isSelected = selectedPlanet?.key === planet.key;
              return (
                <g key={planet.key}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onPlanetClick(planet)}
                  role="button"
                  aria-label={`${planet.name} — ${formatDeg(planet.degree, planet.minute, planet.sign, planet.retrograde)}`}
                  filter="url(#ctm-planetGlow)"
                >
                  {isSelected && (
                    <circle cx={px} cy={py} r={r2 + 5 / zoom}
                      fill="none" stroke="hsl(var(--primary))"
                      strokeWidth={1.5 / zoom} opacity={0.8} />
                  )}
                  <circle cx={px} cy={py} r={r2}
                    fill={`hsl(var(${planet.colorVar}))`}
                    opacity={belowHorizon ? 0.25 : 0.9} />
                  <text x={px} y={py - r2 - 4 / zoom}
                    textAnchor="middle" fontSize={10 / zoom}
                    fill={`hsl(var(${planet.colorVar}))`}
                    opacity={belowHorizon ? 0.3 : 1}
                    style={{ fontFamily: 'var(--font-sans)', pointerEvents: 'none' }}>
                    {planet.glyph}
                  </text>
                  <text x={px} y={py + r2 + 10 / zoom}
                    textAnchor="middle" fontSize={7 / zoom}
                    fill="hsl(var(--foreground) / 0.7)"
                    opacity={belowHorizon ? 0.3 : 1}
                    style={{ fontFamily: 'var(--font-sans)', pointerEvents: 'none' }}>
                    {planet.name}
                  </text>
                </g>
              );
            })}

            {/* Compass labels */}
            {COMPASS_POINTS.map(({ label, az }) => {
              const r2 = SVG_R * 0.92;
              const azR = az * Math.PI / 180;
              const cx2 = SVG_CX + r2 * Math.sin(azR);
              const cy2 = SVG_CY - r2 * Math.cos(azR);
              return (
                <text key={label} x={cx2} y={cy2 + 4}
                  textAnchor="middle" fontSize={10 / zoom}
                  fill="hsl(var(--muted-foreground) / 0.6)"
                  style={{ fontFamily: 'var(--font-sans)', pointerEvents: 'none' }}>
                  {label}
                </text>
              );
            })}
          </g>
        </g>

        {/* Dome border */}
        <circle cx={SVG_CX} cy={SVG_CY} r={SVG_R}
          fill="none" stroke="hsl(var(--border) / 0.4)" strokeWidth={1} />
      </svg>

      {/* Zoom hint */}
      <p className="text-center text-xs mt-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
        Scroll to zoom · Drag to pan · Click a planet for details
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CelestialTimeMachinePage() {
  const [dateStr, setDateStr] = useState(todayString());
  const [timeStr, setTimeStr] = useState(nowTimeString());
  const [tz, setTz] = useState(-7);
  const [lat, setLat] = useState('40.7128');
  const [lon, setLon] = useState('-74.0060');
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snapshot, setSnapshot] = useState<SkySnapshot | null>(null);
  const [showPlanets, setShowPlanets] = useState(true);
  const [showConstellations, setShowConstellations] = useState(true);
  const [showStars, setShowStars] = useState(true);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetSkyData | null>(null);
  const [activeTab, setActiveTab] = useState<'dome' | 'planets' | 'events' | 'riseset'>('dome');

  function detectLocation() {
    setLocError('');
    if (!navigator.geolocation) { setLocError('Geolocation not supported by your browser.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude.toFixed(4));
        setLon(pos.coords.longitude.toFixed(4));
        setLocating(false);
      },
      () => { setLocError('Could not get location. Enter coordinates manually.'); setLocating(false); }
    );
  }

  const compute = useCallback(() => {
    setError('');
    const latN = parseFloat(lat);
    const lonN = parseFloat(lon);
    if (isNaN(latN) || isNaN(lonN)) { setError('Please enter valid latitude and longitude.'); return; }
    if (!dateStr) { setError('Please select a date.'); return; }

    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);

    setLoading(true);
    try {
      // calculateChart gives us planet longitudes for any date/time
      const chart = calculateChart(year, month, day, hour, minute, latN, lonN, tz);

      // Build the planet-longitude map that buildSkySnapshot expects
      const planetLons: Record<string, { longitude: number; retrograde: boolean }> = {
        sun:     { longitude: chart.sun.longitude,     retrograde: false },
        moon:    { longitude: chart.moon.longitude,    retrograde: false },
        mercury: { longitude: chart.mercury.longitude, retrograde: chart.mercury.retrograde },
        venus:   { longitude: chart.venus.longitude,   retrograde: chart.venus.retrograde },
        mars:    { longitude: chart.mars.longitude,    retrograde: chart.mars.retrograde },
        jupiter: { longitude: chart.jupiter.longitude, retrograde: chart.jupiter.retrograde },
        saturn:  { longitude: chart.saturn.longitude,  retrograde: chart.saturn.retrograde },
        uranus:  { longitude: chart.uranus.longitude,  retrograde: chart.uranus.retrograde },
        neptune: { longitude: chart.neptune.longitude, retrograde: chart.neptune.retrograde },
        pluto:   { longitude: chart.pluto.longitude,   retrograde: chart.pluto.retrograde },
      };

      // Build a UTC Date for the selected local time
      const utcMs = Date.UTC(year, month - 1, day, hour - tz, minute);
      const date = new Date(utcMs);

      const snap = buildSkySnapshot(planetLons, date, latN, lonN);
      setSnapshot(snap);
      setSelectedPlanet(null);
      setActiveTab('dome');
    } catch {
      setError('Could not compute sky positions. Please check your inputs.');
    }
    setLoading(false);
  }, [dateStr, timeStr, tz, lat, lon]);

  function applyPreset(p: typeof PRESETS[number]) {
    setDateStr(`${p.year}-${pad2(p.month)}-${pad2(p.day)}`);
    setTimeStr(`${pad2(p.hour)}:${pad2(p.minute)}`);
    setTz(p.tz);
  }

  const events = snapshot ? deriveEvents(snapshot) : [];

  const TABS = [
    { id: 'dome' as const, label: celestial_time_machine.results.skyDomeTitle, symbol: '◎' },
    { id: 'planets' as const, label: celestial_time_machine.results.planetsTitle, symbol: '☉' },
    { id: 'events' as const, label: celestial_time_machine.results.eventsTitle, symbol: '✦' },
    { id: 'riseset' as const, label: celestial_time_machine.results.riseSetTitle, symbol: '↑↓' },
  ];

  return (
    <>
      <Helmet>
        <title>Celestial Time Machine — Explore Any Sky | Spellful</title>
        <meta name="description" content="Travel to any date and time to see the night sky as it was or will be. Explore planetary positions, astronomical events, and the sky dome for any location on Earth." />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content="Celestial Time Machine | Spellful" />
        <meta property="og:description" content="Explore the night sky at any moment in history or the future." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Celestial Time Machine | Spellful" />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': `${pageUrl}#webpage`,
          name: 'Celestial Time Machine',
          url: pageUrl,
          isPartOf: { '@id': `${siteUrl}/#website` },
        }).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main style={{ background: 'hsl(var(--background))' }}>

        {/* ── Hero ── */}
        <section className="relative pt-16 pb-16 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.10) 0%, transparent 65%)' }} />
          <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-10 text-center">
            <motion.p
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="text-xs tracking-widest uppercase mb-4"
              style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}
            >
              {celestial_time_machine.hero.eyebrow}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl mb-6"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              {celestial_time_machine.hero.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg leading-relaxed max-w-2xl mx-auto mb-6"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
            >
              {celestial_time_machine.hero.subtitle}
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.35 }}>
              <Link to="/astrology"
                className="text-xs tracking-widest uppercase"
                style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}
              >
                {celestial_time_machine.hero.backLink}
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── Controls ── */}
        <section className="pb-10 px-6 md:px-10">
          <div className="max-w-3xl mx-auto">
            <div
              className="rounded-2xl p-6"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--primary) / 0.2)' }}
            >
              {/* Quick-jump presets */}
              <div className="mb-5">
                <p className="text-xs tracking-widest uppercase mb-2"
                  style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}>
                  {celestial_time_machine.controls.presetLabel}
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map(p => (
                    <button
                      key={p.label}
                      onClick={() => applyPreset(p)}
                      className="px-3 py-1.5 rounded-full text-xs transition-all"
                      style={{
                        background: 'hsl(var(--primary) / 0.1)',
                        border: '1px solid hsl(var(--primary) / 0.3)',
                        color: 'hsl(var(--primary))',
                        fontFamily: 'var(--font-sans)',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--primary) / 0.2)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--primary) / 0.1)'; }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Date */}
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-1.5"
                    style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}>
                    {celestial_time_machine.controls.dateLabel}
                  </label>
                  <input
                    type="date" value={dateStr}
                    onChange={e => setDateStr(e.target.value)}
                    min="1800-01-01" max="2200-12-31"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-1.5"
                    style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}>
                    {celestial_time_machine.controls.timeLabel}
                  </label>
                  <input
                    type="time" value={timeStr}
                    onChange={e => setTimeStr(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
                  />
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-1.5"
                    style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}>
                    {celestial_time_machine.controls.timezoneLabel}
                  </label>
                  <select
                    value={tz}
                    onChange={e => setTz(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
                  >
                    {TIMEZONES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-1.5"
                    style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}>
                    {celestial_time_machine.controls.locationLabel}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number" value={lat} onChange={e => setLat(e.target.value)}
                      placeholder="Lat e.g. 40.71"
                      step="0.0001" min="-90" max="90"
                      className="w-full px-3 py-3 rounded-xl text-sm outline-none"
                      style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
                    />
                    <input
                      type="number" value={lon} onChange={e => setLon(e.target.value)}
                      placeholder="Lon e.g. -74.00"
                      step="0.0001" min="-180" max="180"
                      className="w-full px-3 py-3 rounded-xl text-sm outline-none"
                      style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
                    />
                  </div>
                  <button
                    onClick={detectLocation}
                    disabled={locating}
                    className="mt-2 flex items-center gap-1.5 text-xs transition-opacity"
                    style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)', opacity: locating ? 0.5 : 1 }}
                  >
                    {locating ? <MapPin size={12} /> : <Locate size={12} />}
                    {locating ? 'Detecting…' : celestial_time_machine.controls.detectButton}
                  </button>
                  {locError && (
                    <p className="text-xs mt-1" style={{ color: 'hsl(var(--destructive))', fontFamily: 'var(--font-sans)' }}>{locError}</p>
                  )}
                </div>
              </div>

              {error && (
                <p className="text-sm text-center mb-3" style={{ color: 'hsl(var(--destructive))', fontFamily: 'var(--font-sans)' }}>{error}</p>
              )}

              <div className="flex justify-center">
                <button
                  onClick={compute}
                  disabled={loading}
                  className="px-10 py-4 rounded-2xl text-sm tracking-widest uppercase transition-all duration-200"
                  style={{
                    background: 'hsl(var(--primary) / 0.15)',
                    border: '1px solid hsl(var(--primary) / 0.5)',
                    color: 'hsl(var(--primary))',
                    fontFamily: 'var(--font-sans)',
                    letterSpacing: '0.15em',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--primary) / 0.25)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--primary) / 0.15)'; }}
                >
                  {loading ? celestial_time_machine.controls.loadingButton : celestial_time_machine.controls.goButton}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Results ── */}
        <AnimatePresence>
          {snapshot && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Timestamp banner */}
              <section className="pb-4 px-6 md:px-10">
                <div className="max-w-3xl mx-auto text-center">
                  <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    Sky for <span style={{ color: 'hsl(var(--primary))' }}>{dateStr} at {timeStr}</span>
                    {' '}(UTC{tz >= 0 ? '+' : ''}{tz}) · {parseFloat(lat).toFixed(2)}°, {parseFloat(lon).toFixed(2)}°
                  </p>
                </div>
              </section>

              {/* Share */}
              <section className="pb-4 px-6 md:px-10">
                <div className="max-w-3xl mx-auto">
                  <ShareBar
                    url="https://spellful.com/astrology/celestial-time-machine"
                    text={`🌌 I just explored the night sky on ${dateStr} with Spellful's Celestial Time Machine! Travel through time with me:`}
                    label="Share this moment in time"
                  />
                </div>
              </section>

              {/* Tab bar */}
              <section className="pb-4 px-6 md:px-10">
                <div className="max-w-3xl mx-auto">
                  <div
                    className="flex gap-1 p-1 rounded-2xl"
                    style={{ background: 'hsl(var(--muted))' }}
                    role="tablist"
                    aria-label="Celestial Time Machine sections"
                  >
                    {TABS.map(tab => (
                      <button
                        key={tab.id}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs tracking-wide transition-all duration-200"
                        style={{
                          background: activeTab === tab.id ? 'hsl(var(--card))' : 'transparent',
                          color: activeTab === tab.id ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                          fontFamily: 'var(--font-sans)',
                          boxShadow: activeTab === tab.id ? '0 1px 4px hsl(var(--background) / 0.6)' : 'none',
                        }}
                      >
                        <span aria-hidden="true">{tab.symbol}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Tab panels */}
              <section className="pb-24 px-6 md:px-10">
                <div className="max-w-3xl mx-auto">

                  {/* ── SKY DOME ── */}
                  {activeTab === 'dome' && (
                    <div className="relative">
                      {/* Filter pills */}
                      <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Sky dome filters">
                        <FilterPill active={showPlanets} onToggle={() => setShowPlanets(v => !v)} icon={<span aria-hidden="true">☉</span>}>
                          {celestial_time_machine.results.filterPlanets}
                        </FilterPill>
                        <FilterPill active={showConstellations} onToggle={() => setShowConstellations(v => !v)} icon={<span aria-hidden="true">✦</span>}>
                          {celestial_time_machine.results.filterConstellations}
                        </FilterPill>
                        <FilterPill active={showStars} onToggle={() => setShowStars(v => !v)} icon={<span aria-hidden="true">★</span>}>
                          {celestial_time_machine.results.filterStars}
                        </FilterPill>
                      </div>

                      <div className="relative">
                        <SkyDomeSVG
                          snapshot={snapshot}
                          showPlanets={showPlanets}
                          showConstellations={showConstellations}
                          showStars={showStars}
                          selectedPlanet={selectedPlanet}
                          onPlanetClick={p => setSelectedPlanet(prev => prev?.key === p.key ? null : p)}
                        />
                        <AnimatePresence>
                          {selectedPlanet && (
                            <PlanetDetailPanel
                              planet={selectedPlanet}
                              snapshot={snapshot}
                              onClose={() => setSelectedPlanet(null)}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {/* ── PLANETS ── */}
                  {activeTab === 'planets' && (
                    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
                      <table className="w-full text-sm" style={{ fontFamily: 'var(--font-sans)' }}>
                        <thead>
                          <tr style={{ background: 'hsl(var(--muted))' }}>
                            {['Planet', 'Position', 'Sign', 'Status', 'Alt / Az'].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-medium"
                                style={{ color: 'hsl(var(--muted-foreground))' }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {PLANET_ORDER.map((key, i) => {
                            const p = snapshot.planets.find(pl => pl.key === key);
                            if (!p) return null;
                            return (
                              <tr
                                key={key}
                                style={{ background: i % 2 === 0 ? 'hsl(var(--card))' : 'hsl(var(--muted) / 0.5)' }}
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <span style={{ color: `hsl(var(${p.colorVar}))` }}>{planetGlyph(key)}</span>
                                    <span style={{ color: 'hsl(var(--foreground))' }}>{p.name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3" style={{ color: 'hsl(var(--foreground))' }}>
                                  {p.degree}°{p.minute.toString().padStart(2, '0')}′
                                </td>
                                <td className="px-4 py-3" style={{ color: 'hsl(var(--foreground))' }}>
                                  {p.sign}
                                  {p.retrograde && <span className="ml-1 text-xs" style={{ color: 'hsl(var(--destructive))' }}>℞</span>}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className="px-2 py-0.5 rounded-full text-xs"
                                    style={{
                                      background: p.aboveHorizon ? 'hsl(var(--secondary) / 0.15)' : 'hsl(var(--muted))',
                                      color: p.aboveHorizon ? 'hsl(var(--secondary))' : 'hsl(var(--muted-foreground))',
                                    }}
                                  >
                                    {p.aboveHorizon ? celestial_time_machine.results.aboveHorizon : celestial_time_machine.results.belowHorizon}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                  {p.altitude.toFixed(1)}° / {p.azimuth.toFixed(1)}°
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ── EVENTS ── */}
                  {activeTab === 'events' && (
                    <div className="flex flex-col gap-3">
                      {events.length === 0 ? (
                        <p className="text-sm text-center py-12" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                          {celestial_time_machine.results.noEvents}
                        </p>
                      ) : events.map((ev, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.06 }}
                          className="flex items-start gap-3 rounded-xl p-4"
                          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        >
                          <span className="text-lg flex-shrink-0" style={{ color: 'hsl(var(--primary))' }}>✦</span>
                          <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{ev}</p>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* ── RISE / SET ── */}
                  {activeTab === 'riseset' && (
                    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
                      <table className="w-full text-sm" style={{ fontFamily: 'var(--font-sans)' }}>
                        <thead>
                          <tr style={{ background: 'hsl(var(--muted))' }}>
                            {['Planet', '↑ Rise', '⊙ Transit', '↓ Set'].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-medium"
                                style={{ color: 'hsl(var(--muted-foreground))' }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {PLANET_ORDER.map((key, i) => {
                            const p = snapshot.planets.find(pl => pl.key === key);
                            if (!p) return null;
                            const rts = riseTransitSet(p.ra, p.dec, snapshot.date, snapshot.lat, snapshot.lon);
                            return (
                              <tr key={key} style={{ background: i % 2 === 0 ? 'hsl(var(--card))' : 'hsl(var(--muted) / 0.5)' }}>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <span style={{ color: `hsl(var(${p.colorVar}))` }}>{planetGlyph(key)}</span>
                                    <span style={{ color: 'hsl(var(--foreground))' }}>{p.name}</span>
                                  </div>
                                </td>
                                {rts.alwaysAbove ? (
                                  <td colSpan={3} className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                    {celestial_time_machine.results.circumpolar}
                                  </td>
                                ) : rts.alwaysBelow ? (
                                  <td colSpan={3} className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                    {celestial_time_machine.results.alwaysBelow}
                                  </td>
                                ) : (
                                  <>
                                    <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--foreground))' }}>{formatTime(rts.rise)}</td>
                                    <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--foreground))' }}>{formatTime(rts.transit)}</td>
                                    <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--foreground))' }}>{formatTime(rts.set)}</td>
                                  </>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty state ── */}
        {!snapshot && (
          <section className="pb-24 px-6 md:px-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { symbol: '◎', title: 'Interactive Sky Dome', desc: 'A zoomable, pannable SVG sky dome showing every planet exactly where it was in the sky.' },
                  { symbol: '☉', title: 'All 10 Planets', desc: 'Sun through Pluto — sign, degree, retrograde status, altitude, and azimuth for the moment.' },
                  { symbol: '✦', title: 'Astronomical Events', desc: 'Moon phases, planetary conjunctions, retrograde planets, and the Sun\'s sign at a glance.' },
                ].map(({ symbol, title, desc }) => (
                  <div key={title} className="rounded-2xl p-6" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                    <div className="text-3xl mb-3" style={{ color: 'hsl(var(--primary))' }}>{symbol}</div>
                    <h3 className="text-base mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      </main>
    </>
  );
}
