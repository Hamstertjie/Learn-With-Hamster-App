import { ICourse, NewCourse } from './course.model';

export const sampleWithRequiredData: ICourse = {
  id: 8824,
  courseTitle: 'radiant',
};

export const sampleWithPartialData: ICourse = {
  id: 19628,
  courseTitle: 'why far-off the',
  courseDescription: 'before',
  coursePrice: 18873,
};

export const sampleWithFullData: ICourse = {
  id: 30968,
  courseTitle: 'weakly',
  courseDescription: 'whenever pro',
  coursePrice: 13895,
  courseLevel: 'BEGINNER',
};

export const sampleWithNewData: NewCourse = {
  courseTitle: 'unto',
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
