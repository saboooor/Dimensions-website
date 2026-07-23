import { component$, useSignal } from '@qwik.dev/core';
import { routeLoader$, routeAction$, zod$, z, Form } from '@qwik.dev/router';
import { eq } from 'drizzle-orm';
import Gamepad2 from 'lucide-icons-qwik/icons/Gamepad2';
import UserIcon from 'lucide-icons-qwik/icons/User';
import AlertCircle from 'lucide-icons-qwik/icons/AlertCircle';
import CheckCircle2 from 'lucide-icons-qwik/icons/CheckCircle2';
import { getDB, users } from '~/util/db';
import { getSessionUserId } from '~/util/auth';

/**
 * Handle unlinking Minecraft account or check if already linked.
 */
export const useLinkMinecraftLoader = routeLoader$(async (requestEvent) => {
  const userId = getSessionUserId(requestEvent);
  if (!userId) {
    throw requestEvent.redirect(302, '/login?error=auth_required');
  }

  const unlink = requestEvent.url.searchParams.get('unlink') === 'true';
  const db = getDB(requestEvent);

  if (unlink) {
    // Clear minecraftAccount in the database
    await db
      .update(users)
      .set({ minecraftAccount: '' })
      .where(eq(users.id, userId));
    throw requestEvent.redirect(
      302,
      `/profile/${userId}?success=minecraft_unlinked`
    );
  }

  const userRow = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  return {
    userId,
    minecraftAccount: userRow?.minecraftAccount || '',
  };
});

/**
 * Action to link Minecraft account by fetching UUID from Mojang API.
 */
export const useLinkMinecraftAction = routeAction$(
  async (formData, requestEvent) => {
    const userId = getSessionUserId(requestEvent);
    if (!userId) {
      return { success: false, message: 'Authentication required.' };
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
          message: 'Minecraft username not found. Please check spelling.',
        };
      }

      if (!mojangRes.ok) {
        return {
          success: false,
          message: 'Failed to connect to Mojang API. Please try again later.',
        };
      }

      const profile: any = await mojangRes.json();
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
      console.error('Minecraft linking failed', err);
      return {
        success: false,
        message: 'An unexpected error occurred. Please try again.',
      };
    }
  },
  zod$({
    username: z
      .string()
      .min(3)
      .max(16)
      .regex(/^[a-zA-Z0-9_]+$/),
  })
);

export default component$(() => {
  const loaderSig = useLinkMinecraftLoader();
  const actionSig = useLinkMinecraftAction();
  const usernameVal = useSignal('');

  // Handle redirect if success is returned in action
  if (actionSig.value?.success && actionSig.value?.redirectUrl) {
    // Server-side action redirect or client-side navigation
  }

  return (
    <div class="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <div class="border-gray-850 relative w-full max-w-md overflow-hidden rounded-2xl border bg-gray-900/50 p-8 shadow-2xl backdrop-blur-md">
        {/* Glow effect */}
        <div class="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl"></div>
        <div class="pointer-events-none absolute -right-24 -bottom-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl"></div>

        <div class="mb-8 text-center">
          <Gamepad2 class="mb-3 inline-block h-12 w-12 animate-pulse text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
          <h1 class="text-2xl font-black tracking-tight text-gray-100">
            Link Minecraft Account
          </h1>
          <p class="mx-auto mt-2 max-w-xs text-xs text-gray-400">
            Link your official Minecraft profile to customize in-game portal
            cosmetics and access premium features.
          </p>
        </div>

        <Form action={actionSig} class="space-y-6">
          <div>
            <label
              for="username"
              class="mb-2 block text-[10px] font-bold tracking-wider text-gray-400 uppercase"
            >
              Minecraft Username
            </label>
            <div class="relative">
              <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                <UserIcon class="h-4 w-4" />
              </span>
              <input
                type="text"
                name="username"
                id="username"
                required
                placeholder="e.g. Saboooor"
                bind:value={usernameVal}
                class="w-full rounded-xl border border-gray-800 bg-gray-950/50 py-3 pr-4 pl-10 text-sm text-gray-200 placeholder-gray-600 transition-all duration-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none"
              />
            </div>
            <p class="mt-2 text-[10px] text-gray-500">
              Must be a registered premium Java Edition Minecraft account.
            </p>
          </div>

          {actionSig.value && !actionSig.value.success && (
            <div class="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              <AlertCircle class="h-4 w-4" />
              <span>{actionSig.value.message}</span>
            </div>
          )}

          {actionSig.value?.success && (
            <div class="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
              <CheckCircle2 class="h-4 w-4" />
              <span>{actionSig.value.message}</span>
              <meta
                http-equiv="refresh"
                content={`1;url=${actionSig.value.redirectUrl}`}
              />
            </div>
          )}

          <div class="flex items-center gap-3">
            <a
              href={`/profile/${loaderSig.value.userId}`}
              class="border-gray-850 hover:bg-gray-850 w-1/3 rounded-xl border bg-gray-900 py-3 text-center text-xs font-bold text-gray-400 transition-all duration-200"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={actionSig.isRunning}
              class="hover:bg-emerald-550 w-2/3 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/15 transition-all duration-200 active:scale-98 disabled:opacity-50"
            >
              {actionSig.isRunning ? 'Connecting...' : 'Link Account'}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
});
