/**
 * QuickStartChips — optional first-use guidance for new users.
 * Shown below the protected dashboard area when the user hasn't dismissed it.
 * Skip-able, no mandatory questionnaire.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Moon, Sparkles, BookOpen, X } from 'lucide-react';

const DISMISSED_KEY = 'spellful_quickstart_dismissed';

interface QuickAction {
  label: string;
  sublabel: string;
  href: string;
  icon: React.ReactNode;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'Draw a card',
    sublabel: 'Daily tarot reading',
    href: '/tarot',
    icon: <Star className="w-5 h-5" />,
    color: 'hsl(var(--primary))',
  },
  {
    label: 'Explore the moon',
    sublabel: "Tonight's lunar phase",
    href: '/moon-calendar',
    icon: <Moon className="w-5 h-5" />,
    color: 'hsl(var(--accent))',
  },
  {
    label: 'Find a spell',
    sublabel: 'Browse by intention',
    href: '/spells',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'hsl(var(--primary))',
  },
  {
    label: 'Start your Grimoire',
    sublabel: 'Your Book of Shadows',
    href: '/grimoire',
    icon: <BookOpen className="w-5 h-5" />,
    color: 'hsl(var(--secondary))',
  },
];

export default function QuickStartChips() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (!dismissed) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch { /* ignore */ }
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="mx-4 mb-4 rounded-2xl overflow-hidden"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div>
              <p
                className="text-base font-medium"
                style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
              >
                Begin your journey
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                Choose where to start — or skip anytime
              </p>
            </div>
            <button
              onClick={dismiss}
              aria-label="Dismiss quick start"
              className="w-7 h-7 flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action chips */}
          <div className="px-4 pb-4 grid grid-cols-2 gap-2.5">
            {QUICK_ACTIONS.map((action, i) => (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: i * 0.06 }}
              >
                <Link
                  to={action.href}
                  onClick={dismiss}
                  className="flex flex-col gap-2 p-3 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{
                    background: `${action.color.replace(')', ' / 0.08)')}`,
                    border: `1px solid ${action.color.replace(')', ' / 0.2)')}`,
                  }}
                >
                  <span
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: `${action.color.replace(')', ' / 0.15)')}`, color: action.color }}
                  >
                    {action.icon}
                  </span>
                  <div>
                    <p
                      className="text-sm font-medium leading-tight"
                      style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                    >
                      {action.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                      {action.sublabel}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
