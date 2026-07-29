import { render } from "@qwik.dev/core";
import { Toggle } from "@luminescent/ui-qwik";
import Puzzle from "lucide-icons-qwik/icons/Puzzle";

import type { AddonOption, AddonDefinition } from "./types";

export type { AddonOption, AddonDefinition };

export const AddonManager = {
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
      if (val === "" || val === "disabled") continue;
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
        if (opt.name) delete this.addonState[opt.name];
      });
    } else {
      addon.options.forEach((opt) => {
        if (opt.name) {
          this.addonState[opt.name] =
            opt.default !== undefined ? opt.default : "";
        }
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
          if (opt.name) {
            this.addonState[opt.name] =
              opt.default !== undefined ? opt.default : "";
          }
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
    list.innerHTML = "";

    this.addons.forEach((addon) => {
      const card = document.createElement("div");
      card.className =
        "flex flex-col gap-2 rounded-xl border p-4 transition-all duration-150 " +
        (addon.enabled
          ? "border-gray-700 bg-gray-900/60 shadow-sm"
          : "border-gray-800/80 bg-gray-950/40 opacity-75 hover:border-gray-700");

      const nameRow = document.createElement("div");
      nameRow.className = "flex items-center justify-between gap-2";

      const nameEl = document.createElement("span");
      nameEl.className = "text-xs font-bold text-gray-200";
      nameEl.textContent = addon.name;
      nameRow.appendChild(nameEl);

      const toggleWrap = document.createElement("div");
      void render(
        toggleWrap,
        <Toggle
          checked={addon.enabled}
          onChange$={() => {
            this.toggle(addon.name);
          }}
        />
      );
      nameRow.appendChild(toggleWrap);
      card.appendChild(nameRow);

      if (addon.description) {
        const desc = document.createElement("p");
        desc.className = "text-[11px] text-gray-400 leading-relaxed";
        desc.textContent = addon.description;
        card.appendChild(desc);
      }

      list.appendChild(card);
    });
  },

  renderOptions(): void {
    if (!this.optionsEl) return;
    const container = this.optionsEl;
    container.innerHTML = "";
    let hasOptions = false;

    this.addons.forEach((addon) => {
      if (!addon.enabled || !addon.options || addon.options.length === 0)
        return;
      hasOptions = true;

      const group = document.createElement("div");
      group.className = "addon-option-group";

      const title = document.createElement("div");
      title.className = "addon-option-title flex items-center gap-1.5";
      const iconWrap = document.createElement("span");
      void render(iconWrap, <Puzzle size={16} class="inline-block" />);
      title.appendChild(iconWrap);
      const textSpan = document.createElement("span");
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
      const note = document.createElement("div");
      note.className = "addon-no-options";
      note.textContent = "Enabled addons have no configurable options.";
      container.appendChild(note);
    }
  },

  _createOptionRow(opt: AddonOption): HTMLElement {
    const type = opt.type || "string";
    const key = opt.name;
    if (!key) return document.createElement("div");

    const parts = key.split(".");
    let label = parts[parts.length - 1];
    label = label.replace(/([a-z])([A-Z])/g, "$1 $2");
    const value = Object.prototype.hasOwnProperty.call(this.addonState, key)
      ? this.addonState[key]
      : opt.default;

    const row = document.createElement("div");
    row.className = "field-col";
    row.style.padding = "4px 0";

    const labelEl = document.createElement("span");
    labelEl.className = "field-label";
    labelEl.textContent = label;
    row.appendChild(labelEl);

    if (type === "toggle") {
      row.className = "field-row flex items-center justify-between";
      const toggleWrap = document.createElement("div");
      void render(
        toggleWrap,
        <Toggle
          checked={!!value}
          onChange$={(e, el) => {
            this.addonState[key] = el.checked;
            if (this.onStateChange) this.onStateChange();
          }}
        />
      );
      row.appendChild(toggleWrap);
    } else if (type === "int") {
      const input = document.createElement("input");
      input.type = "number";
      input.className = "field-input";
      input.value = value;
      if (opt.min !== undefined) input.min = String(opt.min);
      if (opt.max !== undefined) input.max = String(opt.max);
      input.addEventListener("change", () => {
        let v = parseInt(input.value) || 0;
        if (opt.min !== undefined && v < opt.min) v = opt.min;
        if (opt.max !== undefined && v > opt.max) v = opt.max;
        input.value = String(v);
        this.addonState[key] = v;
        if (this.onStateChange) this.onStateChange();
      });
      row.appendChild(input);
      if (opt.min !== undefined && opt.max !== undefined) {
        const help = document.createElement("span");
        help.className = "field-help";
        help.textContent = "Range: " + opt.min + " \u2013 " + opt.max;
        row.appendChild(help);
      }
    } else if (type === "list") {
      const textarea = document.createElement("textarea");
      textarea.className = "field-textarea";
      textarea.rows = 3;
      textarea.value = Array.isArray(value) ? value.join("\n") : value || "";
      textarea.placeholder = "One entry per line";
      textarea.addEventListener("change", () => {
        const text = textarea.value.trim();
        this.addonState[key] = text === "";
        if (this.onStateChange) this.onStateChange();
      });
      row.appendChild(textarea);
    } else if (type === "select-single") {
      const select = document.createElement("select");
      select.className = "field-input";
      const choices = opt.list || [];
      choices.forEach((choice) => {
        const option = document.createElement("option");
        option.value = choice;
        option.textContent = choice || "(disabled)";
        if (choice === value || (choice === "disabled" && value === ""))
          option.selected = true;
        select.appendChild(option);
      });
      select.addEventListener("change", () => {
        let v = select.value;
        if (v === "disabled") v = "";
        this.addonState[key] = v;
        if (this.onStateChange) this.onStateChange();
      });
      row.appendChild(select);
    } else {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "field-input";
      input.value = value || "";
      input.addEventListener("change", () => {
        this.addonState[key] = input.value;
        if (this.onStateChange) this.onStateChange();
      });
      row.appendChild(input);
    }

    return row;
  },
};
