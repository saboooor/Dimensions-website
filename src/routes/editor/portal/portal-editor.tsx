import { Utils } from './lib/utils';
import { Viewport } from './lib/viewport';
import { BlockSelector, type BlockSelectorInstance } from './lib/blocks';
import { Settings } from './lib/settings';
import { AddonManager } from './lib/addons';
import { render } from '@qwik.dev/core';
import Check from 'lucide-icons-qwik/icons/Check';
import Clipboard from 'lucide-icons-qwik/icons/Clipboard';

class App {
  portalID = 'testPortal';
  state = Settings.createState();
  undoStack: Record<string, any>[] = [];
  redoStack: Record<string, any>[] = [];

  viewport: Viewport;
  frameSelector: BlockSelectorInstance | null = null;
  insideSelector: BlockSelectorInstance | null = null;
  lighterSelector: BlockSelectorInstance | null = null;

  constructor() {
    const canvas = document.getElementById('viewport') as HTMLCanvasElement;
    this.viewport = new Viewport(canvas);

    this._bindTabs();
    this._bindToolbar();
    this._bindBlockSelectors();
    this._bindDesignControls();
    this._bindSettingsControls();
    this._bindModals();
    this._bindKeyboard();
    this._initAddons();

    this.viewport.start();

    if (window.PORTAL_LOAD_DATA) {
      this._loadPortalData(window.PORTAL_LOAD_DATA);
    }

    this._updateYaml();
    this._updateViewport();

    setTimeout(() => {
      const loading = document.getElementById('loadingOverlay');
      if (loading) loading.style.display = 'none';
    }, 600);
  }

  pushUndo(): void {
    this.undoStack.push(Utils.deepClone(this.state));
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack = [];
    this._updateUndoRedo();
  }

  undo(): void {
    if (!this.undoStack.length) return;
    this.redoStack.push(Utils.deepClone(this.state));
    this.state = this.undoStack.pop()!;
    this._refreshAll();
  }

  redo(): void {
    if (!this.redoStack.length) return;
    this.undoStack.push(Utils.deepClone(this.state));
    this.state = this.redoStack.pop()!;
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

  _onStateChange(key: string, _value?: any): void {
    this._updateYaml();
    if (
      key === 'Portal.Frame.Material' ||
      key === 'Portal.InsideMaterial' ||
      key === 'Portal.LighterMaterial'
    ) {
      this._updateViewport();
    }
  }

  _updateViewport(): void {
    this.viewport.setMaterials(
      this.state['Portal.Frame.Material'],
      this.state['Portal.InsideMaterial'],
      this.state['Portal.LighterMaterial']
    );
  }

  _updateYaml(): void {
    const fullState = Utils.deepClone(this.state);
    const addonVals = AddonManager.getValues();
    const keys = Object.keys(addonVals);
    for (let i = 0; i < keys.length; i++) {
      fullState[keys[i]] = addonVals[keys[i]];
    }

    const yaml = Settings.toYaml(fullState);
    const preview = document.getElementById('yamlPreview');
    if (preview) preview.textContent = yaml;
  }

  _refreshAll(): void {
    this._syncDesignUI();
    this._syncSettingsUI();
    this._updateViewport();
    this._updateYaml();
    this._updateUndoRedo();
  }

  _bindTabs(): void {
    const tabs = document.querySelectorAll('.panel-tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        tabs.forEach((t) => t.classList.remove('active'));
        contents.forEach((c) => c.classList.remove('active'));
        tab.classList.add('active');
        const targetContent = document.querySelector(
          '.tab-content[data-tab="' + target + '"]'
        );
        if (targetContent) targetContent.classList.add('active');
      });
    });
  }

  _bindToolbar(): void {
    const btnUndo = document.getElementById('btnUndo');
    if (btnUndo) btnUndo.addEventListener('click', () => this.undo());

    const btnRedo = document.getElementById('btnRedo');
    if (btnRedo) btnRedo.addEventListener('click', () => this.redo());

    const btnDownload = document.getElementById('btnDownload');
    if (btnDownload)
      btnDownload.addEventListener('click', () => this.downloadYaml());

    const btnCopy = document.getElementById('btnCopy');
    if (btnCopy) btnCopy.addEventListener('click', () => this.copyYaml());

    const btnResetCam = document.getElementById('btnResetCam');
    if (btnResetCam)
      btnResetCam.addEventListener('click', () => this.viewport.resetCamera());

    const copyYamlBtn = document.getElementById('btnCopyYaml');
    if (copyYamlBtn)
      copyYamlBtn.addEventListener('click', () => this.copyYaml());

    const portalIDInput = document.getElementById(
      'portalID'
    ) as HTMLInputElement | null;
    if (portalIDInput) {
      portalIDInput.addEventListener('change', (e: Event) => {
        const input = e.target as HTMLInputElement;
        this.portalID = input.value.replace(/\s+/g, '_');
        input.value = this.portalID;
      });
    }

    const saveBtn = document.getElementById('btnSave');
    if (saveBtn) saveBtn.addEventListener('click', () => this.saveToAccount());

    const publicBtn = document.getElementById('btnPublic');
    if (publicBtn)
      publicBtn.addEventListener('click', () => this.togglePublic());

    const deleteBtn = document.getElementById('btnDelete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        const modal = document.getElementById('deleteModal');
        if (modal) modal.style.display = '';
      });
    }

    document.querySelectorAll('[data-collapse]').forEach((head) => {
      head.addEventListener('click', () => {
        const targetId = head.getAttribute('data-collapse');
        if (!targetId) return;
        const body = document.getElementById(targetId);
        if (body) {
          body.classList.toggle('collapsed');
          const chevron = head.querySelector<HTMLElement>('.design-chevron');
          if (chevron) {
            chevron.style.transform = body.classList.contains('collapsed')
              ? 'rotate(-90deg)'
              : '';
          }
        }
      });
    });
  }

  _bindBlockSelectors(): void {
    const manifest = window.TEXTURE_MANIFEST || {
      blocks: [],
      frames: [],
      items: [],
    };

    this.frameSelector = BlockSelector.init(
      'frameGrid',
      'frameSearch',
      'frameManual',
      manifest.blocks,
      'blocks',
      (id: string) => {
        this.pushUndo();
        this.state['Portal.Frame.Material'] = id.toUpperCase();
        this._onStateChange('Portal.Frame.Material');
      }
    );

    this.insideSelector = BlockSelector.init(
      'insideGrid',
      'insideSearch',
      'insideManual',
      manifest.frames,
      'frames',
      (id: string) => {
        this.pushUndo();
        this.state['Portal.InsideMaterial'] = id.toUpperCase();
        this._onStateChange('Portal.InsideMaterial');
      }
    );

    this.lighterSelector = BlockSelector.init(
      'lighterGrid',
      'lighterSearch',
      'lighterManual',
      manifest.items,
      'items',
      (id: string) => {
        this.pushUndo();
        this.state['Portal.LighterMaterial'] = id.toUpperCase();
        this._onStateChange('Portal.LighterMaterial');
      }
    );

    this.frameSelector.setSelected(this.state['Portal.Frame.Material']);
    this.insideSelector.setSelected(this.state['Portal.InsideMaterial']);
    this.lighterSelector.setSelected(this.state['Portal.LighterMaterial']);
  }

  _bindDesignControls(): void {
    document.querySelectorAll('.face-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.pushUndo();
        document
          .querySelectorAll('.face-btn')
          .forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const face = btn.getAttribute('data-face');
        if (face) {
          this.state['Portal.Frame.Face'] = face;
          this._onStateChange('Portal.Frame.Face');
        }
      });
    });

    const sizeInputs = [
      { id: 'minWidth', key: 'Portal.MinimumWidth' },
      { id: 'minHeight', key: 'Portal.MinimumHeight' },
      { id: 'maxWidth', key: 'Portal.MaximumWidth' },
      { id: 'maxHeight', key: 'Portal.MaximumHeight' },
    ];
    sizeInputs.forEach((s) => {
      const el = document.getElementById(s.id) as HTMLInputElement | null;
      if (el) {
        el.addEventListener('change', () => {
          this.pushUndo();
          this.state[s.key] = parseInt(el.value) || 0;
          this._onStateChange(s.key);
        });
      }
    });

    const particlesEnable = document.getElementById(
      'particlesEnable'
    ) as HTMLInputElement | null;
    if (particlesEnable) {
      particlesEnable.addEventListener('change', () => {
        this.pushUndo();
        this.state['Options.EnableParticles'] = particlesEnable.checked;
        this._onStateChange('Options.EnableParticles');
      });
    }

    const particlesColor = document.getElementById(
      'particlesColor'
    ) as HTMLInputElement | null;
    if (particlesColor) {
      particlesColor.addEventListener('input', () => {
        const rgb = Utils.hexToRgb(particlesColor.value);
        const semicolon = Utils.rgbToSemicolon(rgb.r, rgb.g, rgb.b);
        this.pushUndo();
        this.state['Portal.ParticlesColor'] = semicolon;
        const colorText = document.getElementById('particlesColorText');
        if (colorText) colorText.textContent = semicolon;
        this._onStateChange('Portal.ParticlesColor');
      });
    }
  }

  _bindSettingsControls(): void {
    const bindings = [
      { id: 'optEnable', key: 'Enable' },
      { id: 'optDisplayName', key: 'DisplayName' },
      { id: 'optBreakEffect', key: 'Portal.BreakEffect' },
      { id: 'optWorldName', key: 'World.Name' },
      { id: 'optTeleportDelay', key: 'Options.TeleportDelay' },
      { id: 'optAllowedWorlds', key: 'Options.AllowedWorlds' },
      { id: 'optExitEnable', key: 'Options.ExitPortal.Enable' },
      { id: 'optExitWidth', key: 'Options.ExitPortal.FixedWidth' },
      { id: 'optExitHeight', key: 'Options.ExitPortal.FixedHeight' },
      { id: 'optTransformation', key: 'Entities.Transformation' },
      { id: 'optSpawnDelay', key: 'Entities.Spawning.Delay' },
      { id: 'optSpawnList', key: 'Entities.Spawning.List' },
    ];

    bindings.forEach((b) => {
      Settings.bindElement(b.id, b.key, this.state, (key, val) => {
        this.pushUndo();
        this._onStateChange(key, val);
      });
    });
  }

  _syncDesignUI(): void {
    if (this.frameSelector)
      this.frameSelector.setSelected(this.state['Portal.Frame.Material']);
    if (this.insideSelector)
      this.insideSelector.setSelected(this.state['Portal.InsideMaterial']);
    if (this.lighterSelector)
      this.lighterSelector.setSelected(this.state['Portal.LighterMaterial']);

    const face = this.state['Portal.Frame.Face'] || 'all';
    document.querySelectorAll('.face-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-face') === face);
    });

    const minW = document.getElementById('minWidth') as HTMLInputElement | null;
    if (minW) minW.value = this.state['Portal.MinimumWidth'];

    const minH = document.getElementById(
      'minHeight'
    ) as HTMLInputElement | null;
    if (minH) minH.value = this.state['Portal.MinimumHeight'];

    const maxW = document.getElementById('maxWidth') as HTMLInputElement | null;
    if (maxW) maxW.value = this.state['Portal.MaximumWidth'];

    const maxH = document.getElementById(
      'maxHeight'
    ) as HTMLInputElement | null;
    if (maxH) maxH.value = this.state['Portal.MaximumHeight'];

    const pe = document.getElementById(
      'particlesEnable'
    ) as HTMLInputElement | null;
    if (pe) pe.checked = !!this.state['Options.EnableParticles'];

    const pc = this.state['Portal.ParticlesColor'] || '255;255;255';
    const pcRgb = Utils.semicolonToRgb(pc);
    const pColor = document.getElementById(
      'particlesColor'
    ) as HTMLInputElement | null;
    if (pColor) pColor.value = Utils.rgbToHex(pcRgb.r, pcRgb.g, pcRgb.b);

    const pText = document.getElementById('particlesColorText');
    if (pText) pText.textContent = pc;

    const portalIDEl = document.getElementById(
      'portalID'
    ) as HTMLInputElement | null;
    if (portalIDEl) portalIDEl.value = this.portalID;
  }

  _syncSettingsUI(): void {
    const s = this.state;
    const sets: Record<string, { key: string; type: string }> = {
      optEnable: { key: 'Enable', type: 'checkbox' },
      optDisplayName: { key: 'DisplayName', type: 'text' },
      optBreakEffect: { key: 'Portal.BreakEffect', type: 'text' },
      optWorldName: { key: 'World.Name', type: 'text' },
      optTeleportDelay: { key: 'Options.TeleportDelay', type: 'number' },
      optExitEnable: { key: 'Options.ExitPortal.Enable', type: 'checkbox' },
      optExitWidth: { key: 'Options.ExitPortal.FixedWidth', type: 'number' },
      optExitHeight: { key: 'Options.ExitPortal.FixedHeight', type: 'number' },
      optSpawnDelay: { key: 'Entities.Spawning.Delay', type: 'text' },
    };

    Object.keys(sets).forEach((id) => {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (!el) return;
      const val = s[sets[id].key];
      if (sets[id].type === 'checkbox') {
        el.checked = !!val;
      } else {
        el.value = val !== undefined ? val : '';
      }
    });

    const aw = document.getElementById(
      'optAllowedWorlds'
    ) as HTMLTextAreaElement | null;
    if (aw)
      aw.value = Array.isArray(s['Options.AllowedWorlds'])
        ? s['Options.AllowedWorlds'].join('\n')
        : '';

    const et = document.getElementById(
      'optTransformation'
    ) as HTMLTextAreaElement | null;
    if (et)
      et.value = Array.isArray(s['Entities.Transformation'])
        ? s['Entities.Transformation'].join('\n')
        : '';

    const sl = document.getElementById(
      'optSpawnList'
    ) as HTMLTextAreaElement | null;
    if (sl)
      sl.value = Array.isArray(s['Entities.Spawning.List'])
        ? s['Entities.Spawning.List'].join('\n')
        : '';
  }

  _initAddons(): void {
    AddonManager.init(
      window.ADDONS_DATA || [],
      document.getElementById('addonsList'),
      document.getElementById('addonOptions'),
      () => this._updateYaml()
    );
  }

  _loadPortalData(saved: any): void {
    this.portalID = saved.portalID || 'testPortal';
    this.state = Settings.loadFromSaved(saved);

    if (saved.addons && Array.isArray(saved.addons)) {
      AddonManager.enableByNames(saved.addons);
      AddonManager.loadValues(saved.data);
    }

    this._refreshAll();
  }

  downloadYaml(): void {
    const fullState = this._getFullState();
    const yaml = Settings.toYaml(fullState);
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.portalID + '.yml';
    a.click();
    URL.revokeObjectURL(url);
  }

  copyYaml(): void {
    const fullState = this._getFullState();
    const yaml = Settings.toYaml(fullState);
    const btn = document.getElementById('btnCopy');
    void navigator.clipboard.writeText(yaml).then(() => {
      if (btn) void render(btn, <Check size={16} />);
      setTimeout(() => {
        if (btn) void render(btn, <Clipboard size={16} />);
      }, 1500);
    });
  }

  _getFullState(): Record<string, any> {
    const fullState = Utils.deepClone(this.state);
    const addonVals = AddonManager.getValues();
    const keys = Object.keys(addonVals);
    for (let i = 0; i < keys.length; i++) {
      fullState[keys[i]] = addonVals[keys[i]];
    }
    return fullState;
  }

  saveToAccount(): void {
    const saveStr = Settings.toSaveString(
      this.portalID,
      this.state,
      AddonManager.getEnabledNames()
    );
    const imgData = this.viewport.captureImage();

    const formData = new FormData();
    formData.append('portalID', this.portalID);
    formData.append('savePortal', saveStr);
    formData.append('portalIMG', imgData);

    void fetch(window.location.href, {
      method: 'POST',
      body: formData,
    })
      .then((res) => res.text())
      .then((id) => {
        window.location.href = './?portal=' + id;
      });
  }

  togglePublic(): void {
    const formData = new FormData();
    formData.append('togglePrive', 'true');
    void fetch(window.location.href, {
      method: 'POST',
      body: formData,
    }).then(() => {
      document.location.reload();
    });
  }

  deletePortal(): void {
    const formData = new FormData();
    formData.append('deletePortal', 'true');
    void fetch(window.location.href, {
      method: 'POST',
      body: formData,
    }).then(() => {
      document.location.reload();
    });
  }

  _bindModals(): void {
    const deleteModal = document.getElementById('deleteModal');
    const closeDelete = document.getElementById('closeDeleteModal');
    if (closeDelete && deleteModal) {
      closeDelete.addEventListener('click', () => {
        deleteModal.style.display = 'none';
      });
    }
    const cancelDelete = document.getElementById('cancelDelete');
    if (cancelDelete && deleteModal) {
      cancelDelete.addEventListener('click', () => {
        deleteModal.style.display = 'none';
      });
    }
    const confirmDelete = document.getElementById('confirmDelete');
    if (confirmDelete) {
      confirmDelete.addEventListener('click', () => {
        this.deletePortal();
      });
    }

    if (deleteModal) {
      deleteModal.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as HTMLElement | null;
        if (target && target.classList.contains('modal-overlay')) {
          target.style.display = 'none';
        }
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
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (window.IS_LOGGED_IN) this.saveToAccount();
      }
    });
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
    handleLeft.classList.remove('active');
    handleRight.classList.remove('active');
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

export { Utils, Viewport as ViewportCanvas };
