import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { AccountService } from 'app/core/auth/account.service';
import { LessonService } from 'app/entities/service/lesson/service/lesson.service';
import { ResourceService } from 'app/entities/service/resource/service/resource.service';
import { CourseService } from 'app/entities/service/course/service/course.service';
import { UserLessonProgressService } from 'app/entities/service/user-lesson-progress/service/user-lesson-progress.service';
import { ILesson } from 'app/entities/service/lesson/lesson.model';
import { IResource } from 'app/entities/service/resource/resource.model';
import { ICourse } from 'app/entities/service/course/course.model';

@Component({
  selector: 'jhi-lesson-browse',
  templateUrl: './lesson-browse.component.html',
  styleUrl: './lesson-browse.component.scss',
  imports: [SharedModule, RouterModule],
})
export default class LessonBrowseComponent implements OnInit, OnDestroy {
  lesson = signal<ILesson | null>(null);
  resources = signal<IResource[]>([]);
  primaryResource = signal<IResource | null>(null);
  additionalResources = signal<IResource[]>([]);
  course = signal<ICourse | null>(null);
  courseLessons = signal<ILesson[]>([]);
  safeVideoUrl = signal<SafeResourceUrl | null>(null);
  completedLessonIds = signal<Set<number>>(new Set());
  isAuthenticated = signal(false);
  loading = signal(true);
  sidebarOpen = signal(false);

  progressPercent = computed(() => {
    const total = this.courseLessons().length;
    if (total === 0) return 0;
    return (this.completedLessonIds().size / total) * 100;
  });

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);
  private readonly lessonService = inject(LessonService);
  private readonly resourceService = inject(ResourceService);
  private readonly courseService = inject(CourseService);
  private readonly progressService = inject(UserLessonProgressService);
  private readonly sanitizer = inject(DomSanitizer);

  private paramSub?: Subscription;

  ngOnInit(): void {
    this.accountService.identity().subscribe(account => {
      this.isAuthenticated.set(account !== null);
      if (account !== null) {
        this.subscribeToParams();
      } else {
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
  }

  login(): void {
    this.router.navigate(['/login']);
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  isCurrentLesson(lessonId: number): boolean {
    return this.lesson()?.id === lessonId;
  }

  navigateToLesson(lessonId: number): void {
    const courseId = this.course()?.id;
    this.sidebarOpen.set(false);
    this.router.navigate(['/catalog/lesson', lessonId], {
      queryParams: courseId ? { course: courseId } : {},
    });
  }

  isLessonCompleted(lessonId: number): boolean {
    return this.completedLessonIds().has(lessonId);
  }

  getCurrentLessonIndex(): number {
    const currentId = this.lesson()?.id;
    if (currentId == null) return -1;
    return this.courseLessons().findIndex(l => l.id === currentId);
  }

  private subscribeToParams(): void {
    this.paramSub = this.route.paramMap
      .pipe(switchMap(params => {
        this.loading.set(true);
        const id = Number(params.get('id'));
        return this.lessonService.find(id);
      }))
      .subscribe(res => {
        const lesson = res.body;
        this.lesson.set(lesson);
        if (lesson) {
          this.loadResources(lesson.id);
          this.loadCourseContext(lesson);
          this.recordProgress(lesson.id);
        } else {
          this.loading.set(false);
        }
      });
  }

  private loadResources(lessonId: number): void {
    this.resourceService.query({ size: 1000 }).subscribe(resourceRes => {
      const allResources: IResource[] = resourceRes.body ?? [];
      const filtered = allResources
        .filter(r => r.lesson?.id === lessonId)
        .sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0));
      this.resources.set(filtered);

      // Select primary resource: prefer first VIDEO, else first by weight
      const videoResource = filtered.find(r => r.resourceType === 'VIDEO');
      const primary = videoResource ?? (filtered.length > 0 ? filtered[0] : null);
      this.primaryResource.set(primary);

      // Build safe YouTube URL if primary is a video
      if (primary?.resourceType === 'VIDEO' && primary.resourceURL) {
        const videoId = this.getYouTubeVideoId(primary.resourceURL);
        if (videoId) {
          this.safeVideoUrl.set(
            this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`),
          );
        } else {
          this.safeVideoUrl.set(null);
        }
      } else {
        this.safeVideoUrl.set(null);
      }

      // Additional resources = all except primary
      if (primary) {
        this.additionalResources.set(filtered.filter(r => r.id !== primary.id));
      } else {
        this.additionalResources.set([]);
      }

      this.loading.set(false);
    });
  }

  private recordProgress(lessonId: number): void {
    const courseId = Number(this.route.snapshot.queryParamMap.get('course')) || 0;
    if (courseId > 0) {
      this.progressService.markProgress(lessonId, courseId).subscribe(res => {
        if (res.body?.lessonId) {
          this.completedLessonIds.update(set => {
            const next = new Set(set);
            next.add(res.body!.lessonId!);
            return next;
          });
        }
      });
    }
  }

  private loadCourseContext(lesson: ILesson): void {
    // Try query param first, fall back to lesson's course associations
    const courseIdParam = this.route.snapshot.queryParamMap.get('course');
    const courseId = courseIdParam
      ? Number(courseIdParam)
      : lesson.courses && lesson.courses.length > 0
        ? lesson.courses[0].id
        : null;

    if (courseId == null) {
      this.course.set(null);
      this.courseLessons.set([]);
      return;
    }

    // Load progress data for this course
    this.progressService.getCourseProgress(courseId).subscribe(progressRes => {
      const ids = new Set((progressRes.body ?? []).map(p => p.lessonId).filter((id): id is number => id != null));
      this.completedLessonIds.set(ids);
    });

    this.courseService.find(courseId).subscribe(courseRes => {
      const course = courseRes.body;
      this.course.set(course);

      if (course?.lessons && course.lessons.length > 0) {
        const courseLessonIds = new Set(course.lessons.map(l => l.id));
        this.lessonService.query({ size: 1000 }).subscribe(lessonRes => {
          const allLessons: ILesson[] = lessonRes.body ?? [];
          this.courseLessons.set(allLessons.filter(l => courseLessonIds.has(l.id)));
        });
      } else {
        this.courseLessons.set([]);
      }
    });
  }

  private getYouTubeVideoId(url: string): string | null {
    // Handle youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) return watchMatch[1];
    // Handle youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch) return shortMatch[1];
    return null;
  }
}
