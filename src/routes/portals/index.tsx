import { component$, useStore, $ } from '@qwik.dev/core';
import { routeLoader$, routeAction$, zod$, z } from '@qwik.dev/router';
import { eq, or, desc } from 'drizzle-orm';
import { getDB, userPortals, users } from '../../util/db';
import { getSessionUser, isAdmin } from '../../util/auth';
import { Session } from '@auth/qwik';
import Plus from 'lucide-icons-qwik/icons/Plus';
import Grid3x3 from 'lucide-icons-qwik/icons/Grid';
import ChevronDown from 'lucide-icons-qwik/icons/ChevronDown';
import { Toggle } from '@luminescent/ui-qwik';
import { PortalCard } from './components/PortalCard';

export interface PortalCardData {
  id: number;
  portalID: string;
  maker: string;
  creator: string;
  img: string;
  public: number;
  likesCount: number;
  isLiked: boolean;
}

/**
 * Loader to fetch the first page of portals on server load.
 */
export const useInitialPortalsLoader = routeLoader$(async (requestEvent) => {
  const db = getDB();
  const session = requestEvent.sharedMap.get('session') as Session;
  const user = await getSessionUser(session.user?.id);

  const limit = 8;

  // By default, show public portals or self-owned portals
  const queryWhere = or(
    eq(userPortals.public, 1),
    eq(userPortals.maker, session.user?.id || '')
  );

  try {
    const list = await db.query.userPortals.findMany({
      where: queryWhere,
      orderBy: [desc(userPortals.id)],
      limit,
    });

    const makerIds = [...new Set(list.map((p) => p.maker))];
    const makersMap = new Map<string, string>();

    if (makerIds.length > 0) {
      const makersList = await db.query.users.findMany({
        where: or(...makerIds.map((id) => eq(users.id, id))),
      });
      makersList.forEach((m) => makersMap.set(m.id, m.username || 'Unknown'));
    }

    const portals: PortalCardData[] = list.map((p) => {
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
        isLiked: session.user?.id
          ? likesList.map(String).includes(session.user?.id)
          : false,
      };
    });

    return {
      portals,
      hasMore: portals.length === limit,
      isLoggedIn: !!session.user?.id,
      isAdmin: isAdmin(user),
    };
  } catch (err) {
    console.error('Initial portals loader error:', err);
    return { portals: [], hasMore: false, isLoggedIn: false, isAdmin: false };
  }
});

/**
 * Action to handle liking/unliking a portal.
 */
export const useToggleLikeAction = routeAction$(
  async (formData, requestEvent) => {
    const { portalId } = formData;
    const session = requestEvent.sharedMap.get('session') as Session;
    if (!session.user?.id)
      return { success: false, message: 'Must be logged in.' };

    const db = getDB();

    try {
      const portal = await db.query.userPortals.findFirst({
        where: eq(userPortals.id, portalId),
      });

      if (!portal) return { success: false, message: 'Portal not found.' };

      let likedList: (string | number)[] = [];
      try {
        likedList = JSON.parse(portal.liked);
      } catch {
        likedList = [];
      }

      const strLikedList = likedList.map(String);
      const userIndex = strLikedList.indexOf(session.user?.id);
      if (userIndex > -1) {
        likedList.splice(userIndex, 1); // Unlike
      } else {
        likedList.push(session.user?.id); // Like
      }

      await db
        .update(userPortals)
        .set({ liked: JSON.stringify(likedList) })
        .where(eq(userPortals.id, portalId));

      return {
        success: true,
        isLiked: userIndex === -1,
        likesCount: likedList.length,
      };
    } catch (err) {
      console.error('Toggle like error:', err);
      return { success: false, message: 'Failed to update like.' };
    }
  },
  zod$({
    portalId: z.coerce.number(),
  })
);

export default component$(() => {
  const initialData = useInitialPortalsLoader();
  const toggleLikeAction = useToggleLikeAction();

  const state = useStore({
    portals: initialData.value.portals,
    page: 1,
    hasMore: initialData.value.hasMore,
    loading: false,
    showAll: false,
  });

  const loadMore = $(async () => {
    if (state.loading || !state.hasMore) return;
    state.loading = true;

    try {
      const nextPage = state.page + 1;
      const res = await fetch(
        `/portals/api?page=${nextPage}&showAll=${state.showAll}`
      );
      const data = (await res.json()) as any;

      if (data.success) {
        state.portals = [...state.portals, ...data.portals];
        state.page = nextPage;
        state.hasMore = data.hasMore;
      }
    } catch (err) {
      console.error('Load more portals failed', err);
    } finally {
      state.loading = false;
    }
  });

  const handleToggleShowAll = $(async (e: Event) => {
    const target = e.target as HTMLInputElement;
    state.showAll = target.checked;
    state.page = 1;
    state.loading = true;

    try {
      const res = await fetch(`/portals/api?page=1&showAll=${state.showAll}`);
      const data = (await res.json()) as any;

      if (data.success) {
        state.portals = data.portals;
        state.hasMore = data.hasMore;
      }
    } catch (err) {
      console.error('Toggle show all portals failed', err);
    } finally {
      state.loading = false;
    }
  });

  const handleLike = $(async (portalId: number) => {
    if (!initialData.value.isLoggedIn) return;

    state.portals = state.portals.map((p) => {
      if (p.id === portalId) {
        const nextIsLiked = !p.isLiked;
        return {
          ...p,
          isLiked: nextIsLiked,
          likesCount: nextIsLiked ? p.likesCount + 1 : p.likesCount - 1,
        };
      }
      return p;
    });

    await toggleLikeAction.submit({ portalId });
  });

  return (
    <section
      class="relative flex min-h-svh flex-col overflow-hidden p-6 pt-20"
      style={{
        '--lum-border-radius': '1.5rem',
      }}
    >
      <div class="mx-auto flex w-full max-w-6xl flex-col gap-8">
        {/* Page Header */}
        <div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 class="text-3xl font-black tracking-tight text-gray-100">
              Community Portals
            </h1>
            <p class="mt-1 text-sm text-gray-400">
              Browse, search, and download portal configurations created by the
              community
            </p>
          </div>

          <div class="flex items-center gap-4">
            {initialData.value.isAdmin && (
              <Toggle
                checked={state.showAll}
                onChange$={handleToggleShowAll}
                class="text-xs font-semibold text-gray-300"
              >
                Show All (Admin)
              </Toggle>
            )}

            <a
              href="/editor/portal"
              class="flex items-center gap-2 rounded-xl bg-gray-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-colors hover:bg-gray-500"
            >
              <Plus class="h-4 w-4" />
              <span>Create Portal</span>
            </a>
          </div>
        </div>

        {/* Portals Grid */}
        {state.portals.length === 0 ? (
          <div class="rounded-2xl border border-gray-900 bg-gray-950/40 p-12 text-center text-gray-500">
            <Grid3x3 class="mx-auto mb-3 h-10 w-10" />
            <p class="text-sm font-semibold">No portals found.</p>
          </div>
        ) : (
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {state.portals.map((portal) => (
              <PortalCard
                key={portal.id}
                portal={portal}
                isLoggedIn={initialData.value.isLoggedIn}
                onLike$={handleLike}
              />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {state.hasMore && (
          <div class="flex justify-center pt-4">
            <button
              onClick$={loadMore}
              disabled={state.loading}
              class="disabled:bg-gray-850 disabled:text-gray-650 flex items-center gap-2 rounded-xl bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-gray-500"
            >
              {state.loading ? (
                <span>Loading...</span>
              ) : (
                <>
                  <span>Load More Portals</span>
                  <ChevronDown class="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
});
