// ─── Three.js and post-processing mocks (hoisted before imports) ─────────────
// All jest.mock() calls are hoisted to the top of the compiled output, so they
// run before any import that would try to resolve Three.js ESM modules.

jest.mock('three', () => {
  // ── position BufferAttribute mock ─────────────────────────────────────────
  // buildScroll() accesses paperGeo.attributes['position'] (not getAttribute)
  // deformPaper() calls pos.setXYZ(), reads pos.count, sets pos.needsUpdate
  const VERT_COUNT = 5;
  const posAttr = {
    count:       VERT_COUNT,
    needsUpdate: false,
    getX: jest.fn(() => 0),
    getY: jest.fn(() => 0),
    getZ: jest.fn(() => 0),
    setXYZ: jest.fn(),
  };

  class PlaneGeometryMock {
    // Both attribute access patterns used in the component
    attributes   = { position: posAttr };
    getAttribute = jest.fn(() => posAttr);
    setAttribute = jest.fn();
    computeVertexNormals = jest.fn();
    dispose      = jest.fn();
  }

  class LatheGeometryMock {
    dispose = jest.fn();
  }

  class MeshStandardMaterialMock {
    map: any      = null;
    normalMap: any = null;
    emissiveIntensity = 0;
    metalness  = 0;
    roughness  = 0.6;
    dispose    = jest.fn();
    // Capture constructor params so map/normalMap can be tested
    constructor(params?: Record<string, unknown>) {
      if (params) {
        this.map       = params['map']       ?? null;
        this.normalMap = params['normalMap'] ?? null;
      }
    }
  }

  class SpriteMaterialMock {
    map:         any = null;
    opacity      = 1;
    transparent  = true;
    depthWrite   = false;
    blending:    any = null;
    dispose      = jest.fn();
  }

  class WebGLRendererMock {
    domElement: HTMLCanvasElement;
    outputColorSpace: any  = null;
    toneMapping: any       = null;
    toneMappingExposure    = 0;
    shadowMap = { enabled: false, type: null as any };
    setPixelRatio          = jest.fn();
    setSize                = jest.fn();
    setClearColor          = jest.fn();
    dispose                = jest.fn();
    constructor() {
      this.domElement = document.createElement('canvas');
      jest.spyOn(this.domElement, 'addEventListener');
      jest.spyOn(this.domElement, 'removeEventListener');
    }
  }

  class SceneMock {
    environment: any = null;
    add              = jest.fn();
    remove           = jest.fn();
  }

  class PerspectiveCameraMock {
    position = { set: jest.fn(), x: 0, y: 0, z: 0 };
    aspect   = 1;
    lookAt   = jest.fn();
    updateProjectionMatrix = jest.fn();
  }

  class PMREMGeneratorMock {
    fromScene = jest.fn(() => ({ texture: {} }));
    dispose   = jest.fn();
  }

  class AmbientLightMock {
    constructor(_color?: number, _intensity?: number) {}
  }

  class DirectionalLightMock {
    position    = { set: jest.fn() };
    castShadow  = false;
    shadow      = { mapSize: { set: jest.fn() }, bias: 0, intensity: 0 };
  }

  class PointLightMock {
    position  = { set: jest.fn() };
    color     = { setHex: jest.fn() };
    intensity = 0;
    constructor(_color?: number, _intensity?: number, _distance?: number, _decay?: number) {}
  }

  class GroupMock {
    rotation = { x: 0, y: 0, z: 0 };
    position = { x: 0, y: 0, z: 0, set: jest.fn() };
    add      = jest.fn();
  }

  class MeshMock {
    material:     any;
    geometry:     any;
    position      = { x: 0, y: 0, z: 0, set: jest.fn() };
    rotation      = { x: 0, y: 0, z: 0 };
    castShadow    = false;
    receiveShadow = false;
    constructor(geo?: any, mat?: any) {
      this.geometry = geo;
      this.material = mat;
    }
  }

  class SpriteMock {
    position = { x: 0, y: 0, z: 0, set: jest.fn() };
    scale    = { set: jest.fn() };
    material: any;
    constructor(mat?: any) { this.material = mat; }
  }

  class CanvasTextureMock {
    colorSpace: any  = null;
    needsUpdate      = false;
    wrapS: any       = null;
    wrapT: any       = null;
    repeat           = { set: jest.fn(), x: 1, y: 1 };
    dispose          = jest.fn();
    constructor(_canvas?: unknown) {}
  }

  class Vector2Mock {
    x = 0; y = 0;
    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
    set = jest.fn();
  }

  class Vector3Mock {
    x = 0; y = 0; z = 0;
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  }

  class WebGLRenderTargetMock {
    dispose = jest.fn();
  }

  class BufferAttributeMock {
    needsUpdate = false;
    constructor(_array: unknown, _itemSize: number) {}
  }

  return {
    WebGLRenderer:        WebGLRendererMock,
    Scene:                SceneMock,
    PerspectiveCamera:    PerspectiveCameraMock,
    PMREMGenerator:       PMREMGeneratorMock,
    AmbientLight:         AmbientLightMock,
    DirectionalLight:     DirectionalLightMock,
    PointLight:           PointLightMock,
    Group:                GroupMock,
    Mesh:                 MeshMock,
    Sprite:               SpriteMock,
    PlaneGeometry:        PlaneGeometryMock,
    LatheGeometry:        LatheGeometryMock,
    MeshStandardMaterial: MeshStandardMaterialMock,
    SpriteMaterial:       SpriteMaterialMock,
    CanvasTexture:        CanvasTextureMock,
    Vector2:              Vector2Mock,
    Vector3:              Vector3Mock,
    WebGLRenderTarget:    WebGLRenderTargetMock,
    BufferAttribute:      BufferAttributeMock,
    MathUtils:            { degToRad: (d: number): number => (d * Math.PI) / 180 },
    SRGBColorSpace:       'srgb',
    ACESFilmicToneMapping: 1,
    PCFSoftShadowMap:     2,
    HalfFloatType:        3,
    RGBAFormat:           4,
    ClampToEdgeWrapping:  5,
    RepeatWrapping:       6,
    AdditiveBlending:     7,
    FrontSide:            8,
    DoubleSide:           9,
    NormalBlending:       10,
    LinearFilter:         11,
    NearestFilter:        12,
  };
});

jest.mock('three/examples/jsm/postprocessing/EffectComposer.js', () => ({
  EffectComposer: jest.fn().mockImplementation(() => ({
    addPass: jest.fn(),
    render:  jest.fn(),
    setSize: jest.fn(),
    dispose: jest.fn(),
  })),
}));

jest.mock('three/examples/jsm/postprocessing/RenderPass.js', () => ({
  RenderPass: jest.fn(),
}));

jest.mock('three/examples/jsm/postprocessing/UnrealBloomPass.js', () => ({
  UnrealBloomPass: jest.fn().mockImplementation(() => ({
    resolution: { set: jest.fn() },
    strength:  0.14,
    radius:    0.18,
    threshold: 0.82,
  })),
}));

jest.mock('three/examples/jsm/postprocessing/SMAAPass.js', () => ({
  SMAAPass: jest.fn(),
}));

jest.mock('three/examples/jsm/postprocessing/OutputPass.js', () => ({
  OutputPass: jest.fn(),
}));

jest.mock('three/examples/jsm/environments/RoomEnvironment.js', () => ({
  RoomEnvironment: jest.fn().mockImplementation(() => ({ dispose: jest.fn() })),
}));

// ─── DOM / browser API stubs ─────────────────────────────────────────────────

/**
 * 2D canvas context stub.
 * buildVellumTexture, buildVellumNormalMap, buildRollerTexture, buildGlyphTextures
 * all use document.createElement('canvas').getContext('2d').
 */
const ctx2dStub = {
  fillStyle:    '' as string | CanvasGradient | CanvasPattern,
  strokeStyle:  '' as string | CanvasGradient | CanvasPattern,
  globalAlpha:  1,
  shadowColor:  '',
  shadowBlur:   0,
  font:         '',
  lineWidth:    1,
  textAlign:    'left' as CanvasTextAlign,
  textBaseline: 'alphabetic' as CanvasTextBaseline,
  createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
  createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
  fillRect:    jest.fn(),
  clearRect:   jest.fn(),
  strokeRect:  jest.fn(),
  save:        jest.fn(),
  restore:     jest.fn(),
  beginPath:   jest.fn(),
  moveTo:      jest.fn(),
  lineTo:      jest.fn(),
  arc:         jest.fn(),
  closePath:   jest.fn(),
  fill:        jest.fn(),
  stroke:      jest.fn(),
  clip:        jest.fn(),
  translate:   jest.fn(),
  rotate:      jest.fn(),
  scale:       jest.fn(),
  drawImage:   jest.fn(),
  fillText:    jest.fn(),
  measureText: jest.fn(() => ({ width: 20 })),
  /**
   * Returns a real Uint8ClampedArray sized for the requested dimensions so
   * buildVellumNormalMap can write pixel data without throwing.
   */
  createImageData: jest.fn((w: number, h: number) => ({
    data:   new Uint8ClampedArray(w * h * 4),
    width:  w,
    height: h,
  })),
  getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
  putImageData:   jest.fn(),
  setTransform:   jest.fn(),
  resetTransform: jest.fn(),
};

HTMLCanvasElement.prototype.getContext = jest.fn((type: string) => {
  if (type === '2d') return ctx2dStub as unknown as CanvasRenderingContext2D;
  return null;
}) as typeof HTMLCanvasElement.prototype.getContext;

// ─── ResizeObserver stub ──────────────────────────────────────────────────────
// The callback is captured so tests can manually trigger resize events.

let mockResizeCallback: ResizeObserverCallback | null = null;
const mockResizeObserverObserve    = jest.fn();
const mockResizeObserverDisconnect = jest.fn();

global.ResizeObserver = jest.fn((cb: ResizeObserverCallback) => {
  mockResizeCallback = cb;
  return {
    observe:    mockResizeObserverObserve,
    disconnect: mockResizeObserverDisconnect,
  };
}) as unknown as typeof ResizeObserver;

// ─── RAF stub ────────────────────────────────────────────────────────────────
// Returning a fixed ID without executing the callback keeps tests deterministic.
let _rafId = 0;
global.requestAnimationFrame = jest.fn(() => ++_rafId) as typeof requestAnimationFrame;
global.cancelAnimationFrame  = jest.fn() as typeof cancelAnimationFrame;

// ─── Imports ─────────────────────────────────────────────────────────────────

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { ScrollThreeComponent } from './scroll-three.component';

// ─── Constants (mirror the private constants in the component) ────────────────
const CAM_Z_REST = 4.4;
const CAM_Z_OPEN = 5.2;

// ─── Helper ──────────────────────────────────────────────────────────────────
function priv(comp: ScrollThreeComponent, key: string): any {
  return (comp as unknown as Record<string, unknown>)[key];
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('ScrollThreeComponent', () => {
  let comp:    ScrollThreeComponent;
  let fixture: ComponentFixture<ScrollThreeComponent>;

  // Toggle touch device simulation via the 'ontouchstart' window property.
  // When turning off, DELETE the property so 'ontouchstart' in window is reliably false.
  function setTouchDevice(on: boolean): void {
    if (on) {
      Object.defineProperty(window, 'ontouchstart', {
        value:        jest.fn(),
        configurable: true,
        writable:     true,
      });
    } else {
      // Setting to undefined still makes 'ontouchstart' in window === true; delete instead.
      delete (window as unknown as Record<string, unknown>)['ontouchstart'];
    }
  }

  beforeEach(() => {
    // Reset shared mocks
    mockResizeCallback = null;
    mockResizeObserverObserve.mockClear();
    mockResizeObserverDisconnect.mockClear();
    (global.cancelAnimationFrame as jest.Mock).mockClear();
    (global.requestAnimationFrame as jest.Mock).mockClear();

    setTouchDevice(false);

    TestBed.configureTestingModule({
      imports: [ScrollThreeComponent],
    });
    fixture = TestBed.createComponent(ScrollThreeComponent);
    comp    = fixture.componentInstance;
  });

  afterEach(() => {
    setTouchDevice(false);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value:        0,
      configurable: true,
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Component creation (before ngOnInit)
  // ─────────────────────────────────────────────────────────────────────────

  describe('creation', () => {
    it('instantiates without errors', () => {
      expect(comp).toBeTruthy();
    });

    it('exposes default public state before ngOnInit', () => {
      expect(comp.currentPage).toBe(0);
      expect(comp.maxPages).toBe(5);
    });

    it('has bookOpenChange and pageChange EventEmitters', () => {
      expect(typeof comp.bookOpenChange.emit).toBe('function');
      expect(typeof comp.pageChange.emit).toBe('function');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2. ngOnInit / Three.js setup
  // ─────────────────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('runs init() outside the Angular zone', () => {
      const ngZone = TestBed.inject(NgZone);
      const spy    = jest.spyOn(ngZone, 'runOutsideAngular');
      fixture.detectChanges();
      expect(spy).toHaveBeenCalled();
    });

    it('starts the RAF render loop', () => {
      fixture.detectChanges();
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('observes the host div element with ResizeObserver', () => {
      fixture.detectChanges();
      expect(global.ResizeObserver).toHaveBeenCalled();
      expect(mockResizeObserverObserve).toHaveBeenCalled();
    });

    it('appends the renderer canvas to the host element', () => {
      fixture.detectChanges();
      const hostDiv  = fixture.nativeElement.querySelector('div') as HTMLElement;
      const renderer = priv(comp, 'renderer');
      expect(hostDiv.contains(renderer.domElement)).toBe(true);
    });

    it('registers webglcontextlost/restored listeners on renderer domElement', () => {
      fixture.detectChanges();
      const domElement = priv(comp, 'renderer').domElement as HTMLCanvasElement;
      expect(domElement.addEventListener).toHaveBeenCalledWith(
        'webglcontextlost', expect.any(Function),
      );
      expect(domElement.addEventListener).toHaveBeenCalledWith(
        'webglcontextrestored', expect.any(Function),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Portrait / mobile camera adjustment
  // ─────────────────────────────────────────────────────────────────────────

  describe('portrait orientation detection', () => {
    // JSDOM default: clientWidth = 0, clientHeight = 0.
    // Component falls back to w = clientWidth || 300, h = clientHeight || 400.
    // 300 < 400 → portrait by default in tests.

    it('detects portrait (h > w) and sets portraitBaseZ = CAM_Z_REST * 1.18', () => {
      fixture.detectChanges();
      expect(priv(comp, 'portraitBaseZ')).toBeCloseTo(CAM_Z_REST * 1.18, 5);
    });

    it('sets camZ.value to portraitBaseZ on portrait init', () => {
      fixture.detectChanges();
      expect(priv(comp, 'camZ').value).toBeCloseTo(CAM_Z_REST * 1.18, 5);
    });

    it('keeps portraitBaseZ = CAM_Z_REST when landscape (w > h)', () => {
      const div = fixture.nativeElement.querySelector('div') as HTMLDivElement;
      Object.defineProperty(div, 'clientWidth',  { value: 800, configurable: true });
      Object.defineProperty(div, 'clientHeight', { value: 400, configurable: true });
      fixture.detectChanges();
      expect(priv(comp, 'portraitBaseZ')).toBeCloseTo(CAM_Z_REST, 5);
    });

    it('keeps camZ.value = CAM_Z_REST on landscape init', () => {
      const div = fixture.nativeElement.querySelector('div') as HTMLDivElement;
      Object.defineProperty(div, 'clientWidth',  { value: 800, configurable: true });
      Object.defineProperty(div, 'clientHeight', { value: 400, configurable: true });
      fixture.detectChanges();
      expect(priv(comp, 'camZ').value).toBeCloseTo(CAM_Z_REST, 5);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Touch device detection
  // ─────────────────────────────────────────────────────────────────────────

  describe('touch device detection', () => {
    it('sets isTouchDevice = false on non-touch desktop', () => {
      fixture.detectChanges();
      expect(priv(comp, 'isTouchDevice')).toBe(false);
    });

    it('sets isTouchDevice = true when ontouchstart is in window', () => {
      setTouchDevice(true);
      fixture.detectChanges();
      expect(priv(comp, 'isTouchDevice')).toBe(true);
    });

    it('sets isTouchDevice = true when navigator.maxTouchPoints > 0', () => {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 1, configurable: true,
      });
      fixture.detectChanges();
      expect(priv(comp, 'isTouchDevice')).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Global mousemove listener registration
  // ─────────────────────────────────────────────────────────────────────────

  describe('mousemove listener', () => {
    it('registers document mousemove on non-touch devices', () => {
      const spy = jest.spyOn(document, 'addEventListener');
      fixture.detectChanges();
      const calls = spy.mock.calls.filter(args => args[0] === 'mousemove');
      expect(calls).toHaveLength(1);
      spy.mockRestore(); // prevent leaking into subsequent tests
    });

    it('does NOT register document mousemove on touch devices (isTouchDevice guard)', () => {
      // Verify the guard: isTouchDevice=true → document.addEventListener('mousemove') is skipped.
      // Tested via component state rather than spy to avoid spy-pollution from the test above.
      setTouchDevice(true);
      fixture.detectChanges();
      expect(priv(comp, 'isTouchDevice')).toBe(true);
      // globalMoveRef is still assigned (for cleanup safety), just not registered
      expect(priv(comp, 'globalMoveRef')).not.toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Touch auto-open (700 ms timeout)
  // ─────────────────────────────────────────────────────────────────────────

  describe('touch auto-open', () => {
    it('does NOT auto-open on non-touch device even after 700 ms', fakeAsync(() => {
      const spy = jest.spyOn(comp.bookOpenChange, 'emit');
      fixture.detectChanges();
      tick(700);
      expect(spy).not.toHaveBeenCalled();
    }));

    it('auto-opens on touch device after exactly 700 ms', fakeAsync(() => {
      setTouchDevice(true);
      const spy = jest.spyOn(comp.bookOpenChange, 'emit');
      fixture.detectChanges();
      // Not yet open before timeout fires
      expect(priv(comp, 'isOpen')).toBe(false);
      tick(700);
      expect(priv(comp, 'isOpen')).toBe(true);
      expect(spy).toHaveBeenCalledWith(true);
    }));

    it('touch auto-open does not fire before 700 ms', fakeAsync(() => {
      setTouchDevice(true);
      const spy = jest.spyOn(comp.bookOpenChange, 'emit');
      fixture.detectChanges();
      tick(699);
      expect(spy).not.toHaveBeenCalled();
    }));
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 7. openBook
  // ─────────────────────────────────────────────────────────────────────────

  describe('openBook', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('sets isOpen to true', () => {
      comp.openBook();
      expect(priv(comp, 'isOpen')).toBe(true);
    });

    it('emits bookOpenChange(true)', () => {
      const spy = jest.spyOn(comp.bookOpenChange, 'emit');
      comp.openBook();
      expect(spy).toHaveBeenCalledWith(true);
    });

    it('sets openTarget = 1', () => {
      comp.openBook();
      expect(priv(comp, 'openTarget')).toBe(1);
    });

    it('sets targetCamZ = CAM_Z_OPEN', () => {
      comp.openBook();
      expect(priv(comp, 'targetCamZ')).toBeCloseTo(CAM_Z_OPEN, 5);
    });

    it('is idempotent — calling twice emits only once', () => {
      const spy = jest.spyOn(comp.bookOpenChange, 'emit');
      comp.openBook();
      comp.openBook();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('updates lastInteractionTime', () => {
      const before = priv(comp, 'lastInteractionTime') as number;
      comp.openBook();
      expect(priv(comp, 'lastInteractionTime') as number).toBeGreaterThanOrEqual(before);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 8. onMouseEnter
  // ─────────────────────────────────────────────────────────────────────────

  describe('onMouseEnter', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('opens the scroll when closed and in idle phase', () => {
      const spy = jest.spyOn(comp.bookOpenChange, 'emit');
      comp.onMouseEnter();
      expect(spy).toHaveBeenCalledWith(true);
    });

    it('does not open if already open', () => {
      comp.openBook();
      const spy = jest.spyOn(comp.bookOpenChange, 'emit');
      comp.onMouseEnter();
      expect(spy).not.toHaveBeenCalled();
    });

    it('does not open if pageTransitionPhase is not idle', () => {
      (comp as any).pageTransitionPhase = 'closing';
      const spy = jest.spyOn(comp.bookOpenChange, 'emit');
      comp.onMouseEnter();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 9. onMouseLeave
  // ─────────────────────────────────────────────────────────────────────────

  describe('onMouseLeave', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('closes the scroll and emits bookOpenChange(false) when open', () => {
      comp.openBook();
      const spy = jest.spyOn(comp.bookOpenChange, 'emit');
      comp.onMouseLeave();
      expect(spy).toHaveBeenCalledWith(false);
      expect(priv(comp, 'isOpen')).toBe(false);
    });

    it('resets openTarget to 0', () => {
      comp.openBook();
      comp.onMouseLeave();
      expect(priv(comp, 'openTarget')).toBe(0);
    });

    it('resets targetCamZ to portraitBaseZ (rest position)', () => {
      comp.openBook();
      comp.onMouseLeave();
      // targetCamZ should go back to rest, not open distance
      expect(priv(comp, 'targetCamZ')).not.toBeCloseTo(CAM_Z_OPEN, 5);
    });

    it('resets tilt and position targets to 0', () => {
      comp.onMouseLeave();
      expect(priv(comp, 'targetTiltX')).toBe(0);
      expect(priv(comp, 'targetTiltY')).toBe(0);
      expect(priv(comp, 'targetPosX')).toBe(0);
      expect(priv(comp, 'targetPosY')).toBe(0);
    });

    it('resets camera X/Y targets to 0', () => {
      comp.onMouseLeave();
      expect(priv(comp, 'targetCamX')).toBe(0);
      expect(priv(comp, 'targetCamY')).toBe(0);
    });

    it('resets pageTransitionPhase to idle', () => {
      comp.openBook();
      (comp as any).pageTransitionPhase = 'closing';
      comp.onMouseLeave();
      expect(priv(comp, 'pageTransitionPhase')).toBe('idle');
    });

    it('is a noop (no emit) when scroll is already closed', () => {
      const spy = jest.spyOn(comp.bookOpenChange, 'emit');
      comp.onMouseLeave();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 10. onMouseMove (no-op for API compatibility)
  // ─────────────────────────────────────────────────────────────────────────

  describe('onMouseMove', () => {
    it('does not throw and returns void', () => {
      fixture.detectChanges();
      expect(() => comp.onMouseMove(0.5, -0.3, 0.7)).not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 11. nextPage
  // ─────────────────────────────────────────────────────────────────────────

  describe('nextPage', () => {
    beforeEach(() => {
      fixture.detectChanges();
      comp.openBook(); // scroll must be open for page turns
    });

    it('returns false when scroll is closed', () => {
      comp.onMouseLeave();
      expect(comp.nextPage()).toBe(false);
    });

    it('returns false when pageTransitionPhase is not idle', () => {
      (comp as any).pageTransitionPhase = 'closing';
      expect(comp.nextPage()).toBe(false);
    });

    it('returns false when currentPage already equals maxPages', () => {
      (comp as any).currentPage = comp.maxPages;
      expect(comp.nextPage()).toBe(false);
    });

    it('returns true on a valid page turn', () => {
      expect(comp.nextPage()).toBe(true);
    });

    it('enters closing phase', () => {
      comp.nextPage();
      expect(priv(comp, 'pageTransitionPhase')).toBe('closing');
    });

    it('emits bookOpenChange(false) to trigger close animation', () => {
      const spy = jest.spyOn(comp.bookOpenChange, 'emit');
      comp.nextPage();
      expect(spy).toHaveBeenCalledWith(false);
    });

    it('sets openTarget = 0 (scroll rerolls)', () => {
      comp.nextPage();
      expect(priv(comp, 'openTarget')).toBe(0);
    });

    it('advances pendingPage to currentPage + 1', () => {
      (comp as any).currentPage = 2;
      comp.nextPage();
      expect(priv(comp, 'pendingPage')).toBe(3);
    });

    it('wraps pendingPage to 0 and sets pendingFinalClose on the last page', () => {
      (comp as any).currentPage = comp.maxPages - 1; // next = maxPages → last
      comp.nextPage();
      expect(priv(comp, 'pendingFinalClose')).toBe(true);
      expect(priv(comp, 'pendingPage')).toBe(0);
    });

    it('does not set pendingFinalClose on a non-last page', () => {
      (comp as any).currentPage = 1;
      comp.nextPage();
      expect(priv(comp, 'pendingFinalClose')).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 12. prevPage
  // ─────────────────────────────────────────────────────────────────────────

  describe('prevPage', () => {
    beforeEach(() => {
      fixture.detectChanges();
      comp.openBook();
      (comp as any).currentPage = 2;
    });

    it('returns false when scroll is closed', () => {
      comp.onMouseLeave();
      expect(comp.prevPage()).toBe(false);
    });

    it('returns false at page 0', () => {
      (comp as any).currentPage = 0;
      expect(comp.prevPage()).toBe(false);
    });

    it('returns false when pageTransitionPhase is not idle', () => {
      (comp as any).pageTransitionPhase = 'closing';
      expect(comp.prevPage()).toBe(false);
    });

    it('returns true on a valid backwards page turn', () => {
      expect(comp.prevPage()).toBe(true);
    });

    it('enters closing phase', () => {
      comp.prevPage();
      expect(priv(comp, 'pageTransitionPhase')).toBe('closing');
    });

    it('sets pendingPage = currentPage - 1', () => {
      comp.prevPage();
      expect(priv(comp, 'pendingPage')).toBe(1);
    });

    it('emits bookOpenChange(false)', () => {
      const spy = jest.spyOn(comp.bookOpenChange, 'emit');
      comp.prevPage();
      expect(spy).toHaveBeenCalledWith(false);
    });

    it('sets pendingFinalClose = false', () => {
      comp.prevPage();
      expect(priv(comp, 'pendingFinalClose')).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 13. setAccentColor
  // ─────────────────────────────────────────────────────────────────────────

  describe('setAccentColor', () => {
    it('calls accentLight.color.setHex with the provided colour', () => {
      fixture.detectChanges();
      const accentLight = priv(comp, 'accentLight');
      comp.setAccentColor(0xff8800);
      expect(accentLight.color.setHex).toHaveBeenCalledWith(0xff8800);
    });

    it('is a safe no-op before init (accentLight undefined)', () => {
      // Do NOT call fixture.detectChanges() — ngOnInit has not run yet
      expect(() => comp.setAccentColor(0xff8800)).not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 14. 3D geometry construction
  // ─────────────────────────────────────────────────────────────────────────

  describe('3D scene construction', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('creates a PlaneGeometry for the paper mesh', () => {
      expect(priv(comp, 'paperGeo')).toBeTruthy();
      expect(typeof priv(comp, 'paperGeo').computeVertexNormals).toBe('function');
    });

    it('stores base X and Y vertex positions (Float32Arrays)', () => {
      expect(priv(comp, 'paperBaseX')).toBeInstanceOf(Float32Array);
      expect(priv(comp, 'paperBaseY')).toBeInstanceOf(Float32Array);
    });

    it('creates a LatheGeometry for the roller (cornua handles)', () => {
      const rollerGeo = priv(comp, 'rollerGeo');
      expect(rollerGeo).toBeTruthy();
      expect(typeof rollerGeo.dispose).toBe('function');
    });

    it('creates both top and bottom roller meshes', () => {
      expect(priv(comp, 'topRollerMesh')).toBeTruthy();
      expect(priv(comp, 'botRollerMesh')).toBeTruthy();
    });

    it('creates a scroll Group added to the scene', () => {
      const scrollGroup = priv(comp, 'scrollGroup');
      const scene       = priv(comp, 'scene');
      expect(scrollGroup).toBeTruthy();
      expect(scene.add).toHaveBeenCalledWith(scrollGroup);
    });

    it('creates innerLight (Dragon Scroll glow) with zero initial intensity', () => {
      const innerLight = priv(comp, 'innerLight');
      expect(innerLight).toBeTruthy();
      expect(innerLight.intensity).toBe(0);
    });

    it('creates accentLight for HomeComponent.setTheme() integration', () => {
      expect(priv(comp, 'accentLight')).toBeTruthy();
    });

    it('creates an EffectComposer with bloom, SMAA and output passes', () => {
      const composer = priv(comp, 'composer');
      expect(composer).toBeTruthy();
      expect(composer.addPass).toHaveBeenCalledTimes(4); // RenderPass + bloom + SMAA + output
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 15. ResizeObserver — debounced resize + portrait re-detection
  // ─────────────────────────────────────────────────────────────────────────

  describe('ResizeObserver resize handling', () => {
    beforeEach(() => { fixture.detectChanges(); });

    function triggerResize(w: number, h: number): void {
      const div = fixture.nativeElement.querySelector('div') as HTMLDivElement;
      Object.defineProperty(div, 'clientWidth',  { value: w, configurable: true });
      Object.defineProperty(div, 'clientHeight', { value: h, configurable: true });
      mockResizeCallback!([], null as unknown as ResizeObserver);
    }

    it('debounces resize: multiple rapid calls produce one renderer.setSize', fakeAsync(() => {
      // Clear the call that happened during init() so we count only resize-driven calls
      (priv(comp, 'renderer').setSize as jest.Mock).mockClear();
      triggerResize(600, 400);
      triggerResize(601, 401);
      triggerResize(602, 402);
      tick(120);
      // Only one debounced invocation (not three)
      expect(priv(comp, 'renderer').setSize).toHaveBeenCalledTimes(1);
    }));

    it('updates renderer size after debounce', fakeAsync(() => {
      triggerResize(800, 600);
      tick(120);
      expect(priv(comp, 'renderer').setSize).toHaveBeenCalledWith(800, 600);
    }));

    it('updates camera aspect ratio after debounce', fakeAsync(() => {
      triggerResize(800, 400);
      tick(120);
      expect(priv(comp, 'camera').aspect).toBeCloseTo(800 / 400, 5);
      expect(priv(comp, 'camera').updateProjectionMatrix).toHaveBeenCalled();
    }));

    it('detects portrait after resize to portrait dimensions', fakeAsync(() => {
      triggerResize(300, 600);
      tick(120);
      expect(priv(comp, 'portraitBaseZ')).toBeCloseTo(CAM_Z_REST * 1.18, 5);
    }));

    it('detects landscape after resize to landscape dimensions', fakeAsync(() => {
      triggerResize(800, 400);
      tick(120);
      expect(priv(comp, 'portraitBaseZ')).toBeCloseTo(CAM_Z_REST, 5);
    }));

    it('updates targetCamZ when scroll is closed during portrait resize', fakeAsync(() => {
      // isOpen = false (default)
      triggerResize(300, 600);
      tick(120);
      expect(priv(comp, 'targetCamZ')).toBeCloseTo(CAM_Z_REST * 1.18, 5);
    }));

    it('does not change targetCamZ when scroll is open during resize', fakeAsync(() => {
      comp.openBook(); // targetCamZ → CAM_Z_OPEN
      triggerResize(300, 600);
      tick(120);
      // isOpen=true branch → targetCamZ unchanged (still CAM_Z_OPEN)
      expect(priv(comp, 'targetCamZ')).toBeCloseTo(CAM_Z_OPEN, 5);
    }));

    it('fires the ResizeObserver callback when mockResizeCallback is invoked', () => {
      expect(mockResizeCallback).not.toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 16. ngOnDestroy cleanup
  // ─────────────────────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('cancels the animation frame', () => {
      comp.ngOnDestroy();
      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });

    it('disconnects the ResizeObserver', () => {
      comp.ngOnDestroy();
      expect(mockResizeObserverDisconnect).toHaveBeenCalled();
    });

    it('disposes the WebGLRenderer', () => {
      const renderer = priv(comp, 'renderer');
      comp.ngOnDestroy();
      expect(renderer.dispose).toHaveBeenCalled();
    });

    it('disposes the EffectComposer', () => {
      const composer = priv(comp, 'composer');
      comp.ngOnDestroy();
      expect(composer.dispose).toHaveBeenCalled();
    });

    it('removes the global mousemove listener', () => {
      const spy = jest.spyOn(document, 'removeEventListener');
      comp.ngOnDestroy();
      expect(spy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    });

    it('disposes the paper geometry', () => {
      const paperGeo = priv(comp, 'paperGeo');
      comp.ngOnDestroy();
      expect(paperGeo.dispose).toHaveBeenCalled();
    });

    it('disposes the paper material', () => {
      const mat = (priv(comp, 'paperMesh') as any).material;
      comp.ngOnDestroy();
      expect(mat.dispose).toHaveBeenCalled();
    });

    it('disposes the roller geometry', () => {
      const rollerGeo = priv(comp, 'rollerGeo');
      comp.ngOnDestroy();
      expect(rollerGeo.dispose).toHaveBeenCalled();
    });

    it('disposes the roller material', () => {
      const rollerMat = priv(comp, 'rollerMat');
      comp.ngOnDestroy();
      expect(rollerMat.dispose).toHaveBeenCalled();
    });

    it('removes webglcontextlost listener from renderer domElement', () => {
      const domElement = priv(comp, 'renderer').domElement as HTMLCanvasElement;
      comp.ngOnDestroy();
      expect(domElement.removeEventListener).toHaveBeenCalledWith(
        'webglcontextlost', expect.any(Function),
      );
    });

    it('removes webglcontextrestored listener from renderer domElement', () => {
      const domElement = priv(comp, 'renderer').domElement as HTMLCanvasElement;
      comp.ngOnDestroy();
      expect(domElement.removeEventListener).toHaveBeenCalledWith(
        'webglcontextrestored', expect.any(Function),
      );
    });

    it('resets the glow spring to zero', () => {
      comp.ngOnDestroy();
      expect(priv(comp, 'glowSpr').value).toBe(0);
      expect(priv(comp, 'glowSpr').velocity).toBe(0);
    });

    it('clears a pending resize debounce timer', fakeAsync(() => {
      // Trigger a resize to arm the 120ms debounce, then destroy immediately
      mockResizeCallback!([], null as unknown as ResizeObserver);
      comp.ngOnDestroy();
      // Advancing past the debounce should not throw
      expect(() => tick(200)).not.toThrow();
    }));

    it('is idempotent — calling twice does not throw', () => {
      comp.ngOnDestroy();
      expect(() => comp.ngOnDestroy()).not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 17. @Input / @Output wiring
  // ─────────────────────────────────────────────────────────────────────────

  describe('@Input / @Output', () => {
    it('accepts maxPages @Input and uses it in nextPage boundary check', () => {
      fixture.detectChanges();
      comp.maxPages = 3;
      comp.openBook();
      (comp as any).currentPage = 3; // = maxPages
      expect(comp.nextPage()).toBe(false);
    });

    it('bookOpenChange emits on openBook', () => {
      fixture.detectChanges();
      const emitted: boolean[] = [];
      comp.bookOpenChange.subscribe((v: boolean) => emitted.push(v));
      comp.openBook();
      expect(emitted).toEqual([true]);
    });

    it('pageChange can be subscribed and emits externally', () => {
      fixture.detectChanges();
      const emitted: number[] = [];
      comp.pageChange.subscribe((v: number) => emitted.push(v));
      comp.pageChange.emit(2);
      expect(emitted).toEqual([2]);
    });
  });
});
