/**
 * serverSync.ts
 *
 * Syncs the catalog portion of the localStorage store with the API server.
 *
 * - fetchAndApplyServerStore(): Called on every page load. Fetches the latest
 *   catalog snapshot from the server and applies it to localStorage. If the
 *   server has no snapshot yet (first deploy) or is unreachable, local data
 *   (seed or cached) is used as the fallback.
 *
 * - schedulePushToServer(): Called from the admin panel whenever the store is
 *   mutated. Debounced 2.5 s so rapid successive edits send a single request.
 *
 * User-specific data (cart, orders, reviews, analytics, user behavior) is
 * intentionally excluded from sync — it belongs only to each device.
 */

// Keys that represent shared catalog data (not per-user)
const SYNC_KEYS = [
  "store_restaurants",
  "store_branches",
  "store_categories",
  "store_menu_items",
  "store_offers",
  "store_coupons",
  "store_banners",
  "store_app_settings",
  "store_modifier_groups",
  "store_modifier_options",
  "store_add_ons",
  "store_item_modifier_links",
  "store_branch_item_overrides",
  "store_branch_cat_overrides",
] as const;

function getStoreEndpoint(): string {
  const base = (import.meta.env.BASE_URL as string || "/").replace(/\/$/, "");
  return `${base}/api/store`;
}

/**
 * Fetch catalog data from the server and write it into localStorage.
 * Returns true when at least one key was updated (triggers a re-render).
 */
export async function fetchAndApplyServerStore(): Promise<boolean> {
  try {
    const res = await fetch(getStoreEndpoint(), {
      signal: AbortSignal.timeout(7000),
      cache: "no-store",
    });
    if (!res.ok) return false;

    const snapshot = (await res.json()) as Record<string, unknown>;
    if (!snapshot || typeof snapshot !== "object") return false;

    let changed = false;
    for (const key of SYNC_KEYS) {
      if (!(key in snapshot)) continue;
      const incoming = JSON.stringify(snapshot[key]);
      if (localStorage.getItem(key) !== incoming) {
        localStorage.setItem(key, incoming);
        changed = true;
      }
    }
    return changed;
  } catch {
    // Server unreachable or timed out — fall through to local data
    return false;
  }
}

/**
 * Collect all catalog keys from localStorage and push to the server.
 * Only called when the admin is logged in (token present in sessionStorage).
 */
async function pushNow(): Promise<void> {
  try {
    const token = sessionStorage.getItem("admin_token");
    if (!token) return;

    const snapshot: Record<string, unknown> = {};
    for (const key of SYNC_KEYS) {
      const raw = localStorage.getItem(key);
      snapshot[key] = raw ? JSON.parse(raw) : [];
    }

    await fetch(getStoreEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(snapshot),
    });
  } catch {
    // Silent failure — changes are already safe in localStorage
  }
}

let _timer: ReturnType<typeof setTimeout> | null = null;

/**
 * Schedule a debounced push to the server.
 * Calling this multiple times within 2.5 s results in a single push.
 */
export function schedulePushToServer(): void {
  if (_timer) clearTimeout(_timer);
  _timer = setTimeout(pushNow, 2500);
}
