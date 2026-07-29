import * as THREE from 'three';
import { Utils } from './utils';

import blocksRegistry from '~/lib/blocks.json';

interface AnimatedTexture {
  texture: THREE.Texture;
  numFrames: number;
  framerate: number;
}

export class Viewport {
  canvas!: HTMLCanvasElement;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;
  portalGroup!: THREE.Group;

  textureLoader = new THREE.TextureLoader();
  textureCache: Record<string, THREE.Texture> = {};
  animatedTextures: AnimatedTexture[] = [];
  clock = new THREE.Clock();

  width = 0;
  height = 0;

  portalWidth = 4;
  portalHeight = 5;
  frameMat = 'stone';
  insideMat = 'nether_portal';
  lighterMat = 'flint_and_steel';

  isDragging = false;
  lastMouseX = 0;
  lastMouseY = 0;
  cameraAngleY = 0.4;
  cameraAngleX = 0.3;
  cameraDistance = 12;

  animId: number | null = null;
  resizeObserver: ResizeObserver | null = null;

  constructor(canvasEl?: HTMLCanvasElement | null) {
    if (!canvasEl) return;
    this.canvas = canvasEl;

    // 1. Scene setup
    this.scene = new THREE.Scene();

    // 2. Camera setup
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvasEl,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // 4. Lighting setup (matching birdThreeJS / banner generator)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(5, 10, 7);
    this.scene.add(directionalLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
    this.scene.add(hemisphereLight);

    // 5. Portal Parent Group
    this.portalGroup = new THREE.Group();
    this.scene.add(this.portalGroup);

    // 6. Interaction Event Listeners
    canvasEl.addEventListener('pointerdown', (e: MouseEvent) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('pointermove', (e: MouseEvent) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.cameraAngleY -= dx * 0.008;
      this.cameraAngleX = Utils.clamp(
        this.cameraAngleX + dy * 0.008,
        -1.3,
        1.3
      );
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this._updateCameraPosition();
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });

    canvasEl.addEventListener(
      'wheel',
      (e: WheelEvent) => {
        e.preventDefault();
        this.cameraDistance = Utils.clamp(
          this.cameraDistance + e.deltaY * 0.01,
          4,
          40
        );
        this._updateCameraPosition();
      },
      { passive: false }
    );

    const parent = canvasEl.parentElement;
    if (parent) {
      this.resizeObserver = new ResizeObserver(() => {
        this.resize();
      });
      this.resizeObserver.observe(parent);
    }

    this.resize();
    this._updateCameraPosition();
  }

  _updateCameraPosition(): void {
    if (!this.camera) return;
    const radius = this.cameraDistance;
    const x =
      radius * Math.sin(this.cameraAngleY) * Math.cos(this.cameraAngleX);
    const y = radius * Math.sin(this.cameraAngleX);
    const z =
      radius * Math.cos(this.cameraAngleY) * Math.cos(this.cameraAngleX);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  _resolveTextureName(name: string): string {
    const cleanName = name.toLowerCase().trim().replace(/^minecraft:/, '');
    const registryMatch = (blocksRegistry as any[]).find(
      (b) =>
        b.key.toLowerCase() === cleanName ||
        b.icon.toLowerCase() === cleanName ||
        b.id.toLowerCase() === 'minecraft:' + cleanName ||
        b.id.toLowerCase() === cleanName
    );
    if (registryMatch && registryMatch.icon) {
      return registryMatch.icon;
    }
    return cleanName;
  }

  _getTexture(name: string, folder = 'blocks'): THREE.Texture {
    const resolvedName = this._resolveTextureName(name);
    const key = folder + '/' + resolvedName;
    if (this.textureCache[key]) {
      const tex = this.textureCache[key];
      this._registerAnimatedTextureIfNeeded(tex);
      return tex;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const base = (window as any).TEXTURE_BASE || '/editor/portal/Images/';

    const cleanName = name.toLowerCase().trim().replace(/^minecraft:/, '');
    const candidates = [
      resolvedName,
      cleanName,
      cleanName + '_side',
      cleanName + '_top',
      cleanName + '_front',
      cleanName + '_block',
      cleanName + '_0',
      cleanName + '_stage0',
    ];

    const uniqueCandidates = [...new Set(candidates)];

    const texture = new THREE.Texture();
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;

    let candidateIndex = 0;

    const tryNextCandidate = () => {
      if (candidateIndex >= uniqueCandidates.length) {
        console.warn(`[Viewport] Could not load texture for block '${name}'`);
        return;
      }
      const candidate = uniqueCandidates[candidateIndex++];
      const url = base + folder + '/' + candidate + '.png';

      const img = new Image();
      img.onload = () => {
        texture.image = img;
        texture.needsUpdate = true;
        this._registerAnimatedTextureIfNeeded(texture);
        if (this.renderer && this.scene && this.camera) {
          this.renderer.render(this.scene, this.camera);
        }
      };
      img.onerror = () => {
        tryNextCandidate();
      };
      img.src = url;
    };

    tryNextCandidate();

    this.textureCache[key] = texture;
    return texture;
  }

  _registerAnimatedTextureIfNeeded(tex: THREE.Texture): void {
    const img = tex.image as HTMLImageElement | undefined;
    if (img && img.height > img.width && img.height % img.width === 0) {
      const numFrames = img.height / img.width;
      if (numFrames > 1) {
        tex.repeat.set(1, 1 / numFrames);
        tex.offset.y = (numFrames - 1) / numFrames;

        if (!this.animatedTextures.some((a) => a.texture === tex)) {
          this.animatedTextures.push({
            texture: tex,
            numFrames,
            framerate: 15,
          });
        }
      }
    }
  }

  setDimensions(pw: number, ph: number): void {
    this.portalWidth = pw > 0 ? pw : 4;
    this.portalHeight = ph > 0 ? ph : 5;
    this._buildPortal();
  }

  setMaterials(frame?: string, inside?: string, lighter?: string): void {
    if (frame) this.frameMat = frame.toLowerCase();
    if (inside) this.insideMat = inside.toLowerCase();
    if (lighter) this.lighterMat = lighter.toLowerCase();
    this._buildPortal();
  }

  _buildPortal(): void {
    if (!this.portalGroup) return;

    this.animatedTextures = [];

    // Dispose old mesh geometries & materials to avoid memory leaks
    while (this.portalGroup.children.length > 0) {
      const child = this.portalGroup.children[0] as THREE.Mesh;
      if (child.geometry) child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose());
      } else if (child.material) {
        child.material.dispose();
      }
      this.portalGroup.remove(child);
    }

    const pw = this.portalWidth;
    const ph = this.portalHeight;
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);

    const frameTex = this._getTexture(this.frameMat, 'blocks');
    const insideTex = this._getTexture(this.insideMat, 'blocks');

    const frameMaterial = new THREE.MeshStandardMaterial({
      map: frameTex,
      roughness: 0.6,
      metalness: 0.1,
      side: THREE.FrontSide,
    });

    const insideMaterial = new THREE.MeshStandardMaterial({
      map: insideTex,
      roughness: 0.2,
      transparent: true,
      opacity: 0.85,
      side: THREE.FrontSide,
      depthWrite: false,
      alphaTest: 0.05,
    });

    const invisibleMaterial = new THREE.MeshBasicMaterial({
      visible: false,
    });

    const isFrameBlock = (x: number, y: number) =>
      x === 0 || x === pw - 1 || y === 0 || y === ph - 1;

    for (let x = 0; x < pw; x++) {
      for (let y = 0; y < ph; y++) {
        const isFrame = isFrameBlock(x, y);

        let materials: THREE.Material[];

        if (isFrame) {
          // Cull internal faces between adjacent frame blocks
          const hasFrameRight = x + 1 < pw && isFrameBlock(x + 1, y);
          const hasFrameLeft = x - 1 >= 0 && isFrameBlock(x - 1, y);
          const hasFrameTop = y + 1 < ph && isFrameBlock(x, y + 1);
          const hasFrameBottom = y - 1 >= 0 && isFrameBlock(x, y - 1);

          materials = [
            hasFrameRight ? invisibleMaterial : frameMaterial, // +X
            hasFrameLeft ? invisibleMaterial : frameMaterial, // -X
            hasFrameTop ? invisibleMaterial : frameMaterial, // +Y
            hasFrameBottom ? invisibleMaterial : frameMaterial, // -Y
            frameMaterial, // +Z (Front)
            frameMaterial, // -Z (Back)
          ];
        } else {
          // Inside portal block: cull all 4 internal side faces, only render Front (+Z) & Back (-Z)
          materials = [
            invisibleMaterial, // +X
            invisibleMaterial, // -X
            invisibleMaterial, // +Y
            invisibleMaterial, // -Y
            insideMaterial, // +Z (Front)
            insideMaterial, // -Z (Back)
          ];
        }

        const mesh = new THREE.Mesh(boxGeo, materials);
        mesh.position.set(x - pw / 2 + 0.5, y - ph / 2 + 0.5, 0);
        this.portalGroup.add(mesh);
      }
    }
  }

  resize(): void {
    if (!this.canvas || !this.renderer || !this.camera) return;
    const container = this.canvas.parentElement;
    if (!container) return;

    this.width = container.clientWidth;
    this.height = container.clientHeight;

    this.camera.aspect = this.width / (this.height || 1);
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height, false);
  }

  resetCamera(): void {
    this.cameraAngleY = 0.4;
    this.cameraAngleX = 0.3;
    this.cameraDistance = 12;
    this._updateCameraPosition();
  }

  render(): void {
    if (!this.renderer || !this.scene || !this.camera) return;

    if (this.animatedTextures.length > 0) {
      const time = this.clock.getElapsedTime();
      for (const anim of this.animatedTextures) {
        const currentFrame =
          Math.floor(time * anim.framerate) % anim.numFrames;
        anim.texture.offset.y =
          (anim.numFrames - 1 - currentFrame) / anim.numFrames;
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.animId = requestAnimationFrame(() => this.render());
  }

  start(): void {
    if (!this.canvas) return;
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
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  captureImage(): string {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
      return this.renderer.domElement.toDataURL('image/png');
    }
    return '';
  }
}
