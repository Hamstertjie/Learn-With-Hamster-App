import { IProgram, NewProgram } from './program.model';

export const sampleWithRequiredData: IProgram = {
  id: 5631,
  programName: 'white who',
};

export const sampleWithPartialData: IProgram = {
  id: 28947,
  programName: 'deck yowza minor',
  programDescription: 'highlight acquire ew',
  programPrice: 22122,
};

export const sampleWithFullData: IProgram = {
  id: 19322,
  programName: 'dapper rationalize tomography',
  programDescription: 'including',
  programPrice: 18335,
};

export const sampleWithNewData: NewProgram = {
  programName: 'disapprove phew',
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
