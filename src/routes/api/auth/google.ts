import { createFileRoute } from "@tanstack/react-router";
import { getRequestUrl, setCookie } from "@tanstack/react-start/server";
import { getGoogleAuthUrl } from "@/auth/oauth";

export const Route = createFileRoute("/api/auth/google")({
  server: {
    handlers: {
      GET: () => {
        const state = crypto.randomUUID();

        setCookie("oauth_state", state, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 10,
        });

        const requestUrl = getRequestUrl();
        const redirectUri = `${requestUrl.origin}/api/auth/callback`;
        const authUrl = getGoogleAuthUrl(redirectUri, state);

        return new Response(null, {
          status: 302,
          headers: { Location: authUrl },
        });
      },
    },
  },
});
