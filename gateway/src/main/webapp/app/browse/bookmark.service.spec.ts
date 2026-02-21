import { TestBed } from '@angular/core/testing';
import { BookmarkService } from './bookmark.service';

describe('BookmarkService', () => {
  let service: BookmarkService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(BookmarkService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return false for a lesson that has not been bookmarked', () => {
    expect(service.isBookmarked(42)).toBe(false);
  });

  it('should return true after bookmarking a lesson', () => {
    service.toggle(42);
    expect(service.isBookmarked(42)).toBe(true);
  });

  it('should return false after toggling a bookmarked lesson a second time', () => {
    service.toggle(42);
    service.toggle(42);
    expect(service.isBookmarked(42)).toBe(false);
  });

  it('should persist bookmarks to localStorage', () => {
    service.toggle(42);
    const stored: number[] = JSON.parse(localStorage.getItem('lesson-bookmarks') ?? '[]');
    expect(stored).toContain(42);
  });

  it('should remove the lesson from localStorage when untoggled', () => {
    service.toggle(42);
    service.toggle(42);
    const stored: number[] = JSON.parse(localStorage.getItem('lesson-bookmarks') ?? '[]');
    expect(stored).not.toContain(42);
  });

  it('should track multiple independent bookmarks', () => {
    service.toggle(1);
    service.toggle(3);
    service.toggle(7);
    expect(service.isBookmarked(1)).toBe(true);
    expect(service.isBookmarked(3)).toBe(true);
    expect(service.isBookmarked(7)).toBe(true);
    expect(service.isBookmarked(2)).toBe(false);
  });

  it('should return all bookmarked IDs via getBookmarkedIds', () => {
    service.toggle(10);
    service.toggle(20);
    const ids = service.getBookmarkedIds();
    expect(ids).toContain(10);
    expect(ids).toContain(20);
    expect(ids.length).toBe(2);
  });

  it('should return an empty array when nothing is bookmarked', () => {
    expect(service.getBookmarkedIds()).toEqual([]);
  });

  it('should load existing bookmarks from localStorage on initialisation', () => {
    localStorage.setItem('lesson-bookmarks', JSON.stringify([10, 20]));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const freshService = TestBed.inject(BookmarkService);
    expect(freshService.isBookmarked(10)).toBe(true);
    expect(freshService.isBookmarked(20)).toBe(true);
    expect(freshService.isBookmarked(99)).toBe(false);
  });

  it('should handle corrupt localStorage data without throwing', () => {
    localStorage.setItem('lesson-bookmarks', 'not-valid-json{{');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const freshService = TestBed.inject(BookmarkService);
    expect(freshService.getBookmarkedIds()).toEqual([]);
  });

  it('isBookmarked should be reactive: updating a signal reads the new state', () => {
    expect(service.isBookmarked(5)).toBe(false);
    service.toggle(5);
    expect(service.isBookmarked(5)).toBe(true);
    service.toggle(5);
    expect(service.isBookmarked(5)).toBe(false);
  });
});
