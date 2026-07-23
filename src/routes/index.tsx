import { component$ } from '@qwik.dev/core';
import type { DocumentHead } from '@qwik.dev/router';
import ArrowRight from 'lucide-icons-qwik/icons/ArrowRight';
import Download from 'lucide-icons-qwik/icons/Download';
import Sparkles from 'lucide-icons-qwik/icons/Sparkles';
import Palette from 'lucide-icons-qwik/icons/Palette';
import DoorOpen from 'lucide-icons-qwik/icons/DoorOpen';
import InfinityIcon from 'lucide-icons-qwik/icons/InfinityIcon';
import MessageSquareHeart from 'lucide-icons-qwik/icons/MessageSquareHeart';
import Gift from 'lucide-icons-qwik/icons/Gift';

export default component$(() => {
  const features = [
    {
      title: 'Custom Nether-Styled Portals',
      description:
        'Design and build your own unique nether-styled portals with custom frame materials, interior blocks, and lighter items.',
      Icon: DoorOpen,
      color:
        'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30',
    },
    {
      title: 'Infinite Possibilities & Features',
      description:
        "Whatever custom portal mechanic your Minecraft server requires, Dimensions supports it. If it doesn't, request it and we will build it.",
      Icon: InfinityIcon,
      color: 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30',
    },
    {
      title: 'Ultra-Fast Support',
      description:
        'Got questions or need help setting up? Unless we are sleeping, we respond to support requests on Discord in less than 30 minutes.',
      Icon: MessageSquareHeart,
      color: 'from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30',
    },
    {
      title: 'Free & Open Base Plugin',
      description:
        'Dimensions and its extensive core features are provided completely for free. Extra cosmetic features can be unlocked easily.',
      Icon: Gift,
      color:
        'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
    },
  ];

  return (
    <div class="space-y-12">
      {/* Hero Section */}
      <div class="lum-card lum-grad-bg-gray-950/40 rounded-lum relative flex flex-col items-center justify-between gap-8 overflow-hidden p-8 text-center shadow-2xl md:flex-row md:p-12 md:text-left">
        <div class="z-10 max-w-xl space-y-4">
          <h1 class="text-3xl leading-tight font-extrabold tracking-tight text-gray-100 md:text-4xl lg:text-5xl">
            This is{' '}
            <span class="bg-gradient-to-r from-gray-500 to-gray-300 bg-clip-text text-transparent">
              Dimensions
            </span>
          </h1>
          <p class="text-sm leading-relaxed text-gray-400 md:text-base">
            The ultimate Minecraft plugin to build, customize, and manage custom
            portals without limits. Fully integrated with Discord, Patreon, and
            in-game cosmetics.
          </p>
          <div class="flex flex-wrap items-center justify-center gap-3 pt-2 md:justify-start">
            <a
              href="/editor/portal"
              class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gray-600 to-gray-400 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-gray-500 hover:to-gray-300"
            >
              <span>Launch Portal Editor</span>
              <ArrowRight class="h-4 w-4" />
            </a>
            <a
              href="/portals"
              class="hover:bg-gray-850 flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900 px-5 py-2.5 text-sm font-semibold text-gray-300 transition-all"
            >
              <Download class="h-4 w-4" />
              <span>Browse Portals</span>
            </a>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <section class="space-y-6">
        <h2 class="flex items-center gap-2 text-xl font-bold text-gray-200">
          <Sparkles class="h-5 w-5 text-gray-500" />
          <span>Core Plugin Features</span>
        </h2>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          {features.map((feature, idx) => (
            <div
              key={idx}
              class="lum-card group lum-grad-bg-gray-950/40 rounded-lum p-6 shadow-md transition-all"
            >
              <div class="flex items-start gap-4">
                <div
                  class={`flex-shrink-0 rounded-xl border bg-gradient-to-br p-3 transition-transform duration-300 group-hover:scale-110 ${feature.color}`}
                >
                  <feature.Icon class="h-6 w-6" />
                </div>
                <div class="space-y-1.5">
                  <h3 class="font-semibold text-gray-100 transition-colors group-hover:text-white">
                    {feature.title}
                  </h3>
                  <p class="text-xs leading-relaxed text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Editors Callout */}
      <div class="lum-card lum-grad-bg-gray-950/40 rounded-lum flex flex-col items-center justify-between gap-6 p-6 md:flex-row md:p-8">
        <div class="max-w-xl space-y-2 text-center md:text-left">
          <h3 class="flex items-center justify-center gap-2 text-lg font-bold text-gray-200 md:justify-start">
            <Palette class="h-5 w-5 text-gray-300" />
            <span>Interactive Visual Editors</span>
          </h3>
          <p class="text-xs leading-relaxed text-gray-400">
            If configuring text files feels tedious, use our interactive visual
            editors. Build your custom portals and particle designs in the
            browser and instantly download the YAML config or save it to your
            account!
          </p>
        </div>
        <div class="flex items-center gap-3">
          <a
            href="/editor/portal"
            class="rounded-xl bg-gray-400 px-4 py-2.5 text-xs font-semibold whitespace-nowrap text-white transition-colors hover:bg-gray-300"
          >
            Portal Editor
          </a>
          <a
            href="/editor/particle"
            class="hover:bg-gray-850 rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-xs font-semibold whitespace-nowrap text-gray-300 transition-colors"
          >
            Particle Editor
          </a>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Dimensions - Custom Minecraft Portals',
  meta: [
    {
      name: 'description',
      content:
        'Welcome to Dimensions, the ultimate custom portals plugin for Minecraft servers. Design nether-styled portals, custom particles, and link with Discord and Patreon.',
    },
  ],
};
