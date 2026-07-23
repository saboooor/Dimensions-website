import { component$ } from '@qwik.dev/core';
import { routeLoader$ } from '@qwik.dev/router';
import { logoutUser } from '../../util/auth';

/**
 * Loader to log the user out and redirect.
 */
export const useLogoutLoader = routeLoader$((requestEvent) => {
  logoutUser(requestEvent);
  throw requestEvent.redirect(
    302,
    '/login?msg=You have been successfully signed out.'
  );
});

export default component$(() => {
  return (
    <div class="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <div class="text-center">
        <div class="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-500 border-t-transparent"></div>
        <p class="text-sm text-gray-400">Signing out...</p>
      </div>
    </div>
  );
});
