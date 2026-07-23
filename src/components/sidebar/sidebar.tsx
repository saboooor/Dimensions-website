import { component$, useSignal } from '@qwik.dev/core';
import type { Signal } from '@qwik.dev/core';
import type { User } from '../../util/db';
import LayoutGrid from 'lucide-icons-qwik/icons/LayoutGrid';
import LayoutTemplate from 'lucide-icons-qwik/icons/LayoutTemplate';
import ChevronDown from 'lucide-icons-qwik/icons/ChevronDown';
import Dot from 'lucide-icons-qwik/icons/Dot';
import CloudDownload from 'lucide-icons-qwik/icons/CloudDownload';
import CircleHelp from 'lucide-icons-qwik/icons/CircleHelp';

export interface SidebarProps {
  user: User | null;
  sidebarOpen: Signal<boolean>;
}

export default component$<SidebarProps>(({ user, sidebarOpen }) => {
  const editorsOpen = useSignal(true);

  const navItemClass =
    'flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-900/60 transition-all font-medium text-sm';
  const _activeNavItemClass =
    'flex items-center gap-3 px-4 py-3 rounded-lg text-white bg-gray-900 border border-gray-850 transition-all font-semibold text-sm';
  const subNavItemClass =
    'flex items-center gap-2 pl-11 pr-4 py-2.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-900/30 transition-colors text-xs';

  return (
    <aside
      class={`fixed top-16 bottom-0 left-0 z-30 w-64 border-r border-gray-900 bg-gray-950 transition-transform duration-300 ease-in-out md:translate-x-0 ${
        sidebarOpen.value ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div class="flex h-full flex-col justify-between overflow-y-auto px-3 py-4">
        {/* Navigation list */}
        <ul class="space-y-1.5">
          <li>
            <a href="/" class={navItemClass}>
              <LayoutGrid class="h-5 w-5 text-gray-500" />
              <span>Home</span>
            </a>
          </li>

          {/* Collapsible Editors Section */}
          <li>
            <button
              onClick$={() => (editorsOpen.value = !editorsOpen.value)}
              class="flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-gray-400 transition-all hover:bg-gray-900/60 hover:text-white focus:outline-none"
            >
              <div class="flex items-center gap-3">
                <LayoutTemplate class="h-5 w-5 text-gray-300" />
                <span>Editors</span>
              </div>
              <ChevronDown
                class={`h-4 w-4 transition-transform duration-200 ${
                  editorsOpen.value ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </button>

            {editorsOpen.value && (
              <ul class="animate-in fade-in slide-in-from-top-1 mt-1.5 space-y-1 duration-150">
                <li>
                  <a href="/editor/portal" class={subNavItemClass}>
                    <Dot class="h-3 w-3" />
                    <span>Portal editor</span>
                  </a>
                </li>
                <li>
                  <a href="/editor/particle" class={subNavItemClass}>
                    <Dot class="h-3 w-3" />
                    <span>Particle editor</span>
                  </a>
                </li>
              </ul>
            )}
          </li>

          <li>
            <a href="/portals" class={navItemClass}>
              <CloudDownload class="h-5 w-5 text-blue-500" />
              <span>Portals</span>
            </a>
          </li>

          <li>
            <a href="/faq" class={navItemClass}>
              <CircleHelp class="h-5 w-5 text-emerald-500" />
              <span>F.A.Q</span>
            </a>
          </li>
        </ul>

        {/* Footer info or Auth Links if not logged in */}
        <div class="mt-auto space-y-2">
          {!user && (
            <div class="rounded-xl border border-gray-900 bg-gray-900/30 p-3 md:hidden">
              <a
                href="/login"
                class="block w-full rounded-lg bg-gray-600 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-gray-500"
              >
                Login
              </a>
            </div>
          )}

          <div class="border-t border-gray-900 py-2 text-center">
            <span class="font-mono text-[10px] text-gray-600">
              Dimensions v3.0 • Qwik Pages
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
});
