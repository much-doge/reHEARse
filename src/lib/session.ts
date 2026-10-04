import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  createSession,
  findUserBySession,
  revokeSession,
  type AuthenticatedUser,
} from "@/adapters/identity/auth-service";

const sessionCookieName = "rehearse_session";

export async function beginSession(userId: string): Promise<void> {
  const session = await createSession(userId);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure:
      process.env.NODE_ENV === "production" &&
      process.env.SESSION_COOKIE_SECURE !== "false",
    path: "/",
    expires: session.expiresAt,
  });
}

export async function currentUser(): Promise<AuthenticatedUser | null> {
  const token = (await cookies()).get(sessionCookieName)?.value;
  return token ? findUserBySession(token) : null;
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function endSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (token) await revokeSession(token);
  cookieStore.delete(sessionCookieName);
}
