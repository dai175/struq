import type { SessionConfig } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import type { Locale } from "@/i18n/types";

export interface SessionUser {
  userId: string;
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  locale: Locale;
}

export interface AppSessionData {
  user?: SessionUser;
}

export function getSessionConfig(): SessionConfig {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    throw new Error(
      "Invalid SESSION_SECRET: must be a non-empty string of at least 32 characters",
    );
  }
  return {
    password: env.SESSION_SECRET,
    name: "struq-session",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}
