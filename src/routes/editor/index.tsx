import {
  component$,
  useContextProvider,
  useSignal,
  useStore,
  useVisibleTask$,
  $,
} from '@qwik.dev/core';
import Accordion, { openItemsContext } from '~/components/Elements/Accordion';
import { ButtonContainer } from '~/components/Elements/ButtonContainer';
import { routeLoader$, type RequestHandler } from '@qwik.dev/router';
import { eq } from 'drizzle-orm';
import { YamlConverter } from './lib/yaml';
import Grid3x3 from 'lucide-icons-qwik/icons/Grid';
import RotateCcw from 'lucide-icons-qwik/icons/RotateCcw';
import RotateCw from 'lucide-icons-qwik/icons/RotateCw';
import CloudUpload from 'lucide-icons-qwik/icons/CloudUpload';
import Lock from 'lucide-icons-qwik/icons/Lock';
import Download from 'lucide-icons-qwik/icons/Download';
import Clipboard from 'lucide-icons-qwik/icons/Clipboard';
import Eye from 'lucide-icons-qwik/icons/Eye';
import EyeOff from 'lucide-icons-qwik/icons/EyeOff';
import Trash2 from 'lucide-icons-qwik/icons/Trash2';
import BookOpen from 'lucide-icons-qwik/icons/BookOpen';
import Palette from 'lucide-icons-qwik/icons/Palette';
import Sliders from 'lucide-icons-qwik/icons/Sliders';
import Puzzle from 'lucide-icons-qwik/icons/Puzzle';
import Boxes from 'lucide-icons-qwik/icons/Boxes';
import Box from 'lucide-icons-qwik/icons/Box';
import Maximize2 from 'lucide-icons-qwik/icons/Maximize2';
import Sparkles from 'lucide-icons-qwik/icons/Sparkles';
import Library from 'lucide-icons-qwik/icons/Library';
import Plus from 'lucide-icons-qwik/icons/Plus';
import Layers from 'lucide-icons-qwik/icons/Layers';
import X from 'lucide-icons-qwik/icons/X';
import Circle from 'lucide-icons-qwik/icons/Circle';

import { ColorPicker, Label, NumberInput, Toggle } from '@luminescent/ui-qwik';
import { getDB, userPortals } from '~/util/db';
import { getSessionUser, isAdmin } from '~/util/auth';
import { Session } from '@auth/qwik';
import textureManifest from '~/lib/texture-manifest.json';
import blocksRegistry from '~/lib/blocks.json';
import registeredAddons from '~/lib/registered-addons.json';
import { Nav } from '~/components/Nav';
import { ViewportCanvas } from './portal-editor';
import {
  ShapeDefaults,
  ShapeParamLabels,
  ShapeParamRanges,
  ShapeIconComponents,
  PresetIconComponents,
} from '~/routes/editor/lib/shapes';
import { Presets } from '~/routes/editor/lib/presets';
import { Utils } from '~/routes/editor/lib/utils';
import type { LayerData } from '~/routes/editor/lib/types';

/**
 * Loader to fetch details needed by the portal editor.
 */
export const usePortalEditorLoader = routeLoader$(async (requestEvent) => {
  const portalIdParam = requestEvent.url.searchParams.get('portal');
  const portalId = portalIdParam ? parseInt(portalIdParam, 10) || 0 : 0;

  const db = getDB();
  const session = requestEvent.sharedMap.get('session') as Session;

  const addonsList = registeredAddons;

  let portalRow = undefined;
  if (portalId > 0) {
    portalRow = await db.query.userPortals.findFirst({
      where: eq(userPortals.id, portalId),
    });
  }

  const userId = session?.user?.id;
  const isLoggedIn = !!userId;
  const isOwner =
    portalId > 0 && portalRow && isLoggedIn && userId === portalRow.maker;

  if (portalId > 0 && portalRow && portalRow.public === 0 && !isOwner) {
    const user = await getSessionUser(session.user?.id);
    if (!isAdmin(user)) {
      throw requestEvent.redirect(302, '/editor/');
    }
  }

  return {
    textureManifest,
    addonsList,
    isLoggedIn,
    isOwner,
    portalId,
    portalData: portalRow ? portalRow.data : null,
    portalPublic: portalRow ? portalRow.public : 0,
    saveLabel: portalId > 0 ? (isOwner ? 'Update' : 'Copy') : 'Save',
  };
});

/**
 * Handler for portal editor POST requests (save, toggle public, delete).
 */
export const onPost: RequestHandler = async (requestEvent) => {
  const session = requestEvent.sharedMap.get('session') as Session;
  if (!session.user?.id) {
    requestEvent.send(401, 'Unauthorized');
    return;
  }

  const db = getDB();
  const formData = await requestEvent.request.formData();

  if (formData.has('savePortal')) {
    const data = formData.get('savePortal') as string;
    const portalID = formData.get('portalID') as string;
    const img = (formData.get('portalIMG') as string) || '';
    const portalIdParam = requestEvent.url.searchParams.get('portal');
    const portalId = portalIdParam ? parseInt(portalIdParam, 10) || 0 : 0;

    let rowId = portalId;
    if (portalId > 0) {
      const existing = await db.query.userPortals.findFirst({
        where: eq(userPortals.id, portalId),
      });
      if (existing && existing.maker === session.user?.id) {
        await db
          .update(userPortals)
          .set({ data, portalID, img })
          .where(eq(userPortals.id, portalId));
      } else {
        const inserted = await db
          .insert(userPortals)
          .values({ data, portalID, img, maker: session.user?.id, public: 0 })
          .returning({ id: userPortals.id });
        rowId = inserted[0]?.id || 0;
      }
    } else {
      const inserted = await db
        .insert(userPortals)
        .values({ data, portalID, img, maker: session.user?.id, public: 0 })
        .returning({ id: userPortals.id });
      rowId = inserted[0]?.id || 0;
    }

    throw requestEvent.redirect(302, `/editor/?portal=${rowId}`);
  }

  if (formData.has('togglePublic')) {
    const portalIdParam = requestEvent.url.searchParams.get('portal');
    const portalId = portalIdParam ? parseInt(portalIdParam, 10) || 0 : 0;
    if (portalId > 0) {
      const existing = await db.query.userPortals.findFirst({
        where: eq(userPortals.id, portalId),
      });
      if (existing && existing.maker === session.user?.id) {
        const newPublic = existing.public === 1 ? 0 : 1;
        await db
          .update(userPortals)
          .set({ public: newPublic })
          .where(eq(userPortals.id, portalId));
      }
    }
    throw requestEvent.redirect(302, `/editor/?portal=${portalId}`);
  }

  if (formData.has('deletePortal')) {
    const portalIdParam = requestEvent.url.searchParams.get('portal');
    const portalId = portalIdParam ? parseInt(portalIdParam, 10) || 0 : 0;
    if (portalId > 0) {
      const existing = await db.query.userPortals.findFirst({
        where: eq(userPortals.id, portalId),
      });
      if (existing && existing.maker === session.user?.id) {
        await db.delete(userPortals).where(eq(userPortals.id, portalId));
      }
    }
    throw requestEvent.redirect(302, '/editor/');
  }

  requestEvent.send(400, 'Bad Request');
};

export default component$(() => {
  const loaderSig = usePortalEditorLoader();
  const canvasRef = useSignal<HTMLCanvasElement>();

  const openItems = useSignal<string[]>(['frame', 'portal', 'size']);
  useContextProvider(openItemsContext, openItems);

  const store = useStore({
    portalID: 'testPortal',
    activeTab: 'design' as 'design' | 'particles' | 'settings' | 'addons',
    frameBlock: 'OBSIDIAN',
    portalBlock: 'NETHER_PORTAL',
    lighterBlock: 'FLINT_AND_STEEL',
    width: 4,
    height: 5,
    direction: 'NORTH',
    frameSearch: '',
    portalSearch: '',
    // Settings
    targetWorld: 'world_nether',
    teleportDelay: 4,
    enableParticles: true,
    exitPortalEnable: true,
    addons: loaderSig.value.addonsList.map((a) => ({
      name: a.name,
      description: a.description,
      enabled: false,
      options: a.options,
    })),
    // Particle state
    particleLayers: JSON.parse(
      JSON.stringify(Presets.definitions['Fireflies']?.layers || [])
    ) as LayerData[],
    selectedParticleLayerId:
      (Presets.definitions['Fireflies']?.layers[0] as any)?.id ||
      (null as string | null),
    particleFreq: 20,
    showParticlePresetsModal: false,
    showAddParticleLayerModal: false,
    showConfigModal: false,
    configYaml: '',
  });

  const generateYaml = $(() => {
    const id = store.portalID || 'testPortal';
    const obj: Record<string, any> = {
      configVersion: '4.0.0',
      Enable: true,
      DisplayName: id,
      Portal: {
        Frame: {
          Material: store.frameBlock.toLowerCase(),
          Face: 'all',
        },
        InsideMaterial: store.portalBlock.toLowerCase(),
        LighterMaterial: store.lighterBlock.toLowerCase(),
        ParticlesColor: '255;255;255',
        MinimumWidth: store.width,
        MinimumHeight: store.height,
        MaximumWidth: Math.max(store.width + 10, 14),
        MaximumHeight: Math.max(store.height + 10, 15),
      },
      Options: {
        EnableParticles: store.enableParticles,
        TeleportDelay: store.teleportDelay,
        AllowedWorlds: [],
        ExitPortal: {
          Enable: store.exitPortalEnable,
          FixedWidth: -1,
          FixedHeight: -1,
        },
      },
      World: {
        Name: store.targetWorld,
      },
      Entities: {
        Transformation: [],
        Spawning: {
          Delay: 0,
          List: [],
        },
      },
    };
    store.configYaml = YamlConverter.convert(obj);
    store.showConfigModal = true;
  });

  // 3D Viewport setup
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => store.frameBlock);
    track(() => store.portalBlock);
    track(() => store.width);
    track(() => store.height);

    if (!canvasRef.value) return;

    const viewport = new ViewportCanvas(canvasRef.value);
    (canvasRef.value as any).__viewport = viewport;
    viewport.setMaterials(store.frameBlock, store.portalBlock);
    viewport.setDimensions(store.width, store.height);
    viewport.start();

    cleanup(() => {
      viewport.stop();
    });
  });

  // Particle animation loop
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => store.particleLayers);
    track(() => store.activeTab);

    if (!canvasRef.value) return;

    const startTime = Date.now();
    let animId: number | null = null;

    const loop = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const vp = (canvasRef.value as any)?.__viewport as
        | ViewportCanvas
        | undefined;
      if (vp) {
        if (
          store.activeTab === 'particles' &&
          store.particleLayers.length > 0
        ) {
          vp.updateParticles(store.particleLayers, elapsed);
        } else {
          vp.clearParticles();
        }
      }
      animId = requestAnimationFrame(loop);
    };

    loop();

    cleanup(() => {
      if (animId) cancelAnimationFrame(animId);
    });
  });

  const addParticleLayer = $((type: string) => {
    const count = store.particleLayers.length + 1;
    const defaults = ShapeDefaults[type]
      ? JSON.parse(JSON.stringify(ShapeDefaults[type]))
      : {};
    const newLayer: LayerData = {
      id: Utils.generateId(),
      name: Utils.capitalize(type) + ' ' + count,
      enabled: true,
      section: 'main',
      particle: {
        type: 'REDSTONE',
        color: { r: 255, g: 180, b: 50 },
        size: 1.0,
      },
      shape: { type, params: defaults },
      position: { x: 0, y: 0, z: 0 },
      animation: { rotate: false, rotateSpeed: 1.0, float: false },
    };
    store.particleLayers = [...store.particleLayers, newLayer];
    store.selectedParticleLayerId = newLayer.id || null;
    store.showAddParticleLayerModal = false;
  });

  const deleteParticleLayer = $((id: string) => {
    store.particleLayers = store.particleLayers.filter((l) => l.id !== id);
    if (store.selectedParticleLayerId === id) {
      store.selectedParticleLayerId = store.particleLayers[0]?.id || null;
    }
  });

  const toggleParticleLayer = $((id: string) => {
    const layer = store.particleLayers.find((l) => l.id === id);
    if (layer) layer.enabled = !layer.enabled;
  });

  const applyPreset = $((presetName: string) => {
    const def = Presets.definitions[presetName];
    if (def) {
      store.particleLayers = JSON.parse(JSON.stringify(def.layers));
      store.particleFreq = def.frequency || 20;
      store.selectedParticleLayerId = store.particleLayers[0]?.id || null;
      store.showParticlePresetsModal = false;
    }
  });

  const selectedParticleLayer = store.particleLayers.find(
    (l) => l.id === store.selectedParticleLayerId
  );

  return (
    <section
      class="relative flex min-h-svh flex-col overflow-hidden p-6 pt-20"
      style={{ '--lum-border-radius': '1.5rem' }}
    >
      <div
        class="mx-auto flex w-full max-w-4xl flex-col gap-6 text-gray-100 xl:max-w-5xl 2xl:max-w-6xl"
        id="app"
      >
        <Nav>
          <div q:slot="icon">
            <Grid3x3 size={16} />
          </div>

          <Label for="portalID" label="Portal ID">
            <input
              type="text"
              id="portalID"
              class="lum-input w-36"
              value={store.portalID}
              onInput$={(e) => {
                store.portalID = (e.target as HTMLInputElement).value;
              }}
              spellcheck={false}
            />
          </Label>

          <div class="flex flex-wrap items-center gap-2">
            <button
              class="flex h-9 w-9 cursor-pointer items-center justify-center bg-gray-950 text-gray-300 transition-all hover:border-gray-700 hover:text-white disabled:pointer-events-none disabled:opacity-20"
              title="Undo"
              disabled
            >
              <RotateCcw size={16} />
            </button>
            <button
              class="flex h-9 w-9 cursor-pointer items-center justify-center bg-gray-950 text-gray-300 transition-all hover:border-gray-700 hover:text-white disabled:pointer-events-none disabled:opacity-20"
              title="Redo"
              disabled
            >
              <RotateCw size={16} />
            </button>
            <div class="mx-1 h-6 w-px bg-gray-800"></div>

            {loaderSig.value.isLoggedIn ? (
              <button class="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-gray-600 to-gray-500 px-4 text-xs font-bold tracking-wider text-white uppercase shadow-md transition-all hover:from-gray-500 hover:to-gray-400">
                <CloudUpload size={16} />
                <span>{loaderSig.value.saveLabel}</span>
              </button>
            ) : (
              <button
                class="flex h-9 cursor-not-allowed items-center gap-1.5 bg-gray-900 px-4 text-xs font-bold tracking-wider text-gray-500 uppercase"
                disabled
                title="Log in to save"
              >
                <Lock size={16} />
                <span>Save</span>
              </button>
            )}

            <button
              class="flex h-9 cursor-pointer items-center gap-1.5 bg-gray-950 px-4 text-xs font-bold tracking-wider text-gray-200 uppercase transition-all hover:border-gray-700 hover:bg-gray-900"
              onClick$={() => void generateYaml()}
            >
              <Download size={16} />
              <span>Download</span>
            </button>
            <button
              class="flex h-9 w-9 cursor-pointer items-center justify-center bg-gray-950 text-gray-300 transition-all hover:border-gray-700 hover:text-white"
              title="Preview YAML"
              onClick$={() => void generateYaml()}
            >
              <Clipboard size={16} />
            </button>

            {loaderSig.value.isOwner && (
              <>
                <div class="mx-1 h-6 w-px bg-gray-800"></div>
                <button class="flex h-9 cursor-pointer items-center gap-1.5 bg-gray-950 px-4 text-xs font-bold tracking-wider text-gray-200 uppercase transition-all hover:border-gray-700 hover:bg-gray-900">
                  <Eye size={16} />
                  <span>
                    {loaderSig.value.portalPublic ? 'Private' : 'Public'}
                  </span>
                </button>
                <button class="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-red-900/40 bg-red-950/40 px-4 text-xs font-bold tracking-wider text-red-400 uppercase transition-all hover:border-red-800 hover:bg-red-900/20">
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </>
            )}
            <div class="mx-1 h-6 w-px bg-gray-800"></div>
            <a
              class="flex h-9 w-9 items-center justify-center bg-gray-950 text-gray-300 transition-all hover:border-gray-700 hover:text-white"
              href="https://astaspastagam.gitbook.io/docs/addons"
              target="_blank"
              title="Wiki"
              rel="noreferrer"
            >
              <BookOpen size={16} />
            </a>
          </div>
        </Nav>

        <main class="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* LEFT PANEL */}
          <aside class="lum-card flex h-[600px] flex-col overflow-hidden p-0 lg:col-span-4 lg:h-[700px]">
            <div class="p-3">
              <ButtonContainer class="[&>button]:lum-btn-p-1! [&>button]:justify-center">
                <button
                  class={{ 'lum-grad-bg-blue!': store.activeTab === 'design' }}
                  onClick$={() => (store.activeTab = 'design')}
                >
                  <Palette size={14} />
                  Design
                </button>
                <button
                  class={{
                    'lum-grad-bg-blue!': store.activeTab === 'particles',
                  }}
                  onClick$={() => (store.activeTab = 'particles')}
                >
                  <Sparkles size={14} />
                  Particles
                </button>
                <button
                  class={{
                    'lum-grad-bg-blue!': store.activeTab === 'settings',
                  }}
                  onClick$={() => (store.activeTab = 'settings')}
                >
                  <Sliders size={14} />
                  Settings
                </button>
                <button
                  class={{ 'lum-grad-bg-blue!': store.activeTab === 'addons' }}
                  onClick$={() => (store.activeTab = 'addons')}
                >
                  <Puzzle size={14} />
                  Addons
                </button>
              </ButtonContainer>
            </div>

            <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
              {/* Design Tab */}
              {store.activeTab === 'design' && (
                <div class="flex flex-col gap-4">
                  <div class="flex flex-col gap-2">
                    <Accordion sectionName="frame" class="w-full">
                      <span class="flex items-center gap-2 text-xs font-bold text-gray-300">
                        <Boxes size={16} />
                        Frame Block
                      </span>
                    </Accordion>
                    {openItems.value.includes('frame') && (
                      <div class="flex flex-col gap-3 p-2">
                        <input
                          type="text"
                          class="lum-input w-full"
                          placeholder="Search blocks..."
                          value={store.frameSearch}
                          onInput$={(e) => {
                            store.frameSearch = (
                              e.target as HTMLInputElement
                            ).value;
                          }}
                        />
                        <div class="grid max-h-48 grid-cols-6 gap-2 overflow-y-auto p-1">
                          {blocksRegistry
                            .filter(
                              (b) =>
                                b.name
                                  .toLowerCase()
                                  .includes(store.frameSearch.toLowerCase()) ||
                                b.key
                                  .toLowerCase()
                                  .includes(store.frameSearch.toLowerCase()) ||
                                b.id
                                  .toLowerCase()
                                  .includes(store.frameSearch.toLowerCase())
                            )
                            .map((block) => (
                              <div
                                key={block.id}
                                class={
                                  'aspect-square cursor-pointer rounded-lg border bg-cover bg-center shadow-sm transition-all duration-150 hover:scale-105 ' +
                                  (store.frameBlock === block.key ||
                                  store.frameBlock === block.icon
                                    ? 'border-gray-400 shadow-lg ring-2 ring-gray-400/40'
                                    : 'border-gray-800/80 hover:border-gray-600')
                                }
                                style={{
                                  backgroundImage: `url(/editor/Images/blocks/${block.icon}.png)`,
                                  imageRendering: 'pixelated',
                                }}
                                title={`${block.name} (${block.id})`}
                                onClick$={() => (store.frameBlock = block.key)}
                              />
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div class="flex flex-col gap-2">
                    <Accordion sectionName="portal" class="w-full">
                      <span class="flex items-center gap-2 text-xs font-bold text-gray-300">
                        <Box size={16} />
                        Portal Inner Block
                      </span>
                    </Accordion>
                    {openItems.value.includes('portal') && (
                      <div class="flex flex-col gap-3 p-2">
                        <input
                          type="text"
                          class="lum-input w-full"
                          placeholder="Search blocks..."
                          value={store.portalSearch}
                          onInput$={(e) => {
                            store.portalSearch = (
                              e.target as HTMLInputElement
                            ).value;
                          }}
                        />
                        <div class="grid max-h-48 grid-cols-6 gap-2 overflow-y-auto p-1">
                          {blocksRegistry
                            .filter(
                              (b) =>
                                b.name
                                  .toLowerCase()
                                  .includes(store.portalSearch.toLowerCase()) ||
                                b.key
                                  .toLowerCase()
                                  .includes(store.portalSearch.toLowerCase()) ||
                                b.id
                                  .toLowerCase()
                                  .includes(store.portalSearch.toLowerCase())
                            )
                            .map((block) => (
                              <div
                                key={block.id}
                                class={
                                  'aspect-square cursor-pointer rounded-lg border bg-cover bg-center shadow-sm transition-all duration-150 hover:scale-105 ' +
                                  (store.portalBlock === block.key ||
                                  store.portalBlock === block.icon
                                    ? 'border-gray-400 shadow-lg ring-2 ring-gray-400/40'
                                    : 'border-gray-800/80 hover:border-gray-600')
                                }
                                style={{
                                  backgroundImage: `url(/editor/Images/blocks/${block.icon}.png)`,
                                  imageRendering: 'pixelated',
                                }}
                                title={`${block.name} (${block.id})`}
                                onClick$={() => (store.portalBlock = block.key)}
                              />
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div class="flex flex-col gap-2">
                    <Accordion sectionName="size" class="w-full">
                      <span class="flex items-center gap-2 text-xs font-bold text-gray-300">
                        <Maximize2 size={16} />
                        Dimensions
                      </span>
                    </Accordion>
                    {openItems.value.includes('size') && (
                      <div class="grid grid-cols-2 gap-4 p-2">
                        <Label for="portalWidth" label="Width">
                          <NumberInput
                            input
                            id="portalWidth"
                            min={2}
                            max={20}
                            value={store.width}
                            onInput$={(e, el) => {
                              store.width = parseInt(el.value, 10) || 4;
                            }}
                          />
                        </Label>
                        <Label for="portalHeight" label="Height">
                          <NumberInput
                            input
                            id="portalHeight"
                            min={3}
                            max={20}
                            value={store.height}
                            onInput$={(e, el) => {
                              store.height = parseInt(el.value, 10) || 5;
                            }}
                          />
                        </Label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Particles Tab */}
              {store.activeTab === 'particles' && (
                <div class="flex flex-col gap-3">
                  <div class="flex items-center gap-2">
                    <button
                      class="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-all hover:bg-gray-800 hover:text-white"
                      onClick$={() => (store.showParticlePresetsModal = true)}
                    >
                      <Library size={14} />
                      Presets
                    </button>
                    <button
                      class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-gray-800 bg-gray-950 text-gray-300 transition-all hover:border-gray-700 hover:text-white"
                      title="Add layer"
                      onClick$={() => (store.showAddParticleLayerModal = true)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {store.particleLayers.length === 0 ? (
                    <div class="lum-card flex flex-col items-center justify-center gap-2 border-dashed p-8 text-center text-xs text-gray-500">
                      <Layers size={24} />
                      <p class="font-semibold">
                        No layers. Click Presets or + to start.
                      </p>
                    </div>
                  ) : (
                    store.particleLayers.map((layer) => {
                      const ShapeIcon =
                        ShapeIconComponents[layer.shape?.type || 'ring'] ||
                        Circle;
                      const isSelected =
                        layer.id === store.selectedParticleLayerId;
                      return (
                        <div
                          key={layer.id}
                          class={[
                            'lum-card group flex cursor-pointer items-center justify-between p-2.5 transition-all duration-150',
                            isSelected ? 'border-gray-600 text-white' : '',
                            !layer.enabled ? 'opacity-50' : '',
                          ]}
                          onClick$={() =>
                            (store.selectedParticleLayerId = layer.id || null)
                          }
                        >
                          <div class="flex min-w-0 flex-grow items-center gap-2">
                            <button
                              class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-gray-800 bg-gray-950 text-gray-400 transition-colors hover:border-gray-700 hover:text-gray-200"
                              title={layer.enabled ? 'Hide' : 'Show'}
                              onClick$={(e) => {
                                e.stopPropagation();
                                void toggleParticleLayer(layer.id || '');
                              }}
                            >
                              {layer.enabled ? (
                                <Eye size={14} />
                              ) : (
                                <EyeOff size={14} />
                              )}
                            </button>
                            <span class="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-800/60 bg-gray-950/60 text-gray-400">
                              <ShapeIcon size={14} />
                            </span>
                            <span class="flex-grow truncate text-xs font-semibold text-gray-200">
                              {layer.name}
                            </span>
                          </div>
                          <button
                            class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-red-900/40 bg-red-950/30 text-red-400 transition-colors hover:border-red-700/60 hover:bg-red-900/50 hover:text-red-300"
                            title="Delete"
                            onClick$={(e) => {
                              e.stopPropagation();
                              void deleteParticleLayer(layer.id || '');
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })
                  )}

                  {selectedParticleLayer && (
                    <div class="lum-card flex flex-col gap-3 p-4">
                      <div class="border-b border-gray-800/60 pb-2 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                        {selectedParticleLayer.name}
                      </div>
                      <Label for="particleColor" label="Color">
                        <ColorPicker
                          id="particleColor"
                          value={Utils.rgbToHex(
                            selectedParticleLayer.particle.color.r,
                            selectedParticleLayer.particle.color.g,
                            selectedParticleLayer.particle.color.b
                          )}
                          onInput$={(newHex) => {
                            selectedParticleLayer.particle.color =
                              Utils.hexToRgb(newHex);
                          }}
                        />
                      </Label>
                      <Label for="particleSize" label="Size">
                        <NumberInput
                          input
                          id="particleSize"
                          min={0.1}
                          max={5.0}
                          step={0.1}
                          value={selectedParticleLayer.particle?.size || 1.0}
                          onInput$={(e, el) => {
                            selectedParticleLayer.particle.size =
                              parseFloat(el.value) || 1;
                          }}
                        />
                      </Label>
                      {selectedParticleLayer.shape?.params && (
                        <div class="flex flex-col gap-3">
                          <div class="border-b border-gray-800/60 pb-1 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                            {Utils.capitalize(selectedParticleLayer.shape.type)}{' '}
                            Parameters
                          </div>
                          {Object.keys(selectedParticleLayer.shape.params).map(
                            (key) => {
                              const val =
                                selectedParticleLayer.shape.params[key];
                              const label = ShapeParamLabels[key] || key;
                              const range = ShapeParamRanges[key] || {
                                min: 0,
                                max: 10,
                                step: 0.1,
                              };
                              if (typeof val !== 'number') return null;
                              return (
                                <Label
                                  key={key}
                                  for={`param-${key}`}
                                  label={label}
                                >
                                  <NumberInput
                                    input
                                    id={`param-${key}`}
                                    min={range.min}
                                    max={range.max}
                                    step={range.step}
                                    value={val}
                                    onInput$={(e, el) => {
                                      selectedParticleLayer.shape.params[key] =
                                        parseFloat(el.value) || 0;
                                    }}
                                  />
                                </Label>
                              );
                            }
                          )}
                        </div>
                      )}
                      <Label for="particleFreq" label="Simulation Speed">
                        <NumberInput
                          input
                          id="particleFreq"
                          min={1}
                          max={40}
                          value={store.particleFreq}
                          onInput$={(e, el) => {
                            store.particleFreq = parseInt(el.value, 10) || 20;
                          }}
                        />
                      </Label>
                    </div>
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {store.activeTab === 'settings' && (
                <div class="flex flex-col gap-4">
                  <div class="lum-card flex flex-col gap-3 p-4">
                    <div class="border-b border-gray-800/60 pb-2 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                      Portal Settings
                    </div>
                    <Label for="targetDimension" label="Target Dimension">
                      <input
                        id="targetDimension"
                        type="text"
                        class="lum-input w-full"
                        value={store.targetWorld}
                        onInput$={(e) => {
                          store.targetWorld = (
                            e.target as HTMLInputElement
                          ).value;
                        }}
                        spellcheck={false}
                      />
                    </Label>
                    <Label for="lighterMat" label="Lighter Item">
                      <input
                        id="lighterMat"
                        type="text"
                        class="lum-input w-full"
                        value={store.lighterBlock}
                        onInput$={(e) => {
                          store.lighterBlock = (
                            e.target as HTMLInputElement
                          ).value.toUpperCase();
                        }}
                        spellcheck={false}
                      />
                    </Label>
                    <Label for="teleportDelay" label="Teleport Delay (s)">
                      <NumberInput
                        input
                        id="teleportDelay"
                        min={0}
                        max={30}
                        value={store.teleportDelay}
                        onInput$={(e, el) => {
                          store.teleportDelay = parseInt(el.value, 10) || 4;
                        }}
                      />
                    </Label>
                  </div>
                  <div class="lum-card flex flex-col gap-3 p-4">
                    <div class="border-b border-gray-800/60 pb-2 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                      Particles &amp; Exit Portal
                    </div>
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-xs font-semibold text-gray-300">
                        Enable Particles
                      </span>
                      <Toggle
                        checked={store.enableParticles}
                        onChange$={(e, el) => {
                          store.enableParticles = el.checked;
                        }}
                      />
                    </div>
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-xs font-semibold text-gray-300">
                        Auto-Build Exit Portal
                      </span>
                      <Toggle
                        checked={store.exitPortalEnable}
                        onChange$={(e, el) => {
                          store.exitPortalEnable = el.checked;
                        }}
                      />
                    </div>
                  </div>
                  <button
                    class="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-700 bg-gray-900 py-2 text-xs font-bold tracking-wider text-gray-200 uppercase transition-all hover:border-gray-600 hover:bg-gray-800"
                    onClick$={() => void generateYaml()}
                  >
                    <Clipboard size={14} />
                    Preview / Copy Config
                  </button>
                </div>
              )}

              {/* Addons Tab */}
              {store.activeTab === 'addons' && (
                <div class="flex flex-col gap-3">
                  {store.addons.length === 0 ? (
                    <div class="p-8 text-center text-xs text-gray-500">
                      No addons registered.
                    </div>
                  ) : (
                    store.addons.map((addon) => (
                      <div
                        key={addon.name}
                        class={
                          'lum-card flex flex-col gap-2 p-4 transition-all duration-150 ' +
                          (!addon.enabled ? 'opacity-75' : '')
                        }
                      >
                        <div class="flex items-center justify-between gap-2">
                          <span class="text-xs font-bold text-gray-200">
                            {addon.name}
                          </span>
                          <Toggle
                            checked={addon.enabled}
                            onChange$={(e, el) => {
                              addon.enabled = el.checked;
                            }}
                          />
                        </div>
                        {addon.description && (
                          <p class="text-[11px] leading-relaxed text-gray-400">
                            {addon.description}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* CENTER PANEL: 3D Viewport */}
          <div class="flex flex-col gap-4 lg:col-span-8">
            <div class="lum-card relative flex h-[500px] w-full flex-col justify-between overflow-hidden p-0 lg:h-[700px]">
              <canvas
                ref={canvasRef}
                id="viewport"
                class="block h-full w-full flex-1 bg-black"
                style={{ imageRendering: 'pixelated' }}
              ></canvas>
              <div class="absolute top-4 left-4 z-10 flex items-center gap-2">
                <span class="rounded-lg border border-gray-800/80 bg-black/60 px-2.5 py-1 text-[10px] font-bold tracking-wider text-gray-300 uppercase backdrop-blur-sm">
                  {store.width} x {store.height} blocks
                </span>
                {store.activeTab === 'particles' && (
                  <span class="rounded-lg border border-purple-800/60 bg-purple-950/60 px-2.5 py-1 text-[10px] font-bold tracking-wider text-purple-300 uppercase backdrop-blur-sm">
                    {store.particleLayers.filter((l) => l.enabled).length}{' '}
                    particle layers
                  </span>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Particle Presets Modal */}
      {store.showParticlePresetsModal && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div class="flex w-full max-w-lg flex-col gap-4 overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 p-5 shadow-2xl">
            <div class="flex items-center justify-between border-b border-gray-800/80 pb-3">
              <h3 class="text-xs font-bold tracking-wider text-gray-200 uppercase">
                Particle Presets
              </h3>
              <button
                class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition-colors hover:text-gray-300"
                onClick$={() => (store.showParticlePresetsModal = false)}
              >
                <X size={16} />
              </button>
            </div>
            <div class="max-h-[350px] overflow-y-auto p-1">
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Object.keys(Presets.definitions).map((presetName) => {
                  const preset = Presets.definitions[presetName];
                  const IconComp = PresetIconComponents[preset.icon] || Circle;
                  return (
                    <div
                      key={presetName}
                      class="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-gray-800/60 bg-gray-900/40 p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-700 hover:bg-gray-800/40 hover:shadow-lg"
                      onClick$={() => void applyPreset(presetName)}
                    >
                      <div
                        class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-950 text-gray-300 transition-transform group-hover:scale-110"
                        style={{ color: preset.accentColor }}
                      >
                        <IconComp size={20} />
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

      {/* Add Particle Layer Modal */}
      {store.showAddParticleLayerModal && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div class="flex w-full max-w-md flex-col gap-4 overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 p-5 shadow-2xl">
            <div class="flex items-center justify-between border-b border-gray-800/80 pb-3">
              <h3 class="text-xs font-bold tracking-wider text-gray-200 uppercase">
                Add Particle Layer
              </h3>
              <button
                class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition-colors hover:text-gray-300"
                onClick$={() => (store.showAddParticleLayerModal = false)}
              >
                <X size={16} />
              </button>
            </div>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  'ring',
                  'spiral',
                  'helix',
                  'vortex',
                  'rain',
                  'border',
                  'random',
                  'custom',
                ] as const
              ).map((type) => {
                const ShapeComp = ShapeIconComponents[type] || Circle;
                return (
                  <button
                    key={type}
                    class="group flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-gray-800/60 bg-gray-900/40 p-3 text-center transition-all hover:border-gray-700 hover:bg-gray-800/40"
                    onClick$={() => void addParticleLayer(type)}
                  >
                    <ShapeComp size={20} />
                    <span class="text-[11px] font-semibold text-gray-300 capitalize">
                      {type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
});
