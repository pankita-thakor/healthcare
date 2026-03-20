import type { User } from "@supabase/supabase-js";
import { createBrowserClient } from "@/lib/supabase";

const LOCK_ERROR_NAMES = ["AbortError", "Error"];
const LOCK_ERROR_PATTERNS = ["Lock broken", "Lock was released", "stole it"];

function isLockError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message ?? "";
  const name = err.name ?? "";
  return (
    LOCK_ERROR_NAMES.includes(name) ||
    LOCK_ERROR_PATTERNS.some((p) => msg.includes(p))
  );
}

/**
 * Safe getUser that catches Supabase auth lock errors (AbortError, "Lock broken", etc.)
 * and retries. Prevents app crash when multiple tabs or concurrent requests contend for the lock.
 */
export async function safeGetUser(): Promise<{ user: User | null }> {
  const supabase = createBrowserClient();

  async function attempt(): Promise<{ user: User | null }> {
    const { data } = await supabase.auth.getUser();
    return { user: data.user ?? null };
  }

  try {
    return await attempt();
  } catch (err) {
    if (!isLockError(err)) throw err;
    await new Promise((r) => setTimeout(r, 150));
    try {
      return await attempt();
    } catch (retryErr) {
      if (!isLockError(retryErr)) throw retryErr;
      return { user: null };
    }
  }
}
