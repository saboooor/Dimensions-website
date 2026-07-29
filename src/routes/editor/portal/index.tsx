import {
  component$,
  useContextProvider,
  useSignal,
  useStore,
  useVisibleTask$,
} from '@qwik.dev/core';
import Accordion, { openItemsContext } from '~/components/Elements/Accordion';
import { ButtonContainer } from '~/components/Elements/ButtonContainer';
import { routeLoader$, type RequestHandler } from '@qwik.dev/router';
import { eq } from 'drizzle-orm';
import Grid3x3 from 'lucide-icons-qwik/icons/Grid';
import RotateCcw from 'lucide-icons-qwik/icons/RotateCcw';
import RotateCw from 'lucide-icons-qwik/icons/RotateCw';
import CloudUpload from 'lucide-icons-qwik/icons/CloudUpload';
import Lock from 'lucide-icons-qwik/icons/Lock';
import Download from 'lucide-icons-qwik/icons/Download';
import Clipboard from 'lucide-icons-qwik/icons/Clipboard';
import Eye from 'lucide-icons-qwik/icons/Eye';
import Trash2 from 'lucide-icons-qwik/icons/Trash2';
import BookOpen from 'lucide-icons-qwik/icons/BookOpen';
import Palette from 'lucide-icons-qwik/icons/Palette';
import Sliders from 'lucide-icons-qwik/icons/Sliders';
import Puzzle from 'lucide-icons-qwik/icons/Puzzle';
import Boxes from 'lucide-icons-qwik/icons/Boxes';
import Box from 'lucide-icons-qwik/icons/Box';
import Maximize2 from 'lucide-icons-qwik/icons/Maximize2';

import { Label, NumberInput, Toggle } from '@luminescent/ui-qwik';
import { getDB, userPortals } from '~/util/db';
import { getSessionUser, isAdmin } from '~/util/auth';
import { Session } from '@auth/qwik';
import textureManifest from '~/lib/texture-manifest.json';
import blocksRegistry from '~/lib/blocks.json';
import registeredAddons from '~/lib/registered-addons.json';
import { Nav } from '~/components/Nav';
import { ViewportCanvas } from './portal-editor';

/**
 * Loader to fetch details needed by the portal editor.
 */
export const usePortalEditorLoader = routeLoader$(async (requestEvent) => {
  const portalIdParam = requestEvent.url.searchParams.get('portal');
  const portalId = portalIdParam ? parseInt(portalIdParam, 10) || 0 : 0;

  const db = getDB();
  const session = requestEvent.sharedMap.get('session') as Session;

  // Load registered addons from static json
  const addonsList = registeredAddons;

  // Load portal row if portalId is set
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
      throw requestEvent.redirect(302, '/editor/portal/');
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
          .values({
            data,
            portalID,
            img,
            maker: session.user?.id,
            public: 0,
          })
          .returning({ id: userPortals.id });
        rowId = inserted[0]?.id || 0;
      }
    } else {
      const inserted = await db
        .insert(userPortals)
        .values({
          data,
          portalID,
          img,
          maker: session.user?.id,
          public: 0,
        })
        .returning({ id: userPortals.id });
      rowId = inserted[0]?.id || 0;
    }

    throw requestEvent.redirect(302, `/editor/portal/?portal=${rowId}`);
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
    throw requestEvent.redirect(302, `/editor/portal/?portal=${portalId}`);
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
    throw requestEvent.redirect(302, '/editor/portal/');
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
    activeTab: 'design' as 'design' | 'settings' | 'addons',
    frameBlock: 'OBSIDIAN',
    portalBlock: 'NETHER_PORTAL',
    width: 4,
    height: 5,
    direction: 'NORTH',
    frameSearch: '',
    portalSearch: '',
    frameSectionOpen: true,
    portalSectionOpen: true,
    sizeSectionOpen: true,
    addons: loaderSig.value.addonsList.map((a) => ({
      name: a.name,
      description: a.description,
      enabled: false,
      options: a.options,
    })),
  });

  // 2D Viewport Canvas setup
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => store.frameBlock);
    track(() => store.portalBlock);
    track(() => store.width);
    track(() => store.height);

    if (!canvasRef.value) return;

    const viewport = new ViewportCanvas(canvasRef.value);
    viewport.setMaterials(store.frameBlock, store.portalBlock);
    viewport.setDimensions(store.width, store.height);
    viewport.start();

    cleanup(() => {
      viewport.stop();
    });
  });

  return (
    <section
      class="relative flex min-h-svh flex-col overflow-hidden p-6 pt-20"
      style={{
        '--lum-border-radius': '1.5rem',
      }}
    >
      <div
        class="mx-auto flex w-full max-w-4xl flex-col gap-6 text-gray-100 xl:max-w-5xl 2xl:max-w-6xl"
        id="app"
      >
        {/* Editor Control Bar via Nav.tsx component */}
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

            <button class="flex h-9 cursor-pointer items-center gap-1.5 bg-gray-950 px-4 text-xs font-bold tracking-wider text-gray-200 uppercase transition-all hover:border-gray-700 hover:bg-gray-900">
              <Download size={16} />
              <span>Download</span>
            </button>
            <button
              class="flex h-9 w-9 cursor-pointer items-center justify-center bg-gray-950 text-gray-300 transition-all hover:border-gray-700 hover:text-white"
              title="Copy YAML"
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

        {/* Workspace Grid */}
        <main class="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* LEFT PANEL */}
          <aside class="lum-card flex h-[600px] flex-col overflow-hidden p-0 lg:col-span-4 lg:h-[700px]">
            {/* Tabs */}
            <div class="p-3">
              <ButtonContainer class="[&>button]:lum-btn-p-1! [&>button]:justify-center">
                <button
                  class={{
                    'lum-grad-bg-blue!': store.activeTab === 'design',
                  }}
                  onClick$={() => (store.activeTab = 'design')}
                >
                  <Palette size={14} />
                  Design
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
                  class={{
                    'lum-grad-bg-blue!': store.activeTab === 'addons',
                  }}
                  onClick$={() => (store.activeTab = 'addons')}
                >
                  <Puzzle size={14} />
                  Addons
                </button>
              </ButtonContainer>
            </div>

            {/* Panel Body */}
            <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
              {/* Design Tab */}
              {store.activeTab === 'design' && (
                <div class="flex flex-col gap-4">
                  {/* Frame Block Section */}
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
                                  backgroundImage: `url(/editor/portal/Images/blocks/${block.icon}.png)`,
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

                  {/* Portal Block Section */}
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
                                  backgroundImage: `url(/editor/portal/Images/blocks/${block.icon}.png)`,
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

                  {/* Dimensions Section */}
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

              {/* Settings Tab */}
              {store.activeTab === 'settings' && (
                <div class="flex flex-col gap-4">
                  <div class="lum-card flex flex-col gap-3 p-4">
                    <div class="border-b border-gray-800/60 pb-2 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                      General Settings
                    </div>
                    <Label for="targetDimension" label="Target Dimension">
                      <input
                        id="targetDimension"
                        type="text"
                        class="lum-input w-full"
                        value="world_nether"
                      />
                    </Label>
                  </div>
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

          {/* CENTER PANEL: 2D Canvas Viewport */}
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
              </div>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
});
