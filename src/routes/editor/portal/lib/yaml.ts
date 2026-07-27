export const YamlConverter = {
  INDENT: "  ",

  convert(obj: any): string {
    if (typeof obj === "string") obj = JSON.parse(obj);
    const lines: string[] = [];
    this._convertValue(obj, lines, "");
    return lines.join("\n");
  },

  _convertValue(val: any, lines: string[], indent: string): void {
    const type = this._getType(val);
    switch (type) {
      case "hash":
        this._convertHash(val, lines, indent);
        break;
      case "array":
        this._convertArray(val, lines, indent);
        break;
      case "string":
        lines.push(this._normalizeStr(val));
        break;
      case "number":
        lines.push(String(val));
        break;
      case "boolean":
        lines.push(val ? "true" : "false");
        break;
      case "null":
        lines.push("null");
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
        type === "string" ||
        type === "number" ||
        type === "boolean" ||
        type === "null"
      ) {
        const valLines: string[] = [];
        this._convertValue(val, valLines, "");
        lines.push(indent + this._normalizeStr(key) + ": " + valLines[0]);
      } else {
        lines.push(indent + this._normalizeStr(key) + ":");
        if (type === "array" && val.length === 0) {
          lines[lines.length - 1] = indent + this._normalizeStr(key) + ": []";
        } else if (type === "hash" && Object.keys(val).length === 0) {
          lines[lines.length - 1] = indent + this._normalizeStr(key) + ": {}";
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
      lines.push(indent + "[]");
      return;
    }
    arr.forEach((item) => {
      const type = this._getType(item);
      if (
        type === "string" ||
        type === "number" ||
        type === "boolean" ||
        type === "null"
      ) {
        const valLines: string[] = [];
        this._convertValue(item, valLines, "");
        lines.push(indent + "- " + valLines[0]);
      } else {
        const sub: string[] = [];
        this._convertValue(item, sub, indent + this.INDENT);
        sub.forEach((s, i) => {
          lines.push(i === 0 ? indent + "- " + s.trim() : s);
        });
      }
    });
  },

  _getType(val: any): string {
    if (val === null || val === undefined) return "null";
    if (Array.isArray(val)) return "array";
    return typeof val;
  },

  _normalizeStr(str: any): string {
    if (typeof str !== "string") return String(str);
    if (/^[\w.]+$/.test(str)) return str;
    return "'" + str.replace(/'/g, "''") + "'";
  },
};
