import { component$ } from '@qwik.dev/core';
import Camera from 'lucide-icons-qwik/icons/Camera';
import Gamepad2 from 'lucide-icons-qwik/icons/Gamepad2';

interface ProfileBannerProps {
  profileUser: {
    username: string | null;
    rank: string | null;
    minecraftAccount: string | null;
    profileImage: string | null;
  };
  isSelf: boolean;
  onAvatarFileChange: any;
}

export const ProfileBanner = component$<ProfileBannerProps>(
  ({ profileUser, isSelf, onAvatarFileChange }) => {
    return (
      <div class="flex flex-col items-center gap-6 rounded-2xl border border-gray-900 bg-gray-900/40 p-6 shadow-xl sm:flex-row">
        <div class="group relative">
          <img
            src={profileUser.profileImage || '/assets/img/guest.png'}
            alt="Profile Avatar"
            class="h-24 w-24 rounded-full border-2 border-gray-800 bg-gray-950 object-cover"
            width="96"
            height="96"
          />
          {isSelf && (
            <div class="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
              <label for="avatarUpload" class="cursor-pointer p-2 text-white">
                <Camera class="h-5 w-5" />
              </label>
              <input
                type="file"
                id="avatarUpload"
                accept="image/*"
                class="hidden"
                onChange$={onAvatarFileChange}
              />
            </div>
          )}
        </div>

        <div class="flex flex-1 flex-col gap-2 text-center sm:text-left">
          <h1 class="text-2xl font-black text-gray-100">
            {profileUser.username}
          </h1>
          <div class="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span class="border-gray-850 rounded-full border bg-gray-950 px-3 py-1 text-xs font-semibold text-gray-400">
              Rank: {profileUser.rank || 'Member'}
            </span>
            {profileUser.minecraftAccount && (
              <span class="flex items-center gap-1 rounded-full border border-emerald-900/30 bg-emerald-950/20 px-3 py-1 text-xs font-semibold text-emerald-400">
                <Gamepad2 class="h-4 w-4" />
                <span>Linked Minecraft</span>
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
);
