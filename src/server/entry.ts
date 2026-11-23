import express, { type Express, type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "node:url";
import { isIP } from "node:net";
import { dirname, extname, join } from "node:path";
import { existsSync, readFileSync } from "node:fs";

// <api-imports>
import academy__bookmarks__post from "./api/academy/bookmarks/POST";
import academy__progress__get from "./api/academy/progress/GET";
import academy__progress__post from "./api/academy/progress/POST";
import account__activity__get from "./api/account/activity/GET";
import account__avatar__post from "./api/account/avatar/POST";
import account__avatar__default__post from "./api/account/avatar/default/POST";
import account__sessions__get from "./api/account/sessions/GET";
import account__sessions__id__delete from "./api/account/sessions/[id]/DELETE";
import account__sessions__delete from "./api/account/sessions/DELETE";
import account__export__get from "./api/account/export/GET";
import account__delete__post from "./api/account/delete/POST";
import account__delete__delete from "./api/account/delete/DELETE";
import account__password__post from "./api/account/password/POST";
import account__signup_source__post from "./api/account/signup-source/POST";
import account__astrology__get from "./api/account/astrology/GET";
import account__astrology__patch from "./api/account/astrology/PATCH";
import admin__community__announcements__post from "./api/admin/community/announcements/POST";
import admin__roles__get from "./api/admin/roles/GET";
import admin__roles__patch from "./api/admin/roles/PATCH";
import admin__owner_seed__post from "./api/admin/owner-seed/POST";
import admin__audit__get from "./api/admin/audit/GET";
import account__type__get from "./api/account/type/GET";
import account__type__post from "./api/account/type/POST";
import profile__badges__get from "./api/profile/badges/GET";
import profile__badges__put from "./api/profile/badges/PUT";
import profile__username__badges__get from "./api/profile/[username]/badges/GET";
import admin__badges__get from "./api/admin/badges/GET";
import admin__badges__post from "./api/admin/badges/POST";
import admin__community__badges__post from "./api/admin/community/badges/POST";
import admin__applications__get from "./api/admin/applications/GET";
import admin__applications__id__patch from "./api/admin/applications/[id]/PATCH";
import creator_applications__get from "./api/creator-applications/GET";
import creator_applications__post from "./api/creator-applications/POST";
import creator_applications__id__withdraw__post from "./api/creator-applications/[id]/withdraw/POST";
import admin__community__categories__get from "./api/admin/community/categories/GET";
import admin__community__categories__id__patch from "./api/admin/community/categories/[id]/PATCH";
import admin__community__mod_log__get from "./api/admin/community/mod-log/GET";
import admin__community__posts__id__patch from "./api/admin/community/posts/[id]/PATCH";
import admin__community__replies__id__patch from "./api/admin/community/replies/[id]/PATCH";
import admin__community__reports__get from "./api/admin/community/reports/GET";
import admin__community__reports__id__patch from "./api/admin/community/reports/[id]/PATCH";
import admin__dashboard__get from "./api/admin/dashboard/GET";
import admin__inbox__get from "./api/admin/inbox/GET";
import admin__bug_reports__id__patch from "./api/admin/bug-reports/[id]/PATCH";
import bug_reports__post from "./api/bug-reports/POST";
import admin__moderator__assignments__get from "./api/admin/moderator/assignments/GET";
import admin__moderator__assignments__post from "./api/admin/moderator/assignments/POST";
import admin__moderator__assignments__id__delete from "./api/admin/moderator/assignments/[id]/DELETE";
import admin__moderator__queue__get from "./api/admin/moderator/queue/GET";
import plus__entitlement__get from "./api/plus/entitlement/GET";
import plus__settings__patch from "./api/plus/settings/PATCH";
import plus__apple_notify__post from "./api/plus/apple-notify/POST";
import plus__verify_purchase__post from "./api/plus/verify-purchase/POST";
import plus__routines__get from "./api/plus/routines/GET";
import plus__routines__post from "./api/plus/routines/POST";
import admin__spells__get from "./api/admin/spells/GET";
import admin__spells__id__put from "./api/admin/spells/[id]/PUT";
import auth__action__get from "./api/auth/[action]/GET";
import auth__action__post from "./api/auth/[action]/POST";
import auth__action__detail__get from "./api/auth/[action]/[detail]/GET";
import auth__action__detail__post from "./api/auth/[action]/[detail]/POST";
import birth_chart__og_image__get from "./api/birth-chart/og-image/GET";
import candles__get from "./api/candles/GET";
import blocks__get from "./api/blocks/GET";
import blocks__userId__delete from "./api/blocks/[userId]/DELETE";
import community__blocks__post from "./api/community/blocks/POST";
import message_requests__get from "./api/message-requests/GET";
import message_requests__id__accept__post from "./api/message-requests/[id]/accept/POST";
import message_requests__id__decline__post from "./api/message-requests/[id]/decline/POST";
import message_requests__id__delete from "./api/message-requests/[id]/DELETE";
import community__bookmarks__get from "./api/community/bookmarks/GET";
import community__categories__get from "./api/community/categories/GET";
import community__follows__post from "./api/community/follows/POST";
import community__follows__get from "./api/community/follows/GET";
import circles__get from "./api/circles/GET";
import circles__id__join__post from "./api/circles/[id]/join/POST";
import share__post from "./api/share/POST";
import community__grimoire_save__post from "./api/community/grimoire-save/POST";
import community__mute__post from "./api/community/mute/POST";
import community__notifications__get from "./api/community/notifications/GET";
import community__notifications__read__post from "./api/community/notifications/read/POST";
import community__posts__get from "./api/community/posts/GET";
import community__posts__post from "./api/community/posts/POST";
import community__posts__id__delete from "./api/community/posts/[id]/DELETE";
import community__posts__id__get from "./api/community/posts/[id]/GET";
import community__posts__id__put from "./api/community/posts/[id]/PUT";
import coven__suggestions__get from "./api/coven/suggestions/GET";
import community__posts__id__accept_answer__post from "./api/community/posts/[id]/accept-answer/POST";
import community__posts__id__bookmark__post from "./api/community/posts/[id]/bookmark/POST";
import community__posts__id__like__post from "./api/community/posts/[id]/like/POST";
import community__posts__id__poll__vote__post from "./api/community/posts/[id]/poll/vote/POST";
import community__posts__id__replies__get from "./api/community/posts/[id]/replies/GET";
import community__posts__id__replies__post from "./api/community/posts/[id]/replies/POST";
import community__posts__id__share__post from "./api/community/posts/[id]/share/POST";
import horoscope__share__post from "./api/horoscope/share/POST";
import birth_chart__share__post from "./api/birth-chart/share/POST";
import community__replies__id__delete from "./api/community/replies/[id]/DELETE";
import community__replies__id__put from "./api/community/replies/[id]/PUT";
import community__replies__id__like__post from "./api/community/replies/[id]/like/POST";
import community__reports__post from "./api/community/reports/POST";
import community__discover__get from "./api/community/discover/GET";
import community__search__get from "./api/community/search/GET";
import community__stats__get from "./api/community/stats/GET";
import conversations__get from "./api/conversations/GET";
import conversations__post from "./api/conversations/POST";
import conversations__id__messages__get from "./api/conversations/[id]/messages/GET";
import conversations__id__messages__post from "./api/conversations/[id]/messages/POST";
import conversations__id__messages__since__get from "./api/conversations/[id]/messages/since/GET";
import conversations__id__receipts__get from "./api/conversations/[id]/receipts/GET";
import conversations__id__typing__get from "./api/conversations/[id]/typing/GET";
import conversations__id__typing__post from "./api/conversations/[id]/typing/POST";
import conversations__id__wallpaper__get from "./api/conversations/[id]/wallpaper/GET";
import conversations__id__wallpaper__put from "./api/conversations/[id]/wallpaper/PUT";
import coven__get from "./api/coven/GET";
import coven__id__delete from "./api/coven/[id]/DELETE";
import coven__request__post from "./api/coven/request/POST";
import coven__respond__post from "./api/coven/respond/POST";
import coven__status__userId__get from "./api/coven/status/[userId]/GET";
import dashboard__preferences__get from "./api/dashboard/preferences/GET";
import dashboard__preferences__put from "./api/dashboard/preferences/PUT";
import dashboard__widgets__get from "./api/dashboard/widgets/GET";
import dashboard__widgets__put from "./api/dashboard/widgets/PUT";
import grimoire__get from "./api/grimoire/GET";
import grimoire__post from "./api/grimoire/POST";
import grimoire__id__delete from "./api/grimoire/[id]/DELETE";
import grimoire__id__get from "./api/grimoire/[id]/GET";
import grimoire__id__put from "./api/grimoire/[id]/PUT";
import health__get from "./api/health/GET";
import health__db_cols__get from "./api/health/db-cols/GET";
import herbs__get from "./api/herbs/GET";
import herbs__compare__get from "./api/herbs/compare/GET";
import herbs__report__post from "./api/herbs/report/POST";
import horoscope__today__get from "./api/horoscope/today/GET";
import keys__get from "./api/keys/GET";
import coven__check__get from "./api/coven/check/GET";
import keys__post from "./api/keys/POST";
import messages__id__patch from "./api/messages/[id]/PATCH";
import messages__id__reactions__get from "./api/messages/[id]/reactions/GET";
import messages__id__reactions__post from "./api/messages/[id]/reactions/POST";
import moon_rituals__get from "./api/moon-rituals/GET";
import moon_rituals__post from "./api/moon-rituals/POST";
import moon_rituals__id__delete from "./api/moon-rituals/[id]/DELETE";
import moon_rituals__id__patch from "./api/moon-rituals/[id]/PATCH";
import presence__post from "./api/presence/POST";
import presence__settings__patch from "./api/presence/settings/PATCH";
import presence__userId__get from "./api/presence/[userId]/GET";
import profile__patch from "./api/profile/PATCH";
import profile__cover__post from "./api/profile/cover/POST";
import profile__username__get from "./api/profile/[username]/GET";
import profile__username__gallery__get from "./api/profile/[username]/gallery/GET";
import profile__username__featured__get from "./api/profile/[username]/featured/GET";
import profile__gallery__post from "./api/profile/gallery/POST";
import profile__gallery__id__delete from "./api/profile/gallery/[id]/DELETE";
import profile__featured__post from "./api/profile/featured/POST";
import profile__featured__id__delete from "./api/profile/featured/[id]/DELETE";
import profile__identity__get from "./api/profile/identity/GET";
import profile__identity__put from "./api/profile/identity/PUT";
import profile__username__identity__get from "./api/profile/[username]/identity/GET";
import profile__collections__get from "./api/profile/collections/GET";
import profile__collections__post from "./api/profile/collections/POST";
import profile__collections__id__patch from "./api/profile/collections/[id]/PATCH";
import profile__collections__id__items__post from "./api/profile/collections/[id]/items/POST";
import profile__collections__id__items__itemId__patch from "./api/profile/collections/[id]/items/[itemId]/PATCH";
import profile__collections__id__items__itemId__delete from "./api/profile/collections/[id]/items/[itemId]/DELETE";
import profile__username__collections__get from "./api/profile/[username]/collections/GET";
// Soundscapes
import profile__soundscapes__settings__get from "./api/profile/soundscapes/settings/GET";
import profile__soundscapes__settings__put from "./api/profile/soundscapes/settings/PUT";
import profile__soundscapes__playlists__post from "./api/profile/soundscapes/playlists/POST";
import profile__soundscapes__playlists__id__patch from "./api/profile/soundscapes/playlists/[id]/PATCH";
import profile__soundscapes__playlists__id__delete from "./api/profile/soundscapes/playlists/[id]/DELETE";
import profile__username__soundscapes__get from "./api/profile/[username]/soundscapes/GET";
// Guestbook
import profile__guestbook__settings__get from "./api/profile/guestbook/settings/GET";
import profile__guestbook__settings__put from "./api/profile/guestbook/settings/PUT";
import profile__guestbook__entries__get from "./api/profile/guestbook/entries/GET";
import profile__guestbook__entries__id__patch from "./api/profile/guestbook/entries/[id]/PATCH";
import profile__guestbook__entries__id__delete from "./api/profile/guestbook/entries/[id]/DELETE";
import profile__guestbook__bans__post from "./api/profile/guestbook/bans/POST";
import profile__guestbook__bans__bannedUserId__delete from "./api/profile/guestbook/bans/[bannedUserId]/DELETE";
import profile__username__guestbook__get from "./api/profile/[username]/guestbook/GET";
import profile__username__guestbook__post from "./api/profile/[username]/guestbook/POST";
// Milestones
import profile__milestones__get from "./api/profile/milestones/GET";
import profile__milestones__post from "./api/profile/milestones/POST";
import profile__milestones__id__patch from "./api/profile/milestones/[id]/PATCH";
import profile__milestones__id__delete from "./api/profile/milestones/[id]/DELETE";
import profile__username__milestones__get from "./api/profile/[username]/milestones/GET";
import username__check__get from "./api/username/check/GET";
import username__check_public__get from "./api/username/check-public/GET";
import username__change__post from "./api/username/change/POST";
import push__subscribe__post from "./api/push/subscribe/POST";
import push__test__post from "./api/push/test/POST";
import push__vapid_key__get from "./api/push/vapid-key/GET";
import quotes__reserve__post from "./api/quotes/reserve/POST";
import reminders__get from "./api/reminders/GET";
import reminders__put from "./api/reminders/PUT";
import sanctuary__get from "./api/sanctuary/GET";
import signup_meta__post from "./api/signup-meta/POST";
import spells__get from "./api/spells/GET";
import spells__saved__get from "./api/spells/saved/GET";
import spells__post from "./api/spells/POST";
import spells__slug__get from "./api/spells/[slug]/GET";
import spells__slug__reviews__post from "./api/spells/[slug]/reviews/POST";
import spells__slug__reviews__reviewId__delete from "./api/spells/[slug]/reviews/[reviewId]/DELETE";
import spells__slug__reviews__reviewId__put from "./api/spells/[slug]/reviews/[reviewId]/PUT";
import spells__slug__reviews__reviewId__helpful__post from "./api/spells/[slug]/reviews/[reviewId]/helpful/POST";
import spells__slug__reviews__reviewId__replies__post from "./api/spells/[slug]/reviews/[reviewId]/replies/POST";
import spells__slug__reviews__reviewId__report__post from "./api/spells/[slug]/reviews/[reviewId]/report/POST";
import spells__slug__save__post from "./api/spells/[slug]/save/POST";
import synastry_partners__get from "./api/synastry-partners/GET";
import synastry_partners__post from "./api/synastry-partners/POST";
import synastry_partners__id__delete from "./api/synastry-partners/[id]/DELETE";
import tarot__get from "./api/tarot/GET";
import tarot__post from "./api/tarot/POST";
import tarot__id__delete from "./api/tarot/[id]/DELETE";
import timeline__get from "./api/timeline/GET";
import timeline__post from "./api/timeline/POST";
import timeline__id__delete from "./api/timeline/[id]/DELETE";
import timeline__id__put from "./api/timeline/[id]/PUT";
import users__search__get from "./api/users/search/GET";
import welcome_message__post from "./api/welcome-message/POST";
import tarot__shares__post from "./api/tarot/shares/POST";
import tarot__shares__publicId__get from "./api/tarot/shares/[publicId]/GET";
import tarot__shares__publicId__delete from "./api/tarot/shares/[publicId]/DELETE";
import tarot__shares__publicId__og_image__get from "./api/tarot/shares/[publicId]/og-image/GET";
import birthday__reflection__get from "./api/birthday/reflection/GET";
import birthday__reflection__dismiss__post from "./api/birthday/reflection/dismiss/POST";
import birthday__reflection__save_journal__post from "./api/birthday/reflection/save-journal/POST";
import community__friend_updates__get from "./api/community/friend-updates/GET";
import community__friend_updates__react__post from "./api/community/friend-updates/react/POST";
import community__friend_updates__hide__post from "./api/community/friend-updates/hide/POST";
// </api-imports>
import { runStartupMigration } from "./db/migrate-startup";
import { seoRoutes } from "../lib/seo-routes";
import {
	loadAdSenseRuntimeConfig,
	resolveAdSenseTextFile,
	type AdSenseRuntimeConfig,
} from "./adsense-manifest";
import { loadIndexNowKey } from "./indexnow-key";
import { isSystemHost } from "./seo-host";
import { llmsTxtHandler } from "./llms-txt";

export interface SsrRenderResult {
	html: string;
	head: string;
	status: number;
	redirect?: string;
}

/** Stands in for the route when the request failed before Express matched one. */
const UNROUTED: string = "(unrouted)";

/**
 * Names the route a request reached, never the target it asked for.
 *
 * A request target carries visitor data: a path segment can be an address
 * (`/signup/victim@example.com`) and a parameterized route holds a customer id, so
 * `req.baseUrl + req.path` logged both. `docs/privacy/pii.md` asks for the route
 * template instead — the string this app registered, which is fixed text.
 *
 * There is deliberately no fallback to `req.path` or `req.originalUrl`: a request
 * that matched no route has no template, and the placeholder is the honest answer.
 * The mount prefix is also omitted, because `req.baseUrl` is the resolved mount
 * rather than a template, so appending it would put request-derived text back.
 */
export function routeLabel(req: Request): string {
	const route: unknown = (req as { route?: unknown }).route;
	if (typeof route !== "object" || route === null) {
		return UNROUTED;
	}
	const template: unknown = (route as { path?: unknown }).path;
	if (typeof template === "string") {
		return template;
	}
	// The SSR catch-all route is registered with a RegExp path, so `path` is a RegExp.
	// The source is text this app wrote, so it is as fixed as a string template.
	if (template instanceof RegExp) {
		return template.source;
	}
	// A route registered with an array of paths has no single template.
	return UNROUTED;
}

/** Frames worth logging. Enough to name the throwing line and its caller. */
const MAX_LOGGED_FRAMES: number = 5;

/**
 * The call frames of an error, with its message removed.
 *
 * `stack` is the message with the frames appended, so the message has to come
 * off before any of it is logged. It is removed by its own length rather than by
 * looking for where the frames begin, because a message can contain anything:
 * body-parser puts a prefix of the request body into a parse failure's message,
 * and a visitor can put newlines and text shaped like a frame in that body.
 * Cutting an exact `name: message` prefix leaves only what the runtime wrote.
 *
 * Anything that does not have that exact prefix — a `stack` reassigned by a
 * library, or a `name` or `message` changed after the error was constructed —
 * reports no frames at all, so an unrecognised shape loses debuggability rather
 * than logging an unknown string.
 */
function loggedFrames(err: Error): string[] {
	if (typeof err.stack !== "string") {
		return [];
	}
	const headline: string = err.message ? `${err.name}: ${err.message}` : err.name;
	if (!err.stack.startsWith(headline)) {
		return [];
	}
	return err.stack
		.slice(headline.length)
		.split("\n")
		.filter((line: string): boolean => /^\s+at \S/.test(line))
		.slice(0, MAX_LOGGED_FRAMES)
		.map((line: string): string => line.trim());
}

/**
 * Reduces an error to fields that cannot carry request content.
 *
 * express.json() puts a prefix of the raw request body into a SyntaxError's
 * message, so the message is not safe to log on a request path: a form-encoded
 * body posted to a JSON route begins with the visitor's own field values. The
 * error class, plus body-parser's `type` and `status`, names the failure without
 * quoting what the client sent, and {@link loggedFrames} takes the frames out of
 * `stack` without the message that `stack` begins with.
 *
 * The message is dropped rather than gated on dev, because production is where a
 * customer app is actually debugged, so a dev-only escape hatch would not be
 * read. The frames are kept and the message is not: a frame names a file, a
 * function and a line the runtime itself recorded, while the message is the only
 * part an error carries that can quote what arrived in the request.
 */
export function toLogError(err: unknown): Record<string, unknown> {
	const shaped: Record<string, unknown> = {
		name: err instanceof Error ? err.name : typeof err,
	};
	const fields: Record<string, unknown> =
		typeof err === "object" && err !== null ? (err as Record<string, unknown>) : {};
	if (typeof fields.type === "string") {
		shaped.type = fields.type;
	}
	if (typeof fields.code === "string" || typeof fields.code === "number") {
		shaped.code = fields.code;
	}
	if (typeof fields.status === "number") {
		shaped.status = fields.status;
	}
	if (err instanceof Error) {
		const frames: string[] = loggedFrames(err);
		if (frames.length > 0) {
			shaped.frames = frames;
		}
	}
	return shaped;
}

/**
 * Error handler for /api routes. Exported so tests can mount it on their own app
 * in the order Express requires (error middleware after the routes it protects).
 */
export const apiErrorHandler = (
	err: unknown,
	req: Request,
	res: Response,
	_next: NextFunction,
): void => {
	// Always respond JSON on /api so clients parsing response.json() don't
	// receive Express's default HTML error page for non-Error throws.
	console.error("ssr.api.error", {
		route: routeLabel(req),
		error: toLogError(err),
	});
	res.status(500).json({ error: "Internal server error" });
};

/**
 * Last handler in the stack, for paths outside /api. Without it Express's default
 * handler runs, which writes err.stack to stderr and — whenever NODE_ENV is not
 * "production" — into the response body.
 */
export const finalErrorHandler = (
	err: unknown,
	req: Request,
	res: Response,
	// Unused, but Express identifies error middleware by arity: a 3-parameter
	// function is registered as an ordinary handler and never sees an error.
	_next: NextFunction,
): void => {
	console.error("ssr.request.failed", {
		route: routeLabel(req),
		error: toLogError(err),
	});
	if (res.headersSent) {
		// The response is already streaming, so there is no status left to set and no
		// body to replace. Forwarding to Express's default handler would hand it the
		// unsanitized error, which it writes to stderr as a raw stack — the leak this
		// handler exists to close. Destroying the socket instead aborts the partial
		// response, so the client sees a truncated transfer rather than a body that
		// looks complete. The log line above has already recorded the failure.
		res.destroy();
		return;
	}
	// Preserve the status Express's default handler would have chosen, so a
	// malformed body still answers 400 rather than 500.
	const rawStatus: unknown =
		typeof err === "object" && err !== null
			? ((err as { status?: unknown; statusCode?: unknown }).status ??
				(err as { statusCode?: unknown }).statusCode)
			: undefined;
	const status: number =
		typeof rawStatus === "number" && rawStatus >= 400 && rawStatus <= 599 ? rawStatus : 500;
	res.status(status).type("text/plain").send("Internal Server Error");
};

export function registerAdSenseTextRoutes(app: Express, config: AdSenseRuntimeConfig): void {
	app.get("/ads.txt", (_req, res) => {
		const content = resolveAdSenseTextFile(config, "adsTxt");
		if (content === null) {
			res
				.status(404)
				.type("text/plain")
				.set("Cache-Control", "no-cache")
				.send("Not found\n");
			return;
		}
		res.type("text/plain").set("Cache-Control", "no-cache").send(content);
	});

	app.get("/app-ads.txt", (_req, res) => {
		const content = resolveAdSenseTextFile(config, "appAdsTxt");
		if (content === null) {
			res
				.status(404)
				.type("text/plain")
				.set("Cache-Control", "no-cache")
				.send("Not found\n");
			return;
		}
		res.type("text/plain").set("Cache-Control", "no-cache").send(content);
	});
}

export function renderSsrDocument(
	template: string,
	result: Pick<SsrRenderResult, "head" | "html">,
	adSenseConfig: Pick<AdSenseRuntimeConfig, "scriptHtml">,
): string {
	const head = [result.head, adSenseConfig.scriptHtml].filter(Boolean).join("\n");
	return template
		.replace("<!--app-head-->", () => head)
		.replace("<!--app-html-->", () => result.html);
}

function normalizeCommerceApiBaseUrlEnv() {
	if (process.env.GODADDY_API_BASE_URL) return;
	const hostOnly = process.env.VITE_GODADDY_API_HOST;
	if (!hostOnly) return;
	const normalizedHost = hostOnly.replace(/^https?:\/\//, "").trim();
	if (!normalizedHost) return;
	process.env.GODADDY_API_BASE_URL = `https://${normalizedHost}`;
}

normalizeCommerceApiBaseUrlEnv();

const app = express();

// Honour x-forwarded-* from the load balancer so req.protocol/req.hostname
// reflect the public-facing values. Express-maintained parsing respects the
// existing trust-proxy config; direct header reads would let a client spoof
// the sitemap origin in robots.txt.
app.set("trust proxy", 1);

// ── Security headers ──────────────────────────────────────────────────────────
// helmet() sets X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security,
// Referrer-Policy, and more. We override contentSecurityPolicy to allow the
// Airo analytics script (wsimg.com) and its event endpoint (secureserver.net),
// Google Fonts, and the app's own assets.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // required for SSR-injected inline scripts
          "https://img1.wsimg.com",
          "https://img1.test-wsimg.com",
          "https://pagead2.googlesyndication.com",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // required for Tailwind/CSS-in-JS
          "https://fonts.googleapis.com",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        mediaSrc: ["'self'", "blob:", "https:"],
        connectSrc: [
          "'self'",
          "https://csp.secureserver.net",
          "https://csp.test-secureserver.net",
        ],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    // HSTS: 1 year, include subdomains
    strictTransportSecurity: {
      maxAge: 31536000,
      includeSubDomains: true,
    },
  }),
);

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Strict limit on auth routes to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => req.path.includes('/api/auth/get-session'), // allow session checks
});
app.use('/api/auth', authLimiter);

// General API rate limit — generous but protects against abuse
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter);

// ── Body size limits ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// <api-registrations>
app.post("/api/academy/bookmarks", academy__bookmarks__post);
app.get("/api/academy/progress", academy__progress__get);
app.post("/api/academy/progress", academy__progress__post);
app.get("/api/account/activity", account__activity__get);
app.post("/api/account/avatar", account__avatar__post);
app.post("/api/account/avatar/default", account__avatar__default__post);
app.get("/api/account/sessions", account__sessions__get);
app.delete("/api/account/sessions/:id", account__sessions__id__delete);
app.delete("/api/account/sessions", account__sessions__delete);
app.get("/api/account/export", account__export__get);
app.post("/api/account/delete", account__delete__post);
app.delete("/api/account/delete", account__delete__delete);
app.post("/api/account/password", account__password__post);
app.post("/api/account/signup-source", account__signup_source__post);
app.get("/api/account/astrology", account__astrology__get);
app.patch("/api/account/astrology", account__astrology__patch);
app.post("/api/admin/community/announcements", admin__community__announcements__post);
app.get("/api/admin/roles", admin__roles__get);
app.patch("/api/admin/roles", admin__roles__patch);
app.post("/api/admin/owner-seed", admin__owner_seed__post);
app.get("/api/admin/audit", admin__audit__get);
app.get("/api/account/type", account__type__get);
app.post("/api/account/type", account__type__post);
app.get("/api/profile/badges", profile__badges__get);
app.put("/api/profile/badges", profile__badges__put);
app.get("/api/admin/badges", ...admin__badges__get);
app.post("/api/admin/badges", ...admin__badges__post);
app.post("/api/admin/community/badges", admin__community__badges__post);
app.get("/api/admin/applications", admin__applications__get);
app.patch("/api/admin/applications/:id", admin__applications__id__patch);
app.get("/api/creator-applications", creator_applications__get);
app.post("/api/creator-applications", creator_applications__post);
app.post("/api/creator-applications/:id/withdraw", creator_applications__id__withdraw__post);
app.get("/api/admin/community/categories", admin__community__categories__get);
app.patch("/api/admin/community/categories/:id", admin__community__categories__id__patch);
app.get("/api/admin/community/mod-log", admin__community__mod_log__get);
app.patch("/api/admin/community/posts/:id", admin__community__posts__id__patch);
app.patch("/api/admin/community/replies/:id", admin__community__replies__id__patch);
app.get("/api/admin/community/reports", admin__community__reports__get);
app.patch("/api/admin/community/reports/:id", admin__community__reports__id__patch);
app.get("/api/admin/dashboard", admin__dashboard__get);
app.get("/api/admin/inbox", admin__inbox__get);
app.patch("/api/admin/bug-reports/:id", admin__bug_reports__id__patch);
app.post("/api/bug-reports", bug_reports__post);
// ── Spellful Plus ──────────────────────────────────────────────────────────────
app.get("/api/plus/entitlement", plus__entitlement__get);
app.patch("/api/plus/settings", plus__settings__patch);
app.post("/api/plus/apple-notify", plus__apple_notify__post);
app.post("/api/plus/verify-purchase", plus__verify_purchase__post);
app.get("/api/plus/routines", plus__routines__get);
app.post("/api/plus/routines", plus__routines__post);
app.get("/api/admin/moderator/assignments", admin__moderator__assignments__get);
app.post("/api/admin/moderator/assignments", admin__moderator__assignments__post);
app.delete("/api/admin/moderator/assignments/:id", admin__moderator__assignments__id__delete);
app.get("/api/admin/moderator/queue", admin__moderator__queue__get);
app.get("/api/admin/spells", admin__spells__get);
app.put("/api/admin/spells/:id", admin__spells__id__put);
app.get("/api/auth/:action", auth__action__get);
app.post("/api/auth/:action", auth__action__post);
app.get("/api/auth/:action/:detail", auth__action__detail__get);
app.post("/api/auth/:action/:detail", auth__action__detail__post);
app.get("/api/birth-chart/og-image", birth_chart__og_image__get);
app.get("/api/candles", candles__get);
app.get("/api/blocks", blocks__get);
app.delete("/api/blocks/:userId", blocks__userId__delete);
app.post("/api/community/blocks", community__blocks__post);
app.get("/api/message-requests", message_requests__get);
app.post("/api/message-requests/:id/accept", message_requests__id__accept__post);
app.post("/api/message-requests/:id/decline", message_requests__id__decline__post);
app.delete("/api/message-requests/:id", message_requests__id__delete);
app.get("/api/community/bookmarks", community__bookmarks__get);
app.get("/api/community/categories", community__categories__get);
app.post("/api/community/follows", community__follows__post);
app.get("/api/community/follows", community__follows__get);
app.get("/api/circles", circles__get);
app.post("/api/circles/:id/join", circles__id__join__post);
app.post("/api/share", share__post);
app.post("/api/community/grimoire-save", community__grimoire_save__post);
app.post("/api/community/mute", community__mute__post);
app.get("/api/community/notifications", community__notifications__get);
app.post("/api/community/notifications/read", community__notifications__read__post);
app.get("/api/community/posts", community__posts__get);
app.post("/api/community/posts", community__posts__post);
app.delete("/api/community/posts/:id", community__posts__id__delete);
app.get("/api/community/posts/:id", community__posts__id__get);
app.put("/api/community/posts/:id", community__posts__id__put);
app.post("/api/community/posts/:id/accept-answer", community__posts__id__accept_answer__post);
app.post("/api/community/posts/:id/bookmark", community__posts__id__bookmark__post);
app.post("/api/community/posts/:id/like", community__posts__id__like__post);
app.post("/api/community/posts/:id/poll/vote", community__posts__id__poll__vote__post);
app.get("/api/community/posts/:id/replies", community__posts__id__replies__get);
app.post("/api/community/posts/:id/replies", community__posts__id__replies__post);
app.post("/api/community/posts/:id/share", community__posts__id__share__post);
app.post("/api/horoscope/share", horoscope__share__post);
app.post("/api/birth-chart/share", birth_chart__share__post);
app.delete("/api/community/replies/:id", community__replies__id__delete);
app.put("/api/community/replies/:id", community__replies__id__put);
app.post("/api/community/replies/:id/like", community__replies__id__like__post);
app.post("/api/community/reports", community__reports__post);
app.get("/api/community/discover", community__discover__get);
app.get("/api/community/search", community__search__get);
app.get("/api/community/stats", community__stats__get);
app.get("/api/conversations", conversations__get);
app.post("/api/conversations", conversations__post);
app.get("/api/conversations/:id/messages", conversations__id__messages__get);
app.post("/api/conversations/:id/messages", conversations__id__messages__post);
app.get("/api/conversations/:id/messages/since", conversations__id__messages__since__get);
app.get("/api/conversations/:id/receipts", conversations__id__receipts__get);
app.get("/api/conversations/:id/typing", conversations__id__typing__get);
app.post("/api/conversations/:id/typing", conversations__id__typing__post);
app.get("/api/conversations/:id/wallpaper", conversations__id__wallpaper__get);
app.put("/api/conversations/:id/wallpaper", conversations__id__wallpaper__put);
app.get("/api/coven/suggestions", coven__suggestions__get);
app.get("/api/coven", coven__get);
app.delete("/api/coven/:id", coven__id__delete);
app.post("/api/coven/request", coven__request__post);
app.post("/api/coven/respond", coven__respond__post);
app.get("/api/coven/status/:userId", coven__status__userId__get);
app.get("/api/dashboard/preferences", dashboard__preferences__get);
app.put("/api/dashboard/preferences", dashboard__preferences__put);
app.get("/api/dashboard/widgets", dashboard__widgets__get);
app.put("/api/dashboard/widgets", dashboard__widgets__put);
app.get("/api/grimoire", grimoire__get);
app.post("/api/grimoire", grimoire__post);
app.delete("/api/grimoire/:id", grimoire__id__delete);
app.get("/api/grimoire/:id", grimoire__id__get);
app.put("/api/grimoire/:id", grimoire__id__put);
app.get("/api/health", health__get);
app.get("/api/health/db-cols", health__db_cols__get);
app.get("/api/herbs", herbs__get);
app.get("/api/herbs/compare", herbs__compare__get);
app.post("/api/herbs/report", herbs__report__post);
app.get("/api/horoscope/today", horoscope__today__get);
app.get("/api/keys", keys__get);
app.get("/api/coven/check", coven__check__get);
app.post("/api/keys", keys__post);
app.patch("/api/messages/:id", messages__id__patch);
app.get("/api/messages/:id/reactions", messages__id__reactions__get);
app.post("/api/messages/:id/reactions", messages__id__reactions__post);
app.get("/api/moon-rituals", moon_rituals__get);
app.post("/api/moon-rituals", moon_rituals__post);
app.delete("/api/moon-rituals/:id", moon_rituals__id__delete);
app.patch("/api/moon-rituals/:id", moon_rituals__id__patch);
app.post("/api/presence", presence__post);
app.patch("/api/presence/settings", presence__settings__patch);
app.get("/api/presence/:userId", presence__userId__get);
// ── Profile: specific routes FIRST, parameterized LAST ──────────────────────
app.patch("/api/profile", profile__patch);
app.post("/api/profile/cover", profile__cover__post);
// Own identity fields
app.get("/api/profile/identity", profile__identity__get);
app.put("/api/profile/identity", profile__identity__put);
// Own gallery + featured
app.post("/api/profile/gallery", profile__gallery__post);
app.delete("/api/profile/gallery/:id", profile__gallery__id__delete);
app.post("/api/profile/featured", profile__featured__post);
app.delete("/api/profile/featured/:id", profile__featured__id__delete);
// Own collections
app.get("/api/profile/collections", profile__collections__get);
app.post("/api/profile/collections", profile__collections__post);
app.patch("/api/profile/collections/:id", profile__collections__id__patch);
app.post("/api/profile/collections/:id/items", profile__collections__id__items__post);
app.patch("/api/profile/collections/:id/items/:itemId", profile__collections__id__items__itemId__patch);
app.delete("/api/profile/collections/:id/items/:itemId", profile__collections__id__items__itemId__delete);
// Soundscapes (specific before parameterized)
app.get("/api/profile/soundscapes/settings", profile__soundscapes__settings__get);
app.put("/api/profile/soundscapes/settings", profile__soundscapes__settings__put);
app.post("/api/profile/soundscapes/playlists", profile__soundscapes__playlists__post);
app.patch("/api/profile/soundscapes/playlists/:id", profile__soundscapes__playlists__id__patch);
app.delete("/api/profile/soundscapes/playlists/:id", profile__soundscapes__playlists__id__delete);
// Guestbook (specific before parameterized)
app.get("/api/profile/guestbook/settings", profile__guestbook__settings__get);
app.put("/api/profile/guestbook/settings", profile__guestbook__settings__put);
app.get("/api/profile/guestbook/entries", profile__guestbook__entries__get);
app.patch("/api/profile/guestbook/entries/:id", profile__guestbook__entries__id__patch);
app.delete("/api/profile/guestbook/entries/:id", profile__guestbook__entries__id__delete);
app.post("/api/profile/guestbook/bans", profile__guestbook__bans__post);
app.delete("/api/profile/guestbook/bans/:bannedUserId", profile__guestbook__bans__bannedUserId__delete);
// Milestones (specific before parameterized)
app.get("/api/profile/milestones", profile__milestones__get);
app.post("/api/profile/milestones", profile__milestones__post);
app.patch("/api/profile/milestones/:id", profile__milestones__id__patch);
app.delete("/api/profile/milestones/:id", profile__milestones__id__delete);
// Own badges (specific before parameterized)
app.get("/api/profile/badges", profile__badges__get);
app.put("/api/profile/badges", profile__badges__put);
// Public profile by username (parameterized — must come AFTER all specific /api/profile/* routes)
app.get("/api/profile/:username", profile__username__get);
app.get("/api/profile/:username/gallery", profile__username__gallery__get);
app.get("/api/profile/:username/featured", profile__username__featured__get);
app.get("/api/profile/:username/identity", profile__username__identity__get);
app.get("/api/profile/:username/collections", profile__username__collections__get);
app.get("/api/profile/:username/soundscapes", profile__username__soundscapes__get);
app.get("/api/profile/:username/guestbook", profile__username__guestbook__get);
app.post("/api/profile/:username/guestbook", profile__username__guestbook__post);
app.get("/api/profile/:username/badges", profile__username__badges__get);
app.get("/api/profile/:username/milestones", profile__username__milestones__get);
app.get("/api/username/check", username__check__get);
app.get("/api/username/check-public", username__check_public__get);
app.post("/api/username/change", username__change__post);
app.post("/api/push/subscribe", push__subscribe__post);
app.post("/api/push/test", push__test__post);
app.get("/api/push/vapid-key", push__vapid_key__get);
app.post("/api/quotes/reserve", quotes__reserve__post);
app.get("/api/reminders", reminders__get);
app.put("/api/reminders", reminders__put);
app.get("/api/sanctuary", sanctuary__get);
app.post("/api/signup-meta", signup_meta__post);
app.get("/api/spells", spells__get);
app.get("/api/spells/saved", spells__saved__get);
app.post("/api/spells", spells__post);
app.get("/api/spells/:slug", spells__slug__get);
app.post("/api/spells/:slug/reviews", spells__slug__reviews__post);
app.delete("/api/spells/:slug/reviews/:reviewId", spells__slug__reviews__reviewId__delete);
app.put("/api/spells/:slug/reviews/:reviewId", spells__slug__reviews__reviewId__put);
app.post("/api/spells/:slug/reviews/:reviewId/helpful", spells__slug__reviews__reviewId__helpful__post);
app.post("/api/spells/:slug/reviews/:reviewId/replies", spells__slug__reviews__reviewId__replies__post);
app.post("/api/spells/:slug/reviews/:reviewId/report", spells__slug__reviews__reviewId__report__post);
app.post("/api/spells/:slug/save", spells__slug__save__post);
app.get("/api/synastry-partners", synastry_partners__get);
app.post("/api/synastry-partners", synastry_partners__post);
app.delete("/api/synastry-partners/:id", synastry_partners__id__delete);
app.get("/api/tarot", tarot__get);
app.post("/api/tarot", tarot__post);
app.delete("/api/tarot/:id", tarot__id__delete);
app.post("/api/tarot/shares", tarot__shares__post);
app.get("/api/tarot/shares/:publicId/og-image", tarot__shares__publicId__og_image__get);
app.get("/api/tarot/shares/:publicId", tarot__shares__publicId__get);
app.delete("/api/tarot/shares/:publicId", tarot__shares__publicId__delete);
app.get("/api/birthday/reflection", birthday__reflection__get);
app.post("/api/birthday/reflection/dismiss", birthday__reflection__dismiss__post);
app.post("/api/birthday/reflection/save-journal", birthday__reflection__save_journal__post);
app.get("/api/community/friend-updates", community__friend_updates__get);
app.post("/api/community/friend-updates/react", community__friend_updates__react__post);
app.post("/api/community/friend-updates/hide", community__friend_updates__hide__post);
app.get("/api/timeline", timeline__get);
app.post("/api/timeline", timeline__post);
app.delete("/api/timeline/:id", timeline__id__delete);
app.put("/api/timeline/:id", timeline__id__put);
app.get("/api/users/search", users__search__get);
app.post("/api/welcome-message", welcome_message__post);
// </api-registrations>

// Error middleware must be registered AFTER the routes it protects; Express
// only passes errors to middleware defined later in the stack.
app.use("/api", apiErrorHandler);

function baseUrl(req: Request): string {
	return `${req.protocol}://${req.hostname}`;
}

type SiteOriginReason = "accepted" | "unparseable" | "bad_scheme" | "system_host";

function siteOriginReason(url: URL | null): SiteOriginReason {
	if (!url) return "unparseable";
	if (url.protocol !== "https:") return "bad_scheme";
	if (isSystemHost(url)) return "system_host";
	return "accepted";
}

function isIpHost(hostname: string | undefined): boolean {
	return isIP((hostname ?? "").replace(/^\[|\]$/g, "")) !== 0;
}

function parseUrl(raw: string): URL | null {
	try {
		return new URL(raw);
	} catch {
		return null;
	}
}

export function preferredOrigin(req: Request): string {
	const raw: string | undefined = req.get("x-airo-site-origin");
	if (!raw) return baseUrl(req);
	const url: URL | null = parseUrl(raw);
	const reason: SiteOriginReason = siteOriginReason(url);
	const origin: string = url && reason === "accepted" ? url.origin : baseUrl(req);
	const headerIsIp: boolean = url !== null && isIpHost(url.hostname);
	const requestIsIp: boolean = isIpHost(req.hostname);
	if (headerIsIp || requestIsIp) {
		const where: string = headerIsIp && requestIsIp ? "both" : headerIsIp ? "header" : "request";
		console.info("ssr.site-origin.ip-literal", `in=${where} reason=${reason}`);
		return origin;
	}
	console.info("ssr.site-origin.observed", `requestOrigin=${baseUrl(req)} preferredOrigin=${origin} reason=${reason}`);
	return origin;
}

/**
 * Absolute URL of the platform's default social image. dev-supervisor sets this
 * header (after stripping any client copy) only when the app has a usable logo
 * or hero image; render() uses it for og:image/twitter:image the page omits.
 */
export function socialPreviewImageUrl(req: Request): string | undefined {
	const path: string | undefined = req.get("x-airo-media-social-preview");
	if (!path || !/^\/airo-assets\/images\/[\w/-]+$/.test(path)) return undefined;
	return `${req.protocol}://${req.hostname}${path}`;
}

function escapeXml(s: string): string {
		return s.replace(/[&<>"']/g, (c) =>
			// eslint-disable-next-line security/detect-object-injection
			({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!,
	);
}

app.get("/robots.txt", (req, res) => {
	if (isSystemHost(req)) {
		res
			.type("text/plain")
			.set("Cache-Control", "public, max-age=60, must-revalidate").set("Vary", "Host")
			.send("User-agent: *\nDisallow: /\n");
		return;
	}
	const base = baseUrl(req);
	const body = [
		"User-agent: *",
		"Allow: /",
		"",
		"# Auth-only and private pages",
		"Disallow: /account",
		"Disallow: /sanctuary",
		"Disallow: /dashboard",
		"Disallow: /grimoire",
		"Disallow: /messages",
		"Disallow: /dream-journal",
		"Disallow: /timeline",
		"Disallow: /reminders",
		"Disallow: /community/new",
		"Disallow: /community/bookmarks",
		"Disallow: /community/notifications",
		"Disallow: /admin/",
		"Disallow: /spells/submit",
		"Disallow: /app-store-submission",
		"Disallow: /app-store-screenshots",
		"Disallow: /app-launch-kit",
		"",
		`Sitemap: ${base}/sitemap.xml`,
		"",
	].join("\n");
	res.type("text/plain").set("Cache-Control", "public, max-age=60, must-revalidate").set("Vary", "Host").send(body);
});

app.get("/sitemap.xml", (req, res) => {
	if (isSystemHost(req)) {
		const empty = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>\n`;
		res.type("application/xml").set("Cache-Control", "public, max-age=60, must-revalidate").set("Vary", "Host").send(empty);
		return;
	}
	const base = baseUrl(req);
	const urls = seoRoutes
		.filter((r) => typeof r.path === "string" && r.path.startsWith("/"))
		.map((r) => {
			const loc = `${base}${r.path}`;
			const parts = [`    <loc>${escapeXml(loc)}</loc>`];
			if (r.lastmod) parts.push(`    <lastmod>${escapeXml(r.lastmod)}</lastmod>`);
			if (r.changefreq) parts.push(`    <changefreq>${r.changefreq}</changefreq>`);
			if (r.priority !== undefined)
				parts.push(`    <priority>${r.priority.toFixed(1)}</priority>`);
			return `  <url>\n${parts.join("\n")}\n  </url>`;
		})
		.join("\n");
	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
	res.type("application/xml").set("Cache-Control", "public, max-age=60, must-revalidate").set("Vary", "Host").send(body);
});

app.get("/llms.txt", llmsTxtHandler);

// Redirect /og-image.png to the real uploaded PNG asset.
// All og:image meta tags point here; crawlers follow the 301 to the actual file.
app.get("/og-image.png", (_req: Request, res: Response) => {
	res.redirect(301, "/airo-assets/uploads/pages-og-image-7ff4c824.png");
});

// In dev mode, ssrLoadModule evaluates this file with import.meta.env.PROD=true
// (Vite SSR context). Guard with an existsSync check so the production SSR
// setup is skipped when dist/client hasn't been built yet, preventing
// process.exit(1) from crashing the dev server on every API request.
// Additionally check that we're running from the built bundle (dist/) rather
// than the source file, since ssrLoadModule runs source files with PROD=true.
const _ssrClientDir = join(dirname(fileURLToPath(import.meta.url)), "client");
const _isBuiltBundle = import.meta.url.includes("/dist/");
if (import.meta.env.PROD && _isBuiltBundle && existsSync(_ssrClientDir)) {
	const __dirname = dirname(fileURLToPath(import.meta.url));
	const clientDir = join(__dirname, "client");
	const adSenseRuntimeConfig = loadAdSenseRuntimeConfig(__dirname);
	const indexNowKey = loadIndexNowKey(__dirname);

	registerAdSenseTextRoutes(app, adSenseRuntimeConfig);

	if (indexNowKey !== null) {
		app.get(`/${indexNowKey}.txt`, (_req, res) => {
			res.type("text/plain").set("Cache-Control", "public, max-age=86400").send(indexNowKey);
		});
	}

	app.use(
		express.static(clientDir, {
			index: false,
			setHeaders(res, filePath) {
				res.set(
					"Cache-Control",
					filePath.includes("/assets/")
						? "public, max-age=31536000, immutable"
						: "no-cache",
				);
			},
		}),
	);

	app.use((_req, res, next) => {
		res.set("Cache-Control", "no-cache");
		next();
	});

	let template: string;
	try {
		template = readFileSync(join(clientDir, "index.html"), "utf-8");
	} catch (err) {
		console.error("ssr.template.load-failed", {
			path: join(clientDir, "index.html"),
			error: err instanceof Error ? err.message : String(err),
		});
		process.exit(1);
	}
	if (!template.includes("<!--app-head-->") || !template.includes("<!--app-html-->")) {
		// Fail fast at boot, same as a template load failure above: without
		// markers, every .replace() call on the render path is a no-op and we
		// would serve a shell with no <head> content and no rendered body on
		// every request. Preferring process.exit over a degraded mode ensures
		// an operator notices and fixes the build rather than serving broken
		// SEO-invisible pages indefinitely.
		console.error("ssr.template.markers-missing", {
			hasHead: template.includes("<!--app-head-->"),
			hasHtml: template.includes("<!--app-html-->"),
		});
		process.exit(1);
	}
	const fallbackShell = template
		.replace("<!--app-head-->", "")
		.replace("<!--app-html-->", "");

	// Resolve the SSR module once into a stable render function. A failed
	// load is unrecoverable at runtime - exiting lets the container
	// scheduler restart with a clean slate rather than leaving the server
	// to serve silent 503s indefinitely against a single startup log.
	let renderFn: ((url: string, siteOrigin?: string, socialPreviewImage?: string) => Promise<SsrRenderResult>) | null = null;
	const SSR_MODULE_LOAD_TIMEOUT_MS = 30_000;
	const loadTimeout = setTimeout(() => {
		if (renderFn !== null) return;
		console.error("ssr.module.load-timeout", {
			timeoutMs: SSR_MODULE_LOAD_TIMEOUT_MS,
		});
		process.exit(1);
	}, SSR_MODULE_LOAD_TIMEOUT_MS);
	loadTimeout.unref();
	import("../entry-server").then(
		(mod) => {
			clearTimeout(loadTimeout);
			renderFn = mod.render;
		},
		(err) => {
			clearTimeout(loadTimeout);
			console.error("ssr.module.load-failed", {
				error: err instanceof Error ? err.stack : String(err),
			});
			process.exit(1);
		},
	);

	app.get(/.*/, async (req, res, next) => {
		if (req.method !== "GET") return next();
		if (req.path.startsWith("/api")) return next();
		if (extname(req.path)) return next();
		const sendFallback = () =>
			res
				.status(503)
				.set("Content-Type", "text/html; charset=utf-8")
				.set("Cache-Control", "no-store")
				.send(fallbackShell);
		if (renderFn === null) {
			// Module not yet resolved; fall back without logging to avoid startup
			// noise before the first render is even possible. A terminal load
			// failure (import reject or 30s timeout) process.exit(1)s from the
			// loader above, so this branch is only the brief warmup window.
			return sendFallback();
		}
		try {
			const socialPreviewImage: string | undefined = socialPreviewImageUrl(req);
			const result = await renderFn(
				req.url,
				`${req.protocol}://${req.hostname}`,
				socialPreviewImage,
			);
			if (result.redirect) {
				// Redirect thrown from a loader/action surfaces as a Response.
				// Forward it so the browser actually navigates to the new URL
				// instead of seeing an empty shell with a stale status.
				res.redirect(result.status, result.redirect);
				return;
			}
			if (!result.html) {
				// A non-redirect Response was thrown from a loader (e.g.
				// `throw new Response(null, { status: 404 })`). renderToString
				// produced no markup, so we have a real status but no body.
				// Log so the case is observable in ops dashboards, and mark
				// no-store so CDNs don't cache an empty page as a valid hit.
				// User-visible 404 / error pages should come from a route
				// errorElement, not from this fallback path.
				console.error("ssr.render.error-response", {
					route: routeLabel(req),
					status: result.status,
				});
				res
					.status(result.status)
					.set("Content-Type", "text/html; charset=utf-8")
					.set("Cache-Control", "no-store")
					.send(fallbackShell);
				return;
			}
			preferredOrigin(req);
			// Per-host SEO injection. System URLs get a noindex meta so
			// crawlers drop them from the index over time; customer-attached
			// hosts get a self-canonical link so search engines treat them
			// as authoritative for the rendered content.
			const seoHead = isSystemHost(req)
				? `<meta name="robots" content="noindex,nofollow">`
				: `<link rel="canonical" href="${escapeXml(`${req.protocol}://${req.hostname}${req.path}`)}">`;
			// Function replacements disable String.replace's $-special sequences
			// ($&, $', $`, $$) so user-authored titles / JSON-LD like
			// "Save $& today" insert literally instead of being interpolated.
			const out = renderSsrDocument(
				template,
				{ ...result, head: seoHead + result.head },
				adSenseRuntimeConfig,
			);
			res
				.status(result.status)
				.set("Content-Type", "text/html; charset=utf-8")
				.set("Cache-Control", "no-cache")
				.send(out);
		} catch (err) {
			// 503 surfaces the failure in CDN/monitoring without caching a broken
			// page as success. console.error (not warn) puts it at the right log
			// level for the observability pipeline to alert on.
			console.error("ssr.render.failed", {
					route: routeLabel(req),
					// The stack is dropped even though React annotates it with the failing
					// component tree. A route component or loader throws messages it builds
					// itself, so a thrown value can quote a query parameter or a submitted
					// field, and the message is embedded in the stack. The component tree is
					// not worth sending request data to a shared log.
					error: toLogError(err),
				});
			sendFallback();
		}
	});

	// Last in the stack, so it sees any error the routes above pass on.
	app.use(finalErrorHandler);

	const shutdown = async (signal: string) => {
		console.log(`Got ${signal}, shutting down gracefully...`);
		// Scope the ERR_MODULE_NOT_FOUND suppression to the import() only.
		// A closeConnection() failure that happens to carry the same code
		// (unlikely but possible for wrapped errors) must not be silently
		// swallowed - it indicates a real db-close failure worth logging.
		let mod: { closeConnection?: () => Promise<void> | void } | null = null;
		try {
			const dbClient = "./db/client" + ".js";
			// Source-literal optional module path; no request, environment, or user input reaches import().
			// eslint-disable-next-line no-unsanitized/method
			mod = await import(/* @vite-ignore */ dbClient);
		} catch (error: unknown) {
			const code = (error as { code?: string } | null)?.code;
			if (code !== "ERR_MODULE_NOT_FOUND") {
				console.error("ssr.shutdown.db-import-failed", {
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}
		if (mod && typeof mod.closeConnection === "function") {
			try {
				await mod.closeConnection();
				console.log("Database connections closed");
			} catch (error: unknown) {
				console.error("ssr.shutdown.db-close-failed", {
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}
		process.exit(0);
	};

	(["SIGTERM", "SIGINT"] as const).forEach((signal) => {
		process.once(signal, () => {
			void shutdown(signal);
		});
	});

	const rawPort = process.env.PORT || "3000";
	const port = parseInt(rawPort, 10);
	if (!Number.isInteger(port) || port <= 0 || port > 65535) {
		// parseInt("abc") returns NaN; passing that to app.listen throws
		// synchronously before the server.on("error") handler below can catch
		// it. Fail fast with an actionable log rather than a cryptic crash.
		console.error("ssr.server.invalid-port", { rawPort });
		process.exit(1);
	}
	const host = process.env.HOST || "0.0.0.0";

	// Run startup migrations to ensure DB schema matches code (safe to re-run).
	// Wrapped in void+then to avoid top-level await (not supported in the SSR bundle target).
	void runStartupMigration().catch((e: unknown) => {
		console.error(JSON.stringify({ event: 'startup.migration.uncaught', msg: e instanceof Error ? e.message : String(e) }));
	});

	const server = app.listen(port, host, () => {
		console.log(`Server listening on http://${host}:${port}`);
	});
	server.on("error", (err: NodeJS.ErrnoException) => {
		console.error("ssr.server.listen-failed", {
			port,
			host,
			code: err.code,
			error: err.message,
		});
		process.exit(1);
	});
}

export default app;
