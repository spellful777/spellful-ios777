/**
 * Synastry extras — archetype classification and growth edges.
 * Split from synastry.ts to avoid apostrophe escaping issues in template literals.
 */

import type { ChartData } from './astro-calculator';
import type { SynastryAspect, CompatibilityScores } from './synastry';

const SIGN_ELEMENTS: Record<string, string> = {
  Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
  Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
  Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
  Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
};

// ── Connection Archetype ──────────────────────────────────────────────────────

export function getArchetype(
  scores: CompatibilityScores,
  aspects: SynastryAspect[],
): { archetype: string; archetypeDescription: string } {
  const hasDoubleMagnet =
    aspects.some(a => a.planet1 === 'venus' && a.planet2 === 'mars' && a.score > 0) &&
    aspects.some(a => a.planet1 === 'mars' && a.planet2 === 'venus' && a.score > 0);

  const hasSoulmate = aspects.some(
    a =>
      ((a.planet1 === 'sun' && a.planet2 === 'moon') ||
        (a.planet1 === 'moon' && a.planet2 === 'sun')) &&
      (a.type === 'Conjunction' || a.type === 'Trine') &&
      a.score > 0.5,
  );

  const hasKarmic = aspects.some(
    a => (a.planet1 === 'saturn' || a.planet2 === 'saturn') && Math.abs(a.score) > 0.4,
  );

  const hasTransformative = aspects.some(
    a => (a.planet1 === 'pluto' || a.planet2 === 'pluto') && Math.abs(a.score) > 0.4,
  );

  const hasDreamy = aspects.some(
    a =>
      ((a.planet1 === 'neptune' && a.planet2 === 'venus') ||
        (a.planet1 === 'venus' && a.planet2 === 'neptune')) &&
      a.score > 0,
  );

  if (hasSoulmate && scores.overall >= 75) {
    return {
      archetype: 'Soulmate Frequency',
      archetypeDescription:
        "Your charts carry the hallmarks of a rare soul-level recognition. The Sun-Moon harmony between you creates an instinctive understanding that feels less like falling in love and more like coming home. This connection has the quality of something fated.",
    };
  }
  if (hasDoubleMagnet && scores.sexual >= 75) {
    return {
      archetype: 'Magnetic Polarity',
      archetypeDescription:
        "The Venus-Mars activation flows in both directions between your charts — a double whammy of romantic and physical magnetism. You pull each other in with an almost gravitational force. This is one of the most electrically charged signatures in synastry.",
    };
  }
  if (hasKarmic && scores.longterm >= 70) {
    return {
      archetype: 'Karmic Bond',
      archetypeDescription:
        "Saturn weaves through your synastry, marking this as a relationship with weight, purpose, and longevity. Karmic bonds are not always easy — they ask you to grow, to commit, and to show up fully. But they are among the most meaningful connections a person can have.",
    };
  }
  if (hasTransformative) {
    return {
      archetype: 'Transformative Catalyst',
      archetypeDescription:
        "Pluto's presence in your synastry marks this as a relationship that will change you both at a fundamental level. These connections are intense, sometimes uncomfortable, and ultimately irreversible in the best possible way. You will not leave this relationship the same person who entered it.",
    };
  }
  if (hasDreamy && scores.love >= 70) {
    return {
      archetype: 'Romantic Ideal',
      archetypeDescription:
        "Neptune touches Venus in your synastry, casting this relationship in a soft, luminous light. There is a quality of the ideal, the poetic, the almost-too-beautiful-to-be-real about how you see each other. This is a deeply romantic connection — one that inspires and elevates.",
    };
  }
  if (scores.communication >= 75 && scores.stability >= 70) {
    return {
      archetype: 'Kindred Minds',
      archetypeDescription:
        "Your Mercury and Saturn signatures create a connection built on genuine intellectual rapport and mutual respect. You understand how each other thinks, you trust each other's judgment, and you build something real together. This is the foundation of a lasting partnership.",
    };
  }
  if (scores.overall >= 70) {
    return {
      archetype: 'Harmonious Union',
      archetypeDescription:
        "Your charts weave together with a natural ease that speaks to genuine compatibility across multiple dimensions. This is not a connection defined by a single dramatic signature — it is one of sustained warmth, mutual support, and the quiet joy of being well-matched.",
    };
  }
  if (scores.overall >= 55) {
    return {
      archetype: 'Complex Chemistry',
      archetypeDescription:
        "Your synastry holds both harmony and friction in equal measure — the kind of connection that keeps you on your toes. The tension between your charts is not a flaw; it is the source of your growth. You challenge each other to become more fully yourselves.",
    };
  }
  return {
    archetype: 'Magnetic Tension',
    archetypeDescription:
      "Your charts create a powerful push-pull dynamic — deeply compelling, occasionally frustrating, and never boring. The friction between your energies is real, but so is the magnetism. This connection asks both of you to stretch beyond your comfort zones and grow.",
  };
}

// ── Growth Edges ──────────────────────────────────────────────────────────────

export function getGrowthEdges(
  chartA: ChartData,
  chartB: ChartData,
  aspects: SynastryAspect[],
  scores: CompatibilityScores,
): string[] {
  const edges: string[] = [];

  const challengingAspects = aspects
    .filter(a => a.score < -0.2)
    .sort((a, b) => a.score - b.score);

  if (challengingAspects.length > 0) {
    const top = challengingAspects[0];
    const p1 = top.planet1.charAt(0).toUpperCase() + top.planet1.slice(1);
    const p2 = top.planet2.charAt(0).toUpperCase() + top.planet2.slice(1);
    edges.push(
      `${p1}–${p2} ${top.type}: ${top.description} The invitation here is to meet this tension with curiosity rather than resistance — it is pointing at something both of you need to understand about yourselves.`,
    );
  }

  if (scores.communication < 65) {
    edges.push(
      "Communication styles differ significantly between your charts. The growth edge here is learning to translate — not just what you mean, but how you mean it. Misunderstandings in this connection are rarely about intent; they are about language.",
    );
  }

  // eslint-disable-next-line security/detect-object-injection
  const elA = SIGN_ELEMENTS[chartA.sun.sign];
  // eslint-disable-next-line security/detect-object-injection
  const elB = SIGN_ELEMENTS[chartB.sun.sign];
  const clashing: Record<string, string[]> = {
    Fire: ['Water', 'Earth'],
    Earth: ['Fire', 'Air'],
    Air: ['Earth', 'Water'],
    Water: ['Fire', 'Air'],
  };
  // eslint-disable-next-line security/detect-object-injection
  if (clashing[elA]?.includes(elB)) {
    edges.push(
      `Your Sun signs carry ${elA} and ${elB} energy — elements that naturally create friction. This is not incompatibility; it is complementarity in disguise. The ${elA} person brings what the ${elB} person lacks, and vice versa. The work is learning to value the difference rather than resist it.`,
    );
  }

  if (scores.stability < 60) {
    edges.push(
      "The stability dimension of your connection is an area for conscious cultivation. Building shared rituals, honoring commitments in small ways, and creating structures you both feel safe within will strengthen the foundation over time.",
    );
  }

  if (edges.length < 2) {
    edges.push(
      "Every relationship has a growing edge — the place where love asks you to expand. For this connection, the invitation is to stay curious about each other. The person you fell for is still becoming someone new. Make room for who they are still becoming.",
    );
  }

  return edges.slice(0, 3);
}
