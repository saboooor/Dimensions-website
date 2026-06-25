import { component$ } from "@builder.io/qwik";
import { routeAction$, routeLoader$, Form, zod$, z } from "@builder.io/qwik-city";
import { getDB, subscriptionCoupons } from "../../util/db";
import { getSessionUser, isAdmin } from "../../util/auth";

/**
 * Loader to enforce administrative access only.
 */
export const useAdminLoader = routeLoader$(async (requestEvent) => {
  const user = await getSessionUser(requestEvent);
  if (!user || !isAdmin(user)) {
    throw requestEvent.redirect(302, "/");
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
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    const couponCode = `${prefix}${randomPart}`;

    try {
      // Insert coupon into Drizzle database
      await db
        .insert(subscriptionCoupons)
        .values({
          isSubscription: isSubscription ? 1 : 0,
          coupon: couponCode,
          period: reward,
          uses: maxUses,
          valid: expireDate || "0000-00-00",
          usedBy: "",
        })
        .run();

      return {
        success: true,
        message: `Successfully generated coupon: ${couponCode}`,
        coupon: couponCode,
      };
    } catch (err) {
      console.error("Error generating coupon:", err);
      return {
        success: false,
        message: "Failed to generate coupon. Please check that the code is unique.",
      };
    }
  },
  zod$({
    prefix: z.string().min(1, "Prefix is required").max(10, "Prefix is too long"),
    isSubscription: z.boolean().default(false),
    reward: z.string().min(1, "Reward (value/period) is required"),
    maxUses: z.coerce.number().default(-1),
    expireDate: z.string().default("0000-00-00"),
  })
);

export default component$(() => {
  const adminLoaderSig = useAdminLoader();
  const actionSig = useGenerateCouponAction();

  return (
    <div class="space-y-8 max-w-2xl mx-auto">
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-xl bg-gray-600/15 border border-gray-500/30 flex items-center justify-center text-gray-500">
          <i class="bi bi-shield-lock-fill text-xl"></i>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-100">Admin Panel</h1>
          <p class="text-xs text-gray-500">Manage promo codes, rewards, and system configurations</p>
        </div>
      </div>

      <div class="bg-gray-900/40 border border-gray-900 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
        <h2 class="text-lg font-bold text-gray-200 flex items-center gap-2 border-b border-gray-800 pb-3">
          <i class="bi bi-ticket-perferated text-gray-500"></i>
          <span>Generate Promo Code</span>
        </h2>

        {/* Action result notification */}
        {actionSig.value && (
          <div
            class={`px-4 py-3 rounded-lg border flex items-start gap-2.5 text-sm animate-in fade-in duration-200 ${
              actionSig.value.success
                ? "bg-emerald-950/40 border-emerald-900/50 text-emerald-400"
                : "bg-red-950/40 border-red-900/50 text-red-400"
            }`}
          >
            <i
              class={`bi mt-0.5 ${
                actionSig.value.success ? "bi-check-circle-fill text-emerald-500" : "bi-exclamation-triangle-fill text-red-500"
              }`}
            ></i>
            <div>
              <p class="font-semibold">{actionSig.value.message}</p>
              {actionSig.value.success && (
                <p class="text-xs text-emerald-500/80 mt-1 select-all font-mono">
                  Code: {actionSig.value.coupon}
                </p>
              )}
            </div>
          </div>
        )}

        <Form action={actionSig} class="space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="prefix" class="block text-sm font-medium text-gray-400 mb-2">
                Coupon Prefix
              </label>
              <input
                type="text"
                name="prefix"
                id="prefix"
                required
                class="block w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg focus:ring-2 focus:ring-gray-500/25 focus:border-gray-500 text-gray-200 placeholder-gray-700 text-sm transition-all focus:outline-none"
                placeholder="DIM-"
              />
              {actionSig.value?.fieldErrors?.prefix && (
                <p class="text-xs text-red-400 mt-1">{actionSig.value.fieldErrors.prefix}</p>
              )}
            </div>

            <div>
              <label for="reward" class="block text-sm font-medium text-gray-400 mb-2">
                Reward Value
              </label>
              <input
                type="text"
                name="reward"
                id="reward"
                required
                class="block w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg focus:ring-2 focus:ring-gray-500/25 focus:border-gray-500 text-gray-200 placeholder-gray-700 text-sm transition-all focus:outline-none"
                placeholder="e.g. 500 (points) or 7 days (sub)"
              />
              {actionSig.value?.fieldErrors?.reward && (
                <p class="text-xs text-red-400 mt-1">{actionSig.value.fieldErrors.reward}</p>
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
            <label for="isSubscription" class="text-sm font-medium text-gray-300">
              Is Subscription / Trial Extension Coupon
            </label>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="maxUses" class="block text-sm font-medium text-gray-400 mb-2">
                Max Uses (-1 for unlimited)
              </label>
              <input
                type="number"
                name="maxUses"
                id="maxUses"
                value={-1}
                required
                class="block w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg focus:ring-2 focus:ring-gray-500/25 focus:border-gray-500 text-gray-200 placeholder-gray-700 text-sm transition-all focus:outline-none"
              />
              {actionSig.value?.fieldErrors?.maxUses && (
                <p class="text-xs text-red-400 mt-1">{actionSig.value.fieldErrors.maxUses}</p>
              )}
            </div>

            <div>
              <label for="expireDate" class="block text-sm font-medium text-gray-400 mb-2">
                Expiration Date (optional)
              </label>
              <input
                type="date"
                name="expireDate"
                id="expireDate"
                class="block w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg focus:ring-2 focus:ring-gray-500/25 focus:border-gray-500 text-gray-200 text-sm transition-all focus:outline-none"
              />
              {actionSig.value?.fieldErrors?.expireDate && (
                <p class="text-xs text-red-400 mt-1">{actionSig.value.fieldErrors.expireDate}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={actionSig.isRunning}
            class="w-full bg-gradient-to-r from-gray-600 to-gray-400 hover:from-gray-500 hover:to-gray-300 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-600 text-white font-semibold py-2.5 rounded-lg transition-all shadow-md focus:outline-none flex justify-center items-center gap-2"
          >
            {actionSig.isRunning ? (
              <span>Generating...</span>
            ) : (
              <>
                <span>Generate Coupon</span>
                <i class="bi bi-ticket-perferated"></i>
              </>
            )}
          </button>
        </Form>
      </div>
    </div>
  );
});
