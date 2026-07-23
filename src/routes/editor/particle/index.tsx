import {
  component$,
  useSignal,
  useStore,
  useVisibleTask$,
  $,
} from '@qwik.dev/core';
import Sparkles from 'lucide-icons-qwik/icons/Sparkles';
import RotateCcw from 'lucide-icons-qwik/icons/RotateCcw';
import RotateCw from 'lucide-icons-qwik/icons/RotateCw';
import Library from 'lucide-icons-qwik/icons/Library';
import Play from 'lucide-icons-qwik/icons/Play';
import Square from 'lucide-icons-qwik/icons/Square';
import Download from 'lucide-icons-qwik/icons/Download';
import Clipboard from 'lucide-icons-qwik/icons/Clipboard';
import Plus from 'lucide-icons-qwik/icons/Plus';
import Home from 'lucide-icons-qwik/icons/Home';
import MousePointer from 'lucide-icons-qwik/icons/MousePointer';
import X from 'lucide-icons-qwik/icons/X';
import Eye from 'lucide-icons-qwik/icons/Eye';
import EyeOff from 'lucide-icons-qwik/icons/EyeOff';
import Trash2 from 'lucide-icons-qwik/icons/Trash2';
import Circle from 'lucide-icons-qwik/icons/Circle';
import Tornado from 'lucide-icons-qwik/icons/Tornado';
import InfinityIcon from 'lucide-icons-qwik/icons/InfinityIcon';
import Target from 'lucide-icons-qwik/icons/Target';
import CloudRain from 'lucide-icons-qwik/icons/CloudRain';
import Flame from 'lucide-icons-qwik/icons/Flame';
import Dices from 'lucide-icons-qwik/icons/Dices';
import Code from 'lucide-icons-qwik/icons/Code';
import CirclePlus from 'lucide-icons-qwik/icons/CirclePlus';
import Layers from 'lucide-icons-qwik/icons/Layers';

import { Nav } from '~/components/Nav';
import {
  Utils,
  ShapeDefaults,
  ShapeParamLabels,
  ShapeParamRanges,
  Presets,
  ThreeView,
} from './particle-editor';

const ShapeIcons: Record<string, any> = {
  ring: Circle,
  spiral: Tornado,
  helix: InfinityIcon,
  vortex: Target,
  rain: CloudRain,
  border: Flame,
  random: Dices,
  custom: Code,
};

const PresetIcons: Record<string, any> = {
  tornado: Tornado,
  circle: Circle,
  infinity: InfinityIcon,
  bullseye: Target,
  'cloud-rain': CloudRain,
  rain: CloudRain,
  fire: Flame,
  stars: Sparkles,
  'plus-circle': CirclePlus,
};

export default component$(() => {
  const canvasRef = useSignal<HTMLCanvasElement>();

  const store = useStore({
    packName: 'My Particle Pack',
    freq: 20,
    layers: JSON.parse(
      JSON.stringify(Presets.definitions['Fireflies']?.layers || [])
    ) as any[],
    selectedLayerId: Presets.definitions['Fireflies']?.layers[0]?.id || null,
    isSimulating: false,
    showPresetsModal: false,
    showAddLayerModal: false,
    particleCount: 0,
    history: [] as string[],
    historyIndex: -1,
  });

  const selectedLayer = store.layers.find(
    (l) => l.id === store.selectedLayerId
  );

  // Initialize Three.js Viewport
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => store.layers);
    track(() => store.freq);
    track(() => store.isSimulating);

    if (!canvasRef.value) return;

    const threeView = new ThreeView(canvasRef.value);

    let animId: number | null = null;
    const startTime = Date.now();

    const renderLoop = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      threeView.updateParticles(store.layers, elapsed);
      animId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    cleanup(() => {
      if (animId) cancelAnimationFrame(animId);
    });
  });

  const pushHistory = $(() => {
    const state = JSON.stringify(store.layers);
    if (
      store.historyIndex >= 0 &&
      store.history[store.historyIndex] === state
    ) {
      return;
    }
    const newHist = store.history.slice(0, store.historyIndex + 1);
    newHist.push(state);
    if (newHist.length > 30) newHist.shift();
    store.history = newHist;
    store.historyIndex = newHist.length - 1;
  });

  const handleUndo = $(() => {
    if (store.historyIndex > 0) {
      store.historyIndex--;
      store.layers = JSON.parse(store.history[store.historyIndex]);
    }
  });

  const handleRedo = $(() => {
    if (store.historyIndex < store.history.length - 1) {
      store.historyIndex++;
      store.layers = JSON.parse(store.history[store.historyIndex]);
    }
  });

  const addLayer = $((type: string) => {
    const count = store.layers.length + 1;
    const defaults = ShapeDefaults[type]
      ? JSON.parse(JSON.stringify(ShapeDefaults[type]))
      : {};
    const newLayer = {
      id: Utils.generateId(),
      name: Utils.capitalize(type) + ' ' + count,
      enabled: true,
      section: 'main',
      particle: {
        type: 'REDSTONE',
        color: { r: 255, g: 180, b: 50 },
        size: 1.0,
      },
      shape: {
        type,
        params: defaults,
      },
      position: { x: 0, y: 0, z: 0 },
      animation: { rotate: false, rotateSpeed: 1.0, float: false },
    };
    store.layers = [...store.layers, newLayer];
    store.selectedLayerId = newLayer.id;
    store.showAddLayerModal = false;
    void pushHistory();
  });

  const deleteLayer = $((id: string) => {
    store.layers = store.layers.filter((l) => l.id !== id);
    if (store.selectedLayerId === id) {
      store.selectedLayerId = store.layers[0]?.id || null;
    }
    void pushHistory();
  });

  const toggleLayerEnabled = $((id: string) => {
    const layer = store.layers.find((l) => l.id === id);
    if (layer) {
      layer.enabled = !layer.enabled;
      void pushHistory();
    }
  });

  const applyPreset = $((presetName: string) => {
    const def = Presets.definitions[presetName];
    if (def) {
      store.layers = JSON.parse(JSON.stringify(def.layers));
      store.freq = def.frequency || 20;
      store.selectedLayerId = store.layers[0]?.id || null;
      store.showPresetsModal = false;
      void pushHistory();
    }
  });

  return (
    <>
      <div class="flex w-full flex-col gap-6" id="app">
        {/* Editor Control Bar via Nav.tsx component */}
        <Nav>
          <div q:slot="icon">
            <Sparkles class="h-4 w-4" />
          </div>

          <div class="flex items-center gap-2 rounded-xl border border-gray-800/80 bg-black/40 px-3 py-2">
            <label
              for="packName"
              class="text-[10px] font-bold tracking-wider text-gray-500 uppercase select-none"
            >
              Pack Name
            </label>
            <input
              type="text"
              id="packName"
              class="w-36 border-none bg-transparent text-xs font-semibold text-gray-200 placeholder-gray-700 focus:outline-none"
              value={store.packName}
              onInput$={(e) => {
                store.packName = (e.target as HTMLInputElement).value;
              }}
              spellcheck={false}
            />
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-gray-800 bg-gray-950 text-gray-300 transition-all hover:border-gray-700 hover:text-white disabled:pointer-events-none disabled:opacity-20"
              title="Undo (Ctrl+Z)"
              disabled={store.historyIndex <= 0}
              onClick$={handleUndo}
            >
              <RotateCcw class="h-4 w-4" />
            </button>
            <button
              class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-gray-800 bg-gray-950 text-gray-300 transition-all hover:border-gray-700 hover:text-white disabled:pointer-events-none disabled:opacity-20"
              title="Redo (Ctrl+Y)"
              disabled={store.historyIndex >= store.history.length - 1}
              onClick$={handleRedo}
            >
              <RotateCw class="h-4 w-4" />
            </button>
            <div class="mx-1 h-6 w-px bg-gray-800"></div>
            <button
              class="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-gray-800 bg-gray-950 px-4 text-xs font-bold tracking-wider text-gray-200 uppercase transition-all hover:border-gray-700 hover:bg-gray-900"
              onClick$={() => (store.showPresetsModal = true)}
            >
              <Library class="h-4 w-4" />
              <span>Presets</span>
            </button>
            <div class="mx-1 h-6 w-px bg-gray-800"></div>
            <button
              class="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-gray-600 to-gray-500 px-4 text-xs font-bold tracking-wider text-white uppercase shadow-md transition-all hover:from-gray-500 hover:to-gray-400"
              onClick$={() => (store.isSimulating = !store.isSimulating)}
            >
              {store.isSimulating ? (
                <>
                  <Square class="h-4 w-4 fill-current" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Play class="h-4 w-4 fill-current" />
                  <span>Run</span>
                </>
              )}
            </button>
            <div class="mx-1 h-6 w-px bg-gray-800"></div>
            <button
              class="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-gray-800 bg-gray-950 px-4 text-xs font-bold tracking-wider text-gray-200 uppercase transition-all hover:border-gray-700 hover:bg-gray-900"
              onClick$={() => {
                const yaml = store.layers
                  .map((l) => JSON.stringify(l))
                  .join('\n');
                const blob = new Blob([yaml], { type: 'text/yaml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${store.packName}.yml`;
                a.click();
              }}
            >
              <Download class="h-4 w-4" />
              <span>Download</span>
            </button>
            <button
              class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-gray-800 bg-gray-950 text-gray-300 transition-all hover:border-gray-700 hover:text-white"
              title="Copy YAML"
              onClick$={() => {
                const yaml = store.layers
                  .map((l) => JSON.stringify(l))
                  .join('\n');
                void navigator.clipboard.writeText(yaml);
              }}
            >
              <Clipboard class="h-4 w-4" />
            </button>
          </div>
        </Nav>

        {/* Workspace Grid */}
        <main class="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* LEFT PANEL: Layers */}
          <aside class="flex h-[500px] flex-col overflow-hidden rounded-2xl border border-gray-800/80 bg-gray-900/40 shadow-xl backdrop-blur lg:col-span-4 lg:h-[650px]">
            <div class="flex items-center justify-between border-b border-gray-800/80 bg-black/20 px-4 py-3">
              <span class="text-xs font-bold tracking-wider text-gray-400 uppercase">
                Layers
              </span>
              <button
                class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-gray-800 bg-gray-950 text-gray-300 transition-all hover:border-gray-700 hover:text-white"
                title="Add layer"
                onClick$={() => (store.showAddLayerModal = true)}
              >
                <Plus class="h-3.5 w-3.5" />
              </button>
            </div>
            <div class="flex-1 space-y-2 overflow-y-auto p-4">
              {store.layers.length === 0 ? (
                <div class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-800/80 bg-gray-950/40 p-8 text-center text-xs text-gray-500">
                  <Layers class="h-6 w-6 text-gray-600" />
                  <p class="text-xs font-semibold text-gray-500">
                    No layers yet. Click "+ Add Layer" to start.
                  </p>
                </div>
              ) : (
                store.layers.map((layer) => {
                  const ShapeIcon =
                    ShapeIcons[layer.shape?.type || 'ring'] || Circle;
                  const isSelected = layer.id === store.selectedLayerId;
                  return (
                    <div
                      key={layer.id}
                      class={[
                        'group flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition-all duration-150',
                        isSelected
                          ? 'border-gray-700 bg-gray-900/80 text-white shadow-sm'
                          : 'border-gray-800/60 bg-gray-950/40 text-gray-400 hover:border-gray-700 hover:bg-gray-900/40 hover:text-gray-200',
                        !layer.enabled ? 'opacity-50' : '',
                      ]}
                      onClick$={() => (store.selectedLayerId = layer.id)}
                    >
                      <div class="flex min-w-0 flex-grow items-center gap-2">
                        <button
                          class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-gray-800 bg-gray-950 text-gray-400 transition-colors hover:border-gray-700 hover:text-gray-200"
                          title={layer.enabled ? 'Hide' : 'Show'}
                          onClick$={(e) => {
                            e.stopPropagation();
                            void toggleLayerEnabled(layer.id);
                          }}
                        >
                          {layer.enabled ? (
                            <Eye class="h-3.5 w-3.5" />
                          ) : (
                            <EyeOff class="h-3.5 w-3.5" />
                          )}
                        </button>
                        <span class="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-800/60 bg-gray-950/60 text-gray-400">
                          <ShapeIcon class="h-3.5 w-3.5" />
                        </span>
                        <span class="flex-grow truncate text-xs font-semibold text-gray-200">
                          {layer.name}
                        </span>
                      </div>
                      <div class="flex items-center gap-1">
                        <button
                          class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-red-900/40 bg-red-950/30 text-red-400 transition-colors hover:border-red-700/60 hover:bg-red-900/50 hover:text-red-300"
                          title="Delete"
                          onClick$={(e) => {
                            e.stopPropagation();
                            void deleteLayer(layer.id);
                          }}
                        >
                          <Trash2 class="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div class="border-t border-gray-800/80 bg-black/10 p-4">
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <label
                    for="freqSlider"
                    class="text-[11px] font-bold tracking-wider text-gray-400 uppercase"
                  >
                    Simulation Speed
                  </label>
                  <span class="font-mono text-xs font-bold text-gray-400">
                    {store.freq}
                  </span>
                </div>
                <input
                  type="range"
                  id="freqSlider"
                  min="1"
                  max="40"
                  value={store.freq}
                  onInput$={(e) => {
                    store.freq = parseInt(
                      (e.target as HTMLInputElement).value,
                      10
                    );
                  }}
                  class="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-800 accent-gray-400"
                />
              </div>
            </div>
          </aside>

          {/* CENTER PANEL: 3D Viewport */}
          <div class="flex flex-col gap-4 lg:col-span-4">
            <div class="relative flex h-[400px] w-full flex-col justify-between overflow-hidden rounded-2xl border border-gray-800/80 bg-gray-950 shadow-2xl lg:h-[650px]">
              <canvas
                ref={canvasRef}
                class="block h-full w-full flex-1 bg-black"
              ></canvas>
              <div class="absolute top-4 left-4 z-10 flex items-center gap-2">
                <span class="rounded-lg border border-gray-800/80 bg-black/60 px-2.5 py-1 text-[10px] font-bold tracking-wider text-gray-300 uppercase backdrop-blur-sm">
                  {store.layers.length} layers
                </span>
              </div>
              <div class="absolute right-4 bottom-4 z-10">
                <button
                  class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-800 bg-black/60 text-gray-300 backdrop-blur-sm transition-all hover:border-gray-700 hover:text-white"
                  title="Reset camera"
                >
                  <Home class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Inspector */}
          <aside class="flex h-[450px] flex-col overflow-hidden rounded-2xl border border-gray-800/80 bg-gray-900/40 shadow-xl backdrop-blur lg:col-span-4 lg:h-[650px]">
            <div class="flex items-center justify-between border-b border-gray-800/80 bg-black/20 px-4 py-3">
              <span class="text-xs font-bold tracking-wider text-gray-400 uppercase">
                Inspector
              </span>
            </div>
            <div class="flex-1 space-y-4 overflow-y-auto p-4">
              {!selectedLayer ? (
                <div class="flex h-full flex-col items-center justify-center p-8 text-center text-gray-600">
                  <MousePointer class="mb-2 block h-6 w-6" />
                  <p class="text-xs font-bold tracking-wider text-gray-500 uppercase">
                    Select a layer to edit
                  </p>
                </div>
              ) : (
                <div class="space-y-4">
                  {/* Layer Name & Shape */}
                  <div class="space-y-3 rounded-xl border border-gray-800/80 bg-gray-900/30 p-4">
                    <div class="border-b border-gray-800/60 pb-2 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                      Layer Info
                    </div>
                    <div class="flex flex-col gap-1.5">
                      <label class="text-[10px] font-bold text-gray-400 uppercase">
                        Layer Name
                      </label>
                      <input
                        type="text"
                        class="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-1.5 text-xs text-gray-200 outline-none focus:border-gray-600"
                        value={selectedLayer.name}
                        onInput$={(e) => {
                          selectedLayer.name = (
                            e.target as HTMLInputElement
                          ).value;
                          void pushHistory();
                        }}
                      />
                    </div>
                  </div>

                  {/* Particle Color & Size */}
                  <div class="space-y-3 rounded-xl border border-gray-800/80 bg-gray-900/30 p-4">
                    <div class="border-b border-gray-800/60 pb-2 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                      Particle Appearance
                    </div>
                    <div class="flex items-center justify-between gap-3">
                      <label class="text-xs font-medium text-gray-300">
                        Color
                      </label>
                      <input
                        type="color"
                        class="h-8 w-14 cursor-pointer rounded-lg border border-gray-800 bg-gray-950 p-0.5"
                        value={Utils.rgbToHex(
                          selectedLayer.particle?.color?.r || 255,
                          selectedLayer.particle?.color?.g || 180,
                          selectedLayer.particle?.color?.b || 50
                        )}
                        onInput$={(e) => {
                          const hex = (e.target as HTMLInputElement).value;
                          selectedLayer.particle.color = Utils.hexToRgb(hex);
                          void pushHistory();
                        }}
                      />
                    </div>
                    <div class="flex items-center justify-between gap-3">
                      <label class="text-xs font-medium text-gray-300">
                        Size
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="5.0"
                        class="w-24 rounded-lg border border-gray-800 bg-gray-950 px-2.5 py-1 text-xs text-gray-200 outline-none"
                        value={selectedLayer.particle?.size || 1.0}
                        onInput$={(e) => {
                          selectedLayer.particle.size =
                            parseFloat((e.target as HTMLInputElement).value) ||
                            1;
                          void pushHistory();
                        }}
                      />
                    </div>
                  </div>

                  {/* Shape Parameters */}
                  {selectedLayer.shape?.params && (
                    <div class="space-y-3 rounded-xl border border-gray-800/80 bg-gray-900/30 p-4">
                      <div class="border-b border-gray-800/60 pb-2 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                        {Utils.capitalize(selectedLayer.shape.type)} Parameters
                      </div>
                      {Object.keys(selectedLayer.shape.params).map((key) => {
                        const val = selectedLayer.shape.params[key];
                        const label =
                          ShapeParamLabels[key] || Utils.capitalize(key);
                        const range = ShapeParamRanges[key] || {
                          min: 0.1,
                          max: 10,
                          step: 0.1,
                        };
                        return (
                          <div
                            key={key}
                            class="flex items-center justify-between gap-3 text-xs text-gray-300"
                          >
                            <label class="text-xs font-medium text-gray-300">
                              {label}
                            </label>
                            <input
                              type="number"
                              min={range.min}
                              max={range.max}
                              step={range.step}
                              class="w-24 rounded-lg border border-gray-800 bg-gray-950 px-2.5 py-1 text-xs text-gray-200 outline-none"
                              value={val}
                              onInput$={(e) => {
                                selectedLayer.shape.params[key] =
                                  parseFloat(
                                    (e.target as HTMLInputElement).value
                                  ) || 0;
                                void pushHistory();
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        </main>
      </div>

      {/* PRESETS MODAL */}
      {store.showPresetsModal && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div class="w-full max-w-lg space-y-4 overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 p-5 shadow-2xl">
            <div class="flex items-center justify-between border-b border-gray-800/80 pb-3">
              <h3 class="text-xs font-bold tracking-wider text-gray-200 uppercase">
                Presets
              </h3>
              <button
                class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition-colors hover:text-gray-300"
                onClick$={() => (store.showPresetsModal = false)}
              >
                <X class="h-4 w-4" />
              </button>
            </div>
            <div class="max-h-[350px] overflow-y-auto p-1">
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Object.keys(Presets.definitions).map((presetName) => {
                  const preset = Presets.definitions[presetName];
                  const IconComp = PresetIcons[preset.icon] || Circle;
                  return (
                    <div
                      key={presetName}
                      class="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-gray-800/80 bg-gray-900/40 p-4 text-center backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-700 hover:bg-gray-800/40 hover:shadow-lg"
                      onClick$={() => void applyPreset(presetName)}
                    >
                      <div
                        class="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-800 bg-gray-950 text-gray-300 transition-transform group-hover:scale-110"
                        style={{ color: preset.accentColor }}
                      >
                        <IconComp class="h-5 w-5" />
                      </div>
                      <span class="text-xs font-bold text-gray-200">
                        {presetName}
                      </span>
                      <span class="line-clamp-2 text-[11px] text-gray-500">
                        {preset.description}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD LAYER MODAL */}
      {store.showAddLayerModal && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div class="w-full max-w-md space-y-4 overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 p-5 shadow-2xl">
            <div class="flex items-center justify-between border-b border-gray-800/80 pb-3">
              <h3 class="text-xs font-bold tracking-wider text-gray-200 uppercase">
                Add Layer
              </h3>
              <button
                class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition-colors hover:text-gray-300"
                onClick$={() => (store.showAddLayerModal = false)}
              >
                <X class="h-4 w-4" />
              </button>
            </div>
            <div class="max-h-[300px] overflow-y-auto p-1">
              <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  'ring',
                  'spiral',
                  'helix',
                  'vortex',
                  'rain',
                  'border',
                  'random',
                  'custom',
                ].map((type) => {
                  const ShapeComp = ShapeIcons[type] || Circle;
                  return (
                    <div
                      key={type}
                      class="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-800/80 bg-gray-900/40 p-3.5 text-xs font-semibold text-gray-300 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-gray-700 hover:bg-gray-800/40 hover:text-white"
                      onClick$={() => void addLayer(type)}
                    >
                      <ShapeComp class="h-4 w-4 text-gray-400" />
                      <span>{Utils.capitalize(type)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
