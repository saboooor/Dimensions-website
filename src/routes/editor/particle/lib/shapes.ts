import Circle from "lucide-icons-qwik/icons/Circle";
import Tornado from "lucide-icons-qwik/icons/Tornado";
import InfinityIcon from "lucide-icons-qwik/icons/InfinityIcon";
import Target from "lucide-icons-qwik/icons/Target";
import CloudRain from "lucide-icons-qwik/icons/CloudRain";
import Flame from "lucide-icons-qwik/icons/Flame";
import Dices from "lucide-icons-qwik/icons/Dices";
import Code from "lucide-icons-qwik/icons/Code";
import Sparkles from "lucide-icons-qwik/icons/Sparkles";
import CirclePlus from "lucide-icons-qwik/icons/CirclePlus";
import type { ParticlePoint } from "./types";

export const ShapeDefaults: Record<string, Record<string, any>> = {
  ring: { radius: 1.5, density: 20, speed: 0.0 },
  spiral: { radius: 1.2, turns: 2, density: 30, speed: 1.0 },
  helix: { radius: 1.0, turns: 3, density: 20, speed: 1.0 },
  vortex: { maxRadius: 1.5, density: 30, twistFactor: 3, speed: 1.0 },
  rain: { density: 15, spread: 1.5, speed: 1.0 },
  border: { offsetRange: 0.05 },
  random: { count: 12, spread: 1.0, seed: 42 },
  custom: { expression: "", count: 10 },
};

export const ShapeParamLabels: Record<string, string> = {
  radius: "Radius",
  density: "Particle Count",
  speed: "Speed",
  turns: "Turns",
  maxRadius: "Max Radius",
  twistFactor: "Twist",
  spread: "Spread",
  count: "Count",
  seed: "Seed",
  offsetRange: "Offset",
  expression: "Expression",
};

export const ShapeParamRanges: Record<
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

export const ShapeIconComponents: Record<string, any> = {
  ring: Circle,
  spiral: Tornado,
  helix: InfinityIcon,
  vortex: Target,
  rain: CloudRain,
  border: Flame,
  random: Dices,
  custom: Code,
};

export const PresetIconComponents: Record<string, any> = {
  tornado: Tornado,
  circle: Circle,
  infinity: InfinityIcon,
  bullseye: Target,
  "cloud-rain": CloudRain,
  rain: CloudRain,
  fire: Flame,
  stars: Sparkles,
  "plus-circle": CirclePlus,
};

export const Shapes = {
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
