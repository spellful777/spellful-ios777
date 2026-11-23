import type { Request, Response } from "express";
import type { SeoRoute } from "../lib/seo-routes";
import { seoRoutes } from "../lib/seo-routes";
import { siteMeta } from "../lib/site-meta";
import { isSystemHost } from "./seo-host";

/**
 * Convert an SEO route path into a human-readable link label.
 *
 * Rule:
 *  - "/"            -> "Home" (special case)
 *  - otherwise      -> last path segment, split on "-"/"_", title-cased.
 *    e.g. "/about" -> "About", "/contact-us" -> "Contact Us",
 *    "/blog/my-post" -> "My Post".
 * seoRoutes paths are static route paths (no query strings/fragments), so
 * those are not handled.
 */
export function humanizeLabel(path: string): string {
	if (path === "/") return "Home";
	const segment = path.replace(/^\/+|\/+$/g, "").split("/").pop() ?? "";
	return segment
		.split(/[-_]/)
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

/**
 * Make agent/customer-authored text safe to interpolate into markdown.
 * name/summary ultimately trace to customer-supplied business details, so
 * they may contain markdown-structural characters or newlines that would
 * break the H1, blockquote, or link syntax. We collapse newlines/whitespace
 * to single spaces (keeping H1 and blockquote single-line) and backslash-
 * escape the characters that break inline constructs (`\`, backtick, `[`,
 * `]`). Other characters (#, >, *, etc.) are not structural mid-line, so we
 * leave them to avoid mangling ordinary business names.
 */
export function sanitizeMarkdown(text: string): string {
	return text
		.replace(/[\r\n\t]+/g, " ")
		.replace(/[\\`[\]]/g, (c) => `\\${c}`)
		.replace(/ {2,}/g, " ")
		.trim();
}

export interface RenderLlmsTxtOptions {
	/** Absolute origin, e.g. "https://acme.com". */
	baseUrl: string;
	/** Bare hostname, e.g. "acme.com" — used for the H1 fallback. */
	hostname: string;
	/** Business name (may be empty when unseeded). */
	name: string;
	/** Business summary (may be empty when unseeded). */
	summary: string;
	/** Crawlable routes; the page list is built from these. */
	routes: SeoRoute[];
}

/**
 * Render the /llms.txt body. Pure: no request, no I/O. Always returns a
 * well-formed, single-trailing-newline markdown document.
 */
export function renderLlmsTxt(opts: RenderLlmsTxtOptions): string {
	const name = sanitizeMarkdown(opts.name);
	const summary = sanitizeMarkdown(opts.summary);
	const base = opts.baseUrl;

	const lines: string[] = [`# ${name || opts.hostname}`];

	if (summary) {
		lines.push("", `> ${summary}`);
	}

	// --- About ---
	lines.push(
		"",
		"## About Spellful",
		"",
		`Spellful (${base}) is a free witchcraft and intuitive resources platform for modern seekers, witches, and anyone curious about astrology, tarot, and magical practice. It combines interactive divination tools, personalized astrology, a community forum, and a structured learning academy — all in one place.`,
		"",
		"Spellful is free to join. Create an account at spellful.com/signup to unlock the full dashboard, save readings, track moon rituals, and connect with the community.",
	);

	// --- Core tools ---
	lines.push(
		"",
		"## Divination & Readings",
		"",
		`- **Interactive Tarot** (${base}/tarot): Full 78-card Rider-Waite-inspired deck with custom artwork. Supports five spreads: One Card, Three Card (past/present/future), Celtic Cross, New Moon, and Shadow Work. Cards shuffle and draw interactively. No account required for a reading.`,
		`- **Daily Horoscope** (${base}/horoscope): Personalized daily horoscope for all 12 zodiac signs. Signed-in users with a birth date set receive their own sun-sign reading. Includes an Instagram Story share feature with branded templates.`,
		`- **Rune Reading** (${base}/runes): Interactive Elder Futhark rune oracle. Draw runes and receive interpretations for guidance.`,
		`- **Numerology Calculator** (${base}/numerology): Calculate life path number, expression number, soul urge number, and personality number from a name and birth date.`,
		`- **Compatibility** (${base}/compatibility): Astrological compatibility tool comparing two birth charts for romantic or relationship insight.`,
	);

	// --- Astrology tools ---
	lines.push(
		"",
		"## Astrology Tools",
		"",
		`- **Birth Chart** (${base}/birth-chart): Full natal chart calculator using VSOP87 planetary positions. Covers 10 planets plus Ascendant and Midheaven. Renders an interactive SVG natal wheel with aspect lines. Also supports synastry (two-chart comparison).`,
		`- **Moon Calendar** (${base}/moon-calendar): Live moon phase tracker with upcoming lunar events, moon sign ingresses, and void-of-course periods. Calculations accurate to ±2 minutes using Meeus Ch. 47 algorithms.`,
		`- **Moon Phases** (${base}/moon/phases): Educational guide to all eight moon phases with ritual suggestions for each.`,
		`- **Astrology Guide** (${base}/astrology): Reference guide covering signs, planets, houses, and aspects.`,
		`- **Astronomical Accuracy** (${base}/astronomical-accuracy): Technical page explaining the math behind Spellful's moon and planetary calculations.`,
	);

	// --- Spellcraft & rituals ---
	lines.push(
		"",
		"## Spellcraft & Rituals",
		"",
		`- **Spell Library** (${base}/spells): Curated library of 18+ spells organized by intention (love, protection, abundance, clarity, etc.). Each spell includes ingredients, steps, and moon phase recommendations. Users can submit their own spells for review.`,
		`- **Moon Ritual Planner** (${base}/moon-ritual): 48 moon rituals aligned to lunar phases and zodiac signs. Filter by moon phase or intention. Signed-in users can save rituals to their Grimoire.`,
		`- **Grimoire** (${base}/grimoire): Personal digital Book of Shadows. Save spells, rituals, tarot readings, and notes. Organized with a 5-step welcome flow for new users.`,
		`- **Herb Guide** (${base}/herbs): Magical herbalism reference covering correspondences, uses, and folklore for dozens of herbs.`,
	);

	// --- Dashboard & personal tools ---
	lines.push(
		"",
		"## Personal Dashboard & Tools",
		"",
		`- **Daily Dashboard** (${base}/dashboard): Signed-in users get a personalized dashboard with Card of the Day, daily affirmations, crystal of the day (25 crystals), moon phase widget, and 8 additional widgets.`,
		`- **Dream Journal** (${base}/dream-journal): Private journal for recording and reflecting on dreams. Entries are stored securely per user.`,
		`- **Astro Feed / Calendar** (${base}/calendar): Upcoming astrological events including moon phases, planetary ingresses, retrogrades, eclipses, and pagan sabbats — calculated with pure JavaScript math, no external API.`,
		`- **My Sanctuary** (${base}/sanctuary): Personal hub for saved content, bookmarks, and spiritual practice tracking.`,
		`- **Reminders** (${base}/reminders): Push notification opt-in for moon phase reminders and practice prompts.`,
	);

	// --- Academy ---
	lines.push(
		"",
		"## Spellful Academy",
		"",
		`The Spellful Academy (${base}/learn) is a free structured learning program for signed-in users. It covers 9 topics across 22 lessons with quizzes and bookmarks:`,
		"",
		"- Astrology fundamentals (signs, planets, houses, aspects)",
		"- Tarot reading techniques and card meanings",
		"- Numerology systems and calculations",
		"- Witchcraft history and traditions",
		"- Herbalism and magical plant correspondences",
		"- Dream interpretation and journaling",
		"- Moon magic and lunar cycles",
		"- Spellcasting theory and practice",
		"- Divination methods beyond tarot",
	);

	// --- Community ---
	lines.push(
		"",
		"## Community",
		"",
		`Spellful has an authenticated community forum (${base}/community) where members share posts, ask questions, run polls, and connect with other practitioners. Features include Q&A threads, bookmarks, notifications, and direct private messaging with client-side encryption (ECDH P-256 + AES-GCM-256).`,
	);

	// --- Access & account ---
	lines.push(
		"",
		"## Access",
		"",
		"- Most tools (tarot, moon calendar, horoscope, numerology, runes, compatibility, herb guide, spell library) are accessible without an account.",
		"- A free account unlocks the full dashboard, Grimoire, Dream Journal, Spellful Academy, community forum, personalized horoscope, birth chart saving, and push reminders.",
		`- Sign up free at ${base}/signup`,
		`- Sign in at ${base}/login`,
	);

	// --- Pages list (filtered to meaningful public routes) ---
	const skipPaths = new Set([
		"/login", "/signup", "/forgot-password", "/account",
		"/admin/spells", "/admin/community", "/messages", "/reminders",
		"/app-store-submission", "/app-store-screenshots", "/app-launch-kit",
		"/community/new", "/community/bookmarks", "/community/notifications",
		"/spells/submit",
	]);

	const pageLinks = opts.routes
		.filter((r) => typeof r.path === "string" && r.path.startsWith("/") && !skipPaths.has(r.path))
		.map((r) => `- [${sanitizeMarkdown(humanizeLabel(r.path))}](${base}${r.path})`);

	if (pageLinks.length > 0) {
		lines.push("", "## All Public Pages", ...pageLinks);
	}

	return `${lines.join("\n")}\n`;
}

/**
 * Express handler for GET /llms.txt. Host-gated like robots.txt / sitemap.xml:
 * system/preview hosts get a 404 (no real published site to describe);
 * customer-attached domains get the rendered file. Headers mirror the other
 * SEO routes so CDN behaviour is identical (per-host via `Vary: Host`).
 */
export function llmsTxtHandler(req: Request, res: Response): void {
	if (isSystemHost(req)) {
		res
			.status(404)
			.type("text/plain")
			.set("Cache-Control", "public, max-age=60, must-revalidate")
			.set("Vary", "Host")
			.send("Not found\n");
		return;
	}
	const body = renderLlmsTxt({
		baseUrl: `${req.protocol}://${req.hostname}`,
		hostname: req.hostname,
		name: siteMeta.name,
		summary: siteMeta.summary,
		routes: seoRoutes,
	});
	res
		.type("text/plain")
		.set("Cache-Control", "public, max-age=60, must-revalidate")
		.set("Vary", "Host")
		.send(body);
}
