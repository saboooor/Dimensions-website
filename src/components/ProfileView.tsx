import { component$, useSignal, $ } from '@qwik.dev/core';
import { ProfileBanner } from './profile/ProfileBanner';
import { OverviewTab } from './profile/OverviewTab';
import { SettingsTab } from './profile/SettingsTab';
import { LinkedAccountsTab } from './profile/LinkedAccountsTab';
import { SavedPortalsTab } from './profile/SavedPortalsTab';
import { CosmeticsTab } from './profile/CosmeticsTab';

export interface ProfileViewProps {
  profileUser: {
    id: string;
    username: string | null;
    rank: string | null;
    discordAccount: string | null;
    minecraftAccount: string | null;
    verifiedPaypal: string | null;
    profileImage: string | null;
  };
  isSelf: boolean;
  earnedBadges: any[];
  portals: any[];
  availableCosmetics: any[];
  currentCosmetics: {
    postIgnitePortal: string;
    postUsePortal: string;
    postDestroyPortal: string;
    onPortalTick: string;
  };
  updateAvatarAction: any;
  removeAvatarAction: any;
  updateCosmeticsAction: any;
  changeUsernameAction: any;
}

export const ProfileView = component$<ProfileViewProps>(
  ({
    profileUser,
    isSelf,
    earnedBadges,
    portals,
    availableCosmetics,
    currentCosmetics,
    updateAvatarAction,
    removeAvatarAction: _removeAvatarAction,
    updateCosmeticsAction,
    changeUsernameAction,
  }) => {
    const activeTab = useSignal('overview');

    const onAvatarFileChange = $((event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 1024 * 1024) {
          alert('Image must be smaller than 1MB.');
          return;
        }
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          await updateAvatarAction.submit({ avatarData: base64 });
        };
        reader.readAsDataURL(file);
      }
    });

    const tabButtonClass = (tab: string) =>
      `px-4 py-2 border-b-2 text-sm font-semibold whitespace-nowrap focus:outline-none transition-colors ${
        activeTab.value === tab
          ? 'border-gray-500 text-gray-500'
          : 'border-transparent text-gray-400 hover:text-gray-200'
      }`;

    return (
      <section
        class="relative flex min-h-svh flex-col overflow-hidden p-6 pt-20"
        style={{
          '--lum-border-radius': '1.5rem',
        }}
      >
        <div class="mx-auto w-full max-w-4xl space-y-8">
          <ProfileBanner
            profileUser={profileUser}
            isSelf={isSelf}
            onAvatarFileChange={onAvatarFileChange}
          />

          {/* Navigation Tabs */}
          <div class="no-scrollbar flex gap-2 overflow-x-auto border-b border-gray-900">
            <button
              onClick$={() => (activeTab.value = 'overview')}
              class={tabButtonClass('overview')}
            >
              Overview
            </button>
            {isSelf && (
              <>
                <button
                  onClick$={() => (activeTab.value = 'settings')}
                  class={tabButtonClass('settings')}
                >
                  Settings
                </button>
                <button
                  onClick$={() => (activeTab.value = 'links')}
                  class={tabButtonClass('links')}
                >
                  Linked Accounts
                </button>
              </>
            )}
            <button
              onClick$={() => (activeTab.value = 'portals')}
              class={tabButtonClass('portals')}
            >
              Saved Portals ({portals.length})
            </button>
            {isSelf && (
              <button
                onClick$={() => (activeTab.value = 'cosmetics')}
                class={tabButtonClass('cosmetics')}
              >
                In-Game Cosmetics
              </button>
            )}
          </div>

          {/* Tab Panes */}
          <div class="min-h-[200px]">
            {activeTab.value === 'overview' && (
              <OverviewTab earnedBadges={earnedBadges} />
            )}

            {activeTab.value === 'settings' && isSelf && (
              <SettingsTab
                currentUsername={profileUser.username}
                changeUsernameAction={changeUsernameAction}
              />
            )}

            {activeTab.value === 'links' && isSelf && (
              <LinkedAccountsTab
                discordAccount={profileUser.discordAccount}
                minecraftAccount={profileUser.minecraftAccount}
                verifiedPaypal={profileUser.verifiedPaypal}
              />
            )}

            {activeTab.value === 'portals' && (
              <SavedPortalsTab portals={portals} />
            )}

            {activeTab.value === 'cosmetics' && isSelf && (
              <CosmeticsTab
                minecraftAccount={profileUser.minecraftAccount}
                availableCosmetics={availableCosmetics}
                currentCosmetics={currentCosmetics}
                updateCosmeticsAction={updateCosmeticsAction}
              />
            )}
          </div>
        </div>
      </section>
    );
  }
);
