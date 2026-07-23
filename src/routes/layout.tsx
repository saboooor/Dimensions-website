import { component$, Slot } from '@qwik.dev/core';
import { routeLoader$ } from '@qwik.dev/router';
import { getSessionUser } from '../util/auth';
import Nav from '../components/Nav';

/**
 * Global route loader to fetch the logged-in user's session data.
 */
export const useSessionUser = routeLoader$(async (requestEvent) => {
  return await getSessionUser(requestEvent);
});

export default component$(() => {
  const userSig = useSessionUser();

  return (
    <div class="flex min-h-screen flex-col text-gray-100">
      {/* Luminescent UI Nav Component */}
      <Nav user={userSig.value} />

      {/* Background ambient lighting */}
      <div class="pointer-events-none fixed top-0 left-1/2 -z-1 h-125 w-full max-w-7xl -translate-x-1/2 rounded-full bg-linear-to-b from-gray-500/5 via-transparent to-transparent blur-3xl"></div>

      {/* Main Centered Content */}
      <main class="mx-auto w-full max-w-5xl flex-1 px-4 pt-24 pb-32 sm:px-6 md:px-8 md:pt-28">
        <Slot />
      </main>
    </div>
  );
});
