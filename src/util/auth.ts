import { getDB } from './db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

import type { RequestEventCommon } from '@qwik.dev/router';
import type { Session } from '@auth/qwik';

export interface UserSession {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
  };
}

export async function getSessionUser(
  input?: string | RequestEventCommon | Session | null
) {
  if (!input) return null;
  let userId: string | undefined;

  if (typeof input === 'string') {
    userId = input;
  } else if (typeof input === 'object') {
    if ('sharedMap' in input && typeof input.sharedMap?.get === 'function') {
      const session = input.sharedMap.get('session') as Session | null;
      userId = session?.user?.id;
    } else if ('user' in input) {
      userId = input.user?.id;
    }
  }

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
