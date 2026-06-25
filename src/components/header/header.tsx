import { component$, useSignal } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";
import type { User } from "../../lib/db";

export interface HeaderProps {
  user: User | null;
  sidebarOpen: Signal<boolean>;
}

export default component$<HeaderProps>(({ user, sidebarOpen }) => {
  const dropdownOpen = useSignal(false);

  return (
    <header class="h-16 fixed top-0 left-0 right-0 z-40 bg-gray-950/80 backdrop-blur-md border-b border-gray-900 flex items-center justify-between px-4">
      {/* Left section: Logo & Sidebar Toggle */}
      <div class="flex items-center gap-3">
        <button
          onClick$={() => (sidebarOpen.value = !sidebarOpen.value)}
          class="p-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-colors focus:outline-none"
          aria-label="Toggle Sidebar"
        >
          <i class="bi bi-list text-2xl"></i>
        </button>

        <a href="/" class="flex items-center gap-2">
          <img src="/assets/img/logo.png" alt="Dimensions Logo" class="h-8 w-8 object-contain" />
          <span class="font-bold text-xl tracking-wide bg-gradient-to-r from-gray-500 to-gray-300 bg-clip-text text-transparent">
            Dimensions
          </span>
        </a>
      </div>

      {/* Right section: Points & Profile Dropdown */}
      <div class="flex items-center gap-4">
        {user && (
          <a
            href="/points"
            class="flex items-center gap-2 px-3 py-1.5 bg-gray-900 border border-gray-850 hover:border-gray-500/30 hover:bg-gray-500/5 rounded-xl text-xs font-semibold text-gray-400 transition-all duration-200"
          >
            <i class="bi bi-gem text-sm"></i>
            <span>{Number(user.points).toLocaleString()} points</span>
          </a>
        )}

        <div class="relative">
          {user ? (
            <div>
              <button
                onClick$={() => (dropdownOpen.value = !dropdownOpen.value)}
                class="flex items-center gap-2 focus:outline-none group"
              >
                <img
                  src={user.profileImage || "/assets/img/guest.png"}
                  alt="Profile"
                  class="h-9 w-9 rounded-full border-2 border-gray-800 group-hover:border-gray-500 transition-colors object-cover"
                />
                <span class="hidden md:block text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  {user.username}
                </span>
                <i class="bi bi-chevron-down text-xs text-gray-500 group-hover:text-gray-300 transition-colors"></i>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen.value && (
                <div class="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div class="px-4 py-2 border-b border-gray-800">
                    <p class="text-xs text-gray-500">Logged in as</p>
                    <p class="text-sm font-semibold text-gray-200 truncate">{user.username}</p>
                  </div>

                  {user.rank === "Author" && (
                    <a
                      href="/admin-tools"
                      onClick$={() => (dropdownOpen.value = false)}
                      class="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                    >
                      <i class="bi bi-mouse3"></i>
                      <span>Admin tools</span>
                    </a>
                  )}

                  <a
                    href={`/profile/${user.id}`}
                    onClick$={() => (dropdownOpen.value = false)}
                    class="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                  >
                    <i class="bi bi-person"></i>
                    <span>My Profile</span>
                  </a>

                  <a
                    href="/logout"
                    onClick$={() => (dropdownOpen.value = false)}
                    class="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-950/35 transition-colors border-t border-gray-800"
                  >
                    <i class="bi bi-box-arrow-right"></i>
                    <span>Sign Out</span>
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div class="flex items-center gap-2">
              <a
                href="/login"
                class="bg-gray-600 hover:bg-gray-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <i class="bi bi-box-arrow-in-right"></i>
                <span>Login</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
});
