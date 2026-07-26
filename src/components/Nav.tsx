import { component$ } from '@qwik.dev/core';
import { Link, useLocation } from '@qwik.dev/router';
import { Dropdown, Nav as LuminescentNav } from '@luminescent/ui-qwik';
import Grid3x3 from 'lucide-icons-qwik/icons/Grid';
import Gem from 'lucide-icons-qwik/icons/Gem';
import CircleHelp from 'lucide-icons-qwik/icons/CircleHelp';
import UserIcon from 'lucide-icons-qwik/icons/User';
import Sliders from 'lucide-icons-qwik/icons/Sliders';
import LogOut from 'lucide-icons-qwik/icons/LogOut';
import LogIn from 'lucide-icons-qwik/icons/LogIn';
import type { User } from '~/util/db';

export interface NavProps {
  user?: User | null;
}

export const Nav = component$<NavProps>(({ user }) => {
  const loc = useLocation();
  const isAdmin = user && user.id === '1';

  return (
    <LuminescentNav fixed floating colorClass="lum-grad-bg-nav-bg">
      {/* start slot: branding */}
      <Link
        q:slot="start"
        href="/"
        class="lum-btn lum-bg-transparent hover:lum-bg-nav-bg rounded-lum-2 font-bold tracking-tighter"
      >
        {/* eslint-disable-next-line qwik/jsx-img-tag */}
        <img
          src="/icon.png"
          alt="icon"
          width={24}
          height={24}
          class="h-6 w-6 object-contain"
        />
        <span class="bg-linear-to-br from-orange-100 to-amber-200 bg-clip-text! text-transparent">
          Dimensions
        </span>
      </Link>

      <Link
        q:slot="center"
        href="/portals"
        class="lum-btn lum-bg-transparent hover:lum-bg-nav-bg rounded-lum-2 hidden sm:flex"
      >
        Portals
      </Link>
      <Link
        q:slot="center"
        href="/editor/portal"
        class="lum-btn lum-bg-transparent hover:lum-bg-nav-bg rounded-lum-2 hidden sm:flex"
      >
        Portal Editor
      </Link>
      <Link
        q:slot="center"
        href="/editor/particle"
        class="lum-btn lum-bg-transparent hover:lum-bg-nav-bg rounded-lum-2 hidden sm:flex"
      >
        Particle Editor
      </Link>
      <Link
        q:slot="center"
        href="/points"
        class="lum-btn lum-bg-transparent hover:lum-bg-nav-bg rounded-lum-2 hidden sm:flex"
      >
        Points
      </Link>
      <Link
        q:slot="center"
        href="/faq"
        class="lum-btn lum-bg-transparent hover:lum-bg-nav-bg rounded-lum-2 hidden sm:flex"
      >
        F.A.Q
      </Link>

      {/* end slot: user points indicator (desktop) */}
      {user && (
        <Link
          q:slot="end"
          href="/points"
          class="lum-btn lum-bg-transparent hover:lum-bg-nav-bg rounded-lum-2 hidden sm:flex"
        >
          <Gem class="h-4 w-4" />
          <span>{Number(user.points).toLocaleString()}</span>
        </Link>
      )}

      {/* end slot: profile dropdown or login button (desktop) */}
      {user ? (
        <Dropdown
          align="right"
          q:slot="end"
          class="lum-bg-transparent hover:lum-bg-nav-bg rounded-lum-2 hidden sm:flex"
          id="profile-dropdown"
        >
          <div
            q:slot="dropdown"
            class="text-lum-text flex items-center gap-2 font-bold"
          >
            <img
              src={user.profileImage || '/assets/img/guest.png'}
              alt="Profile"
              width={20}
              height={20}
              class="h-5 w-5 rounded-full border border-gray-800 object-cover"
            />
            <span>{user.username}</span>
          </div>
          <Link
            href={`/profile/${user.id}`}
            class="lum-btn lum-bg-transparent hover:lum-bg-nav-bg rounded-lum-1 justify-start gap-2 text-gray-300"
          >
            <UserIcon class="text-sm" />
            <span>Profile</span>
          </Link>
          {isAdmin && (
            <Link
              href="/admin-tools"
              class="lum-btn lum-bg-transparent hover:lum-bg-nav-bg rounded-lum-1 justify-start gap-2 text-gray-300"
            >
              <Sliders class="text-sm" />
              <span>Admin Tools</span>
            </Link>
          )}
          <Link
            href="/logout"
            class="lum-btn lum-bg-transparent hover:lum-bg-nav-bg rounded-lum-1 justify-start gap-2 text-red-400"
          >
            <LogOut class="text-sm" />
            <span>Logout</span>
          </Link>
        </Dropdown>
      ) : (
        <Link
          q:slot="end"
          href="/login"
          class="lum-btn lum-bg-transparent hover:lum-bg-nav-bg rounded-lum-2 hidden sm:flex"
        >
          Login
        </Link>
      )}

      <Link
        q:slot="mobile"
        href="/portals"
        class={`lum-btn lum-bg-transparent hover:lum-bg-nav-bg justify-start gap-2 ${
          loc.url.pathname.startsWith('/portals')
            ? 'text-gray-500'
            : 'text-gray-400'
        }`}
      >
        <Grid3x3 class="h-4 w-4" />
        <span>Portals</span>
      </Link>
      <Link
        q:slot="mobile"
        href="/points"
        class={`lum-btn lum-bg-transparent hover:lum-bg-nav-bg justify-start gap-2 ${
          loc.url.pathname.startsWith('/points')
            ? 'text-gray-500'
            : 'text-gray-400'
        }`}
      >
        <Gem class="h-4 w-4" />
        <span>
          Points {user && `(${Number(user.points).toLocaleString()})`}
        </span>
      </Link>
      <Link
        q:slot="mobile"
        href="/faq"
        class={`lum-btn lum-bg-transparent hover:lum-bg-nav-bg justify-start gap-2 ${
          loc.url.pathname.startsWith('/faq')
            ? 'text-gray-500'
            : 'text-gray-400'
        }`}
      >
        <CircleHelp class="h-4 w-4" />
        <span>F.A.Q</span>
      </Link>

      {user ? (
        <>
          <div q:slot="mobile" class="mx-2 my-1 h-px bg-gray-800/60" />
          <Link
            q:slot="mobile"
            href={`/profile/${user.id}`}
            class={`lum-btn lum-bg-transparent hover:lum-bg-nav-bg justify-start gap-2 ${
              loc.url.pathname.startsWith('/profile')
                ? 'text-gray-500'
                : 'text-gray-400'
            }`}
          >
            <UserIcon class="h-4 w-4" />
            <span>Profile ({user.username})</span>
          </Link>
          {isAdmin && (
            <Link
              q:slot="mobile"
              href="/admin-tools"
              class={`lum-btn lum-bg-transparent hover:lum-bg-nav-bg justify-start gap-2 ${
                loc.url.pathname.startsWith('/admin-tools')
                  ? 'text-gray-500'
                  : 'text-gray-400'
              }`}
            >
              <Sliders class="h-4 w-4" />
              <span>Admin Tools</span>
            </Link>
          )}
          <Link
            q:slot="mobile"
            href="/logout"
            class="lum-btn lum-bg-transparent hover:lum-bg-nav-bg justify-start gap-2 text-red-400"
          >
            <LogOut class="h-4 w-4" />
            <span>Logout</span>
          </Link>
        </>
      ) : (
        <>
          <div q:slot="mobile" class="mx-2 my-1 h-px bg-gray-800/60" />
          <Link
            q:slot="mobile"
            href="/login"
            class="lum-btn lum-bg-transparent hover:lum-bg-nav-bg justify-start gap-2 text-gray-300"
          >
            <LogIn class="h-4 w-4" />
            <span>Login</span>
          </Link>
        </>
      )}
    </LuminescentNav>
  );
});

export default Nav;
