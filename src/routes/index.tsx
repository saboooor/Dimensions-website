import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  const features = [
    {
      title: "Custom Nether-Styled Portals",
      description: "Design and build your own unique nether-styled portals with custom frame materials, interior blocks, and lighter items.",
      icon: "bi-portal",
      color: "from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30",
    },
    {
      title: "Infinite Possibilities & Features",
      description: "Whatever custom portal mechanic your Minecraft server requires, Dimensions supports it. If it doesn't, request it and we will build it.",
      icon: "bi-infinity",
      color: "from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30",
    },
    {
      title: "Ultra-Fast Support",
      description: "Got questions or need help setting up? Unless we are sleeping, we respond to support requests on Discord in less than 30 minutes.",
      icon: "bi-chat-heart",
      color: "from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30",
    },
    {
      title: "Free & Open Base Plugin",
      description: "Dimensions and its extensive core features are provided completely for free. Extra cosmetic features can be unlocked easily.",
      icon: "bi-gift",
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
    },
  ];

  return (
    <div class="space-y-12">
      {/* Hero Section */}
      <div
        class="relative overflow-hidden lum-card p-8 md:p-12 shadow-2xl text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8 lum-grad-bg-gray-950/40 rounded-lum"
      >
        <div class="space-y-4 max-w-xl z-10">
          <h1 class="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-100 leading-tight">
            This is{" "}
            <span class="bg-gradient-to-r from-gray-500 to-gray-300 bg-clip-text text-transparent">
              Dimensions
            </span>
          </h1>
          <p class="text-gray-400 text-sm md:text-base leading-relaxed">
            The ultimate Minecraft plugin to build, customize, and manage custom portals without limits. Fully integrated with Discord, Patreon, and in-game cosmetics.
          </p>
          <div class="flex flex-wrap items-center gap-3 pt-2 justify-center md:justify-start">
            <a
              href="/editor/portal"
              class="bg-gradient-to-r from-gray-600 to-gray-400 hover:from-gray-500 hover:to-gray-300 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <span>Launch Portal Editor</span>
              <i class="bi bi-arrow-right"></i>
            </a>
            <a
              href="/portals"
              class="bg-gray-900 hover:bg-gray-850 border border-gray-800 text-gray-300 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2"
            >
              <i class="bi bi-cloud-download"></i>
              <span>Browse Portals</span>
            </a>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <section class="space-y-6">
        <h2 class="text-xl font-bold text-gray-200 flex items-center gap-2">
          <i class="bi bi-stars text-gray-500"></i>
          <span>Core Plugin Features</span>
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              class="lum-card p-6 transition-all shadow-md group lum-grad-bg-gray-950/40 rounded-lum"
            >
              <div class="flex items-start gap-4">
                <div
                  class={`p-3 rounded-xl bg-gradient-to-br border flex-shrink-0 group-hover:scale-110 transition-transform duration-300 ${feature.color}`}
                >
                  <i class={`bi ${feature.icon} text-xl`}></i>
                </div>
                <div class="space-y-1.5">
                  <h3 class="font-semibold text-gray-100 group-hover:text-white transition-colors">
                    {feature.title}
                  </h3>
                  <p class="text-xs text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Editors Callout */}
      <div
        class="lum-card p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 lum-grad-bg-gray-950/40 rounded-lum"
      >
        <div class="space-y-2 max-w-xl text-center md:text-left">
          <h3 class="text-lg font-bold text-gray-200 flex items-center justify-center md:justify-start gap-2">
            <i class="bi bi-palette text-gray-300"></i>
            <span>Interactive Visual Editors</span>
          </h3>
          <p class="text-xs text-gray-400 leading-relaxed">
            If configuring text files feels tedious, use our interactive visual editors. Build your custom portals and particle designs in the browser and instantly download the YAML config or save it to your account!
          </p>
        </div>
        <div class="flex items-center gap-3">
          <a
            href="/editor/portal"
            class="bg-gray-400 hover:bg-gray-300 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
          >
            Portal Editor
          </a>
          <a
            href="/editor/particle"
            class="bg-gray-900 hover:bg-gray-850 border border-gray-800 text-gray-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
          >
            Particle Editor
          </a>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Dimensions - Custom Minecraft Portals",
  meta: [
    {
      name: "description",
      content: "Welcome to Dimensions, the ultimate custom portals plugin for Minecraft servers. Design nether-styled portals, custom particles, and link with Discord and Patreon.",
    },
  ],
};
