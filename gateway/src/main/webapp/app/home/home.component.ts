import { Component, ElementRef, NgZone, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
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
export default class HomeComponent implements OnInit, OnDestroy {
  account = signal<Account | null>(null);

  // Raw data
  dashCourses = signal<DashCourse[]>([]);
  loadingStats = signal(true);

  // Animated display values (count-up)
  displayEnrolled   = signal(0);
  displayCompleted  = signal(0);
  displayLessons    = signal(0);
  displayPercent    = signal(0);
  displayXP         = signal(0);

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

  // ── 3D Book ────────────────────────────────────────────────────────────────
  readonly bookPageLines = Array.from({ length: 20 }, (_, i) => i);
  private readonly bookTiltRaw = signal({ x: 0, y: 0 });

  /** Combined perspective + base tilt + mouse-driven tilt for book-scene */
  bookTransform = computed(() => {
    const { x, y } = this.bookTiltRaw();
    return `perspective(900px) rotateX(${5 + x}deg) rotateY(${-22 + y}deg)`;
  });

  private readonly destroy$ = new Subject<void>();
  private readonly accountService    = inject(AccountService);
  private readonly enrollmentService = inject(UserCourseEnrollmentService);
  private readonly progressService   = inject(UserLessonProgressService);
  private readonly courseService     = inject(CourseService);
  private readonly router            = inject(Router);
  private readonly ngZone            = inject(NgZone);
  private readonly elementRef        = inject(ElementRef);

  ngOnInit(): void {
    this.applyTimeTheme();
    this.accountService
      .getAuthenticationState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(account => {
        this.account.set(account);
        if (account !== null) {
          this.loadDashboard();
        }
      });
  }

  login(): void {
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Time-based accent colour ───────────────────────────────────────────────
  private applyTimeTheme(): void {
    const hour   = new Date().getHours();
    const isDay  = hour >= 6 && hour < 20;
    const accent    = isDay ? '#FF6B35' : '#BF40FF';
    const accentRgb = isDay ? '255,107,53' : '191,64,255';
    const el = this.elementRef.nativeElement as HTMLElement;
    el.style.setProperty('--home-accent',     accent);
    el.style.setProperty('--home-accent-rgb', accentRgb);
  }

  // ── Book mouse parallax ────────────────────────────────────────────────────
  onBookMove(event: MouseEvent): void {
    const el   = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const nx   = (event.clientX - rect.left) / rect.width  - 0.5; // -0.5 → 0.5
    const ny   = (event.clientY - rect.top)  / rect.height - 0.5;
    this.bookTiltRaw.set({ x: ny * -14, y: nx * 22 });
  }

  onBookLeave(): void {
    this.bookTiltRaw.set({ x: 0, y: 0 });
  }

  // ── Ring geometry helper ───────────────────────────────────────────────────
  ringDash(percent: number): string {
    const circumference = 2 * Math.PI * 54;
    return `${(percent / 100) * circumference} ${circumference}`;
  }

  // ── Data loading ───────────────────────────────────────────────────────────
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
                      lessonsTotal: totalLessons,
                      progressPercent: totalLessons > 0 ? Math.round((done / totalLessons) * 100) : 0,
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

  // ── Animated count-up ──────────────────────────────────────────────────────
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
