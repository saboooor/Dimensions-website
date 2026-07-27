import { component$ } from '@qwik.dev/core';
import {
  routeAction$,
  routeLoader$,
  zod$,
  z,
  type DocumentHead,
} from '@qwik.dev/router';
import { eq, and, notLike, desc } from 'drizzle-orm';
import Coins from 'lucide-icons-qwik/icons/Coins';
import {
  getDB,
  users,
  subscriptionCoupons,
  claimRewards,
  claimRequests,
} from '../../util/db';
import { Session } from '@auth/qwik';

/**
 * Loader to fetch points data, available rewards, and user's claim history.
 */
export const usePointsLoader = routeLoader$(async (requestEvent) => {
  const session = requestEvent.sharedMap.get('session') as Session;
  if (!session.user?.id) {
    throw requestEvent.redirect(302, '/login');
  }

  const db = getDB();

  // Fetch current user details
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user?.id),
  });

  if (!user) {
    throw requestEvent.redirect(302, '/logout');
  }

  // Fetch all claimable rewards
  const rewards = await db.query.claimRewards.findMany({
    orderBy: [desc(claimRewards.type)],
  });

  // Fetch user's claim requests history
  const history = await db.query.claimRequests.findMany({
    where: eq(claimRequests.user, session.user?.id),
    orderBy: [desc(claimRequests.id)],
  });

  return { user, rewards, history };
});

/**
 * Action to redeem points promo codes.
 */
export const useRedeemCodeAction = routeAction$(
  async (formData, requestEvent) => {
    const { code } = formData;
    const session = requestEvent.sharedMap.get('session') as Session;
    if (!session.user?.id) return { success: false, message: 'Not logged in.' };
    const db = getDB();

    // Find valid coupon where isSubscription = 0 (points coupon)
    // and this user hasn't claimed it yet
    const coupon = await db.query.subscriptionCoupons.findFirst({
      where: and(
        eq(subscriptionCoupons.coupon, code),
        eq(subscriptionCoupons.isSubscription, 0),
        notLike(subscriptionCoupons.usedBy, `%!${session.user?.id}!%`)
      ),
    });

    if (!coupon) {
      return {
        success: false,
        message: 'Invalid, expired, or already used code.',
      };
    }

    // Check expiration
    if (
      coupon.valid !== '0000-00-00' &&
      new Date(coupon.valid).getTime() < Date.now()
    ) {
      return {
        success: false,
        message: 'This promo code has expired.',
      };
    }

    // Check uses remaining
    if (coupon.uses === 0) {
      return {
        success: false,
        message: 'This promo code has reached its maximum uses.',
      };
    }

    try {
      // Update coupon: decrement uses and append user to usedBy
      const newUses = coupon.uses === -1 ? -1 : Math.max(0, coupon.uses - 1);
      const newUsedBy = coupon.usedBy + `!${session.user?.id}!`;

      await db
        .update(subscriptionCoupons)
        .set({ uses: newUses, usedBy: newUsedBy })
        .where(eq(subscriptionCoupons.id, coupon.id));

      // Add points to user
      const pointsToAdd = parseInt(coupon.period, 10) || 0;
      const user = await db.query.users.findFirst({
        where: eq(users.id, session.user?.id),
      });
      if (user) {
        await db
          .update(users)
          .set({ points: user.points + pointsToAdd })
          .where(eq(users.id, session.user?.id));
      }

      return {
        success: true,
        message: `Successfully claimed ${pointsToAdd.toLocaleString()} points!`,
      };
    } catch (err) {
      console.error('Redeem coupon error:', err);
      return {
        success: false,
        message: 'Failed to redeem code. Please try again later.',
      };
    }
  },
  zod$({
    code: z.string().min(1, 'Enter a valid code'),
  })
);

/**
 * Action to toggle rewarded ads on/off.
 */
export const useToggleAdsAction = routeAction$(async (_, requestEvent) => {
  const session = requestEvent.sharedMap.get('session') as Session;
  if (!session.user?.id) return { success: false, message: 'Not logged in.' };
  const db = getDB();

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user?.id),
  });
  if (!user) return { success: false, message: 'User not found' };

  const newEnabledAds = user.enabledAds === 1 ? 0 : 1;
  let disabledAdsCount = user.disabledAds;
  let newPoints = user.points;
  let chargeStr = '';

  if (newEnabledAds === 0) {
    // Disabling ads - increment count and apply penalty if disabled >= 3 times
    disabledAdsCount += 1;
    if (disabledAdsCount >= 3) {
      const penalty = (disabledAdsCount - 2) * 50;
      newPoints = Math.max(0, newPoints - penalty);
      chargeStr = ` charged ${penalty} points.`;
    }
  }

  try {
    await db
      .update(users)
      .set({
        enabledAds: newEnabledAds,
        disabledAds: disabledAdsCount,
        points: newPoints,
      })
      .where(eq(users.id, session.user?.id));

    return {
      success: true,
      message: `Ads have been ${newEnabledAds === 1 ? 'enabled' : 'disabled'}.${chargeStr}`,
    };
  } catch (err) {
    console.error('Toggle ads error:', err);
    return { success: false, message: 'Failed to update ad settings.' };
  }
});

/**
 * Action to claim daily rewarded ad points.
 */
export const useClaimDailyAdsAction = routeAction$(async (_, requestEvent) => {
  const session = requestEvent.sharedMap.get('session') as Session;
  if (!session.user?.id) return { success: false, message: 'Not logged in.' };
  const db = getDB();

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user?.id),
  });
  if (!user) return { success: false, message: 'User not found' };

  if (user.enabledAds === 0) {
    return {
      success: false,
      message: 'You must enable ads to claim daily points.',
    };
  }

  // Check if 24 hours have passed since last claim
  const todayStr = new Date().toISOString().split('T')[0];
  if (user.lastAdClaim === todayStr) {
    return { success: false, message: 'Already claimed points for today.' };
  }

  try {
    await db
      .update(users)
      .set({
        points: user.points + 50,
        lastAdClaim: todayStr,
      })
      .where(eq(users.id, session.user?.id));

    return {
      success: true,
      message: 'Claimed 50 points for today!',
    };
  } catch (err) {
    console.error('Claim ad points error:', err);
    return { success: false, message: 'Failed to claim points.' };
  }
});

/**
 * Action to claim a reward using points.
 */
export const useClaimRewardAction = routeAction$(
  async (formData, requestEvent) => {
    const { rewardCode, input } = formData;
    const session = requestEvent.sharedMap.get('session') as Session;
    if (!session.user?.id) return { success: false, message: 'Not logged in.' };
    const db = getDB();

    const reward = await db.query.claimRewards.findFirst({
      where: eq(claimRewards.code, rewardCode),
    });

    if (!reward) {
      return { success: false, message: 'Invalid reward.' };
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user?.id),
    });
    if (!user) return { success: false, message: 'User not found.' };

    if (user.points < reward.price) {
      return {
        success: false,
        message: 'Not enough points to claim this reward.',
      };
    }

    if (reward.inputPrompt && !input) {
      return { success: false, message: 'Required input fields are missing.' };
    }

    let statusDescription = 'Pending Completion';

    try {
      if (reward.requiresReview === 0) {
        // Generate an automatic coupon code starting with "R-"
        const randomPart = Math.random()
          .toString(36)
          .substring(2, 10)
          .toUpperCase();
        const couponCode = `R-${randomPart}`;

        // Insert the subscription coupon into Drizzle (reward.name suffix determines period)
        // e.g. "Dimensions Premium Extension" -> "Premium"
        const subPeriod = reward.name.includes('1 Month')
          ? '30 days'
          : '7 days';

        await db.insert(subscriptionCoupons).values({
          isSubscription: 1, // subscription coupon
          coupon: couponCode,
          period: subPeriod,
          uses: 1,
          valid: '0000-00-00',
          usedBy: '',
        });

        statusDescription = `Coupon: ${couponCode}`;
      }

      // Insert claim request
      await db.insert(claimRequests).values({
        user: session.user?.id,
        type: reward.name,
        status: statusDescription,
        input: input || '',
      });

      // Deduct points
      await db
        .update(users)
        .set({ points: user.points - reward.price })
        .where(eq(users.id, session.user?.id));

      return {
        success: true,
        message: `Successfully claimed: ${reward.name}! ${
          reward.requiresReview === 0
            ? 'Your coupon has been generated below.'
            : 'Request is pending administrator review.'
        }`,
      };
    } catch (err) {
      console.error('Claim reward error:', err);
      return {
        success: false,
        message: 'Something went wrong while claiming reward.',
      };
    }
  },
  zod$({
    rewardCode: z.string().min(1),
    input: z.string().optional(),
  })
);

import { RedeemCodeCard } from './components/RedeemCodeCard';
import { EarnPointsCard } from './components/EarnPointsCard';
import { RewardsCatalog } from './components/RewardsCatalog';
import { ClaimHistoryTable } from './components/ClaimHistoryTable';

export default component$(() => {
  const loaderSig = usePointsLoader();
  const redeemSig = useRedeemCodeAction();
  const toggleAdsSig = useToggleAdsAction();
  const claimAdsSig = useClaimDailyAdsAction();
  const claimRewardSig = useClaimRewardAction();

  const user = loaderSig.value.user;
  const rewards = loaderSig.value.rewards;
  const history = loaderSig.value.history;

  const todayStr = new Date().toISOString().split('T')[0];
  const hasClaimedToday = user.lastAdClaim === todayStr;

  return (
    <section
      class="relative flex min-h-svh flex-col overflow-hidden p-6 pt-20"
      style={{
        '--lum-border-radius': '1.5rem',
      }}
    >
      <div class="mx-auto w-full max-w-5xl space-y-8">
        {/* Page Title */}
        <div class="flex items-center justify-between">
          <div>
            <h1 class="flex items-center gap-2 text-2xl font-bold text-gray-100">
              <Coins class="h-6 w-6 text-gray-300" />
              <span>Points Dashboard</span>
            </h1>
            <p class="text-xs text-gray-500">
              Redeem codes, view rewarded ads, and spend your points on perks
            </p>
          </div>
          <div class="rounded-2xl border border-gray-800 bg-gray-900 px-5 py-2.5 text-right">
            <p class="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
              Your Balance
            </p>
            <p class="text-2xl font-black text-gray-300">
              {Number(user.points).toLocaleString()}{' '}
              <span class="text-xs font-semibold">pts</span>
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
          <RedeemCodeCard redeemSig={redeemSig} />
          <EarnPointsCard
            enabledAds={user.enabledAds}
            hasClaimedToday={hasClaimedToday}
            toggleAdsSig={toggleAdsSig}
            claimAdsSig={claimAdsSig}
          />
        </div>

        <RewardsCatalog
          rewards={rewards}
          userPoints={user.points}
          claimRewardSig={claimRewardSig}
        />

        <ClaimHistoryTable history={history} />
      </div>
    </section>
  );
});

export const head: DocumentHead = {
  title: 'Dimensions - Points & Rewards',
  meta: [
    {
      name: 'description',
      content:
        'Redeem codes, view rewarded ads to earn points, and claim premium in-game cosmetic rewards or subscription extensions.',
    },
  ],
};
