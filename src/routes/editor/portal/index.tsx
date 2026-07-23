import { component$, useVisibleTask$ } from '@qwik.dev/core';
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
import Flame from 'lucide-icons-qwik/icons/Flame';
import Maximize2 from 'lucide-icons-qwik/icons/Maximize2';
import Sparkles from 'lucide-icons-qwik/icons/Sparkles';
import Settings from 'lucide-icons-qwik/icons/Settings';
import Globe from 'lucide-icons-qwik/icons/Globe';
import DoorOpen from 'lucide-icons-qwik/icons/DoorOpen';
import Bug from 'lucide-icons-qwik/icons/Bug';
import Home from 'lucide-icons-qwik/icons/Home';
import AlertTriangle from 'lucide-icons-qwik/icons/AlertTriangle';
import X from 'lucide-icons-qwik/icons/X';
import { getDB, userPortals } from '~/util/db';
import { getSessionUserId, getSessionUser } from '~/util/auth';
import textureManifest from '~/lib/texture-manifest.json';

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
    const isAdmin = user && user.id === '1'; // User ID 1 is administrator
    // Access control: if not public and not owner and not admin
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

  // 1. Handle Save Portal
  if (formData.has('savePortal')) {
    const data = formData.get('savePortal') as string;
    const portalID = formData.get('portalID') as string;
    const portalIMG = formData.get('portalIMG') as string;

    const portalIdParam = requestEvent.url.searchParams.get('portal');
    const portalId = portalIdParam ? parseInt(portalIdParam, 10) || 0 : 0;

    let portalRow: any = undefined;
    if (portalId > 0) {
      portalRow = await db.query.userPortals.findFirst({
        where: eq(userPortals.id, portalId),
      });
    }

    if (portalId === 0 || !portalRow || portalRow.maker !== userId) {
      // Create new portal
      const [result] = await db
        .insert(userPortals)
        .values({
          maker: userId,
          portalID,
          data,
          img: portalIMG,
          public: 0,
        })
        .returning({ id: userPortals.id });

      requestEvent.send(200, result.id.toString());
    } else {
      // Update existing portal
      await db
        .update(userPortals)
        .set({
          portalID,
          data,
          img: portalIMG,
        })
        .where(eq(userPortals.id, portalId));

      requestEvent.send(200, portalId.toString());
    }
    return;
  }

  // 2. Handle Toggle Public
  if (formData.has('togglePrive')) {
    const portalIdParam = requestEvent.url.searchParams.get('portal');
    const portalId = portalIdParam ? parseInt(portalIdParam, 10) || 0 : 0;

    if (portalId > 0) {
      const portalRow = await db.query.userPortals.findFirst({
        where: eq(userPortals.id, portalId),
      });

      if (portalRow && portalRow.maker === userId) {
        const newPublic = portalRow.public === 1 ? 0 : 1;
        await db
          .update(userPortals)
          .set({ public: newPublic })
          .where(eq(userPortals.id, portalId));

        requestEvent.send(200, portalId.toString());
        return;
      }
    }
    requestEvent.send(400, 'Bad Request');
    return;
  }

  // 3. Handle Delete Portal
  if (formData.has('deletePortal')) {
    const portalIdParam = requestEvent.url.searchParams.get('portal');
    const portalId = portalIdParam ? parseInt(portalIdParam, 10) || 0 : 0;

    if (portalId > 0) {
      const portalRow = await db.query.userPortals.findFirst({
        where: eq(userPortals.id, portalId),
      });

      if (portalRow && portalRow.maker === userId) {
        // Soft delete matching PHP: set public=0, maker=-1
        await db
          .update(userPortals)
          .set({
            public: 0,
            maker: '-1',
          })
          .where(eq(userPortals.id, portalId));

        requestEvent.send(200, portalId.toString());
        return;
      }
    }
    requestEvent.send(400, 'Bad Request');
    return;
  }

  requestEvent.send(400, 'Bad Request');
};

export default component$(() => {
  const loaderSig = usePortalEditorLoader();

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    await import('./portal-editor');
  });

  return (
    <>
      {/* Dynamic Style Injection for Editor Controls */}
      <style
        dangerouslySetInnerHTML={`
          .block-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
            gap: 8px;
            margin-top: 8px;
          }
          .block-tile {
            aspect-ratio: 1;
            background-size: cover;
            background-position: center;
            border: 1px solid var(--color-gray-800);
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .block-tile:hover {
            border-color: var(--color-gray-600);
            transform: scale(1.05);
          }
          .block-tile.selected {
            border-color: var(--color-gray-400);
            box-shadow: 0 0 8px rgba(255,255,255,0.15);
          }
          .panel-tab.active {
            border-bottom-color: var(--color-gray-400);
            color: var(--color-gray-100);
            background: rgba(255,255,255,0.02);
          }
          .tab-content {
            display: none !important;
          }
          .tab-content.active {
            display: block !important;
          }
          .design-section {
            border: 1px solid rgba(255,255,255,0.03);
            border-radius: 10px;
            background: rgba(0,0,0,0.25);
            margin-bottom: 12px;
            overflow: hidden;
          }
          .design-section-head {
            padding: 10px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            user-select: none;
            background: rgba(255,255,255,0.01);
          }
          .design-section-head h4 {
            font-size: 12px;
            font-weight: 700;
            color: var(--color-gray-300);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .design-section-body {
            padding: 12px;
            border-top: 1px solid rgba(255,255,255,0.03);
          }
          .design-section-body.collapsed {
            display: none !important;
          }
          .design-chevron {
            transition: transform 0.2s ease;
            font-size: 10px;
            color: var(--color-gray-500);
          }
          .block-search-row {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
          }
          .block-search {
            flex: 1;
            background: rgba(0,0,0,0.4);
            border: 1px solid var(--color-gray-800);
            border-radius: 6px;
            padding: 6px 10px;
            font-size: 12px;
            color: var(--color-gray-200);
          }
          .block-manual {
            width: 90px;
            background: rgba(0,0,0,0.4);
            border: 1px solid var(--color-gray-800);
            border-radius: 6px;
            padding: 6px 10px;
            font-size: 12px;
            color: var(--color-gray-200);
            font-weight: bold;
          }
          .block-search:focus, .block-manual:focus {
            outline: none;
            border-color: var(--color-gray-600);
          }
          .face-buttons {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 4px;
            margin-top: 6px;
          }
          .face-btn {
            padding: 5px 2px;
            font-size: 10px;
            font-weight: 700;
            background: rgba(0,0,0,0.3);
            border: 1px solid var(--color-gray-800);
            border-radius: 4px;
            color: var(--color-gray-400);
            cursor: pointer;
            transition: all 0.1s ease;
            text-transform: uppercase;
          }
          .face-btn:hover {
            border-color: var(--color-gray-700);
            color: var(--color-gray-300);
          }
          .face-btn.active {
            background: var(--color-gray-800);
            border-color: var(--color-gray-500);
            color: var(--color-gray-100);
          }
          .size-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 8px;
          }
          .size-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .size-inputs {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .size-input {
            width: 100%;
            background: rgba(0,0,0,0.4);
            border: 1px solid var(--color-gray-800);
            border-radius: 6px;
            padding: 6px 8px;
            font-size: 12px;
            color: var(--color-gray-200);
            text-align: center;
          }
          .size-input:focus {
            outline: none;
            border-color: var(--color-gray-600);
          }
          .size-x {
            color: var(--color-gray-500);
            font-weight: bold;
          }
          .field-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 0;
          }
          .field-col {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-bottom: 12px;
          }
          .field-label {
            font-size: 11px;
            font-weight: 700;
            color: var(--color-gray-400);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .field-input, .field-textarea, .field-select {
            background: rgba(0,0,0,0.4);
            border: 1px solid var(--color-gray-800);
            border-radius: 6px;
            padding: 8px 10px;
            font-size: 12px;
            color: var(--color-gray-200);
            width: 100%;
          }
          .field-input:focus, .field-textarea:focus, .field-select:focus {
            outline: none;
            border-color: var(--color-gray-600);
          }
          .field-help {
            font-size: 11px;
            color: var(--color-gray-500);
            margin-top: 2px;
            line-height: 1.4;
          }
          .color-pick-row {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .color-swatch-sm {
            width: 32px;
            height: 32px;
            border-radius: 6px;
            border: 1px solid var(--color-gray-800);
            overflow: hidden;
            position: relative;
            background: #000;
          }
          .color-swatch-sm input[type="color"] {
            position: absolute;
            top: -8px;
            left: -8px;
            width: 48px;
            height: 48px;
            cursor: pointer;
            border: none;
            background: none;
            padding: 0;
          }
          .color-preview-text {
            font-family: monospace;
            font-size: 11px;
            color: var(--color-gray-400);
            font-weight: bold;
          }
          .toggle-switch {
            position: relative;
            display: inline-block;
            width: 36px;
            height: 20px;
          }
          .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
          }
          .toggle-track {
            position: absolute;
            cursor: pointer;
            top: 0; left: 0; right: 0; bottom: 0;
            background-color: rgba(255,255,255,0.03);
            border: 1px solid var(--color-gray-800);
            transition: .2s;
            border-radius: 20px;
          }
          .toggle-track:before {
            position: absolute;
            content: "";
            height: 12px;
            width: 12px;
            left: 3px;
            bottom: 3px;
            background-color: var(--color-gray-500);
            transition: .2s;
            border-radius: 50%;
          }
          .toggle-switch input:checked + .toggle-track {
            background-color: rgba(255,255,255,0.08);
            border-color: var(--color-gray-500);
          }
          .toggle-switch input:checked + .toggle-track:before {
            transform: translateX(16px);
            background-color: var(--color-gray-100);
          }
          .addon-card {
            background: rgba(0,0,0,0.3);
            border: 1px solid var(--color-gray-800);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 12px;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .addon-name-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .addon-name {
            font-size: 12px;
            font-weight: 700;
            color: var(--color-gray-200);
          }
          .addon-desc {
            font-size: 11px;
            color: var(--color-gray-500);
            line-height: 1.4;
          }
          .addon-group {
            border-top: 1px solid rgba(255,255,255,0.03);
            padding-top: 8px;
            margin-top: 4px;
          }
          .addon-group-title {
            font-size: 10px;
            font-weight: 700;
            color: var(--color-gray-400);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 6px;
          }
          .modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 1000;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
          }
          .modal-card {
            width: 100%;
            max-width: 420px;
            background: var(--color-bg);
            border: 1px solid var(--color-gray-800);
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          .modal-card.modal-sm {
            max-width: 320px;
          }
          .modal-header {
            padding: 14px 16px;
            border-bottom: 1px solid var(--color-gray-850);
            background: rgba(255,255,255,0.01);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .modal-header h3 {
            font-size: 13px;
            font-weight: 700;
            color: var(--color-gray-200);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .modal-close {
            background: none;
            border: none;
            color: var(--color-gray-500);
            cursor: pointer;
            font-size: 14px;
            transition: color 0.15s ease;
          }
          .modal-close:hover {
            color: var(--color-gray-300);
          }
          .modal-body {
            padding: 16px;
            font-size: 12px;
            color: var(--color-gray-400);
            line-height: 1.5;
          }
          .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 16px;
          }
          .modal-btn {
            padding: 6px 12px;
            font-size: 11px;
            font-weight: 700;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .modal-btn-danger {
            background: #ef4444;
            color: white;
            border: none;
          }
          .modal-btn-danger:hover {
            background: #dc2626;
          }
          .modal-btn-secondary {
            background: rgba(255,255,255,0.03);
            border: 1px solid var(--color-gray-800);
            color: var(--color-gray-300);
          }
          .modal-btn-secondary:hover {
            background: rgba(255,255,255,0.06);
            color: white;
          }
          .loading-overlay {
            position: fixed;
            inset: 0;
            z-index: 10000;
            background: var(--color-bg);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .loading-inner {
            text-align: center;
            max-width: 260px;
          }
          .loading-inner h1 {
            font-size: 12px;
            font-weight: 700;
            color: var(--color-gray-400);
            margin-top: 16px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .loading-spinner {
            width: 36px;
            height: 36px;
            margin: 0 auto;
            border: 3px solid rgba(255,255,255,0.03);
            border-top-color: var(--color-gray-500);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          .loading-bar-track {
            width: 140px;
            height: 2px;
            margin: 16px auto 0;
            background: rgba(255,255,255,0.03);
            border-radius: 2px;
            overflow: hidden;
          }
          .loading-bar-fill {
            height: 100%;
            width: 30%;
            background: var(--color-gray-400);
            border-radius: 2px;
            animation: loadSlide 1.4s ease-in-out infinite;
          }
          @keyframes loadSlide { 0% { transform: translateX(-120%); } 100% { transform: translateX(350%); } }
        `}
      />

      {/* Loading Screen */}
      <div id="loadingOverlay" class="loading-overlay">
        <div class="loading-inner">
          <div class="loading-spinner"></div>
          <h1>Loading Portal Editor...</h1>
          <div class="loading-bar-track">
            <div class="loading-bar-fill"></div>
          </div>
        </div>
      </div>

      <div class="flex w-full flex-col gap-6" id="app">
        {/* Editor Control Bar (Toolbar Overhauled) */}
        <header class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-800/80 bg-gray-900/50 p-4 shadow-lg backdrop-blur">
          <div class="flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-700/50 bg-gray-800/80 text-gray-300">
              <Grid3x3 class="h-4 w-4" />
            </div>
            <div>
              <h1 class="text-sm leading-none font-black tracking-wider text-gray-100 uppercase">
                Portal Editor
              </h1>
              <span class="mt-1 block text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                Dimensions Config
              </span>
            </div>
          </div>
          <div class="flex items-center gap-3">
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
                value="testPortal"
                spellcheck={false}
              />
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button
              id="btnUndo"
              class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-gray-800 bg-gray-950 text-gray-300 transition-all hover:border-gray-700 hover:text-white disabled:pointer-events-none disabled:opacity-20"
              title="Undo (Ctrl+Z)"
              disabled
            >
              <RotateCcw class="h-4 w-4" />
            </button>
            <button
              id="btnRedo"
              class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-gray-800 bg-gray-950 text-gray-300 transition-all hover:border-gray-700 hover:text-white disabled:pointer-events-none disabled:opacity-20"
              title="Redo (Ctrl+Y)"
              disabled
            >
              <RotateCw class="h-4 w-4" />
            </button>
            <div class="mx-1 h-6 w-px bg-gray-800"></div>
            {loaderSig.value.isLoggedIn ? (
              <button
                id="btnSave"
                class="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-gray-600 to-gray-500 px-4 text-xs font-bold tracking-wider text-white uppercase shadow-md transition-all hover:from-gray-500 hover:to-gray-400"
              >
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
            <button
              id="btnDownload"
              class="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-gray-800 bg-gray-950 px-4 text-xs font-bold tracking-wider text-gray-200 uppercase transition-all hover:border-gray-700 hover:bg-gray-900"
            >
              <Download class="h-4 w-4" />
              <span>Download</span>
            </button>
            <button
              id="btnCopy"
              class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-gray-800 bg-gray-950 text-gray-300 transition-all hover:border-gray-700 hover:text-white"
              title="Copy YAML"
            >
              <Clipboard class="h-4 w-4" />
            </button>
            {loaderSig.value.isOwner && (
              <>
                <div class="mx-1 h-6 w-px bg-gray-800"></div>
                <button
                  id="btnPublic"
                  class="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-gray-800 bg-gray-950 px-4 text-xs font-bold tracking-wider text-gray-200 uppercase transition-all hover:border-gray-700 hover:bg-gray-900"
                >
                  <Eye class="h-4 w-4" />
                  <span>
                    {loaderSig.value.portalPublic ? 'Private' : 'Public'}
                  </span>
                </button>
                <button
                  id="btnDelete"
                  class="hover:border-red-850 flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-red-900/40 bg-red-950/40 px-4 text-xs font-bold tracking-wider text-red-400 uppercase transition-all hover:bg-red-900/20"
                >
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
        </header>

        {/* Workspace Grid */}
        <main class="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* LEFT PANEL: Design, Settings, Addons */}
          <aside
            class="flex h-[600px] flex-col overflow-hidden rounded-2xl border border-gray-800/80 bg-gray-900/40 shadow-xl backdrop-blur lg:col-span-4 lg:h-[700px]"
            id="panelLeft"
          >
            {/* Tabs */}
            <div class="flex border-b border-gray-800/80 bg-black/20">
              <button
                class="panel-tab active flex-1 cursor-pointer border-b-2 border-transparent py-3 text-xs font-bold tracking-wider text-gray-400 uppercase transition-all hover:text-gray-200"
                data-tab="design"
              >
                <Palette class="me-1 inline-block h-3.5 w-3.5" />
                Design
              </button>
              <button
                class="panel-tab flex-1 cursor-pointer border-b-2 border-transparent py-3 text-xs font-bold tracking-wider text-gray-400 uppercase transition-all hover:text-gray-200"
                data-tab="settings"
              >
                <Sliders class="me-1 inline-block h-3.5 w-3.5" />
                Settings
              </button>
              <button
                class="panel-tab flex-1 cursor-pointer border-b-2 border-transparent py-3 text-xs font-bold tracking-wider text-gray-400 uppercase transition-all hover:text-gray-200"
                data-tab="addons"
              >
                <Puzzle class="me-1 inline-block h-3.5 w-3.5" />
                Addons
              </button>
            </div>

            {/* Panel Body */}
            <div class="flex-1 space-y-4 overflow-y-auto p-4">
              {/* Design Tab */}
              <div class="tab-content active" id="tabDesign" data-tab="design">
                <div class="space-y-4">
                  {/* Frame Block */}
                  <div class="design-section">
                    <div
                      class="design-section-head"
                      data-collapse="frameSection"
                    >
                      <h4>
                        <Boxes class="inline-block h-4 w-4 text-gray-400" />{' '}
                        Frame Block
                      </h4>
                      <ChevronDown class="design-chevron h-4 w-4" />
                    </div>
                    <div class="design-section-body" id="frameSection">
                      <div class="block-search-row">
                        <input
                          type="text"
                          id="frameSearch"
                          class="block-search"
                          placeholder="Search blocks..."
                        />
                        <input
                          type="text"
                          id="frameManual"
                          class="block-manual"
                          placeholder="e.g. STONE"
                          title="Manual material input"
                        />
                      </div>
                      <div class="block-grid" id="frameGrid"></div>
                    </div>
                  </div>

                  {/* Inside Block */}
                  <div class="design-section">
                    <div
                      class="design-section-head"
                      data-collapse="insideSection"
                    >
                      <h4>
                        <Box class="inline-block h-4 w-4 text-gray-400" />{' '}
                        Inside Block
                      </h4>
                      <ChevronDown class="design-chevron h-4 w-4" />
                    </div>
                    <div class="design-section-body" id="insideSection">
                      <div class="block-search-row">
                        <input
                          type="text"
                          id="insideSearch"
                          class="block-search"
                          placeholder="Search blocks..."
                        />
                        <input
                          type="text"
                          id="insideManual"
                          class="block-manual"
                          placeholder="e.g. NETHER_PORTAL"
                          title="Manual material input"
                        />
                      </div>
                      <div class="block-grid" id="insideGrid"></div>
                    </div>
                  </div>

                  {/* Lighter Material */}
                  <div class="design-section">
                    <div
                      class="design-section-head"
                      data-collapse="lighterSection"
                    >
                      <h4>
                        <Flame class="inline-block h-4 w-4 text-gray-400" />{' '}
                        Lighter
                      </h4>
                      <ChevronDown class="design-chevron h-4 w-4" />
                    </div>
                    <div class="design-section-body" id="lighterSection">
                      <div class="block-search-row">
                        <input
                          type="text"
                          id="lighterSearch"
                          class="block-search"
                          placeholder="Search items..."
                        />
                        <input
                          type="text"
                          id="lighterManual"
                          class="block-manual"
                          placeholder="e.g. FLINT_AND_STEEL"
                          title="Manual material input"
                        />
                      </div>
                      <div class="block-grid" id="lighterGrid"></div>
                    </div>
                  </div>

                  {/* Size & Face */}
                  <div class="design-section">
                    <div class="design-section-head">
                      <h4>
                        <Maximize2 class="inline-block h-4 w-4 text-gray-400" />{' '}
                        Size & Face
                      </h4>
                    </div>
                    <div class="design-section-body">
                      <div class="face-selector">
                        <span class="field-label">Face Direction</span>
                        <div class="face-buttons" id="faceButtons">
                          <button class="face-btn active" data-face="all">
                            all
                          </button>
                          <button class="face-btn" data-face="up">
                            up
                          </button>
                          <button class="face-btn" data-face="down">
                            down
                          </button>
                          <button class="face-btn" data-face="east">
                            east
                          </button>
                          <button class="face-btn" data-face="west">
                            west
                          </button>
                          <button class="face-btn" data-face="north">
                            north
                          </button>
                          <button class="face-btn" data-face="south">
                            south
                          </button>
                          <button class="face-btn" data-face="x">
                            x
                          </button>
                          <button class="face-btn" data-face="y">
                            y
                          </button>
                          <button class="face-btn" data-face="z">
                            z
                          </button>
                        </div>
                      </div>
                      <div class="size-grid">
                        <div class="size-group">
                          <span class="field-label">Min size</span>
                          <div class="size-inputs">
                            <input
                              type="number"
                              id="minWidth"
                              class="size-input"
                              value="4"
                              min="1"
                              max="50"
                            />
                            <span class="size-x">&times;</span>
                            <input
                              type="number"
                              id="minHeight"
                              class="size-input"
                              value="5"
                              min="1"
                              max="50"
                            />
                          </div>
                        </div>
                        <div class="size-group">
                          <span class="field-label">Max size</span>
                          <div class="size-inputs">
                            <input
                              type="number"
                              id="maxWidth"
                              class="size-input"
                              value="14"
                              min="1"
                              max="50"
                            />
                            <span class="size-x">&times;</span>
                            <input
                              type="number"
                              id="maxHeight"
                              class="size-input"
                              value="15"
                              min="1"
                              max="50"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Particles */}
                  <div class="design-section">
                    <div class="design-section-head">
                      <h4>
                        <Sparkles class="inline-block h-4 w-4 text-gray-400" />{' '}
                        Particles
                      </h4>
                    </div>
                    <div class="design-section-body">
                      <div class="field-row">
                        <span class="field-label">Enable</span>
                        <label class="toggle-switch">
                          <input type="checkbox" id="particlesEnable" checked />
                          <span class="toggle-track"></span>
                        </label>
                      </div>
                      <div class="field-row">
                        <span class="field-label">Color</span>
                        <div class="color-pick-row">
                          <div class="color-swatch-sm">
                            <input
                              type="color"
                              id="particlesColor"
                              value="#ffffff"
                            />
                          </div>
                          <span
                            class="color-preview-text"
                            id="particlesColorText"
                          >
                            255;255;255
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings Tab */}
              <div class="tab-content" id="tabSettings" data-tab="settings">
                <div class="space-y-4">
                  <div class="design-section">
                    <div class="design-section-head">
                      <h4>
                        <Settings class="inline-block h-4 w-4 text-gray-400" />{' '}
                        General
                      </h4>
                    </div>
                    <div class="design-section-body">
                      <div class="field-row">
                        <span class="field-label">Enable</span>
                        <label class="toggle-switch">
                          <input type="checkbox" id="optEnable" checked />
                          <span class="toggle-track"></span>
                        </label>
                      </div>
                      <div class="field-col">
                        <span class="field-label">Display Name</span>
                        <input
                          type="text"
                          id="optDisplayName"
                          class="field-input"
                          value="TestPortal"
                        />
                      </div>
                      <div class="field-col">
                        <span class="field-label">Break Sound Effect</span>
                        <input
                          type="text"
                          id="optBreakEffect"
                          class="field-input"
                          value="BLOCK_GLASS_BREAK"
                          placeholder="BLOCK_GLASS_BREAK"
                        />
                        <span class="field-help">
                          Bukkit sound played when the portal is destroyed
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="design-section">
                    <div class="design-section-head">
                      <h4>
                        <Globe class="inline-block h-4 w-4 text-gray-400" />{' '}
                        World & Teleport
                      </h4>
                    </div>
                    <div class="design-section-body">
                      <div class="field-col">
                        <span class="field-label">Destination World</span>
                        <input
                          type="text"
                          id="optWorldName"
                          class="field-input"
                          value="world_nether"
                          placeholder="e.g. world_nether"
                        />
                      </div>
                      <div class="field-col">
                        <span class="field-label">Teleport Delay (ticks)</span>
                        <input
                          type="number"
                          id="optTeleportDelay"
                          class="field-input"
                          value="4"
                          min="0"
                        />
                      </div>
                      <div class="field-col">
                        <span class="field-label">Allowed Worlds</span>
                        <textarea
                          id="optAllowedWorlds"
                          class="field-textarea"
                          rows={3}
                          placeholder="Empty = all worlds. One world per line. Prefix with ! to exclude."
                        ></textarea>
                        <span class="field-help">
                          Leave empty for all worlds. Use '!' prefix to exclude.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="design-section">
                    <div class="design-section-head">
                      <h4>
                        <DoorOpen class="inline-block h-4 w-4 text-gray-400" />{' '}
                        Exit Portal
                      </h4>
                    </div>
                    <div class="design-section-body">
                      <div class="field-row">
                        <span class="field-label">Build Exit Portal</span>
                        <label class="toggle-switch">
                          <input type="checkbox" id="optExitEnable" checked />
                          <span class="toggle-track"></span>
                        </label>
                      </div>
                      <div class="size-grid">
                        <div class="size-group">
                          <span class="field-label">Fixed Width</span>
                          <input
                            type="number"
                            id="optExitWidth"
                            class="size-input"
                            value="-1"
                            min="-1"
                          />
                          <span class="field-help">-1 = auto</span>
                        </div>
                        <div class="size-group">
                          <span class="field-label">Fixed Height</span>
                          <input
                            type="number"
                            id="optExitHeight"
                            class="size-input"
                            value="-1"
                            min="-1"
                          />
                          <span class="field-help">-1 = auto</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="design-section">
                    <div
                      class="design-section-head"
                      data-collapse="entitiesSection"
                    >
                      <h4>
                        <Bug class="inline-block h-4 w-4 text-gray-400" />{' '}
                        Entities{' '}
                        <span class="rounded bg-gray-800 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-gray-400 uppercase">
                          Advanced
                        </span>
                      </h4>
                      <ChevronDown class="design-chevron h-4 w-4" />
                    </div>
                    <div
                      class="design-section-body collapsed"
                      id="entitiesSection"
                    >
                      <div class="field-col">
                        <span class="field-label">Transformation Rules</span>
                        <textarea
                          id="optTransformation"
                          class="field-textarea"
                          rows={3}
                          placeholder="SKELETON->WITHER_SKELETON"
                        >
                          SKELETON-&gt;WITHER_SKELETON
                        </textarea>
                        <span class="field-help">
                          Format: ENTITY_FROM-&gt;ENTITY_TO (one per line)
                        </span>
                      </div>
                      <div class="field-col">
                        <span class="field-label">Spawn Delay (ms)</span>
                        <input
                          type="text"
                          id="optSpawnDelay"
                          class="field-input"
                          value="60000-120000"
                          placeholder="60000-120000"
                        />
                        <span class="field-help">
                          Min-Max delay in milliseconds
                        </span>
                      </div>
                      <div class="field-col">
                        <span class="field-label">Spawn List</span>
                        <textarea
                          id="optSpawnList"
                          class="field-textarea"
                          rows={3}
                          placeholder="ZOMBIE;30&#10;SKELETON;30"
                        >
                          {'ZOMBIE;30\nSKELETON;30'}
                        </textarea>
                        <span class="field-help">
                          Format: ENTITY;CHANCE (one per line)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Addons Tab */}
              <div class="tab-content" id="tabAddons" data-tab="addons">
                <div class="space-y-4">
                  <div class="addons-list" id="addonsList"></div>
                  <div class="p-2 text-center text-[11px] text-gray-500 italic">
                    Not all addons shown. Check the{' '}
                    <a
                      href="https://astaspastagam.gitbook.io/first-steps/configuring-dimensions/addons"
                      target="_blank"
                      class="text-gray-400 hover:underline"
                      rel="noreferrer"
                    >
                      wiki
                    </a>{' '}
                    for more.
                  </div>
                  <div
                    class="addon-options mt-4 space-y-4"
                    id="addonOptions"
                  ></div>
                </div>
              </div>
            </div>
          </aside>

          {/* Hidden drag handles to satisfy layout scripts without breaking layout */}
          <div class="hidden" id="resizeLeft"></div>
          <div class="hidden" id="resizeRight"></div>

          {/* CENTER PANEL: 3D Viewport */}
          <div class="flex flex-col gap-4 lg:col-span-5">
            <div
              class="relative flex h-[450px] w-full flex-col justify-between overflow-hidden rounded-2xl border border-gray-800/80 bg-gray-950 shadow-2xl lg:h-[700px]"
              id="viewportWrap"
            >
              <canvas
                id="viewport"
                class="block h-full w-full flex-1 bg-black"
              ></canvas>
              <div class="absolute top-4 left-4 z-10">
                <span class="rounded-lg border border-gray-800 bg-black/60 px-2.5 py-1 text-[10px] font-bold tracking-wider text-gray-300 uppercase">
                  3D Viewport
                </span>
              </div>
              <div class="absolute right-4 bottom-4 z-10">
                <button
                  class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-800 bg-black/60 text-gray-300 transition-all hover:border-gray-700 hover:text-white"
                  id="btnResetCam"
                  title="Reset camera"
                >
                  <Home class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: YAML Preview */}
          <aside
            class="flex h-[450px] flex-col overflow-hidden rounded-2xl border border-gray-800/80 bg-gray-900/40 shadow-xl backdrop-blur lg:col-span-3 lg:h-[700px]"
            id="panelRight"
          >
            <div class="flex items-center justify-between border-b border-gray-800/80 bg-black/20 px-4 py-3">
              <span class="text-xs font-bold tracking-wider text-gray-400 uppercase">
                YAML Output
              </span>
              <button
                class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-gray-800 bg-gray-950 text-gray-300 transition-all hover:border-gray-700 hover:text-white"
                id="btnCopyYaml"
                title="Copy YAML"
              >
                <Clipboard class="h-3.5 w-3.5" />
              </button>
            </div>
            <div class="flex-1 overflow-auto bg-black/40 p-4 font-mono text-xs leading-relaxed text-gray-300 selection:bg-gray-700 selection:text-white">
              <pre
                id="yamlPreview"
                class="word-break whitespace-pre-wrap"
              ></pre>
            </div>
          </aside>
        </main>
      </div>

      {/* DELETE CONFIRM MODAL */}
      <div id="deleteModal" class="modal-overlay" style="display:none">
        <div class="modal-card modal-sm">
          <div class="modal-header">
            <h3>
              <AlertTriangle class="inline-block h-4 w-4 text-red-500" /> Delete
              Portal?
            </h3>
            <button class="modal-close" id="closeDeleteModal">
              <X class="h-4 w-4" />
            </button>
          </div>
          <div class="modal-body">
            <p>
              This action cannot be undone. Your portal configuration will be
              permanently removed.
            </p>
            <div class="modal-actions">
              <button
                class="modal-btn modal-btn-danger cursor-pointer"
                id="confirmDelete"
              >
                Delete
              </button>
              <button
                class="modal-btn modal-btn-secondary cursor-pointer"
                id="cancelDelete"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Globals injection */}
      <script
        dangerouslySetInnerHTML={`
          window.TEXTURE_MANIFEST = ${JSON.stringify(loaderSig.value.textureManifest)};
          window.TEXTURE_BASE = '/editor/portal/Images/';
          window.ADDONS_DATA = ${JSON.stringify(loaderSig.value.addonsList)};
          window.IS_LOGGED_IN = ${loaderSig.value.isLoggedIn ? 'true' : 'false'};
          window.IS_OWNER = ${loaderSig.value.isOwner ? 'true' : 'false'};
          window.PORTAL_ID = ${loaderSig.value.portalId};
          ${
            loaderSig.value.portalData
              ? `window.PORTAL_LOAD_DATA = ${JSON.stringify(loaderSig.value.portalData)};`
              : ''
          }
        `}
      />
    </>
  );
});
