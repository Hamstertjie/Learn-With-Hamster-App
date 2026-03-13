import { Component, HostListener, NgZone, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { AccountService } from 'app/core/auth/account.service';
import { LessonService } from 'app/entities/service/lesson/service/lesson.service';
import { ResourceService } from 'app/entities/service/resource/service/resource.service';
import { CourseService } from 'app/entities/service/course/service/course.service';
import { UserLessonProgressService } from 'app/entities/service/user-lesson-progress/service/user-lesson-progress.service';
import { BookmarkService } from '../bookmark.service';
import { ILesson } from 'app/entities/service/lesson/lesson.model';
import { IResource } from 'app/entities/service/resource/resource.model';
import { ICourse } from 'app/entities/service/course/course.model';

// YouTube IFrame API — loaded dynamically, no npm package needed
declare const YT: any;

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
  completedLessonIds = signal<Set<number>>(new Set());
  isAuthenticated = signal(false);
  loading = signal(true);
  sidebarOpen = signal(false);
  noteText = signal('');

  // ── Watch gate ───────────────────────────────────────────────────────────
  /** True once user has watched ≥90% of the video or video ended */
  videoWatched = signal(false);
  /** True once the 5-second gate for non-video lessons has elapsed */
  nonVideoGateOpen = signal(false);
  /** Percentage of video watched (0–100) */
  watchPercent = signal(0);
  /** True while a mark-complete HTTP request is in flight */
  completing = signal(false);
  /** True after the lesson was just completed in this session */
  justCompleted = signal(false);

  /** Whether the user can now mark this lesson complete */
  canComplete = computed(() => this.videoWatched() || this.nonVideoGateOpen());
  /** Whether the primary resource is a YouTube video */
  hasVideo = computed(() => this.primaryResource()?.resourceType === 'VIDEO' && !!this.primaryResource()?.resourceURL);
  /** Whether the current lesson is already marked complete */
  isCurrentLessonCompleted = computed(() => {
    const id = this.lesson()?.id;
    return id != null ? this.completedLessonIds().has(id) : false;
  });

  progressPercent = computed(() => {
    const total = this.courseLessons().length;
    if (total === 0) return 0;
    return (this.completedLessonIds().size / total) * 100;
  });

  readingTime = computed(() => {
    const desc = this.lesson()?.lessonDescription ?? '';
    const wordCount = desc.split(/\s+/).filter(w => w.length > 0).length;
    const textMinutes = Math.ceil(wordCount / 200);
    const videoCount = this.resources().filter(r => r.resourceType === 'VIDEO').length;
    return Math.max(1, textMinutes + videoCount * 5);
  });

  isBookmarked = computed(() => {
    const id = this.lesson()?.id;
    return id != null ? this.bookmarkService.isBookmarked(id) : false;
  });

  private readonly noteKey = computed(() => {
    const id = this.lesson()?.id;
    return id != null ? `lesson-notes-${id}` : null;
  });

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);
  private readonly lessonService = inject(LessonService);
  private readonly resourceService = inject(ResourceService);
  private readonly courseService = inject(CourseService);
  private readonly progressService = inject(UserLessonProgressService);
  private readonly zone = inject(NgZone);
  readonly bookmarkService = inject(BookmarkService);

  private paramSub?: Subscription;
  private ytPlayer: any = null;
  private currentVideoId: string | null = null;
  private watchInterval: any = null;
  private nonVideoTimer: any = null;

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const tag = (event.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const idx = this.getCurrentLessonIndex();
    if (idx < 0 || this.courseLessons().length === 0) return;
    if (event.key === 'ArrowLeft' && idx > 0) {
      event.preventDefault();
      this.navigateToLesson(this.courseLessons()[idx - 1].id);
    } else if (event.key === 'ArrowRight' && idx < this.courseLessons().length - 1) {
      event.preventDefault();
      this.navigateToLesson(this.courseLessons()[idx + 1].id);
    }
  }

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
    this.destroyYTPlayer();
    this.clearTimers();
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

  saveNote(value: string): void {
    this.noteText.set(value);
    const key = this.noteKey();
    if (key) localStorage.setItem(key, value);
  }

  toggleBookmark(): void {
    const id = this.lesson()?.id;
    if (id != null) this.bookmarkService.toggle(id);
  }

  resourceActionLabel(type: string | null | undefined): string {
    switch (type) {
      case 'VIDEO':    return 'browse.lesson.watchVideo';
      case 'TOOL':     return 'browse.lesson.launchTool';
      case 'TUTORIAL': return 'browse.lesson.startTutorial';
      case 'IMAGE':    return 'browse.lesson.viewImage';
      default:         return 'browse.lesson.openResource';
    }
  }

  /**
   * Mark the current lesson as complete.
   * Called automatically after video ends, or manually via button for non-video lessons.
   */
  markLessonComplete(): void {
    if (!this.canComplete() || this.completing() || this.isCurrentLessonCompleted()) return;
    const lessonId = this.lesson()?.id;
    const courseId = Number(this.route.snapshot.queryParamMap.get('course')) || 0;
    if (!lessonId || courseId <= 0) return;

    this.completing.set(true);
    this.progressService.markProgress(lessonId, courseId).subscribe({
      next: res => {
        if (res.body?.lessonId) {
          this.completedLessonIds.update(set => {
            const next = new Set(set);
            next.add(res.body!.lessonId!);
            return next;
          });
        }
        this.justCompleted.set(true);
        this.completing.set(false);
      },
      error: () => { this.completing.set(false); },
    });
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private loadNote(): void {
    const key = this.noteKey();
    if (key) this.noteText.set(localStorage.getItem(key) ?? '');
  }

  private subscribeToParams(): void {
    this.paramSub = this.route.paramMap
      .pipe(switchMap(params => {
        this.loading.set(true);
        this.resetWatchGate();
        const id = Number(params.get('id'));
        return this.lessonService.find(id);
      }))
      .subscribe({
        next: res => {
          const lesson = res.body;
          this.lesson.set(lesson);
          if (lesson) {
            this.loadNote();
            this.loadResources(lesson.id);
            this.loadCourseContext(lesson);
            this.startLessonRecord(lesson.id);
          } else {
            this.loading.set(false);
          }
        },
        error: () => { this.loading.set(false); },
      });
  }

  private resetWatchGate(): void {
    this.videoWatched.set(false);
    this.nonVideoGateOpen.set(false);
    this.watchPercent.set(0);
    this.justCompleted.set(false);
    this.completing.set(false);
    this.destroyYTPlayer();
    this.clearTimers();
  }

  /** POST /start — records visit without marking complete */
  private startLessonRecord(lessonId: number): void {
    const courseId = Number(this.route.snapshot.queryParamMap.get('course')) || 0;
    if (courseId > 0) {
      this.progressService.startLesson(lessonId, courseId).subscribe();
    }
  }

  private loadResources(lessonId: number): void {
    this.resourceService.query({ size: 1000 }).subscribe({
      next: resourceRes => {
        if (this.lesson()?.id !== lessonId) return;

        const allResources: IResource[] = resourceRes.body ?? [];
        const filtered = allResources
          .filter(r => r.lesson?.id === lessonId)
          .sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0));
        this.resources.set(filtered);

        const videoResource   = filtered.find(r => r.resourceType === 'VIDEO');
        const tutorialResource = filtered.find(r => r.resourceType === 'TUTORIAL');
        const primary = videoResource ?? tutorialResource ?? (filtered.length > 0 ? filtered[0] : null);
        this.primaryResource.set(primary);

        if (primary?.resourceType === 'VIDEO' && primary.resourceURL) {
          const videoId = this.getYouTubeVideoId(primary.resourceURL);
          if (videoId) {
            this.currentVideoId = videoId;
            this.zone.runOutsideAngular(() => this.loadYouTubeAPI(videoId));
          } else {
            // Non-YouTube video URL — fall back to time gate
            this.startNonVideoGate();
          }
        } else {
          // No video — start the 5-second timer gate
          this.startNonVideoGate();
        }

        if (primary) {
          this.additionalResources.set(filtered.filter(r => r.id !== primary.id));
        } else {
          this.additionalResources.set([]);
        }

        this.loading.set(false);
      },
      error: () => { this.loading.set(false); },
    });
  }

  private startNonVideoGate(): void {
    this.nonVideoTimer = setTimeout(() => {
      this.zone.run(() => this.nonVideoGateOpen.set(true));
    }, 5000);
  }

  private loadCourseContext(lesson: ILesson): void {
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

    this.progressService.getCourseProgress(courseId).subscribe({
      next: progressRes => {
        if (this.lesson()?.id !== lesson.id) return;
        const ids = new Set(
          (progressRes.body ?? [])
            .filter(p => p.completed === true)
            .map(p => p.lessonId)
            .filter((id): id is number => id != null),
        );
        this.completedLessonIds.set(ids);
      },
      error: () => { /* non-blocking */ },
    });

    this.courseService.find(courseId).subscribe({
      next: courseRes => {
        if (this.lesson()?.id !== lesson.id) return;
        const course = courseRes.body;
        this.course.set(course);

        if (course?.lessons && course.lessons.length > 0) {
          const courseLessonIds = new Set(course.lessons.map(l => l.id));
          this.lessonService.query({ size: 1000 }).subscribe({
            next: lessonRes => {
              if (this.lesson()?.id !== lesson.id) return;
              const allLessons: ILesson[] = lessonRes.body ?? [];
              this.courseLessons.set(allLessons.filter(l => courseLessonIds.has(l.id)));
            },
            error: () => { /* non-blocking */ },
          });
        } else {
          this.courseLessons.set([]);
        }
      },
      error: () => { /* non-blocking */ },
    });
  }

  // ── YouTube IFrame API ────────────────────────────────────────────────────

  private loadYouTubeAPI(videoId: string): void {
    if (typeof YT !== 'undefined' && YT.Player) {
      this.zone.run(() => this.initYTPlayer(videoId));
      return;
    }
    // Register the global callback YouTube requires before the script loads
    (window as any)['onYouTubeIframeAPIReady'] = () => {
      this.zone.run(() => this.initYTPlayer(videoId));
    };
    // Inject script only once across navigations
    if (!document.getElementById('yt-api-script')) {
      const script = document.createElement('script');
      script.id = 'yt-api-script';
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    }
  }

  private initYTPlayer(videoId: string): void {
    const container = document.getElementById('yt-player');
    if (!container) {
      // DOM not ready yet — retry shortly
      setTimeout(() => this.initYTPlayer(videoId), 150);
      return;
    }
    this.destroyYTPlayer();
    this.ytPlayer = new YT.Player('yt-player', {
      videoId,
      playerVars: { rel: 0, modestbranding: 1, origin: window.location.origin },
      events: {
        onStateChange: (event: any) => {
          this.zone.run(() => this.onYTStateChange(event.data));
        },
      },
    });
  }

  private onYTStateChange(state: number): void {
    // YT.PlayerState: ENDED=0, PLAYING=1, PAUSED=2
    if (state === 1) {
      this.startWatchPolling();
    } else if (state === 0) {
      this.onVideoWatched();
    }
  }

  private startWatchPolling(): void {
    if (this.watchInterval) return;
    this.zone.runOutsideAngular(() => {
      this.watchInterval = setInterval(() => {
        const duration = this.ytPlayer?.getDuration?.() ?? 0;
        const current  = this.ytPlayer?.getCurrentTime?.() ?? 0;
        if (duration > 0) {
          const pct = Math.min(100, Math.round((current / duration) * 100));
          this.zone.run(() => this.watchPercent.set(pct));
          if (current / duration >= 0.9 && !this.videoWatched()) {
            this.zone.run(() => this.onVideoWatched());
          }
        }
      }, 2000);
    });
  }

  private onVideoWatched(): void {
    if (this.videoWatched()) return;
    this.videoWatched.set(true);
    clearInterval(this.watchInterval);
    this.watchInterval = null;
    this.watchPercent.set(100);
    this.markLessonComplete();
  }

  private destroyYTPlayer(): void {
    clearInterval(this.watchInterval);
    this.watchInterval = null;
    try { this.ytPlayer?.destroy?.(); } catch { /* ignore */ }
    this.ytPlayer = null;
  }

  private clearTimers(): void {
    clearTimeout(this.nonVideoTimer);
    this.nonVideoTimer = null;
    clearInterval(this.watchInterval);
    this.watchInterval = null;
  }

  private getYouTubeVideoId(url: string): string | null {
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) return watchMatch[1];
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch) return shortMatch[1];
    return null;
  }
}
