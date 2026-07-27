import type {
  LayerData,
  ParticleColor,
  PositionConfig,
  AnimationConfig,
} from "./types";

declare const jsyaml: any;

export const Compiler = {
  compileLayer(layer: LayerData, prefix: string): Record<string, any> {
    const p = prefix || "l0_";
    const result: Record<string, any> = {};
    const shape = layer.shape || { type: "spiral", params: {} };
    const particle = layer.particle || {
      type: "REDSTONE",
      color: { r: 255, g: 0, b: 0 },
      size: 1,
    };
    const anim = layer.animation || {
      rotate: false,
      rotateSpeed: 1,
      float: false,
    };

    const type = particle.type || "REDSTONE";
    const c = particle.color || { r: 255, g: 255, b: 255 };
    const size = particle.size || 1;
    const pos = layer.position || { x: 0, y: 0, z: 0 };
    const params = shape.params || {};

    switch (shape.type) {
      case "spiral":
      case "helix":
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
      case "ring":
        this._compileRing(p, params, pos, type, c, size, anim, result);
        break;
      case "vortex":
        this._compileVortex(p, params, pos, type, c, size, result);
        break;
      case "rain":
        this._compileRain(p, params, pos, type, c, size, result);
        break;
      case "border":
        this._compileBorder(p, params, pos, type, c, size, result);
        break;
      case "random":
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
    const isHelix = shapeType === "helix";
    const turns = params.turns || (isHelix ? 3 : 2);
    const radius = params.radius || (isHelix ? 1.0 : 1.2);
    const density = params.density || 20;

    result[p + "turns"] = turns;
    result[p + "radius"] = radius;
    result[p + "amount"] = density;
    result[p + "increment"] = "PI/" + p + "amount";

    const outerMax = isHelix ? 2 : turns;
    const outerKey =
      p + "i=0;" + p + "i<" + outerMax + ";" + p + "i=" + p + "i+1";
    const innerKey =
      p + "j=0;" + p + "j<" + p + "amount;" + p + "j=" + p + "j+1";

    const run: Record<string, any> = {};
    run[p + "angle"] = p + "j*" + p + "increment";
    const rExpr = isHelix
      ? p + "radius"
      : p + "radius*(" + p + "j/" + p + "amount)";
    run[p + "r"] = rExpr;

    let xExpr = p + "r*cos(" + p + "angle)";
    let yExpr = p + "r*sin(" + p + "angle)";
    let zExpr: string | number = 0;

    if (isHelix) {
      yExpr = "(" + p + "j/" + p + "amount-0.5)*3.0";
      zExpr = p + "r*sin(" + p + "angle)";
    }

    if (anim && anim.rotate) {
      const rotSpeed = anim.rotateSpeed || 1.0;
      const rot = "t*" + rotSpeed;
      const rx =
        "(" + xExpr + ")*cos(" + rot + ")-(" + yExpr + ")*sin(" + rot + ")";
      const ry =
        "(" + xExpr + ")*sin(" + rot + ")+(" + yExpr + ")*cos(" + rot + ")";
      xExpr = rx;
      yExpr = ry;
    }

    if (pos.x) xExpr = "(" + xExpr + ")+" + pos.x;
    if (pos.y) yExpr = "(" + yExpr + ")+" + pos.y;
    if (pos.z) zExpr = "(" + zExpr + ")+" + pos.z;

    run[p + "particle"] = this._particleStr(type, xExpr, yExpr, zExpr, c, size);

    const innerObj: Record<string, any> = {};
    innerObj[innerKey] = run;
    const outerObj: Record<string, any> = {};
    outerObj[outerKey] = innerObj;
    result[p + "loop"] = outerObj;
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

    result[p + "amount"] = density;
    result[p + "radius"] = radius;
    result[p + "step"] = "2*PI/" + p + "amount";

    const forKey = p + "i=0;" + p + "i<" + p + "amount;" + p + "i=" + p + "i+1";
    const run: Record<string, any> = {};
    run[p + "a"] = p + "i*" + p + "step";

    let xExpr = p + "radius*cos(" + p + "a)";
    let yExpr = p + "radius*sin(" + p + "a)";
    const zExpr = pos.z ? pos.z : 0;

    if (anim && anim.rotate) {
      const rotSpeed = anim.rotateSpeed || 1.0;
      const rot = "t*" + rotSpeed;
      const rx =
        "(" + xExpr + ")*cos(" + rot + ")-(" + yExpr + ")*sin(" + rot + ")";
      const ry =
        "(" + xExpr + ")*sin(" + rot + ")+(" + yExpr + ")*cos(" + rot + ")";
      xExpr = rx;
      yExpr = ry;
    }

    if (pos.x) xExpr = "(" + xExpr + ")+" + pos.x;
    if (pos.y) yExpr = "(" + yExpr + ")+" + pos.y;

    run[p + "p"] = this._particleStr(type, xExpr, yExpr, zExpr, c, size);

    const forBody: Record<string, any> = {};
    forBody[forKey] = run;
    result[p + "loop"] = forBody;
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

    result[p + "amount"] = density;
    result[p + "maxR"] = maxRadius;
    result[p + "twist"] = twist;

    const forKey = p + "i=0;" + p + "i<" + p + "amount;" + p + "i=" + p + "i+1";
    const run: Record<string, any> = {};
    run[p + "frac"] = p + "i/" + p + "amount";
    run[p + "r"] = "(1-" + p + "frac)*" + p + "maxR";
    run[p + "angle"] = p + "frac*" + p + "twist*2*PI";

    let xExpr = p + "r*cos(" + p + "angle)";
    let yExpr = "(" + p + "frac-0.5)*2.0";
    let zExpr: string | number = p + "r*sin(" + p + "angle)";

    if (pos.x) xExpr = "(" + xExpr + ")+" + pos.x;
    if (pos.y) yExpr = "(" + yExpr + ")+" + pos.y;
    if (pos.z) zExpr = "(" + zExpr + ")+" + pos.z;

    run[p + "particle"] = this._particleStr(type, xExpr, yExpr, zExpr, c, size);

    const forBody: Record<string, any> = {};
    forBody[forKey] = run;
    result[p + "loop"] = forBody;
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

    result[p + "amount"] = density;
    result[p + "spread"] = spread;

    const forKey = p + "i=0;" + p + "i<" + p + "amount;" + p + "i=" + p + "i+1";
    const run: Record<string, any> = {};
    run[p + "frac"] = p + "i/" + p + "amount";

    let xExpr = "(" + p + "frac-0.5)*2*" + p + "spread";
    let yExpr = "(0.5-(" + p + "frac%1.0))*3.0";
    const zExpr = pos.z ? pos.z : 0;

    if (pos.x) xExpr = "(" + xExpr + ")+" + pos.x;
    if (pos.y) yExpr = "(" + yExpr + ")+" + pos.y;

    run[p + "particle"] = this._particleStr(type, xExpr, yExpr, zExpr, c, size);

    const forBody: Record<string, any> = {};
    forBody[forKey] = run;
    result[p + "loop"] = forBody;
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
    let xExpr: string | number = "rand(-" + range + "," + range + ")";
    let yExpr: string | number = "rand(-" + range + "," + range + ")";
    const zExpr = pos.z ? pos.z : 0;

    if (pos.x) xExpr = "(" + xExpr + ")+" + pos.x;
    if (pos.y) yExpr = "(" + yExpr + ")+" + pos.y;

    result[p + "particle"] = this._particleStr(
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

    result[p + "amount"] = count;
    result[p + "spread"] = spread;

    const run: Record<string, any> = {};
    run[p + "px"] = "rand(-" + p + "spread," + p + "spread)";
    run[p + "py"] = "rand(-" + p + "spread," + p + "spread)";
    run[p + "pz"] = "rand(-" + p + "spread," + p + "spread)";

    let xExpr = p + "px";
    let yExpr = p + "py";
    let zExpr = p + "pz";

    if (pos.x) xExpr = "(" + xExpr + ")+" + pos.x;
    if (pos.y) yExpr = "(" + yExpr + ")+" + pos.y;
    if (pos.z) zExpr = "(" + zExpr + ")+" + pos.z;

    run[p + "particle"] = this._particleStr(type, xExpr, yExpr, zExpr, c, size);

    const forBody: Record<string, any> = {};
    forBody[p + "run"] = run;
    result[p + "loop"] = forBody;
  },

  _particleStr(
    type: string,
    xExpr: string | number,
    yExpr: string | number,
    zExpr: string | number,
    color: ParticleColor,
    size: number
  ): string {
    let dustOpts = "";
    if (type === "REDSTONE") {
      dustOpts = ";" + color.r + ";" + color.g + ";" + color.b + ";" + size;
    }
    return type + dustOpts + ";" + xExpr + ";" + yExpr + ";" + zExpr;
  },

  compileAll(layers: LayerData[], frequency: number): string {
    const root: Record<string, any> = {};
    const enabled = layers.filter((l) => l.enabled);
    if (enabled.length === 0) return "# No active particle layers\n";

    root.frequency = frequency || 20;

    for (let idx = 0; idx < enabled.length; idx++) {
      const p = "l" + idx + "_";
      const layerObj = this.compileLayer(enabled[idx], p);
      const keys = Object.keys(layerObj);
      for (let k = 0; k < keys.length; k++) {
        root[keys[k]] = layerObj[keys[k]];
      }
    }

    if (typeof jsyaml !== "undefined" && jsyaml.dump) {
      return jsyaml.dump(root, { indent: 2, lineWidth: -1 });
    }

    return this.toYaml(root);
  },

  toYaml(json: Record<string, any>, margin = ""): string {
    let res = "";
    Object.keys(json).forEach((key) => {
      const val = json[key];
      if (typeof val === "string") {
        res += margin + key + ": '" + val + "'\n";
      } else if (typeof val === "number" || typeof val === "boolean") {
        res += margin + key + ": " + val + "\n";
      } else {
        const empty = Object.keys(val).length === 0;
        res += margin + key + ":" + (empty ? " []" : "") + "\n";
        if (!empty) {
          res += this.toYaml(val, margin + "  ");
        }
      }
    });
    return res;
  },
};
