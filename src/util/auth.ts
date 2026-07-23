import type { RequestEventCommon } from '@qwik.dev/router';
import { getDB } from './db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export interface UserSession {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
  };
}

export function getSessionUserId(
  requestEvent: RequestEventCommon
): string | null {
  const session = requestEvent.sharedMap.get('session') as
    | UserSession
    | undefined;
  return session?.user?.id ?? null;
}

export async function getSessionUser(requestEvent: RequestEventCommon) {
  const userId = getSessionUserId(requestEvent);
  if (!userId) return null;
  const db = getDB();
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  return user ?? null;
}

export function isAdmin(
  user: { rank?: string | null } | null | undefined
): boolean {
  if (!user) return false;
  const rank = user.rank?.toLowerCase() ?? '';
  return rank === 'admin' || rank === 'owner';
}

export function logoutUser(requestEvent: RequestEventCommon): void {
  requestEvent.cookie.delete('authjs.session-token', { path: '/' });
  requestEvent.cookie.delete('__Secure-authjs.session-token', { path: '/' });
}
