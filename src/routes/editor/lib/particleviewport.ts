import type { LayerData } from "./types";
import { Shapes } from "./shapes";

declare global {
  interface Window {
    THREE: any;
  }
}

export class ThreeView {
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
      const shapeType = layer.shape ? layer.shape.type : "ring";
      const shapeFn =
        Shapes[shapeType as keyof typeof Shapes] ||
        ((params: any, pw: number, ph: number, t: number) => Shapes.ring(params, pw, ph, t));
      const params = layer.shape ? layer.shape.params || {} : {};
      const particle = layer.particle || {
        type: "REDSTONE",
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
        "position",
        new THREE.BufferAttribute(positions, 3)
      );

      const c = particle.color || { r: 255, g: 255, b: 255 };
      const hexColor = (c.r << 16) | (c.g << 8) | c.b;

      let size = (particle.size || 1) * 0.12;
      if (particle.type === "FLAME") size *= 1.5;

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
    if (!this.renderer) return "";
    this.renderer.render(this.scene, this.camera);
    return this.canvas.toDataURL("image/png");
  }
}
