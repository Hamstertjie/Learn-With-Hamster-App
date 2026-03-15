import { Component, AfterViewInit, ElementRef, NgZone, OnDestroy, OnInit, ViewChild, inject, signal, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import HasAnyAuthorityDirective from 'app/shared/auth/has-any-authority.directive';
import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { UserCourseEnrollmentService } from 'app/entities/service/user-course-enrollment/service/user-course-enrollment.service';
import { UserLessonProgressService } from 'app/entities/service/user-lesson-progress/service/user-lesson-progress.service';
import { CourseService } from 'app/entities/service/course/service/course.service';
import { ICourse } from 'app/entities/service/course/course.model';

export interface DashCourse {
  course: ICourse;
  lessonsCompleted: number;
  lessonsTotal: number;
  progressPercent: number;
}

@Component({
  selector: 'jhi-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [SharedModule, RouterModule, HasAnyAuthorityDirective],
})
export default class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  account = signal<Account | null>(null);

  // Raw data
  dashCourses  = signal<DashCourse[]>([]);
  loadingStats = signal(true);

  // Animated display values (count-up)
  displayEnrolled  = signal(0);
  displayCompleted = signal(0);
  displayLessons   = signal(0);
  displayPercent   = signal(0);
  displayXP        = signal(0);

  // Derived
  inProgressCourses = computed(() => this.dashCourses().filter(dc => dc.progressPercent > 0 && dc.progressPercent < 100));
  completedCourses  = computed(() => this.dashCourses().filter(dc => dc.progressPercent === 100));

  overallPercent = computed(() => {
    const all = this.dashCourses();
    if (all.length === 0) return 0;
    const total = all.reduce((s, dc) => s + dc.lessonsTotal, 0);
    const done  = all.reduce((s, dc) => s + dc.lessonsCompleted, 0);
    return total > 0 ? Math.round((done / total) * 100) : 0;
  });

  // ── 3D Book ──────────────────────────────────────────────────────────────────
  readonly bookPageLines = Array.from({ length: 20 }, (_, i) => i);
  readonly maxPages      = 5;

  bookOpen    = signal(false);
  currentPage = signal(0);

  private bookCloseTimer: ReturnType<typeof setTimeout> | null = null;
  private pageTurnPending = false;

  // ViewChild refs for RAF-driven direct DOM animation
  @ViewChild('bookEl')   private bookEl?:   ElementRef<HTMLElement>;
  @ViewChild('coverEl')  private coverEl?:  ElementRef<HTMLElement>;
  @ViewChild('flipPageEl') private flipPageEl?: ElementRef<HTMLElement>;

  // Spring physics state — Motion.dev style (stiffness / damping / mass)
  private _tiltX    = { value: 0, velocity: 0 };
  private _tiltY    = { value: 0, velocity: 0 };
  private _pageAngle = { value: 0, velocity: 0 };
  private _coverAngle = { value: 0, velocity: 0 };

  // Raw targets set on mouse events (RAF interpolates toward these)
  private _targetTiltX  = 0;
  private _targetTiltY  = 0;
  private _targetMouseX = 0.5;
  private _prevMouseX   = 0.5;

  private _rafId: number | null = null;
  private _lastRafTime = 0;

  // ── Theme (device preference) ────────────────────────────────────────────────
  private themeMediaQuery: MediaQueryList | null = null;
  private themeChangeHandler: ((e: MediaQueryListEvent) => void) | null = null;

  private readonly destroy$          = new Subject<void>();
  private readonly accountService    = inject(AccountService);
  private readonly enrollmentService = inject(UserCourseEnrollmentService);
  private readonly progressService   = inject(UserLessonProgressService);
  private readonly courseService     = inject(CourseService);
  private readonly router            = inject(Router);
  private readonly ngZone            = inject(NgZone);
  private readonly elementRef        = inject(ElementRef);

  ngAfterViewInit(): void {
    this._startRAF();
  }

  ngOnInit(): void {
    this.applyDeviceTheme();
    this.accountService
      .getAuthenticationState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(account => {
        this.account.set(account);
        if (account !== null) this.loadDashboard();
      });
  }

  login(): void {
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._stopRAF();
    if (this.bookCloseTimer) clearTimeout(this.bookCloseTimer);
    if (this.themeMediaQuery && this.themeChangeHandler) {
      this.themeMediaQuery.removeEventListener('change', this.themeChangeHandler);
    }
  }

  // ── Device-preference accent colour ──────────────────────────────────────────
  private applyDeviceTheme(): void {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    this.themeMediaQuery = mq;
    this.setAccent(mq.matches);
    this.themeChangeHandler = (e: MediaQueryListEvent): void => this.setAccent(e.matches);
    mq.addEventListener('change', this.themeChangeHandler);
  }

  private setAccent(isDark: boolean): void {
    const accent    = isDark ? '#BF40FF' : '#FF6B35';
    const accentRgb = isDark ? '191,64,255' : '255,107,53';
    const el        = this.elementRef.nativeElement as HTMLElement;
    el.style.setProperty('--home-accent',     accent);
    el.style.setProperty('--home-accent-rgb', accentRgb);
  }

  // ── Book interactions ─────────────────────────────────────────────────────────
  onBookEnter(): void {
    if (this.bookCloseTimer) {
      clearTimeout(this.bookCloseTimer);
      this.bookCloseTimer = null;
    }
    this.bookOpen.set(true);
    this._startRAF(); // ensure RAF is running (guards against late ViewChild init)
  }

  onBookMove(event: MouseEvent): void {
    const el   = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const nx   = (event.clientX - rect.left) / rect.width  - 0.5;
    const ny   = (event.clientY - rect.top)  / rect.height - 0.5;
    this._targetTiltX = ny * -8;
    this._targetTiltY = nx * 14;

    if (!this.bookOpen()) return;

    const prevMx = this._prevMouseX;
    const mx01   = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    this._targetMouseX = mx01;
    this._prevMouseX   = mx01;

    if (mx01 > 0.65) this.pageTurnPending = true;

    if (this.pageTurnPending && prevMx >= 0.45 && mx01 < 0.45 && this.currentPage() < this.maxPages) {
      this.currentPage.update(p => p + 1);
      this.pageTurnPending = false;
    }
  }

  onBookLeave(): void {
    this._targetTiltX  = 0;
    this._targetTiltY  = 0;
    this._targetMouseX = 0.88; // slight lift — resting page feel
    this.pageTurnPending = false;
    if (this.bookCloseTimer) clearTimeout(this.bookCloseTimer);
    this.bookCloseTimer = setTimeout(() => {
      this.bookOpen.set(false);
      this.currentPage.set(0);
      this._targetMouseX = 0.5;
      this.bookCloseTimer = null;
    }, 4000);
  }

  // ── Spring physics RAF engine (Motion.dev-style) ──────────────────────────────
  private _startRAF(): void {
    if (this._rafId !== null) return;
    this._lastRafTime = performance.now();
    this.ngZone.runOutsideAngular(() => {
      const tick = (now: number): void => {
        const dt = Math.min((now - this._lastRafTime) / 1000, 0.05); // cap at 50 ms
        this._lastRafTime = now;

        // Tilt: overdamped spring → smooth, weighted follow
        this._tiltX = this._spring(this._tiltX, this._targetTiltX, 60, 1.1, dt);
        this._tiltY = this._spring(this._tiltY, this._targetTiltY, 60, 1.1, dt);

        // Page flip: underdamped spring → paper-like overshoot & settle
        const targetAngle = this.bookOpen() ? (1 - this._targetMouseX) * -172 : 0;
        this._pageAngle = this._spring(this._pageAngle, targetAngle, 90, 0.72, dt);

        // Cover open/close: snappy spring with tiny overshoot
        const targetCover = this.bookOpen() ? -158 : 0;
        this._coverAngle = this._spring(this._coverAngle, targetCover, 130, 0.82, dt);

        // Write directly to DOM — bypasses Angular change detection for 60 fps
        const bookEl  = this.bookEl?.nativeElement;
        const flipEl  = this.flipPageEl?.nativeElement;
        const coverEl = this.coverEl?.nativeElement;

        if (bookEl) {
          bookEl.style.transform =
            `perspective(900px) rotateX(${(5 + this._tiltX.value).toFixed(2)}deg) rotateY(${(-22 + this._tiltY.value).toFixed(2)}deg)`;
        }
        if (flipEl) {
          flipEl.style.transform = `translateZ(13px) rotateY(${this._pageAngle.value.toFixed(2)}deg)`;
        }
        if (coverEl) {
          coverEl.style.transform = `translateZ(14px) rotateY(${this._coverAngle.value.toFixed(2)}deg)`;
        }

        this._rafId = requestAnimationFrame(tick);
      };
      this._rafId = requestAnimationFrame(tick);
    });
  }

  private _stopRAF(): void {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  /** Critically-damped spring step (Euler integration, stable for dt ≤ 50 ms) */
  private _spring(
    state: { value: number; velocity: number },
    target: number,
    stiffness: number,
    damping: number,
    dt: number,
  ): { value: number; velocity: number } {
    const c = damping * 2 * Math.sqrt(stiffness); // damping coefficient
    const a = (target - state.value) * stiffness - state.velocity * c;
    const v = state.velocity + a * dt;
    const x = state.value + v * dt;
    return { value: x, velocity: v };
  }

  // ── Ring geometry helper ───────────────────────────────────────────────────────
  ringDash(percent: number): string {
    const circumference = 2 * Math.PI * 54;
    return `${(percent / 100) * circumference} ${circumference}`;
  }

  // ── Data loading ───────────────────────────────────────────────────────────────
  private loadDashboard(): void {
    this.loadingStats.set(true);
    this.enrollmentService.getEnrollments().subscribe({
      next: res => {
        const enrollments = res.body ?? [];
        if (enrollments.length === 0) {
          this.loadingStats.set(false);
          this.runCountUps(0, 0, 0, 0, 0);
          return;
        }

        let settled = 0;
        const results: DashCourse[] = [];
        const total = enrollments.length;

        const onSettled = (): void => {
          settled++;
          if (settled === total) {
            this.dashCourses.set(results);
            this.loadingStats.set(false);
            const totalLessons = results.reduce((s, dc) => s + dc.lessonsTotal, 0);
            const doneLessons  = results.reduce((s, dc) => s + dc.lessonsCompleted, 0);
            const completedCnt = results.filter(dc => dc.progressPercent === 100).length;
            const overallPct   = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
            this.progressService.getMyPoints().subscribe({
              next: xpRes => {
                const backendXP = xpRes.body ?? 0;
                this.runCountUps(total, completedCnt, doneLessons, overallPct, backendXP + completedCnt * 50);
              },
              error: () => this.runCountUps(total, completedCnt, doneLessons, overallPct, 0),
            });
          }
        };

        for (const enrollment of enrollments) {
          const courseId = enrollment.courseId!;
          this.courseService.find(courseId).subscribe({
            next: courseRes => {
              const course = courseRes.body;
              if (course) {
                const totalLessons = course.lessons?.length ?? 0;
                this.progressService.getCourseProgress(courseId).subscribe({
                  next: progressRes => {
                    const done = (progressRes.body ?? []).filter(p => p.completed).length;
                    results.push({
                      course,
                      lessonsCompleted: done,
                      lessonsTotal:     totalLessons,
                      progressPercent:  totalLessons > 0 ? Math.round((done / totalLessons) * 100) : 0,
                    });
                    onSettled();
                  },
                  error: onSettled,
                });
              } else {
                onSettled();
              }
            },
            error: onSettled,
          });
        }
      },
      error: () => { this.loadingStats.set(false); },
    });
  }

  // ── Animated count-up ─────────────────────────────────────────────────────────
  private runCountUps(enrolled: number, completed: number, lessons: number, percent: number, xp: number): void {
    this.ngZone.runOutsideAngular(() => {
      this.countUp(enrolled,  1400, v => this.ngZone.run(() => this.displayEnrolled.set(v)));
      this.countUp(completed, 1400, v => this.ngZone.run(() => this.displayCompleted.set(v)));
      this.countUp(lessons,   1600, v => this.ngZone.run(() => this.displayLessons.set(v)));
      this.countUp(percent,   1800, v => this.ngZone.run(() => this.displayPercent.set(v)));
      this.countUp(xp,        2000, v => this.ngZone.run(() => this.displayXP.set(v)));
    });
  }

  private countUp(target: number, duration: number, setter: (v: number) => void): void {
    if (target === 0) { setter(0); return; }
    const start = performance.now();
    const tick  = (now: number): void => {
      const progress = Math.min((now - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setter(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
