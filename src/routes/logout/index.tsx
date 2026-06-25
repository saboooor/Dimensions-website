import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { logoutUser } from "../../util/auth";

/**
 * Loader to log the user out and redirect.
 */
export const useLogoutLoader = routeLoader$(async (requestEvent) => {
  logoutUser(requestEvent);
  throw requestEvent.redirect(302, "/login?msg=You have been successfully signed out.");
});

export default component$(() => {
  return (
    <div class="min-h-[calc(100vh-8rem)] flex items-center justify-center">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-500 border-t-transparent mb-4"></div>
        <p class="text-gray-400 text-sm">Signing out...</p>
      </div>
    </div>
  );
});
