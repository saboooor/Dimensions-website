import { component$ } from '@qwik.dev/core';
import {
  routeAction$,
  routeLoader$,
  Form,
  zod$,
  z,
  type DocumentHead,
} from '@qwik.dev/router';
import { eq, and, notLike, desc } from 'drizzle-orm';
import Coins from 'lucide-icons-qwik/icons/Coins';
import Ticket from 'lucide-icons-qwik/icons/Ticket';
import Gift from 'lucide-icons-qwik/icons/Gift';
import Tv from 'lucide-icons-qwik/icons/Tv';
import CalendarCheck from 'lucide-icons-qwik/icons/CalendarCheck';
import ShoppingBag from 'lucide-icons-qwik/icons/ShoppingBag';
import History from 'lucide-icons-qwik/icons/History';
import {
  getDB,
  users,
  subscriptionCoupons,
  claimRewards,
  claimRequests,
} from '../../util/db';
import { getSessionUserId } from '../../util/auth';

/**
 * Loader to fetch points data, available rewards, and user's claim history.
 */
export const usePointsLoader = routeLoader$(async (requestEvent) => {
  const userId = getSessionUserId(requestEvent);
  if (!userId) {
    throw requestEvent.redirect(302, '/login');
  }

  const db = getDB(requestEvent);

  // Fetch current user details
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
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
    where: eq(claimRequests.user, userId),
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
    const userId = getSessionUserId(requestEvent);
    if (!userId) return { success: false, message: 'Not logged in.' };
    const db = getDB(requestEvent);

    // Find valid coupon where isSubscription = 0 (points coupon)
    // and this user hasn't claimed it yet
    const coupon = await db.query.subscriptionCoupons.findFirst({
      where: and(
        eq(subscriptionCoupons.coupon, code),
        eq(subscriptionCoupons.isSubscription, 0),
        notLike(subscriptionCoupons.usedBy, `%!${userId}!%`)
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
      const newUsedBy = coupon.usedBy + `!${userId}!`;

      await db
        .update(subscriptionCoupons)
        .set({ uses: newUses, usedBy: newUsedBy })
        .where(eq(subscriptionCoupons.id, coupon.id));

      // Add points to user
      const pointsToAdd = parseInt(coupon.period, 10) || 0;
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
      if (user) {
        await db
          .update(users)
          .set({ points: user.points + pointsToAdd })
          .where(eq(users.id, userId));
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
  const userId = getSessionUserId(requestEvent);
  if (!userId) return { success: false, message: 'Not logged in.' };
  const db = getDB(requestEvent);

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
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
      .where(eq(users.id, userId));

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
  const userId = getSessionUserId(requestEvent);
  if (!userId) return { success: false, message: 'Not logged in.' };
  const db = getDB(requestEvent);

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
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
      .where(eq(users.id, userId));

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
    const userId = getSessionUserId(requestEvent);
    if (!userId) return { success: false, message: 'Not logged in.' };
    const db = getDB(requestEvent);

    const reward = await db.query.claimRewards.findFirst({
      where: eq(claimRewards.code, rewardCode),
    });

    if (!reward) {
      return { success: false, message: 'Invalid reward.' };
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
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
        user: userId,
        type: reward.name,
        status: statusDescription,
        input: input || '',
      });

      // Deduct points
      await db
        .update(users)
        .set({ points: user.points - reward.price })
        .where(eq(users.id, userId));

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
    <div class="mx-auto max-w-5xl space-y-8">
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
        {/* Redeem Code */}
        <div class="h-fit space-y-4 rounded-2xl border border-gray-900 bg-gray-900/40 p-6 shadow-lg md:col-span-1">
          <h2 class="flex items-center gap-2 border-b border-gray-800/50 pb-2.5 font-bold text-gray-200">
            <Ticket class="h-5 w-5 text-gray-500" />
            <span>Redeem Code</span>
          </h2>

          {redeemSig.value && (
            <div
              class={`rounded-lg border p-3 text-xs ${
                redeemSig.value.success
                  ? 'border-emerald-900/50 bg-emerald-950/40 text-emerald-400'
                  : 'border-red-900/50 bg-red-950/40 text-red-400'
              }`}
            >
              {redeemSig.value.message}
            </div>
          )}

          <Form action={redeemSig} class="space-y-3">
            <input
              type="text"
              name="code"
              required
              placeholder="Enter promo code..."
              class="block w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-gray-200 placeholder-gray-700 transition-all focus:border-gray-500 focus:ring-2 focus:ring-gray-500/25 focus:outline-none"
            />
            <button
              type="submit"
              disabled={redeemSig.isRunning}
              class="w-full rounded-lg bg-gray-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-gray-500 disabled:bg-gray-800"
            >
              {redeemSig.isRunning ? 'Claiming...' : 'Claim Points'}
            </button>
          </Form>
        </div>

        {/* Earn Points / Daily Ads */}
        <div class="space-y-4 rounded-2xl border border-gray-900 bg-gray-900/40 p-6 shadow-lg md:col-span-2">
          <h2 class="flex items-center gap-2 border-b border-gray-800/50 pb-2.5 font-bold text-gray-200">
            <Gift class="h-5 w-5 text-emerald-500" />
            <span>Earn Points</span>
          </h2>

          {(toggleAdsSig.value || claimAdsSig.value) && (
            <div
              class={`rounded-lg border p-3 text-xs ${
                toggleAdsSig.value?.success || claimAdsSig.value?.success
                  ? 'border-emerald-900/50 bg-emerald-950/40 text-emerald-400'
                  : 'border-red-900/50 bg-red-950/40 text-red-400'
              }`}
            >
              {toggleAdsSig.value?.message || claimAdsSig.value?.message}
            </div>
          )}

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="flex flex-col justify-between space-y-2 rounded-xl border border-gray-900 bg-gray-950/40 p-4">
              <div>
                <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-300">
                  <Tv class="h-4 w-4 text-gray-500" />
                  <span>Rewarded Ads</span>
                </h3>
                <p class="mt-1 text-[10px] leading-relaxed text-gray-500">
                  Support the community by enabling ads while browsing. In
                  exchange, claim 50 points every 24 hours.
                </p>
              </div>

              <div class="flex items-center justify-between pt-3">
                <span class="text-xs font-medium text-gray-400">
                  Ads status:{' '}
                  <span
                    class={
                      user.enabledAds === 1
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }
                  >
                    {user.enabledAds === 1 ? 'Enabled' : 'Disabled'}
                  </span>
                </span>
                <Form action={toggleAdsSig}>
                  <button
                    type="submit"
                    class="border-gray-850 rounded-md border bg-gray-900 px-3 py-1.5 text-[10px] font-bold text-gray-300 transition-all hover:bg-gray-800"
                  >
                    {user.enabledAds === 1 ? 'Disable Ads' : 'Enable Ads'}
                  </button>
                </Form>
              </div>
            </div>

            <div class="flex flex-col justify-between space-y-2 rounded-xl border border-gray-900 bg-gray-950/40 p-4">
              <div>
                <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-300">
                  <CalendarCheck class="h-4 w-4 text-emerald-500" />
                  <span>Daily Ad Claim</span>
                </h3>
                <p class="mt-1 text-[10px] leading-relaxed text-gray-500">
                  Claim your free daily points. Make sure ads are enabled to
                  activate this reward.
                </p>
              </div>

              <Form action={claimAdsSig} class="pt-3">
                <button
                  type="submit"
                  disabled={
                    user.enabledAds === 0 ||
                    hasClaimedToday ||
                    claimAdsSig.isRunning
                  }
                  class="w-full rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-500"
                >
                  {hasClaimedToday
                    ? 'Already Claimed Today'
                    : 'Claim 50 Points'}
                </button>
              </Form>
            </div>
          </div>
        </div>
      </div>

      {/* Rewards Catalog */}
      <section class="space-y-4">
        <h2 class="flex items-center gap-2 border-b border-gray-900 pb-2.5 text-lg font-bold text-gray-200">
          <ShoppingBag class="h-5 w-5 text-gray-300" />
          <span>Use Points / Claim Rewards</span>
        </h2>

        {claimRewardSig.value && (
          <div
            class={`rounded-lg border p-4 text-sm ${
              claimRewardSig.value.success
                ? 'border-emerald-900/50 bg-emerald-950/40 text-emerald-400'
                : 'border-red-900/50 bg-red-950/40 text-red-400'
            }`}
          >
            {claimRewardSig.value.message}
          </div>
        )}

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          {rewards.map((reward, idx) => (
            <div
              key={idx}
              class="flex flex-col justify-between space-y-4 rounded-2xl border border-gray-900 bg-gray-900/30 p-6 shadow-md"
            >
              <div class="space-y-1">
                <div class="flex items-start justify-between">
                  <h3 class="font-bold text-gray-100">{reward.name}</h3>
                  <span class="border-gray-850 rounded-full border bg-gray-950 px-2.5 py-1 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                    {reward.type}
                  </span>
                </div>
                <p class="text-sm font-semibold text-gray-300">
                  {reward.price.toLocaleString()} points
                </p>
                <p class="pt-1.5 text-xs leading-relaxed text-gray-500">
                  {reward.requiresReview === 0
                    ? 'Generates an automatic promo code instantly upon purchase.'
                    : 'Requires administrative review before completion.'}
                </p>
              </div>

              <Form action={claimRewardSig} class="space-y-3">
                <input type="hidden" name="rewardCode" value={reward.code} />

                {reward.inputPrompt && (
                  <input
                    type="text"
                    name="input"
                    required
                    placeholder={reward.inputPrompt}
                    class="block w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 transition-all focus:border-gray-500 focus:ring-2 focus:ring-gray-500/25 focus:outline-none"
                  />
                )}

                <button
                  type="submit"
                  disabled={
                    user.points < reward.price || claimRewardSig.isRunning
                  }
                  class="w-full rounded-lg bg-gray-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-gray-500 disabled:bg-gray-800 disabled:text-gray-500"
                >
                  Claim Reward
                </button>
              </Form>
            </div>
          ))}
        </div>
      </section>

      {/* History */}
      {history.length > 0 && (
        <section class="space-y-4">
          <h2 class="flex items-center gap-2 border-b border-gray-900 pb-2.5 text-lg font-bold text-gray-200">
            <History class="h-5 w-5 text-gray-400" />
            <span>Your Claim History</span>
          </h2>

          <div class="overflow-hidden rounded-2xl border border-gray-900 bg-gray-900/30">
            <div class="overflow-x-auto">
              <table class="w-full border-collapse text-left">
                <thead>
                  <tr class="border-b border-gray-900 bg-gray-950/40 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                    <th class="px-6 py-3">Reward Type</th>
                    <th class="px-6 py-3">Input Info</th>
                    <th class="px-6 py-3">Status / Code</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-900 text-sm text-gray-300">
                  {history.map((req, idx) => (
                    <tr
                      key={idx}
                      class="transition-colors hover:bg-gray-900/10"
                    >
                      <td class="px-6 py-4 font-semibold">{req.type}</td>
                      <td class="max-w-xs truncate px-6 py-4 font-mono text-xs text-gray-500">
                        {req.input || '-'}
                      </td>
                      <td class="px-6 py-4">
                        <span
                          class={`inline-block rounded-lg px-3 py-1 text-xs font-medium ${
                            req.status.startsWith('Coupon:')
                              ? 'border border-emerald-900/40 bg-emerald-950/30 font-mono text-emerald-400 select-all'
                              : 'border border-gray-900/40 bg-gray-950/30 text-gray-200'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
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
