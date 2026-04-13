import { env } from "cloudflare:workers";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { clearSession, getSession, updateSession } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { LOCALES, type Locale } from "@/i18n/types";
import { requireUser } from "@/server/helpers";
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
  .inputValidator((input: { locale: Locale }) => {
    if (!LOCALES.includes(input.locale)) throw new Error("Invalid locale");
    return input;
  })
  .handler(async ({ data }) => {
    const user = await requireUser();
    const db = getDb(env.DB);
    await db.update(schema.users).set({ locale: data.locale }).where(eq(schema.users.id, user.userId));
    await updateSession<AppSessionData>(getSessionConfig(), {
      user: { ...user, locale: data.locale },
    });
  });
