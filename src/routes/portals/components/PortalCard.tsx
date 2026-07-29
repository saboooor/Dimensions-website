import { component$, type QRL } from '@qwik.dev/core';
import Heart from 'lucide-icons-qwik/icons/Heart';
import ImageIcon from 'lucide-icons-qwik/icons/Image';
import type { PortalCardData } from '../index';

interface PortalCardProps {
  portal: PortalCardData;
  isLoggedIn: boolean;
  onLike$: QRL<(portalId: number) => void>;
}

export const PortalCard = component$<PortalCardProps>(
  ({ portal, isLoggedIn, onLike$ }) => {
    return (
      <div class="group flex flex-col justify-between rounded-2xl border border-gray-900 bg-gray-900/30 p-4 shadow-md transition-all hover:border-gray-800">
        <div class="flex flex-col gap-3">
          {/* Image preview */}
          {portal.img ? (
            <div class="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border border-gray-900 bg-gray-950">
              <img
                src={portal.img}
                alt="Portal Preview"
                class="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                width="256"
                height="160"
              />
              {portal.public === 0 && (
                <span class="absolute top-2 right-2 rounded border border-gray-800 bg-gray-950/90 px-2 py-0.5 text-[9px] font-semibold tracking-wider text-gray-400 uppercase">
                  Private
                </span>
              )}
            </div>
          ) : (
            <div class="flex h-40 w-full items-center justify-center rounded-xl border border-gray-900 bg-gray-950 text-gray-700">
              <ImageIcon class="h-10 w-10" />
            </div>
          )}

          {/* Portal metadata */}
          <div class="flex items-start justify-between gap-2">
            <div>
              <h3 class="font-bold text-gray-200 transition-colors group-hover:text-white">
                {portal.portalID}
              </h3>
              <p class="mt-0.5 text-[10px] text-gray-500">
                by{' '}
                <a
                  href={`/profile/${portal.maker}`}
                  class="font-semibold underline hover:text-gray-300"
                >
                  {portal.creator}
                </a>
              </p>
            </div>
            <button
              onClick$={() => onLike$(portal.id)}
              disabled={!isLoggedIn}
              class={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all ${
                portal.isLiked
                  ? 'border-red-900/30 bg-red-950/20 text-red-500'
                  : 'border-gray-900 bg-gray-950/40 text-gray-500 hover:text-gray-300'
              }`}
            >
              <Heart
                class={`h-3.5 w-3.5 ${portal.isLiked ? 'fill-current' : ''}`}
              />
              <span>{portal.likesCount}</span>
            </button>
          </div>
        </div>

        {/* Open button */}
        <a
          href={`/editor/?portal=${portal.id}`}
          class="border-gray-850 mt-4 w-full rounded-lg border bg-gray-900 py-2 text-center text-xs font-semibold text-gray-300 transition-all hover:bg-gray-800"
        >
          Open in Editor
        </a>
      </div>
    );
  }
);
