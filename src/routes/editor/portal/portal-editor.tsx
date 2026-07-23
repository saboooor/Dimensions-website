// Portal Editor Bundled Client Module

import { render } from '@qwik.dev/core';
import Puzzle from 'lucide-icons-qwik/icons/Puzzle';
import Check from 'lucide-icons-qwik/icons/Check';
import Clipboard from 'lucide-icons-qwik/icons/Clipboard';

declare global {
  interface Window {
    TEXTURE_BASE?: string;
    TEXTURE_MANIFEST?: {
      blocks: string[];
      frames: string[];
      items: string[];
    };
    ADDONS_DATA?: AddonDefinition[];
    PORTAL_LOAD_DATA?: any;
    IS_LOGGED_IN?: boolean;
    app?: any;
  }
}

// === utils.js === Portal Editor v2 Utilities

const Utils = {
  generateId(): string {
    return (
      'pe_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
    );
  },

  clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  },

  rgbToHex(r: number, g: number, b: number): string {
    return (
      '#' +
      [r, g, b]
        .map((c) => {
          const hex = Math.round(c).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('')
    );
  },

  hexToRgb(hex: string): { r: number; g: number; b: number } {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3)
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    const n = parseInt(hex, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  },

  rgbToSemicolon(r: number, g: number, b: number): string {
    return r + ';' + g + ';' + b;
  },

  semicolonToRgb(str: string): { r: number; g: number; b: number } {
    const parts = str.split(';');
    return {
      r: parseInt(parts[0]) || 0,
      g: parseInt(parts[1]) || 0,
      b: parseInt(parts[2]) || 0,
    };
  },

  deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  },

  debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return function (this: any, ...args: Parameters<T>) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  },

  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  // Simple event bus for decoupled communication
  EventBus: {
    _handlers: {} as Record<string, ((data?: any) => void)[]>,
    on(event: string, fn: (data?: any) => void) {
      if (!this._handlers[event]) this._handlers[event] = [];
      this._handlers[event].push(fn);
    },
    off(event: string, fn: (data?: any) => void) {
      if (!this._handlers[event]) return;
      this._handlers[event] = this._handlers[event].filter((h) => h !== fn);
    },
    emit(event: string, data?: any) {
      if (!this._handlers[event]) return;
      this._handlers[event].forEach((fn) => fn(data));
    },
  },
};

// === yaml.js === JSON to YAML converter for portal config

const YamlConverter = {
  INDENT: '  ',

  convert(obj: any): string {
    if (typeof obj === 'string') obj = JSON.parse(obj);
    const lines: string[] = [];
    this._convertValue(obj, lines, '');
    return lines.join('\n');
  },

  _convertValue(val: any, lines: string[], indent: string): void {
    const type = this._getType(val);
    switch (type) {
      case 'hash':
        this._convertHash(val, lines, indent);
        break;
      case 'array':
        this._convertArray(val, lines, indent);
        break;
      case 'string':
        lines.push(this._normalizeStr(val));
        break;
      case 'number':
        lines.push(String(val));
        break;
      case 'boolean':
        lines.push(val ? 'true' : 'false');
        break;
      case 'null':
        lines.push('null');
        break;
    }
  },

  _convertHash(
    obj: Record<string, any>,
    lines: string[],
    indent: string
  ): void {
    const keys = Object.keys(obj);
    keys.forEach((key) => {
      const val = obj[key];
      const type = this._getType(val);
      if (
        type === 'string' ||
        type === 'number' ||
        type === 'boolean' ||
        type === 'null'
      ) {
        const valLines: string[] = [];
        this._convertValue(val, valLines, '');
        lines.push(indent + this._normalizeStr(key) + ': ' + valLines[0]);
      } else {
        lines.push(indent + this._normalizeStr(key) + ':');
        if (type === 'array' && val.length === 0) {
          lines[lines.length - 1] = indent + this._normalizeStr(key) + ': []';
        } else if (type === 'hash' && Object.keys(val).length === 0) {
          lines[lines.length - 1] = indent + this._normalizeStr(key) + ': {}';
        } else {
          const sub: string[] = [];
          this._convertValue(val, sub, indent + this.INDENT);
          sub.forEach((s) => lines.push(s));
        }
      }
    });
  },

  _convertArray(arr: any[], lines: string[], indent: string): void {
    if (arr.length === 0) {
      lines.push(indent + '[]');
      return;
    }
    arr.forEach((item) => {
      const type = this._getType(item);
      if (
        type === 'string' ||
        type === 'number' ||
        type === 'boolean' ||
        type === 'null'
      ) {
        const valLines: string[] = [];
        this._convertValue(item, valLines, '');
        lines.push(indent + '- ' + valLines[0]);
      } else {
        const sub: string[] = [];
        this._convertValue(item, sub, indent + this.INDENT);
        sub.forEach((s, i) => {
          lines.push(i === 0 ? indent + '- ' + s.trim() : s);
        });
      }
    });
  },

  _getType(val: any): string {
    if (val === null || val === undefined) return 'null';
    if (Array.isArray(val)) return 'array';
    return typeof val;
  },

  _normalizeStr(str: any): string {
    if (typeof str !== 'string') return String(str);
    if (/^[\w.]+$/.test(str)) return str;
    return "'" + str.replace(/'/g, "''") + "'";
  },
};

// === viewport.js === 3D Portal Preview (Canvas 2D renderer)

const CUBE_VERTICES = [
  [-1, -1, -1],
  [1, -1, -1],
  [-1, 1, -1],
  [1, 1, -1],
  [-1, -1, 1],
  [1, -1, 1],
  [-1, 1, 1],
  [1, 1, 1],
];
const CUBE_FACES = [
  { verts: [0, 1, 3, 2], shade: 0.8 },
  { verts: [5, 4, 6, 7], shade: 0.8 },
  { verts: [4, 0, 2, 6], shade: 0.6 },
  { verts: [1, 5, 7, 3], shade: 0.6 },
  { verts: [4, 5, 1, 0], shade: 1.0 },
  { verts: [2, 3, 7, 6], shade: 0.5 },
];

interface Cube {
  x: number;
  y: number;
  z: number;
  radius: number;
  texture: HTMLImageElement;
  alpha: number;
}

interface ProjectedPoint {
  x: number;
  y: number;
  size: number;
}

interface RotatedPoint {
  x: number;
  y: number;
  z: number;
}

interface FaceData {
  verts: ProjectedPoint[];
  avgZ: number;
  shade: number;
  texture: HTMLImageElement;
  alpha: number;
}

class Viewport {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width = 0;
  height = 0;
  projCX = 0;
  projCY = 0;
  fov = 80;
  cameraAngleY = 0.4;
  cameraAngleX = 0.15;
  cameraZoom = -550;
  isDragging = false;
  lastMouseX = 0;
  lastMouseY = 0;
  cubes: Cube[] = [];
  faceBuffer: FaceData[] = [];
  animId: number | null = null;

  textures: Record<string, HTMLImageElement> = {};
  frameMat = 'stone';
  insideMat = 'nether_portal';
  lighterMat = 'flint_and_steel';

  constructor(canvasEl: HTMLCanvasElement) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d')!;

    canvasEl.addEventListener('mousedown', (e: MouseEvent) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });
    canvasEl.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.cameraAngleY += dx * 0.005;
      this.cameraAngleX = Utils.clamp(
        this.cameraAngleX + dy * 0.005,
        -1.2,
        1.2
      );
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });
    canvasEl.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
    canvasEl.addEventListener('mouseleave', () => {
      this.isDragging = false;
    });
    canvasEl.addEventListener(
      'wheel',
      (e: WheelEvent) => {
        e.preventDefault();
        this.cameraZoom -= e.deltaY * 0.15;
        this.cameraZoom = Utils.clamp(this.cameraZoom, -600, -450);
      },
      { passive: false }
    );

    const parent = canvasEl.parentElement;
    if (parent) {
      const ro = new ResizeObserver(() => {
        this.resize();
      });
      ro.observe(parent);
    }
  }

  setDimensions(_pw: number, _ph: number): void {
    this._buildPortal();
  }

  resize(): void {
    const container = this.canvas.parentElement;
    if (!container) return;
    this.width = container.clientWidth;
    this.height = container.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.fov = this.width * 0.5;
    this.projCX = this.width / 2;
    this.projCY = this.height / 2;
  }

  resetCamera(): void {
    this.cameraAngleY = 0.4;
    this.cameraAngleX = 0.15;
    this.cameraZoom = -550;
  }

  _getTexture(name: string, folder: string): HTMLImageElement {
    const key = folder + '/' + name;
    if (this.textures[key]) return this.textures[key];
    const img = new Image();
    const base = window.TEXTURE_BASE || '/editor/portal/Images/';
    img.src = base + folder + '/' + name + '.png';
    this.textures[key] = img;
    return img;
  }

  setMaterials(frame?: string, inside?: string, lighter?: string): void {
    this.frameMat = (frame || 'stone').toLowerCase();
    this.insideMat = (inside || 'nether_portal').toLowerCase();
    this.lighterMat = (lighter || 'flint_and_steel').toLowerCase();
    this._buildPortal();
  }

  _buildPortal(): void {
    this.cubes = [];
    const pw = 4;
    const ph = 5;
    const frameFolder = 'blocks';
    const insideFolder = 'frames';

    const frameTex = this._getTexture(this.frameMat, frameFolder);
    if (!this.textures['blocks/' + this.frameMat]) {
      this._getTexture(this.frameMat, 'frames');
    }
    const insideTex = this._getTexture(this.insideMat, insideFolder);

    for (let y = 0; y < pw; y++) {
      for (let x = 0; x < ph; x++) {
        const isFrame = y === 0 || y === pw - 1 || x === 0 || x === ph - 1;
        this.cubes.push({
          x: y - 1.5,
          y: x - 2,
          z: 0,
          radius: 0.5,
          texture: isFrame ? frameTex : insideTex,
          alpha: isFrame ? 1.0 : 0.75,
        });
      }
    }
  }

  _rotatePoint(x: number, y: number, z: number): RotatedPoint {
    const cosY = Math.cos(this.cameraAngleY);
    const sinY = Math.sin(this.cameraAngleY);
    const cosX = Math.cos(this.cameraAngleX);
    const sinX = Math.sin(this.cameraAngleX);
    const rx = x * cosY - z * sinY;
    const rz = x * sinY + z * cosY;
    const ry = y * cosX - rz * sinX;
    const rz2 = y * sinX + rz * cosX;
    return { x: rx, y: ry, z: rz2 };
  }

  _project(x: number, y: number, z: number): ProjectedPoint {
    const r = this._rotatePoint(x, y, z);
    const fov = this.fov + this.cameraZoom;
    const sp = fov + r.z * 5;
    return { x: r.x * sp + this.projCX, y: r.y * sp + this.projCY, size: sp };
  }

  _collectCubeFaces(cube: Cube, buffer: FaceData[]): void {
    const proj: ProjectedPoint[] = [];
    const rotated: RotatedPoint[] = [];
    for (let i = 0; i < 8; i++) {
      const vx = cube.x + cube.radius * CUBE_VERTICES[i][0];
      const vy = cube.y + cube.radius * CUBE_VERTICES[i][1];
      const vz = cube.z + cube.radius * CUBE_VERTICES[i][2];
      proj.push(this._project(vx, vy, vz));
      rotated.push(this._rotatePoint(vx, vy, vz));
    }
    for (let f = 0; f < CUBE_FACES.length; f++) {
      const face = CUBE_FACES[f];
      const vi = face.verts;
      const p0 = proj[vi[0]];
      const p1 = proj[vi[1]];
      const p2 = proj[vi[2]];
      const p3 = proj[vi[3]];
      const dx1 = p1.x - p0.x;
      const dy1 = p1.y - p0.y;
      const dx2 = p2.x - p0.x;
      const dy2 = p2.y - p0.y;
      if (dx1 * dy2 - dy1 * dx2 >= 0) continue;
      const avgZ =
        (rotated[vi[0]].z +
          rotated[vi[1]].z +
          rotated[vi[2]].z +
          rotated[vi[3]].z) /
        4;
      buffer.push({
        verts: [p0, p1, p2, p3],
        avgZ: avgZ,
        shade: face.shade,
        texture: cube.texture,
        alpha: cube.alpha,
      });
    }
  }

  _drawTexTri(
    p0: ProjectedPoint,
    p1: ProjectedPoint,
    p2: ProjectedPoint,
    tex: HTMLImageElement,
    _tw: number,
    _th: number,
    shade: number,
    alpha: number,
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number
  ): void {
    const ctx = this.ctx;
    ctx.save();
    if (alpha < 1) ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.closePath();
    ctx.clip();
    ctx.transform(a, b, c, d, e, f);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tex, 0, 0);
    ctx.restore();
    if (shade < 1) {
      ctx.save();
      ctx.globalAlpha = (alpha < 1 ? alpha : 1) * (1 - shade);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.closePath();
      ctx.fillStyle = '#000';
      ctx.fill();
      ctx.restore();
    }
  }

  _drawFace(face: FaceData): void {
    const v = face.verts;
    const tex = face.texture;
    const ctx = this.ctx;
    if (tex && tex.complete && tex.naturalWidth > 0) {
      const tw = tex.naturalWidth;
      const th = tex.naturalHeight;
      this._drawTexTri(
        v[0],
        v[1],
        v[3],
        tex,
        tw,
        th,
        face.shade,
        face.alpha,
        (v[1].x - v[0].x) / tw,
        (v[1].y - v[0].y) / tw,
        (v[3].x - v[0].x) / th,
        (v[3].y - v[0].y) / th,
        v[0].x,
        v[0].y
      );
      this._drawTexTri(
        v[1],
        v[2],
        v[3],
        tex,
        tw,
        th,
        face.shade,
        face.alpha,
        (v[2].x - v[3].x) / tw,
        (v[2].y - v[3].y) / tw,
        (v[2].x - v[1].x) / th,
        (v[2].y - v[1].y) / th,
        v[1].x - v[2].x + v[3].x,
        v[1].y - v[2].y + v[3].y
      );
    } else {
      ctx.save();
      if (face.alpha < 1) ctx.globalAlpha = face.alpha;
      ctx.beginPath();
      ctx.moveTo(v[0].x, v[0].y);
      ctx.lineTo(v[1].x, v[1].y);
      ctx.lineTo(v[2].x, v[2].y);
      ctx.lineTo(v[3].x, v[3].y);
      ctx.closePath();
      const bv = Math.floor(face.shade * 100 + 50);
      ctx.fillStyle = 'rgb(' + bv + ',' + bv + ',' + bv + ')';
      ctx.fill();
      ctx.restore();
    }
  }

  render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    this.faceBuffer.length = 0;
    for (let i = 0; i < this.cubes.length; i++) {
      this._collectCubeFaces(this.cubes[i], this.faceBuffer);
    }

    this.faceBuffer.sort((a, b) => a.avgZ - b.avgZ);

    for (let i = 0; i < this.faceBuffer.length; i++) {
      this._drawFace(this.faceBuffer[i]);
    }

    this.animId = requestAnimationFrame(() => this.render());
  }

  start(): void {
    if (!this.animId) {
      this._buildPortal();
      this.render();
    }
  }

  stop(): void {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  captureImage(): string {
    return this.canvas.toDataURL('image/png');
  }
}

// === blocks.js === Block Selector

interface BlockSelectorInstance {
  setSelected: (id: string | null) => void;
  refresh: () => void;
}

const BlockSelector = {
  _recentKey: 'pe2_recent_blocks',
  _maxRecent: 12,

  init(
    gridId: string,
    searchId: string,
    manualId: string,
    textureList: string[],
    folder: string,
    onSelect: (id: string) => void
  ): BlockSelectorInstance {
    const grid = document.getElementById(gridId) as HTMLElement;
    const search = document.getElementById(searchId) as HTMLInputElement;
    const manual = document.getElementById(manualId) as HTMLInputElement;
    let selected: string | null = null;

    const renderGrid = (filter: string) => {
      if (!grid) return;
      grid.innerHTML = '';
      const filterLower = (filter || '').toLowerCase().replace(/\s+/g, '_');
      let shown = 0;
      const base = window.TEXTURE_BASE || '/editor/portal/Images/';

      textureList.forEach((id) => {
        if (filterLower && id.toLowerCase().indexOf(filterLower) === -1) return;
        const tile = document.createElement('div');
        tile.className =
          'aspect-square rounded-lg border bg-cover bg-center cursor-pointer transition-all duration-150 hover:scale-105 shadow-sm ' +
          (selected === id
            ? 'border-gray-400 ring-2 ring-gray-400/40 shadow-lg'
            : 'border-gray-800/80 hover:border-gray-600');
        tile.style.backgroundImage =
          "url('" + base + folder + '/' + id + ".png')";
        tile.title = id.replace(/_/g, ' ');
        tile.addEventListener('click', () => {
          selected = id;
          if (manual) manual.value = id.toUpperCase();
          onSelect(id);
          this._addRecent(id);
          renderGrid(search ? search.value : '');
        });
        grid.appendChild(tile);
        shown++;
      });

      if (shown === 0) {
        const empty = document.createElement('div');
        empty.style.cssText =
          'padding: 12px; color: #555570; font-size: 11px; text-align: center; width: 100%;';
        empty.textContent = 'No blocks found';
        grid.appendChild(empty);
      }
    };

    if (search) {
      const debounced = Utils.debounce(() => {
        renderGrid(search.value);
      }, 150);
      search.addEventListener('input', debounced);
    }

    if (manual) {
      manual.addEventListener('change', () => {
        const val = manual.value.trim().toUpperCase();
        if (val) {
          selected = val.toLowerCase();
          onSelect(val);
          this._addRecent(val.toLowerCase());
          renderGrid(search ? search.value : '');
        }
      });
    }

    renderGrid('');

    return {
      setSelected: (id: string | null) => {
        selected = id ? id.toLowerCase() : null;
        if (manual) manual.value = id ? id.toUpperCase() : '';
        renderGrid(search ? search.value : '');
      },
      refresh: () => {
        renderGrid(search ? search.value : '');
      },
    };
  },

  _addRecent(id: string): void {
    try {
      let recent: string[] = JSON.parse(
        localStorage.getItem(this._recentKey) || '[]'
      );
      recent = recent.filter((r) => r !== id);
      recent.unshift(id);
      if (recent.length > this._maxRecent)
        recent = recent.slice(0, this._maxRecent);
      localStorage.setItem(this._recentKey, JSON.stringify(recent));
    } catch {
      // ignore
    }
  },

  getRecent(): string[] {
    try {
      return JSON.parse(localStorage.getItem(this._recentKey) || '[]');
    } catch {
      return [];
    }
  },
};

// === settings.js === Portal settings manager

const Settings = {
  defaults: {
    configVersion: '3.0.1',
    Enable: true,
    DisplayName: 'TestPortal',
    'Portal.Frame.Material': 'STONE',
    'Portal.Frame.Face': 'all',
    'Portal.InsideMaterial': 'NETHER_PORTAL',
    'Portal.LighterMaterial': 'FLINT_AND_STEEL',
    'Options.EnableParticles': true,
    'Portal.ParticlesColor': '255;255;255',
    'Portal.MinimumWidth': 4,
    'Portal.MinimumHeight': 5,
    'Portal.MaximumWidth': 14,
    'Portal.MaximumHeight': 15,
    'World.Name': 'world_nether',
    'Options.ExitPortal.Enable': true,
    'Options.ExitPortal.FixedWidth': -1,
    'Options.ExitPortal.FixedHeight': -1,
    'Options.AllowedWorlds': [] as string[],
    'Portal.BreakEffect': 'BLOCK_GLASS_BREAK',
    'Options.TeleportDelay': 4,
    'Entities.Transformation': ['SKELETON->WITHER_SKELETON'],
    'Entities.Spawning.Delay': '60000-120000',
    'Entities.Spawning.List': ['ZOMBIE;30', 'SKELETON;30'],
  } as Record<string, any>,

  createState(): Record<string, any> {
    return Utils.deepClone(this.defaults);
  },

  get(state: Record<string, any>, key: string): any {
    return state[key];
  },

  set(state: Record<string, any>, key: string, value: any): void {
    state[key] = value;
  },

  toNested(state: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    const keys = Object.keys(state);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const val = state[key];

      if (val === 'skip' || val === undefined) continue;

      if (key.indexOf('.') === -1) {
        result[key] = val;
      } else {
        const parts = key.split('.');
        let obj = result;
        for (let j = 0; j < parts.length; j++) {
          if (j === parts.length - 1) {
            obj[parts[j]] = val;
          } else {
            if (!obj[parts[j]] || typeof obj[parts[j]] !== 'object') {
              obj[parts[j]] = {};
            }
            obj = obj[parts[j]];
          }
        }
      }
    }

    return result;
  },

  toYaml(state: Record<string, any>): string {
    const nested = this.toNested(state);
    return YamlConverter.convert(nested);
  },

  toSaveString(
    portalID: string,
    state: Record<string, any>,
    enabledAddons: string[]
  ): string {
    const data: Record<string, any> = {};
    const keys = Object.keys(state);
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] !== 'configVersion') {
        data[keys[i]] = state[keys[i]];
      }
    }

    return JSON.stringify({
      portalID,
      data,
      addons: enabledAddons,
    });
  },

  loadFromSaved(saved: any): Record<string, any> {
    const state = this.createState();
    if (!saved || !saved.data) return state;

    const data = saved.data;
    const keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
      state[keys[i]] = data[keys[i]];
    }

    return state;
  },

  bindElement(
    elementId: string,
    key: string,
    state: Record<string, any>,
    onChange?: (key: string, val: any) => void
  ): HTMLElement | undefined {
    const el = document.getElementById(elementId) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | null;
    if (!el) return;

    const val = state[key];

    if (el instanceof HTMLInputElement && el.type === 'checkbox') {
      el.checked = !!val;
    } else if (el instanceof HTMLTextAreaElement) {
      el.value = Array.isArray(val) ? val.join('\n') : val || '';
    } else {
      el.value = val !== undefined ? val : '';
    }

    el.addEventListener('change', () => {
      let newVal: any;
      if (el instanceof HTMLInputElement && el.type === 'checkbox') {
        newVal = el.checked;
      } else if (el instanceof HTMLInputElement && el.type === 'number') {
        newVal = parseInt(el.value) || 0;
      } else if (el instanceof HTMLTextAreaElement) {
        const text = el.value.trim();
        newVal = text === '' ? [] : text.split('\n');
      } else {
        newVal = el.value;
      }
      state[key] = newVal;
      if (onChange) onChange(key, newVal);
    });

    return el;
  },
};

// === addons.js === Addon manager for Portal Editor v2

interface AddonOption {
  name: string;
  type?: string;
  default?: any;
  min?: number;
  max?: number;
  list?: string[];
}

interface AddonDefinition {
  name: string;
  description?: string;
  options?: AddonOption[] | Record<string, AddonOption>;
  enabled?: boolean;
}

const AddonManager = {
  addons: [] as {
    name: string;
    description?: string;
    options: AddonOption[];
    enabled: boolean;
  }[],
  addonState: {} as Record<string, any>,
  listEl: null as HTMLElement | null,
  optionsEl: null as HTMLElement | null,
  onStateChange: null as (() => void) | null,

  init(
    addonsData: AddonDefinition[],
    listEl: HTMLElement | null,
    optionsEl: HTMLElement | null,
    onStateChange?: () => void
  ) {
    this.listEl = listEl;
    this.optionsEl = optionsEl;
    this.onStateChange = onStateChange || null;
    this.addons = [];
    this.addonState = {};

    addonsData.forEach((a) => {
      let opts = a.options || [];
      if (!Array.isArray(opts)) {
        const arr: AddonOption[] = [];
        const keys = Object.keys(opts);
        for (let i = 0; i < keys.length; i++) {
          const o = opts[keys[i]];
          o.name = o.name || keys[i];
          arr.push(o);
        }
        opts = arr;
      }

      this.addons.push({
        name: a.name,
        description: a.description,
        options: opts,
        enabled: false,
      });
    });

    this.render();
  },

  getEnabledNames(): string[] {
    return this.addons.filter((a) => a.enabled).map((a) => a.name);
  },

  getValues(): Record<string, any> {
    const result: Record<string, any> = {};
    const keys = Object.keys(this.addonState);
    for (let i = 0; i < keys.length; i++) {
      const val = this.addonState[keys[i]];
      if (val === '' || val === 'disabled') continue;
      result[keys[i]] = val;
    }
    return result;
  },

  toggle(name: string): void {
    const addon = this.addons.find((a) => a.name === name);
    if (!addon) return;

    addon.enabled = !addon.enabled;

    if (!addon.enabled) {
      addon.options.forEach((opt) => {
        delete this.addonState[opt.name];
      });
    } else {
      addon.options.forEach((opt) => {
        this.addonState[opt.name] =
          opt.default !== undefined ? opt.default : '';
      });
    }

    this.render();
    this.renderOptions();
    if (this.onStateChange) this.onStateChange();
  },

  enableByNames(names?: string[]): void {
    if (!names || !Array.isArray(names)) return;
    names.forEach((name) => {
      const addon = this.addons.find((a) => a.name === name);
      if (addon && !addon.enabled) {
        addon.enabled = true;
        addon.options.forEach((opt) => {
          this.addonState[opt.name] =
            opt.default !== undefined ? opt.default : '';
        });
      }
    });
    this.render();
    this.renderOptions();
  },

  loadValues(savedData?: Record<string, any>): void {
    if (!savedData) return;
    const keys = Object.keys(savedData);
    for (let i = 0; i < keys.length; i++) {
      if (Object.prototype.hasOwnProperty.call(this.addonState, keys[i])) {
        this.addonState[keys[i]] = savedData[keys[i]];
      }
    }
    this.renderOptions();
  },

  render(): void {
    if (!this.listEl) return;
    const list = this.listEl;
    list.innerHTML = '';

    this.addons.forEach((addon) => {
      const card = document.createElement('div');
      card.className =
        'flex flex-col gap-2 rounded-xl border p-4 transition-all duration-150 ' +
        (addon.enabled
          ? 'border-gray-700 bg-gray-900/60 shadow-sm'
          : 'border-gray-800/80 bg-gray-950/40 opacity-75 hover:border-gray-700');

      const nameRow = document.createElement('div');
      nameRow.className = 'flex items-center justify-between gap-2';

      const nameEl = document.createElement('span');
      nameEl.className = 'text-xs font-bold text-gray-200';
      nameEl.textContent = addon.name;
      nameRow.appendChild(nameEl);

      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className =
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ' +
        (addon.enabled ? 'bg-gray-600' : 'bg-gray-950 border-gray-800');
      toggleBtn.innerHTML =
        '<span class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ' +
        (addon.enabled ? 'translate-x-4' : 'translate-x-0') +
        '"></span>';
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle(addon.name);
      });
      nameRow.appendChild(toggleBtn);
      card.appendChild(nameRow);

      if (addon.description) {
        const desc = document.createElement('p');
        desc.className = 'text-[11px] text-gray-400 leading-relaxed';
        desc.textContent = addon.description;
        card.appendChild(desc);
      }

      list.appendChild(card);
    });
  },

  renderOptions(): void {
    if (!this.optionsEl) return;
    const container = this.optionsEl;
    container.innerHTML = '';
    let hasOptions = false;

    this.addons.forEach((addon) => {
      if (!addon.enabled || !addon.options || addon.options.length === 0)
        return;
      hasOptions = true;

      const group = document.createElement('div');
      group.className = 'addon-option-group';

      const title = document.createElement('div');
      title.className = 'addon-option-title flex items-center gap-1.5';
      const iconWrap = document.createElement('span');
      void render(iconWrap, <Puzzle size={16} class="inline-block" />);
      title.appendChild(iconWrap);
      const textSpan = document.createElement('span');
      textSpan.textContent = addon.name;
      title.appendChild(textSpan);
      group.appendChild(title);

      addon.options.forEach((opt) => {
        const row = this._createOptionRow(opt);
        if (row) group.appendChild(row);
      });

      container.appendChild(group);
    });

    if (!hasOptions && this.addons.some((a) => a.enabled)) {
      const note = document.createElement('div');
      note.className = 'addon-no-options';
      note.textContent = 'Enabled addons have no configurable options.';
      container.appendChild(note);
    }
  },

  _createOptionRow(opt: AddonOption): HTMLElement {
    const type = opt.type || 'string';
    const key = opt.name;
    const parts = key.split('.');
    let label = parts[parts.length - 1];
    label = label.replace(/([a-z])([A-Z])/g, '$1 $2');
    const value = Object.prototype.hasOwnProperty.call(this.addonState, key)
      ? this.addonState[key]
      : opt.default;

    const row = document.createElement('div');
    row.className = 'field-col';
    row.style.padding = '4px 0';

    const labelEl = document.createElement('span');
    labelEl.className = 'field-label';
    labelEl.textContent = label;
    row.appendChild(labelEl);

    if (type === 'toggle') {
      row.className = 'field-row';
      const toggle = document.createElement('label');
      toggle.className = 'toggle-switch';
      toggle.innerHTML =
        '<input type="checkbox"' +
        (value ? ' checked' : '') +
        '><span class="toggle-track"></span>';
      const input = toggle.querySelector('input');
      if (input) {
        input.addEventListener('change', () => {
          this.addonState[key] = input.checked;
          if (this.onStateChange) this.onStateChange();
        });
      }
      row.appendChild(toggle);
    } else if (type === 'int') {
      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'field-input';
      input.value = value;
      if (opt.min !== undefined) input.min = String(opt.min);
      if (opt.max !== undefined) input.max = String(opt.max);
      input.addEventListener('change', () => {
        let v = parseInt(input.value) || 0;
        if (opt.min !== undefined && v < opt.min) v = opt.min;
        if (opt.max !== undefined && v > opt.max) v = opt.max;
        input.value = String(v);
        this.addonState[key] = v;
        if (this.onStateChange) this.onStateChange();
      });
      row.appendChild(input);
      if (opt.min !== undefined && opt.max !== undefined) {
        const help = document.createElement('span');
        help.className = 'field-help';
        help.textContent = 'Range: ' + opt.min + ' \u2013 ' + opt.max;
        row.appendChild(help);
      }
    } else if (type === 'list') {
      const textarea = document.createElement('textarea');
      textarea.className = 'field-textarea';
      textarea.rows = 3;
      textarea.value = Array.isArray(value) ? value.join('\n') : value || '';
      textarea.placeholder = 'One entry per line';
      textarea.addEventListener('change', () => {
        const text = textarea.value.trim();
        this.addonState[key] = text === '' ? [] : text.split('\n');
        if (this.onStateChange) this.onStateChange();
      });
      row.appendChild(textarea);
    } else if (type === 'select-single') {
      const select = document.createElement('select');
      select.className = 'field-input';
      const choices = opt.list || [];
      choices.forEach((choice) => {
        const option = document.createElement('option');
        option.value = choice;
        option.textContent = choice || '(disabled)';
        if (choice === value || (choice === 'disabled' && value === ''))
          option.selected = true;
        select.appendChild(option);
      });
      select.addEventListener('change', () => {
        let v = select.value;
        if (v === 'disabled') v = '';
        this.addonState[key] = v;
        if (this.onStateChange) this.onStateChange();
      });
      row.appendChild(select);
    } else {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'field-input';
      input.value = value || '';
      input.addEventListener('change', () => {
        this.addonState[key] = input.value;
        if (this.onStateChange) this.onStateChange();
      });
      row.appendChild(input);
    }

    return row;
  },
};

// === app.js === Portal Editor v2 Application Controller

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
