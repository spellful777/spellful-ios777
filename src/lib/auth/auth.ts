/**
 * BetterAuth Server Configuration
 *
 * Plugins enabled:
 *  - emailAndPassword (with email verification via OTP)
 *  - emailOTP (one-time code sent on signup / password reset)
 *  - twoFactor (TOTP authenticator app + SMS via Twilio)
 *  - socialProviders: Google, Apple
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { emailOTP } from 'better-auth/plugins';
import { twoFactor } from 'better-auth/plugins';

import { db } from '@/server/db/client';
import { user, session, account, verification, twoFactorTable } from '@/server/db/schema';
import { getSecret } from '#airo/secrets';

let _auth: ReturnType<typeof createAuth> | null = null;

export function getAuth(): ReturnType<typeof createAuth> {
  _auth ??= createAuth();
  return _auth;
}

function createAuth() {
  const authSecret = getSecret('BETTER_AUTH_SECRET');
  if (!authSecret || typeof authSecret !== 'string') {
    throw new Error('BETTER_AUTH_SECRET is not set or invalid — run requestSecrets() first');
  }

  if (!db) {
    throw new Error('Database not configured. Install the database skill first, then configure auth.');
  }

  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL ?? 'https://spellful.com',

    database: drizzleAdapter(db, {
      provider: 'mysql',
      schema: { user, session, account, verification, twoFactor: twoFactorTable },
    }),

    secret: authSecret,

    user: {
      additionalFields: {
        isAdmin: {
          type: 'boolean',
          defaultValue: false,
          input: false,
          returned: true,
        },
        username: { type: 'string', defaultValue: '', input: false, returned: true },
        platformRole: { type: 'string', defaultValue: 'member', input: false, returned: true },
        accountType: { type: 'string', defaultValue: 'community_member', input: false, returned: true },
        // Birth data is sensitive — not returned in session; fetch via profile API only
        birthDate: { type: 'string', defaultValue: '', input: true, returned: false },
        birthTime: { type: 'string', defaultValue: '', input: true, returned: false },
        birthLocation: { type: 'string', defaultValue: '', input: true, returned: false },
        sunSign: { type: 'string', defaultValue: '', input: true, returned: true },
        moonSign: { type: 'string', defaultValue: '', input: true, returned: true },
        risingSign: { type: 'string', defaultValue: '', input: true, returned: true },
        hideOnlineStatus: { type: 'boolean', defaultValue: false, input: false, returned: true },
      },
    },

    trustedOrigins: (request?: Request) => {
      if (!request) return [];
      const origin = request.headers.get('origin');
      if (!origin) return [];
      try {
        const originUrl = new URL(origin);
        const hostname = originUrl.hostname;
        if (hostname.endsWith('.airoapp.ai') || hostname.endsWith('.test-airoapp.ai')) return [origin];
        if (hostname === 'localhost' || hostname === '127.0.0.1') return [origin];
        if (hostname === 'spellful.com' || hostname === 'www.spellful.com') return [origin];
        return [];
      } catch {
        return [];
      }
    },

    advanced: {
      defaultCookieAttributes: process.env.AIRO_PREVIEW === 'true'
        ? {
            // Preview iframe requires cross-site cookies
            sameSite: 'none' as const,
            secure: true,
            partitioned: true,
          }
        : {
            // Production: strict cookie security
            httpOnly: true,
            secure: true,
            sameSite: 'lax' as const,
          },
    },

    // ── Email / Password ──────────────────────────────────────────────────────
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      // Minimum 12 characters — balances security with usability for a spiritual community platform
      minPasswordLength: 12,
    },

    // ── Email OTP — verification on signup & password reset ──────────────────
    plugins: [
      emailOTP({
        async sendVerificationOTP({ email, otp, type }) {
          const { sendEmail } = await import('@/server/lib/send-email.js');
          const { buildEmailHtml, buildEmailText } = await import('@/server/lib/email-template.js');

          const configs = {
            'sign-in': {
              subject: 'Your Spellful sign-in code',
              heading: 'Your sign-in code',
              paragraphs: [
                `Use the code below to sign in to your Spellful account.`,
                `<strong style="display:block;text-align:center;font-size:32px;letter-spacing:0.18em;color:#111111;margin:8px 0 4px;">${otp}</strong>`,
                `This code expires in 10 minutes.`,
              ],
              footerNote: "If you didn't request this, you can safely ignore this email.",
            },
            'email-verification': {
              subject: 'Verify your Spellful email',
              heading: 'Confirm your email address',
              paragraphs: [
                `Welcome to Spellful. Enter the code below to verify your email address and activate your account.`,
                `<strong style="display:block;text-align:center;font-size:32px;letter-spacing:0.18em;color:#111111;margin:8px 0 4px;">${otp}</strong>`,
                `This code expires in 10 minutes.`,
              ],
              footerNote: "If you didn't create a Spellful account, you can safely ignore this email.",
            },
            'forget-password': {
              subject: 'Reset your Spellful password',
              heading: 'Reset your password',
              paragraphs: [
                `We received a request to reset the password for your Spellful account.`,
                `<strong style="display:block;text-align:center;font-size:32px;letter-spacing:0.18em;color:#111111;margin:8px 0 4px;">${otp}</strong>`,
                `This code expires in 10 minutes.`,
              ],
              footerNote: "If you didn't request a password reset, you can safely ignore this email.",
            },
          } as const;

          const cfg = configs[type as keyof typeof configs] ?? configs['sign-in'];

          await sendEmail({
            to: email,
            subject: cfg.subject,
            html: buildEmailHtml({ heading: cfg.heading, paragraphs: [...cfg.paragraphs], footerNote: cfg.footerNote }),
            text: buildEmailText({ heading: cfg.heading, paragraphs: [...cfg.paragraphs].map(p => p.replace(/<[^>]+>/g, '')), footerNote: cfg.footerNote }),
          });
        },
        otpLength: 6,
        expiresIn: 600, // 10 minutes
        sendVerificationOnSignUp: true,
      }),

      twoFactor({
        issuer: 'Spellful',
        // SMS OTP via Twilio — only active when secrets are configured
        otpOptions: {
          async sendOTP({ user: u, otp }) {
            const twilioSid = getSecret('TWILIO_ACCOUNT_SID');
            const twilioToken = getSecret('TWILIO_AUTH_TOKEN');
            const twilioFrom = getSecret('TWILIO_PHONE_NUMBER');
            if (!twilioSid || !twilioToken || !twilioFrom) return; // SMS not configured — TOTP only
            const twilio = await import('twilio');
            const client = twilio.default(twilioSid as string, twilioToken as string);
            const phone = (u as { phoneNumber?: string }).phoneNumber;
            if (!phone) return;
            await client.messages.create({
              body: `Your Spellful 2FA code: ${otp}. Expires in 10 minutes.`,
              from: twilioFrom as string,
              to: phone,
            });
          },
        },
      }),
    ],

    // ── Social Providers ──────────────────────────────────────────────────────
    socialProviders: {
      ...(getSecret('GOOGLE_CLIENT_ID') && getSecret('GOOGLE_CLIENT_SECRET') ? {
        google: {
          clientId: getSecret('GOOGLE_CLIENT_ID') as string,
          clientSecret: getSecret('GOOGLE_CLIENT_SECRET') as string,
        },
      } : {}),
      ...(getSecret('APPLE_CLIENT_ID') && getSecret('APPLE_CLIENT_SECRET') ? {
        apple: {
          clientId: getSecret('APPLE_CLIENT_ID') as string,
          clientSecret: getSecret('APPLE_CLIENT_SECRET') as string,
        },
      } : {}),
    },
  });
}

export type Session = ReturnType<typeof getAuth>['$Infer']['Session'];
export type User = ReturnType<typeof getAuth>['$Infer']['Session']['user'];
