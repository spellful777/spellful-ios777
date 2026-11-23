/**
 * MessengerWallpaperPicker
 * Per-conversation shared wallpaper/theme picker for Spellful Messenger.
 * Preset themes only — no custom image upload.
 * Only available between Coven friends; both participants see the same wallpaper.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Sliders } from 'lucide-react';

// ── Theme definitions ─────────────────────────────────────────────────────────

export interface WallpaperTheme {
  id: string;
  label: string;
  previewClass: string; // Tailwind class for the swatch
  backgroundStyle: string; // CSS value using var(--msw-*) tokens
}

export const MESSENGER_THEMES: WallpaperTheme[] = [
  {
    id: 'default',
    label: 'Default',
    previewClass: 'bg-background',
    backgroundStyle: '',
  },
  {
    id: 'celestial',
    label: 'Celestial',
    previewClass: '',
    backgroundStyle: 'radial-gradient(ellipse at 30% 20%, hsl(var(--msw-celestial-a)), hsl(var(--msw-celestial-b)) 55%, hsl(var(--background)) 90%)',
  },
  {
    id: 'moonlit',
    label: 'Moonlit',
    previewClass: '',
    backgroundStyle: 'linear-gradient(160deg, hsl(var(--msw-moonlit-a)) 0%, hsl(var(--background)) 55%, hsl(var(--msw-moonlit-b)) 100%)',
  },
  {
    id: 'botanical',
    label: 'Botanical',
    previewClass: '',
    backgroundStyle: 'linear-gradient(135deg, hsl(var(--msw-botanical-a)) 0%, hsl(var(--background)) 45%, hsl(var(--msw-botanical-b)) 100%)',
  },
  {
    id: 'amethyst',
    label: 'Amethyst',
    previewClass: '',
    backgroundStyle: 'linear-gradient(135deg, hsl(var(--msw-amethyst-a)) 0%, hsl(var(--msw-amethyst-b)) 50%, hsl(var(--background)) 100%)',
  },
  {
    id: 'minimalist',
    label: 'Minimalist',
    previewClass: '',
    backgroundStyle: 'linear-gradient(180deg, hsl(var(--msw-minimalist-a)) 0%, hsl(var(--msw-minimalist-b)) 100%)',
  },
  {
    id: 'starfield',
    label: 'Starfield',
    previewClass: '',
    backgroundStyle: 'radial-gradient(ellipse at 50% 0%, hsl(var(--msw-starfield-a)) 0%, hsl(var(--msw-starfield-b)) 75%, hsl(var(--background)) 100%)',
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WallpaperPrefs {
  themeId: string;
  customImageUrl: string | null;
  dimAmount: number;  // 0–100
  blurAmount: number; // 0–20
}

interface Props {
  conversationId: number;
  current: WallpaperPrefs;
  onClose: () => void;
  onSave: (prefs: WallpaperPrefs) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MessengerWallpaperPicker({ conversationId, current, onClose, onSave }: Props) {
  const [themeId, setThemeId] = useState(current.themeId);
  const [dimAmount, setDimAmount] = useState(current.dimAmount);
  const [blurAmount, setBlurAmount] = useState(current.blurAmount);
  const [saving, setSaving] = useState(false);
  const [showSliders, setShowSliders] = useState(false);

  const activeTheme = MESSENGER_THEMES.find(t => t.id === themeId) ?? MESSENGER_THEMES[0];

  // ── Save ─────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    try {
      const prefs: WallpaperPrefs = { themeId, customImageUrl: null, dimAmount, blurAmount };
      const res = await fetch(`/api/conversations/${conversationId}/wallpaper`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(prefs),
      });
      if (res.ok) {
        onSave(prefs);
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  // ── Preview background ────────────────────────────────────────────────────

  const previewBgStyle: React.CSSProperties = activeTheme.backgroundStyle
    ? { background: activeTheme.backgroundStyle }
    : {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-base font-semibold" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
            Chat Wallpaper
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
            aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live preview strip */}
        <div className="mx-5 mb-4 rounded-2xl overflow-hidden relative" style={{ height: 100 }}>
          <div
            className={`absolute inset-0 ${activeTheme.previewClass}`}
            style={{
              ...previewBgStyle,
              ...(blurAmount > 0 ? { filter: `blur(${blurAmount}px)`, transform: 'scale(1.05)' } : {}),
            }}
          />
          {/* Dim overlay */}
          {dimAmount > 0 && (
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `hsl(var(--background) / ${dimAmount / 100})` }} />
          )}
          {/* Sample bubbles */}
          <div className="absolute inset-0 flex flex-col justify-center gap-2 px-4 pointer-events-none">
            <div className="self-start px-3 py-1.5 rounded-[16px_16px_16px_4px] text-xs max-w-[60%]"
              style={{ background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}>
              ✨ How's your ritual going?
            </div>
            <div className="self-end px-3 py-1.5 rounded-[16px_16px_4px_16px] text-xs max-w-[60%]"
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
              🌙 Almost done!
            </div>
          </div>
        </div>

        {/* Theme grid */}
        <div className="px-5 mb-4">
          <p className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Theme</p>
          <div className="grid grid-cols-4 gap-2">
            {MESSENGER_THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => setThemeId(theme.id)}
                className="flex flex-col items-center gap-1.5 group"
                aria-label={theme.label}>
                <div
                  className={`w-full aspect-square rounded-xl relative overflow-hidden transition-transform group-hover:scale-105 ${theme.previewClass}`}
                  style={{
                    ...(theme.backgroundStyle ? { background: theme.backgroundStyle } : {}),
                    border: themeId === theme.id ? '2px solid hsl(var(--primary))' : '2px solid hsl(var(--border))',
                    boxShadow: themeId === theme.id ? '0 0 0 2px hsl(var(--primary) / 0.3)' : 'none',
                  }}>
                  {themeId === theme.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: 'hsl(var(--primary))' }}>
                        <Check className="w-3 h-3" style={{ color: 'hsl(var(--primary-foreground))' }} />
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-center leading-tight"
                  style={{ color: themeId === theme.id ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>
                  {theme.label}
                </span>
              </button>
            ))}

          </div>
        </div>

        {/* Sliders toggle */}
        <div className="px-5 mb-4">
          <button
            onClick={() => setShowSliders(v => !v)}
            className="flex items-center gap-2 text-xs py-2 w-full"
            style={{ color: 'hsl(var(--muted-foreground))' }}>
            <Sliders className="w-3.5 h-3.5" />
            Dimming &amp; blur
            <span className="ml-auto" style={{ color: 'hsl(var(--primary))' }}>{showSliders ? '▲' : '▼'}</span>
          </button>
          <AnimatePresence>
            {showSliders && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden">
                <div className="flex flex-col gap-4 pt-2 pb-1">
                  {/* Dim slider */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <span>Dim overlay</span>
                      <span style={{ color: 'hsl(var(--foreground))' }}>{dimAmount}%</span>
                    </div>
                    <input
                      type="range" min={0} max={80} step={5}
                      value={dimAmount}
                      onChange={e => setDimAmount(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: 'hsl(var(--primary))' }}
                    />
                  </div>
                  {/* Blur slider */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <span>Background blur</span>
                      <span style={{ color: 'hsl(var(--foreground))' }}>{blurAmount}px</span>
                    </div>
                    <input
                      type="range" min={0} max={20} step={1}
                      value={blurAmount}
                      onChange={e => setBlurAmount(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: 'hsl(var(--primary))' }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 pb-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl text-sm font-medium"
            style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
            Cancel
          </button>
          <button onClick={() => void handleSave()} disabled={saving}
            className="flex-1 py-2.5 rounded-2xl text-sm font-medium disabled:opacity-50"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
            {saving ? 'Saving…' : 'Apply'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
