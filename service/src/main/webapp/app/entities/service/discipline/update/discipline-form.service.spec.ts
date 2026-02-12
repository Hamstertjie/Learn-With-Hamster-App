import { TestBed } from '@angular/core/testing';

import { sampleWithNewData, sampleWithRequiredData } from '../discipline.test-samples';

import { DisciplineFormService } from './discipline-form.service';

describe('Discipline Form Service', () => {
  let service: DisciplineFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DisciplineFormService);
  });

  describe('Service methods', () => {
    describe('createDisciplineFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createDisciplineFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            disciplineName: expect.any(Object),
            disciplineDescription: expect.any(Object),
            disciplinePrice: expect.any(Object),
            programs: expect.any(Object),
          }),
        );
      });

      it('passing IDiscipline should create a new form with FormGroup', () => {
        const formGroup = service.createDisciplineFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            disciplineName: expect.any(Object),
            disciplineDescription: expect.any(Object),
            disciplinePrice: expect.any(Object),
            programs: expect.any(Object),
          }),
        );
      });
    });

    describe('getDiscipline', () => {
      it('should return NewDiscipline for default Discipline initial value', () => {
        const formGroup = service.createDisciplineFormGroup(sampleWithNewData);

        const discipline = service.getDiscipline(formGroup) as any;

        expect(discipline).toMatchObject(sampleWithNewData);
      });

      it('should return NewDiscipline for empty Discipline initial value', () => {
        const formGroup = service.createDisciplineFormGroup();

        const discipline = service.getDiscipline(formGroup) as any;

        expect(discipline).toMatchObject({});
      });

      it('should return IDiscipline', () => {
        const formGroup = service.createDisciplineFormGroup(sampleWithRequiredData);

        const discipline = service.getDiscipline(formGroup) as any;

        expect(discipline).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IDiscipline should not enable id FormControl', () => {
        const formGroup = service.createDisciplineFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewDiscipline should disable id FormControl', () => {
        const formGroup = service.createDisciplineFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
