import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  const faqs = [
    {
      question: "How do I install the Dimensions plugin?",
      answer: "Download the Dimensions .jar file and place it into your server's 'plugins' folder. Restart your server, and the plugin will generate a default configuration in './plugins/Dimensions/'. Make sure you have a compatible Spigot, Paper, or Purpur server running.",
    },
    {
      question: "How do I create a custom portal?",
      answer: "You can easily design portals using our visual Portal Editor on this website! Once designed, click 'Download portal' or 'Save to account'. Place the downloaded .yml configuration file in the './plugins/Dimensions/Portals/' directory on your server, then run '/dim reload' in-game to apply the changes.",
    },
    {
      question: "How do I link my Minecraft account to my website profile?",
      answer: "Log in to this website, navigate to 'My Profile', and click 'Link Minecraft'. Enter your Minecraft UUID (which you can look up using your username). This enables sync of your in-game cosmetic preferences and custom portals.",
    },
    {
      question: "What are Points and how do I earn them?",
      answer: "Points are community tokens used to unlock premium in-game badges, custom particle effects, and subscription extensions. You can earn 50 points daily by enabling 'Rewarded Ads' in the 'Points' tab, or redeem special promo codes distributed on our Discord server.",
    },
    {
      question: "How do I link my Patreon to get Premium/Chad ranks?",
      answer: "Link your Patreon account on the 'My Profile' page under 'Linked Accounts'. Our system will automatically detect your active subscription tier and grant you the matching rank (Premium or Chad) on the website and in-game instantly.",
    },
    {
      question: "Can I connect multiple servers to my Patreon subscription?",
      answer: "Yes! Navigate to the 'Server Network' tab on your profile page and click 'Open subscriptions and servers'. There, you can register and bind your subscription to multiple unique server IDs so all your networks benefit from your perks.",
    },
  ];

  const activeIdx = useSignal<number | null>(0);

  return (
    <div class="space-y-8 max-w-4xl mx-auto">
      <div class="text-center space-y-2">
        <h1 class="text-3xl font-extrabold tracking-tight text-gray-100">
          Frequently Asked{" "}
          <span class="bg-gradient-to-r from-gray-500 to-gray-300 bg-clip-text text-transparent">
            Questions
          </span>
        </h1>
        <p class="text-sm text-gray-400">
          Everything you need to know about the Dimensions plugin, custom portal creation, and account integrations.
        </p>
      </div>

      <div class="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = activeIdx.value === idx;
          return (
            <div
              key={idx}
              class="bg-gray-900/30 border border-gray-900 rounded-2xl overflow-hidden transition-all duration-200"
            >
              <button
                onClick$={() => (activeIdx.value = isOpen ? null : idx)}
                class="w-full text-left px-6 py-4 flex items-center justify-between font-semibold text-gray-200 hover:text-white hover:bg-gray-900/40 transition-colors focus:outline-none"
              >
                <span>{faq.question}</span>
                <i
                  class={`bi bi-chevron-down text-gray-500 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-gray-500" : "rotate-0"
                  }`}
                ></i>
              </button>

              <div
                class={`transition-all duration-350 ease-in-out overflow-hidden ${
                  isOpen ? "max-h-48 border-t border-gray-900/50" : "max-h-0"
                }`}
              >
                <div class="p-6 text-sm text-gray-400 leading-relaxed bg-gray-950/20">
                  {faq.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Discord Help CTA */}
      <div class="bg-gray-900/40 border border-gray-900 rounded-2xl p-6 text-center space-y-4">
        <h3 class="font-bold text-gray-200">Still need help or have a custom feature request?</h3>
        <p class="text-xs text-gray-400 max-w-lg mx-auto leading-relaxed">
          Join our active Discord community! Our support channels are open 24/7, and you can chat directly with developers, share portal designs, or get help.
        </p>
        <a
          href="https://discord.com/invite/eYXf5E8KX6"
          target="_blank"
          class="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg transition-all"
        >
          <i class="bi bi-discord text-sm"></i>
          <span>Join our Discord Server</span>
        </a>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Dimensions - F.A.Q",
  meta: [
    {
      name: "description",
      content: "Frequently Asked Questions about the Dimensions Minecraft plugin, including installation guides, portal editors, Patreon and Discord linking.",
    },
  ],
};
