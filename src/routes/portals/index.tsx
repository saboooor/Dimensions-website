import { component$, useStore, $ } from '@qwik.dev/core';
import { routeLoader$, routeAction$, zod$, z } from '@qwik.dev/router';
import { eq, or, desc } from 'drizzle-orm';
import { getDB, userPortals, users } from '../../util/db';
import { getSessionUserId, getSessionUser, isAdmin } from '../../util/auth';
import Plus from 'lucide-icons-qwik/icons/Plus';
import Grid3x3 from 'lucide-icons-qwik/icons/Grid';
import ImageIcon from 'lucide-icons-qwik/icons/Image';
import Heart from 'lucide-icons-qwik/icons/Heart';
import ChevronDown from 'lucide-icons-qwik/icons/ChevronDown';

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
  const db = getDB(requestEvent);
  const loggedInId = getSessionUserId(requestEvent);
  const user = await getSessionUser(requestEvent);

  const limit = 8;

  // By default, show public portals or self-owned portals
  const queryWhere = or(
    eq(userPortals.public, 1),
    eq(userPortals.maker, loggedInId || '')
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
        isLiked: loggedInId
          ? likesList.map(String).includes(loggedInId)
          : false,
      };
    });

    return {
      portals,
      hasMore: portals.length === limit,
      isLoggedIn: !!loggedInId,
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
    const userId = getSessionUserId(requestEvent);
    if (!userId) return { success: false, message: 'Must be logged in.' };

    const db = getDB(requestEvent);

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
      const userIndex = strLikedList.indexOf(userId);
      if (userIndex > -1) {
        likedList.splice(userIndex, 1); // Unlike
      } else {
        likedList.push(userId); // Like
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
    <div class="space-y-8">
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
            <label class="border-gray-850 flex cursor-pointer items-center gap-2 rounded-xl border bg-gray-900 px-3.5 py-2 text-xs font-semibold text-gray-300">
              <input
                type="checkbox"
                onChange$={handleToggleShowAll}
                class="rounded border-gray-700 bg-gray-950 text-gray-400 focus:ring-0"
              />
              <span>Show All (Admin)</span>
            </label>
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
            <div
              key={portal.id}
              class="group flex flex-col justify-between rounded-2xl border border-gray-900 bg-gray-900/30 p-4 shadow-md transition-all hover:border-gray-800"
            >
              <div class="space-y-3">
                {/* Image preview */}
                {portal.img ? (
                  <div class="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border border-gray-900 bg-gray-950">
                    <img
                      src={portal.img}
                      alt="Portal Preview"
                      class="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                      width="256"
                      height="160"
                    />
                    {portal.public === 0 && (
                      <span class="absolute top-2 right-2 rounded border border-gray-800 bg-gray-950/90 px-2 py-0.5 text-[9px] font-semibold tracking-wider text-gray-400 uppercase">
                        Private
                      </span>
                    )}
                  </div>
                ) : (
                  <div class="flex h-40 w-full items-center justify-center rounded-xl border border-gray-900 bg-gray-950 text-gray-700">
                    <ImageIcon class="h-10 w-10" />
                  </div>
                )}

                {/* Portal metadata */}
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <h3 class="font-bold text-gray-200 transition-colors group-hover:text-white">
                      {portal.portalID}
                    </h3>
                    <p class="mt-0.5 text-[10px] text-gray-500">
                      by{' '}
                      <a
                        href={`/profile/${portal.maker}`}
                        class="font-semibold underline hover:text-gray-300"
                      >
                        {portal.creator}
                      </a>
                    </p>
                  </div>
                  <button
                    onClick$={() => handleLike(portal.id)}
                    disabled={!initialData.value.isLoggedIn}
                    class={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all ${
                      portal.isLiked
                        ? 'border-red-900/30 bg-red-950/20 text-red-500'
                        : 'border-gray-900 bg-gray-950/40 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Heart
                      class={`h-3.5 w-3.5 ${portal.isLiked ? 'fill-current' : ''}`}
                    />
                    <span>{portal.likesCount}</span>
                  </button>
                </div>
              </div>

              {/* Open button */}
              <a
                href={`/editor/portal/?portal=${portal.id}`}
                class="border-gray-850 mt-4 w-full rounded-lg border bg-gray-900 py-2 text-center text-xs font-semibold text-gray-300 transition-all hover:bg-gray-800"
              >
                Open in Editor
              </a>
            </div>
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
  );
});
