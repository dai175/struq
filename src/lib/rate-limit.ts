import type { Database } from "@/db";
import { schema } from "@/db";

export const RATE_LIMIT_ERROR = "Rate limited";

const COOLDOWN_MS = 10_000; // 10 seconds between AI generation calls per user

export async function checkAiRateLimit(db: Database, userId: string): Promise<boolean> {
  const now = Date.now();

  const existing = await db.query.aiRateLimits.findFirst({
    where: (t, { eq }) => eq(t.userId, userId),
  });

  if (existing && now - existing.lastCalledAt < COOLDOWN_MS) {
    return false;
  }

  await db
    .insert(schema.aiRateLimits)
    .values({ userId, lastCalledAt: now })
    .onConflictDoUpdate({
      target: schema.aiRateLimits.userId,
      set: { lastCalledAt: now },
    });

  return true;
}
