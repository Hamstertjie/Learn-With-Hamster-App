import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { IProgram, NewProgram } from '../program.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IProgram for edit and NewProgramFormGroupInput for create.
 */
type ProgramFormGroupInput = IProgram | PartialWithRequiredKeyOf<NewProgram>;

type ProgramFormDefaults = Pick<NewProgram, 'id' | 'courses' | 'disciplines'>;

type ProgramFormGroupContent = {
  id: FormControl<IProgram['id'] | NewProgram['id']>;
  programName: FormControl<IProgram['programName']>;
  programDescription: FormControl<IProgram['programDescription']>;
  programPrice: FormControl<IProgram['programPrice']>;
  courses: FormControl<IProgram['courses']>;
  disciplines: FormControl<IProgram['disciplines']>;
};

export type ProgramFormGroup = FormGroup<ProgramFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class ProgramFormService {
  createProgramFormGroup(program: ProgramFormGroupInput = { id: null }): ProgramFormGroup {
    const programRawValue = {
      ...this.getFormDefaults(),
      ...program,
    };
    return new FormGroup<ProgramFormGroupContent>({
      id: new FormControl(
        { value: programRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      programName: new FormControl(programRawValue.programName, {
        validators: [Validators.required],
      }),
      programDescription: new FormControl(programRawValue.programDescription),
      programPrice: new FormControl(programRawValue.programPrice),
      courses: new FormControl(programRawValue.courses ?? []),
      disciplines: new FormControl(programRawValue.disciplines ?? []),
    });
  }

  getProgram(form: ProgramFormGroup): IProgram | NewProgram {
    return form.getRawValue() as IProgram | NewProgram;
  }

  resetForm(form: ProgramFormGroup, program: ProgramFormGroupInput): void {
    const programRawValue = { ...this.getFormDefaults(), ...program };
    form.reset(
      {
        ...programRawValue,
        id: { value: programRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): ProgramFormDefaults {
    return {
      id: null,
      courses: [],
      disciplines: [],
    };
  }
}
