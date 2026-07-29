import { component$ } from '@qwik.dev/core';
import History from 'lucide-icons-qwik/icons/History';

interface ClaimItem {
  type?: string | null;
  input?: string | null;
  status?: string | null;
}

interface ClaimHistoryTableProps {
  history: ClaimItem[];
}

export const ClaimHistoryTable = component$<ClaimHistoryTableProps>(
  ({ history }) => {
    if (history.length === 0) return null;

    return (
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
                  <tr key={idx} class="transition-colors hover:bg-gray-900/10">
                    <td class="px-6 py-4 font-semibold">{req.type}</td>
                    <td class="max-w-xs truncate px-6 py-4 font-mono text-xs text-gray-500">
                      {req.input || '-'}
                    </td>
                    <td class="px-6 py-4">
                      <span
                        class={`inline-block rounded-lg px-3 py-1 text-xs font-medium ${
                          req.status?.startsWith('Coupon:')
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
    );
  }
);
