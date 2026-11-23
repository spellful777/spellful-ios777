/**
 * Thin wrapper used by BetterAuth plugins (emailOTP) to send transactional emails.
 * Delegates to the Airo email gateway via @/server/email.
 * All emails are sent with fromName "Spellful".
 */

import { sendEmail as gatewaySend } from '@/server/email';

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailOptions): Promise<void> {
  try {
    await gatewaySend({
      fromName: 'Spellful',
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    // Classify failure kind without leaking gateway text or addresses to logs
    let kind = 'unknown';
    if (msg.startsWith('email gateway unreachable')) kind = 'gateway-unreachable';
    else if (msg.startsWith('email send succeeded')) kind = 'no-message-id';
    else if (msg.startsWith('email send failed: refused')) kind = 'gateway-rejected';
    else if (msg.startsWith('email send failed: HTTP 5')) kind = 'gateway-error';
    else if (msg.startsWith('email send failed: non-JSON')) kind = 'gateway-error';
    else if (msg.startsWith('email send failed')) kind = 'gateway-rejected';
    console.error(JSON.stringify({ event: 'email.send.failed', kind }));
    throw new Error('Email delivery failed');
  }
}
