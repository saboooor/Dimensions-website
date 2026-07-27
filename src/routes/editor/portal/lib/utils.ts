import type { AddonDefinition } from "./types";

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

export const Utils = {
  generateId(): string {
    return (
      "pe_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
    );
  },

  clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  },

  rgbToHex(r: number, g: number, b: number): string {
    return (
      "#" +
      [r, g, b]
        .map((c) => {
          const hex = Math.round(c).toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  },

  hexToRgb(hex: string): { r: number; g: number; b: number } {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3)
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    const n = parseInt(hex, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  },

  rgbToSemicolon(r: number, g: number, b: number): string {
    return r + ";" + g + ";" + b;
  },

  semicolonToRgb(str: string): { r: number; g: number; b: number } {
    const parts = str.split(";");
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
