import type { Request, Response } from 'express';

// Zodiac sign glyphs
const SIGN_GLYPHS: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

// Sign element colors (hex — SVG doesn't support CSS vars)
const SIGN_COLORS: Record<string, string> = {
  Aries: '#E8734A', Taurus: '#7DB87D', Gemini: '#F5D76E', Cancer: '#A8C8E8',
  Leo: '#E8A84A', Virgo: '#9DB87D', Libra: '#D4A8D4', Scorpio: '#8B4A6B',
  Sagittarius: '#E87A4A', Capricorn: '#8B9B7D', Aquarius: '#7DB8D4', Pisces: '#9B8BD4',
};

export default function handler(req: Request, res: Response): void {
  const sun = String(req.query.sun || 'Aries');
  const moon = String(req.query.moon || 'Cancer');
  const rising = String(req.query.rising || 'Libra');
  const name = String(req.query.name || '').slice(0, 40);

  // eslint-disable-next-line security/detect-object-injection
  const sunColor = SIGN_COLORS[sun] || '#C9A84C';
  // eslint-disable-next-line security/detect-object-injection
  const moonColor = SIGN_COLORS[moon] || '#B8A9D9';
  // eslint-disable-next-line security/detect-object-injection
  const risingColor = SIGN_COLORS[rising] || '#C9A84C';

  // eslint-disable-next-line security/detect-object-injection
  const sunGlyph = SIGN_GLYPHS[sun] || '♈';
  // eslint-disable-next-line security/detect-object-injection
  const moonGlyph = SIGN_GLYPHS[moon] || '♋';
  // eslint-disable-next-line security/detect-object-injection
  const risingGlyph = SIGN_GLYPHS[rising] || '♎';

  const nameLabel = name ? `${name}'s` : 'Your';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#1A1530"/>
      <stop offset="100%" stop-color="#0D0B1A"/>
    </radialGradient>
    <radialGradient id="glow-sun" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${sunColor}" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="${sunColor}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow-moon" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${moonColor}" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="${moonColor}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow-rising" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${risingColor}" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="${risingColor}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Subtle star field -->
  <circle cx="80" cy="60" r="1.5" fill="#C9A84C" opacity="0.5"/>
  <circle cx="220" cy="120" r="1" fill="#B8A9D9" opacity="0.4"/>
  <circle cx="950" cy="45" r="2" fill="#C9A84C" opacity="0.6"/>
  <circle cx="1100" cy="150" r="1.5" fill="#B8A9D9" opacity="0.4"/>
  <circle cx="150" cy="480" r="1" fill="#C9A84C" opacity="0.4"/>
  <circle cx="1080" cy="500" r="1.5" fill="#B8A9D9" opacity="0.5"/>
  <circle cx="600" cy="80" r="1" fill="#C9A84C" opacity="0.3"/>
  <circle cx="400" cy="560" r="1.5" fill="#B8A9D9" opacity="0.3"/>
  <circle cx="820" cy="580" r="1" fill="#C9A84C" opacity="0.4"/>
  <circle cx="50" cy="310" r="1" fill="#B8A9D9" opacity="0.3"/>
  <circle cx="1150" cy="320" r="1.5" fill="#C9A84C" opacity="0.4"/>

  <!-- Top label -->
  <text x="600" y="68" font-family="Georgia, serif" font-size="14" fill="#C9A84C" text-anchor="middle" letter-spacing="6" opacity="0.8">SPELLFUL · NATAL CHART</text>
  <line x1="200" y1="80" x2="1000" y2="80" stroke="#C9A84C" stroke-width="0.5" opacity="0.25"/>

  <!-- Name headline -->
  <text x="600" y="140" font-family="Georgia, serif" font-size="38" font-weight="400" fill="#F5F5F5" text-anchor="middle" letter-spacing="3">${nameLabel} Big Three</text>

  <!-- Three sign cards -->
  <!-- Sun card -->
  <rect x="80" y="185" width="310" height="280" rx="16" fill="#1A1530" stroke="${sunColor}" stroke-width="1" stroke-opacity="0.5"/>
  <rect x="80" y="185" width="310" height="280" rx="16" fill="url(#glow-sun)"/>
  <text x="235" y="255" font-family="Georgia, serif" font-size="52" fill="${sunColor}" text-anchor="middle" opacity="0.9">☉</text>
  <text x="235" y="300" font-family="Georgia, serif" font-size="13" fill="#B8A9D9" text-anchor="middle" letter-spacing="4" opacity="0.8">SUN SIGN</text>
  <text x="235" y="355" font-family="Georgia, serif" font-size="36" fill="${sunColor}" text-anchor="middle">${sunGlyph} ${sun}</text>
  <text x="235" y="390" font-family="Georgia, serif" font-size="14" fill="#F5F5F5" text-anchor="middle" opacity="0.6">Core Identity</text>
  <text x="235" y="430" font-family="Georgia, serif" font-size="13" fill="#B8A9D9" text-anchor="middle" opacity="0.5">Your essential self</text>

  <!-- Moon card -->
  <rect x="445" y="185" width="310" height="280" rx="16" fill="#1A1530" stroke="${moonColor}" stroke-width="1" stroke-opacity="0.5"/>
  <rect x="445" y="185" width="310" height="280" rx="16" fill="url(#glow-moon)"/>
  <text x="600" y="255" font-family="Georgia, serif" font-size="52" fill="${moonColor}" text-anchor="middle" opacity="0.9">☽</text>
  <text x="600" y="300" font-family="Georgia, serif" font-size="13" fill="#B8A9D9" text-anchor="middle" letter-spacing="4" opacity="0.8">MOON SIGN</text>
  <text x="600" y="355" font-family="Georgia, serif" font-size="36" fill="${moonColor}" text-anchor="middle">${moonGlyph} ${moon}</text>
  <text x="600" y="390" font-family="Georgia, serif" font-size="14" fill="#F5F5F5" text-anchor="middle" opacity="0.6">Emotional Nature</text>
  <text x="600" y="430" font-family="Georgia, serif" font-size="13" fill="#B8A9D9" text-anchor="middle" opacity="0.5">Your inner world</text>

  <!-- Rising card -->
  <rect x="810" y="185" width="310" height="280" rx="16" fill="#1A1530" stroke="${risingColor}" stroke-width="1" stroke-opacity="0.5"/>
  <rect x="810" y="185" width="310" height="280" rx="16" fill="url(#glow-rising)"/>
  <text x="965" y="255" font-family="Georgia, serif" font-size="52" fill="${risingColor}" text-anchor="middle" opacity="0.9">↑</text>
  <text x="965" y="300" font-family="Georgia, serif" font-size="13" fill="#B8A9D9" text-anchor="middle" letter-spacing="4" opacity="0.8">RISING SIGN</text>
  <text x="965" y="355" font-family="Georgia, serif" font-size="36" fill="${risingColor}" text-anchor="middle">${risingGlyph} ${rising}</text>
  <text x="965" y="390" font-family="Georgia, serif" font-size="14" fill="#F5F5F5" text-anchor="middle" opacity="0.6">How Others See You</text>
  <text x="965" y="430" font-family="Georgia, serif" font-size="13" fill="#B8A9D9" text-anchor="middle" opacity="0.5">Your outer mask</text>

  <!-- Bottom divider + tagline -->
  <line x1="200" y1="510" x2="1000" y2="510" stroke="#C9A84C" stroke-width="0.5" opacity="0.25"/>
  <text x="600" y="548" font-family="Georgia, serif" font-size="16" fill="#C9A84C" text-anchor="middle" letter-spacing="3" opacity="0.8">Where the Veil Grows Thin</text>
  <text x="600" y="578" font-family="Georgia, serif" font-size="13" fill="#B8A9D9" text-anchor="middle" letter-spacing="2" opacity="0.5">spellful.com/birth-chart</text>
`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(svg);
}
