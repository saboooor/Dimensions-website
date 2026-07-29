import { component$ } from '@qwik.dev/core';
import { Form, type ActionStore } from '@qwik.dev/router';
import Ticket from 'lucide-icons-qwik/icons/Ticket';

interface RedeemCodeCardProps {
  redeemSig: ActionStore<any, any, true>;
}

export const RedeemCodeCard = component$<RedeemCodeCardProps>(
  ({ redeemSig }) => {
    return (
      <div class="lum-card flex h-fit flex-col gap-4 p-6 shadow-lg md:col-span-1">
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

        <Form action={redeemSig} class="flex flex-col gap-3">
          <input
            type="text"
            name="code"
            required
            placeholder="Enter promo code..."
            class="lum-input w-full"
          />
          <button
            type="submit"
            disabled={redeemSig.isRunning}
            class="lum-btn w-full cursor-pointer font-semibold text-white disabled:opacity-50"
          >
            {redeemSig.isRunning ? 'Claiming...' : 'Claim Points'}
          </button>
        </Form>
      </div>
    );
  }
);
