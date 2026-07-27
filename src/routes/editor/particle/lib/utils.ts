import type { ParticleColor } from "./types";

export const Utils = {
  generateId(): string {
    return (
      "layer-" +
      Date.now().toString(36) +
      "-" +
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
      "#" +
      [r, g, b]
        .map((v) =>
          Utils.clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")
        )
        .join("")
    );
  },

  hexToRgb(hex: string): ParticleColor {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3)
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
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
