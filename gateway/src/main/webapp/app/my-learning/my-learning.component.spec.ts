jest.mock('app/core/auth/account.service');

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AccountService } from 'app/core/auth/account.service';
import { UserCourseEnrollmentService } from 'app/entities/service/user-course-enrollment/service/user-course-enrollment.service';
import MyLearningComponent from './my-learning.component';

describe('MyLearningComponent', () => {
  let comp: MyLearningComponent;
  let fixture: ComponentFixture<MyLearningComponent>;

  beforeEach(waitForAsync(() => {
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
  });

  it('should create', () => {
    expect(comp).toBeTruthy();
  });

  it('should load enrollments on init', () => {
    const enrollmentService = TestBed.inject(UserCourseEnrollmentService);
    jest.spyOn(enrollmentService, 'getEnrollments').mockReturnValue(of({ body: [] } as any));

    comp.ngOnInit();

    expect(enrollmentService.getEnrollments).toHaveBeenCalled();
    expect(comp.loading()).toBe(false);
    expect(comp.enrolledCourses().length).toBe(0);
  });
});
