import { component$, useVisibleTask$ } from "@builder.io/qwik";

export default component$(() => {
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    import("./particle-editor");
  });

  return (
    <>
      {/* Dynamic Style Injection for Editor Controls */}
      <style
        dangerouslySetInnerHTML={`
          .layer-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 12px;
            background: rgba(0,0,0,0.25);
            border: 1px solid var(--color-gray-800);
            border-radius: 8px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .layer-item:hover {
            border-color: var(--color-gray-700);
            background: rgba(255,255,255,0.01);
          }
          .layer-item.active {
            border-color: var(--color-gray-500);
            background: rgba(255,255,255,0.03);
            box-shadow: 0 0 8px rgba(255,255,255,0.05);
          }
          .layer-color-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 8px;
            flex-shrink: 0;
          }
          .layer-name {
            flex-grow: 1;
            font-size: 12px;
            font-weight: 600;
            color: var(--color-gray-200);
          }
          .layer-actions {
            display: flex;
            gap: 4px;
          }
          .layer-action-btn {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--color-gray-950);
            border: 1px solid var(--color-gray-800);
            border-radius: 4px;
            color: var(--color-gray-400);
            cursor: pointer;
            font-size: 11px;
            transition: all 0.1s ease;
          }
          .layer-action-btn:hover {
            border-color: var(--color-gray-600);
            color: var(--color-gray-200);
          }
          .layer-action-btn.danger {
            color: #f87171;
          }
          .layer-action-btn.danger:hover {
            background: rgba(239, 68, 68, 0.1);
            border-color: rgba(239, 68, 68, 0.4);
          }
          .insp-section {
            border: 1px solid rgba(255,255,255,0.03);
            border-radius: 10px;
            background: rgba(0,0,0,0.2);
            margin-bottom: 12px;
            overflow: hidden;
            padding: 12px;
          }
          .insp-section-title {
            font-size: 10px;
            font-weight: 850;
            color: var(--color-gray-400);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 10px;
            display: block;
            border-bottom: 1px solid rgba(255,255,255,0.03);
            padding-bottom: 6px;
          }
          .insp-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            gap: 12px;
          }
          .insp-row:last-child {
            margin-bottom: 0;
          }
          .insp-label {
            font-size: 12px;
            color: var(--color-gray-400);
            font-weight: 650;
          }
          .insp-input, .insp-select {
            background: rgba(0,0,0,0.4);
            border: 1px solid var(--color-gray-800);
            border-radius: 6px;
            padding: 6px 8px;
            font-size: 11px;
            color: var(--color-gray-200);
            outline: none;
            max-width: 110px;
            width: 100%;
          }
          .insp-input:focus, .insp-select:focus {
            border-color: var(--color-gray-650);
          }
          .insp-slider {
            flex: 1;
            height: 4px;
            background: var(--color-gray-800);
            border-radius: 2px;
            outline: none;
            appearance: none;
            cursor: pointer;
          }
          .insp-num {
            font-family: monospace;
            font-size: 11px;
            font-weight: bold;
            color: var(--color-gray-400);
            min-width: 28px;
            text-align: right;
          }
          .toggle-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }
          .color-picker {
            background: rgba(0,0,0,0.35);
            border: 1px solid var(--color-gray-800);
            border-radius: 8px;
            padding: 10px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 6px;
          }
          .color-top-row {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .color-swatch {
            width: 28px;
            height: 28px;
            border-radius: 5px;
            border: 1px solid var(--color-gray-700);
            cursor: pointer;
          }
          .color-hex {
            flex: 1;
            background: rgba(0,0,0,0.4);
            border: 1px solid var(--color-gray-800);
            border-radius: 6px;
            padding: 4px 8px;
            font-size: 11px;
            color: var(--color-gray-300);
            font-family: monospace;
            font-weight: bold;
            text-transform: uppercase;
          }
          .color-slider-row {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .color-slider-label {
            font-size: 10px;
            font-weight: 800;
            width: 12px;
            color: var(--color-gray-500);
          }
          .color-slider-val {
            font-family: monospace;
            font-size: 10px;
            width: 24px;
            text-align: right;
            color: var(--color-gray-400);
          }
          .shape-selector {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 4px;
            margin-top: 4px;
          }
          .shape-btn {
            padding: 6px 4px;
            font-size: 10px;
            font-weight: 700;
            background: rgba(0,0,0,0.3);
            border: 1px solid var(--color-gray-800);
            border-radius: 4px;
            color: var(--color-gray-400);
            cursor: pointer;
            transition: all 0.15s ease;
            text-transform: uppercase;
          }
          .shape-btn:hover {
            border-color: var(--color-gray-700);
            color: var(--color-gray-200);
          }
          .shape-btn.active {
            background: var(--color-gray-800);
            border-color: var(--color-gray-500);
            color: white;
          }
          .preset-grid, .shape-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
            gap: 12px;
          }
          .preset-card, .shape-card {
            background: rgba(255,255,255,0.02);
            border: 1px solid var(--color-gray-800);
            border-radius: 10px;
            padding: 12px;
            text-align: center;
            cursor: pointer;
            transition: all 0.15s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }
          .preset-card:hover, .shape-card:hover {
            border-color: var(--color-gray-500);
            background: rgba(255,255,255,0.05);
            transform: translateY(-2px);
          }
          .preset-card-title, .shape-card-title {
            font-size: 11px;
            font-weight: 700;
            color: var(--color-gray-200);
          }
          .preset-card-icon, .shape-card-icon {
            font-size: 20px;
            color: var(--color-gray-400);
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
          .inspector-empty {
            text-align: center;
            padding: 48px 24px;
            color: var(--color-gray-600);
          }
          .inspector-empty i {
            font-size: 24px;
            margin-bottom: 8px;
            display: block;
          }
          .inspector-empty p {
            font-size: 12px;
            font-weight: 600;
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
            max-width: 440px;
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

      {/* Loading Overlay */}
      <div id="loadingOverlay" class="loading-overlay">
        <div class="loading-inner">
          <div class="loading-spinner"></div>
          <h1>Loading Particle Editor...</h1>
          <div class="loading-bar-track">
            <div class="loading-bar-fill"></div>
          </div>
        </div>
      </div>

      <div class="w-full flex flex-col gap-6" id="app">
        {/* Editor Control Bar */}
        <header class="bg-gray-900/50 backdrop-blur border border-gray-800/80 rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4 shadow-lg">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-gray-800/80 border border-gray-700/50 flex items-center justify-center text-gray-300">
              <i class="bi bi-stars text-sm"></i>
            </div>
            <div>
              <h1 class="text-sm font-black text-gray-100 tracking-wider uppercase leading-none">Particle Editor</h1>
              <span class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 block">Cosmetics Config</span>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 bg-black/40 border border-gray-800/80 rounded-xl px-3 py-2">
              <label for="packName" class="text-[10px] text-gray-500 font-bold uppercase tracking-wider select-none">Pack Name</label>
              <input
                type="text"
                id="packName"
                class="bg-transparent border-none text-gray-200 text-xs font-semibold focus:outline-none w-36 placeholder-gray-700"
                value="My Particle Pack"
                spellcheck={false}
              />
            </div>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <button id="btnUndo" class="w-9 h-9 flex items-center justify-center bg-gray-950 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white rounded-xl disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer" title="Undo (Ctrl+Z)" disabled>
              <i class="bi bi-arrow-counterclockwise text-sm"></i>
            </button>
            <button id="btnRedo" class="w-9 h-9 flex items-center justify-center bg-gray-950 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white rounded-xl disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer" title="Redo (Ctrl+Y)" disabled>
              <i class="bi bi-arrow-clockwise text-sm"></i>
            </button>
            <div class="h-6 w-px bg-gray-800 mx-1"></div>
            <button id="btnPresets" class="px-4 h-9 bg-gray-950 border border-gray-800 hover:bg-gray-900 hover:border-gray-700 text-gray-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider">
              <i class="bi bi-collection-fill text-sm"></i>
              <span>Presets</span>
            </button>
            <div class="h-6 w-px bg-gray-800 mx-1"></div>
            <button id="btnRun" class="px-4 h-9 bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider">
              <i class="bi bi-play-fill text-sm"></i>
              <span>Run</span>
            </button>
            <button
              id="btnStop"
              class="px-4 h-9 bg-red-950/40 border border-red-900/40 hover:bg-red-900/20 hover:border-red-850 text-red-400 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
              style="display:none"
            >
              <i class="bi bi-stop-fill text-sm"></i>
              <span>Stop</span>
            </button>
            <div class="h-6 w-px bg-gray-800 mx-1"></div>
            <button id="btnDownload" class="px-4 h-9 bg-gray-950 border border-gray-800 hover:bg-gray-900 hover:border-gray-700 text-gray-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider">
              <i class="bi bi-download text-sm"></i>
              <span>Download</span>
            </button>
            <button id="btnCopy" class="w-9 h-9 flex items-center justify-center bg-gray-950 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white rounded-xl transition-all cursor-pointer" title="Copy YAML">
              <i class="bi bi-clipboard text-sm"></i>
            </button>
          </div>
        </header>

        {/* Workspace Grid */}
        <main class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT PANEL: Layers */}
          <aside class="lg:col-span-4 bg-gray-900/40 backdrop-blur border border-gray-800/80 rounded-2xl shadow-xl flex flex-col overflow-hidden h-[500px] lg:h-[650px]" id="panelLeft">
            <div class="px-4 py-3 border-b border-gray-800/80 bg-black/20 flex justify-between items-center">
              <span class="text-xs font-bold uppercase tracking-wider text-gray-400">Layers</span>
              <button id="btnAddLayer" class="w-7 h-7 flex items-center justify-center bg-gray-950 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white rounded-md transition-all cursor-pointer" title="Add layer">
                <i class="bi bi-plus-lg text-xs"></i>
              </button>
            </div>
            <div class="flex-1 overflow-y-auto p-4" id="layerList"></div>
            <div class="p-4 border-t border-gray-800/80 bg-black/10">
              <div class="flex flex-col gap-2">
                <div class="flex justify-between items-center">
                  <label for="freqSlider" class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Simulation Speed</label>
                  <span id="freqValue" class="font-mono text-xs text-gray-400 font-bold">20</span>
                </div>
                <input type="range" id="freqSlider" min="1" max="40" value="20" class="insp-slider w-full cursor-pointer" />
              </div>
            </div>
          </aside>

          {/* Hidden drag handles to satisfy layout scripts */}
          <div class="hidden" id="resizeLeft"></div>
          <div class="hidden" id="resizeRight"></div>

          {/* CENTER PANEL: 3D Viewport */}
          <div class="lg:col-span-4 flex flex-col gap-4">
            <div class="relative bg-gray-950 border border-gray-800/80 rounded-2xl overflow-hidden shadow-2xl h-[400px] lg:h-[650px] w-full flex flex-col justify-between" id="viewportWrap">
              <canvas id="viewport" class="flex-1 w-full h-full block bg-black"></canvas>
              <div class="absolute top-4 left-4 z-10 flex items-center gap-2">
                <span class="px-2.5 py-1 bg-black/60 border border-gray-800/80 text-[10px] font-bold tracking-wider uppercase rounded-lg text-gray-300" id="particleCount">0 particles</span>
              </div>
              <div class="absolute bottom-4 right-4 z-10">
                <button class="w-9 h-9 flex items-center justify-center bg-black/60 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white rounded-lg transition-all cursor-pointer" id="btnResetCam" title="Reset camera">
                  <i class="bi bi-house"></i>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Inspector */}
          <aside class="lg:col-span-4 bg-gray-900/40 backdrop-blur border border-gray-800/80 rounded-2xl shadow-xl flex flex-col overflow-hidden h-[450px] lg:h-[650px]" id="panelRight">
            <div class="px-4 py-3 border-b border-gray-800/80 bg-black/20 flex justify-between items-center">
              <span class="text-xs font-bold uppercase tracking-wider text-gray-400">Inspector</span>
            </div>
            <div class="flex-1 overflow-y-auto p-4" id="inspector">
              <div class="inspector-empty flex flex-col items-center justify-center text-center p-8 text-gray-600 h-full">
                <i class="bi bi-cursor text-2xl mb-2 block"></i>
                <p class="text-xs font-bold uppercase tracking-wider text-gray-500">Select a layer to edit</p>
              </div>
            </div>
          </aside>
        </main>
      </div>

      {/* PRESETS MODAL */}
      <div id="presetsModal" class="modal-overlay" style="display:none">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Presets</h3>
            <button class="modal-close" id="closePresetsModal">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="modal-body overflow-y-auto max-h-[350px] p-4">
            <div class="preset-grid" id="presetGrid"></div>
          </div>
        </div>
      </div>

      {/* ADD LAYER MODAL */}
      <div id="addLayerModal" class="modal-overlay" style="display:none">
        <div class="modal-card modal-sm">
          <div class="modal-header">
            <h3>Add Layer</h3>
            <button class="modal-close" id="closeAddLayerModal">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="modal-body overflow-y-auto max-h-[300px] p-4">
            <div class="shape-grid" id="addLayerGrid"></div>
          </div>
        </div>
      </div>
    </>
  );
});
