import { component$ } from '@qwik.dev/core';
import { routeAction$, routeLoader$, Form, zod$, z } from '@qwik.dev/router';
import ShieldCheck from 'lucide-icons-qwik/icons/ShieldCheck';
import Ticket from 'lucide-icons-qwik/icons/Ticket';
import CheckCircle2 from 'lucide-icons-qwik/icons/CheckCircle2';
import AlertTriangle from 'lucide-icons-qwik/icons/AlertTriangle';
import { getDB, subscriptionCoupons } from '../../util/db';
import { getSessionUser, isAdmin } from '../../util/auth';

/**
 * Loader to enforce administrative access only.
 */
export const useAdminLoader = routeLoader$(async (requestEvent) => {
  const user = await getSessionUser(requestEvent);
  if (!user || !isAdmin(user)) {
    throw requestEvent.redirect(302, '/');
  }
  return { user };
});

/**
 * Action to handle coupon generation.
 */
export const useGenerateCouponAction = routeAction$(
  async (formData, requestEvent) => {
    const { prefix, isSubscription, reward, maxUses, expireDate } = formData;
    const db = getDB(requestEvent);

    // Generate a secure unique coupon code (matches the core original algorithm base-36 format)
    const randomPart = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();
    const couponCode = `${prefix}${randomPart}`;

    try {
      // Insert coupon into Drizzle database
      await db.insert(subscriptionCoupons).values({
        isSubscription: isSubscription ? 1 : 0,
        coupon: couponCode,
        period: reward,
        uses: maxUses,
        valid: expireDate || '0000-00-00',
        usedBy: '',
      });

      return {
        success: true,
        message: `Successfully generated coupon: ${couponCode}`,
        coupon: couponCode,
      };
    } catch (err) {
      console.error('Error generating coupon:', err);
      return {
        success: false,
        message:
          'Failed to generate coupon. Please check that the code is unique.',
      };
    }
  },
  zod$({
    prefix: z
      .string()
      .min(1, 'Prefix is required')
      .max(10, 'Prefix is too long'),
    isSubscription: z.boolean().default(false),
    reward: z.string().min(1, 'Reward (value/period) is required'),
    maxUses: z.coerce.number().default(-1),
    expireDate: z.string().default('0000-00-00'),
  })
);

export default component$(() => {
  const _adminLoaderSig = useAdminLoader();
  const actionSig = useGenerateCouponAction();

  return (
    <div class="mx-auto max-w-2xl space-y-8">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-500/30 bg-gray-600/15 text-gray-500">
          <ShieldCheck class="h-5 w-5" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-100">Admin Panel</h1>
          <p class="text-xs text-gray-500">
            Manage promo codes, rewards, and system configurations
          </p>
        </div>
      </div>

      <div class="space-y-6 rounded-2xl border border-gray-900 bg-gray-900/40 p-6 shadow-xl md:p-8">
        <h2 class="flex items-center gap-2 border-b border-gray-800 pb-3 text-lg font-bold text-gray-200">
          <Ticket class="h-5 w-5 text-gray-500" />
          <span>Generate Promo Code</span>
        </h2>

        {/* Action result notification */}
        {actionSig.value && (
          <div
            class={`animate-in fade-in flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm duration-200 ${
              actionSig.value.success
                ? 'border-emerald-900/50 bg-emerald-950/40 text-emerald-400'
                : 'border-red-900/50 bg-red-950/40 text-red-400'
            }`}
          >
            {actionSig.value.success ? (
              <CheckCircle2 class="mt-0.5 h-4 w-4 text-emerald-500" />
            ) : (
              <AlertTriangle class="mt-0.5 h-4 w-4 text-red-500" />
            )}
            <div>
              <p class="font-semibold">{actionSig.value.message}</p>
              {actionSig.value.success && (
                <p class="mt-1 font-mono text-xs text-emerald-500/80 select-all">
                  Code: {actionSig.value.coupon}
                </p>
              )}
            </div>
          </div>
        )}

        <Form action={actionSig} class="space-y-5">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                for="prefix"
                class="mb-2 block text-sm font-medium text-gray-400"
              >
                Coupon Prefix
              </label>
              <input
                type="text"
                name="prefix"
                id="prefix"
                required
                class="block w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-gray-200 placeholder-gray-700 transition-all focus:border-gray-500 focus:ring-2 focus:ring-gray-500/25 focus:outline-none"
                placeholder="DIM-"
              />
              {actionSig.value?.fieldErrors?.prefix && (
                <p class="mt-1 text-xs text-red-400">
                  {actionSig.value.fieldErrors.prefix}
                </p>
              )}
            </div>

            <div>
              <label
                for="reward"
                class="mb-2 block text-sm font-medium text-gray-400"
              >
                Reward Value
              </label>
              <input
                type="text"
                name="reward"
                id="reward"
                required
                class="block w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-gray-200 placeholder-gray-700 transition-all focus:border-gray-500 focus:ring-2 focus:ring-gray-500/25 focus:outline-none"
                placeholder="e.g. 500 (points) or 7 days (sub)"
              />
              {actionSig.value?.fieldErrors?.reward && (
                <p class="mt-1 text-xs text-red-400">
                  {actionSig.value.fieldErrors.reward}
                </p>
              )}
            </div>
          </div>

          <div class="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              name="isSubscription"
              id="isSubscription"
              class="h-4 w-4 rounded border-gray-800 bg-gray-950 text-gray-600 focus:ring-gray-500/30"
            />
            <label
              for="isSubscription"
              class="text-sm font-medium text-gray-300"
            >
              Is Subscription / Trial Extension Coupon
            </label>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                for="maxUses"
                class="mb-2 block text-sm font-medium text-gray-400"
              >
                Max Uses (-1 for unlimited)
              </label>
              <input
                type="number"
                name="maxUses"
                id="maxUses"
                value={-1}
                required
                class="block w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-gray-200 placeholder-gray-700 transition-all focus:border-gray-500 focus:ring-2 focus:ring-gray-500/25 focus:outline-none"
              />
              {actionSig.value?.fieldErrors?.maxUses && (
                <p class="mt-1 text-xs text-red-400">
                  {actionSig.value.fieldErrors.maxUses}
                </p>
              )}
            </div>

            <div>
              <label
                for="expireDate"
                class="mb-2 block text-sm font-medium text-gray-400"
              >
                Expiration Date (optional)
              </label>
              <input
                type="date"
                name="expireDate"
                id="expireDate"
                class="block w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-gray-200 transition-all focus:border-gray-500 focus:ring-2 focus:ring-gray-500/25 focus:outline-none"
              />
              {actionSig.value?.fieldErrors?.expireDate && (
                <p class="mt-1 text-xs text-red-400">
                  {actionSig.value.fieldErrors.expireDate}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={actionSig.isRunning}
            class="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gray-600 to-gray-400 py-2.5 font-semibold text-white shadow-md transition-all hover:from-gray-500 hover:to-gray-300 focus:outline-none disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-600"
          >
            {actionSig.isRunning ? (
              <span>Generating...</span>
            ) : (
              <>
                <span>Generate Coupon</span>
                <Ticket class="h-4 w-4" />
              </>
            )}
          </button>
        </Form>
      </div>
    </div>
  );
});
