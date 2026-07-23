import { component$ } from '@qwik.dev/core';
import { routeLoader$, Form } from '@qwik.dev/router';
import CheckCircle2 from 'lucide-icons-qwik/icons/CheckCircle2';
import AlertTriangle from 'lucide-icons-qwik/icons/AlertTriangle';
import SiDiscord from 'simple-icons-qwik/icons/SiDiscord';
import { getSessionUserId } from '../../util/auth';
import { useSignIn } from '~/routes/plugin@auth';

/**
 * Loader to handle:
 * 1. Redirecting already logged-in users to home.
 * 2. Mapping Auth.js Discord OAuth error parameters to friendly messages.
 */
export const useLoginLoader = routeLoader$((requestEvent) => {
  // If already logged in, redirect to home
  const userId = getSessionUserId(requestEvent);
  if (userId) {
    throw requestEvent.redirect(302, '/');
  }

  const msg = requestEvent.url.searchParams.get('msg') || '';
  const error = requestEvent.url.searchParams.get('error') || '';

  let errorMsg = '';
  if (error) {
    if (error === 'CallbackRouteError') {
      errorMsg = 'Failed to sign in with Discord. Please try again.';
    } else {
      errorMsg = `Authentication failed: ${error}`;
    }
  }

  return {
    successMsg: msg,
    errorMsg,
  };
});

export default component$(() => {
  const loaderSig = useLoginLoader();
  const signInSig = useSignIn();

  return (
    <div class="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center py-6">
      <div class="w-full max-w-md rounded-2xl border border-gray-800/80 bg-gray-900/50 p-8 shadow-xl backdrop-blur-md">
        {/* Header */}
        <div class="mb-8 text-center">
          <a
            href="/"
            class="mb-3 inline-flex items-center justify-center gap-2"
          >
            {/* eslint-disable-next-line qwik/jsx-img-tag */}
            <img
              src="/assets/img/logo.png"
              alt="Dimensions Logo"
              class="h-10 w-10 object-contain"
              width="40"
              height="40"
            />
            <span class="bg-gradient-to-r from-gray-500 to-gray-300 bg-clip-text text-2xl font-bold tracking-wide text-transparent">
              Dimensions
            </span>
          </a>
          <h1 class="text-xl font-bold text-gray-100">Login to Dimensions</h1>
          <p class="mt-1 text-sm text-gray-500">
            Sign in with your Discord account to get started
          </p>
        </div>

        {/* Notifications */}
        {loaderSig.value.successMsg && (
          <div class="animate-in fade-in mb-4 flex items-start gap-2 rounded-lg border border-emerald-900/50 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-400 duration-200">
            <CheckCircle2 class="mt-0.5 h-4 w-4 text-emerald-500" />
            <span>{loaderSig.value.successMsg}</span>
          </div>
        )}

        {loaderSig.value.errorMsg && (
          <div class="animate-in fade-in mb-4 flex items-start gap-2 rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-400 duration-200">
            <AlertTriangle class="mt-0.5 h-4 w-4 text-red-500" />
            <span>{loaderSig.value.errorMsg}</span>
          </div>
        )}

        {/* Discord OAuth Form */}
        <Form action={signInSig}>
          <input type="hidden" name="providerId" value="discord" />
          <input type="hidden" name="options.redirectTo" value="/" />
          <button
            type="submit"
            disabled={signInSig.isRunning}
            class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#5865F2] py-2.5 font-semibold text-white shadow-md transition-all hover:bg-[#4752C4] focus:outline-none disabled:bg-[#3b429f]"
          >
            {signInSig.isRunning &&
            signInSig.formData?.get('providerId') === 'discord' ? (
              <span>Connecting to Discord...</span>
            ) : (
              <>
                <SiDiscord class="h-4 w-4" />
                <span>Sign in with Discord</span>
              </>
            )}
          </button>
        </Form>
      </div>
    </div>
  );
});
