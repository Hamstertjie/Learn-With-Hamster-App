import { IDiscipline, NewDiscipline } from './discipline.model';

export const sampleWithRequiredData: IDiscipline = {
  id: 23439,
  disciplineName: 'mealy',
};

export const sampleWithPartialData: IDiscipline = {
  id: 14616,
  disciplineName: 'bob tectonics',
  disciplineDescription: 'honored',
  disciplinePrice: 23087,
};

export const sampleWithFullData: IDiscipline = {
  id: 19917,
  disciplineName: 'round able',
  disciplineDescription: 'interestingly a litter',
  disciplinePrice: 25532,
};

export const sampleWithNewData: NewDiscipline = {
  disciplineName: 'innocently dwell like',
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
