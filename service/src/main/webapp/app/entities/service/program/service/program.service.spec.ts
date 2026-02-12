import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { IProgram } from '../program.model';
import { sampleWithFullData, sampleWithNewData, sampleWithPartialData, sampleWithRequiredData } from '../program.test-samples';

import { ProgramService } from './program.service';

const requireRestSample: IProgram = {
  ...sampleWithRequiredData,
};

describe('Program Service', () => {
  let service: ProgramService;
  let httpMock: HttpTestingController;
  let expectedResult: IProgram | IProgram[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    expectedResult = null;
    service = TestBed.inject(ProgramService);
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

    it('should create a Program', () => {
      const program = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(program).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Program', () => {
      const program = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(program).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Program', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Program', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Program', () => {
      const expected = true;

      service.delete(123).subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    it('should handle exceptions for searching a Program', () => {
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

    describe('addProgramToCollectionIfMissing', () => {
      it('should add a Program to an empty array', () => {
        const program: IProgram = sampleWithRequiredData;
        expectedResult = service.addProgramToCollectionIfMissing([], program);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(program);
      });

      it('should not add a Program to an array that contains it', () => {
        const program: IProgram = sampleWithRequiredData;
        const programCollection: IProgram[] = [
          {
            ...program,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addProgramToCollectionIfMissing(programCollection, program);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Program to an array that doesn't contain it", () => {
        const program: IProgram = sampleWithRequiredData;
        const programCollection: IProgram[] = [sampleWithPartialData];
        expectedResult = service.addProgramToCollectionIfMissing(programCollection, program);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(program);
      });

      it('should add only unique Program to an array', () => {
        const programArray: IProgram[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const programCollection: IProgram[] = [sampleWithRequiredData];
        expectedResult = service.addProgramToCollectionIfMissing(programCollection, ...programArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const program: IProgram = sampleWithRequiredData;
        const program2: IProgram = sampleWithPartialData;
        expectedResult = service.addProgramToCollectionIfMissing([], program, program2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(program);
        expect(expectedResult).toContain(program2);
      });

      it('should accept null and undefined values', () => {
        const program: IProgram = sampleWithRequiredData;
        expectedResult = service.addProgramToCollectionIfMissing([], null, program, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(program);
      });

      it('should return initial array if no Program is added', () => {
        const programCollection: IProgram[] = [sampleWithRequiredData];
        expectedResult = service.addProgramToCollectionIfMissing(programCollection, undefined, null);
        expect(expectedResult).toEqual(programCollection);
      });
    });

    describe('compareProgram', () => {
      it('should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareProgram(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('should return false if one entity is null', () => {
        const entity1 = { id: 31584 };
        const entity2 = null;

        const compareResult1 = service.compareProgram(entity1, entity2);
        const compareResult2 = service.compareProgram(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey differs', () => {
        const entity1 = { id: 31584 };
        const entity2 = { id: 28657 };

        const compareResult1 = service.compareProgram(entity1, entity2);
        const compareResult2 = service.compareProgram(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey matches', () => {
        const entity1 = { id: 31584 };
        const entity2 = { id: 31584 };

        const compareResult1 = service.compareProgram(entity1, entity2);
        const compareResult2 = service.compareProgram(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
