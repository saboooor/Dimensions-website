import { component$ } from '@qwik.dev/core';
import { Form } from '@qwik.dev/router';
import IdCard from 'lucide-icons-qwik/icons/IdCard';

interface SettingsTabProps {
  currentUsername: string | null;
  changeUsernameAction: any;
}

export const SettingsTab = component$<SettingsTabProps>(
  ({ currentUsername, changeUsernameAction }) => {
    return (
      <div class="animate-in fade-in space-y-6 duration-200">
        <div class="space-y-4 rounded-2xl border border-gray-900 bg-gray-900/30 p-6">
          <h3 class="flex items-center gap-2 border-b border-gray-900 pb-2 font-bold text-gray-200">
            <IdCard class="h-4 w-4 text-gray-500" />
            <span>Change Username</span>
          </h3>
          {changeUsernameAction.value && (
            <div
              class={`rounded-lg border p-3 text-xs ${
                changeUsernameAction.value.success
                  ? 'border-emerald-900/50 bg-emerald-950/40 text-emerald-400'
                  : 'border-red-900/50 bg-red-950/40 text-red-400'
              }`}
            >
              {changeUsernameAction.value.message}
            </div>
          )}
          <Form action={changeUsernameAction} class="max-w-md space-y-4">
            <div>
              <label class="mb-1.5 block text-xs text-gray-400">
                New Username
              </label>
              <input
                type="text"
                name="newUsername"
                required
                placeholder={currentUsername || ''}
                class="border-gray-850 block w-full rounded-lg border bg-gray-950 px-3.5 py-2 text-sm text-gray-200 focus:border-gray-500 focus:outline-none"
              />
              <p class="mt-1.5 text-[10px] text-gray-500">
                3–32 characters, letters, numbers and underscores only.
              </p>
            </div>
            <button
              type="submit"
              class="rounded-lg bg-gray-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-gray-500"
            >
              Update Username
            </button>
          </Form>
        </div>
      </div>
    );
  }
);
