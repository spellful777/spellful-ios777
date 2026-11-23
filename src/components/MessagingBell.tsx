/**
 * MessagingBell — glass-style inbox notification widget for the header.
 * Shows unread count badge, pulsing online dot, and a dropdown of recent conversations.
 * Messages are E2E encrypted so previews show sender name only.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import { Mail, MessageCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConvSummary {
  id: string;
  updatedAt: string;
  otherUser: { id: string; name: string | null; image: string | null; username: string | null } | null;
  unreadCount: number;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Avatar({ user }: { user: ConvSummary['otherUser'] }) {
  const initials = user?.name?.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() ?? '?';
  if (user?.image) {
    return (
      <img
        src={user.image}
        alt={user.name ?? 'User'}
        className="w-8 h-8 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div
      className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold"
      style={{ background: 'hsl(var(--primary) / 0.25)', color: 'hsl(var(--primary))' }}
    >
      {initials}
    </div>
  );
}

export default function MessagingBell() {
  const [open, setOpen] = useState(false);
  const [convs, setConvs] = useState<ConvSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setPrevTotal] = useState(0);
  const [newAlert, setNewAlert] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalUnread = convs.reduce((s, c) => s + c.unreadCount, 0);

  const fetchConvs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await fetch('/api/conversations');
      if (!r.ok) return;
      const raw = await r.json() as { conversations?: ConvSummary[] } | ConvSummary[];
      const data: ConvSummary[] = Array.isArray(raw) ? raw : (raw.conversations ?? []);
      setConvs(data);
      const newTotal = data.reduce((s, c) => s + c.unreadCount, 0);
      setPrevTotal((prev) => {
        if (newTotal > prev && prev > 0) setNewAlert(true);
        return newTotal;
      });
    } catch {
      // silent fail
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load + poll every 30s
  useEffect(() => {
    fetchConvs();
    pollRef.current = setInterval(() => fetchConvs(true), 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchConvs]);

  // Clear new-alert after 4s
  useEffect(() => {
    if (!newAlert) return;
    const t = setTimeout(() => setNewAlert(false), 4000);
    return () => clearTimeout(t);
  }, [newAlert]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Refresh on open
  const handleOpen = () => {
    setOpen((v) => !v);
    setNewAlert(false);
    fetchConvs();
  };

  const recentConvs = convs.slice(0, 5);

  return (
    <div ref={ref} className="relative flex items-center">
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        aria-label={`Messages${totalUnread > 0 ? `, ${totalUnread} unread` : ''}`}
        aria-expanded={open}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        style={{
          background: open
            ? 'hsl(var(--primary) / 0.15)'
            : 'hsl(var(--card) / 0.5)',
          backdropFilter: 'blur(8px)',
          border: '1px solid hsl(var(--primary) / 0.2)',
          boxShadow: newAlert ? '0 0 12px hsl(var(--primary) / 0.4)' : undefined,
        }}
      >
        {/* Mail icon */}
        <Mail
          size={16}
          style={{ color: totalUnread > 0 ? 'hsl(var(--primary))' : 'hsl(var(--foreground) / 0.65)' }}
        />

        {/* Unread badge */}
        {totalUnread > 0 && (
          <motion.span
            key={totalUnread}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center text-[9px] font-bold leading-none text-primary-foreground"
            style={{ background: 'hsl(var(--destructive))' }}
          >
            {totalUnread > 9 ? '9+' : totalUnread}
          </motion.span>
        )}

        {/* Pulsing online dot */}
        <span
          className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border border-background"
          style={{ background: 'hsl(var(--success))' }}
        >
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: 'hsl(var(--success) / 0.6)' }}
          />
        </span>
      </button>

      {/* New message flash ring */}
      <AnimatePresence>
        {newAlert && (
          <motion.span
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 1.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ border: '2px solid hsl(var(--primary) / 0.6)' }}
          />
        )}
      </AnimatePresence>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-full mt-2 w-72 rounded-2xl overflow-hidden z-50"
            style={{
              background: 'hsl(var(--card) / 0.92)',
              backdropFilter: 'blur(20px)',
              border: '1px solid hsl(var(--primary) / 0.2)',
              boxShadow: '0 8px 32px hsl(var(--background) / 0.8)',
            }}
            role="dialog"
            aria-label="Recent messages"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'hsl(var(--primary) / 0.12)' }}
            >
              <div className="flex items-center gap-2">
                <MessageCircle size={14} style={{ color: 'hsl(var(--primary))' }} />
                <span className="text-xs font-semibold tracking-wide text-foreground">
                  Messages
                </span>
                {totalUnread > 0 && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-primary-foreground"
                    style={{ background: 'hsl(var(--destructive))' }}
                  >
                    {totalUnread} new
                  </span>
                )}
              </div>
              <Link
                to="/messages"
                onClick={() => setOpen(false)}
                className="text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                style={{ color: 'hsl(var(--primary))' }}
              >
                View all
              </Link>
            </div>

            {/* Conversation list */}
            <div className="max-h-72 overflow-y-auto">
              {loading && recentConvs.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div
                    className="w-5 h-5 rounded-full border-2 animate-spin"
                    style={{
                      borderColor: 'hsl(var(--primary) / 0.4)',
                      borderTopColor: 'transparent',
                    }}
                  />
                </div>
              ) : recentConvs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Mail size={24} className="text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">No messages yet</p>
                </div>
              ) : (
                recentConvs.map((conv) => (
                  <Link
                    key={conv.id}
                    to={`/messages/${conv.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    style={{
                      background: conv.unreadCount > 0 ? 'hsl(var(--primary) / 0.06)' : 'transparent',
                      borderBottom: '1px solid hsl(var(--border) / 0.4)',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'hsl(var(--primary) / 0.1)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = conv.unreadCount > 0 ? 'hsl(var(--primary) / 0.06)' : 'transparent'; }}
                  >
                    {/* Avatar with unread dot */}
                    <div className="relative shrink-0">
                      <Avatar user={conv.otherUser} />
                      {conv.unreadCount > 0 && (
                        <span
                          className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-primary-foreground"
                          style={{ background: 'hsl(var(--destructive))' }}
                        >
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Name + preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className="text-xs font-semibold truncate"
                          style={{
                            color: conv.unreadCount > 0
                              ? 'hsl(var(--foreground))'
                              : 'hsl(var(--foreground) / 0.75)',
                          }}
                        >
                          {conv.otherUser?.name ?? conv.otherUser?.username ?? 'Unknown'}
                        </span>
                        <span className="text-[10px] shrink-0 text-muted-foreground">
                          {timeAgo(conv.updatedAt)}
                        </span>
                      </div>
                      <p
                        className="text-[11px] truncate mt-0.5"
                        style={{
                          color: conv.unreadCount > 0
                            ? 'hsl(var(--primary) / 0.9)'
                            : 'hsl(var(--muted-foreground))',
                        }}
                      >
                        {conv.unreadCount > 0
                          ? `${conv.unreadCount} new message${conv.unreadCount > 1 ? 's' : ''}`
                          : 'No new messages'}
                      </p>
                    </div>

                    <ChevronRight size={12} className="text-muted-foreground shrink-0" />
                  </Link>
                ))
              )}
            </div>

            {/* Footer CTA */}
            <div
              className="px-4 py-2.5 border-t"
              style={{ borderColor: 'hsl(var(--primary) / 0.12)' }}
            >
              <Link
                to="/messages"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{
                  background: 'hsl(var(--primary) / 0.12)',
                  color: 'hsl(var(--primary))',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'hsl(var(--primary) / 0.2)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'hsl(var(--primary) / 0.12)'; }}
              >
                <Mail size={12} />
                Open Inbox
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
