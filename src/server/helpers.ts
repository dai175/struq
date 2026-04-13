import { getAuthUser } from "@/auth/server-fns";

export async function requireUser() {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export function now() {
  return Math.floor(Date.now() / 1000);
}
