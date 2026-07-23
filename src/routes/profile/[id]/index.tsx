import { component$, useSignal, $ } from '@qwik.dev/core';
import { routeLoader$, routeAction$, Form, zod$, z } from '@qwik.dev/router';
import { eq, and } from 'drizzle-orm';
import Camera from 'lucide-icons-qwik/icons/Camera';
import Gamepad2 from 'lucide-icons-qwik/icons/Gamepad2';
import IdCard from 'lucide-icons-qwik/icons/IdCard';
import Image from 'lucide-icons-qwik/icons/Image';
import Info from 'lucide-icons-qwik/icons/Info';
import SiDiscord from 'simple-icons-qwik/icons/SiDiscord';
import SiPaypal from 'simple-icons-qwik/icons/SiPaypal';
import { getDB, users, userPortals } from '../../../util/db';
import { getSessionUserId } from '../../../util/auth';

/**
 * Loader to fetch profile details, including ranks, badges, cosmetics access, and saved portals.
 */
export const useProfileLoader = routeLoader$(async (requestEvent) => {
  const visitId = requestEvent.params.id;
  if (!visitId) {
    throw requestEvent.redirect(302, '/');
  }

  const db = getDB(requestEvent);
  const loggedInId = getSessionUserId(requestEvent);
  const isSelf = loggedInId === visitId;

  // Fetch the user profile being visited
  const profileUser = await db.query.users.findFirst({
    where: eq(users.id, visitId),
  });

  if (!profileUser) {
    throw requestEvent.redirect(302, '/');
  }

  // Redirect to own profile if the ID belongs to the logged-in user
  if (loggedInId && loggedInId === profileUser.id && visitId !== loggedInId) {
    throw requestEvent.redirect(302, `/profile/${loggedInId}`);
  }

  // Fetch badges list
  const badgesList = await db.query.badges.findMany();
  const badgesMap = new Map(badgesList.map((b) => [b.id, b]));

  // Decode user's earned badges
  let userBadges: any[] = [];
  try {
    const earnedIds = JSON.parse(profileUser.badges) as number[];
    userBadges = earnedIds.map((id) => badgesMap.get(id)).filter(Boolean);
  } catch {
    // ignore
  }

  // Fetch user's portals
  // If self: show all. If other: show public only
  const portalsList = await db.query.userPortals.findMany({
    where: isSelf
      ? eq(userPortals.maker, visitId)
      : and(eq(userPortals.maker, visitId), eq(userPortals.public, 1)),
    orderBy: [userPortals.id],
  });

  // Parse likes count for portals
  const portalsWithLikes = portalsList.map((p) => {
    let likesCount = 0;
    try {
      likesCount = (JSON.parse(p.liked) as any[]).length;
    } catch {
      // ignore
    }
    return { ...p, likesCount };
  });

  // Fetch cosmetics for cosmetics settings
  let availableCosmetics: any[] = [];
  let userPreferences = {
    postIgnitePortal: 'NOTHING',
    postUsePortal: 'NOTHING',
    postDestroyPortal: 'NOTHING',
    onPortalTick: 'NOTHING',
  };

  if (isSelf) {
    const allCosmetics = await db.query.cosmetics.findMany();
    // Filter cosmetics that the user has rank or username access to
    availableCosmetics = allCosmetics.filter((cos) => {
      try {
        const access = JSON.parse(cos.access) as string[];
        return (
          access.includes(profileUser.rank) ||
          access.includes(profileUser.username || '')
        );
      } catch {
        return false;
      }
    });

    try {
      userPreferences = JSON.parse(profileUser.ingameCosmetics);
    } catch {
      // ignore
    }
  }

  return {
    profileUser: {
      id: profileUser.id,
      username: profileUser.username,
      rank: profileUser.rank,
      discordAccount: profileUser.discordAccount,
      minecraftAccount: profileUser.minecraftAccount,
      verifiedPaypal: profileUser.verifiedPaypal,
      profileImage: profileUser.profileImage,
    },
    isSelf,
    userBadges,
    portals: portalsWithLikes,
    availableCosmetics,
    userPreferences,
  };
});

/**
 * Action to update profile avatar image as Base64.
 */
export const useUpdateAvatarAction = routeAction$(
  async (formData, requestEvent) => {
    const { avatarData } = formData;
    const userId = getSessionUserId(requestEvent);
    if (!userId) return { success: false, message: 'Not authenticated.' };
    const db = getDB(requestEvent);

    if (!avatarData.startsWith('data:image/')) {
      return { success: false, message: 'Invalid image format.' };
    }

    try {
      await db
        .update(users)
        .set({ profileImage: avatarData })
        .where(eq(users.id, userId));
      return { success: true, message: 'Successfully updated profile image.' };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Failed to update profile image.' };
    }
  },
  zod$({
    avatarData: z.string().min(1),
  })
);

/**
 * Action to remove custom avatar (reverts to guest fallback).
 */
export const useRemoveAvatarAction = routeAction$(async (_, requestEvent) => {
  const userId = getSessionUserId(requestEvent);
  if (!userId) return { success: false, message: 'Not authenticated.' };
  const db = getDB(requestEvent);

  try {
    await db
      .update(users)
      .set({ profileImage: '' })
      .where(eq(users.id, userId));
    return { success: true, message: 'Successfully removed profile image.' };
  } catch (err) {
    console.error(err);
    return { success: false, message: 'Failed to remove profile image.' };
  }
});

/**
 * Action to update cosmetic preferences.
 */
export const useUpdateCosmeticsAction = routeAction$(
  async (formData, requestEvent) => {
    const { postIgnite, postDestroy, postUse, onTick } = formData;
    const userId = getSessionUserId(requestEvent);
    if (!userId) return { success: false, message: 'Not authenticated.' };
    const db = getDB(requestEvent);

    const newCosmetics = {
      postIgnitePortal: postIgnite,
      postUsePortal: postUse,
      postDestroyPortal: postDestroy,
      onPortalTick: onTick,
    };

    try {
      await db
        .update(users)
        .set({ ingameCosmetics: JSON.stringify(newCosmetics) })
        .where(eq(users.id, userId));
      return {
        success: true,
        message: 'Successfully updated in-game cosmetics.',
      };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Failed to update cosmetic settings.' };
    }
  },
  zod$({
    postIgnite: z.string().default('NOTHING'),
    postDestroy: z.string().default('NOTHING'),
    postUse: z.string().default('NOTHING'),
    onTick: z.string().default('NOTHING'),
  })
);

/**
 * Action to change username.
 */
export const useChangeUsernameAction = routeAction$(
  async (formData, requestEvent) => {
    const { newUsername } = formData;
    const userId = getSessionUserId(requestEvent);
    if (!userId) return { success: false, message: 'Not authenticated.' };
    const db = getDB(requestEvent);

    const existing = await db.query.users.findFirst({
      where: eq(users.username, newUsername),
    });

    if (existing && existing.id !== userId) {
      return { success: false, message: 'Username is already taken.' };
    }

    try {
      await db
        .update(users)
        .set({ username: newUsername })
        .where(eq(users.id, userId));
      return { success: true, message: 'Username updated successfully.' };
    } catch (err: any) {
      console.error(err);
      return { success: false, message: 'Failed to update username.' };
    }
  },
  zod$({
    newUsername: z
      .string()
      .min(3)
      .max(32)
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'Username can only contain letters, numbers, and underscores'
      ),
  })
);

export default component$(() => {
  const profileLoader = useProfileLoader();

  const updateAvatar = useUpdateAvatarAction();
  const _removeAvatar = useRemoveAvatarAction();
  const updateCosmetics = useUpdateCosmeticsAction();
  const changeUsername = useChangeUsernameAction();

  const activeTab = useSignal('overview');

  const pUser = profileLoader.value.profileUser;
  const isSelf = profileLoader.value.isSelf;
  const earnedBadges = profileLoader.value.userBadges;
  const portals = profileLoader.value.portals;
  const availableCosmetics = profileLoader.value.availableCosmetics;
  const currentCosmetics = profileLoader.value.userPreferences;

  // Handle client-side image file read to Base64
  const onAvatarFileChange = $((event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert('Image must be smaller than 1MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        await updateAvatar.submit({ avatarData: base64 });
      };
      reader.readAsDataURL(file);
    }
  });

  const tabButtonClass = (tab: string) =>
    `px-4 py-2 border-b-2 text-sm font-semibold whitespace-nowrap focus:outline-none transition-colors ${
      activeTab.value === tab
        ? 'border-gray-500 text-gray-500'
        : 'border-transparent text-gray-400 hover:text-gray-200'
    }`;

  return (
    <div class="mx-auto max-w-4xl space-y-8">
      {/* Profile Banner */}
      <div class="flex flex-col items-center gap-6 rounded-2xl border border-gray-900 bg-gray-900/40 p-6 shadow-xl sm:flex-row">
        <div class="group relative">
          <img
            src={pUser.profileImage || '/assets/img/guest.png'}
            alt="Profile Avatar"
            class="h-24 w-24 rounded-full border-2 border-gray-800 bg-gray-950 object-cover"
            width="96"
            height="96"
          />
          {isSelf && (
            <div class="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
              <label for="avatarUpload" class="cursor-pointer p-2 text-white">
                <Camera class="h-5 w-5" />
              </label>
              <input
                type="file"
                id="avatarUpload"
                accept="image/*"
                class="hidden"
                onChange$={onAvatarFileChange}
              />
            </div>
          )}
        </div>

        <div class="flex-1 space-y-2 text-center sm:text-left">
          <h1 class="text-2xl font-black text-gray-100">{pUser.username}</h1>
          <div class="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span class="border-gray-850 rounded-full border bg-gray-950 px-3 py-1 text-xs font-semibold text-gray-400">
              Rank: {pUser.rank || 'Member'}
            </span>
            {pUser.minecraftAccount && (
              <span class="flex items-center gap-1 rounded-full border border-emerald-900/30 bg-emerald-950/20 px-3 py-1 text-xs font-semibold text-emerald-400">
                <Gamepad2 class="h-4 w-4" />
                <span>Linked Minecraft</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div class="no-scrollbar flex gap-2 overflow-x-auto border-b border-gray-900">
        <button
          onClick$={() => (activeTab.value = 'overview')}
          class={tabButtonClass('overview')}
        >
          Overview
        </button>
        {isSelf && (
          <>
            <button
              onClick$={() => (activeTab.value = 'settings')}
              class={tabButtonClass('settings')}
            >
              Settings
            </button>
            <button
              onClick$={() => (activeTab.value = 'links')}
              class={tabButtonClass('links')}
            >
              Linked Accounts
            </button>
          </>
        )}
        <button
          onClick$={() => (activeTab.value = 'portals')}
          class={tabButtonClass('portals')}
        >
          Saved Portals ({portals.length})
        </button>
        {isSelf && (
          <button
            onClick$={() => (activeTab.value = 'cosmetics')}
            class={tabButtonClass('cosmetics')}
          >
            In-Game Cosmetics
          </button>
        )}
      </div>

      {/* Tab content panel */}
      <div class="min-h-[200px]">
        {/* OVERVIEW TAB */}
        {activeTab.value === 'overview' && (
          <div class="animate-in fade-in space-y-6 rounded-2xl border border-gray-900 bg-gray-900/30 p-6 duration-200">
            <div class="space-y-2">
              <h3 class="text-sm font-bold tracking-wider text-gray-200 text-gray-500 uppercase">
                Badges
              </h3>
              <div class="flex flex-wrap gap-3">
                {earnedBadges.length > 0 ? (
                  earnedBadges.map((badge: any, idx: number) => (
                    <div
                      key={idx}
                      class="flex items-center gap-2 rounded-xl border border-gray-900 bg-gray-950 px-4 py-2 text-gray-300 shadow-sm transition-all hover:border-gray-800"
                      title={badge.description}
                    >
                      <i class={`${badge.icon} text-lg text-gray-500`}></i>
                      <div class="text-left">
                        <p class="text-xs font-bold text-gray-200">
                          {badge.name}
                        </p>
                        <p class="mt-0.5 text-[10px] leading-none text-gray-500">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p class="text-sm text-gray-500 italic">
                    No badges earned yet...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab.value === 'settings' && isSelf && (
          <div class="animate-in fade-in space-y-6 duration-200">
            {/* Username Change */}
            <div class="space-y-4 rounded-2xl border border-gray-900 bg-gray-900/30 p-6">
              <h3 class="flex items-center gap-2 border-b border-gray-900 pb-2 font-bold text-gray-200">
                <IdCard class="h-4 w-4 text-gray-500" />
                <span>Change Username</span>
              </h3>
              {changeUsername.value && (
                <div
                  class={`rounded-lg border p-3 text-xs ${
                    changeUsername.value.success
                      ? 'border-emerald-900/50 bg-emerald-950/40 text-emerald-400'
                      : 'border-red-900/50 bg-red-950/40 text-red-400'
                  }`}
                >
                  {changeUsername.value.message}
                </div>
              )}
              <Form action={changeUsername} class="max-w-md space-y-4">
                <div>
                  <label class="mb-1.5 block text-xs text-gray-400">
                    New Username
                  </label>
                  <input
                    type="text"
                    name="newUsername"
                    required
                    placeholder={pUser.username || ''}
                    class="border-gray-850 block w-full rounded-lg border bg-gray-950 px-3.5 py-2 text-sm text-gray-200 focus:border-gray-500 focus:outline-none"
                  />
                  <p class="mt-1.5 text-[10px] text-gray-500">
                    3–32 characters, letters, numbers and underscores only.
                  </p>
                </div>
                <button
                  type="submit"
                  class="rounded-lg bg-gray-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-gray-500"
                >
                  Update Username
                </button>
              </Form>
            </div>
          </div>
        )}

        {/* LINKED ACCOUNTS TAB */}
        {activeTab.value === 'links' && isSelf && (
          <div class="animate-in fade-in space-y-6 rounded-2xl border border-gray-900 bg-gray-900/30 p-6 duration-200">
            <h2 class="text-sm font-bold tracking-wider text-gray-200 text-gray-500 uppercase">
              Integrations
            </h2>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Discord — linked via Auth.js, cannot be unlinked */}
              <div class="flex items-center justify-between rounded-xl border border-gray-900 bg-gray-950/30 p-4">
                <div class="flex items-center gap-3">
                  <SiDiscord class="h-6 w-6 text-[#5865F2]" />
                  <div>
                    <p class="text-sm font-bold text-gray-200">
                      Discord Account
                    </p>
                    <p class="text-[10px] text-gray-500">
                      {pUser.discordAccount
                        ? `Linked: ${pUser.discordAccount}`
                        : 'Not linked'}
                    </p>
                  </div>
                </div>
                <span class="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold text-emerald-400">
                  Active
                </span>
              </div>

              {/* Minecraft Link */}
              <div class="flex items-center justify-between rounded-xl border border-gray-900 bg-gray-950/30 p-4">
                <div class="flex items-center gap-3">
                  <Gamepad2 class="h-6 w-6 text-emerald-500" />
                  <div>
                    <p class="text-sm font-bold text-gray-200">
                      Minecraft UUID
                    </p>
                    <p class="text-[10px] text-gray-500">
                      {pUser.minecraftAccount
                        ? `UUID: ${pUser.minecraftAccount}`
                        : 'Not linked'}
                    </p>
                  </div>
                </div>
                {pUser.minecraftAccount ? (
                  <a
                    href="/linkMinecraft?unlink=true"
                    class="border-gray-850 rounded-lg border bg-gray-900 px-3 py-1.5 text-[10px] font-bold text-red-400 transition-all hover:text-red-300"
                  >
                    Unlink
                  </a>
                ) : (
                  <a
                    href="/linkMinecraft?getCode=true"
                    class="hover:bg-emerald-550 rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-bold text-white transition-all"
                  >
                    Link Account
                  </a>
                )}
              </div>

              {/* PayPal Verification */}
              {pUser.verifiedPaypal === '' && (
                <div class="flex items-center justify-between rounded-xl border border-gray-900 bg-gray-950/30 p-4">
                  <div class="flex items-center gap-3">
                    <SiPaypal class="h-6 w-6 text-[#003087]" />
                    <div>
                      <p class="text-sm font-bold text-gray-200">
                        PayPal Purchase
                      </p>
                      <p class="text-[10px] text-gray-500">
                        Verify your plugin purchase
                      </p>
                    </div>
                  </div>
                  <a
                    href="/linkPaypal?getCode=true"
                    class="rounded-lg bg-[#0079C1] px-3 py-1.5 text-[10px] font-bold text-white transition-all hover:bg-[#00457C]"
                  >
                    Verify purchase
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PORTALS TAB */}
        {activeTab.value === 'portals' && (
          <div class="animate-in fade-in rounded-2xl border border-gray-900 bg-gray-900/30 p-6 duration-200">
            <h2 class="mb-4 text-sm font-bold tracking-wider text-gray-200 text-gray-500 uppercase">
              Saved Portals
            </h2>
            {portals.length > 0 ? (
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {portals.map((portal, idx) => (
                  <div
                    key={idx}
                    class="group flex flex-col justify-between rounded-xl border border-gray-900 bg-gray-950/40 p-4 transition-all hover:border-gray-800"
                  >
                    <div class="space-y-3">
                      {portal.img ? (
                        <div class="flex h-28 w-full items-center justify-center overflow-hidden rounded-lg border border-gray-900 bg-gray-950">
                          <img
                            src={portal.img}
                            alt="Portal Preview"
                            class="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                            width="200"
                            height="112"
                          />
                        </div>
                      ) : (
                        <div class="flex h-28 w-full items-center justify-center rounded-lg bg-gray-900/50 text-gray-600">
                          <Image class="h-8 w-8 text-gray-600" />
                        </div>
                      )}
                      <div>
                        <h4 class="text-sm font-bold text-gray-200 transition-colors group-hover:text-white">
                          {portal.portalID}
                        </h4>
                        <p class="mt-0.5 text-[10px] text-gray-500">
                          Likes: {portal.likesCount} •{' '}
                          {portal.public === 1 ? 'Public' : 'Private'}
                        </p>
                      </div>
                    </div>

                    <a
                      href={`/editor/portal/?portal=${portal.id}`}
                      class="border-gray-850 mt-4 w-full rounded-lg border bg-gray-900 py-1.5 text-center text-[10px] font-bold text-gray-300 transition-all hover:bg-gray-800"
                    >
                      Open in Editor
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p class="text-sm text-gray-500 italic">
                No saved portals found.
              </p>
            )}
          </div>
        )}

        {/* COSMETICS TAB */}
        {activeTab.value === 'cosmetics' && isSelf && (
          <div class="animate-in fade-in space-y-6 rounded-2xl border border-gray-900 bg-gray-900/30 p-6 duration-200">
            <div>
              <h2 class="text-sm font-bold tracking-wider text-gray-200 text-gray-500 uppercase">
                In-game Cosmetics
              </h2>
              <p class="mt-1 text-[10px] text-gray-500">
                Configure the particle effects and cosmetics displayed when you
                interact with portals in-game.
              </p>
            </div>

            {pUser.minecraftAccount === '' ? (
              <p class="flex items-center gap-2 text-sm text-gray-500 italic">
                <Info class="h-4 w-4 text-gray-500" />
                <span>
                  You need to link your Minecraft account first to customize
                  in-game cosmetics.
                </span>
              </p>
            ) : (
              <div>
                {updateCosmetics.value && (
                  <div class="mb-4 rounded-lg border border-emerald-900/50 bg-emerald-950/40 p-3 text-xs text-emerald-400">
                    {updateCosmetics.value.message}
                  </div>
                )}

                <Form action={updateCosmetics} class="max-w-md space-y-4">
                  <div>
                    <label class="mb-1.5 block text-xs text-gray-400">
                      On Portal Ignite
                    </label>
                    <select
                      name="postIgnite"
                      value={currentCosmetics.postIgnitePortal}
                      class="border-gray-850 block w-full rounded-lg border bg-gray-950 px-3.5 py-2 text-sm text-gray-300 focus:border-gray-500 focus:outline-none"
                    >
                      <option value="NOTHING">NOTHING</option>
                      {availableCosmetics
                        .filter((c: any) =>
                          JSON.parse(c.used).includes('ignite')
                        )
                        .map((c: any, idx: number) => (
                          <option key={idx} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label class="mb-1.5 block text-xs text-gray-400">
                      On Portal Destroy
                    </label>
                    <select
                      name="postDestroy"
                      value={currentCosmetics.postDestroyPortal}
                      class="border-gray-850 block w-full rounded-lg border bg-gray-950 px-3.5 py-2 text-sm text-gray-300 focus:border-gray-500 focus:outline-none"
                    >
                      <option value="NOTHING">NOTHING</option>
                      {availableCosmetics
                        .filter((c: any) =>
                          JSON.parse(c.used).includes('destroy')
                        )
                        .map((c: any, idx: number) => (
                          <option key={idx} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label class="mb-1.5 block text-xs text-gray-400">
                      On Portal Use
                    </label>
                    <select
                      name="postUse"
                      value={currentCosmetics.postUsePortal}
                      class="border-gray-850 block w-full rounded-lg border bg-gray-950 px-3.5 py-2 text-sm text-gray-300 focus:border-gray-500 focus:outline-none"
                    >
                      <option value="NOTHING">NOTHING</option>
                      {availableCosmetics
                        .filter((c: any) => JSON.parse(c.used).includes('use'))
                        .map((c: any, idx: number) => (
                          <option key={idx} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label class="mb-1.5 block text-xs text-gray-400">
                      Portal effect
                    </label>
                    <select
                      name="onTick"
                      value={currentCosmetics.onPortalTick}
                      class="border-gray-850 block w-full rounded-lg border bg-gray-950 px-3.5 py-2 text-sm text-gray-300 focus:border-gray-500 focus:outline-none"
                    >
                      <option value="NOTHING">NOTHING</option>
                      {availableCosmetics
                        .filter((c: any) => JSON.parse(c.used).includes('tick'))
                        .map((c: any, idx: number) => (
                          <option key={idx} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    class="rounded-lg bg-gray-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-gray-500"
                  >
                    Save Preferences
                  </button>
                </Form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
