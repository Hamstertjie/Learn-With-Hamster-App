import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { AccountService } from 'app/core/auth/account.service';
import { CourseService } from 'app/entities/service/course/service/course.service';
import { LessonService } from 'app/entities/service/lesson/service/lesson.service';
import { ResourceService } from 'app/entities/service/resource/service/resource.service';
import { UserCourseEnrollmentService } from 'app/entities/service/user-course-enrollment/service/user-course-enrollment.service';
import { ICourse } from 'app/entities/service/course/course.model';
import { ILesson } from 'app/entities/service/lesson/lesson.model';
import { IResource } from 'app/entities/service/resource/resource.model';

@Component({
  selector: 'jhi-course-browse',
  templateUrl: './course-browse.component.html',
  styleUrl: './course-browse.component.scss',
  imports: [SharedModule, RouterModule],
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

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);
  private readonly courseService = inject(CourseService);
  private readonly lessonService = inject(LessonService);
  private readonly resourceService = inject(ResourceService);
  private readonly enrollmentService = inject(UserCourseEnrollmentService);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.accountService.identity().subscribe(account => {
      this.isAuthenticated.set(account !== null);
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

  private loadData(id: number): void {
    this.courseService.find(id).subscribe(res => {
      this.course.set(res.body);

      const courseLessonIds = new Set((res.body?.lessons ?? []).map(l => l.id));

      this.lessonService.query({ size: 1000 }).subscribe(lessonRes => {
        const allLessons: ILesson[] = lessonRes.body ?? [];
        this.lessons.set(allLessons.filter(l => courseLessonIds.has(l.id)));
      });

      this.resourceService.query({ size: 1000 }).subscribe(resourceRes => {
        const allResources: IResource[] = resourceRes.body ?? [];
        this.resources.set(allResources.filter(r => r.course?.id === id));
        this.loading.set(false);
      });
    });

    this.enrollmentService.isEnrolled(id).subscribe(res => {
      this.enrolled.set(res.body === true);
    });
  }
}
