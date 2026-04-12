import { createServerFn } from "@tanstack/react-start";
import {
  getSession,
  clearSession,
} from "@tanstack/react-start/server";
import { getSessionConfig, type AppSessionData, type SessionUser } from "./session";

export const getAuthUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<SessionUser | null> => {
    const session = await getSession<AppSessionData>(getSessionConfig());
    return session.data?.user ?? null;
  },
);

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  await clearSession(getSessionConfig());
});
