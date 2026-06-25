import type { RequestEvent, RequestEventCommon } from "@builder.io/qwik-city";
import { eq } from "drizzle-orm";
import { getDB, type User, users } from "./db";

/**
 * Logs out a user by deleting Auth.js session cookies.
 */
export function logoutUser(requestEvent: RequestEvent | RequestEventCommon) {
  requestEvent.cookie.delete("authjs.session-token", { path: "/" });
  requestEvent.cookie.delete("__Secure-authjs.session-token", { path: "/" });
  requestEvent.cookie.delete("next-auth.session-token", { path: "/" });
  requestEvent.cookie.delete("__Secure-next-auth.session-token", { path: "/" });
}

/**
 * Retrieves the current logged-in user's ID (UUID string), or null if not authenticated.
 */
export function getSessionUserId(requestEvent: RequestEvent | RequestEventCommon): string | null {
  const session = requestEvent.sharedMap.get("session") as any;
  if (!session || !session.user || !session.user.id) return null;
  return session.user.id as string;
}

/**
 * Fetches the current authenticated user's full record from the database.
 * Returns null if not logged in.
 */
export async function getSessionUser(
  requestEvent: RequestEvent | RequestEventCommon
): Promise<User | null> {
  const userId = getSessionUserId(requestEvent);
  if (!userId) return null;

  try {
    const db = getDB(requestEvent);
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    return user || null;
  } catch (err) {
    console.error("Error fetching session user:", err);
    return null;
  }
}

/**
 * Checks if the user is an administrator (rank is 'admin' or 'developer').
 */
export function isAdmin(user: User | null): boolean {
  return !!(user?.rank && ["admin", "developer"].includes(user.rank.toLowerCase()));
}

/**
 * Checks if ads can be shown to the user.
 */
export function canShowAds(user: User | null): boolean {
  if (!user) return true;
  return user.enabledAds === 1;
}
