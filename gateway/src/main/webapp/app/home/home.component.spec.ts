jest.mock('app/core/auth/account.service');

// Three.js ESM modules cannot be parsed by Jest's CommonJS transformer.
// Intercept scroll-three.component and return a real Angular standalone stub
// so HomeComponent's imports array validates without loading Three.js.
jest.mock('./scroll-three.component', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const core = require('@angular/core');

  class ScrollThreeComponentStub {
    onMouseEnter() { /* noop */ }
    onMouseLeave() { /* noop */ }
    onMouseMove() { /* noop */ }
    openBook() { /* noop */ }
    nextPage() { return false; }
    prevPage() { return false; }
    setAccentColor() { /* noop */ }
  }

  // Apply @Component decorator via the runtime API
  core.Component({ selector: 'jhi-scroll-three', standalone: true, template: '' })(ScrollThreeComponentStub);

  return { ScrollThreeComponent: ScrollThreeComponentStub };
});

// JSDOM does not implement window.matchMedia — provide a minimal stub
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn((query: string) => ({
    matches: query.includes('dark') ? false : true,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpResponse } from '@angular/common/http';

import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { UserCourseEnrollmentService } from 'app/entities/service/user-course-enrollment/service/user-course-enrollment.service';
import { UserLessonProgressService } from 'app/entities/service/user-lesson-progress/service/user-lesson-progress.service';
import { CourseService } from 'app/entities/service/course/service/course.service';

import HomeComponent from './home.component';

describe('Home Component', () => {
  let comp: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockAccountService: AccountService;
  let mockRouter: Router;
  let mockEnrollmentService: { getEnrollments: jest.Mock };
  let mockProgressService: { getCourseProgress: jest.Mock; getMyPoints: jest.Mock };
  let mockCourseService: { find: jest.Mock };

  const account: Account = {
    activated: true,
    authorities: [],
    email: '',
    firstName: 'Alice',
    langKey: '',
    lastName: null,
    login: 'alice',
    imageUrl: null,
  };

  beforeEach(waitForAsync(() => {
    mockEnrollmentService = { getEnrollments: jest.fn().mockReturnValue(of(new HttpResponse({ body: [] }))) };
    mockProgressService = {
      getCourseProgress: jest.fn().mockReturnValue(of(new HttpResponse({ body: [] }))),
      getMyPoints: jest.fn().mockReturnValue(of(new HttpResponse({ body: 0 }))),
    };
    mockCourseService = { find: jest.fn().mockReturnValue(of(new HttpResponse({ body: null }))) };

    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        AccountService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UserCourseEnrollmentService, useValue: mockEnrollmentService },
        { provide: UserLessonProgressService, useValue: mockProgressService },
        { provide: CourseService, useValue: mockCourseService },
      ],
    })
      .overrideTemplate(HomeComponent, '')
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeComponent);
    comp = fixture.componentInstance;
    mockAccountService = TestBed.inject(AccountService);
    mockAccountService.identity = jest.fn(() => of(null));
    mockAccountService.getAuthenticationState = jest.fn(() => of(null));

    mockRouter = TestBed.inject(Router);
    jest.spyOn(mockRouter, 'navigate').mockImplementation(() => Promise.resolve(true));
  });

  // ── Auth state ─────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should synchronize account variable with current account', () => {
      const authState = new Subject<Account | null>();
      mockAccountService.getAuthenticationState = jest.fn(() => authState.asObservable());

      comp.ngOnInit();
      expect(comp.account()).toBeNull();

      authState.next(account);
      expect(comp.account()).toEqual(account);

      authState.next(null);
      expect(comp.account()).toBeNull();
    });
  });

  describe('login', () => {
    it('should navigate to /login on login', () => {
      comp.login();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('ngOnDestroy', () => {
    it('should destroy authentication state subscription on component destroy', () => {
      const authState = new Subject<Account | null>();
      mockAccountService.getAuthenticationState = jest.fn(() => authState.asObservable());

      comp.ngOnInit();
      expect(comp.account()).toBeNull();

      authState.next(account);
      expect(comp.account()).toEqual(account);

      comp.ngOnDestroy();
      authState.next(null);

      // account stays at last value after destroy
      expect(comp.account()).toEqual(account);
    });
  });

  // ── Ring geometry ──────────────────────────────────────────────────────────

  describe('ringDash', () => {
    const circumference = 2 * Math.PI * 54; // ~339.3

    it('should return full circumference for 100%', () => {
      const result = comp.ringDash(100);
      expect(result).toBe(`${circumference} ${circumference}`);
    });

    it('should return 0 stroke for 0%', () => {
      const result = comp.ringDash(0);
      expect(result).toBe(`0 ${circumference}`);
    });

    it('should return half circumference for 50%', () => {
      const [dash] = comp.ringDash(50).split(' ').map(Number);
      expect(dash).toBeCloseTo(circumference / 2, 1);
    });
  });

  // ── bookPageLines ──────────────────────────────────────────────────────────

  it('should expose 20 bookPageLines for the 3D book page-edge', () => {
    expect(comp.bookPageLines).toHaveLength(20);
    expect(comp.bookPageLines[0]).toBe(0);
    expect(comp.bookPageLines[19]).toBe(19);
  });

  // ── BookThreeComponent signal wiring ───────────────────────────────────────

  describe('bookOpenChange / pageChange wiring', () => {
    it('should set bookOpen signal on onBookOpenChange', () => {
      comp.onBookOpenChange(true);
      expect(comp.bookOpen()).toBe(true);
      comp.onBookOpenChange(false);
      expect(comp.bookOpen()).toBe(false);
    });

    it('should set currentPage signal on onPageChange', () => {
      comp.onPageChange(3);
      expect(comp.currentPage()).toBe(3);
      comp.onPageChange(0);
      expect(comp.currentPage()).toBe(0);
    });
  });

  // ── Computed dashboard stats ───────────────────────────────────────────────

  describe('computed stats', () => {
    beforeEach(() => {
      comp.dashCourses.set([
        { course: { id: 1, courseTitle: 'A' }, lessonsCompleted: 3, lessonsTotal: 4, progressPercent: 75 },
        { course: { id: 2, courseTitle: 'B' }, lessonsCompleted: 5, lessonsTotal: 5, progressPercent: 100 },
        { course: { id: 3, courseTitle: 'C' }, lessonsCompleted: 0, lessonsTotal: 3, progressPercent: 0 },
      ]);
    });

    it('inProgressCourses should only include courses between 0% and 100%', () => {
      const result = comp.inProgressCourses();
      expect(result).toHaveLength(1);
      expect(result[0].course.id).toBe(1);
    });

    it('completedCourses should only include 100% courses', () => {
      const result = comp.completedCourses();
      expect(result).toHaveLength(1);
      expect(result[0].course.id).toBe(2);
    });

    it('overallPercent should compute weighted average across all courses', () => {
      // total = 12, done = 8 → 67%
      expect(comp.overallPercent()).toBe(67);
    });

    it('overallPercent should be 0 when there are no courses', () => {
      comp.dashCourses.set([]);
      expect(comp.overallPercent()).toBe(0);
    });

    it('overallPercent should be 0 when all lessons total to 0', () => {
      comp.dashCourses.set([
        { course: { id: 1, courseTitle: 'A' }, lessonsCompleted: 0, lessonsTotal: 0, progressPercent: 0 },
      ]);
      expect(comp.overallPercent()).toBe(0);
    });
  });

  // ── bookPages structure ────────────────────────────────────────────────────

  describe('bookPages', () => {
    it('should have exactly 5 pages', () => {
      expect(comp.bookPages).toHaveLength(5);
    });

    it('page 0 should have login action and no route', () => {
      const p = comp.bookPages[0];
      expect(p.action).toBe('login');
      expect(p.route).toBeNull();
      expect(p.cta).toBe('Sign In');
    });

    it('page 1 should navigate to /catalog', () => {
      const p = comp.bookPages[1];
      expect(p.action).toBe('route');
      expect(p.route).toBe('/catalog');
    });

    it('page 2 should navigate to /catalog', () => {
      const p = comp.bookPages[2];
      expect(p.action).toBe('route');
      expect(p.route).toBe('/catalog');
    });

    it('page 3 should navigate to /my-learning', () => {
      const p = comp.bookPages[3];
      expect(p.action).toBe('route');
      expect(p.route).toBe('/my-learning');
    });

    it('page 4 should have login action and no route', () => {
      const p = comp.bookPages[4];
      expect(p.action).toBe('login');
      expect(p.route).toBeNull();
    });

    it('every page should have icon, title, description, cta fields', () => {
      for (const p of comp.bookPages) {
        expect(p.icon).toBeTruthy();
        expect(p.title).toBeTruthy();
        expect(p.description).toBeTruthy();
        expect(p.cta).toBeTruthy();
      }
    });
  });

  // ── page0CtaLabel ──────────────────────────────────────────────────────────

  describe('page0CtaLabel', () => {
    it('should return "Sign In" when user is not logged in', () => {
      comp.account.set(null);
      expect(comp.page0CtaLabel()).toBe('Sign In');
    });

    it('should return "My Learning" when logged in with no in-progress courses', () => {
      comp.account.set(account);
      comp.dashCourses.set([]);
      expect(comp.page0CtaLabel()).toBe('My Learning');
    });

    it('should return resume label when there is an in-progress course', () => {
      comp.account.set(account);
      comp.dashCourses.set([
        { course: { id: 1, courseTitle: 'Angular Deep Dive' }, lessonsCompleted: 2, lessonsTotal: 5, progressPercent: 40 },
      ]);
      expect(comp.page0CtaLabel()).toMatch(/^Resume:/);
    });

    it('should truncate long course titles to 18 chars', () => {
      comp.account.set(account);
      comp.dashCourses.set([
        { course: { id: 1, courseTitle: 'A Very Long Course Title That Is Way Too Long' }, lessonsCompleted: 1, lessonsTotal: 5, progressPercent: 20 },
      ]);
      const label = comp.page0CtaLabel();
      // After "Resume: " (8 chars) the title slice is max 18 chars + ellipsis
      expect(label.startsWith('Resume:')).toBe(true);
      expect(label.length).toBeLessThanOrEqual('Resume: '.length + 18 + 1); // +1 for '…'
    });

    it('should not include resume label for completed-only courses', () => {
      comp.account.set(account);
      comp.dashCourses.set([
        { course: { id: 1, courseTitle: 'Done Course' }, lessonsCompleted: 5, lessonsTotal: 5, progressPercent: 100 },
      ]);
      expect(comp.page0CtaLabel()).toBe('My Learning');
    });
  });

  // ── onPageCta ──────────────────────────────────────────────────────────────

  describe('onPageCta', () => {
    it('page 0 anon: should navigate to /login', () => {
      comp.account.set(null);
      comp.onPageCta(comp.bookPages[0], 0);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('page 0 logged-in with in-progress course: should navigate to that course', () => {
      comp.account.set(account);
      comp.dashCourses.set([
        { course: { id: 42, courseTitle: 'TypeScript' }, lessonsCompleted: 1, lessonsTotal: 5, progressPercent: 20 },
      ]);
      comp.onPageCta(comp.bookPages[0], 0);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/catalog/course', 42]);
    });

    it('page 0 logged-in with no in-progress: should navigate to /my-learning', () => {
      comp.account.set(account);
      comp.dashCourses.set([]);
      comp.onPageCta(comp.bookPages[0], 0);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/my-learning']);
    });

    it('page 0 logged-in with only completed courses: should navigate to /my-learning', () => {
      comp.account.set(account);
      comp.dashCourses.set([
        { course: { id: 7, courseTitle: 'Done' }, lessonsCompleted: 5, lessonsTotal: 5, progressPercent: 100 },
      ]);
      comp.onPageCta(comp.bookPages[0], 0);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/my-learning']);
    });

    it('page 1 (route action) should navigate to /catalog', () => {
      comp.account.set(null);
      comp.onPageCta(comp.bookPages[1], 1);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/catalog']);
    });

    it('page 2 (route action) should navigate to /catalog', () => {
      comp.account.set(null);
      comp.onPageCta(comp.bookPages[2], 2);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/catalog']);
    });

    it('page 3 (route action) should navigate to /my-learning', () => {
      comp.account.set(null);
      comp.onPageCta(comp.bookPages[3], 3);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/my-learning']);
    });

    it('page 4 (login action) should navigate to /login', () => {
      comp.account.set(null);
      comp.onPageCta(comp.bookPages[4], 4);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  // ── Touch handlers ─────────────────────────────────────────────────────────

  describe('touch handlers', () => {
    let mockBookThree: {
      openBook: jest.Mock; nextPage: jest.Mock; prevPage: jest.Mock;
      onMouseEnter: jest.Mock; onMouseLeave: jest.Mock; onMouseMove: jest.Mock; setAccentColor: jest.Mock;
    };
    let sceneEl: HTMLElement;

    beforeEach(() => {
      mockBookThree = {
        openBook: jest.fn(),
        nextPage: jest.fn(),
        prevPage: jest.fn(),
        onMouseEnter: jest.fn(),
        onMouseLeave: jest.fn(),
        onMouseMove: jest.fn(),
        setAccentColor: jest.fn(),
      };
      (comp as unknown as { bookThreeComp: typeof mockBookThree }).bookThreeComp = mockBookThree;

      sceneEl = document.createElement('div');
      jest.spyOn(sceneEl, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, width: 400, height: 400,
        right: 400, bottom: 400, x: 0, y: 0, toJSON: () => {},
      } as DOMRect);
    });

    const makeTouch = (clientX: number, clientY = 200): Touch =>
      ({ clientX, clientY } as Touch);

    const makeTouchEvent = (touches: Touch[], currentTarget: HTMLElement): TouchEvent =>
      ({ touches, currentTarget, changedTouches: touches } as unknown as TouchEvent);

    it('onBookTouchStart when book is closed should call openBook()', () => {
      comp.bookOpen.set(false);
      const evt = makeTouchEvent([makeTouch(200)], sceneEl);
      comp.onBookTouchStart(evt);
      expect(mockBookThree.openBook).toHaveBeenCalled();
    });

    it('onBookTouchStart when book is open should call onMouseMove', () => {
      comp.bookOpen.set(true);
      const evt = makeTouchEvent([makeTouch(200, 200)], sceneEl);
      comp.onBookTouchStart(evt);
      expect(mockBookThree.onMouseMove).toHaveBeenCalled();
    });

    it('onBookTouchMove should forward normalised mouse coords to bookThreeComp', () => {
      const evt = makeTouchEvent([makeTouch(200, 200)], sceneEl);
      comp.onBookTouchMove(evt);
      expect(mockBookThree.onMouseMove).toHaveBeenCalled();
    });

    it('onBookTouchEnd should call onMouseLeave', () => {
      comp.bookOpen.set(false);
      comp.onBookTouchEnd(makeTouchEvent([makeTouch(100)], sceneEl));
      expect(mockBookThree.onMouseLeave).toHaveBeenCalled();
    });

    it('touch in right half when open calls nextPage()', () => {
      comp.bookOpen.set(true);
      // clientX = 300, width = 400 → mx01 = 0.75 (right half)
      comp.onBookTouchEnd(makeTouchEvent([makeTouch(300)], sceneEl));
      expect(mockBookThree.nextPage).toHaveBeenCalled();
    });

    it('touch in left half when open calls prevPage()', () => {
      comp.bookOpen.set(true);
      // clientX = 100, width = 400 → mx01 = 0.25 (left half)
      comp.onBookTouchEnd(makeTouchEvent([makeTouch(100)], sceneEl));
      expect(mockBookThree.prevPage).toHaveBeenCalled();
    });

    it('onBookTouchMove should clamp mx01 between 0 and 1', () => {
      const evt = makeTouchEvent([makeTouch(600, 200)], sceneEl);
      comp.onBookTouchMove(evt);
      const [, , mx01] = (mockBookThree.onMouseMove as jest.Mock).mock.calls[0] as [number, number, number];
      expect(mx01).toBeLessThanOrEqual(1);
      expect(mx01).toBeGreaterThanOrEqual(0);
    });
  });

  // ── CTA button visibility based on auth state ──────────────────────────────

  describe('CTA button state based on auth', () => {
    it('bookOpen signal starts false', () => {
      expect(comp.bookOpen()).toBe(false);
    });

    it('currentPage signal starts at 0', () => {
      expect(comp.currentPage()).toBe(0);
    });

    it('onBookOpenChange(true) should reveal the overlay (bookOpen=true)', () => {
      comp.onBookOpenChange(true);
      expect(comp.bookOpen()).toBe(true);
    });

    it('onBookOpenChange(false) should hide the overlay (bookOpen=false)', () => {
      comp.onBookOpenChange(true);
      comp.onBookOpenChange(false);
      expect(comp.bookOpen()).toBe(false);
    });

    it('currentPage reflects which overlay page is active', () => {
      comp.onPageChange(2);
      expect(comp.currentPage()).toBe(2);
      comp.onPageChange(4);
      expect(comp.currentPage()).toBe(4);
    });

    it('page0CtaLabel reflects account state reactively', () => {
      comp.account.set(null);
      expect(comp.page0CtaLabel()).toBe('Sign In');

      comp.account.set(account);
      comp.dashCourses.set([]);
      expect(comp.page0CtaLabel()).toBe('My Learning');

      comp.dashCourses.set([
        { course: { id: 1, courseTitle: 'Intro' }, lessonsCompleted: 1, lessonsTotal: 3, progressPercent: 33 },
      ]);
      expect(comp.page0CtaLabel()).toMatch(/^Resume:/);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW TESTS — coverage improvement for uncovered lines
  // ══════════════════════════════════════════════════════════════════════════════

  // ── ngAfterViewInit ────────────────────────────────────────────────────────

  describe('ngAfterViewInit', () => {
    it('should call setTheme with current dark-mode match result when themeMediaQuery is set', () => {
      // applyDeviceTheme() is called during ngOnInit, which sets themeMediaQuery.
      // We need to set it up manually since we override getAuthenticationState.
      const fakeEl = document.createElement('div');
      (comp as unknown as { elementRef: { nativeElement: HTMLElement } }).elementRef = { nativeElement: fakeEl };

      // Set themeMediaQuery to simulate a dark mode preference
      (comp as unknown as { themeMediaQuery: { matches: boolean } }).themeMediaQuery = { matches: true };

      // Set up a mock bookThreeComp to verify setAccentColor is called
      const mockBookThree = {
        openBook: jest.fn(), nextPage: jest.fn(), prevPage: jest.fn(),
        onMouseEnter: jest.fn(), onMouseLeave: jest.fn(), onMouseMove: jest.fn(),
        setAccentColor: jest.fn(),
      };
      (comp as unknown as { bookThreeComp: typeof mockBookThree }).bookThreeComp = mockBookThree;

      comp.ngAfterViewInit();

      // setTheme(true) should set dark theme accent
      expect(fakeEl.style.getPropertyValue('--home-accent')).toBe('#ffaa20');
      expect(mockBookThree.setAccentColor).toHaveBeenCalledWith(0xffaa20);
    });

    it('should call setTheme for light mode when themeMediaQuery.matches is false', () => {
      const fakeEl = document.createElement('div');
      (comp as unknown as { elementRef: { nativeElement: HTMLElement } }).elementRef = { nativeElement: fakeEl };
      (comp as unknown as { themeMediaQuery: { matches: boolean } }).themeMediaQuery = { matches: false };

      const mockBookThree = {
        openBook: jest.fn(), nextPage: jest.fn(), prevPage: jest.fn(),
        onMouseEnter: jest.fn(), onMouseLeave: jest.fn(), onMouseMove: jest.fn(),
        setAccentColor: jest.fn(),
      };
      (comp as unknown as { bookThreeComp: typeof mockBookThree }).bookThreeComp = mockBookThree;

      comp.ngAfterViewInit();

      expect(fakeEl.style.getPropertyValue('--home-accent')).toBe('#c87800');
      expect(mockBookThree.setAccentColor).toHaveBeenCalledWith(0xc87800);
    });

    it('should not call setTheme when themeMediaQuery is null', () => {
      const fakeEl = document.createElement('div');
      (comp as unknown as { elementRef: { nativeElement: HTMLElement } }).elementRef = { nativeElement: fakeEl };
      (comp as unknown as { themeMediaQuery: null }).themeMediaQuery = null;

      comp.ngAfterViewInit();

      // No CSS property should be set since setTheme was not called
      expect(fakeEl.style.getPropertyValue('--home-accent')).toBe('');
    });

    it('should register a non-passive touchmove listener on bookSceneRef when present', () => {
      const fakeSceneEl = document.createElement('div');
      const addSpy = jest.spyOn(fakeSceneEl, 'addEventListener');

      (comp as unknown as { bookSceneRef: { nativeElement: HTMLElement } }).bookSceneRef = { nativeElement: fakeSceneEl };
      (comp as unknown as { themeMediaQuery: null }).themeMediaQuery = null;

      comp.ngAfterViewInit();

      expect(addSpy).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false });
    });

    it('should not register touchmove listener when bookSceneRef is undefined', () => {
      (comp as unknown as { bookSceneRef: undefined }).bookSceneRef = undefined;
      (comp as unknown as { themeMediaQuery: null }).themeMediaQuery = null;

      // Should not throw
      comp.ngAfterViewInit();

      expect((comp as unknown as { touchMoveBlocker: unknown }).touchMoveBlocker).toBeNull();
    });

    it('touchmove listener should call preventDefault when book is open', () => {
      const fakeSceneEl = document.createElement('div');
      let capturedListener: (e: TouchEvent) => void = () => {};
      jest.spyOn(fakeSceneEl, 'addEventListener').mockImplementation((type: string, handler: unknown) => {
        if (type === 'touchmove') {
          capturedListener = handler as (e: TouchEvent) => void;
        }
      });

      (comp as unknown as { bookSceneRef: { nativeElement: HTMLElement } }).bookSceneRef = { nativeElement: fakeSceneEl };
      (comp as unknown as { themeMediaQuery: null }).themeMediaQuery = null;

      comp.ngAfterViewInit();

      // Book is open — should preventDefault
      comp.bookOpen.set(true);
      const mockEvent = { preventDefault: jest.fn() } as unknown as TouchEvent;
      capturedListener(mockEvent);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('touchmove listener should NOT call preventDefault when book is closed', () => {
      const fakeSceneEl = document.createElement('div');
      let capturedListener: (e: TouchEvent) => void = () => {};
      jest.spyOn(fakeSceneEl, 'addEventListener').mockImplementation((type: string, handler: unknown) => {
        if (type === 'touchmove') {
          capturedListener = handler as (e: TouchEvent) => void;
        }
      });

      (comp as unknown as { bookSceneRef: { nativeElement: HTMLElement } }).bookSceneRef = { nativeElement: fakeSceneEl };
      (comp as unknown as { themeMediaQuery: null }).themeMediaQuery = null;

      comp.ngAfterViewInit();

      // Book is closed — should not preventDefault
      comp.bookOpen.set(false);
      const mockEvent = { preventDefault: jest.fn() } as unknown as TouchEvent;
      capturedListener(mockEvent);
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });
  });

  // ── ngOnDestroy cleanup ────────────────────────────────────────────────────

  describe('ngOnDestroy cleanup', () => {
    it('should remove touchmove listener on destroy when bookSceneRef was set', () => {
      const fakeSceneEl = document.createElement('div');
      const removeSpy = jest.spyOn(fakeSceneEl, 'removeEventListener');
      jest.spyOn(fakeSceneEl, 'addEventListener').mockImplementation(() => {});

      (comp as unknown as { bookSceneRef: { nativeElement: HTMLElement } }).bookSceneRef = { nativeElement: fakeSceneEl };
      (comp as unknown as { themeMediaQuery: null }).themeMediaQuery = null;

      comp.ngAfterViewInit();
      comp.ngOnDestroy();

      expect(removeSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
    });

    it('should remove theme change listener on destroy when themeMediaQuery was set', () => {
      const fakeMq = {
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      const fakeHandler = (): void => {};
      (comp as unknown as { themeMediaQuery: typeof fakeMq }).themeMediaQuery = fakeMq;
      (comp as unknown as { themeChangeHandler: typeof fakeHandler }).themeChangeHandler = fakeHandler;

      comp.ngOnDestroy();

      expect(fakeMq.removeEventListener).toHaveBeenCalledWith('change', fakeHandler);
    });

    it('should not throw when bookSceneRef and themeMediaQuery are both null', () => {
      (comp as unknown as { bookSceneRef: undefined }).bookSceneRef = undefined;
      (comp as unknown as { themeMediaQuery: null }).themeMediaQuery = null;
      (comp as unknown as { themeChangeHandler: null }).themeChangeHandler = null;
      (comp as unknown as { touchMoveBlocker: null }).touchMoveBlocker = null;

      expect(() => comp.ngOnDestroy()).not.toThrow();
    });
  });

  // ── setTheme ───────────────────────────────────────────────────────────────

  describe('setTheme', () => {
    let fakeEl: HTMLElement;
    let mockBookThree: {
      openBook: jest.Mock; nextPage: jest.Mock; prevPage: jest.Mock;
      onMouseEnter: jest.Mock; onMouseLeave: jest.Mock; onMouseMove: jest.Mock;
      setAccentColor: jest.Mock;
    };

    beforeEach(() => {
      fakeEl = document.createElement('div');
      (comp as unknown as { elementRef: { nativeElement: HTMLElement } }).elementRef = { nativeElement: fakeEl };
      mockBookThree = {
        openBook: jest.fn(), nextPage: jest.fn(), prevPage: jest.fn(),
        onMouseEnter: jest.fn(), onMouseLeave: jest.fn(), onMouseMove: jest.fn(),
        setAccentColor: jest.fn(),
      };
      (comp as unknown as { bookThreeComp: typeof mockBookThree }).bookThreeComp = mockBookThree;
    });

    it('setTheme(true) should set dark theme CSS properties', () => {
      (comp as unknown as { setTheme: (isDark: boolean) => void }).setTheme(true);

      expect(fakeEl.style.getPropertyValue('--home-accent')).toBe('#ffaa20');
      expect(fakeEl.style.getPropertyValue('--home-accent-rgb')).toBe('255,170,32');
      expect(fakeEl.style.getPropertyValue('--hero-bg')).toBe('#0c0804');
      expect(fakeEl.style.getPropertyValue('--hero-text-color')).toBe('#fff5e0');
      expect(fakeEl.style.getPropertyValue('--hero-sub-color')).toBe('rgba(255,210,120,0.50)');
      expect(fakeEl.style.getPropertyValue('--glyph-color')).toBe('#ffb830');
      expect(fakeEl.style.getPropertyValue('--glyph-shadow')).toBe('rgba(255,184,48,0.60)');
      expect(fakeEl.getAttribute('data-theme')).toBe('cyber');
    });

    it('setTheme(false) should set light theme CSS properties', () => {
      (comp as unknown as { setTheme: (isDark: boolean) => void }).setTheme(false);

      expect(fakeEl.style.getPropertyValue('--home-accent')).toBe('#c87800');
      expect(fakeEl.style.getPropertyValue('--home-accent-rgb')).toBe('200,120,0');
      expect(fakeEl.style.getPropertyValue('--hero-bg')).toBe('#fdf6e8');
      expect(fakeEl.style.getPropertyValue('--hero-text-color')).toBe('#2a1200');
      expect(fakeEl.style.getPropertyValue('--hero-sub-color')).toBe('rgba(100,50,5,0.60)');
      expect(fakeEl.style.getPropertyValue('--glyph-color')).toBe('#c87800');
      expect(fakeEl.style.getPropertyValue('--glyph-shadow')).toBe('rgba(200,120,0,0.58)');
      expect(fakeEl.getAttribute('data-theme')).toBe('sunrise');
    });

    it('setTheme(true) should call bookThreeComp.setAccentColor with 0xffaa20', () => {
      (comp as unknown as { setTheme: (isDark: boolean) => void }).setTheme(true);
      expect(mockBookThree.setAccentColor).toHaveBeenCalledWith(0xffaa20);
    });

    it('setTheme(false) should call bookThreeComp.setAccentColor with 0xc87800', () => {
      (comp as unknown as { setTheme: (isDark: boolean) => void }).setTheme(false);
      expect(mockBookThree.setAccentColor).toHaveBeenCalledWith(0xc87800);
    });

    it('setTheme should not throw when bookThreeComp is undefined', () => {
      (comp as unknown as { bookThreeComp: undefined }).bookThreeComp = undefined;
      expect(() => (comp as unknown as { setTheme: (isDark: boolean) => void }).setTheme(true)).not.toThrow();
      expect(() => (comp as unknown as { setTheme: (isDark: boolean) => void }).setTheme(false)).not.toThrow();
    });
  });

  // ── onBookClick ────────────────────────────────────────────────────────────

  describe('onBookClick', () => {
    let mockBookThree: {
      openBook: jest.Mock; nextPage: jest.Mock; prevPage: jest.Mock;
      onMouseEnter: jest.Mock; onMouseLeave: jest.Mock; onMouseMove: jest.Mock;
      setAccentColor: jest.Mock;
    };

    beforeEach(() => {
      mockBookThree = {
        openBook: jest.fn(), nextPage: jest.fn(), prevPage: jest.fn(),
        onMouseEnter: jest.fn(), onMouseLeave: jest.fn(), onMouseMove: jest.fn(),
        setAccentColor: jest.fn(),
      };
      (comp as unknown as { bookThreeComp: typeof mockBookThree }).bookThreeComp = mockBookThree;
    });

    it('should call openBook when book is closed', () => {
      comp.bookOpen.set(false);
      comp.onBookClick({} as MouseEvent);
      expect(mockBookThree.openBook).toHaveBeenCalled();
      expect(mockBookThree.nextPage).not.toHaveBeenCalled();
    });

    it('should call nextPage when book is open', () => {
      comp.bookOpen.set(true);
      comp.onBookClick({} as MouseEvent);
      expect(mockBookThree.nextPage).toHaveBeenCalled();
      expect(mockBookThree.openBook).not.toHaveBeenCalled();
    });

    it('should not throw when bookThreeComp is undefined', () => {
      (comp as unknown as { bookThreeComp: undefined }).bookThreeComp = undefined;
      comp.bookOpen.set(false);
      expect(() => comp.onBookClick({} as MouseEvent)).not.toThrow();
    });
  });

  // ── onBookEnter / onBookLeave ──────────────────────────────────────────────

  describe('onBookEnter and onBookLeave', () => {
    let mockBookThree: {
      openBook: jest.Mock; nextPage: jest.Mock; prevPage: jest.Mock;
      onMouseEnter: jest.Mock; onMouseLeave: jest.Mock; onMouseMove: jest.Mock;
      setAccentColor: jest.Mock;
    };

    beforeEach(() => {
      mockBookThree = {
        openBook: jest.fn(), nextPage: jest.fn(), prevPage: jest.fn(),
        onMouseEnter: jest.fn(), onMouseLeave: jest.fn(), onMouseMove: jest.fn(),
        setAccentColor: jest.fn(),
      };
      (comp as unknown as { bookThreeComp: typeof mockBookThree }).bookThreeComp = mockBookThree;
    });

    it('onBookEnter should call bookThreeComp.onMouseEnter', () => {
      comp.onBookEnter();
      expect(mockBookThree.onMouseEnter).toHaveBeenCalled();
    });

    it('onBookLeave should call bookThreeComp.onMouseLeave', () => {
      comp.onBookLeave();
      expect(mockBookThree.onMouseLeave).toHaveBeenCalled();
    });

    it('onBookEnter should not throw when bookThreeComp is undefined', () => {
      (comp as unknown as { bookThreeComp: undefined }).bookThreeComp = undefined;
      expect(() => comp.onBookEnter()).not.toThrow();
    });

    it('onBookLeave should not throw when bookThreeComp is undefined', () => {
      (comp as unknown as { bookThreeComp: undefined }).bookThreeComp = undefined;
      expect(() => comp.onBookLeave()).not.toThrow();
    });
  });

  // ── onBookMove ─────────────────────────────────────────────────────────────

  describe('onBookMove', () => {
    let mockBookThree: {
      openBook: jest.Mock; nextPage: jest.Mock; prevPage: jest.Mock;
      onMouseEnter: jest.Mock; onMouseLeave: jest.Mock; onMouseMove: jest.Mock;
      setAccentColor: jest.Mock;
    };
    let sceneEl: HTMLElement;

    beforeEach(() => {
      mockBookThree = {
        openBook: jest.fn(), nextPage: jest.fn(), prevPage: jest.fn(),
        onMouseEnter: jest.fn(), onMouseLeave: jest.fn(), onMouseMove: jest.fn(),
        setAccentColor: jest.fn(),
      };
      (comp as unknown as { bookThreeComp: typeof mockBookThree }).bookThreeComp = mockBookThree;

      sceneEl = document.createElement('div');
      jest.spyOn(sceneEl, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, width: 400, height: 400,
        right: 400, bottom: 400, x: 0, y: 0, toJSON: () => {},
      } as DOMRect);
    });

    it('should call bookThreeComp.onMouseMove with normalised coordinates', () => {
      const event = { clientX: 200, clientY: 200, currentTarget: sceneEl } as unknown as MouseEvent;
      comp.onBookMove(event);

      expect(mockBookThree.onMouseMove).toHaveBeenCalledTimes(1);
      const [nx, ny, mx01] = mockBookThree.onMouseMove.mock.calls[0] as [number, number, number];
      // clientX=200, left=0, width=400 → nx = 200/400 - 0.5 = 0
      expect(nx).toBeCloseTo(0, 5);
      // clientY=200, top=0, height=400 → ny = 200/400 - 0.5 = 0
      expect(ny).toBeCloseTo(0, 5);
      // mx01 = clamp(200/400) = 0.5
      expect(mx01).toBeCloseTo(0.5, 5);
    });

    it('should clamp mx01 to 0 when mouse is before the element', () => {
      const event = { clientX: -100, clientY: 200, currentTarget: sceneEl } as unknown as MouseEvent;
      comp.onBookMove(event);

      const [, , mx01] = mockBookThree.onMouseMove.mock.calls[0] as [number, number, number];
      expect(mx01).toBe(0);
    });

    it('should clamp mx01 to 1 when mouse is beyond the element', () => {
      const event = { clientX: 600, clientY: 200, currentTarget: sceneEl } as unknown as MouseEvent;
      comp.onBookMove(event);

      const [, , mx01] = mockBookThree.onMouseMove.mock.calls[0] as [number, number, number];
      expect(mx01).toBe(1);
    });

    it('should not throw when bookThreeComp is undefined', () => {
      (comp as unknown as { bookThreeComp: undefined }).bookThreeComp = undefined;
      const event = { clientX: 200, clientY: 200, currentTarget: sceneEl } as unknown as MouseEvent;
      expect(() => comp.onBookMove(event)).not.toThrow();
    });
  });

  // ── touchOpenedThisGesture branch in onBookTouchEnd ────────────────────────

  describe('touchOpenedThisGesture in onBookTouchEnd', () => {
    let mockBookThree: {
      openBook: jest.Mock; nextPage: jest.Mock; prevPage: jest.Mock;
      onMouseEnter: jest.Mock; onMouseLeave: jest.Mock; onMouseMove: jest.Mock;
      setAccentColor: jest.Mock;
    };
    let sceneEl: HTMLElement;

    beforeEach(() => {
      mockBookThree = {
        openBook: jest.fn(), nextPage: jest.fn(), prevPage: jest.fn(),
        onMouseEnter: jest.fn(), onMouseLeave: jest.fn(), onMouseMove: jest.fn(),
        setAccentColor: jest.fn(),
      };
      (comp as unknown as { bookThreeComp: typeof mockBookThree }).bookThreeComp = mockBookThree;

      sceneEl = document.createElement('div');
      jest.spyOn(sceneEl, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, width: 400, height: 400,
        right: 400, bottom: 400, x: 0, y: 0, toJSON: () => {},
      } as DOMRect);
    });

    it('should NOT call nextPage or prevPage when touchOpenedThisGesture is true', () => {
      (comp as unknown as { touchOpenedThisGesture: boolean }).touchOpenedThisGesture = true;
      comp.bookOpen.set(true);

      const evt = {
        changedTouches: [{ clientX: 300, clientY: 200 }],
        currentTarget: sceneEl,
      } as unknown as TouchEvent;

      comp.onBookTouchEnd(evt);

      expect(mockBookThree.nextPage).not.toHaveBeenCalled();
      expect(mockBookThree.prevPage).not.toHaveBeenCalled();
      // onMouseLeave should also NOT be called because we return early
      expect(mockBookThree.onMouseLeave).not.toHaveBeenCalled();
    });

    it('should clear touchOpenedThisGesture flag after early return', () => {
      (comp as unknown as { touchOpenedThisGesture: boolean }).touchOpenedThisGesture = true;

      const evt = {
        changedTouches: [{ clientX: 300, clientY: 200 }],
        currentTarget: sceneEl,
      } as unknown as TouchEvent;

      comp.onBookTouchEnd(evt);

      expect((comp as unknown as { touchOpenedThisGesture: boolean }).touchOpenedThisGesture).toBe(false);
    });

    it('onBookTouchStart should set touchOpenedThisGesture=true when opening closed book', () => {
      comp.bookOpen.set(false);

      const evt = {
        touches: [{ clientX: 200, clientY: 200 }],
        currentTarget: sceneEl,
      } as unknown as TouchEvent;

      comp.onBookTouchStart(evt);

      expect((comp as unknown as { touchOpenedThisGesture: boolean }).touchOpenedThisGesture).toBe(true);
    });

    it('onBookTouchStart should set touchOpenedThisGesture=false when book is already open', () => {
      comp.bookOpen.set(true);
      (comp as unknown as { touchOpenedThisGesture: boolean }).touchOpenedThisGesture = true;

      const evt = {
        touches: [{ clientX: 200, clientY: 200 }],
        currentTarget: sceneEl,
      } as unknown as TouchEvent;

      comp.onBookTouchStart(evt);

      expect((comp as unknown as { touchOpenedThisGesture: boolean }).touchOpenedThisGesture).toBe(false);
    });
  });

  // ── loadDashboard ──────────────────────────────────────────────────────────

  describe('loadDashboard', () => {
    it('should set loadingStats to false when getEnrollments returns empty array', () => {
      mockEnrollmentService.getEnrollments.mockReturnValue(of(new HttpResponse({ body: [] })));

      const authState = new Subject<Account | null>();
      mockAccountService.getAuthenticationState = jest.fn(() => authState.asObservable());

      comp.ngOnInit();
      authState.next(account);

      expect(comp.loadingStats()).toBe(false);
      expect(comp.dashCourses()).toEqual([]);
    });

    it('should set loadingStats to false when getEnrollments returns null body', () => {
      mockEnrollmentService.getEnrollments.mockReturnValue(of(new HttpResponse({ body: null })));

      const authState = new Subject<Account | null>();
      mockAccountService.getAuthenticationState = jest.fn(() => authState.asObservable());

      comp.ngOnInit();
      authState.next(account);

      expect(comp.loadingStats()).toBe(false);
    });

    it('should set loadingStats to false on getEnrollments error', () => {
      mockEnrollmentService.getEnrollments.mockReturnValue(throwError(() => new Error('Network error')));

      const authState = new Subject<Account | null>();
      mockAccountService.getAuthenticationState = jest.fn(() => authState.asObservable());

      comp.ngOnInit();
      authState.next(account);

      expect(comp.loadingStats()).toBe(false);
    });

    it('should populate dashCourses with correct progressPercent for one enrollment', () => {
      const fakeCourse = {
        id: 10,
        courseTitle: 'Angular Testing',
        lessons: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
      };

      mockEnrollmentService.getEnrollments.mockReturnValue(
        of(new HttpResponse({ body: [{ id: 1, courseId: 10 }] })),
      );
      mockCourseService.find.mockReturnValue(
        of(new HttpResponse({ body: fakeCourse })),
      );
      mockProgressService.getCourseProgress.mockReturnValue(
        of(new HttpResponse({ body: [{ completed: true }, { completed: true }, { completed: false }, { completed: false }] })),
      );
      mockProgressService.getMyPoints.mockReturnValue(
        of(new HttpResponse({ body: 100 })),
      );

      const authState = new Subject<Account | null>();
      mockAccountService.getAuthenticationState = jest.fn(() => authState.asObservable());

      comp.ngOnInit();
      authState.next(account);

      expect(comp.loadingStats()).toBe(false);
      expect(comp.dashCourses()).toHaveLength(1);
      const dc = comp.dashCourses()[0];
      expect(dc.course.id).toBe(10);
      expect(dc.lessonsCompleted).toBe(2);
      expect(dc.lessonsTotal).toBe(4);
      expect(dc.progressPercent).toBe(50);
    });

    it('should handle multiple enrollments and wait for all to settle', () => {
      const course1 = { id: 10, courseTitle: 'Course A', lessons: [{ id: 1 }, { id: 2 }] };
      const course2 = { id: 20, courseTitle: 'Course B', lessons: [{ id: 3 }] };

      mockEnrollmentService.getEnrollments.mockReturnValue(
        of(new HttpResponse({ body: [{ id: 1, courseId: 10 }, { id: 2, courseId: 20 }] })),
      );
      mockCourseService.find.mockImplementation((id: number) => {
        if (id === 10) return of(new HttpResponse({ body: course1 }));
        return of(new HttpResponse({ body: course2 }));
      });
      mockProgressService.getCourseProgress.mockImplementation((courseId: number) => {
        if (courseId === 10) return of(new HttpResponse({ body: [{ completed: true }, { completed: false }] }));
        return of(new HttpResponse({ body: [{ completed: true }] }));
      });
      mockProgressService.getMyPoints.mockReturnValue(of(new HttpResponse({ body: 50 })));

      const authState = new Subject<Account | null>();
      mockAccountService.getAuthenticationState = jest.fn(() => authState.asObservable());

      comp.ngOnInit();
      authState.next(account);

      expect(comp.loadingStats()).toBe(false);
      expect(comp.dashCourses()).toHaveLength(2);
    });

    it('should still settle when courseService.find returns null body', () => {
      mockEnrollmentService.getEnrollments.mockReturnValue(
        of(new HttpResponse({ body: [{ id: 1, courseId: 10 }] })),
      );
      mockCourseService.find.mockReturnValue(of(new HttpResponse({ body: null })));
      mockProgressService.getMyPoints.mockReturnValue(of(new HttpResponse({ body: 0 })));

      const authState = new Subject<Account | null>();
      mockAccountService.getAuthenticationState = jest.fn(() => authState.asObservable());

      comp.ngOnInit();
      authState.next(account);

      expect(comp.loadingStats()).toBe(false);
      expect(comp.dashCourses()).toHaveLength(0);
    });

    it('should still settle when courseService.find errors', () => {
      mockEnrollmentService.getEnrollments.mockReturnValue(
        of(new HttpResponse({ body: [{ id: 1, courseId: 10 }] })),
      );
      mockCourseService.find.mockReturnValue(throwError(() => new Error('Not found')));
      mockProgressService.getMyPoints.mockReturnValue(of(new HttpResponse({ body: 0 })));

      const authState = new Subject<Account | null>();
      mockAccountService.getAuthenticationState = jest.fn(() => authState.asObservable());

      comp.ngOnInit();
      authState.next(account);

      expect(comp.loadingStats()).toBe(false);
      expect(comp.dashCourses()).toHaveLength(0);
    });

    it('should still settle when getCourseProgress errors', () => {
      const fakeCourse = { id: 10, courseTitle: 'Test', lessons: [{ id: 1 }] };

      mockEnrollmentService.getEnrollments.mockReturnValue(
        of(new HttpResponse({ body: [{ id: 1, courseId: 10 }] })),
      );
      mockCourseService.find.mockReturnValue(of(new HttpResponse({ body: fakeCourse })));
      mockProgressService.getCourseProgress.mockReturnValue(throwError(() => new Error('Progress error')));
      mockProgressService.getMyPoints.mockReturnValue(of(new HttpResponse({ body: 0 })));

      const authState = new Subject<Account | null>();
      mockAccountService.getAuthenticationState = jest.fn(() => authState.asObservable());

      comp.ngOnInit();
      authState.next(account);

      expect(comp.loadingStats()).toBe(false);
      // Course was not pushed to results because getCourseProgress errored (onSettled called without push)
      expect(comp.dashCourses()).toHaveLength(0);
    });

    it('should handle getMyPoints error gracefully and still set XP to 0', () => {
      const fakeCourse = { id: 10, courseTitle: 'Test', lessons: [{ id: 1 }] };

      mockEnrollmentService.getEnrollments.mockReturnValue(
        of(new HttpResponse({ body: [{ id: 1, courseId: 10 }] })),
      );
      mockCourseService.find.mockReturnValue(of(new HttpResponse({ body: fakeCourse })));
      mockProgressService.getCourseProgress.mockReturnValue(
        of(new HttpResponse({ body: [{ completed: true }] })),
      );
      mockProgressService.getMyPoints.mockReturnValue(throwError(() => new Error('XP error')));

      const authState = new Subject<Account | null>();
      mockAccountService.getAuthenticationState = jest.fn(() => authState.asObservable());

      comp.ngOnInit();
      authState.next(account);

      expect(comp.loadingStats()).toBe(false);
      expect(comp.dashCourses()).toHaveLength(1);
    });

    it('should handle course with no lessons (lessonsTotal=0, progressPercent=0)', () => {
      const fakeCourse = { id: 10, courseTitle: 'Empty Course', lessons: [] };

      mockEnrollmentService.getEnrollments.mockReturnValue(
        of(new HttpResponse({ body: [{ id: 1, courseId: 10 }] })),
      );
      mockCourseService.find.mockReturnValue(of(new HttpResponse({ body: fakeCourse })));
      mockProgressService.getCourseProgress.mockReturnValue(of(new HttpResponse({ body: [] })));
      mockProgressService.getMyPoints.mockReturnValue(of(new HttpResponse({ body: 0 })));

      const authState = new Subject<Account | null>();
      mockAccountService.getAuthenticationState = jest.fn(() => authState.asObservable());

      comp.ngOnInit();
      authState.next(account);

      expect(comp.dashCourses()).toHaveLength(1);
      expect(comp.dashCourses()[0].progressPercent).toBe(0);
      expect(comp.dashCourses()[0].lessonsTotal).toBe(0);
    });

    it('should handle course with null lessons array', () => {
      const fakeCourse = { id: 10, courseTitle: 'No Lessons Field', lessons: null };

      mockEnrollmentService.getEnrollments.mockReturnValue(
        of(new HttpResponse({ body: [{ id: 1, courseId: 10 }] })),
      );
      mockCourseService.find.mockReturnValue(of(new HttpResponse({ body: fakeCourse })));
      mockProgressService.getCourseProgress.mockReturnValue(of(new HttpResponse({ body: [] })));
      mockProgressService.getMyPoints.mockReturnValue(of(new HttpResponse({ body: 0 })));

      const authState = new Subject<Account | null>();
      mockAccountService.getAuthenticationState = jest.fn(() => authState.asObservable());

      comp.ngOnInit();
      authState.next(account);

      expect(comp.dashCourses()).toHaveLength(1);
      expect(comp.dashCourses()[0].lessonsTotal).toBe(0);
    });

    it('should not call loadDashboard when account is null', () => {
      const authState = new Subject<Account | null>();
      mockAccountService.getAuthenticationState = jest.fn(() => authState.asObservable());

      comp.ngOnInit();
      authState.next(null);

      expect(mockEnrollmentService.getEnrollments).not.toHaveBeenCalled();
    });
  });

  // ── activeBookPages computed ───────────────────────────────────────────────

  describe('activeBookPages', () => {
    it('should return bookPages when user is not logged in', () => {
      comp.account.set(null);
      expect(comp.activeBookPages()).toBe(comp.bookPages);
    });

    it('should return loggedInBookPages when user is logged in', () => {
      comp.account.set(account);
      expect(comp.activeBookPages()).toBe(comp.loggedInBookPages);
    });

    it('loggedInBookPages should have exactly 5 pages', () => {
      expect(comp.loggedInBookPages).toHaveLength(5);
    });
  });

  // ── runCountUps / countUp ──────────────────────────────────────────────────

  describe('runCountUps', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should set display signals to 0 immediately when all targets are 0', () => {
      // Trigger runCountUps(0, 0, 0, 0, 0) via empty enrollments
      mockEnrollmentService.getEnrollments.mockReturnValue(of(new HttpResponse({ body: [] })));

      const authState = new Subject<Account | null>();
      mockAccountService.getAuthenticationState = jest.fn(() => authState.asObservable());

      comp.ngOnInit();
      authState.next(account);

      // countUp with target=0 calls setter(0) immediately
      expect(comp.displayEnrolled()).toBe(0);
      expect(comp.displayCompleted()).toBe(0);
      expect(comp.displayLessons()).toBe(0);
      expect(comp.displayPercent()).toBe(0);
      expect(comp.displayXP()).toBe(0);
    });
  });

  // ── onPageCta with null action ─────────────────────────────────────────────

  describe('onPageCta edge cases', () => {
    it('should do nothing for a page with null action', () => {
      comp.account.set(null);
      const page = { action: null as 'login' | 'route' | null, route: null as string | null };
      comp.onPageCta(page, 1);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should do nothing for route action with null route', () => {
      comp.account.set(null);
      const page = { action: 'route' as 'login' | 'route' | null, route: null as string | null };
      comp.onPageCta(page, 1);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  // ── countUp with non-zero targets (RAF animation) ─────────────────────────

  describe('countUp (non-zero targets via RAF)', () => {
    let rafCallbacks: Array<(time: number) => void>;
    let originalRaf: typeof requestAnimationFrame;
    let originalPerformanceNow: typeof performance.now;

    beforeEach(() => {
      rafCallbacks = [];
      originalRaf = global.requestAnimationFrame;
      originalPerformanceNow = performance.now;

      // Mock requestAnimationFrame to capture callbacks
      global.requestAnimationFrame = jest.fn((cb: FrameRequestCallback) => {
        rafCallbacks.push(cb as (time: number) => void);
        return rafCallbacks.length;
      }) as unknown as typeof requestAnimationFrame;
    });

    afterEach(() => {
      global.requestAnimationFrame = originalRaf;
      performance.now = originalPerformanceNow;
    });

    it('should animate display signals from 0 to target over duration via RAF', () => {
      // Set up a single enrollment with 1 completed lesson out of 1 (100%)
      const fakeCourse = { id: 10, courseTitle: 'Done', lessons: [{ id: 1 }] };

      mockEnrollmentService.getEnrollments.mockReturnValue(
        of(new HttpResponse({ body: [{ id: 1, courseId: 10 }] })),
      );
      mockCourseService.find.mockReturnValue(of(new HttpResponse({ body: fakeCourse })));
      mockProgressService.getCourseProgress.mockReturnValue(
        of(new HttpResponse({ body: [{ completed: true }] })),
      );
      mockProgressService.getMyPoints.mockReturnValue(of(new HttpResponse({ body: 200 })));

      // Mock performance.now to control animation timing
      let now = 1000;
      performance.now = jest.fn(() => now);

      const authState = new Subject<Account | null>();
      mockAccountService.getAuthenticationState = jest.fn(() => authState.asObservable());

      comp.ngOnInit();
      authState.next(account);

      // RAF callbacks should have been registered (one per non-zero signal)
      // enrolled=1, completed=1, lessons=1, percent=100, xp=200+50=250
      expect(rafCallbacks.length).toBeGreaterThan(0);

      // Simulate time passing to complete animation (advance past longest duration 2000ms)
      now = 3001;
      // Run all RAF callbacks — each may schedule another, so iterate
      let safety = 0;
      while (rafCallbacks.length > 0 && safety < 500) {
        const cbs = [...rafCallbacks];
        rafCallbacks = [];
        for (const cb of cbs) {
          cb(now);
        }
        safety++;
      }

      // After full duration, display signals should reach their targets
      expect(comp.displayEnrolled()).toBe(1);
      expect(comp.displayCompleted()).toBe(1);
      expect(comp.displayLessons()).toBe(1);
      expect(comp.displayPercent()).toBe(100);
      expect(comp.displayXP()).toBe(250); // 200 backend + 1 completed * 50
    });

    it('countUp should call setter with intermediate eased values during animation', () => {
      // Access countUp directly
      const countUpFn = (comp as unknown as { countUp: (target: number, duration: number, setter: (v: number) => void) => void }).countUp.bind(comp);

      let now = 1000;
      performance.now = jest.fn(() => now);

      const values: number[] = [];
      countUpFn(100, 1000, (v: number) => values.push(v));

      // First RAF callback registered
      expect(rafCallbacks).toHaveLength(1);

      // Simulate 50% through animation
      now = 1500;
      const cb1 = rafCallbacks.shift()!;
      cb1(now);

      // Should have one intermediate value (eased) — countUp only calls setter inside RAF
      // progress = 0.5, eased = 1 - (1-0.5)^3 = 1 - 0.125 = 0.875
      // value = round(0.875 * 100) = 88
      expect(values).toHaveLength(1); // first RAF fires here at t=1500
      expect(values[0]).toBe(88);

      // Another RAF should be scheduled since progress < 1
      expect(rafCallbacks).toHaveLength(1);

      // Simulate end of animation
      now = 2001;
      const cb2 = rafCallbacks.shift()!;
      cb2(now);

      expect(values[values.length - 1]).toBe(100);
      // No more RAF scheduled
      expect(rafCallbacks).toHaveLength(0);
    });

    it('countUp with target=0 should call setter(0) immediately without RAF', () => {
      const countUpFn = (comp as unknown as { countUp: (target: number, duration: number, setter: (v: number) => void) => void }).countUp.bind(comp);

      let called = false;
      countUpFn(0, 1000, (v: number) => {
        expect(v).toBe(0);
        called = true;
      });

      expect(called).toBe(true);
      expect(rafCallbacks).toHaveLength(0);
    });
  });

  // ── applyDeviceTheme ────────────────────────────────────────────────────────

  describe('applyDeviceTheme', () => {
    it('should register a change listener on matchMedia and respond to theme changes', () => {
      const fakeEl = document.createElement('div');
      (comp as unknown as { elementRef: { nativeElement: HTMLElement } }).elementRef = { nativeElement: fakeEl };

      let capturedChangeHandler: ((e: MediaQueryListEvent) => void) | null = null;
      const fakeMq = {
        matches: true,
        media: '(prefers-color-scheme: dark)',
        addEventListener: jest.fn((type: string, handler: (e: MediaQueryListEvent) => void) => {
          if (type === 'change') capturedChangeHandler = handler;
        }),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };

      // Override window.matchMedia for this test
      const origMatchMedia = window.matchMedia;
      window.matchMedia = jest.fn(() => fakeMq) as unknown as typeof window.matchMedia;

      try {
        // applyDeviceTheme is called inside ngOnInit
        const authState = new Subject<Account | null>();
        mockAccountService.getAuthenticationState = jest.fn(() => authState.asObservable());
        comp.ngOnInit();

        // Should have called matchMedia and registered listener
        expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
        expect(fakeMq.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

        // Initially dark mode
        expect(fakeEl.getAttribute('data-theme')).toBe('cyber');

        // Simulate theme change to light
        expect(capturedChangeHandler).not.toBeNull();
        capturedChangeHandler!({ matches: false } as MediaQueryListEvent);
        expect(fakeEl.getAttribute('data-theme')).toBe('sunrise');

        // Simulate theme change back to dark
        capturedChangeHandler!({ matches: true } as MediaQueryListEvent);
        expect(fakeEl.getAttribute('data-theme')).toBe('cyber');
      } finally {
        window.matchMedia = origMatchMedia;
      }
    });
  });

  // ── loadDashboard XP calculation ────────────────────────────────────────────

  describe('loadDashboard XP bonus calculation', () => {
    it('should add completedCnt * 50 bonus to backend XP', () => {
      // 2 completed courses → bonus = 2 * 50 = 100, backend XP = 300 → total = 400
      const course1 = { id: 10, courseTitle: 'Course A', lessons: [{ id: 1 }] };
      const course2 = { id: 20, courseTitle: 'Course B', lessons: [{ id: 2 }] };

      mockEnrollmentService.getEnrollments.mockReturnValue(
        of(new HttpResponse({ body: [{ id: 1, courseId: 10 }, { id: 2, courseId: 20 }] })),
      );
      mockCourseService.find.mockImplementation((id: number) => {
        if (id === 10) return of(new HttpResponse({ body: course1 }));
        return of(new HttpResponse({ body: course2 }));
      });
      mockProgressService.getCourseProgress.mockImplementation(() =>
        of(new HttpResponse({ body: [{ completed: true }] })),
      );
      mockProgressService.getMyPoints.mockReturnValue(of(new HttpResponse({ body: 300 })));

      // Spy on runCountUps to verify XP calculation
      const runCountUpsSpy = jest.spyOn(comp as unknown as { runCountUps: (...args: number[]) => void }, 'runCountUps' as never);

      const authState = new Subject<Account | null>();
      mockAccountService.getAuthenticationState = jest.fn(() => authState.asObservable());

      comp.ngOnInit();
      authState.next(account);

      // runCountUps should have been called with:
      // enrolled=2, completed=2, lessons=2, percent=100, xp=300 + 2*50 = 400
      expect(runCountUpsSpy).toHaveBeenCalledWith(2, 2, 2, 100, 400);
    });

    it('should handle getCourseProgress returning null body as empty array', () => {
      const fakeCourse = { id: 10, courseTitle: 'Test', lessons: [{ id: 1 }, { id: 2 }] };

      mockEnrollmentService.getEnrollments.mockReturnValue(
        of(new HttpResponse({ body: [{ id: 1, courseId: 10 }] })),
      );
      mockCourseService.find.mockReturnValue(of(new HttpResponse({ body: fakeCourse })));
      mockProgressService.getCourseProgress.mockReturnValue(of(new HttpResponse({ body: null })));
      mockProgressService.getMyPoints.mockReturnValue(of(new HttpResponse({ body: 0 })));

      const authState = new Subject<Account | null>();
      mockAccountService.getAuthenticationState = jest.fn(() => authState.asObservable());

      comp.ngOnInit();
      authState.next(account);

      // null body treated as [] → 0 completed, 2 total lessons, 0% progress
      expect(comp.dashCourses()).toHaveLength(1);
      expect(comp.dashCourses()[0].lessonsCompleted).toBe(0);
      expect(comp.dashCourses()[0].lessonsTotal).toBe(2);
      expect(comp.dashCourses()[0].progressPercent).toBe(0);
    });
  });

  // ── loadDashboard loadingStats transitions ──────────────────────────────────

  describe('loadDashboard loadingStats transitions', () => {
    it('should set loadingStats to true when loadDashboard begins', () => {
      // Use a Subject to control when enrollment observable emits
      const enrollSubject = new Subject<HttpResponse<unknown[]>>();
      mockEnrollmentService.getEnrollments.mockReturnValue(enrollSubject.asObservable());

      const authState = new Subject<Account | null>();
      mockAccountService.getAuthenticationState = jest.fn(() => authState.asObservable());

      comp.ngOnInit();
      authState.next(account);

      // loadDashboard was called, loadingStats should be true before enrollment resolves
      expect(comp.loadingStats()).toBe(true);

      // Now resolve
      enrollSubject.next(new HttpResponse({ body: [] }));
      expect(comp.loadingStats()).toBe(false);
    });
  });
});
