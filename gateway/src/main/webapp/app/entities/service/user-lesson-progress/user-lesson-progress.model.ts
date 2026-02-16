export interface IUserLessonProgress {
  id: number;
  userLogin?: string | null;
  lessonId?: number | null;
  courseId?: number | null;
  startedAt?: string | null;
  completed?: boolean | null;
}
