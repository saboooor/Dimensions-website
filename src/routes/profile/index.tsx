import { component$ } from '@qwik.dev/core';
import { routeLoader$ } from '@qwik.dev/router';
import { getSessionUserId } from '../../util/auth';

/**
 * Loader to redirect '/profile' to '/profile/[loggedInUserId]'
 */
export const useProfileIndexLoader = routeLoader$((requestEvent) => {
  const userId = getSessionUserId(requestEvent);
  if (!userId) {
    throw requestEvent.redirect(302, '/login');
  }
  throw requestEvent.redirect(302, `/profile/${userId}`);
});

export default component$(() => {
  return null;
});
