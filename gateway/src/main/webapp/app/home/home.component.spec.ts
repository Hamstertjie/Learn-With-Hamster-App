jest.mock('app/core/auth/account.service');

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';

import HomeComponent from './home.component';

describe('Home Component', () => {
  let comp: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockAccountService: AccountService;
  let mockRouter: Router;
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
    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [AccountService, provideHttpClient(), provideHttpClientTesting()],
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

  // ── Book parallax ──────────────────────────────────────────────────────────

  describe('bookTransform', () => {
    it('should return base perspective with no mouse movement', () => {
      expect(comp.bookTransform()).toBe('perspective(900px) rotateX(5deg) rotateY(-22deg)');
    });

    it('should tilt on mouse move and reset on leave', () => {
      const el = document.createElement('div');
      Object.defineProperty(el, 'getBoundingClientRect', {
        value: () => ({ left: 0, top: 0, width: 200, height: 200 }),
      });

      comp.onBookMove({ currentTarget: el, clientX: 200, clientY: 0 } as any);
      expect(comp.bookTransform()).toContain('rotateY(');

      comp.onBookLeave();
      expect(comp.bookTransform()).toBe('perspective(900px) rotateX(5deg) rotateY(-22deg)');
    });
  });

  // ── bookPageLines ──────────────────────────────────────────────────────────

  it('should expose 20 bookPageLines for the 3D book page-edge', () => {
    expect(comp.bookPageLines).toHaveLength(20);
    expect(comp.bookPageLines[0]).toBe(0);
    expect(comp.bookPageLines[19]).toBe(19);
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
});
