import { Utils } from "./utils";

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

export class Viewport {
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
  frameMat = "stone";
  insideMat = "nether_portal";
  lighterMat = "flint_and_steel";

  constructor(canvasEl: HTMLCanvasElement) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext("2d")!;

    canvasEl.addEventListener("mousedown", (e: MouseEvent) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });
    canvasEl.addEventListener("mousemove", (e: MouseEvent) => {
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
    canvasEl.addEventListener("mouseup", () => {
      this.isDragging = false;
    });
    canvasEl.addEventListener("mouseleave", () => {
      this.isDragging = false;
    });
    canvasEl.addEventListener(
      "wheel",
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
    this.canvas.style.width = this.width + "px";
    this.canvas.style.height = this.height + "px";
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
    const key = folder + "/" + name;
    if (this.textures[key]) return this.textures[key];
    const img = new Image();
    const base = window.TEXTURE_BASE || "/editor/portal/Images/";
    img.src = base + folder + "/" + name + ".png";
    this.textures[key] = img;
    return img;
  }

  setMaterials(frame?: string, inside?: string, lighter?: string): void {
    this.frameMat = (frame || "stone").toLowerCase();
    this.insideMat = (inside || "nether_portal").toLowerCase();
    this.lighterMat = (lighter || "flint_and_steel").toLowerCase();
    this._buildPortal();
  }

  _buildPortal(): void {
    this.cubes = [];
    const pw = 4;
    const ph = 5;
    const frameFolder = "blocks";
    const insideFolder = "frames";

    const frameTex = this._getTexture(this.frameMat, frameFolder);
    if (!this.textures["blocks/" + this.frameMat]) {
      this._getTexture(this.frameMat, "frames");
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
      ctx.fillStyle = "#000";
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
      ctx.fillStyle = "rgb(" + bv + "," + bv + "," + bv + ")";
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
    return this.canvas.toDataURL("image/png");
  }
}
