import { component$ } from '@qwik.dev/core';
import { routeLoader$, routeAction$, zod$, z } from '@qwik.dev/router';
import { eq } from 'drizzle-orm';
import { getDB, users, userPortals } from '../../util/db';
import { Session } from '@auth/qwik';
import { ProfileView } from '~/components/ProfileView';

/**
 * Loader to fetch logged-in user profile details, including ranks, badges, cosmetics access, and saved portals.
 */
export const useProfileLoader = routeLoader$(async (requestEvent) => {
  const session = requestEvent.sharedMap.get('session') as Session;
  const userId = session?.user?.id;
  if (!userId) {
    throw requestEvent.redirect(302, '/login');
  }

  const db = getDB();

  // Fetch the logged-in user profile
  const profileUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!profileUser) {
    throw requestEvent.redirect(302, '/login');
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

  // Fetch user's portals (all portals for self)
  const portalsList = await db.query.userPortals.findMany({
    where: eq(userPortals.maker, userId),
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
  const allCosmetics = await db.query.cosmetics.findMany();
  const availableCosmetics = allCosmetics.filter((cos) => {
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

  let userPreferences = {
    postIgnitePortal: 'NOTHING',
    postUsePortal: 'NOTHING',
    postDestroyPortal: 'NOTHING',
    onPortalTick: 'NOTHING',
  };

  try {
    userPreferences = JSON.parse(profileUser.ingameCosmetics);
  } catch {
    // ignore
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
    isSelf: true,
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
    const session = requestEvent.sharedMap.get('session') as Session;
    const userId = session?.user?.id;
    if (!userId) return { success: false, message: 'Not authenticated.' };
    const db = getDB();

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
  const session = requestEvent.sharedMap.get('session') as Session;
  const userId = session?.user?.id;
  if (!userId) return { success: false, message: 'Not authenticated.' };
  const db = getDB();

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
    const session = requestEvent.sharedMap.get('session') as Session;
    const userId = session?.user?.id;
    if (!userId) return { success: false, message: 'Not authenticated.' };
    const db = getDB();

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
    const session = requestEvent.sharedMap.get('session') as Session;
    const userId = session?.user?.id;
    if (!userId) return { success: false, message: 'Not authenticated.' };
    const db = getDB();

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
    } catch (err) {
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
  const removeAvatar = useRemoveAvatarAction();
  const updateCosmetics = useUpdateCosmeticsAction();
  const changeUsername = useChangeUsernameAction();

  const data = profileLoader.value;

  return (
    <ProfileView
      profileUser={data.profileUser}
      isSelf={data.isSelf}
      earnedBadges={data.userBadges}
      portals={data.portals}
      availableCosmetics={data.availableCosmetics}
      currentCosmetics={data.userPreferences}
      updateAvatarAction={updateAvatar}
      removeAvatarAction={removeAvatar}
      updateCosmeticsAction={updateCosmetics}
      changeUsernameAction={changeUsername}
    />
  );
});
