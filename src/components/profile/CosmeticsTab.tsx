import { component$ } from '@qwik.dev/core';
import { Form } from '@qwik.dev/router';
import Info from 'lucide-icons-qwik/icons/Info';

interface CosmeticsTabProps {
  minecraftAccount: string | null;
  availableCosmetics: any[];
  currentCosmetics: {
    postIgnitePortal: string;
    postUsePortal: string;
    postDestroyPortal: string;
    onPortalTick: string;
  };
  updateCosmeticsAction: any;
}

export const CosmeticsTab = component$<CosmeticsTabProps>(
  ({
    minecraftAccount,
    availableCosmetics,
    currentCosmetics,
    updateCosmeticsAction,
  }) => {
    return (
      <div class="animate-in fade-in flex flex-col gap-6 rounded-2xl border border-gray-900 bg-gray-900/30 p-6 duration-200">
        <div>
          <h2 class="text-sm font-bold tracking-wider text-gray-500 uppercase">
            In-game Cosmetics
          </h2>
          <p class="mt-1 text-[10px] text-gray-500">
            Configure the particle effects and cosmetics displayed when you
            interact with portals in-game.
          </p>
        </div>

        {minecraftAccount === '' ? (
          <p class="flex items-center gap-2 text-sm text-gray-500 italic">
            <Info class="h-4 w-4 text-gray-500" />
            <span>
              You need to link your Minecraft account first to customize in-game
              cosmetics.
            </span>
          </p>
        ) : (
          <div>
            {updateCosmeticsAction.value && (
              <div class="mb-4 rounded-lg border border-emerald-900/50 bg-emerald-950/40 p-3 text-xs text-emerald-400">
                {updateCosmeticsAction.value.message}
              </div>
            )}

            <Form
              action={updateCosmeticsAction}
              class="flex max-w-md flex-col gap-4"
            >
              <div>
                <label class="mb-1.5 block text-xs text-gray-400">
                  On Portal Ignite
                </label>
                <select
                  name="postIgnite"
                  value={currentCosmetics.postIgnitePortal}
                  class="border-gray-850 block w-full rounded-lg border bg-gray-950 px-3.5 py-2 text-sm text-gray-300 focus:border-gray-500 focus:outline-none"
                >
                  <option value="NOTHING">NOTHING</option>
                  {availableCosmetics
                    .filter((c: any) => JSON.parse(c.used).includes('ignite'))
                    .map((c: any, idx: number) => (
                      <option key={idx} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label class="mb-1.5 block text-xs text-gray-400">
                  On Portal Destroy
                </label>
                <select
                  name="postDestroy"
                  value={currentCosmetics.postDestroyPortal}
                  class="border-gray-850 block w-full rounded-lg border bg-gray-950 px-3.5 py-2 text-sm text-gray-300 focus:border-gray-500 focus:outline-none"
                >
                  <option value="NOTHING">NOTHING</option>
                  {availableCosmetics
                    .filter((c: any) => JSON.parse(c.used).includes('destroy'))
                    .map((c: any, idx: number) => (
                      <option key={idx} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label class="mb-1.5 block text-xs text-gray-400">
                  On Portal Use
                </label>
                <select
                  name="postUse"
                  value={currentCosmetics.postUsePortal}
                  class="border-gray-850 block w-full rounded-lg border bg-gray-950 px-3.5 py-2 text-sm text-gray-300 focus:border-gray-500 focus:outline-none"
                >
                  <option value="NOTHING">NOTHING</option>
                  {availableCosmetics
                    .filter((c: any) => JSON.parse(c.used).includes('use'))
                    .map((c: any, idx: number) => (
                      <option key={idx} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label class="mb-1.5 block text-xs text-gray-400">
                  Portal effect
                </label>
                <select
                  name="onTick"
                  value={currentCosmetics.onPortalTick}
                  class="border-gray-850 block w-full rounded-lg border bg-gray-950 px-3.5 py-2 text-sm text-gray-300 focus:border-gray-500 focus:outline-none"
                >
                  <option value="NOTHING">NOTHING</option>
                  {availableCosmetics
                    .filter((c: any) => JSON.parse(c.used).includes('tick'))
                    .map((c: any, idx: number) => (
                      <option key={idx} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <button
                type="submit"
                class="rounded-lg bg-gray-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-gray-500"
              >
                Save Preferences
              </button>
            </Form>
          </div>
        )}
      </div>
    );
  }
);
