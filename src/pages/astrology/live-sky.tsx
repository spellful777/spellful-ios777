/**
 * Live Sky Explorer — /astrology/live-sky
 *
 * Real-time interactive sky map showing current planetary positions,
 * constellation lines, and bright fixed stars for the user's location.
 *
 * Features:
 *   - SVG sky dome with stereographic projection (zenith = centre)
 *   - Zoom (scroll / pinch) and pan (drag)
 *   - Filter toggles: Planets · Constellations · Stars
 *   - Location: browser geolocation with manual lat/lon fallback
 *   - Planet detail panel on click
 *   - Rising / transit / setting table
 *   - Live clock — refreshes every 60 s
 *   - Day / twilight / night sky gradient
 */

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, MapPin, RefreshCw, Eye, EyeOff, Info, X, Locate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateChart } from '@/lib/astro-calculator';
import {
  buildSkySnapshot,
  altAzToXY,
  starToXY,
  riseTransitSet,
  jdFromDate,
  compassLabel,
  skyPhase,
  SKY_DOME_BG,
  SKY_DOME_HORIZON,
  BRIGHT_STARS,
  CONSTELLATION_LINES,
  type PlanetSkyData,
  type SkySnapshot,
  type SkyPhase,
} from '@/lib/sky-engine';
import { live_sky } from 'virtual:content';
import { useSession } from '@/lib/auth/auth-client';

// ─── Constants ────────────────────────────────────────────────────────────────

const siteUrl = 'https://spellful.com';
const pageUrl = `${siteUrl}/astrology/live-sky`;

const SVG_R = 300;          // radius of the sky dome in SVG units
const SVG_SIZE = SVG_R * 2; // total SVG viewport

// Sky dome colours imported from sky-engine (SVG rendering data, not user copy)

const PLANET_ORDER = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];

// Planet interpretations come from virtual:content (live_sky.planets)

// ─── Types ────────────────────────────────────────────────────────────────────

interface Location { lat: number; lon: number; label: string; }
interface FilterState { planets: boolean; constellations: boolean; stars: boolean; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDeg(deg: number, min: number, sign: string, retro: boolean): string {
  return `${deg}°${String(min).padStart(2, '0')}' ${sign}${retro ? ' ℞' : ''}`;
}

function starRadius(mag: number): number {
  return Math.max(1.2, 3.5 - mag * 0.8);
}

function starOpacity(mag: number): number {
  return Math.max(0.3, Math.min(1, 1 - mag * 0.12));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterPill({
  label, active, onToggle, icon,
}: { label: string; active: boolean; onToggle: () => void; icon: ReactNode }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
      style={{
        background: active ? 'hsl(var(--primary) / 0.18)' : 'hsl(var(--muted))',
        border: `1px solid ${active ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--border))'}`,
        color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {icon}
      {label}
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
      className="absolute top-4 right-4 w-72 rounded-2xl p-5 z-20"
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

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl" style={{ color: `hsl(var(${planet.colorVar}))` }}>
          {planet.glyph}
        </span>
        <div>
          <div className="font-semibold text-base" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
            {planet.name}
          </div>
          <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
            {formatDeg(planet.degree, planet.minute, planet.sign, planet.retrograde)}
          </div>
        </div>
      </div>

      {/* Position */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { label: 'Altitude', value: `${planet.altitude.toFixed(1)}°` },
          { label: 'Azimuth', value: `${planet.azimuth.toFixed(1)}° ${compassDir}` },
          { label: 'Status', value: planet.aboveHorizon ? 'Above horizon' : 'Below horizon' },
          { label: 'Motion', value: planet.retrograde ? 'Retrograde ℞' : 'Direct' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg p-2" style={{ background: 'hsl(var(--muted))' }}>
            <div className="text-xs mb-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{label}</div>
            <div className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Rise / Transit / Set */}
      <div className="mb-4 rounded-lg p-3" style={{ background: 'hsl(var(--muted))' }}>
        <div className="text-xs font-medium mb-2" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>Today's sky times</div>
        {rts.alwaysAbove && <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Circumpolar — never sets</div>}
        {rts.alwaysBelow && <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Below horizon all day</div>}
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

      {/* Interpretation */}
      <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
        {(live_sky.planets as Record<string, string>)[planet.key]}
      </p>
    </motion.div>
  );
}

// ─── Sky Dome SVG ─────────────────────────────────────────────────────────────

interface SkyDomeProps {
  snapshot: SkySnapshot;
  filters: FilterState;
  zoom: number;
  panX: number;
  panY: number;
  onPlanetClick: (p: PlanetSkyData) => void;
  selectedKey: string | null;
  phase: SkyPhase;
}

function SkyDome({ snapshot, filters, zoom, panX, panY, onPlanetClick, selectedKey, phase }: SkyDomeProps) {
  const jd = jdFromDate(snapshot.date);
  const { lat, lon } = snapshot;

  // Compass ring points
  const compassPoints = [
    { label: 'N', az: 0 }, { label: 'E', az: 90 },
    { label: 'S', az: 180 }, { label: 'W', az: 270 },
  ];

  // Altitude rings at 30°, 60°
  const altRings = [30, 60];

  return (
    <svg
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      className="w-full h-full select-none"
      style={{ touchAction: 'none' }}
      aria-label="Interactive sky dome showing current planetary positions"
    >
      <defs>
        <radialGradient id="skyGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={SKY_DOME_BG[phase]} />
          <stop offset="100%" stopColor={SKY_DOME_HORIZON[phase]} />
        </radialGradient>
        <clipPath id="domeClip">
          <circle cx={SVG_R} cy={SVG_R} r={SVG_R} />
        </clipPath>
        <filter id="starGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="planetGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Sky background */}
      <circle cx={SVG_R} cy={SVG_R} r={SVG_R} fill="url(#skyGrad)" />

      {/* Zoom + pan group */}
      <g transform={`translate(${SVG_R + panX}, ${SVG_R + panY}) scale(${zoom})`} clipPath="url(#domeClip)">

        {/* Altitude rings */}
        {altRings.map((alt) => {
          const r = (SVG_R * (90 - alt)) / 90;
          return (
            <circle
              key={alt}
              cx={0} cy={0} r={r}
              fill="none"
              stroke="hsl(var(--accent) / 0.12)"
              strokeWidth={0.5 / zoom}
              strokeDasharray={`${4 / zoom} ${4 / zoom}`}
            />
          );
        })}

        {/* Ecliptic band — 12 zodiac segments */}
        {Array.from({ length: 12 }, (_, i) => {
          const lon1 = i * 30;
          const lon2 = (i + 1) * 30;
          const pts = Array.from({ length: 6 }, (__, j) => {
            const eclLon = lon1 + (lon2 - lon1) * (j / 5);
            const eps = 23.44 * Math.PI / 180;
            const lonR = eclLon * Math.PI / 180;
            const sinDec = Math.sin(eps) * Math.sin(lonR);
            const decD = Math.asin(sinDec) * 180 / Math.PI;
            const raD = Math.atan2(Math.cos(eps) * Math.sin(lonR), Math.cos(lonR)) * 180 / Math.PI;
            const ra = ((raD % 360) + 360) % 360;
            const dec = decD;
            const lst = ((greenwichSiderealTimeApprox(jd) + lon) % 360 + 360) % 360;
            const ha = ((lst - ra) % 360 + 360) % 360;
            const haR = ha * Math.PI / 180;
            const decR = dec * Math.PI / 180;
            const latR = lat * Math.PI / 180;
            const sinAlt = Math.sin(decR) * Math.sin(latR) + Math.cos(decR) * Math.cos(latR) * Math.cos(haR);
            const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * 180 / Math.PI;
            const cosAz = (Math.sin(decR) - Math.sin(altitude * Math.PI / 180) * Math.sin(latR))
                        / (Math.cos(altitude * Math.PI / 180) * Math.cos(latR));
            const azBase = Math.acos(Math.max(-1, Math.min(1, cosAz))) * 180 / Math.PI;
            const azimuth = Math.sin(haR) > 0 ? 360 - azBase : azBase;
            const r2 = Math.max(0, (90 - altitude) / 90);
            const azR = azimuth * Math.PI / 180;
            return { x: r2 * Math.sin(azR) * SVG_R, y: -r2 * Math.cos(azR) * SVG_R };
          });
          const d = pts.map((p, j) => `${j === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
          return <path key={i} d={d} fill="none" stroke="hsl(var(--primary) / 0.18)" strokeWidth={0.8 / zoom} />;
        })}

        {/* Constellation lines */}
        {filters.constellations && CONSTELLATION_LINES.map((con) => (
          <g key={con.name}>
            {con.segments.map(([a, b], si) => {
              const starA = con.stars[a];
              const starB = con.stars[b];
              if (!starA || !starB) return null;
              const posA = starToXY(starA.ra, starA.dec, jd, lat, lon);
              const posB = starToXY(starB.ra, starB.dec, jd, lat, lon);
              if (posA.altitude < -10 && posB.altitude < -10) return null;
              return (
                <line
                  key={si}
                  x1={posA.x * SVG_R} y1={posA.y * SVG_R}
                  x2={posB.x * SVG_R} y2={posB.y * SVG_R}
                  stroke="hsl(var(--accent) / 0.25)"
                  strokeWidth={0.8 / zoom}
                />
              );
            })}
            {/* Constellation label at centroid of visible stars */}
            {(() => {
              const visible = con.stars.filter((s) => {
                const p = starToXY(s.ra, s.dec, jd, lat, lon);
                return p.altitude > 5;
              });
              if (visible.length < 2) return null;
              const cx2 = visible.reduce((s, st) => {
                const p = starToXY(st.ra, st.dec, jd, lat, lon);
                return s + p.x * SVG_R;
              }, 0) / visible.length;
              const cy2 = visible.reduce((s, st) => {
                const p = starToXY(st.ra, st.dec, jd, lat, lon);
                return s + p.y * SVG_R;
              }, 0) / visible.length;
              return (
                <text
                  key="label"
                  x={cx2} y={cy2}
                  textAnchor="middle"
                  fontSize={8 / zoom}
                  fill="hsl(var(--accent) / 0.45)"
                  style={{ fontFamily: 'var(--font-sans)', pointerEvents: 'none' }}
                >
                  {con.name}
                </text>
              );
            })()}
          </g>
        ))}

        {/* Fixed stars */}
        {filters.stars && BRIGHT_STARS.map((star) => {
          const pos = starToXY(star.ra, star.dec, jd, lat, lon);
          if (pos.altitude < -5) return null;
          const sx = pos.x * SVG_R;
          const sy = pos.y * SVG_R;
          const r2 = starRadius(star.magnitude) / zoom;
          const op = starOpacity(star.magnitude) * (pos.altitude < 0 ? 0.3 : 1);
          return (
            <g key={star.name} filter="url(#starGlow)">
              <circle cx={sx} cy={sy} r={r2} fill="white" opacity={op} />
              {star.magnitude < 1.5 && (
                <text
                  x={sx + r2 + 2 / zoom} y={sy + 3 / zoom}
                  fontSize={6 / zoom}
                  fill="hsl(var(--foreground) / 0.5)"
                  style={{ fontFamily: 'var(--font-sans)', pointerEvents: 'none' }}
                >
                  {star.name}
                </text>
              )}
            </g>
          );
        })}

        {/* Planets */}
        {filters.planets && snapshot.planets
          .filter((p) => PLANET_ORDER.includes(p.key))
          .map((planet) => {
            const { x, y } = altAzToXY(planet.altitude, planet.azimuth);
            const px = x * SVG_R;
            const py = y * SVG_R;
            const isSelected = selectedKey === planet.key;
            const belowHorizon = planet.altitude < 0;
            const r2 = planet.size / zoom;

            return (
              <g
                key={planet.key}
                style={{ cursor: 'pointer' }}
                onClick={() => onPlanetClick(planet)}
                role="button"
                aria-label={`${planet.name} — ${formatDeg(planet.degree, planet.minute, planet.sign, planet.retrograde)}`}
                filter="url(#planetGlow)"
              >
                {isSelected && (
                  <circle
                    cx={px} cy={py}
                    r={r2 + 5 / zoom}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth={1.5 / zoom}
                    opacity={0.8}
                  />
                )}
                <circle
                  cx={px} cy={py} r={r2}
                  fill={`hsl(var(${planet.colorVar}))`}
                  opacity={belowHorizon ? 0.25 : 0.9}
                />
                <text
                  x={px} y={py - r2 - 4 / zoom}
                  textAnchor="middle"
                  fontSize={10 / zoom}
                  fill={`hsl(var(${planet.colorVar}))`}
                  opacity={belowHorizon ? 0.3 : 1}
                  style={{ fontFamily: 'var(--font-sans)', pointerEvents: 'none' }}
                >
                  {planet.glyph}
                </text>
                <text
                  x={px} y={py + r2 + 10 / zoom}
                  textAnchor="middle"
                  fontSize={7 / zoom}
                  fill="hsl(var(--foreground) / 0.7)"
                  opacity={belowHorizon ? 0.3 : 1}
                  style={{ fontFamily: 'var(--font-sans)', pointerEvents: 'none' }}
                >
                  {planet.name}
                </text>
              </g>
            );
          })}

        {/* Compass labels */}
        {compassPoints.map(({ label, az }) => {
          const r2 = SVG_R * 0.92;
          const azR = az * Math.PI / 180;
          const cx2 = r2 * Math.sin(azR);
          const cy2 = -r2 * Math.cos(azR);
          return (
            <text
              key={label}
              x={cx2} y={cy2 + 4 / zoom}
              textAnchor="middle"
              fontSize={10 / zoom}
              fill="hsl(var(--foreground) / 0.5)"
              style={{ fontFamily: 'var(--font-sans)', pointerEvents: 'none' }}
            >
              {label}
            </text>
          );
        })}

        {/* Zenith dot */}
        <circle cx={0} cy={0} r={2 / zoom} fill="hsl(var(--primary) / 0.5)" />
      </g>

      {/* Horizon circle overlay */}
      <circle
        cx={SVG_R} cy={SVG_R} r={SVG_R}
        fill="none"
        stroke="hsl(var(--accent) / 0.35)"
        strokeWidth={1.5}
      />
    </svg>
  );
}

// Inline GST approximation to avoid import cycle in JSX
function greenwichSiderealTimeApprox(jd: number): number {
  const t = (jd - 2451545.0) / 36525;
  return ((280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t) % 360 + 360) % 360;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LiveSkyPage() {
  // Auth guard
  const navigate = useNavigate();
  const { session, isPending: authPending } = useSession();
  useEffect(() => {
    if (!authPending && !session) void navigate('/login?redirect=/astrology/live-sky');
  }, [session, authPending, navigate]);

  // Location state
  const [location, setLocation] = useState<Location>({ lat: 40.71, lon: -74.01, label: 'New York, NY' });
  const [locStatus, setLocStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');
  const [showLocInput, setShowLocInput] = useState(false);
  const [latInput, setLatInput] = useState('');
  const [lonInput, setLonInput] = useState('');

  // Time
  const [now, setNow] = useState<Date>(() => new Date());

  // Sky snapshot
  const [snapshot, setSnapshot] = useState<SkySnapshot | null>(null);

  // Filters
  const [filters, setFilters] = useState<FilterState>({ planets: true, constellations: true, stars: true });

  // Interaction
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetSkyData | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const isDragging = useRef(false);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const svgRef = useRef<HTMLDivElement>(null);

  // ── Tick every 60 s ──
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Build snapshot whenever time or location changes ──
  useEffect(() => {
    const y = now.getUTCFullYear();
    const mo = now.getUTCMonth() + 1;
    const d = now.getUTCDate();
    const h = now.getUTCHours();
    const min = now.getUTCMinutes();
    try {
      const chart = calculateChart(y, mo, d, h, min, location.lat, location.lon, 0);
      const lons: Record<string, { longitude: number; retrograde: boolean }> = {
        sun:     { longitude: chart.sun.longitude,     retrograde: chart.sun.retrograde },
        moon:    { longitude: chart.moon.longitude,    retrograde: chart.moon.retrograde },
        mercury: { longitude: chart.mercury.longitude, retrograde: chart.mercury.retrograde },
        venus:   { longitude: chart.venus.longitude,   retrograde: chart.venus.retrograde },
        mars:    { longitude: chart.mars.longitude,    retrograde: chart.mars.retrograde },
        jupiter: { longitude: chart.jupiter.longitude, retrograde: chart.jupiter.retrograde },
        saturn:  { longitude: chart.saturn.longitude,  retrograde: chart.saturn.retrograde },
        uranus:  { longitude: chart.uranus.longitude,  retrograde: chart.uranus.retrograde },
        neptune: { longitude: chart.neptune.longitude, retrograde: chart.neptune.retrograde },
        pluto:   { longitude: chart.pluto.longitude,   retrograde: chart.pluto.retrograde },
      };
      setSnapshot(buildSkySnapshot(lons, now, location.lat, location.lon));
    } catch {
      // silently ignore calculation errors
    }
  }, [now, location]);

  // ── Geolocation ──
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocStatus('denied'); return; }
    setLocStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 100) / 100;
        const lon = Math.round(pos.coords.longitude * 100) / 100;
        setLocation({ lat, lon, label: `${lat}°, ${lon}°` });
        setLocStatus('granted');
      },
      () => setLocStatus('denied'),
      { timeout: 8000 }
    );
  }, []);

  const applyManualLocation = useCallback(() => {
    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) return;
    setLocation({ lat, lon, label: `${lat}°, ${lon}°` });
    setShowLocInput(false);
  }, [latInput, lonInput]);

  // ── Zoom / pan handlers ──
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.5, Math.min(4, z - e.deltaY * 0.001)));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !lastPointer.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    setPanX((p) => p + dx);
    setPanY((p) => p + dy);
    lastPointer.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    lastPointer.current = null;
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, []);

  // ── Derived ──
  const phase: SkyPhase = snapshot
    ? skyPhase(snapshot.planets.find((p) => p.key === 'sun')?.altitude ?? -20)
    : 'night';

  const aboveCount = snapshot?.planets.filter((p) => p.aboveHorizon).length ?? 0;

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  // While auth is resolving, show a minimal loading state
  if (authPending || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--background))' }}>
        <div className="text-center">
          <div className="text-3xl mb-3 animate-pulse">✦</div>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
            {authPending ? 'Loading…' : 'Redirecting to sign in…'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Live Sky Explorer — Real-Time Sky Map | Spellful</title>
        <meta name="description" content="Explore the live night sky with real-time planetary positions, constellation lines, and rising/setting times for your location. Interactive sky dome for astrology enthusiasts." />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content="Live Sky Explorer | Spellful" />
        <meta property="og:description" content="Real-time interactive sky map with planetary positions, constellations, and rising/setting times." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={`${siteUrl}/airo-assets/uploads/pages-og-image-7ff4c824.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Live Sky Explorer | Spellful" />
        <meta name="twitter:description" content="Real-time interactive sky map with planetary positions, constellations, and rising/setting times." />
        <meta name="twitter:image" content={`${siteUrl}/airo-assets/uploads/pages-og-image-7ff4c824.png`} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          '@id': `${pageUrl}#webapp`,
          name: 'Live Sky Explorer',
          url: pageUrl,
          description: 'Real-time interactive sky map showing planetary positions and constellations',
          isPartOf: { '@id': `${siteUrl}/#website` },
        }).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main style={{ background: 'hsl(var(--background))', minHeight: '100vh' }}>
        {/* ── Header ── */}
        <section className="pt-8 pb-6 px-6 md:px-10">
          <div className="max-w-7xl mx-auto">
            <Link
              to="/astrology"
              className="inline-flex items-center gap-2 text-sm mb-6 transition-opacity hover:opacity-70"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
            >
              <ArrowLeft size={14} />
              Astrology Hub
            </Link>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
                  {live_sky.hero.eyebrow}
                </p>
                <h1 className="text-3xl md:text-5xl mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                  {live_sky.hero.title}
                </h1>
                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  Real-time sky map for {location.label} · {dateStr} · {timeStr}
                </p>
              </div>

              {/* Location controls */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestLocation}
                  disabled={locStatus === 'loading'}
                  className="gap-1.5"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  <Locate size={13} />
                  {locStatus === 'loading' ? 'Locating…' : 'Use my location'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLocInput((v) => !v)}
                  className="gap-1.5"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  <MapPin size={13} />
                  Manual
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNow(new Date())}
                  className="gap-1.5"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  <RefreshCw size={13} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Manual location input */}
            <AnimatePresence>
              {showLocInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 overflow-hidden"
                >
                  <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Latitude (−90 to 90)</label>
                      <input
                        type="number"
                        value={latInput}
                        onChange={(e) => setLatInput(e.target.value)}
                        placeholder="40.71"
                        className="w-28 px-3 py-1.5 rounded-lg text-sm"
                        style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Longitude (−180 to 180)</label>
                      <input
                        type="number"
                        value={lonInput}
                        onChange={(e) => setLonInput(e.target.value)}
                        placeholder="-74.01"
                        className="w-28 px-3 py-1.5 rounded-lg text-sm"
                        style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
                      />
                    </div>
                    <Button size="sm" onClick={applyManualLocation} style={{ fontFamily: 'var(--font-sans)' }}>Apply</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowLocInput(false)} style={{ fontFamily: 'var(--font-sans)' }}>Cancel</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {locStatus === 'denied' && (
              <p className="mt-2 text-xs" style={{ color: 'hsl(var(--destructive))', fontFamily: 'var(--font-sans)' }}>
                Location access denied — using default location. Enter coordinates manually above.
              </p>
            )}
          </div>
        </section>

        {/* ── Main layout ── */}
        <section className="px-6 md:px-10 pb-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-6">

              {/* ── Sky dome ── */}
              <div className="flex-1 min-w-0">
                {/* Filter bar */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <FilterPill
                    label="Planets"
                    active={filters.planets}
                    onToggle={() => setFilters((f) => ({ ...f, planets: !f.planets }))}
                    icon={filters.planets ? <Eye size={11} /> : <EyeOff size={11} />}
                  />
                  <FilterPill
                    label="Constellations"
                    active={filters.constellations}
                    onToggle={() => setFilters((f) => ({ ...f, constellations: !f.constellations }))}
                    icon={filters.constellations ? <Eye size={11} /> : <EyeOff size={11} />}
                  />
                  <FilterPill
                    label="Stars"
                    active={filters.stars}
                    onToggle={() => setFilters((f) => ({ ...f, stars: !f.stars }))}
                    icon={filters.stars ? <Eye size={11} /> : <EyeOff size={11} />}
                  />
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                      {aboveCount}/10 planets above horizon
                    </span>
                    <button
                      onClick={resetView}
                      className="text-xs px-2 py-1 rounded-lg transition-opacity hover:opacity-70"
                      style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
                    >
                      Reset view
                    </button>
                  </div>
                </div>

                {/* Dome container */}
                <div
                  ref={svgRef}
                  className="relative rounded-2xl overflow-hidden"
                  style={{
                    aspectRatio: '1 / 1',
                    maxHeight: '70vh',
                    background: SKY_DOME_BG[phase],
                    border: '1px solid hsl(var(--border))',
                    cursor: isDragging.current ? 'grabbing' : 'grab',
                  }}
                  onWheel={handleWheel}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                >
                  {snapshot ? (
                    <>
                      <SkyDome
                        snapshot={snapshot}
                        filters={filters}
                        zoom={zoom}
                        panX={panX}
                        panY={panY}
                        onPlanetClick={(p) => setSelectedPlanet((prev) => prev?.key === p.key ? null : p)}
                        selectedKey={selectedPlanet?.key ?? null}
                        phase={phase}
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
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl mb-2 animate-pulse">✦</div>
                        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                          Calculating sky positions…
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Sky phase badge */}
                  <div
                    className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-xs"
                    style={{
                      background: 'hsl(var(--card) / 0.85)',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--muted-foreground))',
                      fontFamily: 'var(--font-sans)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {phase === 'day' ? '☀ Daytime' :
                     phase === 'civil_twilight' ? '🌅 Civil twilight' :
                     phase === 'nautical_twilight' ? '🌆 Nautical twilight' :
                     phase === 'astronomical_twilight' ? '🌃 Astronomical twilight' :
                     '🌙 Night sky'}
                  </div>

                  {/* Zoom hint */}
                  <div
                    className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-xs"
                    style={{
                      background: 'hsl(var(--card) / 0.85)',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--muted-foreground))',
                      fontFamily: 'var(--font-sans)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    Scroll to zoom · Drag to pan
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-3 flex flex-wrap gap-3">
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    <Info size={11} />
                    Click any planet for details
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    <span style={{ color: 'hsl(var(--primary))' }}>—</span>
                    Ecliptic path
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    <span style={{ color: 'hsl(var(--accent))' }}>—</span>
                    Constellation lines
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    Faded planets are below the horizon
                  </div>
                </div>
              </div>

              {/* ── Right panel: planet table ── */}
              <div className="lg:w-80 flex-shrink-0">
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                >
                  <div className="px-5 py-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                      Planetary Positions
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                      {dateStr} · {timeStr} UTC
                    </p>
                  </div>

                  <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
                    {snapshot
                      ? PLANET_ORDER.map((key) => {
                          const p = snapshot.planets.find((pl) => pl.key === key);
                          if (!p) return null;
                          const isSelected = selectedPlanet?.key === key;
                          return (
                            <button
                              key={key}
                              onClick={() => setSelectedPlanet((prev) => prev?.key === key ? null : p)}
                              className="w-full px-5 py-3 flex items-center gap-3 text-left transition-colors hover:bg-white/5"
                              style={{
                                background: isSelected ? 'hsl(var(--primary) / 0.08)' : 'transparent',
                              }}
                            >
                              <span className="text-lg w-6 text-center flex-shrink-0" style={{ color: `hsl(var(${p.colorVar}))` }}>
                                {p.glyph}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                                    {p.name}
                                  </span>
                                  {p.retrograde && (
                                    <span className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>℞</span>
                                  )}
                                </div>
                                <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                                  {formatDeg(p.degree, p.minute, p.sign, false)}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div
                                  className="text-xs font-medium"
                                  style={{
                                    color: p.aboveHorizon ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))',
                                    fontFamily: 'var(--font-sans)',
                                  }}
                                >
                                  {p.altitude.toFixed(0)}°
                                </div>
                                <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                                  {compassLabel(p.azimuth)}
                                </div>
                              </div>
                            </button>
                          );
                        })
                      : Array.from({ length: 10 }, (_, i) => (
                          <div key={i} className="px-5 py-3 flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full animate-pulse" style={{ background: 'hsl(var(--muted))' }} />
                            <div className="flex-1">
                              <div className="h-3 w-20 rounded animate-pulse mb-1" style={{ background: 'hsl(var(--muted))' }} />
                              <div className="h-2.5 w-28 rounded animate-pulse" style={{ background: 'hsl(var(--muted))' }} />
                            </div>
                          </div>
                        ))
                    }
                  </div>
                </div>

                {/* Rising / setting table */}
                {snapshot && (
                  <div
                    className="mt-4 rounded-2xl overflow-hidden"
                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  >
                    <div className="px-5 py-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                      <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                        Rise &amp; Set Times
                      </h2>
                      <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                        Local time for {location.label}
                      </p>
                    </div>
                    <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
                      {['sun','moon','mercury','venus','mars','jupiter','saturn'].map((key) => {
                        const p = snapshot.planets.find((pl) => pl.key === key);
                        if (!p) return null;
                        const rts = riseTransitSet(p.ra, p.dec, snapshot.date, snapshot.lat, snapshot.lon);
                        return (
                          <div key={key} className="px-5 py-2.5 flex items-center gap-2">
                            <span className="text-base w-5 text-center flex-shrink-0" style={{ color: `hsl(var(${p.colorVar}))` }}>
                              {p.glyph}
                            </span>
                            <span className="text-xs w-16 flex-shrink-0" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                              {p.name}
                            </span>
                            {rts.alwaysAbove ? (
                              <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Circumpolar</span>
                            ) : rts.alwaysBelow ? (
                              <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Below horizon</span>
                            ) : (
                              <div className="flex gap-3 text-xs" style={{ fontFamily: 'var(--font-sans)' }}>
                                <span style={{ color: 'hsl(var(--success))' }}>↑ {formatTime(rts.rise)}</span>
                                <span style={{ color: 'hsl(var(--muted-foreground))' }}>⊙ {formatTime(rts.transit)}</span>
                                <span style={{ color: 'hsl(var(--destructive))' }}>↓ {formatTime(rts.set)}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── How to read section ── */}
        <section className="px-6 md:px-10 pb-20" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          <div className="max-w-3xl mx-auto pt-12">
            <h2 className="text-2xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              {live_sky.howTo.heading}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {live_sky.howTo.cards.map((card) => (
                <div
                  key={card.id}
                  className="p-4 rounded-xl"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                >
                  <div className="font-semibold text-sm mb-1.5" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{card.title}</div>
                  <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
