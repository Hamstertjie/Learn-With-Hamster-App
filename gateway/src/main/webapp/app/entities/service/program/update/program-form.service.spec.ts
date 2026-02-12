import { TestBed } from '@angular/core/testing';

import { sampleWithNewData, sampleWithRequiredData } from '../program.test-samples';

import { ProgramFormService } from './program-form.service';

describe('Program Form Service', () => {
  let service: ProgramFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProgramFormService);
  });

  describe('Service methods', () => {
    describe('createProgramFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createProgramFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            programName: expect.any(Object),
            programDescription: expect.any(Object),
            programPrice: expect.any(Object),
            courses: expect.any(Object),
            disciplines: expect.any(Object),
          }),
        );
      });

      it('passing IProgram should create a new form with FormGroup', () => {
        const formGroup = service.createProgramFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            programName: expect.any(Object),
            programDescription: expect.any(Object),
            programPrice: expect.any(Object),
            courses: expect.any(Object),
            disciplines: expect.any(Object),
          }),
        );
      });
    });

    describe('getProgram', () => {
      it('should return NewProgram for default Program initial value', () => {
        const formGroup = service.createProgramFormGroup(sampleWithNewData);

        const program = service.getProgram(formGroup) as any;

        expect(program).toMatchObject(sampleWithNewData);
      });

      it('should return NewProgram for empty Program initial value', () => {
        const formGroup = service.createProgramFormGroup();

        const program = service.getProgram(formGroup) as any;

        expect(program).toMatchObject({});
      });

      it('should return IProgram', () => {
        const formGroup = service.createProgramFormGroup(sampleWithRequiredData);

        const program = service.getProgram(formGroup) as any;

        expect(program).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IProgram should not enable id FormControl', () => {
        const formGroup = service.createProgramFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewProgram should disable id FormControl', () => {
        const formGroup = service.createProgramFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
