import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild, inject, signal, computed } from '@angular/core';
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
import { ScrollThreeComponent } from './scroll-three.component';

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
  imports: [SharedModule, RouterModule, HasAnyAuthorityDirective, ScrollThreeComponent],
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
    const all   = this.dashCourses();
    if (all.length === 0) return 0;
    const total = all.reduce((s, dc) => s + dc.lessonsTotal, 0);
    const done  = all.reduce((s, dc) => s + dc.lessonsCompleted, 0);
    return total > 0 ? Math.round((done / total) * 100) : 0;
  });

  // ── 3D Book ───────────────────────────────────────────────────────────────
  readonly bookPageLines = Array.from({ length: 20 }, (_, i) => i);
  readonly maxPages      = 5;

  /** Content shown in the HTML overlay panel per page turn */
  readonly bookPages = [
    {
      icon: '📖',
      title: 'Open Your Journey',
      description: 'Turn the pages to discover everything Learn With Hamster has to offer.',
      cta: 'Sign In',
      route: null as string | null,
      action: 'login' as 'login' | 'route' | null,
    },
    {
      icon: '🎓',
      title: 'Explore Disciplines',
      description: 'Browse Sport, Music, Technology and more — curated courses for every level.',
      cta: 'Browse Catalog',
      route: '/catalog' as string | null,
      action: 'route' as 'login' | 'route' | null,
    },
    {
      icon: '🗺️',
      title: 'Guided Programs',
      description: 'Follow structured learning paths designed to take you from novice to expert.',
      cta: 'Explore Programs',
      route: '/catalog' as string | null,
      action: 'route' as 'login' | 'route' | null,
    },
    {
      icon: '⚡',
      title: 'Earn XP & Track Progress',
      description: 'Every lesson you complete earns XP. Watch your stats grow in real time.',
      cta: 'My Learning',
      route: '/my-learning' as string | null,
      action: 'route' as 'login' | 'route' | null,
    },
    {
      icon: '🚀',
      title: 'Start Learning Today',
      description: 'Create your account and begin your first lesson in under two minutes.',
      cta: 'Get Started',
      route: null as string | null,
      action: 'login' as 'login' | 'route' | null,
    },
  ];

  /** Book pages for authenticated users — focus on learning continuation. */
  readonly loggedInBookPages = [
    {
      icon: '▶️',
      title: 'Continue Learning',
      description: 'Pick up where you left off — your progress is saved.',
      cta: 'Resume Course',
      route: null as string | null,
      action: 'login' as 'login' | 'route' | null,
    },
    {
      icon: '🎓',
      title: 'Explore Catalog',
      description: 'Browse new disciplines, courses, and lessons to keep growing.',
      cta: 'Browse Catalog',
      route: '/catalog' as string | null,
      action: 'route' as 'login' | 'route' | null,
    },
    {
      icon: '📊',
      title: 'Track Progress',
      description: 'See your XP, completed lessons, and overall learning progress.',
      cta: 'My Learning',
      route: '/my-learning' as string | null,
      action: 'route' as 'login' | 'route' | null,
    },
    {
      icon: '⚡',
      title: 'Earn More XP',
      description: 'Every lesson you finish earns XP. Keep your streak going!',
      cta: 'View Progress',
      route: '/my-learning' as string | null,
      action: 'route' as 'login' | 'route' | null,
    },
    {
      icon: '🏆',
      title: 'Achievements',
      description: 'Complete courses to unlock achievements and celebrate milestones.',
      cta: 'My Learning',
      route: '/my-learning' as string | null,
      action: 'route' as 'login' | 'route' | null,
    },
  ];

  /** Active page set — auth-aware */
  readonly activeBookPages = computed(() => this.account() !== null ? this.loggedInBookPages : this.bookPages);

  bookOpen    = signal(false);
  currentPage = signal(0);

  @ViewChild('scrollThreeComp') private bookThreeComp?: ScrollThreeComponent;
  @ViewChild('bookScene')    private bookSceneRef?: ElementRef<HTMLDivElement>;

  // ── Touch interaction state ────────────────────────────────────────────────
  // Tracks whether the current touch gesture was the one that opened the book.
  // Prevents the single-tap race: touchstart opens → touchend immediately navigates.
  private touchOpenedThisGesture = false;
  // Non-passive touchmove listener registered in ngAfterViewInit to prevent scroll.
  private touchMoveBlocker: ((e: TouchEvent) => void) | null = null;

  // ── Theme (device preference) ─────────────────────────────────────────────
  private themeMediaQuery:    MediaQueryList | null = null;
  private themeChangeHandler: ((e: MediaQueryListEvent) => void) | null = null;

  private readonly destroy$          = new Subject<void>();
  private readonly accountService    = inject(AccountService);
  private readonly enrollmentService = inject(UserCourseEnrollmentService);
  private readonly progressService   = inject(UserLessonProgressService);
  private readonly courseService     = inject(CourseService);
  private readonly router            = inject(Router);
  private readonly ngZone            = inject(NgZone);
  private readonly elementRef        = inject(ElementRef);

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

  ngAfterViewInit(): void {
    // Re-apply device theme now that @ViewChild('bookThreeComp') is resolved.
    // applyDeviceTheme() runs in ngOnInit before the view is ready, so
    // setAccentColor() gets dropped. Calling setTheme() here ensures the
    // accent light colour matches the OS colour scheme on first render.
    const mq = this.themeMediaQuery;
    if (mq) this.setTheme(mq.matches);

    // Register a non-passive touchmove listener so we can call preventDefault()
    // and block page scroll while the user is interacting with the book.
    // Angular template bindings are passive by default in modern browsers,
    // so (touchmove) alone cannot prevent scrolling.
    if (this.bookSceneRef) {
      this.touchMoveBlocker = (e: TouchEvent): void => {
        if (this.bookOpen()) e.preventDefault();
      };
      this.ngZone.runOutsideAngular(() => {
        this.bookSceneRef!.nativeElement.addEventListener('touchmove', this.touchMoveBlocker!, { passive: false });
      });
    }
  }

  login(): void {
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.themeMediaQuery && this.themeChangeHandler) {
      this.themeMediaQuery.removeEventListener('change', this.themeChangeHandler);
    }
    if (this.bookSceneRef && this.touchMoveBlocker) {
      this.bookSceneRef.nativeElement.removeEventListener('touchmove', this.touchMoveBlocker);
    }
  }

  // ── Device-preference accent colour ──────────────────────────────────────
  private applyDeviceTheme(): void {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    this.themeMediaQuery = mq;
    this.setTheme(mq.matches);
    this.themeChangeHandler = (e: MediaQueryListEvent): void => this.setTheme(e.matches);
    mq.addEventListener('change', this.themeChangeHandler);
  }

  private setTheme(isDark: boolean): void {
    const el = this.elementRef.nativeElement as HTMLElement;
    el.setAttribute('data-theme', isDark ? 'cyber' : 'sunrise');
    if (isDark) {
      el.style.setProperty('--home-accent',     '#ffaa20');
      el.style.setProperty('--home-accent-rgb', '255,170,32');
      el.style.setProperty('--hero-bg',         '#0c0804');
      el.style.setProperty('--hero-text-color', '#fff5e0');
      el.style.setProperty('--hero-sub-color',  'rgba(255,210,120,0.50)');
      el.style.setProperty('--glyph-color',     '#ffb830');
      el.style.setProperty('--glyph-shadow',    'rgba(255,184,48,0.60)');
      this.bookThreeComp?.setAccentColor(0xffaa20);
    } else {
      el.style.setProperty('--home-accent',     '#c87800');
      el.style.setProperty('--home-accent-rgb', '200,120,0');
      el.style.setProperty('--hero-bg',         '#fdf6e8');
      el.style.setProperty('--hero-text-color', '#2a1200');
      el.style.setProperty('--hero-sub-color',  'rgba(100,50,5,0.60)');
      el.style.setProperty('--glyph-color',     '#c87800');
      el.style.setProperty('--glyph-shadow',    'rgba(200,120,0,0.58)');
      this.bookThreeComp?.setAccentColor(0xc87800);
    }
  }

  // ── Book event forwarding ──────────────────────────────────────────────────
  onBookOpenChange(open: boolean): void { this.bookOpen.set(open); }
  onPageChange(page: number): void      { this.currentPage.set(page); }

  onBookEnter(): void { this.bookThreeComp?.onMouseEnter(); }
  onBookLeave(): void { this.bookThreeComp?.onMouseLeave(); }

  /** Click on scroll: open if closed, else advance to the next page (close → reopen). */
  onBookClick(_event: MouseEvent): void {
    if (!this.bookOpen()) {
      this.bookThreeComp?.openBook();
    } else {
      this.bookThreeComp?.nextPage();
    }
  }

  onBookTouchStart(event: TouchEvent): void {
    this.bookThreeComp?.onMouseEnter();
    const touch = event.touches[0];
    const el    = event.currentTarget as HTMLElement;
    const rect  = el.getBoundingClientRect();
    const nx    = (touch.clientX - rect.left) / rect.width  - 0.5;
    const ny    = (touch.clientY - rect.top)  / rect.height - 0.5;
    const mx01  = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    if (!this.bookOpen()) {
      // Opening the book — flag so touchend skips the immediate navigation.
      // Without this a single tap opens AND turns a page AND closes in one gesture.
      this.bookThreeComp?.openBook();
      this.touchOpenedThisGesture = true;
    } else {
      this.touchOpenedThisGesture = false;
      this.bookThreeComp?.onMouseMove(nx, ny, mx01);
    }
  }

  onBookTouchMove(event: TouchEvent): void {
    const touch = event.touches[0];
    const el    = event.currentTarget as HTMLElement;
    const rect  = el.getBoundingClientRect();
    const nx    = (touch.clientX - rect.left) / rect.width  - 0.5;
    const ny    = (touch.clientY - rect.top)  / rect.height - 0.5;
    const mx01  = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    this.bookThreeComp?.onMouseMove(nx, ny, mx01);
  }

  onBookTouchEnd(event: TouchEvent): void {
    // If this touchend belongs to the gesture that just opened the book, skip
    // navigation and close — let the user see the open book before interacting.
    if (this.touchOpenedThisGesture) {
      this.touchOpenedThisGesture = false;
      return;
    }

    const touch = event.changedTouches[0];
    const el    = event.currentTarget as HTMLElement;
    const rect  = el.getBoundingClientRect();
    const mx01  = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    if (this.bookOpen()) {
      if (mx01 > 0.5) {
        this.bookThreeComp?.nextPage();
      } else {
        this.bookThreeComp?.prevPage();
      }
    }
    this.bookThreeComp?.onMouseLeave();
  }

  /** CTA label for page 0 — context-aware (anon vs logged in) */
  page0CtaLabel(): string {
    if (this.account() === null) return 'Sign In';
    const resume = this.inProgressCourses();
    return resume.length > 0
      ? `Resume: ${(resume[0].course.courseTitle ?? '').slice(0, 18).trimEnd()}…`
      : 'My Learning';
  }

  onPageCta(page: { action: 'login' | 'route' | null; route: string | null }, pageIdx: number): void {
    // Page 0 is always context-aware: logged-in users resume their last course
    if (pageIdx === 0 && this.account() !== null) {
      const resume = this.inProgressCourses();
      if (resume.length > 0) {
        this.router.navigate(['/catalog/course', resume[0].course.id]);
      } else {
        this.router.navigate(['/my-learning']);
      }
      return;
    }
    if (page.action === 'login') {
      this.login();
    } else if (page.action === 'route' && page.route) {
      this.router.navigate([page.route]);
    }
  }

  onBookMove(event: MouseEvent): void {
    const el   = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const nx   = (event.clientX - rect.left) / rect.width  - 0.5;
    const ny   = (event.clientY - rect.top)  / rect.height - 0.5;
    const mx01 = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    this.bookThreeComp?.onMouseMove(nx, ny, mx01);
  }

  // ── Ring geometry helper ──────────────────────────────────────────────────
  ringDash(percent: number): string {
    const circumference = 2 * Math.PI * 54;
    return `${(percent / 100) * circumference} ${circumference}`;
  }

  // ── Data loading ──────────────────────────────────────────────────────────
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

  // ── Animated count-up ─────────────────────────────────────────────────────
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
