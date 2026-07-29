import { component$ } from '@qwik.dev/core';
import { Form } from '@qwik.dev/router';
import { Label } from '@luminescent/ui-qwik';
import IdCard from 'lucide-icons-qwik/icons/IdCard';

interface SettingsTabProps {
  currentUsername: string | null;
  changeUsernameAction: any;
}

export const SettingsTab = component$<SettingsTabProps>(
  ({ currentUsername, changeUsernameAction }) => {
    return (
      <div class="animate-in fade-in flex flex-col gap-6 duration-200">
        <div class="lum-card flex flex-col gap-4 p-6">
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
          <Form
            action={changeUsernameAction}
            class="flex max-w-md flex-col gap-4"
          >
            <Label for="newUsername" label="New Username">
              <input
                id="newUsername"
                type="text"
                name="newUsername"
                required
                placeholder={currentUsername || ''}
                class="lum-input w-full"
              />
            </Label>
            <p class="text-[10px] text-gray-500">
              3–32 characters, letters, numbers and underscores only.
            </p>
            <button
              type="submit"
              class="lum-btn cursor-pointer font-bold text-white"
            >
              Update Username
            </button>
          </Form>
        </div>
      </div>
    );
  }
);
