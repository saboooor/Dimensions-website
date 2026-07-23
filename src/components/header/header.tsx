import { component$, useSignal } from '@qwik.dev/core';
import type { Signal } from '@qwik.dev/core';
import type { User } from '../../util/db';
import Menu from 'lucide-icons-qwik/icons/Menu';
import Gem from 'lucide-icons-qwik/icons/Gem';
import ChevronDown from 'lucide-icons-qwik/icons/ChevronDown';
import MousePointer from 'lucide-icons-qwik/icons/MousePointer';
import UserIcon from 'lucide-icons-qwik/icons/User';
import LogOut from 'lucide-icons-qwik/icons/LogOut';
import LogIn from 'lucide-icons-qwik/icons/LogIn';

export interface HeaderProps {
  user: User | null;
  sidebarOpen: Signal<boolean>;
}

export default component$<HeaderProps>(({ user, sidebarOpen }) => {
  const dropdownOpen = useSignal(false);

  return (
    <header class="fixed top-0 right-0 left-0 z-40 flex h-16 items-center justify-between border-b border-gray-900 bg-gray-950/80 px-4 backdrop-blur-md">
      {/* Left section: Logo & Sidebar Toggle */}
      <div class="flex items-center gap-3">
        <button
          onClick$={() => (sidebarOpen.value = !sidebarOpen.value)}
          class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-900 hover:text-white focus:outline-none"
          aria-label="Toggle Sidebar"
        >
          <Menu class="text-2xl" />
        </button>

        <a href="/" class="flex items-center gap-2">
          {/* eslint-disable-next-line qwik/jsx-img-tag */}
          <img
            src="/assets/img/logo.png"
            alt="Dimensions Logo"
            class="h-8 w-8 object-contain"
            width="32"
            height="32"
          />
          <span class="bg-gradient-to-r from-gray-500 to-gray-300 bg-clip-text text-xl font-bold tracking-wide text-transparent">
            Dimensions
          </span>
        </a>
      </div>

      {/* Right section: Points & Profile Dropdown */}
      <div class="flex items-center gap-4">
        {user && (
          <a
            href="/points"
            class="border-gray-850 flex items-center gap-2 rounded-xl border bg-gray-900 px-3 py-1.5 text-xs font-semibold text-gray-400 transition-all duration-200 hover:border-gray-500/30 hover:bg-gray-500/5"
          >
            <Gem class="text-sm" />
            <span>{Number(user.points).toLocaleString()} points</span>
          </a>
        )}

        <div class="relative">
          {user ? (
            <div>
              <button
                onClick$={() => (dropdownOpen.value = !dropdownOpen.value)}
                class="group flex items-center gap-2 focus:outline-none"
              >
                <img
                  src={user.profileImage || '/assets/img/guest.png'}
                  alt="Profile"
                  class="h-9 w-9 rounded-full border-2 border-gray-800 object-cover transition-colors group-hover:border-gray-500"
                  width="36"
                  height="36"
                />
                <span class="hidden text-sm font-medium text-gray-300 transition-colors group-hover:text-white md:block">
                  {user.username}
                </span>
                <ChevronDown class="text-xs text-gray-500 transition-colors group-hover:text-gray-300" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen.value && (
                <div class="animate-in fade-in slide-in-from-top-2 absolute right-0 z-50 mt-2 w-48 rounded-xl border border-gray-800 bg-gray-900 py-1 shadow-xl duration-150">
                  <div class="border-b border-gray-800 px-4 py-2">
                    <p class="text-xs text-gray-500">Logged in as</p>
                    <p class="truncate text-sm font-semibold text-gray-200">
                      {user.username}
                    </p>
                  </div>

                  {user.rank === 'Author' && (
                    <a
                      href="/admin-tools"
                      onClick$={() => (dropdownOpen.value = false)}
                      class="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                    >
                      <MousePointer class="h-4 w-4" />
                      <span>Admin tools</span>
                    </a>
                  )}

                  <a
                    href={`/profile/${user.id}`}
                    onClick$={() => (dropdownOpen.value = false)}
                    class="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                  >
                    <UserIcon class="h-4 w-4" />
                    <span>My Profile</span>
                  </a>

                  <a
                    href="/logout"
                    onClick$={() => (dropdownOpen.value = false)}
                    class="flex items-center gap-2 border-t border-gray-800 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-950/35 hover:text-red-300"
                  >
                    <LogOut class="h-4 w-4" />
                    <span>Sign Out</span>
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div class="flex items-center gap-2">
              <a
                href="/login"
                class="flex items-center gap-1.5 rounded-lg bg-gray-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-500"
              >
                <LogIn class="h-4 w-4" />
                <span>Login</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
});
