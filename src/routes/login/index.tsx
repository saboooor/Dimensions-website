import { component$ } from "@builder.io/qwik";
import { routeLoader$, Form } from "@builder.io/qwik-city";
import { getSessionUserId } from "../../util/auth";
import { useSignIn } from "~/routes/plugin@auth";

/**
 * Loader to handle:
 * 1. Redirecting already logged-in users to home.
 * 2. Mapping Auth.js Discord OAuth error parameters to friendly messages.
 */
export const useLoginLoader = routeLoader$(async (requestEvent) => {
  // If already logged in, redirect to home
  const userId = getSessionUserId(requestEvent);
  if (userId > 0) {
    throw requestEvent.redirect(302, "/");
  }

  const msg = requestEvent.url.searchParams.get("msg") || "";
  const error = requestEvent.url.searchParams.get("error") || "";

  let errorMsg = "";
  if (error) {
    if (error === "CallbackRouteError") {
      errorMsg = "Failed to sign in with Discord. Please try again.";
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
    <div class="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center py-6">
      <div class="w-full max-w-md bg-gray-900/50 backdrop-blur-md border border-gray-800/80 rounded-2xl p-8 shadow-xl">
        {/* Header */}
        <div class="text-center mb-8">
          <a href="/" class="inline-flex items-center gap-2 mb-3 justify-center">
            <img src="/assets/img/logo.png" alt="Dimensions Logo" class="h-10 w-10 object-contain" />
            <span class="font-bold text-2xl tracking-wide bg-gradient-to-r from-gray-500 to-gray-300 bg-clip-text text-transparent">
              Dimensions
            </span>
          </a>
          <h1 class="text-xl font-bold text-gray-100">Login to Dimensions</h1>
          <p class="text-sm text-gray-500 mt-1">Sign in with your Discord account to get started</p>
        </div>

        {/* Notifications */}
        {loaderSig.value.successMsg && (
          <div class="mb-4 bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 text-sm px-4 py-3 rounded-lg flex items-start gap-2 animate-in fade-in duration-200">
            <i class="bi bi-check-circle-fill text-emerald-500 mt-0.5"></i>
            <span>{loaderSig.value.successMsg}</span>
          </div>
        )}

        {loaderSig.value.errorMsg && (
          <div class="mb-4 bg-red-950/40 border border-red-900/50 text-red-400 text-sm px-4 py-3 rounded-lg flex items-start gap-2 animate-in fade-in duration-200">
            <i class="bi bi-exclamation-triangle-fill text-red-500 mt-0.5"></i>
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
            class="w-full bg-[#5865F2] hover:bg-[#4752C4] disabled:bg-[#3b429f] text-white font-semibold py-2.5 rounded-lg transition-all shadow-md focus:outline-none flex justify-center items-center gap-2 cursor-pointer"
          >
            {signInSig.isRunning && signInSig.formData?.get("providerId") === "discord" ? (
              <span>Connecting to Discord...</span>
            ) : (
              <>
                <i class="bi bi-discord"></i>
                <span>Sign in with Discord</span>
              </>
            )}
          </button>
        </Form>
      </div>
    </div>
  );
});
