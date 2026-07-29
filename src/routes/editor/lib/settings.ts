import { Utils } from "./utils";
import { YamlConverter } from "./yaml";

export const Settings = {
  defaults: {
    configVersion: "3.0.1",
    Enable: true,
    DisplayName: "TestPortal",
    "Portal.Frame.Material": "STONE",
    "Portal.Frame.Face": "all",
    "Portal.InsideMaterial": "NETHER_PORTAL",
    "Portal.LighterMaterial": "FLINT_AND_STEEL",
    "Options.EnableParticles": true,
    "Portal.ParticlesColor": "255;255;255",
    "Portal.MinimumWidth": 4,
    "Portal.MinimumHeight": 5,
    "Portal.MaximumWidth": 14,
    "Portal.MaximumHeight": 15,
    "World.Name": "world_nether",
    "Options.ExitPortal.Enable": true,
    "Options.ExitPortal.FixedWidth": -1,
    "Options.ExitPortal.FixedHeight": -1,
    "Options.AllowedWorlds": [] as string[],
    "Portal.BreakEffect": "BLOCK_GLASS_BREAK",
    "Options.TeleportDelay": 4,
    "Entities.Transformation": ["SKELETON->WITHER_SKELETON"],
    "Entities.Spawning.Delay": "60000-120000",
    "Entities.Spawning.List": ["ZOMBIE;30", "SKELETON;30"],
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

      if (val === "skip" || val === undefined) continue;

      if (key.indexOf(".") === -1) {
        result[key] = val;
      } else {
        const parts = key.split(".");
        let obj = result;
        for (let j = 0; j < parts.length; j++) {
          if (j === parts.length - 1) {
            obj[parts[j]] = val;
          } else {
            if (!obj[parts[j]] || typeof obj[parts[j]] !== "object") {
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
      if (keys[i] !== "configVersion") {
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

    if (el instanceof HTMLInputElement && el.type === "checkbox") {
      el.checked = !!val;
    } else if (el instanceof HTMLTextAreaElement) {
      el.value = Array.isArray(val) ? val.join("\n") : val || "";
    } else {
      el.value = val !== undefined ? val : "";
    }

    el.addEventListener("change", () => {
      let newVal: any;
      if (el instanceof HTMLInputElement && el.type === "checkbox") {
        newVal = el.checked;
      } else if (el instanceof HTMLInputElement && el.type === "number") {
        newVal = parseInt(el.value) || 0;
      } else if (el instanceof HTMLTextAreaElement) {
        const text = el.value.trim();
        newVal = text === "" ? [] : text.split("\n");
      } else {
        newVal = el.value;
      }
      state[key] = newVal;
      if (onChange) onChange(key, newVal);
    });

    return el;
  },
};
