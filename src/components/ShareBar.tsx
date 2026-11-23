/**
 * ShareBar — reusable social sharing strip.
 *
 * Renders Twitter/X, Facebook, and a copy-link button.
 * Accepts a `url`, `text` (tweet copy), and optional `title` for the copy tooltip.
 */
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface ShareBarProps {
  /** Absolute URL to share */
  url: string;
  /** Pre-filled tweet / share text (keep ≤ 240 chars after URL is appended by Twitter) */
  text: string;
  /** Optional label shown above the buttons */
  label?: string;
  className?: string;
}

/** X (Twitter) SVG wordmark — never use lucide Twitter/X icons */
function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/** Facebook 'f' SVG */
function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

function ShareBar({ url, text, label = 'Share your reading', className = '' }: ShareBarProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  const twitterHref = `https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}&via=spellful`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {label && (
        <p
          className="text-xs tracking-widest uppercase"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', letterSpacing: '0.18em' }}
        >
          {label}
        </p>
      )}
      <div className="flex items-center gap-2">
        {/* Twitter / X */}
        <a
          href={twitterHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X (Twitter)"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: 'hsl(var(--muted))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <XIcon size={13} />
          <span>Post</span>
        </a>

        {/* Facebook */}
        <a
          href={facebookHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Facebook"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: 'hsl(var(--muted))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <FacebookIcon size={13} />
          <span>Share</span>
        </a>

        {/* Copy link */}
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'Link copied!' : 'Copy link'}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: copied ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted))',
            color: copied ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
            border: copied ? '1px solid hsl(var(--primary) / 0.4)' : '1px solid hsl(var(--border))',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? 'Copied!' : 'Copy link'}</span>
        </button>
      </div>
    </div>
  );
}

export { ShareBar };
export default ShareBar;
