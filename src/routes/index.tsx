import { component$ } from '@qwik.dev/core';
import { Link, type DocumentHead } from '@qwik.dev/router';
import Palette from 'lucide-icons-qwik/icons/Palette';
import BookOpen from 'lucide-icons-qwik/icons/BookOpen';
import DoorOpen from 'lucide-icons-qwik/icons/DoorOpen';
import InfinityIcon from 'lucide-icons-qwik/icons/InfinityIcon';
import MessageSquareHeart from 'lucide-icons-qwik/icons/MessageSquareHeart';
import RectangleVertical from 'lucide-icons-qwik/icons/RectangleVertical';
import Sparkle from 'lucide-icons-qwik/icons/Sparkle';
import { Hoverable } from '@luminescent/ui-qwik';
//@ts-expect-error vite imagetools
import Background from '~/images/Background.png?jsx&format=avif&w=1280;1920;2560;3840';

const features = [
  {
    title: 'Custom Nether-Styled Portals',
    description:
      'Design and build your own unique nether-styled portals with custom frame materials, interior blocks, and lighter items.',
    Icon: DoorOpen,
    color: 'lum-grad-bg-yellow-100/10',
  },
  {
    title: 'Infinite Possibilities & Features',
    description:
      "Whatever custom portal mechanic your Minecraft server requires, Dimensions supports it. If it doesn't, request it and we will build it.",
    Icon: InfinityIcon,
    color: 'lum-grad-bg-yellow-100/10',
  },
  {
    title: 'Ultra-Fast Support',
    description:
      'Got questions or need help setting up? Unless we are sleeping, we respond to support requests on Discord in less than 30 minutes.',
    Icon: MessageSquareHeart,
    color: 'lum-grad-bg-yellow-200/10',
  },
];

export default component$(() => {
  return (
    <>
      <section
        class="relative flex min-h-svh flex-col items-center justify-center gap-2 overflow-hidden"
        style={{
          '--lum-border-radius': '1.5rem',
        }}
      >
        <div
          id="hero"
          class="grid w-full max-w-4xl grid-cols-1 gap-2 text-gray-100 md:grid-cols-2 xl:max-w-5xl 2xl:max-w-6xl"
        >
          <div class="lum-card lum-bg-lum-card-bg/50 relative col-span-2 items-center gap-2 overflow-clip px-48 py-48 text-center xl:gap-4">
            <Background
              id="bg"
              alt="Background"
              class={{
                'absolute inset-0 -z-10 h-full w-full object-cover': true,
              }}
            />
            <h1 class="motion-safe:slide-in-from-top-16 animate-in fade-in motion-safe:anim-duration-600 text-3xl/9 font-semibold tracking-tighter sm:text-5xl/14 md:text-6xl/18">
              <span class="bg-linear-to-br from-orange-100 to-amber-200 bg-clip-text! text-transparent">
                Dimensions
              </span>
            </h1>
            <h2 class="animate-in fade-in motion-safe:slide-in-from-top-16 motion-safe:anim-duration-800 text-xl/8 font-light tracking-tight drop-shadow-md md:text-2xl/10 xl:text-3xl/12">
              The ultimate Minecraft plugin to build, customize, and manage
              custom portals without limits.
            </h2>
            <Link
              href="/docs"
              class="lum-btn lum-btn-p-4 lum-bg-yellow-200 hover:lum-bg-yellow-200/60 mt-6"
            >
              <BookOpen size={24} />
              Documentation
            </Link>
          </div>
          {features.map((feature, i) => (
            <div
              key={i}
              class={['lum-card transition-all duration-200!', feature.color]}
              onMouseMove$={(e, el) => Hoverable.onMouseMove$(e, el)}
              onMouseLeave$={(e, el) => Hoverable.onMouseLeave$(e, el)}
            >
              <h4 class="mb-2 flex items-center gap-2 text-2xl font-bold">
                <feature.Icon /> {feature.title}
              </h4>
              <p>{feature.description}</p>
            </div>
          ))}
          <div class="lum-card lum-grad-bg-yellow-200/10 flex-row items-center transition-all duration-200!">
            <div class="flex flex-col gap-3">
              <h4 class="mb-2 flex items-center gap-2 text-2xl font-bold">
                <Palette /> Interactive Visual Editors
              </h4>
              <p>
                Build your custom portals and particle designs in the browser
                and instantly download the YAML config
              </p>
            </div>
            <div class="flex flex-col gap-1">
              <Link
                href="/editor/portal"
                class="lum-btn rounded-lum-2 lum-bg-yellow-200/20 hover:lum-bg-yellow-200/40 rounded-b"
              >
                <RectangleVertical size={16} />
                Portal Editor
              </Link>
              <Link
                href="/editor/particle"
                class="lum-btn rounded-lum-2 lum-bg-yellow-200/20 hover:lum-bg-yellow-200/40 rounded-t"
              >
                <Sparkle size={16} />
                Particle Editor
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
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
