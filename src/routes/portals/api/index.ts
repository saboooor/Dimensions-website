import type { RequestHandler } from '@qwik.dev/router';
import { eq, or, desc } from 'drizzle-orm';
import { getDB, userPortals, users } from '../../../util/db';
import { getSessionUserId, getSessionUser, isAdmin } from '../../../util/auth';

export const onGet: RequestHandler = async (requestEvent) => {
  const db = getDB(requestEvent);
  const loggedInId = getSessionUserId(requestEvent);
  const user = await getSessionUser(requestEvent);

  // Read query parameters
  const page = parseInt(requestEvent.url.searchParams.get('page') || '1', 10);
  const showAll = requestEvent.url.searchParams.get('showAll') === 'true';

  const limit = 8;
  const offset = (page - 1) * limit;

  // Build secure where clause
  // Admin can see all if showAll is checked, otherwise show public or self-owned portals
  const isAdminUser = isAdmin(user);
  const queryWhere =
    isAdminUser && showAll
      ? undefined
      : or(eq(userPortals.public, 1), eq(userPortals.maker, loggedInId || ''));

  try {
    // Fetch portals
    const list = await db.query.userPortals.findMany({
      where: queryWhere,
      orderBy: [desc(userPortals.id)],
      limit,
      offset,
    });

    // Extract all unique maker IDs to fetch usernames in a batch
    const makerIds = [...new Set(list.map((p) => p.maker))];
    const makersMap = new Map<string, string>();

    if (makerIds.length > 0) {
      const makersList = await db.query.users.findMany({
        where: or(...makerIds.map((id) => eq(users.id, id))),
      });
      makersList.forEach((m) => makersMap.set(m.id, m.username || 'Unknown'));
    }

    // Format the response JSON
    const portals = list.map((p) => {
      let likesList: (string | number)[] = [];
      try {
        likesList = JSON.parse(p.liked);
      } catch {
        // ignore
      }

      return {
        id: p.id,
        portalID: p.portalID,
        maker: p.maker,
        creator: makersMap.get(p.maker) || 'Unknown',
        img: p.img,
        public: p.public,
        likesCount: likesList.length,
        isLiked: loggedInId
          ? likesList.map(String).includes(loggedInId)
          : false,
      };
    });

    requestEvent.json(200, {
      success: true,
      portals,
      hasMore: portals.length === limit,
    });
  } catch (err) {
    console.error('API Portals error:', err);
    requestEvent.json(500, { success: false, message: 'Server error' });
  }
};
