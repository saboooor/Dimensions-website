import { component$, Slot } from "@builder.io/qwik";
import { routeLoader$, useLocation, Link } from "@builder.io/qwik-city";
import { Nav, SelectMenuRaw } from "@luminescent/ui-qwik";
import { getSessionUser } from "../util/auth";

/**
 * Global route loader to fetch the logged-in user's session data.
 */
export const useSessionUser = routeLoader$(async (requestEvent) => {
  return await getSessionUser(requestEvent);
});

export default component$(() => {
  const userSig = useSessionUser();
  const loc = useLocation();

  const user = userSig.value;
  const isAdmin = user && ["admin", "developer"].includes(user.rank.toLowerCase());

  return (
    <div class="min-h-screen flex flex-col text-gray-100">
      {/* Background ambient lighting */}
      <div class="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] -z-1 bg-gradient-to-b from-gray-500/5 via-transparent to-transparent blur-3xl pointer-events-none rounded-full"></div>

      {/* Luminescent UI Nav Component */}
      <Nav fixed colorClass="lum-grad-bg-nav-bg border-b border-lum-border/10 shadow-lg font-bold text-sm tracking-wide">
        {/* start slot: branding */}
        <Link q:slot="start" href="/" class="lum-btn lum-bg-transparent hover:lum-bg-nav-bg p-2 flex items-center gap-2">
          <img
            src="/assets/img/logo.png"
            alt="Logo"
            width={24}
            height={24}
            class="h-6 w-6 object-contain"
          />
          <span class="font-black tracking-tight bg-gradient-to-r from-gray-500 to-gray-300 bg-clip-text text-transparent">
            DIMENSIONS
          </span>
        </Link>

        {/* end slot: navigation links */}
        <Link
          q:slot="end"
          href="/"
          class={`lum-btn lum-bg-transparent hover:lum-bg-nav-bg hidden sm:flex ${
            loc.url.pathname === "/" ? "text-gray-500" : "text-gray-400"
          }`}
        >
          Home
        </Link>
        <Link
          q:slot="end"
          href="/portals"
          class={`lum-btn lum-bg-transparent hover:lum-bg-nav-bg hidden sm:flex ${
            loc.url.pathname.startsWith("/portals") ? "text-gray-500" : "text-gray-400"
          }`}
        >
          Portals
        </Link>
        <Link
          q:slot="end"
          href="/points"
          class={`lum-btn lum-bg-transparent hover:lum-bg-nav-bg hidden sm:flex ${
            loc.url.pathname.startsWith("/points") ? "text-gray-500" : "text-gray-400"
          }`}
        >
          Points
        </Link>
        <Link
          q:slot="end"
          href="/faq"
          class={`lum-btn lum-bg-transparent hover:lum-bg-nav-bg hidden sm:flex ${
            loc.url.pathname.startsWith("/faq") ? "text-gray-500" : "text-gray-400"
          }`}
        >
          F.A.Q
        </Link>

        {/* end slot: user points indicator (desktop) */}
        {user && (
          <Link
            q:slot="end"
            href="/points"
            class="px-3 py-1 bg-gray-500/10 border border-gray-500/25 text-gray-400 text-xs font-bold rounded-xl hover:bg-gray-500/15 transition-all flex items-center gap-1.5 hidden sm:flex ml-4 mr-2"
          >
            <i class="bi bi-gem"></i>
            <span>{Number(user.points).toLocaleString()}</span>
          </Link>
        )}

        {/* end slot: profile dropdown or login button (desktop) */}
        {user ? (
          <SelectMenuRaw
            align="right"
            q:slot="end"
            class={{ "p-2 lum-bg-transparent hover:lum-bg-nav-bg gap-1 hidden sm:flex": true }}
            id="profile-dropdown"
            customDropdown
            panelClass="lum-grad-bg-nav-bg"
          >
            <div q:slot="dropdown" class="flex items-center gap-2 text-lum-text font-bold">
              <img
                src={user.profileImage || "/assets/img/guest.png"}
                alt="Profile"
                width={20}
                height={20}
                class="h-5 w-5 rounded-full border border-gray-800 object-cover"
              />
              <span>{user.username}</span>
            </div>
            <Link
              q:slot="extra-buttons"
              href={`/profile/${user.id}`}
              class="lum-btn lum-bg-transparent hover:lum-bg-nav-bg rounded-lum-1 justify-start gap-2 text-gray-300"
            >
              <i class="bi bi-person text-sm"></i>
              <span>Profile</span>
            </Link>
            {isAdmin && (
              <Link
                q:slot="extra-buttons"
                href="/admin-tools"
                class="lum-btn lum-bg-transparent hover:lum-bg-nav-bg rounded-lum-1 justify-start gap-2 text-gray-300"
              >
                <i class="bi bi-sliders text-sm"></i>
                <span>Admin Tools</span>
              </Link>
            )}
            <Link
              q:slot="extra-buttons"
              href="/logout"
              class="lum-btn lum-bg-transparent hover:lum-bg-nav-bg rounded-lum-1 justify-start gap-2 text-red-400"
            >
              <i class="bi bi-box-arrow-right text-sm"></i>
              <span>Logout</span>
            </Link>
          </SelectMenuRaw>
        ) : (
          <Link
            q:slot="end"
            href="/login"
            class="lum-btn px-4 py-1.5 lum-grad-bg-lum-accent text-white rounded-xl text-xs font-bold shadow-lg hover:shadow-gray-500/20 transition-all hidden sm:flex ml-4"
          >
            Login
          </Link>
        )}

        {/* mobile slot: collapsible menu items */}
        <Link
          q:slot="mobile"
          href="/"
          class={`lum-btn lum-bg-transparent hover:lum-bg-nav-bg justify-start gap-2 ${
            loc.url.pathname === "/" ? "text-gray-500" : "text-gray-400"
          }`}
        >
          <i class="bi bi-house-door"></i>
          <span>Home</span>
        </Link>
        <Link
          q:slot="mobile"
          href="/portals"
          class={`lum-btn lum-bg-transparent hover:lum-bg-nav-bg justify-start gap-2 ${
            loc.url.pathname.startsWith("/portals") ? "text-gray-500" : "text-gray-400"
          }`}
        >
          <i class="bi bi-grid-3x3-gap"></i>
          <span>Portals</span>
        </Link>
        <Link
          q:slot="mobile"
          href="/points"
          class={`lum-btn lum-bg-transparent hover:lum-bg-nav-bg justify-start gap-2 ${
            loc.url.pathname.startsWith("/points") ? "text-gray-500" : "text-gray-400"
          }`}
        >
          <i class="bi bi-gem"></i>
          <span>Points {user && `(${Number(user.points).toLocaleString()})`}</span>
        </Link>
        <Link
          q:slot="mobile"
          href="/faq"
          class={`lum-btn lum-bg-transparent hover:lum-bg-nav-bg justify-start gap-2 ${
            loc.url.pathname.startsWith("/faq") ? "text-gray-500" : "text-gray-400"
          }`}
        >
          <i class="bi bi-question-circle"></i>
          <span>F.A.Q</span>
        </Link>

        {user ? (
          <>
            <div q:slot="mobile" class="h-px bg-gray-800/60 my-1 mx-2" />
            <Link
              q:slot="mobile"
              href={`/profile/${user.id}`}
              class={`lum-btn lum-bg-transparent hover:lum-bg-nav-bg justify-start gap-2 ${
                loc.url.pathname.startsWith("/profile") ? "text-gray-500" : "text-gray-400"
              }`}
            >
              <i class="bi bi-person"></i>
              <span>Profile ({user.username})</span>
            </Link>
            {isAdmin && (
              <Link
                q:slot="mobile"
                href="/admin-tools"
                class={`lum-btn lum-bg-transparent hover:lum-bg-nav-bg justify-start gap-2 ${
                  loc.url.pathname.startsWith("/admin-tools") ? "text-gray-500" : "text-gray-400"
                }`}
              >
                <i class="bi bi-sliders"></i>
                <span>Admin Tools</span>
              </Link>
            )}
            <Link
              q:slot="mobile"
              href="/logout"
              class="lum-btn lum-bg-transparent hover:lum-bg-nav-bg justify-start gap-2 text-red-400"
            >
              <i class="bi bi-box-arrow-right"></i>
              <span>Logout</span>
            </Link>
          </>
        ) : (
          <>
            <div q:slot="mobile" class="h-px bg-gray-800/60 my-1 mx-2" />
            <Link
              q:slot="mobile"
              href="/login"
              class="lum-btn lum-bg-transparent hover:lum-bg-nav-bg justify-start gap-2 text-gray-300"
            >
              <i class="bi bi-box-arrow-in-right"></i>
              <span>Login</span>
            </Link>
          </>
        )}
      </Nav>

      {/* Main Centered Content */}
      <main class="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-24 md:pt-28 pb-32">
        <Slot />
      </main>
    </div>
  );
});
