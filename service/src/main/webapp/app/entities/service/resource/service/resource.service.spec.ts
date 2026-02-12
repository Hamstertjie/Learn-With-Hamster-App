import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { IResource } from '../resource.model';
import { sampleWithFullData, sampleWithNewData, sampleWithPartialData, sampleWithRequiredData } from '../resource.test-samples';

import { ResourceService } from './resource.service';

const requireRestSample: IResource = {
  ...sampleWithRequiredData,
};

describe('Resource Service', () => {
  let service: ResourceService;
  let httpMock: HttpTestingController;
  let expectedResult: IResource | IResource[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    expectedResult = null;
    service = TestBed.inject(ResourceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  describe('Service methods', () => {
    it('should find an element', () => {
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.find(123).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should create a Resource', () => {
      const resource = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(resource).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Resource', () => {
      const resource = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(resource).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Resource', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Resource', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Resource', () => {
      const expected = true;

      service.delete(123).subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    it('should handle exceptions for searching a Resource', () => {
      const queryObject: any = {
        page: 0,
        size: 20,
        query: '',
        sort: [],
      };
      service.search(queryObject).subscribe(() => expectedResult);

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
      expect(expectedResult).toBe(null);
    });

    describe('addResourceToCollectionIfMissing', () => {
      it('should add a Resource to an empty array', () => {
        const resource: IResource = sampleWithRequiredData;
        expectedResult = service.addResourceToCollectionIfMissing([], resource);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(resource);
      });

      it('should not add a Resource to an array that contains it', () => {
        const resource: IResource = sampleWithRequiredData;
        const resourceCollection: IResource[] = [
          {
            ...resource,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addResourceToCollectionIfMissing(resourceCollection, resource);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Resource to an array that doesn't contain it", () => {
        const resource: IResource = sampleWithRequiredData;
        const resourceCollection: IResource[] = [sampleWithPartialData];
        expectedResult = service.addResourceToCollectionIfMissing(resourceCollection, resource);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(resource);
      });

      it('should add only unique Resource to an array', () => {
        const resourceArray: IResource[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const resourceCollection: IResource[] = [sampleWithRequiredData];
        expectedResult = service.addResourceToCollectionIfMissing(resourceCollection, ...resourceArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const resource: IResource = sampleWithRequiredData;
        const resource2: IResource = sampleWithPartialData;
        expectedResult = service.addResourceToCollectionIfMissing([], resource, resource2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(resource);
        expect(expectedResult).toContain(resource2);
      });

      it('should accept null and undefined values', () => {
        const resource: IResource = sampleWithRequiredData;
        expectedResult = service.addResourceToCollectionIfMissing([], null, resource, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(resource);
      });

      it('should return initial array if no Resource is added', () => {
        const resourceCollection: IResource[] = [sampleWithRequiredData];
        expectedResult = service.addResourceToCollectionIfMissing(resourceCollection, undefined, null);
        expect(expectedResult).toEqual(resourceCollection);
      });
    });

    describe('compareResource', () => {
      it('should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareResource(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('should return false if one entity is null', () => {
        const entity1 = { id: 12681 };
        const entity2 = null;

        const compareResult1 = service.compareResource(entity1, entity2);
        const compareResult2 = service.compareResource(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey differs', () => {
        const entity1 = { id: 12681 };
        const entity2 = { id: 18114 };

        const compareResult1 = service.compareResource(entity1, entity2);
        const compareResult2 = service.compareResource(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey matches', () => {
        const entity1 = { id: 12681 };
        const entity2 = { id: 12681 };

        const compareResult1 = service.compareResource(entity1, entity2);
        const compareResult2 = service.compareResource(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
