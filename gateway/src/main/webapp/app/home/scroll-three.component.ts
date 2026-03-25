import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// ─── Scroll geometry ──────────────────────────────────────────────────────────
const SW         = 1.5;    // paper width (world units)
const SH         = 2.05;   // paper height when fully open
const RR         = 0.046;  // roller shaft radius
const HANDLE_EXT = 0.22;   // cornua protrusion beyond paper edge
const HANDLE_RK  = 0.108;  // cornua disc outer radius (≈ RR × 2.35)
const PT         = 0.0022; // paper thickness per Archimedean spiral layer
const TOP_Y      = SH / 2; // top roller Y in local scroll-group space (= 1.025)

// ─── Camera ───────────────────────────────────────────────────────────────────
const CAM_FOV    = 40;
const CAM_Z_REST = 4.4;
const CAM_Z_OPEN = 5.2;

// ─── Scroll resting tilt ─────────────────────────────────────────────────────
const ROT_X =  5;    // degrees — gentle top-lean
const ROT_Y = -15;   // degrees — enough depth to see rollers, not too oblique

// ─── Bloom — Dragon Scroll golden halo when open ──────────────────────────────
const BLOOM_STRENGTH  = 0.14;
const BLOOM_RADIUS    = 0.18;
const BLOOM_THRESHOLD = 0.82;

// ─── Vellum texture canvas size ───────────────────────────────────────────────
const TEX_W     = 512;
const TEX_H     = 768;
const TEX_SCALE = 2;   // HDPI 2× for sharp text

interface Spring { value: number; velocity: number; }

interface GlyphParticle {
  mesh: THREE.Sprite;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

/**
 * Three.js WebGL philosophical scroll.
 *
 * Geometry: PlaneGeometry(SW, SH, 4, 160) deformed each frame via an
 * Archimedean spiral — flat above the bottom roller, coiled below it.
 * The scroll unrolls from the top; bottom roller springs downward on open.
 * scrollGroup.position.y compensates so the visual centre stays at world Y=0.
 *
 * Interaction:
 *  - Mouse enters scene → scroll opens automatically.
 *  - Mouse leaves       → scroll closes.
 *  - Click when open    → close, swap vellum texture, reopen with next page.
 *  - Touch devices      → scroll opens once on component init (no hover).
 *
 * Public API is identical to the old BookThreeComponent so HomeComponent
 * requires no structural changes.
 */
@Component({
  selector: 'jhi-scroll-three',
  standalone: true,
  imports: [],
  template: `<div #canvas style="width:100%;height:100%;"></div>`,
  styles: [`:host { display: block; width: 100%; height: 100%; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrollThreeComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLDivElement>;

  @Input() maxPages = 5;
  @Output() bookOpenChange = new EventEmitter<boolean>();
  @Output() pageChange     = new EventEmitter<number>();

  /** Read by HomeComponent to sync progress dots. */
  currentPage = 0;

  // ── Three.js core ────────────────────────────────────────────────────────
  private renderer!: THREE.WebGLRenderer;
  private scene!:    THREE.Scene;
  private camera!:   THREE.PerspectiveCamera;
  private composer!: EffectComposer;
  private bloomPass!: UnrealBloomPass;
  private rafId    = 0;
  private lastTime = 0;

  // ── Scene objects ────────────────────────────────────────────────────────
  private scrollGroup!:   THREE.Group;
  private paperMesh!:     THREE.Mesh;
  private paperGeo!:      THREE.BufferGeometry;
  private paperBaseX!:    Float32Array;
  private paperBaseY!:    Float32Array;
  private topRollerMesh!: THREE.Mesh;
  private botRollerMesh!: THREE.Mesh;
  private rollerGeo!:     THREE.BufferGeometry;
  private rollerMat!:     THREE.MeshStandardMaterial;
  private keyLight!:      THREE.DirectionalLight;
  private accentLight!:   THREE.PointLight;
  private innerLight!:    THREE.PointLight;

  // ── Glyph particle system ────────────────────────────────────────────────
  private particles:         GlyphParticle[] = [];
  private particleSpawnTimer = 0;
  private glyphTextures:     THREE.CanvasTexture[] = [];

  // ── Spring physics ───────────────────────────────────────────────────────
  private tiltX: Spring = { value: 0, velocity: 0 };
  private tiltY: Spring = { value: 0, velocity: 0 };
  private posX:  Spring = { value: 0, velocity: 0 };
  private posY:  Spring = { value: 0, velocity: 0 };
  private camX:  Spring = { value: 0, velocity: 0 };
  private camY:  Spring = { value: 0, velocity: 0 };
  private camZ:  Spring = { value: CAM_Z_REST, velocity: 0 };
  private openSpr: Spring = { value: 0, velocity: 0 };
  private glowSpr: Spring = { value: 0, velocity: 0 };

  // ── Mouse / tilt targets ─────────────────────────────────────────────────
  private targetTiltX  = 0;
  private targetTiltY  = 0;
  private targetPosX   = 0;
  private targetPosY   = 0;
  private targetCamX   = 0;
  private targetCamY   = 0;
  private targetCamZ   = CAM_Z_REST;
  private lightX       = 1.5;
  private lightY       = 2.5;
  private targetLightX = 1.5;
  private targetLightY = 2.5;

  // ── State machine ────────────────────────────────────────────────────────
  private isOpen              = false;
  private openTarget          = 0;
  private pageTransitionPhase: 'idle' | 'closing' | 'reopening' = 'idle';
  private pendingPage         = 0;
  private pendingFinalClose   = false;
  private lastInteractionTime = 0;
  private autoRotatePhase     = 0;
  private reopenCooldownTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Deformation guard — skips deformPaper when openSpr barely changed ───
  private lastDeformed = -1;

  // ── Touch device detection (cached at init) ─────────────────────────────
  private isTouchDevice = false;

  // ── Portrait / mobile camera adjustment ─────────────────────────────────
  private portraitBaseZ = CAM_Z_REST;

  // ── Cleanup refs ─────────────────────────────────────────────────────────
  private globalMoveRef:      ((e: MouseEvent) => void) | null = null;
  private contextLostRef:     ((e: Event) => void) | null      = null;
  private contextRestoredRef: (() => void) | null              = null;
  private resizeObs!: ResizeObserver;
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    this.ngZone.runOutsideAngular(() => this.init());
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.rafId);
    if (this.resizeTimer)         clearTimeout(this.resizeTimer);
    if (this.reopenCooldownTimer) clearTimeout(this.reopenCooldownTimer);
    this.resizeObs?.disconnect();
    if (this.contextLostRef)
      this.renderer?.domElement.removeEventListener('webglcontextlost',    this.contextLostRef);
    if (this.contextRestoredRef)
      this.renderer?.domElement.removeEventListener('webglcontextrestored', this.contextRestoredRef);
    this.composer?.dispose();
    this.renderer?.dispose();
    // removeEventListener on a non-registered listener is a safe no-op
    if (this.globalMoveRef) document.removeEventListener('mousemove', this.globalMoveRef);
    for (const p of this.particles) {
      this.scene?.remove(p.mesh);
      (p.mesh.material as THREE.SpriteMaterial).dispose();
    }
    this.glyphTextures.forEach(t => t.dispose());

    // Dispose paper mesh resources
    const paperMat = this.paperMesh?.material as THREE.MeshStandardMaterial | undefined;
    paperMat?.map?.dispose();
    paperMat?.normalMap?.dispose();
    paperMat?.dispose();
    this.paperGeo?.dispose();

    // Dispose roller resources (both meshes share the same geometry and material)
    this.rollerMat?.map?.dispose();
    this.rollerMat?.dispose();
    this.rollerGeo?.dispose();

    // Reset glow spring (plain object, no resources to dispose)
    this.glowSpr.value = 0;
    this.glowSpr.velocity = 0;
  }

  // ─── Public API (identical to old BookThreeComponent) ─────────────────────

  /** Hover enter — open the scroll automatically on desktop. */
  onMouseEnter(): void {
    this.lastInteractionTime = performance.now();
    if (!this.isOpen && this.pageTransitionPhase === 'idle') {
      this.openBook();
    }
  }

  /** Hover leave — close the scroll. */
  onMouseLeave(): void {
    this.targetTiltX  = 0; this.targetTiltY  = 0;
    this.targetPosX   = 0; this.targetPosY   = 0;
    this.targetCamX   = 0; this.targetCamY   = 0;
    this.targetLightX = 1.5; this.targetLightY = 2.5;
    if (this.isOpen) {
      this.isOpen              = false;
      this.openTarget          = 0;
      this.targetCamZ          = CAM_Z_REST;
      this.pageTransitionPhase = 'idle';
      this.ngZone.run(() => this.bookOpenChange.emit(false));
    }
  }

  /** Not used for scroll (no page-peek), kept for API compatibility. */
  onMouseMove(_nx: number, _ny: number, _mx01: number): void { /* noop */ }

  openBook(): void {
    if (!this.isOpen) {
      this.isOpen     = true;
      this.openTarget = 1;
      this.targetCamZ = CAM_Z_OPEN;
      this.lastInteractionTime = performance.now();
      this.ngZone.run(() => this.bookOpenChange.emit(true));
    }
  }

  /** Click when open → close, update texture to next page, reopen. */
  nextPage(): boolean {
    if (!this.isOpen || this.pageTransitionPhase !== 'idle') return false;
    const nextP  = this.currentPage + 1;
    if (nextP > this.maxPages) return false;

    const isLast             = nextP >= this.maxPages;
    this.pendingPage         = isLast ? 0 : nextP;
    this.pendingFinalClose   = isLast;
    this.pageTransitionPhase = 'closing';
    this.openTarget          = 0;
    this.targetCamZ          = CAM_Z_REST;
    this.ngZone.run(() => this.bookOpenChange.emit(false));
    return true;
  }

  prevPage(): boolean {
    if (!this.isOpen || this.pageTransitionPhase !== 'idle') return false;
    if (this.currentPage <= 0) return false;

    this.pendingPage         = this.currentPage - 1;
    this.pendingFinalClose   = false;
    this.pageTransitionPhase = 'closing';
    this.openTarget          = 0;
    this.targetCamZ          = CAM_Z_REST;
    this.ngZone.run(() => this.bookOpenChange.emit(false));
    return true;
  }

  setAccentColor(hexColor: number): void {
    if (this.accentLight) this.accentLight.color.setHex(hexColor);
  }

  // ─── Three.js initialisation ─────────────────────────────────────────────

  private init(): void {
    const el  = this.canvasRef.nativeElement;
    const w   = el.clientWidth  || 300;
    const h   = el.clientHeight || 400;
    const dpr = Math.min(window.devicePixelRatio, 2);

    // Cache touch device detection
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Portrait orientation (mobile): pull camera back slightly so full scroll fits
    const isPortrait = h > w;
    if (isPortrait) {
      this.portraitBaseZ = CAM_Z_REST * 1.18;
      this.targetCamZ = this.portraitBaseZ;
      this.camZ.value = this.portraitBaseZ;
    } else {
      this.portraitBaseZ = CAM_Z_REST;
    }

    // Renderer — transparent canvas so page background shows through
    this.renderer = new THREE.WebGLRenderer({
      alpha: true, antialias: false, powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h);
    this.renderer.outputColorSpace    = THREE.SRGBColorSpace;
    this.renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.80;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    el.appendChild(this.renderer.domElement);

    // WebGL context loss/restore — required on iOS Safari
    this.contextLostRef = (e: Event): void => {
      e.preventDefault();
      cancelAnimationFrame(this.rafId);
    };
    this.contextRestoredRef = (): void => {
      this.lastTime = performance.now();
      const tick = (now: number): void => {
        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;
        this.update(dt, now);
        this.composer.render();
        this.rafId = requestAnimationFrame(tick);
      };
      this.rafId = requestAnimationFrame(tick);
    };
    this.renderer.domElement.addEventListener('webglcontextlost',     this.contextLostRef);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.contextRestoredRef);

    // Scene + camera
    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(CAM_FOV, w / h, 0.1, 100);
    this.camera.position.set(0, 0, this.camZ.value);
    this.camera.lookAt(0, 0, 0);

    // IBL — RoomEnvironment PMREM
    const pmrem   = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    this.scene.environment = pmrem.fromScene(roomEnv).texture;
    roomEnv.dispose();
    pmrem.dispose();

    // Lighting — soft candlelight / library lamp aesthetic, no harsh direct sources
    this.scene.add(new THREE.AmbientLight(0x1c150c, 1.2));

    // Warm key light from upper-right-front
    this.keyLight = new THREE.DirectionalLight(0xfff0d8, 0.95);
    this.keyLight.position.set(1.5, 2.5, 3.5);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(512, 512);
    this.keyLight.shadow.bias      = -0.002;
    this.keyLight.shadow.intensity = 0.30;
    this.scene.add(this.keyLight);

    // Gentle fill from left — bounced candlelight off a wall
    const fill = new THREE.DirectionalLight(0xd4a870, 0.28);
    fill.position.set(-2.5, 0.5, -1.0);
    this.scene.add(fill);

    // Subtle warm rim from above — simulates an overhead lamp
    const rim = new THREE.PointLight(0xffd8a0, 0.45, 9, 2);
    rim.position.set(0.5, 2.8, 2.0);
    this.scene.add(rim);

    // Accent light — colour updated by HomeComponent.setTheme()
    this.accentLight = new THREE.PointLight(0xc8a050, 0.22, 10);
    this.accentLight.position.set(-1.8, 1, 2);
    this.scene.add(this.accentLight);

    // Inner glow light — Dragon Scroll inner radiance, warm golden-amber
    this.innerLight = new THREE.PointLight(0xffd060, 0, 6);
    this.innerLight.position.set(0, 0, 0.3);

    // Scroll geometry and materials
    this.scrollGroup = new THREE.Group();
    this.scrollGroup.rotation.x = THREE.MathUtils.degToRad(ROT_X);
    this.scrollGroup.rotation.y = THREE.MathUtils.degToRad(ROT_Y);
    this.scene.add(this.scrollGroup);
    this.scrollGroup.add(this.innerLight);
    this.buildScroll();
    this.buildGlyphTextures();

    // EffectComposer: RenderPass → UnrealBloom (subtle) → SMAA → OutputPass
    const rtParams = new THREE.WebGLRenderTarget(w * dpr, h * dpr, {
      type: THREE.HalfFloatType, format: THREE.RGBAFormat,
    });
    this.composer = new EffectComposer(this.renderer, rtParams);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(w, h), BLOOM_STRENGTH, BLOOM_RADIUS, BLOOM_THRESHOLD,
    );
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new SMAAPass());
    this.composer.addPass(new OutputPass());

    // Global mouse — drives tilt and key-light parallax.
    // Skip on touch devices to avoid wasting memory and ghost movement.
    this.globalMoveRef = (e: MouseEvent): void => {
      const nx =  (e.clientX / window.innerWidth)  * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      this.targetTiltX  = ny * 14;
      this.targetTiltY  = nx * 22;
      this.targetPosX   = nx * 0.12;
      this.targetPosY   = ny * 0.08;
      this.targetCamX   = nx * 0.03;
      this.targetCamY   = ny * 0.025;
      this.targetLightX = nx * 2.2 + 1.5;
      this.targetLightY = ny * 1.8 + 2.5;
      this.lastInteractionTime = performance.now();
    };
    if (!this.isTouchDevice) {
      document.addEventListener('mousemove', this.globalMoveRef, { passive: true } as AddEventListenerOptions);
    }

    // ResizeObserver — 120ms debounce prevents iOS viewport-chrome storm
    this.resizeObs = new ResizeObserver(() => {
      if (this.resizeTimer) clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        this.resizeTimer = null;
        const w2   = el.clientWidth  || 300;
        const h2   = el.clientHeight || 400;
        const dpr2 = Math.min(window.devicePixelRatio, 2);
        this.renderer.setSize(w2, h2);
        this.renderer.setPixelRatio(dpr2);
        this.camera.aspect = w2 / h2;
        this.camera.updateProjectionMatrix();
        this.composer.setSize(w2, h2);
        this.bloomPass.resolution.set(w2, h2);

        // Re-detect portrait orientation and adjust camera distance
        const isPortrait2 = h2 > w2;
        const baseZ = isPortrait2 ? CAM_Z_REST * 1.18 : CAM_Z_REST;
        this.portraitBaseZ = baseZ;
        if (!this.isOpen) { this.targetCamZ = baseZ; this.camZ.value = baseZ; }
      }, 120);
    });
    this.resizeObs.observe(el);

    // RAF loop
    this.lastTime = performance.now();
    const tick = (now: number): void => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;
      this.update(dt, now);
      this.composer.render();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);

    // Touch devices have no hover — open the scroll automatically on load
    if (this.isTouchDevice) {
      setTimeout(() => this.ngZone.run(() => this.openBook()), 700);
    }
  }

  // ─── Build scroll geometry + materials ────────────────────────────────────

  private buildScroll(): void {
    const vellumTex = this.buildVellumTexture(0);
    vellumTex.colorSpace  = THREE.SRGBColorSpace;
    vellumTex.needsUpdate = true;

    const vellumMat = new THREE.MeshStandardMaterial({
      map:             vellumTex,
      normalMap:       this.buildVellumNormalMap(),
      normalScale:     new THREE.Vector2(0.14, 0.14),
      roughness:       0.92,
      metalness:       0.0,
      side:            THREE.DoubleSide,
      envMapIntensity: 0.12,
    });

    this.paperGeo = new THREE.PlaneGeometry(SW, SH, 4, 160);

    const pos = this.paperGeo.attributes['position'] as THREE.BufferAttribute;
    this.paperBaseX = new Float32Array(pos.count);
    this.paperBaseY = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      this.paperBaseX[i] = pos.getX(i);
      this.paperBaseY[i] = pos.getY(i);
    }

    this.paperMesh = new THREE.Mesh(this.paperGeo, vellumMat);
    this.paperMesh.castShadow    = true;
    this.paperMesh.receiveShadow = true;
    this.scrollGroup.add(this.paperMesh);

    // Rollers — turned olive-wood shaft with Greek cornua disc handles
    const rollerTex = this.buildRollerTexture();
    rollerTex.colorSpace  = THREE.SRGBColorSpace;
    rollerTex.needsUpdate = true;

    this.rollerMat = new THREE.MeshStandardMaterial({
      map:             rollerTex,
      roughness:       0.55,
      metalness:       0.02,
      envMapIntensity: 0.90,
    });
    this.rollerGeo = this.buildRollerGeometry();

    this.topRollerMesh = new THREE.Mesh(this.rollerGeo, this.rollerMat);
    this.topRollerMesh.rotation.z = Math.PI / 2;
    this.topRollerMesh.position.set(0, TOP_Y, 0.002);
    this.topRollerMesh.castShadow = true;
    this.scrollGroup.add(this.topRollerMesh);

    this.botRollerMesh = new THREE.Mesh(this.rollerGeo, this.rollerMat);
    this.botRollerMesh.rotation.z = Math.PI / 2;
    this.botRollerMesh.position.set(0, TOP_Y, 0.002);
    this.botRollerMesh.castShadow = true;
    this.scrollGroup.add(this.botRollerMesh);

    this.deformPaper(0);
  }

  // ─── Greek cornua roller geometry (LatheGeometry) ────────────────────────
  //
  //  Profile (cross-section from bottom end to top end along the Y-axis):
  //   - Flat outer face of the bottom cornua disc
  //   - Curved outer rim  (max radius = HANDLE_RK)
  //   - Concave inner face (the "waist" that makes the disc read as a real disc)
  //   - Short neck transition into the shaft
  //   - Cylindrical shaft across the paper width (radius = RR)
  //   - Mirror neck, concave face, rim, and flat face for the top end
  //
  //  Tip radius uses a small non-zero value (0.008) so LatheGeometry creates
  //  a small polygon cap at each end rather than a degenerate point.
  //
  private buildRollerGeometry(): THREE.BufferGeometry {
    const hp  = SW / 2;        // half-paper — where shaft meets the cornua
    const ext = HANDLE_EXT;    // protrusion beyond paper
    const RK  = HANDLE_RK;     // outer disc radius

    const pts: THREE.Vector2[] = [
      // Bottom cornua face (y = -(hp + ext) outward)
      new THREE.Vector2(0.008,         -(hp + ext)),            // small cap polygon (not degenerate point)
      new THREE.Vector2(RK,            -(hp + ext - 0.010)),    // outer rim crest
      new THREE.Vector2(RK * 0.80,     -(hp + ext - 0.060)),   // concave inner face
      new THREE.Vector2(RR * 1.14,     -(hp + 0.018)),         // neck / waist
      // Shaft
      new THREE.Vector2(RR,            -(hp - 0.004)),
      new THREE.Vector2(RR,             (hp - 0.004)),
      // Top cornua (mirror)
      new THREE.Vector2(RR * 1.14,      (hp + 0.018)),
      new THREE.Vector2(RK * 0.80,      (hp + ext - 0.060)),
      new THREE.Vector2(RK,             (hp + ext - 0.010)),
      new THREE.Vector2(0.008,          (hp + ext)),            // small cap polygon (not degenerate point)
    ];

    return new THREE.LatheGeometry(pts, 32);
  }

  // ─── Per-frame spring update ──────────────────────────────────────────────

  private update(dt: number, now: number): void {
    // Semi-implicit Euler spring integrator.
    const spr = (s: Spring, target: number, k: number, d: number): void => {
      const F  = -k * (s.value - target) - 2 * d * Math.sqrt(k) * s.velocity;
      s.velocity += F * dt;
      s.value    += s.velocity * dt;
      if (Math.abs(s.value - target) < 1e-5 && Math.abs(s.velocity) < 1e-5) {
        s.value = target; s.velocity = 0;
      }
    };

    spr(this.tiltX, this.targetTiltX, 28, 0.82);
    spr(this.tiltY, this.targetTiltY, 28, 0.82);
    spr(this.posX,  this.targetPosX,  18, 0.80);
    spr(this.posY,  this.targetPosY,  18, 0.80);
    spr(this.camX,  this.targetCamX,  12, 0.78);
    spr(this.camY,  this.targetCamY,  12, 0.78);
    spr(this.camZ,  this.targetCamZ,  14, 0.85);

    // Scroll open spring:
    //   Opening  k=3.8 ζ=0.72 → slightly longer, more fluid open with gentle overshoot
    //   Closing  k=9.0 ζ=0.90 → snappier reroll
    const openK = this.openTarget === 1 ? 3.8 : 9.0;
    const openD = this.openTarget === 1 ? 0.72 : 0.90;
    spr(this.openSpr, this.openTarget, openK, openD);

    // Inner glow spring — follows open state
    spr(this.glowSpr, this.isOpen ? 1 : 0, 6, 0.75);
    if (this.innerLight) {
      this.innerLight.intensity = this.glowSpr.value * 1.4;
    }

    // Page transition state machine
    if (this.pageTransitionPhase === 'closing') {
      // Wait until scroll is almost fully closed before swapping content
      if (this.openSpr.value < 0.08 && this.reopenCooldownTimer === null) {
        this.currentPage = this.pendingPage;
        this.ngZone.run(() => this.pageChange.emit(this.currentPage));
        this.updateVellumTexture();

        if (this.pendingFinalClose) {
          this.isOpen              = false;
          this.pageTransitionPhase = 'idle';
          this.pendingFinalClose   = false;
          this.ngZone.run(() => { this.bookOpenChange.emit(false); this.pageChange.emit(0); });
        } else {
          this.pageTransitionPhase = 'reopening';
          // Brief pause so the viewer sees the closed coil before the new page unrolls
          this.reopenCooldownTimer = setTimeout(() => {
            this.reopenCooldownTimer = null;
            this.openTarget = 1;
            this.targetCamZ = CAM_Z_OPEN;
            this.ngZone.run(() => this.bookOpenChange.emit(true));
          }, 200);
        }
      }
    } else if (this.pageTransitionPhase === 'reopening') {
      if (this.openSpr.value > 0.90 && this.reopenCooldownTimer === null) {
        this.pageTransitionPhase = 'idle';
      }
    }

    // Apply springs to scene transforms
    const baseRotX = THREE.MathUtils.degToRad(ROT_X);
    const baseRotY = THREE.MathUtils.degToRad(ROT_Y);

    // Idle auto-rotation (kicks in after 3 s of inactivity)
    const idleMs = now - this.lastInteractionTime;
    if (idleMs > 3000) {
      this.autoRotatePhase += dt * 0.18;
      this.scrollGroup.rotation.y =
        baseRotY + THREE.MathUtils.degToRad(Math.sin(this.autoRotatePhase) * 7 + this.tiltY.value);
    } else {
      this.scrollGroup.rotation.y = baseRotY + THREE.MathUtils.degToRad(this.tiltY.value);
    }
    this.scrollGroup.rotation.x = baseRotX + THREE.MathUtils.degToRad(this.tiltX.value);
    this.scrollGroup.position.x = this.posX.value;

    // Keep scroll visually centred as it opens/closes
    const clampedOpen = Math.max(0, Math.min(1, this.openSpr.value));
    this.scrollGroup.position.y = -SH / 2 * (1 - clampedOpen) + this.posY.value;

    this.camera.position.set(this.camX.value, this.camY.value, this.camZ.value);

    // Key light tracks mouse (direct lerp — fast)
    this.lightX += (this.targetLightX - this.lightX) * 0.10;
    this.lightY += (this.targetLightY - this.lightY) * 0.10;
    this.keyLight.position.set(this.lightX, this.lightY, 3.5);

    // Deformation guard — skip when openSpr barely changed (saves CPU when fully open/closed)
    if (Math.abs(clampedOpen - this.lastDeformed) > 0.0003) {
      this.deformPaper(clampedOpen);
      this.lastDeformed = clampedOpen;
    }

    // Emit glyph particles only while fully open and idle
    if (this.isOpen && clampedOpen > 0.50 && this.pageTransitionPhase === 'idle') {
      this.particleSpawnTimer += dt;
      if (this.particleSpawnTimer > 0.15) {
        this.particleSpawnTimer = 0;
        this.spawnGlyph(clampedOpen);
      }
    }
    this.updateGlyphs(dt);
  }

  // ─── Archimedean spiral deformation ──────────────────────────────────────
  //
  //  t = 0 → top edge (attached to top roller, always flat).
  //  t = 1 → bottom edge (coiled around bottom roller when closed).
  //
  //  Flat section   (t <= openAmt): vy = TOP_Y - t*SH,  vz = 0.
  //  Coiled section (t > openAmt): Archimedean spiral, radius grows by PT per turn.
  //
  private deformPaper(openAmt: number): void {
    const botY = TOP_Y - SH * openAmt;
    const pos  = this.paperGeo.attributes['position'] as THREE.BufferAttribute;

    for (let i = 0; i < pos.count; i++) {
      const bx = this.paperBaseX[i];
      const by = this.paperBaseY[i];
      const t  = Math.max(0, Math.min(1, (TOP_Y - by) / SH));

      let vy: number;
      let vz: number;

      if (t <= openAmt) {
        vy = TOP_Y - t * SH;
        vz = 0;
        // Slight permanent curl at the very top edge (paper wrapping around top roller)
        if (t < 0.065) {
          const frac  = (0.065 - t) / 0.065;
          const alpha = frac * Math.PI * 0.28;
          vy = TOP_Y - RR * Math.sin(alpha);
          vz =  RR * (1 - Math.cos(alpha)) * 0.5;
        }
      } else {
        const coiledLen = (t - openAmt) * SH;
        const angle     = coiledLen / RR;
        const r         = RR + (angle / (2 * Math.PI)) * PT;
        vy = botY - r * Math.sin(angle);
        vz = -r * (1 - Math.cos(angle));
      }

      pos.setXYZ(i, bx, vy, vz);
    }
    pos.needsUpdate = true;
    this.paperGeo.computeVertexNormals();
    this.botRollerMesh.position.y = botY;
  }

  // ─── Glyph particles ─────────────────────────────────────────────────────

  private spawnGlyph(openAmt: number): void {
    if (this.particles.length >= 18) return;
    const tex = this.glyphTextures[Math.floor(Math.random() * this.glyphTextures.length)];
    const mat = new THREE.SpriteMaterial({
      map: tex, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    const scale  = 0.045 + Math.random() * 0.060;
    sprite.scale.set(scale * 1.15, scale * 1.15, 1);
    const flatBottom = TOP_Y - openAmt * SH;
    sprite.position.set(
      (Math.random() - 0.5) * SW * 0.85,
      flatBottom + Math.random() * openAmt * SH,
      0.05 + Math.random() * 0.07,
    );
    this.scene.add(sprite);
    this.particles.push({
      mesh:     sprite,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.22,
        0.18 + Math.random() * 0.32,
        (Math.random() - 0.5) * 0.06,
      ),
      life:    0,
      maxLife: 1.8 + Math.random() * 1.2,
    });
  }

  private updateGlyphs(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      const t = p.life / p.maxLife;
      p.mesh.position.addScaledVector(p.velocity, dt);
      (p.mesh.material as THREE.SpriteMaterial).opacity =
        t < 0.25 ? t / 0.25 : t < 0.70 ? 1 : (1 - t) / 0.30;
      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        (p.mesh.material as THREE.SpriteMaterial).dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  // ─── Swap vellum texture for new page ────────────────────────────────────

  private updateVellumTexture(): void {
    const mat    = this.paperMesh.material as THREE.MeshStandardMaterial;
    const oldTex = mat.map;
    const newTex = this.buildVellumTexture(this.currentPage);
    newTex.colorSpace  = THREE.SRGBColorSpace;
    newTex.needsUpdate = true;
    mat.map          = newTex;
    mat.needsUpdate  = true;
    if (oldTex) setTimeout(() => oldTex.dispose(), 600);
  }

  // ─── Vellum (parchment) texture ───────────────────────────────────────────
  //
  //  Painted on a TEX_W x TEX_H canvas at 2x HDPI for crisp text.
  //
  //  Layers:
  //    1.  Warm golden amber base gradient (Dragon Scroll radiance)
  //    1b. Central radiance — simulates the Dragon Scroll's inner luminosity
  //    2.  Subtle horizontal vellum grain (much softer than papyrus fibres)
  //    3.  Very light vertical cross-fibres
  //    4.  Faint ruled manuscript lines across the text zone
  //    5.  Light age spotting and edge vignette
  //    6.  Roller shadow at top and bottom
  //    7.  Clean double-line classical border with corner diamond ornaments
  //    8.  Red cinnabar rubric header (category label in Greek)
  //    9.  Large Greek letter emblem (centred) with radial glow
  //   10.  Title text — clear, bold, dark sepia
  //   11.  Body text — two lines, legible at display scale
  //   12.  Row of decorative Greek letters at foot of scroll
  //
  private buildVellumTexture(pageIndex: number): THREE.CanvasTexture {
    const W = TEX_W; const H = TEX_H;
    const canvas = document.createElement('canvas');
    canvas.width  = W * TEX_SCALE;
    canvas.height = H * TEX_SCALE;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(TEX_SCALE, TEX_SCALE);

    // 1. Base — richer golden amber gradient (darker edges, brightest upper-center)
    const base = ctx.createLinearGradient(0, 0, W * 0.12, H);
    base.addColorStop(0,    '#b07820');
    base.addColorStop(0.28, '#d09030');
    base.addColorStop(0.48, '#dba040');
    base.addColorStop(0.72, '#c88828');
    base.addColorStop(1,    '#a06010');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);

    // 1b. Central radiance — simulates the Dragon Scroll's inner luminosity
    const radiance = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, H * 0.52);
    radiance.addColorStop(0,   'rgba(255, 245, 190, 0.55)');
    radiance.addColorStop(0.3, 'rgba(240, 200, 100, 0.30)');
    radiance.addColorStop(0.7, 'rgba(180, 120,  40, 0.12)');
    radiance.addColorStop(1,   'rgba(0,   0,    0,  0   )');
    ctx.fillStyle = radiance;
    ctx.fillRect(0, 0, W, H);

    // 2. Strong horizontal papyrus fibres — more pronounced, varied thickness
    for (let y = 0; y < H; y += 1.5 + Math.random() * 3.0) {
      const a = 0.15 + Math.random() * 0.35;
      const isLight = Math.random() > 0.40;
      ctx.strokeStyle = isLight
        ? `rgba(235,195,110,${a.toFixed(3)})`
        : `rgba(70,38,8,${a.toFixed(3)})`;
      ctx.lineWidth = 0.6 + Math.random() * 1.4;
      ctx.beginPath();
      ctx.moveTo(0, y + (Math.random() - 0.5) * 0.4);
      for (let x = 10; x <= W; x += 10) {
        ctx.lineTo(x, y + (Math.random() - 0.5) * 0.8);
      }
      ctx.stroke();
    }

    // 3. Cross-fibres — the vertical layer laminated beneath
    for (let x = 0; x < W; x += 4 + Math.random() * 5) {
      const a = 0.04 + Math.random() * 0.10;
      ctx.strokeStyle = Math.random() > 0.5
        ? `rgba(210,170,80,${a.toFixed(3)})`
        : `rgba(80,45,10,${a.toFixed(3)})`;
      ctx.lineWidth = 0.35 + Math.random() * 0.50;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      for (let yv = 8; yv <= H; yv += 8) {
        ctx.lineTo(x + (Math.random() - 0.5) * 0.5, yv);
      }
      ctx.stroke();
    }

    // 4. Manuscript ruled lines
    ctx.strokeStyle = 'rgba(80,35,5,0.14)';
    ctx.lineWidth   = 0.5;
    for (let ry = 170; ry < H - 80; ry += 22) {
      ctx.beginPath();
      ctx.moveTo(36, ry); ctx.lineTo(W - 36, ry);
      ctx.stroke();
    }

    // 5. Age spotting and edge vignette — increased vignette contrast
    for (let i = 0; i < 40; i++) {
      const ax = Math.random() * W; const ay = Math.random() * H;
      const ar = 1 + Math.random() * 7;
      const g  = ctx.createRadialGradient(ax, ay, 0, ax, ay, ar);
      g.addColorStop(0, `rgba(60,30,5,${(0.04 + Math.random() * 0.10).toFixed(3)})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(ax - ar, ay - ar, ar * 2, ar * 2);
    }
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.30, W / 2, H / 2, H * 0.70);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(50,22,3,0.50)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // 6. Roller-contact shadow — deeper
    const topS = ctx.createLinearGradient(0, 0, 0, 22);
    topS.addColorStop(0, 'rgba(40,18,3,0.55)');
    topS.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topS; ctx.fillRect(0, 0, W, 22);

    const botS = ctx.createLinearGradient(0, H - 22, 0, H);
    botS.addColorStop(0, 'rgba(0,0,0,0)');
    botS.addColorStop(1, 'rgba(40,18,3,0.55)');
    ctx.fillStyle = botS; ctx.fillRect(0, H - 22, W, 22);

    // 7. Classical double-line border + corner diamond ornaments
    const bm = 13;
    ctx.strokeStyle = 'rgba(50,18,3,0.70)';
    ctx.lineWidth   = 1.8;
    ctx.strokeRect(bm, bm, W - 2 * bm, H - 2 * bm);
    ctx.strokeStyle = 'rgba(50,18,3,0.38)';
    ctx.lineWidth   = 0.8;
    ctx.strokeRect(bm + 6, bm + 6, W - 2 * (bm + 6), H - 2 * (bm + 6));

    const corners: [number, number][] = [
      [bm, bm], [W - bm, bm], [bm, H - bm], [W - bm, H - bm],
    ];
    ctx.fillStyle   = 'rgba(50,18,3,0.72)';
    ctx.strokeStyle = 'rgba(50,18,3,0.72)';
    ctx.lineWidth   = 1.0;
    for (const [cx, cy] of corners) {
      const d = 7;
      ctx.beginPath();
      ctx.moveTo(cx, cy - d); ctx.lineTo(cx + d, cy);
      ctx.lineTo(cx, cy + d); ctx.lineTo(cx - d, cy);
      ctx.closePath(); ctx.fill();
    }

    // 8. Red cinnabar rubric label
    const pages = [
      { rubric: 'ΑΡΧΗ',     icon: 'Α', title: 'Open Your Journey',
        line1: 'Unroll this scroll and discover',
        line2: 'everything that awaits you.' },
      { rubric: 'ΓΝΩΣΙΣ',   icon: 'Γ', title: 'Explore Disciplines',
        line1: 'Seek wisdom across all fields —',
        line2: 'Sport, Music, Technology and more.' },
      { rubric: 'ΟΔΟΣ',     icon: 'Ο', title: 'Guided Programs',
        line1: 'Follow the master\'s path.',
        line2: 'From first step to final excellence.' },
      { rubric: 'ΑΡΕΤΗ',    icon: 'Φ', title: 'Earn XP & Progress',
        line1: 'Each lesson mastered is one step',
        line2: 'closer to virtue through practice.' },
      { rubric: 'ΤΕΛΟΣ',    icon: 'Τ', title: 'Begin Today',
        line1: 'Wisdom begins with one decision.',
        line2: 'Create your account and start now.' },
    ];
    const pg = pages[pageIndex % pages.length];

    ctx.font        = 'bold 17px Georgia, "Times New Roman", serif';
    ctx.textAlign   = 'center';
    ctx.fillStyle   = '#700a00';
    ctx.globalAlpha = 0.92;
    ctx.fillText(pg.rubric, W / 2, 46);
    ctx.globalAlpha = 1;

    // Thin rule below rubric
    ctx.strokeStyle = 'rgba(70,30,5,0.45)';
    ctx.lineWidth   = 0.8;
    ctx.beginPath(); ctx.moveTo(36, 54); ctx.lineTo(W - 36, 54); ctx.stroke();

    // 9. Large Greek letter emblem with radial glow behind it
    // Subtle radial glow behind emblem to make it pop
    const emblGlow = ctx.createRadialGradient(W / 2, 130, 0, W / 2, 130, 80);
    emblGlow.addColorStop(0, 'rgba(255,230,140,0.20)');
    emblGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = emblGlow;
    ctx.fillRect(W / 2 - 80, 70, 160, 120);

    ctx.font      = 'bold 92px Georgia, "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(40,15,2,0.22)';
    ctx.fillText(pg.icon, W / 2 + 2, 154);
    ctx.fillStyle = '#1e0c02';
    ctx.fillText(pg.icon, W / 2, 152);

    ctx.strokeStyle = 'rgba(70,30,5,0.42)';
    ctx.lineWidth   = 0.8;
    ctx.beginPath(); ctx.moveTo(50, 168); ctx.lineTo(W - 50, 168); ctx.stroke();

    // 10. Title
    ctx.font      = 'bold 34px Georgia, "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#180a01';
    ctx.fillText(pg.title, W / 2, 204);

    ctx.strokeStyle = 'rgba(70,30,5,0.30)';
    ctx.lineWidth   = 0.6;
    ctx.beginPath(); ctx.moveTo(60, 217); ctx.lineTo(W - 60, 217); ctx.stroke();

    // 11. Body text
    ctx.font      = '21px Georgia, "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#2e1405';
    ctx.fillText(pg.line1, W / 2, 256);
    ctx.fillText(pg.line2, W / 2, 282);

    // 12. Decorative Greek letter strip at foot
    ctx.strokeStyle = 'rgba(70,30,5,0.40)';
    ctx.lineWidth   = 0.7;
    ctx.beginPath(); ctx.moveTo(28, H - 50); ctx.lineTo(W - 28, H - 50); ctx.stroke();

    const footLetters = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ'];
    ctx.font      = '13px Georgia, "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(55,22,4,0.52)';
    const gsp = (W - 64) / (footLetters.length - 1);
    footLetters.forEach((g, i) => ctx.fillText(g, 32 + i * gsp, H - 32));

    ctx.strokeStyle = 'rgba(70,30,5,0.30)';
    ctx.lineWidth   = 0.5;
    ctx.beginPath(); ctx.moveTo(28, H - 22); ctx.lineTo(W - 28, H - 22); ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = false;
    tex.minFilter       = THREE.LinearFilter;
    return tex;
  }

  // ─── Vellum normal map ────────────────────────────────────────────────────
  //
  //  Horizontal fibre bump, much subtler than Egyptian papyrus.
  //  normalScale is already low (0.14) so keep the normals gentle.
  //
  private buildVellumNormalMap(): THREE.CanvasTexture {
    const S = 512;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = S;
    const ctx    = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgb(127,127,255)';
    ctx.fillRect(0, 0, S, S);

    for (let y = 0; y < S; y += 2 + Math.random() * 3) {
      const ny  = (Math.random() - 0.5) * 0.30;
      const nz  = 1.0;
      const len = Math.sqrt(ny * ny + nz * nz);
      const G   = Math.round((ny / len) * 127 + 127);
      const B   = Math.min(255, Math.round((nz / len) * 127 + 255));
      ctx.strokeStyle = `rgb(127,${G},${B})`;
      ctx.lineWidth   = 0.4 + Math.random() * 0.6;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 10; x <= S; x += 10) {
        ctx.lineTo(x, y + (Math.random() - 0.5) * 0.7);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS  = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 3);
    return tex;
  }

  // ─── Greek cornua roller texture ─────────────────────────────────────────
  //
  //  LatheGeometry UV: U=0->1 maps from bottom cornua face to top cornua face.
  //  Knob arc ~ 17% of total arc at each end -> outer ~17% of texture = knob.
  //  Shaft = middle 66% of texture.
  //
  //  Design: near-black lacquered wood shaft (Dragon Scroll aesthetic),
  //  brighter gold cornua faces matching the Dragon Scroll's golden tips.
  //  Rich, prominent wood grain throughout with specular highlight on knob faces.
  //
  private buildRollerTexture(): THREE.CanvasTexture {
    const W = 512; const H = 64;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx    = canvas.getContext('2d')!;

    const kp = Math.floor(W * 0.17);

    // 1. Shaft base — near-black lacquered wood (Dragon Scroll aesthetic)
    const shaft = ctx.createLinearGradient(0, 0, 0, H);
    shaft.addColorStop(0,    '#1a0a04');
    shaft.addColorStop(0.22, '#2e1206');
    shaft.addColorStop(0.50, '#200c04');
    shaft.addColorStop(0.78, '#2a1006');
    shaft.addColorStop(1,    '#180804');
    ctx.fillStyle = shaft;
    ctx.fillRect(0, 0, W, H);

    // 2. Cornua faces — brighter gold (matches Dragon Scroll's golden tips)
    const knobGrad = ctx.createLinearGradient(0, 0, 0, H);
    knobGrad.addColorStop(0,    '#a06820');
    knobGrad.addColorStop(0.25, '#c88030');
    knobGrad.addColorStop(0.55, '#e09840');
    knobGrad.addColorStop(0.80, '#c07828');
    knobGrad.addColorStop(1,    '#8c5818');
    ctx.fillStyle = knobGrad;
    ctx.fillRect(0, 0, kp, H);
    ctx.fillRect(W - kp, 0, kp, H);

    // 3. Smooth gradient blend at shaft-knob transitions — wider blend
    const blendW = 28;
    const gradL = ctx.createLinearGradient(kp - 4, 0, kp + blendW, 0);
    gradL.addColorStop(0, 'rgba(168,108,44,1)');
    gradL.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradL;
    ctx.fillRect(kp - 4, 0, blendW + 4, H);

    const gradR = ctx.createLinearGradient(W - kp - blendW, 0, W - kp + 4, 0);
    gradR.addColorStop(0, 'rgba(0,0,0,0)');
    gradR.addColorStop(1, 'rgba(168,108,44,1)');
    ctx.fillStyle = gradR;
    ctx.fillRect(W - kp - blendW, 0, blendW + 4, H);

    // 4. Rich wood grain — primary dark channels
    for (let y = 0; y < H; y += 2.2 + Math.random() * 3.8) {
      const a = 0.14 + Math.random() * 0.28;
      ctx.strokeStyle = `rgba(8,3,1,${a.toFixed(3)})`;
      ctx.lineWidth   = 0.4 + Math.random() * 0.8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 16; x <= W; x += 16) {
        ctx.lineTo(x, y + (Math.random() - 0.5) * 1.0);
      }
      ctx.stroke();
    }

    // 5. Light-catching grain highlights — slightly more contrast
    for (let y = 0; y < H; y += 4 + Math.random() * 6) {
      const a = 0.09 + Math.random() * 0.18;
      ctx.strokeStyle = `rgba(230,185,90,${a.toFixed(3)})`;
      ctx.lineWidth   = 0.3 + Math.random() * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y + 0.9);
      for (let x = 16; x <= W; x += 16) {
        ctx.lineTo(x, y + 0.9 + (Math.random() - 0.5) * 0.7);
      }
      ctx.stroke();
    }

    // 6. Fine medullary rays — short diagonal marks for figured-wood look
    for (let i = 0; i < 28; i++) {
      const rx = Math.random() * W;
      const ry = Math.random() * H;
      const a  = 0.06 + Math.random() * 0.12;
      ctx.strokeStyle = `rgba(220,175,85,${a.toFixed(3)})`;
      ctx.lineWidth   = 0.3;
      ctx.beginPath();
      ctx.moveTo(rx,       ry);
      ctx.lineTo(rx + 6,   ry + (Math.random() - 0.5) * 4);
      ctx.stroke();
    }

    // 7. Specular hot-spot on each cornua face — brighter and more defined
    const spec1 = ctx.createRadialGradient(
      kp * 0.38, H * 0.32, 1,
      kp * 0.38, H * 0.32, kp * 0.80,
    );
    spec1.addColorStop(0, 'rgba(255,252,230,0.55)');
    spec1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = spec1;
    ctx.fillRect(0, 0, kp, H);

    const spec2 = ctx.createRadialGradient(
      W - kp * 0.38, H * 0.32, 1,
      W - kp * 0.38, H * 0.32, kp * 0.80,
    );
    spec2.addColorStop(0, 'rgba(255,252,230,0.55)');
    spec2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = spec2;
    ctx.fillRect(W - kp, 0, kp, H);

    // 8. Overall cylindrical-form highlight
    const formHL = ctx.createLinearGradient(0, 0, 0, H * 0.28);
    formHL.addColorStop(0, 'rgba(255,225,170,0.18)');
    formHL.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = formHL;
    ctx.fillRect(0, 0, W, H * 0.28);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  // ─── Greek letter glyph sprite textures ──────────────────────────────────
  //
  //  Warm golden Greek letters drifting upward off the open scroll.
  //  Very small (0.045-0.105 world units), additive blending keeps them
  //  subtle — a hint of scholarly magic rather than a light show.
  //
  private buildGlyphTextures(): void {
    const chars = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'π', 'φ', 'ψ', 'ω'];
    for (const ch of chars) {
      const S      = 64;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = S;
      const ctx    = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, S, S);
      ctx.shadowColor  = 'rgba(200,155,60,0.70)';
      ctx.shadowBlur   = 10;
      ctx.fillStyle    = 'rgba(255,220,120,0.92)';
      ctx.font         = 'bold 34px Georgia, "Times New Roman", serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ch, S / 2, S / 2);
      const t = new THREE.CanvasTexture(canvas);
      t.colorSpace = THREE.SRGBColorSpace;
      this.glyphTextures.push(t);
    }
  }
}
