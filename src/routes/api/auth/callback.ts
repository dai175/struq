import { createFileRoute } from "@tanstack/react-router";
import {
  getCookie,
  deleteCookie,
  updateSession,
} from "@tanstack/react-start/server";
import { exchangeCodeForTokens, getGoogleUserInfo } from "@/auth/oauth";
import {
  getSessionConfig,
  type AppSessionData,
  type SessionUser,
} from "@/auth/session";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { DEFAULT_LOCALE } from "@/i18n/types";

function redirectTo(origin: string, path: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: `${origin}${path}` },
  });
}

export const Route = createFileRoute("/api/auth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { origin, searchParams } = new URL(request.url);
        const code = searchParams.get("code");
        const state = searchParams.get("state");

        if (searchParams.get("error")) {
          return redirectTo(origin, "/login?error=oauth_denied");
        }

        const savedState = getCookie("oauth_state");
        deleteCookie("oauth_state");

        if (!code || !state || state !== savedState) {
          return redirectTo(origin, "/login?error=invalid_state");
        }

        try {
          const redirectUri = `${origin}/api/auth/callback`;
          const tokens = await exchangeCodeForTokens(code, redirectUri);
          const googleUser = await getGoogleUserInfo(tokens.access_token);

          // Explicit false check: undefined means the field was absent, which we allow
          if (googleUser.email_verified === false) {
            return redirectTo(origin, "/login?error=auth_failed");
          }

          const db = getDb(env.DB);
          const existingUser = await db.query.users.findFirst({
            where: eq(schema.users.googleId, googleUser.sub),
          });

          let userId: string;
          let locale: SessionUser["locale"];

          if (existingUser) {
            if (existingUser.deletedAt) {
              return redirectTo(origin, "/login?error=account_deleted");
            }
            userId = existingUser.id;
            locale = existingUser.locale;
          } else {
            userId = crypto.randomUUID();
            locale = DEFAULT_LOCALE;
            await db.insert(schema.users).values({
              id: userId,
              googleId: googleUser.sub,
              email: googleUser.email,
              name: googleUser.name,
              avatarUrl: googleUser.picture ?? null,
              locale,
              createdAt: Math.floor(Date.now() / 1000),
            });
          }

          const sessionUser: SessionUser = {
            userId,
            googleId: googleUser.sub,
            email: googleUser.email,
            name: googleUser.name,
            avatarUrl: googleUser.picture ?? null,
            locale,
          };

          await updateSession<AppSessionData>(getSessionConfig(), {
            user: sessionUser,
          });

          return redirectTo(origin, "/setlists");
        } catch (err) {
          console.error("OAuth callback error:", err);
          return redirectTo(origin, "/login?error=auth_failed");
        }
      },
    },
  },
});
