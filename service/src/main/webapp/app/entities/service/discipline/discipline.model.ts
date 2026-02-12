import { IProgram } from 'app/entities/service/program/program.model';

export interface IDiscipline {
  id: number;
  disciplineName?: string | null;
  disciplineDescription?: string | null;
  disciplinePrice?: number | null;
  programs?: Pick<IProgram, 'id'>[] | null;
}

export type NewDiscipline = Omit<IDiscipline, 'id'> & { id: null };
