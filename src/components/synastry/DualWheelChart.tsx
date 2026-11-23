/**
 * DualWheelChart — renders two natal wheels overlaid in a single SVG.
 * Person A's planets sit on the inner ring; Person B's on the outer ring.
 * Synastry aspect lines connect them across the center.
 */

import type { ChartData, PlanetPosition } from '@/lib/astro-calculator';
import type { SynastryAspect } from '@/lib/synastry';

type PlanetKey = 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto';

const SIGN_SYMBOLS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const SIGN_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

const PLANET_SYMBOLS: Record<string, string> = {
  sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂',
  jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇',
};

const PLANET_COLORS_A: Record<string, string> = {
  sun: 'hsl(var(--astro-sun))', moon: 'hsl(var(--astro-moon))', mercury: 'hsl(var(--astro-mercury))',
  venus: 'hsl(var(--astro-venus))', mars: 'hsl(var(--astro-mars))', jupiter: 'hsl(var(--astro-sun))',
  saturn: 'hsl(var(--accent))', uranus: 'hsl(var(--grimoire-dream))', neptune: 'hsl(var(--info))',
  pluto: 'hsl(var(--grimoire-tarot))',
};

// Person B uses slightly muted versions via opacity
const PLANET_COLORS_B: Record<string, string> = {
  sun: 'hsl(var(--grimoire-ritual))', moon: 'hsl(var(--grimoire-dream))', mercury: 'hsl(var(--grimoire-herb))',
  venus: 'hsl(var(--astro-venus))', mars: 'hsl(var(--astro-mars))', jupiter: 'hsl(var(--astro-sun))',
  saturn: 'hsl(var(--muted-foreground))', uranus: 'hsl(var(--astro-mercury))', neptune: 'hsl(var(--accent))',
  pluto: 'hsl(var(--grimoire-tarot))',
};

const ASPECT_COLORS: Record<string, string> = {
  Conjunction: 'hsl(var(--primary))',
  Trine:       'hsl(var(--grimoire-herb))',
  Sextile:     'hsl(var(--grimoire-dream))',
  Square:      'hsl(var(--astro-mars))',
  Opposition:  'hsl(var(--accent))',
  Quincunx:    'hsl(var(--grimoire-ritual))',
};

function toRad(d: number) { return d * Math.PI / 180; }
function norm360(d: number) { return ((d % 360) + 360) % 360; }

// Convert ecliptic longitude to SVG angle (ASC on left = 180°)
function chartAngle(lon: number, ascLon: number) {
  return norm360(lon - ascLon + 180);
}

interface Props {
  chartA: ChartData;
  chartB: ChartData;
  nameA?: string;
  nameB?: string;
  aspects: SynastryAspect[];
  size?: number;
}

export default function DualWheelChart({ chartA, chartB, nameA = 'You', nameB = 'Partner', aspects, size = 340 }: Props) {
  const cx = size / 2;
  const cy = size / 2;

  // Radii
  const outerR   = size * 0.42;  // outer zodiac ring
  const signR    = size * 0.36;  // inner zodiac ring
  const midR     = size * 0.30;  // divider between A and B planet rings
  const bPlanetR = size * 0.26;  // person B planet ring
  const aPlanetR = size * 0.20;  // person A planet ring
  const coreR    = size * 0.14;  // center fill

  // Use chartA's ASC as the reference angle
  const ascLon = chartA.ascendant.longitude;

  const planetKeys: PlanetKey[] = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];

  // Top-N aspects to draw lines for (most significant)
  const topAspects = aspects
    .filter(a => ['Conjunction','Trine','Sextile','Square','Opposition'].includes(a.type))
    .filter(a => {
      const imp = ['sun','moon','venus','mars','ascendant','jupiter','saturn'];
      return imp.includes(a.planet1) && imp.includes(a.planet2);
    })
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
    .slice(0, 10);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ maxWidth: '100%', display: 'block', margin: '0 auto' }}
      aria-label={`Synastry dual wheel chart for ${nameA} and ${nameB}`}
    >
      {/* Background */}
      <circle cx={cx} cy={cy} r={outerR} fill="hsl(var(--card-deep))" stroke="hsl(var(--border))" strokeWidth="1" />

      {/* Zodiac sign ring */}
      {SIGN_NAMES.map((sign, i) => {
        const startAngle = chartAngle(i * 30, ascLon) - 90;
        const startRad = toRad(startAngle);
        const x1 = cx + outerR * Math.cos(startRad);
        const y1 = cy + outerR * Math.sin(startRad);
        const x2 = cx + signR * Math.cos(startRad);
        const y2 = cy + signR * Math.sin(startRad);
        const midAngle = chartAngle(i * 30 + 15, ascLon) - 90;
        const midRad = toRad(midAngle);
        const symR = (outerR + signR) / 2;
        const sx = cx + symR * Math.cos(midRad);
        const sy = cy + symR * Math.sin(midRad);
        return (
          <g key={sign}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--border))" strokeWidth="0.5" />
            <text x={sx} y={sy} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.033} fill="hsl(var(--muted-foreground))" style={{ fontFamily: 'serif' }}>
              {/* eslint-disable-next-line security/detect-object-injection */}
              {SIGN_SYMBOLS[i]}
            </text>
          </g>
        );
      })}

      {/* Ring borders */}
      <circle cx={cx} cy={cy} r={signR}    fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
      <circle cx={cx} cy={cy} r={midR}     fill="hsl(var(--card))" stroke="hsl(var(--primary) / 0.4)" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx={cx} cy={cy} r={coreR}    fill="hsl(var(--card-deep))" stroke="hsl(var(--border))" strokeWidth="0.5" />

      {/* Aspect lines (drawn before planets so planets sit on top) */}
      {topAspects.map((asp, i) => {
        const lonA = (chartA[asp.planet1 as PlanetKey] as PlanetPosition | undefined)?.longitude
          ?? (asp.planet1 === 'ascendant' ? chartA.ascendant.longitude : 0);
        const lonB = (chartB[asp.planet2 as PlanetKey] as PlanetPosition | undefined)?.longitude
          ?? (asp.planet2 === 'ascendant' ? chartB.ascendant.longitude : 0);
        const angA = chartAngle(lonA, ascLon) - 90;
        const angB = chartAngle(lonB, ascLon) - 90;
        const x1 = cx + aPlanetR * Math.cos(toRad(angA));
        const y1 = cy + aPlanetR * Math.sin(toRad(angA));
        const x2 = cx + bPlanetR * Math.cos(toRad(angB));
        const y2 = cy + bPlanetR * Math.sin(toRad(angB));
        // eslint-disable-next-line security/detect-object-injection
        const color = ASPECT_COLORS[asp.type] ?? 'hsl(var(--muted-foreground))';
        const isHarmonious = asp.score > 0;
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={color}
            strokeWidth={isHarmonious ? 1 : 0.7}
            strokeOpacity={0.5}
            strokeDasharray={isHarmonious ? 'none' : '3 2'}
          />
        );
      })}

      {/* Person A planets (inner ring) */}
      {planetKeys.map(key => {
        // eslint-disable-next-line security/detect-object-injection
        const pos = chartA[key] as PlanetPosition;
        const angle = chartAngle(pos.longitude, ascLon) - 90;
        const rad = toRad(angle);
        const r = aPlanetR;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);
        // eslint-disable-next-line security/detect-object-injection
        const color = PLANET_COLORS_A[key];
        return (
          <g key={`a-${key}`}>
            <circle cx={x} cy={y} r={size * 0.038} fill="hsl(var(--card))" stroke={color} strokeWidth="1" />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.032} fill={color} style={{ fontFamily: 'serif' }}>
              {/* eslint-disable-next-line security/detect-object-injection */}
              {PLANET_SYMBOLS[key]}
            </text>
          </g>
        );
      })}

      {/* Person B planets (outer ring between midR and signR) */}
      {planetKeys.map(key => {
        // eslint-disable-next-line security/detect-object-injection
        const pos = chartB[key] as PlanetPosition;
        const angle = chartAngle(pos.longitude, ascLon) - 90;
        const rad = toRad(angle);
        const r = bPlanetR;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);
        // eslint-disable-next-line security/detect-object-injection
        const color = PLANET_COLORS_B[key];
        return (
          <g key={`b-${key}`}>
            <circle cx={x} cy={y} r={size * 0.038} fill="hsl(var(--card))" stroke={color} strokeWidth="1" strokeDasharray="2 1" />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.032} fill={color} style={{ fontFamily: 'serif' }}>
              {/* eslint-disable-next-line security/detect-object-injection */}
              {PLANET_SYMBOLS[key]}
            </text>
          </g>
        );
      })}

      {/* ASC marker */}
      <text
        x={cx - outerR + size * 0.02}
        y={cy + size * 0.015}
        textAnchor="middle"
        fontSize={size * 0.028}
        fill="hsl(var(--primary))"
        style={{ fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}
      >
        ASC
      </text>

      {/* Center labels */}
      <text x={cx} y={cy - size * 0.025} textAnchor="middle" fontSize={size * 0.038} fill="hsl(var(--primary))" style={{ fontFamily: 'var(--font-heading)' }}>
        {nameA.slice(0, 8)}
      </text>
      <text x={cx} y={cy + size * 0.025} textAnchor="middle" fontSize={size * 0.028} fill="hsl(var(--accent))" style={{ fontFamily: 'var(--font-heading)' }}>
        &amp; {nameB.slice(0, 8)}
      </text>

      {/* Legend */}
      <g transform={`translate(${cx - outerR + 4}, ${cy + outerR - 28})`}>
        <circle cx="6" cy="6" r="4" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" />
        <text x="14" y="10" fontSize={size * 0.028} fill="hsl(var(--muted-foreground))" style={{ fontFamily: 'var(--font-sans)' }}>{nameA.slice(0,6)}</text>
        <circle cx="6" cy="20" r="4" fill="none" stroke="hsl(var(--accent))" strokeWidth="1" strokeDasharray="2 1" />
        <text x="14" y="24" fontSize={size * 0.028} fill="hsl(var(--muted-foreground))" style={{ fontFamily: 'var(--font-sans)' }}>{nameB.slice(0,6)}</text>
      </g>
    </svg>
  );
}
