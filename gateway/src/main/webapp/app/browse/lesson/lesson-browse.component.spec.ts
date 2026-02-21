jest.mock('app/core/auth/account.service');

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AccountService } from 'app/core/auth/account.service';
import LessonBrowseComponent from './lesson-browse.component';

describe('LessonBrowseComponent', () => {
  let comp: LessonBrowseComponent;
  let fixture: ComponentFixture<LessonBrowseComponent>;
  let accountService: AccountService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [LessonBrowseComponent, TranslateModule.forRoot()],
      providers: [
        AccountService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: () => '1' },
              queryParamMap: { get: () => '1' },
            },
          },
        },
      ],
    })
      .overrideTemplate(LessonBrowseComponent, '')
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LessonBrowseComponent);
    comp = fixture.componentInstance;
    accountService = TestBed.inject(AccountService);
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
});
