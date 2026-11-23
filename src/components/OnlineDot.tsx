/**
 * OnlineDot — shows a green dot when a user is online, grey when offline.
 * Polls /api/presence/:userId every 30 seconds.
 */
import { useEffect, useState } from 'react';

interface Props {
  userId: string;
  /** Size in pixels (default 10) */
  size?: number;
  className?: string;
}

interface PresenceData {
  online: boolean;
  lastSeen: string | null;
}

export function OnlineDot({ userId, size = 10, className = '' }: Props) {
  const [presence, setPresence] = useState<PresenceData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPresence() {
      try {
        const res = await fetch(`/api/presence/${userId}`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json() as PresenceData;
        if (!cancelled) setPresence(data);
      } catch { /* silent */ }
    }

    void fetchPresence();
    const interval = setInterval(() => { void fetchPresence(); }, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [userId]);

  if (!presence) return null;

  const title = presence.online
    ? 'Online now'
    : presence.lastSeen
      ? `Last seen ${formatRelative(presence.lastSeen)}`
      : 'Offline';

  return (
    <span
      className={`inline-block rounded-full flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: presence.online ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))',
        boxShadow: presence.online ? '0 0 0 2px hsl(var(--card))' : undefined,
      }}
      title={title}
      aria-label={title}
    />
  );
}

function formatRelative(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
