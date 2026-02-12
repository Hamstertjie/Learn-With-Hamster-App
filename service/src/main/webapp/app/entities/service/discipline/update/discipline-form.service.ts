import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { IDiscipline, NewDiscipline } from '../discipline.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IDiscipline for edit and NewDisciplineFormGroupInput for create.
 */
type DisciplineFormGroupInput = IDiscipline | PartialWithRequiredKeyOf<NewDiscipline>;

type DisciplineFormDefaults = Pick<NewDiscipline, 'id' | 'programs'>;

type DisciplineFormGroupContent = {
  id: FormControl<IDiscipline['id'] | NewDiscipline['id']>;
  disciplineName: FormControl<IDiscipline['disciplineName']>;
  disciplineDescription: FormControl<IDiscipline['disciplineDescription']>;
  disciplinePrice: FormControl<IDiscipline['disciplinePrice']>;
  programs: FormControl<IDiscipline['programs']>;
};

export type DisciplineFormGroup = FormGroup<DisciplineFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class DisciplineFormService {
  createDisciplineFormGroup(discipline: DisciplineFormGroupInput = { id: null }): DisciplineFormGroup {
    const disciplineRawValue = {
      ...this.getFormDefaults(),
      ...discipline,
    };
    return new FormGroup<DisciplineFormGroupContent>({
      id: new FormControl(
        { value: disciplineRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      disciplineName: new FormControl(disciplineRawValue.disciplineName, {
        validators: [Validators.required],
      }),
      disciplineDescription: new FormControl(disciplineRawValue.disciplineDescription),
      disciplinePrice: new FormControl(disciplineRawValue.disciplinePrice),
      programs: new FormControl(disciplineRawValue.programs ?? []),
    });
  }

  getDiscipline(form: DisciplineFormGroup): IDiscipline | NewDiscipline {
    return form.getRawValue() as IDiscipline | NewDiscipline;
  }

  resetForm(form: DisciplineFormGroup, discipline: DisciplineFormGroupInput): void {
    const disciplineRawValue = { ...this.getFormDefaults(), ...discipline };
    form.reset(
      {
        ...disciplineRawValue,
        id: { value: disciplineRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): DisciplineFormDefaults {
    return {
      id: null,
      programs: [],
    };
  }
}
