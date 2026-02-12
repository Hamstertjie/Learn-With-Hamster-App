import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { IDiscipline } from '../discipline.model';
import { sampleWithFullData, sampleWithNewData, sampleWithPartialData, sampleWithRequiredData } from '../discipline.test-samples';

import { DisciplineService } from './discipline.service';

const requireRestSample: IDiscipline = {
  ...sampleWithRequiredData,
};

describe('Discipline Service', () => {
  let service: DisciplineService;
  let httpMock: HttpTestingController;
  let expectedResult: IDiscipline | IDiscipline[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    expectedResult = null;
    service = TestBed.inject(DisciplineService);
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

    it('should create a Discipline', () => {
      const discipline = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(discipline).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Discipline', () => {
      const discipline = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(discipline).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Discipline', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Discipline', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Discipline', () => {
      const expected = true;

      service.delete(123).subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    it('should handle exceptions for searching a Discipline', () => {
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

    describe('addDisciplineToCollectionIfMissing', () => {
      it('should add a Discipline to an empty array', () => {
        const discipline: IDiscipline = sampleWithRequiredData;
        expectedResult = service.addDisciplineToCollectionIfMissing([], discipline);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(discipline);
      });

      it('should not add a Discipline to an array that contains it', () => {
        const discipline: IDiscipline = sampleWithRequiredData;
        const disciplineCollection: IDiscipline[] = [
          {
            ...discipline,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addDisciplineToCollectionIfMissing(disciplineCollection, discipline);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Discipline to an array that doesn't contain it", () => {
        const discipline: IDiscipline = sampleWithRequiredData;
        const disciplineCollection: IDiscipline[] = [sampleWithPartialData];
        expectedResult = service.addDisciplineToCollectionIfMissing(disciplineCollection, discipline);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(discipline);
      });

      it('should add only unique Discipline to an array', () => {
        const disciplineArray: IDiscipline[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const disciplineCollection: IDiscipline[] = [sampleWithRequiredData];
        expectedResult = service.addDisciplineToCollectionIfMissing(disciplineCollection, ...disciplineArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const discipline: IDiscipline = sampleWithRequiredData;
        const discipline2: IDiscipline = sampleWithPartialData;
        expectedResult = service.addDisciplineToCollectionIfMissing([], discipline, discipline2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(discipline);
        expect(expectedResult).toContain(discipline2);
      });

      it('should accept null and undefined values', () => {
        const discipline: IDiscipline = sampleWithRequiredData;
        expectedResult = service.addDisciplineToCollectionIfMissing([], null, discipline, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(discipline);
      });

      it('should return initial array if no Discipline is added', () => {
        const disciplineCollection: IDiscipline[] = [sampleWithRequiredData];
        expectedResult = service.addDisciplineToCollectionIfMissing(disciplineCollection, undefined, null);
        expect(expectedResult).toEqual(disciplineCollection);
      });
    });

    describe('compareDiscipline', () => {
      it('should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareDiscipline(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('should return false if one entity is null', () => {
        const entity1 = { id: 8998 };
        const entity2 = null;

        const compareResult1 = service.compareDiscipline(entity1, entity2);
        const compareResult2 = service.compareDiscipline(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey differs', () => {
        const entity1 = { id: 8998 };
        const entity2 = { id: 31095 };

        const compareResult1 = service.compareDiscipline(entity1, entity2);
        const compareResult2 = service.compareDiscipline(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey matches', () => {
        const entity1 = { id: 8998 };
        const entity2 = { id: 8998 };

        const compareResult1 = service.compareDiscipline(entity1, entity2);
        const compareResult2 = service.compareDiscipline(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
