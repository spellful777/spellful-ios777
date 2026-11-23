/**
 * Spellful branded email template
 * Black & white, logo centered in header, clean minimal layout.
 * Used for all transactional emails sent from spellful.com
 */

const LOGO_URL = 'https://spellful.com/airo-assets/images/logo/email';
const BASE_URL = 'https://spellful.com';

export interface EmailTemplateOptions {
  /** Short headline shown below the logo */
  heading: string;
  /** Main body paragraphs (plain strings, rendered as <p> tags) */
  paragraphs: string[];
  /** Optional CTA button */
  cta?: { label: string; url: string };
  /** Optional footer note (e.g. "If you didn't request this, ignore this email.") */
  footerNote?: string;
}

/**
 * Returns a complete HTML email string with the Spellful brand header.
 * Inline styles only — email clients strip <style> blocks.
 */
export function buildEmailHtml(opts: EmailTemplateOptions): string {
  const { heading, paragraphs, cta, footerNote } = opts;

  const paraHtml = paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#222222;">${p}</p>`,
    )
    .join('');

  const ctaHtml = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
        <tr>
          <td style="border-radius:4px;background:#000000;">
            <a href="${cta.url}"
               style="display:inline-block;padding:13px 32px;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.04em;">
              ${cta.label}
            </a>
          </td>
        </tr>
      </table>`
    : '';

  const footerNoteHtml = footerNote
    ? `<p style="margin:24px 0 0 0;font-size:12px;line-height:1.5;color:#888888;">${footerNote}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background:#f5f5f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <!-- Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="max-width:520px;background:#ffffff;border-radius:8px;overflow:hidden;
                      box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Logo header -->
          <tr>
            <td align="center"
                style="padding:36px 40px 28px;border-bottom:1px solid #eeeeee;">
              <a href="${BASE_URL}" style="display:inline-block;">
                <img src="${LOGO_URL}"
                     alt="Spellful"
                     width="160"
                     height="auto"
                     style="display:block;max-width:160px;height:auto;" />
              </a>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 32px;">
              <h1 style="margin:0 0 20px 0;font-size:22px;font-weight:700;
                         color:#111111;line-height:1.3;text-align:center;">
                ${heading}
              </h1>
              ${paraHtml}
              ${ctaHtml}
              ${footerNoteHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center"
                style="padding:20px 40px 28px;border-top:1px solid #eeeeee;">
              <p style="margin:0;font-size:11px;color:#aaaaaa;line-height:1.5;">
                &copy; ${new Date().getFullYear()} Spellful &nbsp;&middot;&nbsp;
                <a href="${BASE_URL}" style="color:#aaaaaa;text-decoration:underline;">spellful.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Plain-text fallback — strips HTML, keeps the content readable.
 */
export function buildEmailText(opts: EmailTemplateOptions): string {
  const lines: string[] = [
    'Spellful — spellful.com',
    '',
    opts.heading,
    '',
    ...opts.paragraphs,
  ];
  if (opts.cta) {
    lines.push('', opts.cta.label + ': ' + opts.cta.url);
  }
  if (opts.footerNote) {
    lines.push('', opts.footerNote);
  }
  return lines.join('\n');
}
