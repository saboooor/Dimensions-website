import { component$ } from '@qwik.dev/core';
import { Form, type ActionStore } from '@qwik.dev/router';
import ShoppingBag from 'lucide-icons-qwik/icons/ShoppingBag';

interface RewardsCatalogProps {
  rewards: any[];
  userPoints: number;
  claimRewardSig: ActionStore<any, any, true>;
}

export const RewardsCatalog = component$<RewardsCatalogProps>(
  ({ rewards, userPoints, claimRewardSig }) => {
    return (
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
                    userPoints < reward.price || claimRewardSig.isRunning
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
    );
  }
);
