import { ICourse } from 'app/entities/service/course/course.model';
import { Language } from 'app/entities/enumerations/language.model';

export interface ILesson {
  id: number;
  lessonTitle?: string | null;
  lessonDescription?: string | null;
  language?: keyof typeof Language | null;
  courses?: Pick<ICourse, 'id'>[] | null;
}

export type NewLesson = Omit<ILesson, 'id'> & { id: null };
