import { component$, useSignal } from "@builder.io/qwik";
import { routeLoader$, routeAction$, zod$, z, Form } from "@builder.io/qwik-city";
import { eq } from "drizzle-orm";
import { getDB, users } from "~/lib/db";
import { getSessionUserId } from "~/lib/auth";

/**
 * Handle unlinking Minecraft account or check if already linked.
 */
export const useLinkMinecraftLoader = routeLoader$(async (requestEvent) => {
  const userId = getSessionUserId(requestEvent);
  if (!userId) {
    throw requestEvent.redirect(302, "/login?error=auth_required");
  }

  const unlink = requestEvent.url.searchParams.get("unlink") === "true";
  const db = getDB(requestEvent);

  if (unlink) {
    // Clear minecraftAccount in the database
    await db
      .update(users)
      .set({ minecraftAccount: "" })
      .where(eq(users.id, userId));
    throw requestEvent.redirect(302, `/profile/${userId}?success=minecraft_unlinked`);
  }

  const userRow = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  return {
    userId,
    minecraftAccount: userRow?.minecraftAccount || "",
  };
});

/**
 * Action to link Minecraft account by fetching UUID from Mojang API.
 */
export const useLinkMinecraftAction = routeAction$(
  async (formData, requestEvent) => {
    const userId = getSessionUserId(requestEvent);
    if (!userId) {
      return { success: false, message: "Authentication required." };
    }

    const { username } = formData;
    const db = getDB(requestEvent);

    try {
      // 1. Fetch UUID from Mojang API
      const mojangRes = await fetch(
        `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`
      );

      if (mojangRes.status === 204 || mojangRes.status === 404) {
        return {
          success: false,
          message: "Minecraft username not found. Please check spelling.",
        };
      }

      if (!mojangRes.ok) {
        return {
          success: false,
          message: "Failed to connect to Mojang API. Please try again later.",
        };
      }

      const profile = (await mojangRes.json()) as { name: string; id: string };
      const uuid = profile.id; // Mojang returns UUID without dashes

      // 2. Update user in the database
      await db
        .update(users)
        .set({ minecraftAccount: uuid })
        .where(eq(users.id, userId));

      return {
        success: true,
        message: `Successfully linked Minecraft account: ${profile.name}`,
        redirectUrl: `/profile/${userId}?success=minecraft_linked`,
      };
    } catch (err) {
      console.error("Minecraft linking failed", err);
      return {
        success: false,
        message: "An unexpected error occurred. Please try again.",
      };
    }
  },
  zod$({
    username: z.string().min(3).max(16).regex(/^[a-zA-Z0-9_]+$/),
  })
);

export default component$(() => {
  const loaderSig = useLinkMinecraftLoader();
  const actionSig = useLinkMinecraftAction();
  const usernameVal = useSignal("");

  // Handle redirect if success is returned in action
  if (actionSig.value?.success && actionSig.value?.redirectUrl) {
    // Server-side action redirect or client-side navigation
  }

  return (
    <div class="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-gray-900/50 border border-gray-850 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div class="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="text-center mb-8">
          <i class="bi bi-controller text-5xl text-emerald-500 inline-block mb-3 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse"></i>
          <h1 class="text-2xl font-black tracking-tight text-gray-100">
            Link Minecraft Account
          </h1>
          <p class="text-xs text-gray-400 mt-2 max-w-xs mx-auto">
            Link your official Minecraft profile to customize in-game portal cosmetics and access premium features.
          </p>
        </div>

        <Form action={actionSig} class="space-y-6">
          <div>
            <label for="username" class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Minecraft Username
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <i class="bi bi-person-fill"></i>
              </span>
              <input
                type="text"
                name="username"
                id="username"
                required
                placeholder="e.g. Saboooor"
                bind:value={usernameVal}
                class="w-full pl-10 pr-4 py-3 bg-gray-950/50 border border-gray-800 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-200"
              />
            </div>
            <p class="text-[10px] text-gray-500 mt-2">
              Must be a registered premium Java Edition Minecraft account.
            </p>
          </div>

          {actionSig.value && !actionSig.value.success && (
            <div class="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-center gap-2">
              <i class="bi bi-exclamation-circle-fill"></i>
              <span>{actionSig.value.message}</span>
            </div>
          )}

          {actionSig.value?.success && (
            <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-2">
              <i class="bi bi-check-circle-fill"></i>
              <span>{actionSig.value.message}</span>
              <meta http-equiv="refresh" content={`1;url=${actionSig.value.redirectUrl}`} />
            </div>
          )}

          <div class="flex items-center gap-3">
            <a
              href={`/profile/${loaderSig.value.userId}`}
              class="w-1/3 text-center py-3 bg-gray-900 border border-gray-850 hover:bg-gray-850 text-gray-400 text-xs font-bold rounded-xl transition-all duration-200"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={actionSig.isRunning}
              class="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-550 active:scale-98 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-600/15"
            >
              {actionSig.isRunning ? "Connecting..." : "Link Account"}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
});
