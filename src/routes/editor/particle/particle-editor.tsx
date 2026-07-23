// Particle Editor Bundled Client Module

import { render } from '@qwik.dev/core';
import Circle from 'lucide-icons-qwik/icons/Circle';
import Tornado from 'lucide-icons-qwik/icons/Tornado';
import InfinityIcon from 'lucide-icons-qwik/icons/InfinityIcon';
import Target from 'lucide-icons-qwik/icons/Target';
import CloudRain from 'lucide-icons-qwik/icons/CloudRain';
import Flame from 'lucide-icons-qwik/icons/Flame';
import Dices from 'lucide-icons-qwik/icons/Dices';
import Code from 'lucide-icons-qwik/icons/Code';
import Layers from 'lucide-icons-qwik/icons/Layers';
import Eye from 'lucide-icons-qwik/icons/Eye';
import EyeOff from 'lucide-icons-qwik/icons/EyeOff';
import Trash2 from 'lucide-icons-qwik/icons/Trash2';
import Check from 'lucide-icons-qwik/icons/Check';
import Clipboard from 'lucide-icons-qwik/icons/Clipboard';
import Sparkles from 'lucide-icons-qwik/icons/Sparkles';
import CirclePlus from 'lucide-icons-qwik/icons/CirclePlus';
import Play from 'lucide-icons-qwik/icons/Play';
import Square from 'lucide-icons-qwik/icons/Square';

interface ParticleColor {
  r: number;
  g: number;
  b: number;
}

interface ParticlePoint {
  x: number;
  y: number;
  z: number;
}

interface ParticleConfig {
  type: string;
  color: ParticleColor;
  size: number;
}

interface ShapeConfig {
  type: string;
  params: Record<string, any>;
}

interface PositionConfig {
  x: number;
  y: number;
  z: number;
}

interface AnimationConfig {
  rotate: boolean;
  rotateSpeed: number;
  float: boolean;
}

interface LayerData {
  id?: string;
  name: string;
  enabled: boolean;
  section: string;
  particle: ParticleConfig;
  shape: ShapeConfig;
  position: PositionConfig;
  animation: AnimationConfig;
}

interface PresetDefinition {
  description: string;
  icon: string;
  accentColor: string;
  frequency: number;
  layers: LayerData[];
}

// === utils.js === Pure utility functions

const Utils = {
  generateId(): string {
    return (
      'layer-' +
      Date.now().toString(36) +
      '-' +
      Math.random().toString(36).substr(2, 5)
    );
  },

  clamp(val: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, val));
  },

  lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  },

  degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  },

  rgbToHex(r: number, g: number, b: number): string {
    return (
      '#' +
      [r, g, b]
        .map((v) =>
          Utils.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')
        )
        .join('')
    );
  },

  hexToRgb(hex: string): ParticleColor {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3)
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    const n = parseInt(hex, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
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

  capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  },
};

// === shapes.js === Shape generators + parameter metadata

const ShapeDefaults: Record<string, Record<string, any>> = {
  ring: { radius: 1.5, density: 20, speed: 0.0 },
  spiral: { radius: 1.2, turns: 2, density: 30, speed: 1.0 },
  helix: { radius: 1.0, turns: 3, density: 20, speed: 1.0 },
  vortex: { maxRadius: 1.5, density: 30, twistFactor: 3, speed: 1.0 },
  rain: { density: 15, spread: 1.5, speed: 1.0 },
  border: { offsetRange: 0.05 },
  random: { count: 12, spread: 1.0, seed: 42 },
  custom: { expression: '', count: 10 },
};

const ShapeParamLabels: Record<string, string> = {
  radius: 'Radius',
  density: 'Particle Count',
  speed: 'Speed',
  turns: 'Turns',
  maxRadius: 'Max Radius',
  twistFactor: 'Twist',
  spread: 'Spread',
  count: 'Count',
  seed: 'Seed',
  offsetRange: 'Offset',
  expression: 'Expression',
};

const ShapeParamRanges: Record<
  string,
  { min: number; max: number; step: number }
> = {
  radius: { min: 0.1, max: 4.0, step: 0.1 },
  density: { min: 1, max: 100, step: 1 },
  speed: { min: 0, max: 5.0, step: 0.1 },
  turns: { min: 1, max: 10, step: 1 },
  maxRadius: { min: 0.1, max: 4.0, step: 0.1 },
  twistFactor: { min: 1, max: 10, step: 0.5 },
  spread: { min: 0.1, max: 3.0, step: 0.1 },
  count: { min: 1, max: 100, step: 1 },
  seed: { min: 1, max: 9999, step: 1 },
  offsetRange: { min: 0, max: 0.5, step: 0.01 },
};

const ShapeIconComponents: Record<string, any> = {
  ring: Circle,
  spiral: Tornado,
  helix: InfinityIcon,
  vortex: Target,
  rain: CloudRain,
  border: Flame,
  random: Dices,
  custom: Code,
};

const PresetIconComponents: Record<string, any> = {
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

const Shapes = {
  ring(
    params: Record<string, any>,
    _pw: number,
    _ph: number,
    t: number
  ): ParticlePoint[] {
    const points: ParticlePoint[] = [];
    const count = Math.round(params.density || 20);
    const radius = params.radius || 1.5;
    const speed = params.speed || 0;
    const angleOffset = t * speed;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + angleOffset;
      points.push({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
        z: 0,
      });
    }
    return points;
  },

  spiral(
    params: Record<string, any>,
    _pw: number,
    _ph: number,
    t: number
  ): ParticlePoint[] {
    const points: ParticlePoint[] = [];
    const count = Math.round(params.density || 30);
    const maxRadius = params.radius || 1.2;
    const turns = params.turns || 2;
    const speed = params.speed || 1.0;
    const angleOffset = t * speed * Math.PI * 2;
    for (let i = 0; i < count; i++) {
      const frac = i / count;
      const r = frac * maxRadius;
      const angle = frac * turns * Math.PI * 2 + angleOffset;
      points.push({
        x: r * Math.cos(angle),
        y: r * Math.sin(angle),
        z: 0,
      });
    }
    return points;
  },

  helix(
    params: Record<string, any>,
    _pw: number,
    _ph: number,
    t: number
  ): ParticlePoint[] {
    const points: ParticlePoint[] = [];
    const count = Math.round(params.density || 20);
    const radius = params.radius || 1.0;
    const turns = params.turns || 3;
    const speed = params.speed || 1.0;
    const height = 3.0;
    const angleOffset = t * speed * Math.PI * 2;
    for (let i = 0; i < count; i++) {
      const frac = i / count;
      const y = (frac - 0.5) * height;
      const angle = frac * turns * Math.PI * 2 + angleOffset;
      points.push({
        x: radius * Math.cos(angle),
        y,
        z: radius * Math.sin(angle),
      });
    }
    return points;
  },

  vortex(
    params: Record<string, any>,
    _pw: number,
    _ph: number,
    t: number
  ): ParticlePoint[] {
    const points: ParticlePoint[] = [];
    const count = Math.round(params.density || 30);
    const maxRadius = params.maxRadius || 1.5;
    const twist = params.twistFactor || 3;
    const speed = params.speed || 1.0;
    for (let i = 0; i < count; i++) {
      const baseFrac = i / count;
      const frac = (baseFrac + t * speed * 0.2) % 1.0;
      const r = (1 - frac) * maxRadius;
      const angle = frac * twist * Math.PI * 2;
      points.push({
        x: r * Math.cos(angle),
        y: (frac - 0.5) * 2.0,
        z: r * Math.sin(angle),
      });
    }
    return points;
  },

  rain(
    params: Record<string, any>,
    _pw: number,
    _ph: number,
    t: number
  ): ParticlePoint[] {
    const points: ParticlePoint[] = [];
    const count = Math.round(params.density || 15);
    const spread = params.spread || 1.5;
    const speed = params.speed || 1.0;
    const height = 3.0;
    for (let i = 0; i < count; i++) {
      const seedX = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
      const x = (seedX - Math.floor(seedX) - 0.5) * 2 * spread;
      const fallSpeed = 0.5 + (seedX * 10 - Math.floor(seedX * 10)) * 0.5;
      const progress = (t * speed * fallSpeed + i / count) % 1.0;
      const y = (0.5 - progress) * height;
      points.push({ x, y, z: 0 });
    }
    return points;
  },

  border(
    params: Record<string, any>,
    pw: number,
    ph: number,
    _t: number
  ): ParticlePoint[] {
    const points: ParticlePoint[] = [];
    const range = params.offsetRange || 0.05;
    const halfW = pw * 0.5;
    const halfH = ph * 0.5;
    const perimeter = (pw + ph) * 2;
    const step = 0.4;
    const count = Math.floor(perimeter / step);
    for (let i = 0; i < count; i++) {
      const dist = (i / count) * perimeter;
      let x = 0;
      let y = 0;
      if (dist < pw) {
        x = dist - halfW;
        y = -halfH;
      } else if (dist < pw + ph) {
        x = halfW;
        y = dist - pw - halfH;
      } else if (dist < pw * 2 + ph) {
        x = halfW - (dist - (pw + ph));
        y = halfH;
      } else {
        x = -halfW;
        y = halfH - (dist - (pw * 2 + ph));
      }
      const ox = (Math.random() - 0.5) * 2 * range;
      const oy = (Math.random() - 0.5) * 2 * range;
      points.push({ x: x + ox, y: y + oy, z: 0 });
    }
    return points;
  },

  random(
    params: Record<string, any>,
    _pw: number,
    _ph: number,
    _t: number
  ): ParticlePoint[] {
    const points: ParticlePoint[] = [];
    const count = Math.round(params.count || 12);
    const spread = params.spread || 1.0;
    const seed = params.seed || 42;
    for (let i = 0; i < count; i++) {
      const s1 = Math.sin((i + seed) * 12.9898) * 43758.5453;
      const s2 = Math.sin((i + seed) * 78.233) * 43758.5453;
      const s3 = Math.sin((i + seed) * 37.719) * 43758.5453;
      points.push({
        x: (s1 - Math.floor(s1) - 0.5) * 2 * spread,
        y: (s2 - Math.floor(s2) - 0.5) * 2 * spread,
        z: (s3 - Math.floor(s3) - 0.5) * 2 * spread,
      });
    }
    return points;
  },

  custom(
    params: Record<string, any>,
    _pw: number,
    _ph: number,
    _t: number
  ): ParticlePoint[] {
    const points: ParticlePoint[] = [];
    const count = Math.round(params.count || 10);
    for (let i = 0; i < count; i++) {
      points.push({ x: (i / count - 0.5) * 2, y: 0, z: 0 });
    }
    return points;
  },
};

// === compiler.js === Particle effect compiler for YAML

const Compiler = {
  compileLayer(layer: LayerData, prefix: string): Record<string, any> {
    const p = prefix || 'l0_';
    const result: Record<string, any> = {};
    const shape = layer.shape || { type: 'spiral', params: {} };
    const particle = layer.particle || {
      type: 'REDSTONE',
      color: { r: 255, g: 0, b: 0 },
      size: 1,
    };
    const anim = layer.animation || {
      rotate: false,
      rotateSpeed: 1,
      float: false,
    };

    const type = particle.type || 'REDSTONE';
    const c = particle.color || { r: 255, g: 255, b: 255 };
    const size = particle.size || 1;
    const pos = layer.position || { x: 0, y: 0, z: 0 };
    const params = shape.params || {};

    switch (shape.type) {
      case 'spiral':
      case 'helix':
        this._compileSpiralHelix(
          p,
          shape.type,
          params,
          pos,
          type,
          c,
          size,
          anim,
          result
        );
        break;
      case 'ring':
        this._compileRing(p, params, pos, type, c, size, anim, result);
        break;
      case 'vortex':
        this._compileVortex(p, params, pos, type, c, size, result);
        break;
      case 'rain':
        this._compileRain(p, params, pos, type, c, size, result);
        break;
      case 'border':
        this._compileBorder(p, params, pos, type, c, size, result);
        break;
      case 'random':
        this._compileRandom(p, params, pos, type, c, size, result);
        break;
      default:
        this._compileRing(p, params, pos, type, c, size, anim, result);
        break;
    }

    return result;
  },

  _compileSpiralHelix(
    p: string,
    shapeType: string,
    params: Record<string, any>,
    pos: PositionConfig,
    type: string,
    c: ParticleColor,
    size: number,
    anim: AnimationConfig,
    result: Record<string, any>
  ): void {
    const isHelix = shapeType === 'helix';
    const turns = params.turns || (isHelix ? 3 : 2);
    const radius = params.radius || (isHelix ? 1.0 : 1.2);
    const density = params.density || 20;

    result[p + 'turns'] = turns;
    result[p + 'radius'] = radius;
    result[p + 'amount'] = density;
    result[p + 'increment'] = 'PI/' + p + 'amount';

    const outerMax = isHelix ? 2 : turns;
    const outerKey =
      p + 'i=0;' + p + 'i<' + outerMax + ';' + p + 'i=' + p + 'i+1';
    const innerKey =
      p + 'j=0;' + p + 'j<' + p + 'amount;' + p + 'j=' + p + 'j+1';

    const run: Record<string, any> = {};
    run[p + 'angle'] = p + 'j*' + p + 'increment';
    const rExpr = isHelix
      ? p + 'radius'
      : p + 'radius*(' + p + 'j/' + p + 'amount)';
    run[p + 'r'] = rExpr;

    let xExpr = p + 'r*cos(' + p + 'angle)';
    let yExpr = p + 'r*sin(' + p + 'angle)';
    let zExpr: string | number = 0;

    if (isHelix) {
      yExpr = '(' + p + 'j/' + p + 'amount-0.5)*3.0';
      zExpr = p + 'r*sin(' + p + 'angle)';
    }

    if (anim && anim.rotate) {
      const rotSpeed = anim.rotateSpeed || 1.0;
      const rot = 't*' + rotSpeed;
      const rx =
        '(' + xExpr + ')*cos(' + rot + ')-(' + yExpr + ')*sin(' + rot + ')';
      const ry =
        '(' + xExpr + ')*sin(' + rot + ')+(' + yExpr + ')*cos(' + rot + ')';
      xExpr = rx;
      yExpr = ry;
    }

    if (pos.x) xExpr = '(' + xExpr + ')+' + pos.x;
    if (pos.y) yExpr = '(' + yExpr + ')+' + pos.y;
    if (pos.z) zExpr = '(' + zExpr + ')+' + pos.z;

    run[p + 'particle'] = this._particleStr(type, xExpr, yExpr, zExpr, c, size);

    const innerObj: Record<string, any> = {};
    innerObj[innerKey] = run;
    const outerObj: Record<string, any> = {};
    outerObj[outerKey] = innerObj;
    result[p + 'loop'] = outerObj;
  },

  _compileRing(
    p: string,
    params: Record<string, any>,
    pos: PositionConfig,
    type: string,
    c: ParticleColor,
    size: number,
    anim: AnimationConfig,
    result: Record<string, any>
  ): void {
    const density = params.density || 20;
    const radius = params.radius || 1.5;

    result[p + 'amount'] = density;
    result[p + 'radius'] = radius;
    result[p + 'step'] = '2*PI/' + p + 'amount';

    const forKey = p + 'i=0;' + p + 'i<' + p + 'amount;' + p + 'i=' + p + 'i+1';
    const run: Record<string, any> = {};
    run[p + 'a'] = p + 'i*' + p + 'step';

    let xExpr = p + 'radius*cos(' + p + 'a)';
    let yExpr = p + 'radius*sin(' + p + 'a)';
    const zExpr = pos.z ? pos.z : 0;

    if (anim && anim.rotate) {
      const rotSpeed = anim.rotateSpeed || 1.0;
      const rot = 't*' + rotSpeed;
      const rx =
        '(' + xExpr + ')*cos(' + rot + ')-(' + yExpr + ')*sin(' + rot + ')';
      const ry =
        '(' + xExpr + ')*sin(' + rot + ')+(' + yExpr + ')*cos(' + rot + ')';
      xExpr = rx;
      yExpr = ry;
    }

    if (pos.x) xExpr = '(' + xExpr + ')+' + pos.x;
    if (pos.y) yExpr = '(' + yExpr + ')+' + pos.y;

    run[p + 'p'] = this._particleStr(type, xExpr, yExpr, zExpr, c, size);

    const forBody: Record<string, any> = {};
    forBody[forKey] = run;
    result[p + 'loop'] = forBody;
  },

  _compileVortex(
    p: string,
    params: Record<string, any>,
    pos: PositionConfig,
    type: string,
    c: ParticleColor,
    size: number,
    result: Record<string, any>
  ): void {
    const density = params.density || 30;
    const maxRadius = params.maxRadius || 1.5;
    const twist = params.twistFactor || 3;

    result[p + 'amount'] = density;
    result[p + 'maxR'] = maxRadius;
    result[p + 'twist'] = twist;

    const forKey = p + 'i=0;' + p + 'i<' + p + 'amount;' + p + 'i=' + p + 'i+1';
    const run: Record<string, any> = {};
    run[p + 'frac'] = p + 'i/' + p + 'amount';
    run[p + 'r'] = '(1-' + p + 'frac)*' + p + 'maxR';
    run[p + 'angle'] = p + 'frac*' + p + 'twist*2*PI';

    let xExpr = p + 'r*cos(' + p + 'angle)';
    let yExpr = '(' + p + 'frac-0.5)*2.0';
    let zExpr: string | number = p + 'r*sin(' + p + 'angle)';

    if (pos.x) xExpr = '(' + xExpr + ')+' + pos.x;
    if (pos.y) yExpr = '(' + yExpr + ')+' + pos.y;
    if (pos.z) zExpr = '(' + zExpr + ')+' + pos.z;

    run[p + 'particle'] = this._particleStr(type, xExpr, yExpr, zExpr, c, size);

    const forBody: Record<string, any> = {};
    forBody[forKey] = run;
    result[p + 'loop'] = forBody;
  },

  _compileRain(
    p: string,
    params: Record<string, any>,
    pos: PositionConfig,
    type: string,
    c: ParticleColor,
    size: number,
    result: Record<string, any>
  ): void {
    const density = params.density || 15;
    const spread = params.spread || 1.5;

    result[p + 'amount'] = density;
    result[p + 'spread'] = spread;

    const forKey = p + 'i=0;' + p + 'i<' + p + 'amount;' + p + 'i=' + p + 'i+1';
    const run: Record<string, any> = {};
    run[p + 'frac'] = p + 'i/' + p + 'amount';

    let xExpr = '(' + p + 'frac-0.5)*2*' + p + 'spread';
    let yExpr = '(0.5-(' + p + 'frac%1.0))*3.0';
    const zExpr = pos.z ? pos.z : 0;

    if (pos.x) xExpr = '(' + xExpr + ')+' + pos.x;
    if (pos.y) yExpr = '(' + yExpr + ')+' + pos.y;

    run[p + 'particle'] = this._particleStr(type, xExpr, yExpr, zExpr, c, size);

    const forBody: Record<string, any> = {};
    forBody[forKey] = run;
    result[p + 'loop'] = forBody;
  },

  _compileBorder(
    p: string,
    params: Record<string, any>,
    pos: PositionConfig,
    type: string,
    c: ParticleColor,
    size: number,
    result: Record<string, any>
  ): void {
    const range = params.offsetRange || 0.05;
    let xExpr: string | number = 'rand(-' + range + ',' + range + ')';
    let yExpr: string | number = 'rand(-' + range + ',' + range + ')';
    const zExpr = pos.z ? pos.z : 0;

    if (pos.x) xExpr = '(' + xExpr + ')+' + pos.x;
    if (pos.y) yExpr = '(' + yExpr + ')+' + pos.y;

    result[p + 'particle'] = this._particleStr(
      type,
      xExpr,
      yExpr,
      zExpr,
      c,
      size
    );
  },

  _compileRandom(
    p: string,
    params: Record<string, any>,
    pos: PositionConfig,
    type: string,
    c: ParticleColor,
    size: number,
    result: Record<string, any>
  ): void {
    const count = params.count || 12;
    const spread = params.spread || 1.0;

    result[p + 'amount'] = count;
    result[p + 'spread'] = spread;

    const run: Record<string, any> = {};
    run[p + 'px'] = 'rand(-' + p + 'spread,' + p + 'spread)';
    run[p + 'py'] = 'rand(-' + p + 'spread,' + p + 'spread)';
    run[p + 'pz'] = 'rand(-' + p + 'spread,' + p + 'spread)';

    let xExpr = p + 'px';
    let yExpr = p + 'py';
    let zExpr = p + 'pz';

    if (pos.x) xExpr = '(' + xExpr + ')+' + pos.x;
    if (pos.y) yExpr = '(' + yExpr + ')+' + pos.y;
    if (pos.z) zExpr = '(' + zExpr + ')+' + pos.z;

    run[p + 'particle'] = this._particleStr(type, xExpr, yExpr, zExpr, c, size);

    const forBody: Record<string, any> = {};
    forBody[p + 'run'] = run;
    result[p + 'loop'] = forBody;
  },

  _particleStr(
    type: string,
    xExpr: string | number,
    yExpr: string | number,
    zExpr: string | number,
    color: ParticleColor,
    size: number
  ): string {
    let dustOpts = '';
    if (type === 'REDSTONE') {
      dustOpts = ';' + color.r + ';' + color.g + ';' + color.b + ';' + size;
    }
    return type + dustOpts + ';' + xExpr + ';' + yExpr + ';' + zExpr;
  },

  compileAll(layers: LayerData[], frequency: number): string {
    const root: Record<string, any> = {};
    const enabled = layers.filter((l) => l.enabled);
    if (enabled.length === 0) return '# No active particle layers\n';

    root.frequency = frequency || 20;

    for (let idx = 0; idx < enabled.length; idx++) {
      const p = 'l' + idx + '_';
      const layerObj = this.compileLayer(enabled[idx], p);
      const keys = Object.keys(layerObj);
      for (let k = 0; k < keys.length; k++) {
        root[keys[k]] = layerObj[keys[k]];
      }
    }

    if (typeof jsyaml !== 'undefined' && jsyaml.dump) {
      return jsyaml.dump(root, { indent: 2, lineWidth: -1 });
    }

    return this.toYaml(root);
  },

  toYaml(json: Record<string, any>, margin = ''): string {
    let res = '';
    Object.keys(json).forEach((key) => {
      const val = json[key];
      if (typeof val === 'string') {
        res += margin + key + ": '" + val + "'\n";
      } else if (typeof val === 'number' || typeof val === 'boolean') {
        res += margin + key + ': ' + val + '\n';
      } else {
        const empty = Object.keys(val).length === 0;
        res += margin + key + ':' + (empty ? ' []' : '') + '\n';
        if (!empty) {
          res += this.toYaml(val, margin + '  ');
        }
      }
    });
    return res;
  },
};

// === presets.js === Preset definitions

const Presets = {
  definitions: {
    'Green Spiral': {
      description: 'Spiraling pattern around the portal',
      icon: 'tornado',
      accentColor: '#00ff66',
      frequency: 20,
      layers: [
        {
          name: 'Green Spiral',
          enabled: true,
          section: 'portal',
          particle: {
            type: 'REDSTONE',
            color: { r: 0, g: 255, b: 0 },
            size: 2,
          },
          shape: {
            type: 'spiral',
            params: { radius: 1.2, turns: 2, density: 30, speed: 1.0 },
          },
          position: { x: 0, y: 0, z: 0 },
          animation: { rotate: true, rotateSpeed: 1.0, float: false },
        },
      ],
    },
    'Pink Ring': {
      description: 'Ring of particles at the portal center',
      icon: 'circle',
      accentColor: '#ff66ff',
      frequency: 5,
      layers: [
        {
          name: 'Pink Ring',
          enabled: true,
          section: 'portal',
          particle: {
            type: 'REDSTONE',
            color: { r: 255, g: 100, b: 255 },
            size: 1.5,
          },
          shape: {
            type: 'ring',
            params: { radius: 1.5, density: 20, speed: 0 },
          },
          position: { x: 0, y: 0, z: 0 },
          animation: { rotate: false, rotateSpeed: 0, float: false },
        },
      ],
    },
    'Red-Blue Helix': {
      description: 'Double helix with two colors',
      icon: 'infinity',
      accentColor: '#ff3344',
      frequency: 15,
      layers: [
        {
          name: 'Red Strand',
          enabled: true,
          section: 'portal',
          particle: {
            type: 'REDSTONE',
            color: { r: 255, g: 50, b: 50 },
            size: 1,
          },
          shape: {
            type: 'spiral',
            params: { radius: 1.0, turns: 3, density: 20, speed: 1.0 },
          },
          position: { x: 0, y: 0, z: 0 },
          animation: { rotate: true, rotateSpeed: 1.0, float: false },
        },
        {
          name: 'Blue Strand',
          enabled: true,
          section: 'portal',
          particle: {
            type: 'REDSTONE',
            color: { r: 50, g: 50, b: 255 },
            size: 1,
          },
          shape: {
            type: 'spiral',
            params: { radius: 1.0, turns: 3, density: 20, speed: 1.0 },
          },
          position: { x: 0, y: 0, z: 0 },
          animation: { rotate: true, rotateSpeed: 1.0, float: false },
        },
      ],
    },
    'Purple Vortex': {
      description: 'Particles spiraling inward',
      icon: 'bullseye',
      accentColor: '#cc00ff',
      frequency: 10,
      layers: [
        {
          name: 'Purple Vortex',
          enabled: true,
          section: 'portal',
          particle: {
            type: 'REDSTONE',
            color: { r: 180, g: 50, b: 255 },
            size: 1.5,
          },
          shape: {
            type: 'vortex',
            params: { maxRadius: 1.5, density: 30, twistFactor: 3, speed: 1.0 },
          },
          position: { x: 0, y: 0, z: 0 },
          animation: { rotate: true, rotateSpeed: 1.0, float: false },
        },
      ],
    },
    'Blue Rain': {
      description: 'Particles falling like rain',
      icon: 'cloud-rain',
      accentColor: '#64b4ff',
      frequency: 10,
      layers: [
        {
          name: 'Blue Rain',
          enabled: true,
          section: 'portal',
          particle: {
            type: 'REDSTONE',
            color: { r: 100, g: 180, b: 255 },
            size: 1,
          },
          shape: {
            type: 'rain',
            params: { density: 15, spread: 1.5, speed: 1.0 },
          },
          position: { x: 0, y: 0, z: 0 },
          animation: { rotate: false, rotateSpeed: 0, float: false },
        },
      ],
    },
    'Flame Border': {
      description: 'Flames on each portal tile',
      icon: 'fire',
      accentColor: '#ff8800',
      frequency: 5,
      layers: [
        {
          name: 'Flames',
          enabled: true,
          section: 'tile',
          particle: { type: 'FLAME', color: { r: 255, g: 140, b: 0 }, size: 1 },
          shape: { type: 'border', params: { offsetRange: 0.05 } },
          position: { x: 0, y: 0, z: 0 },
          animation: { rotate: false, rotateSpeed: 0, float: false },
        },
      ],
    },
    'Enchant Glow': {
      description: 'Enchantment particles floating',
      icon: 'stars',
      accentColor: '#66ff66',
      frequency: 8,
      layers: [
        {
          name: 'Enchant',
          enabled: true,
          section: 'portal',
          particle: {
            type: 'ENCHANTMENT_TABLE',
            color: { r: 100, g: 255, b: 100 },
            size: 1,
          },
          shape: {
            type: 'random',
            params: { count: 12, spread: 1.0, seed: 42 },
          },
          position: { x: 0, y: 0, z: 0 },
          animation: { rotate: false, rotateSpeed: 0, float: true },
        },
      ],
    },
    Empty: {
      description: 'Start from scratch',
      icon: 'plus-circle',
      accentColor: '#555570',
      frequency: 20,
      layers: [],
    },
  } as Record<string, PresetDefinition>,

  renderGrid(containerEl: HTMLElement, app: any): void {
    containerEl.innerHTML = '';

    Object.keys(this.definitions).forEach((name) => {
      const preset = this.definitions[name];
      const card = document.createElement('div');
      card.className =
        'group flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-800/80 bg-gray-900/40 p-4 text-center cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-700 hover:bg-gray-800/40 hover:shadow-lg backdrop-blur-sm';

      const iconDiv = document.createElement('div');
      iconDiv.className =
        'flex h-10 w-10 items-center justify-center rounded-xl border border-gray-800 bg-gray-950 text-gray-300 transition-transform group-hover:scale-110';
      iconDiv.style.color = preset.accentColor;
      const IconComp = PresetIconComponents[preset.icon] || Circle;
      void render(iconDiv, <IconComp size={24} />);

      const nameDiv = document.createElement('div');
      nameDiv.className = 'text-xs font-bold text-gray-200';
      nameDiv.textContent = name;

      const descDiv = document.createElement('div');
      descDiv.className = 'text-[11px] text-gray-500 line-clamp-2';
      descDiv.textContent = preset.description;

      card.appendChild(iconDiv);
      card.appendChild(nameDiv);
      card.appendChild(descDiv);

      card.addEventListener('click', () => {
        app.loadPreset(name);
        const modal = document.getElementById('presetsModal');
        if (modal) modal.style.display = 'none';
      });

      containerEl.appendChild(card);
    });
  },
};

// === viewport.js === 3D Particle Viewport with Three.js

class ThreeView {
  canvas: HTMLCanvasElement;
  scene: any;
  camera: any;
  renderer: any;
  controls: any;
  portalMesh: any = null;
  particlePoints: any[] = [];
  animationId: number | null = null;
  pw = 4;
  ph = 5;

  constructor(canvasEl: HTMLCanvasElement) {
    this.canvas = canvasEl;
    const THREE = window.THREE;
    if (!THREE) return;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0f);

    const aspect = canvasEl.clientWidth / canvasEl.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.set(0, 0, 7);

    this.renderer = new THREE.WebGLRenderer({
      canvas: canvasEl,
      antialias: true,
    });
    this.renderer.setSize(canvasEl.clientWidth, canvasEl.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);

    if (THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(
        this.camera,
        this.renderer.domElement
      );
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
    }

    this._buildPortalFrame();

    const parent = canvasEl.parentElement;
    if (parent) {
      const ro = new ResizeObserver(() => this.resize());
      ro.observe(parent);
    }
  }

  resize(): void {
    const THREE = window.THREE;
    if (!THREE || !this.renderer) return;
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  resetCamera(): void {
    if (!this.camera) return;
    this.camera.position.set(0, 0, 7);
    if (this.controls) {
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }
  }

  _buildPortalFrame(): void {
    const THREE = window.THREE;
    if (!THREE) return;

    if (this.portalMesh) this.scene.remove(this.portalMesh);

    const group = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x221c35,
      roughness: 0.8,
    });
    const insideMat = new THREE.MeshBasicMaterial({
      color: 0x9900ff,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });

    const halfW = this.pw * 0.5;
    const halfH = this.ph * 0.5;
    const thickness = 0.4;

    const topGeo = new THREE.BoxGeometry(this.pw, thickness, thickness);
    const topMesh = new THREE.Mesh(topGeo, frameMat);
    topMesh.position.set(0, halfH - thickness * 0.5, 0);
    group.add(topMesh);

    const botMesh = new THREE.Mesh(topGeo, frameMat);
    botMesh.position.set(0, -halfH + thickness * 0.5, 0);
    group.add(botMesh);

    const sideGeo = new THREE.BoxGeometry(
      thickness,
      this.ph - thickness * 2,
      thickness
    );
    const leftMesh = new THREE.Mesh(sideGeo, frameMat);
    leftMesh.position.set(-halfW + thickness * 0.5, 0, 0);
    group.add(leftMesh);

    const rightMesh = new THREE.Mesh(sideGeo, frameMat);
    rightMesh.position.set(halfW - thickness * 0.5, 0, 0);
    group.add(rightMesh);

    const insideGeo = new THREE.PlaneGeometry(
      this.pw - thickness * 2,
      this.ph - thickness * 2
    );
    const insideMesh = new THREE.Mesh(insideGeo, insideMat);
    insideMesh.position.set(0, 0, 0);
    group.add(insideMesh);

    this.portalMesh = group;
    this.scene.add(this.portalMesh);
  }

  updateParticles(layers: LayerData[], simTime: number): void {
    const THREE = window.THREE;
    if (!THREE) return;

    this.particlePoints.forEach((p) => this.scene.remove(p));
    this.particlePoints = [];

    layers.forEach((layer) => {
      if (!layer.enabled) return;
      const shapeType = layer.shape ? layer.shape.type : 'ring';
      const shapeFn =
        Shapes[shapeType as keyof typeof Shapes] ||
        ((params, pw, ph, t) => Shapes.ring(params, pw, ph, t));
      const params = layer.shape ? layer.shape.params || {} : {};
      const particle = layer.particle || {
        type: 'REDSTONE',
        color: { r: 0, g: 255, b: 0 },
        size: 1,
      };

      const pts = shapeFn(params, this.pw, this.ph, simTime);
      if (pts.length === 0) return;

      const positions = new Float32Array(pts.length * 3);
      for (let i = 0; i < pts.length; i++) {
        let px = pts[i].x;
        let py = pts[i].y;
        let pz = pts[i].z;

        if (layer.animation && layer.animation.rotate) {
          const rotSpeed = layer.animation.rotateSpeed || 1.0;
          const angle = simTime * rotSpeed;
          const rx = px * Math.cos(angle) - py * Math.sin(angle);
          const ry = px * Math.sin(angle) + py * Math.cos(angle);
          px = rx;
          py = ry;
        }

        if (layer.position) {
          px += layer.position.x || 0;
          py += layer.position.y || 0;
          pz += layer.position.z || 0;
        }

        positions[i * 3] = px;
        positions[i * 3 + 1] = py;
        positions[i * 3 + 2] = pz;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      );

      const c = particle.color || { r: 255, g: 255, b: 255 };
      const hexColor = (c.r << 16) | (c.g << 8) | c.b;

      let size = (particle.size || 1) * 0.12;
      if (particle.type === 'FLAME') size *= 1.5;

      const material = new THREE.PointsMaterial({
        color: hexColor,
        size,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });

      const pSystem = new THREE.Points(geometry, material);
      this.scene.add(pSystem);
      this.particlePoints.push(pSystem);
    });
  }

  start(): void {
    if (this.animationId) return;
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      if (this.controls) this.controls.update();
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    animate();
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  captureImage(): string {
    if (!this.renderer) return '';
    this.renderer.render(this.scene, this.camera);
    return this.canvas.toDataURL('image/png');
  }
}

// === app.js === Particle Editor Application Controller

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

    Presets.renderGrid(document.getElementById('presetsGrid')!, this);

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
    group.className =
      'rounded-xl border border-gray-800/80 bg-gray-900/30 p-4 space-y-3';
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
          'flex items-center gap-3 rounded-xl border border-gray-800/80 bg-gray-900/40 p-3.5 cursor-pointer transition-all hover:-translate-y-0.5 hover:border-gray-700 hover:bg-gray-800/40 hover:text-white text-xs font-semibold text-gray-300 backdrop-blur-sm';
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
