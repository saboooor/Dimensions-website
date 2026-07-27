import { component$ } from '@qwik.dev/core';
import Gamepad2 from 'lucide-icons-qwik/icons/Gamepad2';
import SiDiscord from 'simple-icons-qwik/icons/SiDiscord';
import SiPaypal from 'simple-icons-qwik/icons/SiPaypal';

interface LinkedAccountsTabProps {
  discordAccount: string | null;
  minecraftAccount: string | null;
  verifiedPaypal: string | null;
}

export const LinkedAccountsTab = component$<LinkedAccountsTabProps>(
  ({ discordAccount, minecraftAccount, verifiedPaypal }) => {
    return (
      <div class="animate-in fade-in space-y-6 rounded-2xl border border-gray-900 bg-gray-900/30 p-6 duration-200">
        <h2 class="text-sm font-bold tracking-wider text-gray-200 uppercase">
          Integrations
        </h2>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Discord */}
          <div class="flex items-center justify-between rounded-xl border border-gray-900 bg-gray-950/30 p-4">
            <div class="flex items-center gap-3">
              <SiDiscord class="h-6 w-6 fill-[#5865F2]" />
              <div>
                <p class="text-sm font-bold text-gray-200">Discord Account</p>
                <p class="text-[10px] text-gray-500">
                  {discordAccount ? `Linked: ${discordAccount}` : 'Not linked'}
                </p>
              </div>
            </div>
            <span class="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold text-emerald-400">
              Active
            </span>
          </div>

          {/* Minecraft Link */}
          <div class="flex items-center justify-between rounded-xl border border-gray-900 bg-gray-950/30 p-4">
            <div class="flex items-center gap-3">
              <Gamepad2 class="h-6 w-6 text-emerald-500" />
              <div>
                <p class="text-sm font-bold text-gray-200">Minecraft UUID</p>
                <p class="text-[10px] text-gray-500">
                  {minecraftAccount
                    ? `UUID: ${minecraftAccount}`
                    : 'Not linked'}
                </p>
              </div>
            </div>
            {minecraftAccount ? (
              <a
                href="/linkMinecraft?unlink=true"
                class="border-gray-850 rounded-lg border bg-gray-900 px-3 py-1.5 text-[10px] font-bold text-red-400 transition-all hover:text-red-300"
              >
                Unlink
              </a>
            ) : (
              <a
                href="/linkMinecraft?getCode=true"
                class="hover:bg-emerald-550 rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-bold text-white transition-all"
              >
                Link Account
              </a>
            )}
          </div>

          {/* PayPal Verification */}
          {verifiedPaypal === '' && (
            <div class="flex items-center justify-between rounded-xl border border-gray-900 bg-gray-950/30 p-4">
              <div class="flex items-center gap-3">
                <SiPaypal class="h-6 w-6 fill-[#003087]" />
                <div>
                  <p class="text-sm font-bold text-gray-200">PayPal Purchase</p>
                  <p class="text-[10px] text-gray-500">
                    Verify your plugin purchase
                  </p>
                </div>
              </div>
              <a
                href="/linkPaypal?getCode=true"
                class="rounded-lg bg-[#0079C1] px-3 py-1.5 text-[10px] font-bold text-white transition-all hover:bg-[#00457C]"
              >
                Verify purchase
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }
);
