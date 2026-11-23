/**
 * useEntitlement — React hook for Spellful Plus entitlement state.
 *
 * Fetches from /api/plus/entitlement on mount (when authenticated).
 * Never trusts a client-supplied flag — always reads from the server.
 *
 * Usage:
 *   const { isPlus, isLoading, settings } = useEntitlement();
 */
import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth/auth-client';

export interface EntitlementData {
  isPlus: boolean;
  isGracePeriod: boolean;
  status: string | null;
  expiresAt: string | null;
  gracePeriodUntil: string | null;
  environment: string | null;
  settings: {
    showSupporterBadge: boolean;
    activeTheme: string;
    activeLayout: string;
    practiceWidgetOrder: string[] | null;
  };
}

const DEFAULT: EntitlementData = {
  isPlus: false,
  isGracePeriod: false,
  status: null,
  expiresAt: null,
  gracePeriodUntil: null,
  environment: null,
  settings: {
    showSupporterBadge: false,
    activeTheme: '',
    activeLayout: '',
    practiceWidgetOrder: null,
  },
};

export function useEntitlement(): { data: EntitlementData; isLoading: boolean; refetch: () => void } {
  const { session } = useSession();
  const [data, setData] = useState<EntitlementData>(DEFAULT);
  const [isLoading, setIsLoading] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!session?.user?.id) {
      setData(DEFAULT);
      return;
    }
    setIsLoading(true);
    fetch('/api/plus/entitlement', { credentials: 'include' })
      .then((r) => r.json() as Promise<EntitlementData>)
      .then((d) => { setData(d); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, [session?.user?.id, tick]);

  const refetch = () => setTick((t) => t + 1);

  return { data, isLoading, refetch };
}

/**
 * Update Plus settings and refetch entitlement.
 * Throws if the server returns PLUS_REQUIRED.
 */
export async function updatePlusSettings(
  patch: Partial<EntitlementData['settings']>,
): Promise<void> {
  const r = await fetch('/api/plus/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(patch),
  });
  if (!r.ok) {
    const d = await r.json() as { error?: string; message?: string };
    throw new Error(d.message ?? d.error ?? `${r.status}`);
  }
}
