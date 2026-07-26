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
    <>
      {/* Luminescent UI Nav Component */}
      <Nav user={userSig.value} />
      <Slot />
    </>
  );
});
