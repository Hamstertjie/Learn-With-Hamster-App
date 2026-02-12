import { IResource, NewResource } from './resource.model';

export const sampleWithRequiredData: IResource = {
  id: 17887,
};

export const sampleWithPartialData: IResource = {
  id: 11603,
  resourceName: 'than antique nor',
  resourceDescription: 'ah lowball drat',
  resourceURL: 'lovely eek because',
  resourcePreviewImage: 'hypothesize',
};

export const sampleWithFullData: IResource = {
  id: 12771,
  resourceName: 'pneumonia',
  resourceDescription: 'whoever',
  resourceURL: 'yowza kettledrum',
  resourcePreviewImage: 'inquisitively',
  resourceType: 'TOOL',
  weight: 20247,
};

export const sampleWithNewData: NewResource = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
