import { component$ } from '@qwik.dev/core';
import { Form, type ActionStore } from '@qwik.dev/router';
import Ticket from 'lucide-icons-qwik/icons/Ticket';

interface RedeemCodeCardProps {
  redeemSig: ActionStore<any, any, true>;
}

export const RedeemCodeCard = component$<RedeemCodeCardProps>(
  ({ redeemSig }) => {
    return (
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
    );
  }
);
