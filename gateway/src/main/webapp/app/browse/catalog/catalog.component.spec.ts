jest.mock('app/core/auth/account.service');

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { DisciplineService } from 'app/entities/service/discipline/service/discipline.service';
import { CourseService } from 'app/entities/service/course/service/course.service';
import CatalogComponent from './catalog.component';

describe('CatalogComponent', () => {
  let comp: CatalogComponent;
  let fixture: ComponentFixture<CatalogComponent>;
  let accountService: AccountService;
  let router: Router;

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
      imports: [CatalogComponent, TranslateModule.forRoot()],
      providers: [AccountService, provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    })
      .overrideTemplate(CatalogComponent, '')
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CatalogComponent);
    comp = fixture.componentInstance;
    accountService = TestBed.inject(AccountService);
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(comp).toBeTruthy();
  });

  it('should set isAuthenticated to false and stop loading for anonymous users', () => {
    accountService.identity = jest.fn(() => of(null));

    comp.ngOnInit();

    expect(comp.isAuthenticated()).toBe(false);
    expect(comp.loading()).toBe(false);
  });

  it('should set isAuthenticated to true for logged-in users', () => {
    accountService.identity = jest.fn(() => of(account));
    const disciplineService = TestBed.inject(DisciplineService);
    const courseService = TestBed.inject(CourseService);
    jest.spyOn(disciplineService, 'query').mockReturnValue(of({ body: [] } as any));
    jest.spyOn(courseService, 'query').mockReturnValue(of({ body: [] } as any));

    comp.ngOnInit();

    expect(comp.isAuthenticated()).toBe(true);
  });

  it('should navigate to /login when login() is called', () => {
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    comp.login();

    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should load disciplines and compute course counts', () => {
    accountService.identity = jest.fn(() => of(account));
    const disciplines = [{ id: 1, programs: [{ id: 10 }] }];
    const courses = [{ id: 100, programs: [{ id: 10 }] }, { id: 101, programs: [{ id: 20 }] }];

    const disciplineService = TestBed.inject(DisciplineService);
    const courseService = TestBed.inject(CourseService);
    jest.spyOn(disciplineService, 'query').mockReturnValue(of({ body: disciplines } as any));
    jest.spyOn(courseService, 'query').mockReturnValue(of({ body: courses } as any));

    comp.ngOnInit();

    expect(comp.disciplines().length).toBe(1);
    expect(comp.courseCountMap()[1]).toBe(1);
    expect(comp.loading()).toBe(false);
  });
});
