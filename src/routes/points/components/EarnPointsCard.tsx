import { component$ } from '@qwik.dev/core';
import { Form, type ActionStore } from '@qwik.dev/router';
import Gift from 'lucide-icons-qwik/icons/Gift';
import Tv from 'lucide-icons-qwik/icons/Tv';
import CalendarCheck from 'lucide-icons-qwik/icons/CalendarCheck';

interface EarnPointsCardProps {
  enabledAds: number;
  hasClaimedToday: boolean;
  toggleAdsSig: ActionStore<any, any, true>;
  claimAdsSig: ActionStore<any, any, true>;
}

export const EarnPointsCard = component$<EarnPointsCardProps>(
  ({ enabledAds, hasClaimedToday, toggleAdsSig, claimAdsSig }) => {
    return (
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
                  class={enabledAds === 1 ? 'text-emerald-400' : 'text-red-400'}
                >
                  {enabledAds === 1 ? 'Enabled' : 'Disabled'}
                </span>
              </span>
              <Form action={toggleAdsSig}>
                <button
                  type="submit"
                  class="border-gray-850 rounded-md border bg-gray-900 px-3 py-1.5 text-[10px] font-bold text-gray-300 transition-all hover:bg-gray-800"
                >
                  {enabledAds === 1 ? 'Disable Ads' : 'Enable Ads'}
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
                  enabledAds === 0 || hasClaimedToday || claimAdsSig.isRunning
                }
                class="w-full rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-500"
              >
                {hasClaimedToday ? 'Already Claimed Today' : 'Claim 50 Points'}
              </button>
            </Form>
          </div>
        </div>
      </div>
    );
  }
);
