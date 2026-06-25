import { component$, useSignal } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";
import type { User } from "../../util/db";

export interface SidebarProps {
  user: User | null;
  sidebarOpen: Signal<boolean>;
}

export default component$<SidebarProps>(({ user, sidebarOpen }) => {
  const editorsOpen = useSignal(true);

  const navItemClass =
    "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-900/60 transition-all font-medium text-sm";
  const activeNavItemClass =
    "flex items-center gap-3 px-4 py-3 rounded-lg text-white bg-gray-900 border border-gray-850 transition-all font-semibold text-sm";
  const subNavItemClass =
    "flex items-center gap-2 pl-11 pr-4 py-2.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-900/30 transition-colors text-xs";

  return (
    <aside
      class={`fixed top-16 bottom-0 left-0 z-30 w-64 bg-gray-950 border-r border-gray-900 transition-transform duration-300 ease-in-out md:translate-x-0 ${
        sidebarOpen.value ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div class="h-full px-3 py-4 overflow-y-auto flex flex-col justify-between">
        {/* Navigation list */}
        <ul class="space-y-1.5">
          <li>
            <a href="/" class={navItemClass}>
              <i class="bi bi-grid text-lg text-gray-500"></i>
              <span>Home</span>
            </a>
          </li>

          {/* Collapsible Editors Section */}
          <li>
            <button
              onClick$={() => (editorsOpen.value = !editorsOpen.value)}
              class="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-900/60 transition-all font-medium text-sm focus:outline-none"
            >
              <div class="flex items-center gap-3">
                <i class="bi bi-menu-button-wide text-lg text-gray-300"></i>
                <span>Editors</span>
              </div>
              <i
                class={`bi bi-chevron-down text-xs transition-transform duration-200 ${
                  editorsOpen.value ? "rotate-0" : "-rotate-90"
                }`}
              ></i>
            </button>

            {editorsOpen.value && (
              <ul class="mt-1.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                <li>
                  <a href="/editor/portal" class={subNavItemClass}>
                    <i class="bi bi-circle text-[6px]"></i>
                    <span>Portal editor</span>
                  </a>
                </li>
                <li>
                  <a href="/editor/particle" class={subNavItemClass}>
                    <i class="bi bi-circle text-[6px]"></i>
                    <span>Particle editor</span>
                  </a>
                </li>
              </ul>
            )}
          </li>

          <li>
            <a href="/portals" class={navItemClass}>
              <i class="bx bx-cloud-download text-lg text-blue-500"></i>
              <span>Portals</span>
            </a>
          </li>

          <li>
            <a href="/faq" class={navItemClass}>
              <i class="bi bi-question-circle text-lg text-emerald-500"></i>
              <span>F.A.Q</span>
            </a>
          </li>
        </ul>

        {/* Footer info or Auth Links if not logged in */}
        <div class="space-y-2 mt-auto">
          {!user && (
            <div class="p-3 bg-gray-900/30 border border-gray-900 rounded-xl md:hidden">
              <a
                href="/login"
                class="block text-center w-full bg-gray-600 hover:bg-gray-500 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
              >
                Login
              </a>
            </div>
          )}

          <div class="text-center py-2 border-t border-gray-900">
            <span class="text-[10px] text-gray-600 font-mono">Dimensions v3.0 • Qwik Pages</span>
          </div>
        </div>
      </div>
    </aside>
  );
});
