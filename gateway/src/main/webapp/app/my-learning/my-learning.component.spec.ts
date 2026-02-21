jest.mock('app/core/auth/account.service');

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AccountService } from 'app/core/auth/account.service';
import { UserCourseEnrollmentService } from 'app/entities/service/user-course-enrollment/service/user-course-enrollment.service';
import { BookmarkService } from 'app/browse/bookmark.service';
import { ICourse } from 'app/entities/service/course/course.model';
import MyLearningComponent, { EnrolledCourse } from './my-learning.component';

const makeCourse = (id: number, title = `Course ${id}`): ICourse => ({ id, courseTitle: title } as ICourse);

const makeEnrolled = (id: number, completed: number, total: number): EnrolledCourse => ({
  course: makeCourse(id),
  lessonsCompleted: completed,
  lessonsTotal: total,
  progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
});

describe('MyLearningComponent', () => {
  let comp: MyLearningComponent;
  let fixture: ComponentFixture<MyLearningComponent>;
  let enrollmentService: UserCourseEnrollmentService;
  let bookmarkService: BookmarkService;

  beforeEach(waitForAsync(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [MyLearningComponent, TranslateModule.forRoot()],
      providers: [AccountService, provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    })
      .overrideTemplate(MyLearningComponent, '')
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyLearningComponent);
    comp = fixture.componentInstance;
    enrollmentService = TestBed.inject(UserCourseEnrollmentService);
    bookmarkService = TestBed.inject(BookmarkService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(comp).toBeTruthy();
  });

  // ── Enrollments ───────────────────────────────────────────────────────────

  it('should load enrollments on init and set loading to false when empty', () => {
    jest.spyOn(enrollmentService, 'getEnrollments').mockReturnValue(of({ body: [] } as any));

    comp.ngOnInit();

    expect(enrollmentService.getEnrollments).toHaveBeenCalled();
    expect(comp.loading()).toBe(false);
    expect(comp.enrolledCourses().length).toBe(0);
  });

  // ── inProgressCourses / completedCourses ──────────────────────────────────

  it('should separate in-progress from completed courses', () => {
    comp.enrolledCourses.set([
      makeEnrolled(1, 3, 5),   // 60% — in progress
      makeEnrolled(2, 5, 5),   // 100% — completed
      makeEnrolled(3, 0, 4),   // 0%  — in progress
    ]);

    expect(comp.inProgressCourses().length).toBe(2);
    expect(comp.completedCourses().length).toBe(1);
    expect(comp.completedCourses()[0].course.id).toBe(2);
  });

  it('should report all courses as in-progress when none are completed', () => {
    comp.enrolledCourses.set([makeEnrolled(1, 1, 3), makeEnrolled(2, 2, 4)]);
    expect(comp.inProgressCourses().length).toBe(2);
    expect(comp.completedCourses().length).toBe(0);
  });

  it('should report all courses as completed when all reach 100%', () => {
    comp.enrolledCourses.set([makeEnrolled(1, 3, 3), makeEnrolled(2, 5, 5)]);
    expect(comp.completedCourses().length).toBe(2);
    expect(comp.inProgressCourses().length).toBe(0);
  });

  it('should return empty arrays when no courses are enrolled', () => {
    comp.enrolledCourses.set([]);
    expect(comp.inProgressCourses()).toEqual([]);
    expect(comp.completedCourses()).toEqual([]);
  });

  it('inProgressCourses should update reactively when enrolledCourses changes', () => {
    comp.enrolledCourses.set([makeEnrolled(1, 2, 5)]); // 40%
    expect(comp.inProgressCourses().length).toBe(1);

    comp.enrolledCourses.set([makeEnrolled(1, 5, 5)]); // 100%
    expect(comp.inProgressCourses().length).toBe(0);
    expect(comp.completedCourses().length).toBe(1);
  });

  // ── Bookmarked Lessons ────────────────────────────────────────────────────

  it('should initialise bookmarkedLessons as an empty array', () => {
    expect(comp.bookmarkedLessons()).toEqual([]);
  });

  it('should not attempt to load lessons when there are no bookmarks', () => {
    const lessonService = (comp as any).lessonService;
    const findSpy = jest.spyOn(lessonService, 'find');

    comp.ngOnInit();

    // No bookmarks in localStorage → find should never be called for lessons
    expect(findSpy).not.toHaveBeenCalled();
  });

  it('should load a bookmarked lesson when one exists', () => {
    bookmarkService.toggle(42);
    const lessonService = (comp as any).lessonService;
    jest.spyOn(lessonService, 'find').mockReturnValue(
      of({ body: { id: 42, lessonTitle: 'Bookmarked Lesson' } } as any),
    );

    (comp as any).loadBookmarkedLessons();

    expect(lessonService.find).toHaveBeenCalledWith(42);
    expect(comp.bookmarkedLessons().length).toBe(1);
    expect(comp.bookmarkedLessons()[0].id).toBe(42);
  });

  it('should handle a failed lesson fetch gracefully and still resolve', () => {
    bookmarkService.toggle(99);
    const lessonService = (comp as any).lessonService;
    jest.spyOn(lessonService, 'find').mockReturnValue(
      of({ body: null } as any),
    );

    (comp as any).loadBookmarkedLessons();

    // null body → not pushed to the list, but no crash
    expect(comp.bookmarkedLessons().length).toBe(0);
  });
});
