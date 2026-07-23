import {
  component$,
  useSignal,
  useStore,
  useVisibleTask$,
} from '@qwik.dev/core';
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
import ChevronDown from 'lucide-icons-qwik/icons/ChevronDown';
import Box from 'lucide-icons-qwik/icons/Box';
import Maximize2 from 'lucide-icons-qwik/icons/Maximize2';

import { getDB, userPortals } from '~/util/db';
import { getSessionUserId, getSessionUser } from '~/util/auth';
import textureManifest from '~/lib/texture-manifest.json';
import { Nav } from '~/components/Nav';
import { ViewportCanvas } from './portal-editor';

/**
 * Loader to fetch details needed by the portal editor.
 */
export const usePortalEditorLoader = routeLoader$(async (requestEvent) => {
  const portalIdParam = requestEvent.url.searchParams.get('portal');
  const portalId = portalIdParam ? parseInt(portalIdParam, 10) || 0 : 0;

  const db = getDB(requestEvent);
  const userId = getSessionUserId(requestEvent);
  const user = await getSessionUser(requestEvent);

  // Load registered addons
  const addons = await db.query.registeredAddons.findMany();
  const addonsList = addons.map((a) => {
    let options = {};
    try {
      options = JSON.parse(a.portalOptions);
    } catch {
      // ignore
    }
    return {
      name: a.name,
      description: a.description,
      options,
    };
  });

  // Load portal row if portalId is set
  let portalRow = undefined;
  if (portalId > 0) {
    portalRow = await db.query.userPortals.findFirst({
      where: eq(userPortals.id, portalId),
    });
  }

  const isLoggedIn = !!userId;
  const isOwner =
    portalId > 0 && portalRow && isLoggedIn && userId === portalRow.maker;

  if (portalId > 0 && portalRow) {
    const isAdmin = user && user.id === '1';
    if (portalRow.public === 0 && !isOwner && !isAdmin) {
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
  const userId = getSessionUserId(requestEvent);
  if (!userId) {
    requestEvent.send(401, 'Unauthorized');
    return;
  }

  const db = getDB(requestEvent);
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
      if (existing && existing.maker === userId) {
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
            maker: userId,
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
          maker: userId,
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
      if (existing && existing.maker === userId) {
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
      if (existing && existing.maker === userId) {
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

  const blocksList: string[] = loaderSig.value.textureManifest.blocks || [];

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
    viewport.setDimensions(store.width, store.height);
    viewport.start();

    cleanup(() => {
      viewport.stop();
    });
  });

  return (
    <>
      <div class="flex w-full flex-col gap-6" id="app">
        {/* Editor Control Bar via Nav.tsx component */}
        <Nav>
          <div q:slot="icon">
            <Grid3x3 class="h-4 w-4" />
          </div>

          <div class="flex items-center gap-2 rounded-xl border border-gray-800/80 bg-black/40 px-3 py-2">
            <label
              for="portalID"
              class="text-[10px] font-bold tracking-wider text-gray-500 uppercase select-none"
            >
              Portal ID
            </label>
            <input
              type="text"
              id="portalID"
              class="w-28 border-none bg-transparent text-xs font-semibold text-gray-200 placeholder-gray-700 focus:outline-none"
              value={store.portalID}
              onInput$={(e) => {
                store.portalID = (e.target as HTMLInputElement).value;
              }}
              spellcheck={false}
            />
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-gray-800 bg-gray-950 text-gray-300 transition-all hover:border-gray-700 hover:text-white disabled:pointer-events-none disabled:opacity-20"
              title="Undo"
              disabled
            >
              <RotateCcw class="h-4 w-4" />
            </button>
            <button
              class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-gray-800 bg-gray-950 text-gray-300 transition-all hover:border-gray-700 hover:text-white disabled:pointer-events-none disabled:opacity-20"
              title="Redo"
              disabled
            >
              <RotateCw class="h-4 w-4" />
            </button>
            <div class="mx-1 h-6 w-px bg-gray-800"></div>

            {loaderSig.value.isLoggedIn ? (
              <button class="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-gray-600 to-gray-500 px-4 text-xs font-bold tracking-wider text-white uppercase shadow-md transition-all hover:from-gray-500 hover:to-gray-400">
                <CloudUpload class="h-4 w-4" />
                <span>{loaderSig.value.saveLabel}</span>
              </button>
            ) : (
              <button
                class="flex h-9 cursor-not-allowed items-center gap-1.5 rounded-xl border border-gray-800/80 bg-gray-900 px-4 text-xs font-bold tracking-wider text-gray-500 uppercase"
                disabled
                title="Log in to save"
              >
                <Lock class="h-4 w-4" />
                <span>Save</span>
              </button>
            )}

            <button class="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-gray-800 bg-gray-950 px-4 text-xs font-bold tracking-wider text-gray-200 uppercase transition-all hover:border-gray-700 hover:bg-gray-900">
              <Download class="h-4 w-4" />
              <span>Download</span>
            </button>
            <button
              class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-gray-800 bg-gray-950 text-gray-300 transition-all hover:border-gray-700 hover:text-white"
              title="Copy YAML"
            >
              <Clipboard class="h-4 w-4" />
            </button>

            {loaderSig.value.isOwner && (
              <>
                <div class="mx-1 h-6 w-px bg-gray-800"></div>
                <button class="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-gray-800 bg-gray-950 px-4 text-xs font-bold tracking-wider text-gray-200 uppercase transition-all hover:border-gray-700 hover:bg-gray-900">
                  <Eye class="h-4 w-4" />
                  <span>
                    {loaderSig.value.portalPublic ? 'Private' : 'Public'}
                  </span>
                </button>
                <button class="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-red-900/40 bg-red-950/40 px-4 text-xs font-bold tracking-wider text-red-400 uppercase transition-all hover:border-red-800 hover:bg-red-900/20">
                  <Trash2 class="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </>
            )}
            <div class="mx-1 h-6 w-px bg-gray-800"></div>
            <a
              class="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-800 bg-gray-950 text-gray-300 transition-all hover:border-gray-700 hover:text-white"
              href="https://astaspastagam.gitbook.io/first-steps/configuring-dimensions/addons"
              target="_blank"
              title="Wiki"
              rel="noreferrer"
            >
              <BookOpen class="h-4 w-4" />
            </a>
          </div>
        </Nav>

        {/* Workspace Grid */}
        <main class="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* LEFT PANEL */}
          <aside class="flex h-[600px] flex-col overflow-hidden rounded-2xl border border-gray-800/80 bg-gray-900/40 shadow-xl backdrop-blur lg:col-span-4 lg:h-[700px]">
            {/* Tabs */}
            <div class="flex border-b border-gray-800/80 bg-black/20">
              <button
                class={
                  'flex-1 cursor-pointer border-b-2 py-3 text-xs font-bold tracking-wider uppercase transition-all ' +
                  (store.activeTab === 'design'
                    ? 'border-gray-400 bg-gray-900/40 text-white'
                    : 'border-transparent text-gray-400 hover:bg-gray-900/20 hover:text-gray-200')
                }
                onClick$={() => (store.activeTab = 'design')}
              >
                <Palette class="me-1 inline-block h-3.5 w-3.5" />
                Design
              </button>
              <button
                class={
                  'flex-1 cursor-pointer border-b-2 py-3 text-xs font-bold tracking-wider uppercase transition-all ' +
                  (store.activeTab === 'settings'
                    ? 'border-gray-400 bg-gray-900/40 text-white'
                    : 'border-transparent text-gray-400 hover:bg-gray-900/20 hover:text-gray-200')
                }
                onClick$={() => (store.activeTab = 'settings')}
              >
                <Sliders class="me-1 inline-block h-3.5 w-3.5" />
                Settings
              </button>
              <button
                class={
                  'flex-1 cursor-pointer border-b-2 py-3 text-xs font-bold tracking-wider uppercase transition-all ' +
                  (store.activeTab === 'addons'
                    ? 'border-gray-400 bg-gray-900/40 text-white'
                    : 'border-transparent text-gray-400 hover:bg-gray-900/20 hover:text-gray-200')
                }
                onClick$={() => (store.activeTab = 'addons')}
              >
                <Puzzle class="me-1 inline-block h-3.5 w-3.5" />
                Addons
              </button>
            </div>

            {/* Panel Body */}
            <div class="flex-1 space-y-4 overflow-y-auto p-4">
              {/* Design Tab */}
              {store.activeTab === 'design' && (
                <div class="space-y-4">
                  {/* Frame Block Section */}
                  <div class="overflow-hidden rounded-xl border border-gray-800/80 bg-gray-900/30">
                    <div
                      class="flex cursor-pointer items-center justify-between bg-gray-950/40 p-3 select-none"
                      onClick$={() =>
                        (store.frameSectionOpen = !store.frameSectionOpen)
                      }
                    >
                      <h4 class="flex items-center gap-2 text-xs font-bold text-gray-300">
                        <Boxes class="h-4 w-4 text-gray-400" />
                        Frame Block
                      </h4>
                      <ChevronDown
                        class={
                          'h-4 w-4 text-gray-500 transition-transform duration-200 ' +
                          (!store.frameSectionOpen ? '-rotate-90' : '')
                        }
                      />
                    </div>
                    {store.frameSectionOpen && (
                      <div class="space-y-3 border-t border-gray-800/60 p-3">
                        <input
                          type="text"
                          class="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-1.5 text-xs text-gray-200 outline-none focus:border-gray-600"
                          placeholder="Search blocks..."
                          value={store.frameSearch}
                          onInput$={(e) => {
                            store.frameSearch = (
                              e.target as HTMLInputElement
                            ).value;
                          }}
                        />
                        <div class="grid max-h-48 grid-cols-6 gap-2 overflow-y-auto p-1">
                          {blocksList
                            .filter((b) =>
                              b
                                .toLowerCase()
                                .includes(store.frameSearch.toLowerCase())
                            )
                            .map((block) => (
                              <div
                                key={block}
                                class={
                                  'aspect-square cursor-pointer rounded-lg border bg-cover bg-center shadow-sm transition-all duration-150 hover:scale-105 ' +
                                  (store.frameBlock === block
                                    ? 'border-gray-400 shadow-lg ring-2 ring-gray-400/40'
                                    : 'border-gray-800/80 hover:border-gray-600')
                                }
                                style={{
                                  backgroundImage: `url(/editor/portal/Images/blocks/${block}.png)`,
                                }}
                                title={block}
                                onClick$={() => (store.frameBlock = block)}
                              />
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Portal Block Section */}
                  <div class="overflow-hidden rounded-xl border border-gray-800/80 bg-gray-900/30">
                    <div
                      class="flex cursor-pointer items-center justify-between bg-gray-950/40 p-3 select-none"
                      onClick$={() =>
                        (store.portalSectionOpen = !store.portalSectionOpen)
                      }
                    >
                      <h4 class="flex items-center gap-2 text-xs font-bold text-gray-300">
                        <Box class="h-4 w-4 text-gray-400" />
                        Portal Inner Block
                      </h4>
                      <ChevronDown
                        class={
                          'h-4 w-4 text-gray-500 transition-transform duration-200 ' +
                          (!store.portalSectionOpen ? '-rotate-90' : '')
                        }
                      />
                    </div>
                    {store.portalSectionOpen && (
                      <div class="space-y-3 border-t border-gray-800/60 p-3">
                        <input
                          type="text"
                          class="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-1.5 text-xs text-gray-200 outline-none focus:border-gray-600"
                          placeholder="Search blocks..."
                          value={store.portalSearch}
                          onInput$={(e) => {
                            store.portalSearch = (
                              e.target as HTMLInputElement
                            ).value;
                          }}
                        />
                        <div class="grid max-h-48 grid-cols-6 gap-2 overflow-y-auto p-1">
                          {blocksList
                            .filter((b) =>
                              b
                                .toLowerCase()
                                .includes(store.portalSearch.toLowerCase())
                            )
                            .map((block) => (
                              <div
                                key={block}
                                class={
                                  'aspect-square cursor-pointer rounded-lg border bg-cover bg-center shadow-sm transition-all duration-150 hover:scale-105 ' +
                                  (store.portalBlock === block
                                    ? 'border-gray-400 shadow-lg ring-2 ring-gray-400/40'
                                    : 'border-gray-800/80 hover:border-gray-600')
                                }
                                style={{
                                  backgroundImage: `url(/editor/portal/Images/blocks/${block}.png)`,
                                }}
                                title={block}
                                onClick$={() => (store.portalBlock = block)}
                              />
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dimensions Section */}
                  <div class="overflow-hidden rounded-xl border border-gray-800/80 bg-gray-900/30">
                    <div
                      class="flex cursor-pointer items-center justify-between bg-gray-950/40 p-3 select-none"
                      onClick$={() =>
                        (store.sizeSectionOpen = !store.sizeSectionOpen)
                      }
                    >
                      <h4 class="flex items-center gap-2 text-xs font-bold text-gray-300">
                        <Maximize2 class="h-4 w-4 text-gray-400" />
                        Dimensions
                      </h4>
                      <ChevronDown
                        class={
                          'h-4 w-4 text-gray-500 transition-transform duration-200 ' +
                          (!store.sizeSectionOpen ? '-rotate-90' : '')
                        }
                      />
                    </div>
                    {store.sizeSectionOpen && (
                      <div class="grid grid-cols-2 gap-4 border-t border-gray-800/60 p-4">
                        <div class="flex flex-col gap-1.5">
                          <label class="text-[10px] font-bold text-gray-400 uppercase">
                            Width
                          </label>
                          <input
                            type="number"
                            min="2"
                            max="20"
                            class="rounded-lg border border-gray-800 bg-gray-950 px-3 py-1.5 text-xs text-gray-200 outline-none"
                            value={store.width}
                            onInput$={(e) => {
                              store.width =
                                parseInt(
                                  (e.target as HTMLInputElement).value,
                                  10
                                ) || 4;
                            }}
                          />
                        </div>
                        <div class="flex flex-col gap-1.5">
                          <label class="text-[10px] font-bold text-gray-400 uppercase">
                            Height
                          </label>
                          <input
                            type="number"
                            min="3"
                            max="20"
                            class="rounded-lg border border-gray-800 bg-gray-950 px-3 py-1.5 text-xs text-gray-200 outline-none"
                            value={store.height}
                            onInput$={(e) => {
                              store.height =
                                parseInt(
                                  (e.target as HTMLInputElement).value,
                                  10
                                ) || 5;
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {store.activeTab === 'settings' && (
                <div class="space-y-4">
                  <div class="space-y-3 rounded-xl border border-gray-800/80 bg-gray-900/30 p-4">
                    <div class="border-b border-gray-800/60 pb-2 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                      General Settings
                    </div>
                    <div class="flex flex-col gap-1.5">
                      <label class="text-[10px] font-bold text-gray-400 uppercase">
                        Target Dimension
                      </label>
                      <input
                        type="text"
                        class="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-1.5 text-xs text-gray-200 outline-none"
                        value="world_nether"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Addons Tab */}
              {store.activeTab === 'addons' && (
                <div class="space-y-3">
                  {store.addons.length === 0 ? (
                    <div class="p-8 text-center text-xs text-gray-500">
                      No addons registered.
                    </div>
                  ) : (
                    store.addons.map((addon) => (
                      <div
                        key={addon.name}
                        class={
                          'flex flex-col gap-2 rounded-xl border p-4 transition-all duration-150 ' +
                          (addon.enabled
                            ? 'border-gray-700 bg-gray-900/60 shadow-sm'
                            : 'border-gray-800/80 bg-gray-950/40 opacity-75 hover:border-gray-700')
                        }
                      >
                        <div class="flex items-center justify-between gap-2">
                          <span class="text-xs font-bold text-gray-200">
                            {addon.name}
                          </span>
                          <button
                            type="button"
                            class={
                              'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ' +
                              (addon.enabled
                                ? 'bg-gray-600'
                                : 'border-gray-800 bg-gray-950')
                            }
                            onClick$={() => (addon.enabled = !addon.enabled)}
                          >
                            <span
                              class={
                                'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ' +
                                (addon.enabled
                                  ? 'translate-x-4'
                                  : 'translate-x-0')
                              }
                            />
                          </button>
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
            <div class="relative flex h-[500px] w-full flex-col justify-between overflow-hidden rounded-2xl border border-gray-800/80 bg-gray-950 shadow-2xl lg:h-[700px]">
              <canvas
                ref={canvasRef}
                class="block h-full w-full flex-1 bg-black"
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
    </>
  );
});
