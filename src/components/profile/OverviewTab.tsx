import { component$ } from '@qwik.dev/core';

interface BadgeItem {
  id?: number | string;
  name?: string;
  description?: string;
  icon?: string;
}

interface OverviewTabProps {
  earnedBadges: BadgeItem[];
}

export const OverviewTab = component$<OverviewTabProps>(({ earnedBadges }) => {
  return (
    <div class="animate-in fade-in space-y-6 rounded-2xl border border-gray-900 bg-gray-900/30 p-6 duration-200">
      <div class="space-y-2">
        <h3 class="text-sm font-bold tracking-wider text-gray-500 uppercase">
          Badges
        </h3>
        <div class="flex flex-wrap gap-3">
          {earnedBadges.length > 0 ? (
            earnedBadges.map((badge: BadgeItem, idx: number) => (
              <div
                key={idx}
                class="flex items-center gap-2 rounded-xl border border-gray-900 bg-gray-950 px-4 py-2 text-gray-300 shadow-sm transition-all hover:border-gray-800"
                title={badge.description}
              >
                <i class={`${badge.icon} text-lg text-gray-500`}></i>
                <div class="text-left">
                  <p class="text-xs font-bold text-gray-200">{badge.name}</p>
                  <p class="mt-0.5 text-[10px] leading-none text-gray-500">
                    {badge.description}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p class="text-sm text-gray-500 italic">No badges earned yet...</p>
          )}
        </div>
      </div>
    </div>
  );
});
