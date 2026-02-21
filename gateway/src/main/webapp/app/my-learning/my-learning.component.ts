import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { AccountService } from 'app/core/auth/account.service';
import { UserCourseEnrollmentService } from 'app/entities/service/user-course-enrollment/service/user-course-enrollment.service';
import { UserLessonProgressService } from 'app/entities/service/user-lesson-progress/service/user-lesson-progress.service';
import { CourseService } from 'app/entities/service/course/service/course.service';
import { LessonService } from 'app/entities/service/lesson/service/lesson.service';
import { BookmarkService } from 'app/browse/bookmark.service';
import { ICourse } from 'app/entities/service/course/course.model';
import { ILesson } from 'app/entities/service/lesson/lesson.model';

export interface EnrolledCourse {
  course: ICourse;
  lessonsCompleted: number;
  lessonsTotal: number;
  progressPercent: number;
}

@Component({
  selector: 'jhi-my-learning',
  templateUrl: './my-learning.component.html',
  styleUrl: './my-learning.component.scss',
  imports: [SharedModule, RouterModule],
})
export default class MyLearningComponent implements OnInit {
  account = inject(AccountService).trackCurrentAccount();
  enrolledCourses = signal<EnrolledCourse[]>([]);
  bookmarkedLessons = signal<ILesson[]>([]);
  loading = signal(true);

  inProgressCourses = computed(() => this.enrolledCourses().filter(ec => ec.progressPercent < 100));
  completedCourses = computed(() => this.enrolledCourses().filter(ec => ec.progressPercent === 100));

  private readonly enrollmentService = inject(UserCourseEnrollmentService);
  private readonly progressService = inject(UserLessonProgressService);
  private readonly courseService = inject(CourseService);
  private readonly lessonService = inject(LessonService);
  readonly bookmarkService = inject(BookmarkService);

  ngOnInit(): void {
    this.loadEnrollments();
    this.loadBookmarkedLessons();
  }

  private loadEnrollments(): void {
    this.enrollmentService.getEnrollments().subscribe(res => {
      const enrollments = res.body ?? [];
      if (enrollments.length === 0) {
        this.loading.set(false);
        return;
      }

      let loaded = 0;
      const courses: EnrolledCourse[] = [];

      for (const enrollment of enrollments) {
        const courseId = enrollment.courseId!;
        this.courseService.find(courseId).subscribe(courseRes => {
          const course = courseRes.body;
          if (course) {
            const totalLessons = course.lessons?.length ?? 0;
            this.progressService.getCourseProgress(courseId).subscribe(progressRes => {
              const progress = progressRes.body ?? [];
              const completedLessons = progress.filter(p => p.completed).length;
              courses.push({
                course,
                lessonsCompleted: completedLessons,
                lessonsTotal: totalLessons,
                progressPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
              });
              loaded++;
              if (loaded === enrollments.length) {
                this.enrolledCourses.set(courses);
                this.loading.set(false);
              }
            });
          } else {
            loaded++;
            if (loaded === enrollments.length) {
              this.enrolledCourses.set(courses);
              this.loading.set(false);
            }
          }
        });
      }
    });
  }

  private loadBookmarkedLessons(): void {
    const ids = this.bookmarkService.getBookmarkedIds();
    if (ids.length === 0) return;

    let loaded = 0;
    const lessons: ILesson[] = [];

    for (const id of ids) {
      this.lessonService.find(id).subscribe({
        next: res => {
          if (res.body) lessons.push(res.body);
          loaded++;
          if (loaded === ids.length) {
            this.bookmarkedLessons.set(lessons);
          }
        },
        error: () => {
          loaded++;
          if (loaded === ids.length) {
            this.bookmarkedLessons.set(lessons);
          }
        },
      });
    }
  }
}
