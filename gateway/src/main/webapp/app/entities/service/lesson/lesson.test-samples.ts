import { ILesson, NewLesson } from './lesson.model';

export const sampleWithRequiredData: ILesson = {
  id: 5184,
  lessonTitle: 'definite',
};

export const sampleWithPartialData: ILesson = {
  id: 7044,
  lessonTitle: 'discrete',
  language: 'SPANISH',
};

export const sampleWithFullData: ILesson = {
  id: 29198,
  lessonTitle: 'circa stealthily',
  lessonDescription: 'engage any',
  language: 'HUNGARIAN',
};

export const sampleWithNewData: NewLesson = {
  lessonTitle: 'fold even',
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
