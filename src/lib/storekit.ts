/**
 * StoreKit 2 purchase service for Spellful Plus.
 *
 * Uses @capacitor-community/in-app-purchases to:
 *  - Fetch the localized product from App Store (displayPrice)
 *  - Initiate a purchase and send the signed JWS transaction to the server
 *  - Restore existing purchases
 *  - Listen for server-to-server transaction updates (renewals, refunds)
 *
 * All methods are no-ops on web — the purchase button is hidden on web anyway,
 * but this guard prevents import errors during SSR.
 *
 * Product ID: com.spellful.plus.monthly
 */

import { Capacitor } from '@capacitor/core';

export const PLUS_PRODUCT_ID = 'com.spellful.plus.monthly';

export interface PlusProduct {
  productId: string;
  displayPrice: string;   // e.g. "$4.99" — localized by StoreKit
  displayName: string;
  description: string;
}

export interface PurchaseResult {
  ok: boolean;
  isPlus: boolean;
  status: string | null;
  expiresAt: string | null;
  environment: string;
  error?: string;
}

// ── Lazy plugin import ─────────────────────────────────────────────────────────
// We import dynamically so SSR never tries to resolve the native module.

async function getPlugin() {
  if (!Capacitor.isNativePlatform()) return null;
  // Use a computed specifier so Vite does not attempt to resolve/bundle this
  // at build time. The package is only available after `npm install` on a
  // native build machine (Codemagic). On web the guard above returns null first.
  // Build the specifier at runtime so Vite's static import scanner never sees it.
  const parts = ['@capacitor-community', 'in-app-purchases'];
  const specifier = parts.join('/');
  const loadPlugin = new Function('s', 'return import(s)') as (s: string) => Promise<{ InAppPurchases: unknown }>;
  const mod = await loadPlugin(specifier);
  return mod.InAppPurchases as {
    getProducts(opts: { productIdentifiers: string[] }): Promise<{ products?: Array<{ productIdentifier: string; localizedPrice?: string; localizedTitle?: string; localizedDescription?: string }> }>;
    purchaseProduct(opts: { productIdentifier: string; appAccountToken?: string }): Promise<{ signedTransaction?: string } | null>;
    restoreTransactions(): Promise<{ transactions?: Array<{ productIdentifier: string; signedTransaction?: string }> } | null>;
  };
}

// ── Product fetch ──────────────────────────────────────────────────────────────

/**
 * Fetch the localized product info from App Store.
 * Returns null on web or if the product is not found.
 */
export async function fetchPlusProduct(): Promise<PlusProduct | null> {
  const plugin = await getPlugin();
  if (!plugin) return null;

  try {
    const result = await plugin.getProducts({ productIdentifiers: [PLUS_PRODUCT_ID] });
    const product = result.products?.find((p) => p.productIdentifier === PLUS_PRODUCT_ID);
    if (!product) return null;

    return {
      productId: product.productIdentifier,
      displayPrice: product.localizedPrice ?? '$4.99',
      displayName: product.localizedTitle ?? 'Spellful Plus',
      description: product.localizedDescription ?? '',
    };
  } catch {
    return null;
  }
}

// ── Purchase ───────────────────────────────────────────────────────────────────

/**
 * Initiate a StoreKit 2 purchase for Spellful Plus.
 * On success, sends the signed JWS transaction to the server for verification.
 */
export async function purchasePlus(userId: string): Promise<PurchaseResult> {
  const plugin = await getPlugin();
  if (!plugin) {
    return { ok: false, isPlus: false, status: null, expiresAt: null, environment: 'web', error: 'NOT_NATIVE' };
  }

  try {
    // appAccountToken links the purchase to the user — must be a UUID-format string.
    // We use the userId directly; BetterAuth user IDs are UUIDs.
    const purchaseResult = await plugin.purchaseProduct({
      productIdentifier: PLUS_PRODUCT_ID,
      appAccountToken: userId,
    });

    if (!purchaseResult?.signedTransaction) {
      return { ok: false, isPlus: false, status: null, expiresAt: null, environment: 'unknown', error: 'NO_TRANSACTION' };
    }

    return await verifyWithServer(purchaseResult.signedTransaction);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // User cancelled — not an error worth surfacing
    if (msg.includes('cancelled') || msg.includes('SKErrorDomain error 2')) {
      return { ok: false, isPlus: false, status: null, expiresAt: null, environment: 'unknown', error: 'USER_CANCELLED' };
    }
    return { ok: false, isPlus: false, status: null, expiresAt: null, environment: 'unknown', error: msg };
  }
}

// ── Restore ────────────────────────────────────────────────────────────────────

/**
 * Restore existing purchases. Sends each valid transaction to the server.
 * Returns the final entitlement state after all transactions are processed.
 */
export async function restorePurchases(): Promise<PurchaseResult> {
  const plugin = await getPlugin();
  if (!plugin) {
    return { ok: false, isPlus: false, status: null, expiresAt: null, environment: 'web', error: 'NOT_NATIVE' };
  }

  try {
    const result = await plugin.restoreTransactions();
    const transactions = result?.transactions ?? [];

    let lastResult: PurchaseResult = {
      ok: false, isPlus: false, status: null, expiresAt: null, environment: 'unknown', error: 'NO_TRANSACTIONS',
    };

    for (const txn of transactions) {
      if (txn.productIdentifier !== PLUS_PRODUCT_ID) continue;
      if (!txn.signedTransaction) continue;
      lastResult = await verifyWithServer(txn.signedTransaction);
    }

    return lastResult;
  } catch (e) {
    return { ok: false, isPlus: false, status: null, expiresAt: null, environment: 'unknown', error: String(e) };
  }
}

// ── Server verification ────────────────────────────────────────────────────────

async function verifyWithServer(signedTransaction: string): Promise<PurchaseResult> {
  try {
    const res = await fetch('/api/plus/verify-purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ signedTransaction }),
    });
    const data = await res.json() as PurchaseResult & { error?: string };
    if (!res.ok) {
      return { ok: false, isPlus: false, status: null, expiresAt: null, environment: 'unknown', error: data.error ?? 'SERVER_ERROR' };
    }
    return data;
  } catch (e) {
    return { ok: false, isPlus: false, status: null, expiresAt: null, environment: 'unknown', error: String(e) };
  }
}
