import { ILesson } from 'app/entities/service/lesson/lesson.model';
import { IProgram } from 'app/entities/service/program/program.model';
import { Level } from 'app/entities/enumerations/level.model';

export interface ICourse {
  id: number;
  courseTitle?: string | null;
  courseDescription?: string | null;
  coursePrice?: number | null;
  courseLevel?: keyof typeof Level | null;
  lessons?: Pick<ILesson, 'id'>[] | null;
  programs?: Pick<IProgram, 'id'>[] | null;
}

export type NewCourse = Omit<ICourse, 'id'> & { id: null };
