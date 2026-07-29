import { Utils } from "./utils";

export interface BlockSelectorInstance {
  setSelected: (id: string | null) => void;
  refresh: () => void;
}

export const BlockSelector = {
  _recentKey: "pe2_recent_blocks",
  _maxRecent: 12,

  init(
    gridId: string,
    searchId: string,
    manualId: string,
    textureList: Array<string | { id: string; key: string; name: string; icon: string }>,
    folder: string,
    onSelect: (id: string) => void
  ): BlockSelectorInstance {
    const grid = document.getElementById(gridId) as HTMLElement;
    const search = document.getElementById(searchId) as HTMLInputElement;
    const manual = document.getElementById(manualId) as HTMLInputElement;
    let selected: string | null = null;

    const renderGrid = (filter: string) => {
      if (!grid) return;
      grid.innerHTML = "";
      const filterLower = (filter || "").toLowerCase().trim();
      let shown = 0;
      const base = (window as any).TEXTURE_BASE || "/editor/portal/Images/";

      textureList.forEach((item) => {
        const isObj = typeof item === "object";
        const key = isObj ? item.key : item;
        const icon = isObj ? item.icon : item;
        const name = isObj ? item.name : item.replace(/_/g, " ");
        const fullId = isObj ? item.id : key;

        if (filterLower) {
          const matchKey = key.toLowerCase().includes(filterLower);
          const matchName = name.toLowerCase().includes(filterLower);
          const matchFull = fullId.toLowerCase().includes(filterLower);
          if (!matchKey && !matchName && !matchFull) return;
        }

        const tile = document.createElement("div");
        tile.className =
          "aspect-square rounded-lg border bg-cover bg-center cursor-pointer transition-all duration-150 hover:scale-105 shadow-sm " +
          (selected === key || selected === icon
            ? "border-gray-400 ring-2 ring-gray-400/40 shadow-lg"
            : "border-gray-800/80 hover:border-gray-600");
        tile.style.backgroundImage =
          "url('" + base + folder + "/" + icon + ".png')";
        tile.style.imageRendering = "pixelated";
        tile.title = name + " (" + fullId + ")";
        tile.addEventListener("click", () => {
          selected = key;
          if (manual) manual.value = key.toUpperCase();
          onSelect(key);
          this._addRecent(key);
          renderGrid(search ? search.value : "");
        });
        grid.appendChild(tile);
        shown++;
      });

      if (shown === 0) {
        const empty = document.createElement("div");
        empty.style.cssText =
          "padding: 12px; color: #555570; font-size: 11px; text-align: center; width: 100%;";
        empty.textContent = "No blocks found";
        grid.appendChild(empty);
      }
    };

    if (search) {
      const debounced = Utils.debounce(() => {
        renderGrid(search.value);
      }, 150);
      search.addEventListener("input", debounced);
    }

    if (manual) {
      manual.addEventListener("change", () => {
        const val = manual.value.trim().toUpperCase();
        if (val) {
          selected = val.toLowerCase();
          onSelect(val);
          this._addRecent(val.toLowerCase());
          renderGrid(search ? search.value : "");
        }
      });
    }

    renderGrid("");

    return {
      setSelected: (id: string | null) => {
        selected = id ? id.toLowerCase() : null;
        if (manual) manual.value = id ? id.toUpperCase() : "";
        renderGrid(search ? search.value : "");
      },
      refresh: () => {
        renderGrid(search ? search.value : "");
      },
    };
  },

  _addRecent(id: string): void {
    try {
      let recent: string[] = JSON.parse(
        localStorage.getItem(this._recentKey) || "[]"
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
      return JSON.parse(localStorage.getItem(this._recentKey) || "[]");
    } catch {
      return [];
    }
  },
};
