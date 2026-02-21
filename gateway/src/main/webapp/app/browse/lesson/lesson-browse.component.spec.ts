jest.mock('app/core/auth/account.service');

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AccountService } from 'app/core/auth/account.service';
import { BookmarkService } from '../bookmark.service';
import LessonBrowseComponent from './lesson-browse.component';

describe('LessonBrowseComponent', () => {
  let comp: LessonBrowseComponent;
  let fixture: ComponentFixture<LessonBrowseComponent>;
  let accountService: AccountService;
  let bookmarkService: BookmarkService;
  let router: Router;

  beforeEach(waitForAsync(() => {
    localStorage.clear();
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
            paramMap: of(new Map([['id', '1']])),
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
    bookmarkService = TestBed.inject(BookmarkService);
    router = TestBed.inject(Router);
    localStorage.clear();
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

  // ── Notes ────────────────────────────────────────────────────────────────

  it('should initialise noteText as an empty string', () => {
    expect(comp.noteText()).toBe('');
  });

  it('should update noteText signal when saveNote is called', () => {
    comp.lesson.set({ id: 1, lessonTitle: 'Test' });
    comp.saveNote('my important note');
    expect(comp.noteText()).toBe('my important note');
  });

  it('should persist notes to localStorage keyed by lesson id', () => {
    comp.lesson.set({ id: 5, lessonTitle: 'Test' });
    comp.saveNote('persisted note');
    expect(localStorage.getItem('lesson-notes-5')).toBe('persisted note');
  });

  it('should not throw when saving a note with no lesson loaded', () => {
    comp.lesson.set(null);
    expect(() => comp.saveNote('orphan note')).not.toThrow();
  });

  it('should overwrite a previous note for the same lesson', () => {
    comp.lesson.set({ id: 3, lessonTitle: 'Test' });
    comp.saveNote('first draft');
    comp.saveNote('revised draft');
    expect(comp.noteText()).toBe('revised draft');
    expect(localStorage.getItem('lesson-notes-3')).toBe('revised draft');
  });

  // ── Reading Time ──────────────────────────────────────────────────────────

  it('should return at least 1 minute for an empty description', () => {
    comp.lesson.set({ id: 1, lessonTitle: 'Test', lessonDescription: '' });
    comp.resources.set([]);
    expect(comp.readingTime()).toBeGreaterThanOrEqual(1);
  });

  it('should add 5 minutes per VIDEO resource to reading time', () => {
    comp.lesson.set({ id: 1, lessonTitle: 'Test', lessonDescription: '' });
    comp.resources.set([
      { id: 1, resourceName: 'V1', resourceType: 'VIDEO' },
      { id: 2, resourceName: 'V2', resourceType: 'VIDEO' },
    ]);
    expect(comp.readingTime()).toBe(10); // 0 text + 2 × 5
  });

  it('should not count non-VIDEO resources in reading time video bonus', () => {
    comp.lesson.set({ id: 1, lessonTitle: 'Test', lessonDescription: '' });
    comp.resources.set([{ id: 1, resourceName: 'Page', resourceType: 'PAGE' }]);
    expect(comp.readingTime()).toBe(1); // min 1, no video bonus
  });

  // ── Bookmarks ─────────────────────────────────────────────────────────────

  it('should report isBookmarked as false when no lesson is set', () => {
    comp.lesson.set(null);
    expect(comp.isBookmarked()).toBe(false);
  });

  it('should report isBookmarked as false before any toggle', () => {
    comp.lesson.set({ id: 7, lessonTitle: 'Test' });
    expect(comp.isBookmarked()).toBe(false);
  });

  it('should report isBookmarked as true after toggleBookmark', () => {
    comp.lesson.set({ id: 7, lessonTitle: 'Test' });
    comp.toggleBookmark();
    expect(comp.isBookmarked()).toBe(true);
  });

  it('should report isBookmarked as false after toggling twice', () => {
    comp.lesson.set({ id: 7, lessonTitle: 'Test' });
    comp.toggleBookmark();
    comp.toggleBookmark();
    expect(comp.isBookmarked()).toBe(false);
  });

  it('should not throw when toggleBookmark is called with no lesson', () => {
    comp.lesson.set(null);
    expect(() => comp.toggleBookmark()).not.toThrow();
  });

  // ── Keyboard Navigation ───────────────────────────────────────────────────

  it('should navigate to the previous lesson on ArrowLeft', () => {
    jest.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
    comp.course.set({ id: 10, courseTitle: 'Course' });
    comp.courseLessons.set([
      { id: 1, lessonTitle: 'L1' },
      { id: 2, lessonTitle: 'L2' },
      { id: 3, lessonTitle: 'L3' },
    ]);
    comp.lesson.set({ id: 2, lessonTitle: 'L2' }); // index 1

    comp.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));

    expect(router.navigate).toHaveBeenCalledWith(['/catalog/lesson', 1], expect.anything());
  });

  it('should navigate to the next lesson on ArrowRight', () => {
    jest.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
    comp.course.set({ id: 10, courseTitle: 'Course' });
    comp.courseLessons.set([
      { id: 1, lessonTitle: 'L1' },
      { id: 2, lessonTitle: 'L2' },
      { id: 3, lessonTitle: 'L3' },
    ]);
    comp.lesson.set({ id: 2, lessonTitle: 'L2' }); // index 1

    comp.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

    expect(router.navigate).toHaveBeenCalledWith(['/catalog/lesson', 3], expect.anything());
  });

  it('should not navigate backward when already on the first lesson', () => {
    jest.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
    comp.courseLessons.set([{ id: 1, lessonTitle: 'L1' }, { id: 2, lessonTitle: 'L2' }]);
    comp.lesson.set({ id: 1, lessonTitle: 'L1' }); // index 0

    comp.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should not navigate forward when already on the last lesson', () => {
    jest.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
    comp.courseLessons.set([{ id: 1, lessonTitle: 'L1' }, { id: 2, lessonTitle: 'L2' }]);
    comp.lesson.set({ id: 2, lessonTitle: 'L2' }); // last index

    comp.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should not navigate when the event target is a textarea', () => {
    jest.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
    comp.courseLessons.set([{ id: 1, lessonTitle: 'L1' }, { id: 2, lessonTitle: 'L2' }]);
    comp.lesson.set({ id: 1, lessonTitle: 'L1' });

    const textarea = document.createElement('textarea');
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    Object.defineProperty(event, 'target', { value: textarea });
    comp.onKeydown(event);

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should not navigate when the event target is an input', () => {
    jest.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
    comp.courseLessons.set([{ id: 1, lessonTitle: 'L1' }, { id: 2, lessonTitle: 'L2' }]);
    comp.lesson.set({ id: 1, lessonTitle: 'L1' });

    const input = document.createElement('input');
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    Object.defineProperty(event, 'target', { value: input });
    comp.onKeydown(event);

    expect(router.navigate).not.toHaveBeenCalled();
  });

  // ── Resource Action Labels ────────────────────────────────────────────────

  it('should return the correct action label for each resource type', () => {
    expect(comp.resourceActionLabel('VIDEO')).toBe('browse.lesson.watchVideo');
    expect(comp.resourceActionLabel('TOOL')).toBe('browse.lesson.launchTool');
    expect(comp.resourceActionLabel('TUTORIAL')).toBe('browse.lesson.startTutorial');
    expect(comp.resourceActionLabel('IMAGE')).toBe('browse.lesson.viewImage');
    expect(comp.resourceActionLabel('PAGE')).toBe('browse.lesson.openResource');
    expect(comp.resourceActionLabel(null)).toBe('browse.lesson.openResource');
  });
});
