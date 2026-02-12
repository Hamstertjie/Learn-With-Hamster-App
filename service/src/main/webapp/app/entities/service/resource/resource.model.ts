import { IDiscipline } from 'app/entities/service/discipline/discipline.model';
import { IProgram } from 'app/entities/service/program/program.model';
import { ICourse } from 'app/entities/service/course/course.model';
import { ILesson } from 'app/entities/service/lesson/lesson.model';
import { ResourceType } from 'app/entities/enumerations/resource-type.model';

export interface IResource {
  id: number;
  resourceName?: string | null;
  resourceDescription?: string | null;
  resourceURL?: string | null;
  resourcePreviewImage?: string | null;
  resourceType?: keyof typeof ResourceType | null;
  weight?: number | null;
  discipline?: Pick<IDiscipline, 'id'> | null;
  program?: Pick<IProgram, 'id'> | null;
  course?: Pick<ICourse, 'id'> | null;
  lesson?: Pick<ILesson, 'id'> | null;
}

export type NewResource = Omit<IResource, 'id'> & { id: null };
