import { component$, useStore, $ } from "@builder.io/qwik";
import { routeLoader$, routeAction$, Form, zod$, z } from "@builder.io/qwik-city";
import { eq, and, or, desc } from "drizzle-orm";
import { getDB, userPortals, users } from "../../util/db";
import { getSessionUserId, getSessionUser, isAdmin } from "../../util/auth";

export interface PortalCardData {
  id: number;
  portalID: string;
  maker: number;
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
  const queryWhere = or(eq(userPortals.public, 1), eq(userPortals.maker, loggedInId));

  try {
    const list = await db.query.userPortals.findMany({
      where: queryWhere,
      orderBy: [desc(userPortals.id)],
      limit,
    });

    const makerIds = [...new Set(list.map((p) => p.maker))];
    const makersMap = new Map<number, string>();

    if (makerIds.length > 0) {
      const makersList = await db.query.users.findMany({
        where: or(...makerIds.map((id) => eq(users.id, id))),
      });
      makersList.forEach((m) => makersMap.set(m.id, m.username));
    }

    const portals: PortalCardData[] = list.map((p) => {
      let likesList: number[] = [];
      try {
        likesList = JSON.parse(p.liked) as number[];
      } catch (e) {
        // ignore
      }
      return {
        id: p.id,
        portalID: p.portalID,
        maker: p.maker,
        creator: makersMap.get(p.maker) || "Unknown",
        img: p.img,
        public: p.public,
        likesCount: likesList.length,
        isLiked: likesList.includes(loggedInId),
      };
    });

    return {
      portals,
      hasMore: portals.length === limit,
      isLoggedIn: loggedInId > 0,
      isAdmin: isAdmin(user),
    };
  } catch (err) {
    console.error("Initial portals loader error:", err);
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
    if (userId === 0) return { success: false, message: "Must be logged in." };

    const db = getDB(requestEvent);

    try {
      const portal = await db.query.userPortals.findFirst({
        where: eq(userPortals.id, portalId),
      });

      if (!portal) return { success: false, message: "Portal not found." };

      let likedList: number[] = [];
      try {
        likedList = JSON.parse(portal.liked) as number[];
      } catch (e) {
        likedList = [];
      }

      const userIndex = likedList.indexOf(userId);
      if (userIndex > -1) {
        likedList.splice(userIndex, 1); // Unlike
      } else {
        likedList.push(userId); // Like
      }

      await db
        .update(userPortals)
        .set({ liked: JSON.stringify(likedList) })
        .where(eq(userPortals.id, portalId))
        .run();

      return {
        success: true,
        likesCount: likedList.length,
        isLiked: userIndex === -1,
      };
    } catch (err) {
      console.error("Toggle like error:", err);
      return { success: false, message: "Database error." };
    }
  },
  zod$({
    portalId: z.coerce.number(),
  })
);

export default component$(() => {
  const loaderSig = useInitialPortalsLoader();
  const likeActionSig = useToggleLikeAction();

  // Use a reactive store to manage client-side state
  const state = useStore({
    portals: loaderSig.value.portals,
    page: 1,
    hasMore: loaderSig.value.hasMore,
    showAll: false,
    loadingMore: false,
  });

  const loadMore = $(async () => {
    if (state.loadingMore) return;
    state.loadingMore = true;
    
    const nextPage = state.page + 1;
    try {
      const res = await fetch(`/portals/api?page=${nextPage}&showAll=${state.showAll}`);
      const data = (await res.json()) as any;
      
      if (data.success) {
        state.portals = [...state.portals, ...data.portals];
        state.page = nextPage;
        state.hasMore = data.hasMore;
      }
    } catch (e) {
      console.error("Failed to load more portals:", e);
    } finally {
      state.loadingMore = false;
    }
  });

  const toggleShowAll = $(async () => {
    state.showAll = !state.showAll;
    state.page = 1;
    state.portals = [];
    state.loadingMore = true;
    
    try {
      const res = await fetch(`/portals/api?page=1&showAll=${state.showAll}`);
      const data = (await res.json()) as any;
      
      if (data.success) {
        state.portals = data.portals;
        state.hasMore = data.hasMore;
      }
    } catch (e) {
      console.error("Failed to toggle admin view:", e);
    } finally {
      state.loadingMore = false;
    }
  });

  const handleLike = $(async (portalId: number) => {
    if (!loaderSig.value.isLoggedIn) return;

    // Optimistic UI Update
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

    // Trigger action in background
    await likeActionSig.submit({ portalId });
  });

  return (
    <div class="space-y-8">
      {/* Header title */}
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <i class="bx bx-cloud-download text-blue-500"></i>
            <span>Browse Portals</span>
          </h1>
          <p class="text-xs text-gray-500">Discover and download custom portal configurations created by the community</p>
        </div>
      </div>

      {/* Admin Panel */}
      {loaderSig.value.isAdmin && (
        <div class="bg-gray-900/40 border border-gray-900 rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div class="flex items-center gap-2 text-gray-300">
            <i class="bi bi-shield-lock-fill text-gray-500"></i>
            <span class="text-xs font-semibold">Admin Options</span>
          </div>
          <button
            onClick$={toggleShowAll}
            class={`text-xs font-bold px-4 py-2 rounded-lg transition-all ${
              state.showAll
                ? "bg-gray-600 hover:bg-gray-500 text-white"
                : "bg-gray-800 hover:bg-gray-750 text-gray-300 border border-gray-700"
            }`}
          >
            {state.showAll ? "Showing All (Incl. Private)" : "Show All"}
          </button>
        </div>
      )}

      {/* Portals Grid */}
      {state.portals.length > 0 ? (
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {state.portals.map((portal) => (
            <div
              key={portal.id}
              class="bg-gray-900/30 border border-gray-900 rounded-2xl p-4 flex flex-col justify-between hover:border-gray-800 transition-all shadow-md group"
            >
              <div class="space-y-3">
                {/* Image preview */}
                {portal.img ? (
                  <div class="h-40 w-full bg-gray-950 rounded-xl overflow-hidden flex items-center justify-center border border-gray-900 relative">
                    <img
                      src={portal.img}
                      alt="Portal Preview"
                      class="h-full w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                    {portal.public === 0 && (
                      <span class="absolute top-2 right-2 px-2 py-0.5 bg-gray-950/90 border border-gray-800 text-[9px] text-gray-400 font-semibold uppercase tracking-wider rounded">
                        Private
                      </span>
                    )}
                  </div>
                ) : (
                  <div class="h-40 w-full bg-gray-950 rounded-xl flex items-center justify-center border border-gray-900 text-gray-700">
                    <i class="bi bi-image text-4xl"></i>
                  </div>
                )}

                {/* Info & Liking */}
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <h3 class="font-bold text-sm text-gray-200 truncate max-w-[150px] group-hover:text-white transition-colors">
                      <a href={`/editor/portal/?portal=${portal.id}`}>{portal.portalID}</a>
                    </h3>
                    <p class="text-[10px] text-gray-500 mt-0.5">
                      by{" "}
                      <a href={`/profile/${portal.maker}`} class="hover:text-gray-300 font-semibold underline">
                        {portal.creator}
                      </a>
                    </p>
                  </div>
                  <button
                    onClick$={() => handleLike(portal.id)}
                    disabled={!loaderSig.value.isLoggedIn}
                    class={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
                      portal.isLiked
                        ? "bg-red-950/20 border-red-900/30 text-red-500"
                        : "bg-gray-950/40 border-gray-900 text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    <i class={`bi ${portal.isLiked ? "bi-heart-fill" : "bi-heart"}`}></i>
                    <span>{portal.likesCount}</span>
                  </button>
                </div>
              </div>

              {/* Open button */}
              <a
                href={`/editor/portal/?portal=${portal.id}`}
                class="mt-4 w-full text-center bg-gray-900 hover:bg-gray-800 border border-gray-850 text-gray-300 text-xs font-semibold py-2 rounded-lg transition-all"
              >
                Open in Editor
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div class="text-center py-16 bg-gray-900/10 border border-dashed border-gray-900 rounded-3xl">
          <i class="bi bi-folder2-open text-4xl text-gray-700"></i>
          <p class="text-gray-500 text-sm mt-3 font-semibold">No portals found...</p>
        </div>
      )}

      {/* Load More Button */}
      {state.hasMore && (
        <div class="flex justify-center pt-4">
          <button
            onClick$={loadMore}
            disabled={state.loadingMore}
            class="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-850 disabled:text-gray-650 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md transition-all text-sm flex items-center gap-2"
          >
            {state.loadingMore ? (
              <span>Loading...</span>
            ) : (
              <>
                <span>Load More Portals</span>
                <i class="bi bi-arrow-down-short text-lg"></i>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
});
