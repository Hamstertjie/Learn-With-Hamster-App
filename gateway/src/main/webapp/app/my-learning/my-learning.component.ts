import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { AccountService } from 'app/core/auth/account.service';
import { UserCourseEnrollmentService } from 'app/entities/service/user-course-enrollment/service/user-course-enrollment.service';
import { UserLessonProgressService } from 'app/entities/service/user-lesson-progress/service/user-lesson-progress.service';
import { CourseService } from 'app/entities/service/course/service/course.service';
import { ICourse } from 'app/entities/service/course/course.model';

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
  loading = signal(true);

  private readonly enrollmentService = inject(UserCourseEnrollmentService);
  private readonly progressService = inject(UserLessonProgressService);
  private readonly courseService = inject(CourseService);

  ngOnInit(): void {
    this.loadEnrollments();
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
}
