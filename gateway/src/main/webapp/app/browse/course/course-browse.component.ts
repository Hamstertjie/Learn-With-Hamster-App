import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { CurrencyLocalePipe } from '../currency.pipe';
import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { CourseService } from 'app/entities/service/course/service/course.service';
import { LessonService } from 'app/entities/service/lesson/service/lesson.service';
import { ResourceService } from 'app/entities/service/resource/service/resource.service';
import { UserCourseEnrollmentService } from 'app/entities/service/user-course-enrollment/service/user-course-enrollment.service';
import { UserLessonProgressService } from 'app/entities/service/user-lesson-progress/service/user-lesson-progress.service';
import { ICourse } from 'app/entities/service/course/course.model';
import { ILesson } from 'app/entities/service/lesson/lesson.model';
import { IResource } from 'app/entities/service/resource/resource.model';
import { CartService } from 'app/cart/cart.service';
import { ConfettiService } from '../confetti.service';
import { CertificateService } from '../certificate.service';

@Component({
  selector: 'jhi-course-browse',
  templateUrl: './course-browse.component.html',
  styleUrl: './course-browse.component.scss',
  imports: [SharedModule, RouterModule, CurrencyLocalePipe],
})
export default class CourseBrowseComponent implements OnInit {
  course = signal<ICourse | null>(null);
  lessons = signal<ILesson[]>([]);
  resources = signal<IResource[]>([]);
  isAuthenticated = signal(false);
  loading = signal(true);
  expandedLessons = signal<Set<number>>(new Set());
  enrolled = signal(false);
  enrolling = signal(false);
  completedLessonIds = signal<Set<number>>(new Set());
  account = signal<Account | null>(null);

  // Tracks whether both lessons and progress have resolved (needed to detect completion)
  private lessonsLoaded = false;
  private progressLoaded = false;
  private loadedCourseId = 0;

  courseComplete = computed(() => {
    const total = this.lessons().length;
    return total > 0 && this.completedLessonIds().size >= total;
  });

  progressPercent = computed(() => {
    const total = this.lessons().length;
    if (total === 0) return 0;
    return (this.completedLessonIds().size / total) * 100;
  });

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);
  private readonly courseService = inject(CourseService);
  private readonly lessonService = inject(LessonService);
  private readonly resourceService = inject(ResourceService);
  private readonly enrollmentService = inject(UserCourseEnrollmentService);
  private readonly progressService = inject(UserLessonProgressService);
  readonly cartService = inject(CartService);
  private readonly confettiService = inject(ConfettiService);
  private readonly certificateService = inject(CertificateService);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.accountService.identity().subscribe(account => {
      this.isAuthenticated.set(account !== null);
      this.account.set(account);
      if (account !== null) {
        this.loadData(id);
      } else {
        this.loading.set(false);
      }
    });
  }

  login(): void {
    this.router.navigate(['/login']);
  }

  toggleLesson(lessonId: number): void {
    const current = new Set(this.expandedLessons());
    if (current.has(lessonId)) {
      current.delete(lessonId);
    } else {
      current.add(lessonId);
    }
    this.expandedLessons.set(current);
  }

  isLessonExpanded(lessonId: number): boolean {
    return this.expandedLessons().has(lessonId);
  }

  enroll(): void {
    const c = this.course();
    if (!c) return;
    this.enrolling.set(true);
    this.enrollmentService.enroll(c.id).subscribe({
      next: () => {
        this.enrolled.set(true);
        this.enrolling.set(false);
      },
      error: () => {
        this.enrolling.set(false);
      },
    });
  }

  isLessonCompleted(lessonId: number): boolean {
    return this.completedLessonIds().has(lessonId);
  }

  isCourseInCart(): boolean {
    const c = this.course();
    return c ? this.cartService.isInCart(c.id) : false;
  }

  addToCart(): void {
    const c = this.course();
    if (c) {
      this.cartService.addToCart(c.id, c.courseTitle ?? '', c.coursePrice ?? 0);
    }
  }

  get isFree(): boolean {
    const c = this.course();
    return !c?.coursePrice || c.coursePrice <= 0;
  }

  downloadCertificate(): void {
    const c = this.course();
    const acc = this.account();
    if (!c || !acc) return;
    const name = [acc.firstName, acc.lastName].filter(Boolean).join(' ') || acc.login;
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    void this.certificateService.download(c.courseTitle ?? 'Course', name, date);
  }

  private loadData(id: number): void {
    this.loadedCourseId = id;
    this.lessonsLoaded = false;
    this.progressLoaded = false;

    this.courseService.find(id).subscribe(res => {
      this.course.set(res.body);

      const courseLessonIds = new Set((res.body?.lessons ?? []).map(l => l.id));

      this.lessonService.query({ size: 1000 }).subscribe(lessonRes => {
        const allLessons: ILesson[] = lessonRes.body ?? [];
        this.lessons.set(allLessons.filter(l => courseLessonIds.has(l.id)));
        this.lessonsLoaded = true;
        this.maybeFireConfetti();
      });

      this.resourceService.query({ size: 1000 }).subscribe(resourceRes => {
        const allResources: IResource[] = resourceRes.body ?? [];
        this.resources.set(allResources.filter(r => r.course?.id === id));
        this.loading.set(false);
      });
    });

    this.enrollmentService.isEnrolled(id).subscribe(res => {
      this.enrolled.set(res.body === true);
      if (res.body === true) {
        this.progressService.getCourseProgress(id).subscribe(progressRes => {
          const ids = new Set((progressRes.body ?? []).map(p => p.lessonId).filter((lid): lid is number => lid != null));
          this.completedLessonIds.set(ids);
          this.progressLoaded = true;
          this.maybeFireConfetti();
        });
      } else {
        // Not enrolled — progress will never load, mark as resolved so we don't block
        this.progressLoaded = true;
      }
    });
  }

  private maybeFireConfetti(): void {
    if (!this.lessonsLoaded || !this.progressLoaded) return;
    const total = this.lessons().length;
    const completed = this.completedLessonIds().size;
    if (total > 0 && completed >= total) {
      const key = `confetti-${this.loadedCourseId}`;
      const forceTest = this.route.snapshot.queryParamMap.get('confetti') === 'test';
      if (!sessionStorage.getItem(key) || forceTest) {
        if (!forceTest) sessionStorage.setItem(key, '1');
        void this.confettiService.fire();
      }
    }
  }
}
