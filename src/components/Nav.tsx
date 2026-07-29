import { component$ } from '@qwik.dev/core';
import { Form, Link, useLocation } from '@qwik.dev/router';
import { Dropdown, Nav as LuminescentNav } from '@luminescent/ui-qwik';
import Grid3x3 from 'lucide-icons-qwik/icons/Grid';
import Gem from 'lucide-icons-qwik/icons/Gem';
import CircleHelp from 'lucide-icons-qwik/icons/CircleHelp';
import LogOut from 'lucide-icons-qwik/icons/LogOut';
import type { User } from '~/util/db';
import { useSession, useSignIn, useSignOut } from '~/routes/plugin@auth';
import UserIcon from 'lucide-icons-qwik/icons/User';
import RectangleVertical from 'lucide-icons-qwik/icons/RectangleVertical';

export interface NavProps {
  user?: User | null;
}

export const Nav = component$<NavProps>(({ user }) => {
  const loc = useLocation();
  const signIn = useSignIn();
  const signOut = useSignOut();
  const session = useSession();

  return (
    <LuminescentNav fixed floating colorClass="lum-grad-bg-nav-bg" nohamburger>
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
        <Grid3x3 class="h-4 w-4" />
        Portals
      </Link>
      <Link
        q:slot="center"
        href="/editor"
        class="lum-btn lum-bg-transparent hover:lum-bg-nav-bg rounded-lum-2 hidden sm:flex"
      >
        <RectangleVertical class="h-4 w-4" />
        Portal Editor
      </Link>

      <Link
        q:slot="center"
        href="/faq"
        class="lum-btn lum-bg-transparent hover:lum-bg-nav-bg rounded-lum-2 hidden sm:flex"
      >
        <CircleHelp class="h-4 w-4" />
        F.A.Q
      </Link>

      {session.value && session.value.user && (
        <Dropdown
          align="right"
          q:slot="end"
          class="lum-bg-transparent hover:lum-bg-nav-bg rounded-lum-2"
          id="profile"
          panelProps={{
            class: 'lum-grad-bg-nav-bg',
          }}
        >
          <span q:slot="dropdown" class="text-lum-text flex items-center gap-2">
            {session.value.user.image && (
              <img
                alt={session.value.user.name || 'User'}
                src={session.value.user.image}
                width={20}
                height={20}
                class="h-5 min-w-5 rounded-full!"
              />
            )}
            {session.value.user?.name || 'User'}
          </span>
          <Link
            href="/profile"
            class="lum-btn lum-bg-transparent hover:lum-bg-nav-bg rounded-lum-1"
          >
            <UserIcon size={20} /> Profile
          </Link>
          <Link
            href="/points"
            class="lum-btn lum-bg-transparent hover:lum-bg-nav-bg rounded-lum-1"
          >
            <Gem class="h-4 w-4" />
            <span>
              Points {user && `(${Number(user.points).toLocaleString()})`}
            </span>
          </Link>
          <Form action={signOut}>
            <input type="hidden" name="providerId" value="discord" />
            <input
              type="hidden"
              name="options.redirectTo"
              value={loc.url.pathname + loc.url.search}
            />
            <button class="lum-btn lum-bg-transparent hover:lum-bg-nav-bg rounded-lum-1">
              <LogOut size={20} /> Logout
            </button>
          </Form>
        </Dropdown>
      )}
      {!session.value && (
        <Form action={signIn} q:slot="end">
          <input type="hidden" name="providerId" value="discord" />
          <input
            type="hidden"
            name="options.redirectTo"
            value={loc.url.pathname + loc.url.search}
          />
          <button class="lum-btn lum-bg-transparent hover:lum-bg-nav-bg rounded-lum-2">
            Login
          </button>
        </Form>
      )}
    </LuminescentNav>
  );
});

export default Nav;
