import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { updateSession } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { type AppSessionData, getSessionConfig, type SessionUser } from "@/auth/session";
import { getDb, schema } from "@/db";
import { now } from "@/server/helpers";

/**
 * Test-only endpoint for E2E authentication.
 * Guarded by E2E_TEST env var — never set in production.
 * To enable locally, add E2E_TEST=1 to .dev.vars before running E2E tests.
 */
export const Route = createFileRoute("/api/auth/test-login")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { hostname } = new URL(request.url);
        const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

        if (!("E2E_TEST" in env) || env.E2E_TEST !== "1") {
          return new Response("Not found", { status: 404 });
        }
        if (!isLocalHost) {
          return new Response("Not found", { status: 404 });
        }

        const db = getDb(env.DB);
        const testGoogleId = "e2e-test-google-id";
        const testEmail = "e2e@test.local";

        let user = await db.query.users.findFirst({
          where: eq(schema.users.googleId, testGoogleId),
        });

        if (!user) {
          const id = crypto.randomUUID();
          await db
            .insert(schema.users)
            .values({
              id,
              googleId: testGoogleId,
              email: testEmail,
              name: "E2E Test User",
              avatarUrl: null,
              locale: "en",
              createdAt: now(),
            })
            .onConflictDoNothing();
          user = await db.query.users.findFirst({
            where: eq(schema.users.googleId, testGoogleId),
          });
        }

        if (!user) {
          return new Response("Failed to create test user", { status: 500 });
        }

        const sessionUser: SessionUser = {
          userId: user.id,
          googleId: user.googleId,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          locale: user.locale,
        };

        await updateSession<AppSessionData>(getSessionConfig(), {
          user: sessionUser,
        });

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
