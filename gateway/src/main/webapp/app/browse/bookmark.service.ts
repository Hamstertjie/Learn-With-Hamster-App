import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BookmarkService {
  private readonly STORAGE_KEY = 'lesson-bookmarks';
  private readonly bookmarkIds = signal<Set<number>>(this.loadFromStorage());

  isBookmarked(lessonId: number): boolean {
    return this.bookmarkIds().has(lessonId);
  }

  toggle(lessonId: number): void {
    const next = new Set(this.bookmarkIds());
    if (next.has(lessonId)) {
      next.delete(lessonId);
    } else {
      next.add(lessonId);
    }
    this.bookmarkIds.set(next);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify([...next]));
  }

  getBookmarkedIds(): number[] {
    return [...this.bookmarkIds()];
  }

  private loadFromStorage(): Set<number> {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? new Set<number>(JSON.parse(raw) as number[]) : new Set<number>();
    } catch {
      return new Set<number>();
    }
  }
}
