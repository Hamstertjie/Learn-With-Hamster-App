import { ICourse } from 'app/entities/service/course/course.model';
import { IDiscipline } from 'app/entities/service/discipline/discipline.model';

export interface IProgram {
  id: number;
  programName?: string | null;
  programDescription?: string | null;
  programPrice?: number | null;
  courses?: Pick<ICourse, 'id'>[] | null;
  disciplines?: Pick<IDiscipline, 'id'>[] | null;
}

export type NewProgram = Omit<IProgram, 'id'> & { id: null };
