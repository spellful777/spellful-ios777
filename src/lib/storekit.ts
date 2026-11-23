/**
 * StoreKit 2 purchase service for Spellful Plus.
 *
 * Uses @capgo/native-purchases to:
 *  - Fetch the localized product from App Store (displayPrice)
 *  - Initiate a purchase and send the signed JWS transaction to the server
 *  - Restore existing purchases
 *
 * StoreKit calls run only on native iOS.
 *
 * Product ID: com.spellful.plus.monthly
 */

import { Capacitor } from '@capacitor/core';
import { NativePurchases } from '@capgo/native-purchases';

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

// ── Product fetch ──────────────────────────────────────────────────────────────

/**
 * Fetch the localized product info from App Store.
 * Returns null on web or if the product is not found.
 */
export async function fetchPlusProduct(): Promise<PlusProduct | null> {
  if (Capacitor.getPlatform() !== 'ios') return null;

  try {
    const result = await NativePurchases.getProducts({ productIdentifiers: [PLUS_PRODUCT_ID] });
    const product = result.products?.find((p) => p.identifier === PLUS_PRODUCT_ID);
    if (!product) return null;

    return {
      productId: product.identifier,
      displayPrice: product.priceString ?? '$4.99',
      displayName: product.title ?? 'Spellful Plus',
      description: product.description ?? '',
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
  if (Capacitor.getPlatform() !== 'ios') {
    return { ok: false, isPlus: false, status: null, expiresAt: null, environment: 'web', error: 'NOT_NATIVE' };
  }

  try {
    // appAccountToken links the purchase to the user — must be a UUID-format string.
    // We use the userId directly; BetterAuth user IDs are UUIDs.
    const purchaseResult = await NativePurchases.purchaseProduct({
      productIdentifier: PLUS_PRODUCT_ID,
      appAccountToken: userId,
    });

    if (!purchaseResult?.jwsRepresentation) {
      return { ok: false, isPlus: false, status: null, expiresAt: null, environment: 'unknown', error: 'NO_TRANSACTION' };
    }

    return await verifyWithServer(purchaseResult.jwsRepresentation);
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
  if (Capacitor.getPlatform() !== 'ios') {
    return { ok: false, isPlus: false, status: null, expiresAt: null, environment: 'web', error: 'NOT_NATIVE' };
  }

  try {
    await NativePurchases.restorePurchases();
    const { purchases } = await NativePurchases.getPurchases({ onlyCurrentEntitlements: true });

    let lastResult: PurchaseResult = {
      ok: false, isPlus: false, status: null, expiresAt: null, environment: 'unknown', error: 'NO_TRANSACTIONS',
    };

    for (const txn of purchases) {
      if (txn.productIdentifier !== PLUS_PRODUCT_ID) continue;
      if (!txn.jwsRepresentation) continue;
      lastResult = await verifyWithServer(txn.jwsRepresentation);
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
