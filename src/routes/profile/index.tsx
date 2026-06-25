import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { getSessionUserId } from "../../util/auth";

/**
 * Loader to redirect '/profile' to '/profile/[loggedInUserId]'
 */
export const useProfileIndexLoader = routeLoader$(async (requestEvent) => {
  const userId = getSessionUserId(requestEvent);
  if (userId === 0) {
    throw requestEvent.redirect(302, "/login");
  }
  throw requestEvent.redirect(302, `/profile/${userId}`);
});

export default component$(() => {
  return null;
});
