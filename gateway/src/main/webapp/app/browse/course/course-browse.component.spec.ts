jest.mock('app/core/auth/account.service');

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { CourseService } from 'app/entities/service/course/service/course.service';
import { LessonService } from 'app/entities/service/lesson/service/lesson.service';
import { ResourceService } from 'app/entities/service/resource/service/resource.service';
import { UserCourseEnrollmentService } from 'app/entities/service/user-course-enrollment/service/user-course-enrollment.service';
import { UserLessonProgressService } from 'app/entities/service/user-lesson-progress/service/user-lesson-progress.service';
import { CartService } from 'app/cart/cart.service';
import CourseBrowseComponent from './course-browse.component';

describe('CourseBrowseComponent', () => {
  let comp: CourseBrowseComponent;
  let fixture: ComponentFixture<CourseBrowseComponent>;
  let accountService: AccountService;

  const account: Account = {
    activated: true,
    authorities: [],
    email: 'test@test.com',
    firstName: 'Test',
    langKey: 'en',
    lastName: 'User',
    login: 'test',
    imageUrl: null,
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CourseBrowseComponent, TranslateModule.forRoot()],
      providers: [
        AccountService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '1' } } },
        },
      ],
    })
      .overrideTemplate(CourseBrowseComponent, '')
      .compileComponents();
  }));

  beforeEach(() => {
    localStorage.clear();
    fixture = TestBed.createComponent(CourseBrowseComponent);
    comp = fixture.componentInstance;
    accountService = TestBed.inject(AccountService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(comp).toBeTruthy();
  });

  it('should set isAuthenticated to false for anonymous users', () => {
    accountService.identity = jest.fn(() => of(null));

    comp.ngOnInit();

    expect(comp.isAuthenticated()).toBe(false);
    expect(comp.loading()).toBe(false);
  });

  it('should load course data for authenticated users', () => {
    accountService.identity = jest.fn(() => of(account));
    const course = { id: 1, courseTitle: 'Test', coursePrice: 0, lessons: [{ id: 10 }] };

    const courseService = TestBed.inject(CourseService);
    const lessonService = TestBed.inject(LessonService);
    const resourceService = TestBed.inject(ResourceService);
    const enrollmentService = TestBed.inject(UserCourseEnrollmentService);
    const progressService = TestBed.inject(UserLessonProgressService);

    jest.spyOn(courseService, 'find').mockReturnValue(of({ body: course } as any));
    jest.spyOn(lessonService, 'query').mockReturnValue(of({ body: [{ id: 10, lessonTitle: 'L1' }] } as any));
    jest.spyOn(resourceService, 'query').mockReturnValue(of({ body: [] } as any));
    jest.spyOn(enrollmentService, 'isEnrolled').mockReturnValue(of({ body: false } as any));

    comp.ngOnInit();

    expect(comp.isAuthenticated()).toBe(true);
    expect(comp.course()).toBeTruthy();
    expect(comp.lessons().length).toBe(1);
  });

  it('should toggle lesson expansion', () => {
    expect(comp.isLessonExpanded(1)).toBe(false);

    comp.toggleLesson(1);
    expect(comp.isLessonExpanded(1)).toBe(true);

    comp.toggleLesson(1);
    expect(comp.isLessonExpanded(1)).toBe(false);
  });

  it('should report isFree correctly', () => {
    comp.course.set({ id: 1, courseTitle: 'Free', coursePrice: 0 } as any);
    expect(comp.isFree).toBe(true);

    comp.course.set({ id: 2, courseTitle: 'Paid', coursePrice: 29 } as any);
    expect(comp.isFree).toBe(false);
  });

  it('should add course to cart via addToCart', () => {
    const cartService = TestBed.inject(CartService);
    comp.course.set({ id: 5, courseTitle: 'Cart Course', coursePrice: 49 } as any);

    comp.addToCart();

    expect(cartService.isInCart(5)).toBe(true);
  });

  it('should report isCourseInCart correctly', () => {
    const cartService = TestBed.inject(CartService);
    comp.course.set({ id: 5, courseTitle: 'Test', coursePrice: 49 } as any);

    expect(comp.isCourseInCart()).toBe(false);

    cartService.addToCart(5, 'Test', 49);
    expect(comp.isCourseInCart()).toBe(true);
  });
});
