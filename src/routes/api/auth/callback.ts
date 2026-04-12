import { createFileRoute } from "@tanstack/react-router";
import {
  getCookie,
  deleteCookie,
  updateSession,
  getRequestUrl,
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

export const Route = createFileRoute("/api/auth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error) {
          return new Response(null, {
            status: 302,
            headers: { Location: `${url.origin}/login?error=oauth_denied` },
          });
        }

        // Validate CSRF state
        const savedState = getCookie("oauth_state");
        deleteCookie("oauth_state");

        if (!code || !state || state !== savedState) {
          return new Response(null, {
            status: 302,
            headers: {
              Location: `${url.origin}/login?error=invalid_state`,
            },
          });
        }

        try {
          const requestUrl = getRequestUrl();
          const redirectUri = `${requestUrl.origin}/api/auth/callback`;

          // Exchange code for tokens & fetch user info
          const tokens = await exchangeCodeForTokens(code, redirectUri);
          const googleUser = await getGoogleUserInfo(tokens.access_token);

          // Reject unverified email addresses
          if (googleUser.email_verified === false) {
            return new Response(null, {
              status: 302,
              headers: {
                Location: `${url.origin}/login?error=auth_failed`,
              },
            });
          }

          // Lookup user by google_id
          const db = getDb(env.DB);
          const existingUser = await db.query.users.findFirst({
            where: eq(schema.users.googleId, googleUser.sub),
          });

          let sessionUser: SessionUser;

          if (existingUser) {
            // Block deleted users
            if (existingUser.deletedAt) {
              return new Response(null, {
                status: 302,
                headers: {
                  Location: `${url.origin}/login?error=account_deleted`,
                },
              });
            }

            sessionUser = {
              userId: existingUser.id,
              googleId: existingUser.googleId,
              email: existingUser.email,
              name: existingUser.name,
              avatarUrl: existingUser.avatarUrl,
              locale: existingUser.locale as SessionUser["locale"],
            };
          } else {
            // Create new user
            const userId = crypto.randomUUID();
            const now = Math.floor(Date.now() / 1000);

            await db.insert(schema.users).values({
              id: userId,
              googleId: googleUser.sub,
              email: googleUser.email,
              name: googleUser.name,
              avatarUrl: googleUser.picture ?? null,
              locale: "ja",
              createdAt: now,
            });

            sessionUser = {
              userId,
              googleId: googleUser.sub,
              email: googleUser.email,
              name: googleUser.name,
              avatarUrl: googleUser.picture ?? null,
              locale: "ja",
            };
          }

          // Create session
          await updateSession<AppSessionData>(getSessionConfig(), {
            user: sessionUser,
          });

          return new Response(null, {
            status: 302,
            headers: { Location: `${url.origin}/setlists` },
          });
        } catch (err) {
          console.error("OAuth callback error:", err);
          return new Response(null, {
            status: 302,
            headers: {
              Location: `${url.origin}/login?error=auth_failed`,
            },
          });
        }
      },
    },
  },
});
