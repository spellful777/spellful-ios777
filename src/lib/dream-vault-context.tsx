/**
 * DreamVaultContext
 *
 * Holds the in-memory vault key for the current session.
 * The key is never persisted to localStorage or any storage — it lives only
 * in React state and is cleared on lock, logout, or 5-minute idle timeout.
 *
 * Vault state is stored server-side as a wrapped key in the user's grimoire
 * metadata (type='dream_vault_config'). The passphrase is never sent to the
 * server; only the PBKDF2-wrapped vault key is stored there.
 */

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import {
  generateVaultKey,
  wrapVaultKey,
  unwrapVaultKey,
  type WrappedVault,
} from './dream-crypto';

// ── Types ─────────────────────────────────────────────────────────────────────

export type VaultStatus =
  | 'loading'      // checking server for vault config
  | 'no_vault'     // user has never set a passphrase
  | 'locked'       // vault exists but key not in memory
  | 'unlocked';    // vault key is in memory

interface VaultContextValue {
  status: VaultStatus;
  vaultKey: CryptoKey | null;
  /** Create a new vault with the given passphrase. */
  createVault: (passphrase: string) => Promise<void>;
  /** Unlock an existing vault with the passphrase. Throws on wrong passphrase. */
  unlock: (passphrase: string) => Promise<void>;
  /** Lock the vault — clears the key from memory. */
  lock: () => void;
  /** Change the passphrase — re-wraps the vault key. */
  changePassphrase: (oldPassphrase: string, newPassphrase: string) => Promise<void>;
  /** Reset idle timer on user activity. */
  resetIdle: () => void;
}

const VaultContext = createContext<VaultContextValue | null>(null);

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// ── Provider ──────────────────────────────────────────────────────────────────

export function DreamVaultProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<VaultStatus>('loading');
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
  const [wrappedVault, setWrappedVault] = useState<WrappedVault | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load vault config from server ─────────────────────────────────────────

  useEffect(() => {
    void loadVaultConfig();
  }, []);

  async function loadVaultConfig() {
    try {
      const resp = await fetch('/api/grimoire?type=dream_vault_config');
      if (!resp.ok) { setStatus('no_vault'); return; }
      const entries = (await resp.json()) as Array<{ metadata: Record<string, unknown> }>;
      const config = entries[0]?.metadata as unknown as WrappedVault | undefined;
      if (config?.wrappedKey && config?.salt && config?.iv) {
        setWrappedVault(config);
        setStatus('locked');
      } else {
        setStatus('no_vault');
      }
    } catch {
      setStatus('no_vault');
    }
  }

  // ── Idle auto-lock ─────────────────────────────────────────────────────────

  const startIdleTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      setVaultKey(null);
      setStatus('locked');
    }, IDLE_TIMEOUT_MS);
  }, []);

  const resetIdle = useCallback(() => {
    if (status === 'unlocked') startIdleTimer();
  }, [status, startIdleTimer]);

  useEffect(() => {
    if (status === 'unlocked') startIdleTimer();
    return () => { if (idleTimer.current) clearTimeout(idleTimer.current); };
  }, [status, startIdleTimer]);

  // ── Vault operations ───────────────────────────────────────────────────────

  async function createVault(passphrase: string) {
    const key = await generateVaultKey();
    const wrapped = await wrapVaultKey(key, passphrase);

    // Store the wrapped vault config on the server
    await fetch('/api/grimoire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'dream_vault_config',
        title: '__vault_config__',
        content: '__vault_config__',
        tags: '',
        metadata: wrapped,
      }),
    });

    setWrappedVault(wrapped);
    setVaultKey(key);
    setStatus('unlocked');
  }

  async function unlock(passphrase: string) {
    if (!wrappedVault) throw new Error('No vault configured');
    // This throws if the passphrase is wrong (AES-GCM authentication fails)
    const key = await unwrapVaultKey(wrappedVault, passphrase);
    setVaultKey(key);
    setStatus('unlocked');
  }

  function lock() {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    setVaultKey(null);
    setStatus(wrappedVault ? 'locked' : 'no_vault');
  }

  async function changePassphrase(oldPassphrase: string, newPassphrase: string) {
    if (!wrappedVault) throw new Error('No vault configured');
    // Verify old passphrase first
    const key = await unwrapVaultKey(wrappedVault, oldPassphrase);
    // Re-wrap with new passphrase
    const newWrapped = await wrapVaultKey(key, newPassphrase);

    // Find and update the vault config entry
    const resp = await fetch('/api/grimoire?type=dream_vault_config');
    if (resp.ok) {
      const entries = (await resp.json()) as Array<{ id: number }>;
      if (entries[0]) {
        await fetch(`/api/grimoire/${entries[0].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metadata: newWrapped }),
        });
      }
    }

    setWrappedVault(newWrapped);
    setVaultKey(key);
    setStatus('unlocked');
  }

  return (
    <VaultContext.Provider value={{ status, vaultKey, createVault, unlock, lock, changePassphrase, resetIdle }}>
      {children}
    </VaultContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDreamVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useDreamVault must be used inside DreamVaultProvider');
  return ctx;
}
