import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { clearSession, getSession } from "@tanstack/react-start/server";
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
