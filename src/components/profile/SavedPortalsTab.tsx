import { component$ } from '@qwik.dev/core';
import Image from 'lucide-icons-qwik/icons/Image';

interface SavedPortalsTabProps {
  portals: any[];
}

export const SavedPortalsTab = component$<SavedPortalsTabProps>(
  ({ portals }) => {
    return (
      <div class="animate-in fade-in rounded-2xl border border-gray-900 bg-gray-900/30 p-6 duration-200">
        <h2 class="mb-4 text-sm font-bold tracking-wider text-gray-500 uppercase">
          Saved Portals
        </h2>
        {portals.length > 0 ? (
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {portals.map((portal, idx) => (
              <div
                key={idx}
                class="group flex flex-col justify-between rounded-xl border border-gray-900 bg-gray-950/40 p-4 transition-all hover:border-gray-800"
              >
                <div class="space-y-3">
                  {portal.img ? (
                    <div class="flex h-28 w-full items-center justify-center overflow-hidden rounded-lg border border-gray-900 bg-gray-950">
                      <img
                        src={portal.img}
                        alt="Portal Preview"
                        class="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                        width="200"
                        height="112"
                      />
                    </div>
                  ) : (
                    <div class="flex h-28 w-full items-center justify-center rounded-lg bg-gray-900/50 text-gray-600">
                      <Image class="h-8 w-8 text-gray-600" />
                    </div>
                  )}
                  <div>
                    <h4 class="text-sm font-bold text-gray-200 transition-colors group-hover:text-white">
                      {portal.portalID}
                    </h4>
                    <p class="mt-0.5 text-[10px] text-gray-500">
                      Likes: {portal.likesCount} •{' '}
                      {portal.public === 1 ? 'Public' : 'Private'}
                    </p>
                  </div>
                </div>

                <a
                  href={`/editor/portal/?portal=${portal.id}`}
                  class="border-gray-850 mt-4 w-full rounded-lg border bg-gray-900 py-1.5 text-center text-[10px] font-bold text-gray-300 transition-all hover:bg-gray-800"
                >
                  Open in Editor
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p class="text-sm text-gray-500 italic">No saved portals found.</p>
        )}
      </div>
    );
  }
);
