import { sql } from "drizzle-orm";
import type { Database } from "@/db";
import { schema } from "@/db";

export const RATE_LIMIT_ERROR = "Rate limited";

// Per-user cooldown for AI generation calls.
// Uses a single atomic INSERT ... ON CONFLICT DO UPDATE SET ... WHERE ... RETURNING
// to avoid a TOCTOU race between the read and write.
const COOLDOWN_MS = 10_000;

export async function checkAiRateLimit(db: Database, userId: string): Promise<boolean> {
  const now = Date.now();
  const cutoff = now - COOLDOWN_MS;

  // Atomic upsert: only overwrite last_called_at when the cooldown window has elapsed.
  // If the DO UPDATE WHERE condition is false (still in cooldown), SQLite resolves the
  // conflict as a no-op and RETURNING returns 0 rows → rate limited.
  const rows = await db
    .insert(schema.aiRateLimits)
    .values({ userId, lastCalledAt: now })
    .onConflictDoUpdate({
      target: schema.aiRateLimits.userId,
      set: { lastCalledAt: now },
      setWhere: sql`${schema.aiRateLimits.lastCalledAt} <= ${cutoff}`,
    })
    .returning({ lastCalledAt: schema.aiRateLimits.lastCalledAt });

  return rows.length > 0;
}
