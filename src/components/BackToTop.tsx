/**
 * BackToTop.tsx
 * Appears after scrolling 600px — high enough that it does not trigger on
 * short pages or after a single swipe, but responsive on long pages like
 * the Grimoire and Astrology reference.
 *
 * Positioning (set in globals.css .back-to-top-btn):
 *   Mobile  (<md): 69px — clears the ~57px nav content + safe-area (already
 *                  absorbed by the nav itself) + 12px gap. Does NOT re-add
 *                  env(safe-area-inset-bottom) to avoid double-counting on
 *                  notched devices (iPhone X+).
 *   Desktop (md+): 28px + env(safe-area-inset-bottom) — no bottom nav.
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp } from 'lucide-react';

const SCROLL_THRESHOLD = 600;

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const lastCheck = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const now = Date.now();
      if (now - lastCheck.current < 16) return;
      lastCheck.current = now;
      setVisible(window.scrollY > SCROLL_THRESHOLD);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="back-to-top"
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 10 }}
          transition={{ duration: 0.22, ease: 'easeOut' as const }}
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed z-40 flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary back-to-top-btn"
          style={{
            right: '16px',
            width: '44px',
            height: '44px',
            background: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            boxShadow: '0 4px 24px hsl(var(--primary) / 0.45)',
          }}
        >
          <ChevronUp size={20} strokeWidth={2.2} aria-hidden="true" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
