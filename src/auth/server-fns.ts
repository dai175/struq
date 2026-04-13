import { env } from "cloudflare:workers";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { clearSession, getSession, updateSession } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { LOCALES, type Locale } from "@/i18n/types";
import { type AppSessionData, getSessionConfig, type SessionUser } from "./session";

export const getAuthUser = createServerFn({ method: "GET" }).handler(async (): Promise<SessionUser | null> => {
  const session = await getSession<AppSessionData>(getSessionConfig());
  return session.data?.user ?? null;
});

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  await clearSession(getSessionConfig());
});

export function requireAuth({ context }: { context: { user: SessionUser | null } }) {
  if (!context.user) {
    throw redirect({ to: "/login" });
  }
}

export const updateLocale = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (typeof data !== "object" || data === null || !("locale" in data)) throw new Error("Invalid");
    const { locale } = data as { locale: unknown };
    if (!LOCALES.includes(locale as Locale)) throw new Error("Invalid locale");
    return { locale: locale as Locale };
  })
  .handler(async ({ data }) => {
    const session = await getSession<AppSessionData>(getSessionConfig());
    const user = session.data?.user;
    if (!user) throw new Error("Unauthorized");

    const db = getDb(env.DB);
    await db.update(schema.users).set({ locale: data.locale }).where(eq(schema.users.id, user.userId));
    await updateSession<AppSessionData>(getSessionConfig(), {
      user: { ...user, locale: data.locale },
    });
  });
