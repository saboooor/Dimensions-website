import { Utils } from './lib/utils';
import {
  ShapeDefaults,
  ShapeParamLabels,
  ShapeParamRanges,
  ShapeIconComponents,
  PresetIconComponents,
  Shapes,
} from './lib/shapes';
import { Compiler } from './lib/compiler';
import { Presets } from './lib/presets';
import { ThreeView } from './lib/viewport';
import type { LayerData } from './lib/types';
import { render } from '@qwik.dev/core';
import Circle from 'lucide-icons-qwik/icons/Circle';
import Eye from 'lucide-icons-qwik/icons/Eye';
import EyeOff from 'lucide-icons-qwik/icons/EyeOff';
import Trash2 from 'lucide-icons-qwik/icons/Trash2';
import Check from 'lucide-icons-qwik/icons/Check';
import Clipboard from 'lucide-icons-qwik/icons/Clipboard';
import Layers from 'lucide-icons-qwik/icons/Layers';
import Play from 'lucide-icons-qwik/icons/Play';
import Square from 'lucide-icons-qwik/icons/Square';

declare global {
  interface Window {
    app?: any;
  }
}

class App {
  frequency = 20;
  layers: LayerData[] = [];
  selectedLayerId: string | null = null;
  undoStack: { layers: LayerData[]; frequency: number }[] = [];
  redoStack: { layers: LayerData[]; frequency: number }[] = [];
  simulationInterval: ReturnType<typeof setInterval> | null = null;
  simulationTime = 0;
  threeView: ThreeView;

  constructor() {
    const canvas = document.getElementById('viewport') as HTMLCanvasElement;
    this.threeView = new ThreeView(canvas);

    this._bindToolbar();
    this._bindLayerControls();
    this._bindModals();
    this._bindKeyboard();

    this.loadPreset('Green Spiral');
    this.threeView.start();
    this.runSimulation();

    setTimeout(() => {
      const loading = document.getElementById('loadingOverlay');
      if (loading) loading.style.display = 'none';
    }, 600);
  }

  pushUndo(): void {
    this.undoStack.push({
      layers: Utils.deepClone(this.layers),
      frequency: this.frequency,
    });
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack = [];
    this._updateUndoRedo();
  }

  undo(): void {
    if (this.undoStack.length === 0) return;
    this.redoStack.push({
      layers: Utils.deepClone(this.layers),
      frequency: this.frequency,
    });
    const state = this.undoStack.pop()!;
    this.layers = state.layers;
    this.frequency = state.frequency;
    this._refreshAll();
  }

  redo(): void {
    if (this.redoStack.length === 0) return;
    this.undoStack.push({
      layers: Utils.deepClone(this.layers),
      frequency: this.frequency,
    });
    const state = this.redoStack.pop()!;
    this.layers = state.layers;
    this.frequency = state.frequency;
    this._refreshAll();
  }

  _updateUndoRedo(): void {
    const btnUndo = document.getElementById(
      'btnUndo'
    ) as HTMLButtonElement | null;
    const btnRedo = document.getElementById(
      'btnRedo'
    ) as HTMLButtonElement | null;
    if (btnUndo) btnUndo.disabled = this.undoStack.length === 0;
    if (btnRedo) btnRedo.disabled = this.redoStack.length === 0;
  }

  loadPreset(presetName: string): void {
    const preset = Presets.definitions[presetName];
    if (!preset) return;

    this.pushUndo();
    this.frequency = preset.frequency;
    this.layers = Utils.deepClone(preset.layers);
    this.layers.forEach((l) => {
      if (!l.id) l.id = Utils.generateId();
    });

    const freqInput = document.getElementById(
      'optFrequency'
    ) as HTMLInputElement | null;
    if (freqInput) freqInput.value = String(this.frequency);

    const freqValue = document.getElementById('freqValue');
    if (freqValue) freqValue.textContent = String(this.frequency);

    this.selectedLayerId =
      this.layers.length > 0 ? this.layers[0].id || null : null;
    this._refreshAll();
  }

  addLayer(shapeType: string): void {
    this.pushUndo();
    const defaults = ShapeDefaults[shapeType] || ShapeDefaults.ring;
    const newLayer: LayerData = {
      id: Utils.generateId(),
      name: Utils.capitalize(shapeType) + ' Layer',
      enabled: true,
      section: 'portal',
      particle: {
        type: 'REDSTONE',
        color: { r: 0, g: 255, b: 200 },
        size: 1.5,
      },
      shape: {
        type: shapeType,
        params: Utils.deepClone(defaults),
      },
      position: { x: 0, y: 0, z: 0 },
      animation: { rotate: false, rotateSpeed: 1.0, float: false },
    };
    this.layers.push(newLayer);
    this.selectedLayerId = newLayer.id || null;
    this._refreshAll();
  }

  deleteLayer(id: string): void {
    this.pushUndo();
    this.layers = this.layers.filter((l) => l.id !== id);
    if (this.selectedLayerId === id) {
      this.selectedLayerId =
        this.layers.length > 0 ? this.layers[0].id || null : null;
    }
    this._refreshAll();
  }

  toggleLayerEnabled(id: string): void {
    const layer = this.layers.find((l) => l.id === id);
    if (!layer) return;
    this.pushUndo();
    layer.enabled = !layer.enabled;
    this._refreshAll();
  }

  selectLayer(id: string): void {
    this.selectedLayerId = id;
    this._renderLayerList();
    this._renderLayerDetails();
  }

  runSimulation(): void {
    if (this.simulationInterval) return;
    this.simulationInterval = setInterval(() => {
      this.simulationTime += 0.05;
      this.threeView.updateParticles(this.layers, this.simulationTime);
    }, 50);

    const btnRun = document.getElementById('btnRun');
    if (btnRun) {
      void render(
        btnRun,
        <div class="flex items-center gap-1.5">
          <Square size={14} />
          <span>Pause</span>
        </div>
      );
      btnRun.classList.add('active');
    }
  }

  stopSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    const btnRun = document.getElementById('btnRun');
    if (btnRun) {
      void render(
        btnRun,
        <div class="flex items-center gap-1.5">
          <Play size={14} />
          <span>Run</span>
        </div>
      );
      btnRun.classList.remove('active');
    }
  }

  copyYaml(): void {
    const yaml = Compiler.compileAll(this.layers, this.frequency);
    const btn = document.getElementById('btnCopy');
    void navigator.clipboard.writeText(yaml).then(() => {
      if (btn) {
        void render(
          btn,
          <div class="flex items-center gap-1.5">
            <Check size={14} />
            <span>Copied!</span>
          </div>
        );
      }
      setTimeout(() => {
        if (btn) {
          void render(
            btn,
            <div class="flex items-center gap-1.5">
              <Clipboard size={14} />
              <span>Copy YAML</span>
            </div>
          );
        }
      }, 1500);
    });
  }

  downloadYaml(): void {
    const yaml = Compiler.compileAll(this.layers, this.frequency);
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'particles.yml';
    a.click();
    URL.revokeObjectURL(url);
  }

  _refreshAll(): void {
    this._renderLayerList();
    this._renderLayerDetails();
    this._updateYaml();
    this.threeView.updateParticles(this.layers, this.simulationTime);
    this._updateUndoRedo();
  }

  _updateYaml(): void {
    const yaml = Compiler.compileAll(this.layers, this.frequency);
    const preview = document.getElementById('yamlPreview');
    if (preview) preview.textContent = yaml;
  }

  _renderLayerList(): void {
    const list = document.getElementById('layerList');
    if (!list) return;
    list.innerHTML = '';

    if (this.layers.length === 0) {
      const empty = document.createElement('div');
      empty.className =
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-800/80 bg-gray-950/40 p-8 text-center text-xs text-gray-500 gap-2';
      const iconWrap = document.createElement('div');
      void render(iconWrap, <Layers size={24} />);
      empty.appendChild(iconWrap);
      const msg = document.createElement('p');
      msg.className = 'text-xs font-semibold text-gray-500';
      msg.textContent = 'No layers yet. Click "+ Add Layer" to start.';
      empty.appendChild(msg);
      list.appendChild(empty);
      return;
    }

    this.layers.forEach((layer) => {
      const item = document.createElement('div');
      item.className =
        'group flex items-center justify-between rounded-xl border p-2.5 cursor-pointer transition-all duration-150 ' +
        (layer.id === this.selectedLayerId
          ? 'border-gray-700 bg-gray-900/80 text-white shadow-sm'
          : 'border-gray-800/60 bg-gray-950/40 text-gray-400 hover:border-gray-700 hover:bg-gray-900/40 hover:text-gray-200') +
        (!layer.enabled ? ' opacity-50' : '');

      const left = document.createElement('div');
      left.className = 'flex items-center gap-2 flex-grow min-w-0';

      const eye = document.createElement('button');
      eye.className =
        'flex h-7 w-7 items-center justify-center rounded-lg border border-gray-800 bg-gray-950 text-gray-400 transition-colors hover:border-gray-700 hover:text-gray-200 cursor-pointer';
      eye.title = layer.enabled ? 'Hide' : 'Show';
      const EyeIconComponent = layer.enabled ? Eye : EyeOff;
      void render(eye, <EyeIconComponent size={14} />);
      eye.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleLayerEnabled(layer.id!);
      });
      left.appendChild(eye);

      const shapeIcon = document.createElement('span');
      shapeIcon.className =
        'flex h-7 w-7 items-center justify-center rounded-lg border border-gray-800/60 bg-gray-950/60 text-gray-400';
      const shapeType = layer.shape ? layer.shape.type : 'ring';
      const ShapeComp = ShapeIconComponents[shapeType] || Circle;
      void render(shapeIcon, <ShapeComp size={14} />);
      left.appendChild(shapeIcon);

      const name = document.createElement('span');
      name.className = 'text-xs font-semibold text-gray-200 truncate flex-grow';
      name.textContent = layer.name;
      left.appendChild(name);

      item.appendChild(left);

      const right = document.createElement('div');
      right.className = 'flex items-center gap-1';

      const del = document.createElement('button');
      del.className =
        'flex h-7 w-7 items-center justify-center rounded-lg border border-red-900/40 bg-red-950/30 text-red-400 transition-colors hover:border-red-700/60 hover:bg-red-900/50 hover:text-red-300 cursor-pointer';
      del.title = 'Delete';
      void render(del, <Trash2 size={14} />);
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteLayer(layer.id!);
      });
      right.appendChild(del);

      item.appendChild(right);

      item.addEventListener('click', () => this.selectLayer(layer.id!));
      list.appendChild(item);
    });
  }

  _renderLayerDetails(): void {
    const detailsWrap = document.getElementById('layerDetails');
    if (!detailsWrap) return;

    const layer = this.layers.find((l) => l.id === this.selectedLayerId);
    if (!layer) {
      detailsWrap.innerHTML =
        '<div class="empty-state"><p>Select a layer to edit properties.</p></div>';
      return;
    }

    detailsWrap.innerHTML = '';
    const form = document.createElement('div');
    form.className = 'space-y-4';

    const nameGroup = this._createFieldGroup('Layer Name');
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'field-input';
    nameInput.value = layer.name;
    nameInput.addEventListener('change', () => {
      this.pushUndo();
      layer.name = nameInput.value;
      this._renderLayerList();
    });
    nameGroup.appendChild(nameInput);
    form.appendChild(nameGroup);

    const particleGroup = this._createFieldGroup('Particle Settings');

    const typeRow = document.createElement('div');
    typeRow.className = 'field-row';
    typeRow.innerHTML = '<span class="field-label">Type</span>';

    const typeSelect = document.createElement('select');
    typeSelect.className = 'field-input';
    [
      'REDSTONE',
      'FLAME',
      'ENCHANTMENT_TABLE',
      'SPELL_WITCH',
      'FIREWORKS_SPARK',
    ].forEach((t) => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      if (t === layer.particle.type) opt.selected = true;
      typeSelect.appendChild(opt);
    });
    typeSelect.addEventListener('change', () => {
      this.pushUndo();
      layer.particle.type = typeSelect.value;
      this._refreshAll();
    });
    typeRow.appendChild(typeSelect);
    particleGroup.appendChild(typeRow);

    if (layer.particle.type === 'REDSTONE') {
      const colorRow = document.createElement('div');
      colorRow.className = 'field-row';
      colorRow.innerHTML = '<span class="field-label">Color</span>';

      const colorPicker = document.createElement('input');
      colorPicker.type = 'color';
      const c = layer.particle.color || { r: 0, g: 255, b: 0 };
      colorPicker.value = Utils.rgbToHex(c.r, c.g, c.b);
      colorPicker.addEventListener('change', () => {
        this.pushUndo();
        layer.particle.color = Utils.hexToRgb(colorPicker.value);
        this._refreshAll();
      });
      colorRow.appendChild(colorPicker);
      particleGroup.appendChild(colorRow);
    }

    form.appendChild(particleGroup);

    const shapeType = layer.shape ? layer.shape.type : 'ring';
    const params = layer.shape ? layer.shape.params || {} : {};
    const shapeGroup = this._createFieldGroup(
      Utils.capitalize(shapeType) + ' Shape Parameters'
    );

    Object.keys(params).forEach((paramKey) => {
      const val = params[paramKey];
      const label = ShapeParamLabels[paramKey] || paramKey;
      const range = ShapeParamRanges[paramKey] || {
        min: 0,
        max: 10,
        step: 0.1,
      };

      const paramRow = document.createElement('div');
      paramRow.className = 'field-row';
      paramRow.innerHTML = '<span class="field-label">' + label + '</span>';

      const valInput = document.createElement('input');
      valInput.type = typeof val === 'number' ? 'number' : 'text';
      valInput.className = 'field-input';
      valInput.value = String(val);
      if (typeof val === 'number') {
        valInput.min = String(range.min);
        valInput.max = String(range.max);
        valInput.step = String(range.step);
      }
      valInput.addEventListener('change', () => {
        this.pushUndo();
        layer.shape.params[paramKey] =
          typeof val === 'number'
            ? parseFloat(valInput.value) || 0
            : valInput.value;
        this._refreshAll();
      });

      paramRow.appendChild(valInput);
      shapeGroup.appendChild(paramRow);
    });

    form.appendChild(shapeGroup);

    const animGroup = this._createFieldGroup('Animation');

    const rotRow = document.createElement('div');
    rotRow.className = 'field-row';
    rotRow.innerHTML = '<span class="field-label">Rotate</span>';

    const rotToggle = document.createElement('input');
    rotToggle.type = 'checkbox';
    rotToggle.checked = !!(layer.animation && layer.animation.rotate);
    rotToggle.addEventListener('change', () => {
      this.pushUndo();
      if (!layer.animation)
        layer.animation = { rotate: false, rotateSpeed: 1, float: false };
      layer.animation.rotate = rotToggle.checked;
      this._refreshAll();
    });
    rotRow.appendChild(rotToggle);
    animGroup.appendChild(rotRow);

    form.appendChild(animGroup);
    detailsWrap.appendChild(form);
  }

  _createFieldGroup(titleText: string): HTMLElement {
    const group = document.createElement('div');
    group.className = 'bg-gray-900/30 p-4 space-y-3';
    const head = document.createElement('div');
    head.className =
      'text-[11px] font-bold uppercase tracking-wider text-gray-400 pb-2 border-b border-gray-800/60';
    head.textContent = titleText;
    group.appendChild(head);
    const body = document.createElement('div');
    body.className = 'space-y-3 pt-2';
    group.appendChild(body);
    return body;
  }

  _bindToolbar(): void {
    const btnUndo = document.getElementById('btnUndo');
    if (btnUndo) btnUndo.addEventListener('click', () => this.undo());

    const btnRedo = document.getElementById('btnRedo');
    if (btnRedo) btnRedo.addEventListener('click', () => this.redo());

    const btnRun = document.getElementById('btnRun');
    if (btnRun) {
      btnRun.addEventListener('click', () => {
        if (this.simulationInterval) this.stopSimulation();
        else this.runSimulation();
      });
    }

    const btnResetCam = document.getElementById('btnResetCam');
    if (btnResetCam)
      btnResetCam.addEventListener('click', () => this.threeView.resetCamera());

    const btnCopy = document.getElementById('btnCopy');
    if (btnCopy) btnCopy.addEventListener('click', () => this.copyYaml());

    const btnDownload = document.getElementById('btnDownload');
    if (btnDownload)
      btnDownload.addEventListener('click', () => this.downloadYaml());

    const optFreq = document.getElementById(
      'optFrequency'
    ) as HTMLInputElement | null;
    if (optFreq) {
      optFreq.addEventListener('input', () => {
        this.frequency = parseInt(optFreq.value) || 20;
        const freqVal = document.getElementById('freqValue');
        if (freqVal) freqVal.textContent = String(this.frequency);
        this._updateYaml();
      });
    }
  }

  _bindLayerControls(): void {
    const btnAddLayer = document.getElementById('btnAddLayer');
    if (btnAddLayer) {
      btnAddLayer.addEventListener('click', () => {
        const modal = document.getElementById('addLayerModal');
        if (modal) modal.style.display = '';
      });
    }

    const btnPresets = document.getElementById('btnPresets');
    if (btnPresets) {
      btnPresets.addEventListener('click', () => {
        const modal = document.getElementById('presetsModal');
        if (modal) modal.style.display = '';
      });
    }
  }

  _bindKeyboard(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      )
        return;

      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        this.undo();
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        this.redo();
      }
      if (e.key === 'Delete' && this.selectedLayerId) {
        this.deleteLayer(this.selectedLayerId);
      }
      if (e.key === ' ') {
        e.preventDefault();
        if (this.simulationInterval) this.stopSimulation();
        else this.runSimulation();
      }
    });
  }

  _bindModals(): void {
    const closePresets = document.getElementById('closePresetsModal');
    const presetsModal = document.getElementById('presetsModal');
    if (closePresets && presetsModal) {
      closePresets.addEventListener('click', () => {
        presetsModal.style.display = 'none';
      });
    }

    const closeAddLayer = document.getElementById('closeAddLayerModal');
    const addLayerModal = document.getElementById('addLayerModal');
    if (closeAddLayer && addLayerModal) {
      closeAddLayer.addEventListener('click', () => {
        addLayerModal.style.display = 'none';
      });
    }

    ['presetsModal', 'addLayerModal'].forEach((id) => {
      const modal = document.getElementById(id);
      if (modal) {
        modal.addEventListener('click', (e: MouseEvent) => {
          const target = e.target as HTMLElement | null;
          if (target && target.classList.contains('modal-overlay')) {
            target.style.display = 'none';
          }
        });
      }
    });

    const shapeTypes = [
      'spiral',
      'ring',
      'helix',
      'vortex',
      'rain',
      'border',
      'random',
      'custom',
    ];
    const grid = document.getElementById('addLayerGrid');
    if (grid) {
      shapeTypes.forEach((type) => {
        const card = document.createElement('div');
        card.className =
          'flex items-center gap-3 bg-gray-900/40 p-3.5 cursor-pointer transition-all hover:-translate-y-0.5 hover:border-gray-700 hover:bg-gray-800/40 hover:text-white text-xs font-semibold text-gray-300 backdrop-blur-sm';
        const ShapeComp = ShapeIconComponents[type] || Circle;
        const iconWrap = document.createElement('span');
        void render(iconWrap, <ShapeComp size={18} />);
        card.appendChild(iconWrap);
        const nameSpan = document.createElement('span');
        nameSpan.textContent = Utils.capitalize(type);
        card.appendChild(nameSpan);

        card.addEventListener('click', () => {
          this.addLayer(type);
          if (addLayerModal) addLayerModal.style.display = 'none';
        });
        grid.appendChild(card);
      });
    }
  }
}

function initResize() {
  const panelLeft = document.getElementById('panelLeft');
  const panelRight = document.getElementById('panelRight');
  const handleLeft = document.getElementById('resizeLeft');
  const handleRight = document.getElementById('resizeRight');
  if (!handleLeft || !handleRight) return;

  const MIN_W = 200;
  const MAX_W = 500;
  let dragging: 'left' | 'right' | null = null;

  function onMouseDown(side: 'left' | 'right') {
    return (e: MouseEvent) => {
      e.preventDefault();
      dragging = side;
      document.body.classList.add('resizing');
      const handle = side === 'left' ? handleLeft : handleRight;
      if (handle) handle.classList.add('active');
    };
  }

  handleLeft.addEventListener('mousedown', onMouseDown('left'));
  handleRight.addEventListener('mousedown', onMouseDown('right'));

  document.addEventListener('mousemove', (e: MouseEvent) => {
    if (!dragging) return;
    if (dragging === 'left') {
      const w = Math.min(MAX_W, Math.max(MIN_W, e.clientX));
      if (panelLeft) panelLeft.style.width = w + 'px';
    } else {
      const w = Math.min(MAX_W, Math.max(MIN_W, window.innerWidth - e.clientX));
      if (panelRight) panelRight.style.width = w + 'px';
    }
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    document.body.classList.remove('resizing');
    if (handleLeft) handleLeft.classList.remove('active');
    if (handleRight) handleRight.classList.remove('active');
    dragging = null;
  });
}

function init() {
  window.app = new App();
  initResize();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

export {
  Utils,
  ShapeDefaults,
  ShapeParamLabels,
  ShapeParamRanges,
  ShapeIconComponents,
  PresetIconComponents,
  Shapes,
  Compiler,
  Presets,
  ThreeView,
};
