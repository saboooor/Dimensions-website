import { component$, useSignal, $ } from "@builder.io/qwik";
import { routeLoader$, routeAction$, Form, zod$, z } from "@builder.io/qwik-city";
import { eq, and } from "drizzle-orm";
import { getDB, users, userPortals, cosmetics, badges, type User, type UserPortal } from "../../../lib/db";
import { getSessionUserId, getSessionUser, logoutUser } from "../../../lib/auth";

/**
 * Loader to fetch profile details, including ranks, badges, cosmetics access, and saved portals.
 */
export const useProfileLoader = routeLoader$(async (requestEvent) => {
  const visitId = requestEvent.params.id;
  if (!visitId) {
    throw requestEvent.redirect(302, "/");
  }

  const db = getDB(requestEvent);
  const loggedInId = getSessionUserId(requestEvent);
  const isSelf = loggedInId === visitId;

  // Fetch the user profile being visited
  const profileUser = await db.query.users.findFirst({
    where: eq(users.id, visitId),
  });

  if (!profileUser) {
    throw requestEvent.redirect(302, "/");
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
  } catch (e) {
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
    } catch (e) {
      // ignore
    }
    return { ...p, likesCount };
  });

  // Fetch cosmetics for cosmetics settings
  let availableCosmetics: any[] = [];
  let userPreferences = {
    postIgnitePortal: "NOTHING",
    postUsePortal: "NOTHING",
    postDestroyPortal: "NOTHING",
    onPortalTick: "NOTHING",
  };

  if (isSelf) {
    const allCosmetics = await db.query.cosmetics.findMany();
    // Filter cosmetics that the user has rank or username access to
    availableCosmetics = allCosmetics.filter((cos) => {
      try {
        const access = JSON.parse(cos.access) as string[];
        return access.includes(profileUser.rank) || access.includes(profileUser.username);
      } catch (e) {
        return false;
      }
    });

    try {
      userPreferences = JSON.parse(profileUser.ingameCosmetics);
    } catch (e) {
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
    const db = getDB(requestEvent);

    if (!avatarData.startsWith("data:image/")) {
      return { success: false, message: "Invalid image format." };
    }

    try {
      await db
        .update(users)
        .set({ profileImage: avatarData })
        .where(eq(users.id, userId))
        .run();
      return { success: true, message: "Successfully updated profile image." };
    } catch (err) {
      console.error(err);
      return { success: false, message: "Failed to update profile image." };
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
  const db = getDB(requestEvent);

  try {
    await db
      .update(users)
      .set({ profileImage: "" })
      .where(eq(users.id, userId))
      .run();
    return { success: true, message: "Successfully removed profile image." };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Failed to remove profile image." };
  }
});

/**
 * Action to update cosmetic preferences.
 */
export const useUpdateCosmeticsAction = routeAction$(
  async (formData, requestEvent) => {
    const { postIgnite, postDestroy, postUse, onTick } = formData;
    const userId = getSessionUserId(requestEvent);
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
        .where(eq(users.id, userId))
        .run();
      return { success: true, message: "Successfully updated in-game cosmetics." };
    } catch (err) {
      console.error(err);
      return { success: false, message: "Failed to update cosmetic settings." };
    }
  },
  zod$({
    postIgnite: z.string().default("NOTHING"),
    postDestroy: z.string().default("NOTHING"),
    postUse: z.string().default("NOTHING"),
    onTick: z.string().default("NOTHING"),
  })
);

/**
 * Action to change username.
 */
export const useChangeUsernameAction = routeAction$(
  async (formData, requestEvent) => {
    const { newUsername } = formData;
    const userId = getSessionUserId(requestEvent);
    if (!userId) return { success: false, message: "Not authenticated." };
    const db = getDB(requestEvent);

    const existing = await db.query.users.findFirst({
      where: eq(users.username, newUsername),
    });

    if (existing && existing.id !== userId) {
      return { success: false, message: "Username is already taken." };
    }

    try {
      await db
        .update(users)
        .set({ username: newUsername })
        .where(eq(users.id, userId))
        .run();
      return { success: true, message: "Username updated successfully." };
    } catch (err: any) {
      console.error(err);
      return { success: false, message: "Failed to update username." };
    }
  },
  zod$({
    newUsername: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  })
);

export default component$(() => {
  const profileLoader = useProfileLoader();

  const updateAvatar = useUpdateAvatarAction();
  const removeAvatar = useRemoveAvatarAction();
  const updateCosmetics = useUpdateCosmeticsAction();
  const changeUsername = useChangeUsernameAction();

  const activeTab = useSignal("overview");

  const pUser = profileLoader.value.profileUser;
  const isSelf = profileLoader.value.isSelf;
  const earnedBadges = profileLoader.value.userBadges;
  const portals = profileLoader.value.portals;
  const availableCosmetics = profileLoader.value.availableCosmetics;
  const currentCosmetics = profileLoader.value.userPreferences;

  // Handle client-side image file read to Base64
  const onAvatarFileChange = $(async (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("Image must be smaller than 1MB.");
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
        ? "border-gray-500 text-gray-500"
        : "border-transparent text-gray-400 hover:text-gray-200"
    }`;

  return (
    <div class="space-y-8 max-w-4xl mx-auto">
      {/* Profile Banner */}
      <div class="bg-gray-900/40 border border-gray-900 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 shadow-xl">
        <div class="relative group">
          <img
            src={pUser.profileImage || "/assets/img/guest.png"}
            alt="Profile Avatar"
            class="h-24 w-24 rounded-full border-2 border-gray-800 object-cover bg-gray-950"
          />
          {isSelf && (
            <div class="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <label for="avatarUpload" class="cursor-pointer text-white p-2">
                <i class="bi bi-camera text-xl"></i>
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

        <div class="text-center sm:text-left space-y-2 flex-1">
          <h1 class="text-2xl font-black text-gray-100">{pUser.username}</h1>
          <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span class="px-3 py-1 bg-gray-950 border border-gray-850 rounded-full text-xs font-semibold text-gray-400">
              Rank: {pUser.rank || "Member"}
            </span>
            {pUser.minecraftAccount && (
              <span class="px-3 py-1 bg-emerald-950/20 border border-emerald-900/30 rounded-full text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <i class="bi bi-controller"></i>
                <span>Linked Minecraft</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div class="border-b border-gray-900 flex overflow-x-auto gap-2 no-scrollbar">
        <button onClick$={() => (activeTab.value = "overview")} class={tabButtonClass("overview")}>
          Overview
        </button>
        {isSelf && (
          <>
            <button onClick$={() => (activeTab.value = "settings")} class={tabButtonClass("settings")}>
              Settings
            </button>
            <button onClick$={() => (activeTab.value = "links")} class={tabButtonClass("links")}>
              Linked Accounts
            </button>
          </>
        )}
        <button onClick$={() => (activeTab.value = "portals")} class={tabButtonClass("portals")}>
          Saved Portals ({portals.length})
        </button>
        {isSelf && (
          <button onClick$={() => (activeTab.value = "cosmetics")} class={tabButtonClass("cosmetics")}>
            In-Game Cosmetics
          </button>
        )}
      </div>

      {/* Tab content panel */}
      <div class="min-h-[200px]">
        {/* OVERVIEW TAB */}
        {activeTab.value === "overview" && (
          <div class="bg-gray-900/30 border border-gray-900 rounded-2xl p-6 space-y-6 animate-in fade-in duration-200">
            <div class="space-y-2">
              <h3 class="font-bold text-gray-200 text-sm uppercase tracking-wider text-gray-500">Badges</h3>
              <div class="flex flex-wrap gap-3">
                {earnedBadges.length > 0 ? (
                  earnedBadges.map((badge, idx) => (
                    <div
                      key={idx}
                      class="flex items-center gap-2 px-4 py-2 bg-gray-950 border border-gray-900 rounded-xl text-gray-300 shadow-sm hover:border-gray-800 transition-all"
                      title={badge.description}
                    >
                      <i class={`${badge.icon} text-gray-500 text-lg`}></i>
                      <div class="text-left">
                        <p class="text-xs font-bold text-gray-200">{badge.name}</p>
                        <p class="text-[10px] text-gray-500 leading-none mt-0.5">{badge.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p class="text-sm text-gray-500 italic">No badges earned yet...</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab.value === "settings" && isSelf && (
          <div class="space-y-6 animate-in fade-in duration-200">
            {/* Username Change */}
            <div class="bg-gray-900/30 border border-gray-900 rounded-2xl p-6 space-y-4">
              <h3 class="font-bold text-gray-200 flex items-center gap-2 pb-2 border-b border-gray-900">
                <i class="bi bi-person-badge text-gray-500"></i>
                <span>Change Username</span>
              </h3>
              {changeUsername.value && (
                <div
                  class={`p-3 rounded-lg border text-xs ${
                    changeUsername.value.success
                      ? "bg-emerald-950/40 border-emerald-900/50 text-emerald-400"
                      : "bg-red-950/40 border-red-900/50 text-red-400"
                  }`}
                >
                  {changeUsername.value.message}
                </div>
              )}
              <Form action={changeUsername} class="space-y-4 max-w-md">
                <div>
                  <label class="block text-xs text-gray-400 mb-1.5">New Username</label>
                  <input
                    type="text"
                    name="newUsername"
                    required
                    placeholder={pUser.username || ""}
                    class="block w-full px-3.5 py-2 bg-gray-950 border border-gray-850 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-gray-500"
                  />
                  <p class="text-[10px] text-gray-500 mt-1.5">3–32 characters, letters, numbers and underscores only.</p>
                </div>
                <button
                  type="submit"
                  class="bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                >
                  Update Username
                </button>
              </Form>
            </div>
          </div>
        )}

        {/* LINKED ACCOUNTS TAB */}
        {activeTab.value === "links" && isSelf && (
          <div class="bg-gray-900/30 border border-gray-900 rounded-2xl p-6 space-y-6 animate-in fade-in duration-200">
            <h2 class="font-bold text-gray-200 text-sm uppercase tracking-wider text-gray-500">Integrations</h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Discord — linked via Auth.js, cannot be unlinked */}
              <div class="p-4 bg-gray-950/30 border border-gray-900 rounded-xl flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <i class="ri-discord-fill text-2xl text-[#5865F2]"></i>
                  <div>
                    <p class="text-sm font-bold text-gray-200">Discord Account</p>
                    <p class="text-[10px] text-gray-500">
                      {pUser.discordAccount ? `Linked: ${pUser.discordAccount}` : "Not linked"}
                    </p>
                  </div>
                </div>
                <span class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-3 py-1.5 rounded-lg">
                  Active
                </span>
              </div>

              {/* Minecraft Link */}
              <div class="p-4 bg-gray-950/30 border border-gray-900 rounded-xl flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <i class="bi bi-controller text-2xl text-emerald-500"></i>
                  <div>
                    <p class="text-sm font-bold text-gray-200">Minecraft UUID</p>
                    <p class="text-[10px] text-gray-500">
                      {pUser.minecraftAccount ? `UUID: ${pUser.minecraftAccount}` : "Not linked"}
                    </p>
                  </div>
                </div>
                {pUser.minecraftAccount ? (
                  <a
                    href="/linkMinecraft?unlink=true"
                    class="bg-gray-900 border border-gray-850 text-red-400 hover:text-red-300 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
                  >
                    Unlink
                  </a>
                ) : (
                  <a
                    href="/linkMinecraft?getCode=true"
                    class="bg-emerald-600 hover:bg-emerald-550 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
                  >
                    Link Account
                  </a>
                )}
              </div>

              {/* PayPal Verification */}
              {pUser.verifiedPaypal === "" && (
                <div class="p-4 bg-gray-950/30 border border-gray-900 rounded-xl flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <i class="ri-paypal-fill text-2xl text-[#003087]"></i>
                    <div>
                      <p class="text-sm font-bold text-gray-200">PayPal Purchase</p>
                      <p class="text-[10px] text-gray-500">Verify your plugin purchase</p>
                    </div>
                  </div>
                  <a
                    href="/linkPaypal?getCode=true"
                    class="bg-[#0079C1] hover:bg-[#00457C] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
                  >
                    Verify purchase
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PORTALS TAB */}
        {activeTab.value === "portals" && (
          <div class="bg-gray-900/30 border border-gray-900 rounded-2xl p-6 animate-in fade-in duration-200">
            <h2 class="font-bold text-gray-200 text-sm uppercase tracking-wider text-gray-500 mb-4">Saved Portals</h2>
            {portals.length > 0 ? (
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {portals.map((portal, idx) => (
                  <div
                    key={idx}
                    class="bg-gray-950/40 border border-gray-900 rounded-xl p-4 flex flex-col justify-between hover:border-gray-800 transition-all group"
                  >
                    <div class="space-y-3">
                      {portal.img ? (
                        <div class="h-28 w-full bg-gray-950 rounded-lg overflow-hidden flex items-center justify-center border border-gray-900">
                          <img
                            src={portal.img}
                            alt="Portal Preview"
                            class="h-full w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div class="h-28 w-full bg-gray-900/50 rounded-lg flex items-center justify-center text-gray-600">
                          <i class="bi bi-image text-3xl"></i>
                        </div>
                      )}
                      <div>
                        <h4 class="font-bold text-sm text-gray-200 group-hover:text-white transition-colors">
                          {portal.portalID}
                        </h4>
                        <p class="text-[10px] text-gray-500 mt-0.5">
                          Likes: {portal.likesCount} • {portal.public === 1 ? "Public" : "Private"}
                        </p>
                      </div>
                    </div>

                    <a
                      href={`/editor/portal/?portal=${portal.id}`}
                      class="mt-4 w-full text-center bg-gray-900 hover:bg-gray-800 border border-gray-850 text-gray-300 text-[10px] font-bold py-1.5 rounded-lg transition-all"
                    >
                      Open in Editor
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p class="text-sm text-gray-500 italic">No saved portals found.</p>
            )}
          </div>
        )}

        {/* COSMETICS TAB */}
        {activeTab.value === "cosmetics" && isSelf && (
          <div class="bg-gray-900/30 border border-gray-900 rounded-2xl p-6 space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 class="font-bold text-gray-200 text-sm uppercase tracking-wider text-gray-500">In-game Cosmetics</h2>
              <p class="text-[10px] text-gray-500 mt-1">Configure the particle effects and cosmetics displayed when you interact with portals in-game.</p>
            </div>

            {pUser.minecraftAccount === "" ? (
              <p class="text-sm text-gray-500 italic flex items-center gap-2">
                <i class="bi bi-info-circle"></i>
                <span>You need to link your Minecraft account first to customize in-game cosmetics.</span>
              </p>
            ) : (
              <div>
                {updateCosmetics.value && (
                  <div class="mb-4 p-3 rounded-lg border border-emerald-900/50 bg-emerald-950/40 text-emerald-400 text-xs">
                    {updateCosmetics.value.message}
                  </div>
                )}
                
                <Form action={updateCosmetics} class="space-y-4 max-w-md">
                  <div>
                    <label class="block text-xs text-gray-400 mb-1.5">On Portal Ignite</label>
                    <select
                      name="postIgnite"
                      value={currentCosmetics.postIgnitePortal}
                      class="block w-full px-3.5 py-2 bg-gray-950 border border-gray-850 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-gray-500"
                    >
                      <option value="NOTHING">NOTHING</option>
                      {availableCosmetics
                        .filter((c) => JSON.parse(c.used).includes("ignite"))
                        .map((c, idx) => (
                          <option key={idx} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label class="block text-xs text-gray-400 mb-1.5">On Portal Destroy</label>
                    <select
                      name="postDestroy"
                      value={currentCosmetics.postDestroyPortal}
                      class="block w-full px-3.5 py-2 bg-gray-950 border border-gray-850 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-gray-500"
                    >
                      <option value="NOTHING">NOTHING</option>
                      {availableCosmetics
                        .filter((c) => JSON.parse(c.used).includes("destroy"))
                        .map((c, idx) => (
                          <option key={idx} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label class="block text-xs text-gray-400 mb-1.5">On Portal Use</label>
                    <select
                      name="postUse"
                      value={currentCosmetics.postUsePortal}
                      class="block w-full px-3.5 py-2 bg-gray-950 border border-gray-850 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-gray-500"
                    >
                      <option value="NOTHING">NOTHING</option>
                      {availableCosmetics
                        .filter((c) => JSON.parse(c.used).includes("use"))
                        .map((c, idx) => (
                          <option key={idx} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label class="block text-xs text-gray-400 mb-1.5">Portal effect</label>
                    <select
                      name="onTick"
                      value={currentCosmetics.onPortalTick}
                      class="block w-full px-3.5 py-2 bg-gray-950 border border-gray-850 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-gray-500"
                    >
                      <option value="NOTHING">NOTHING</option>
                      {availableCosmetics
                        .filter((c) => JSON.parse(c.used).includes("tick"))
                        .map((c, idx) => (
                          <option key={idx} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    class="bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
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
