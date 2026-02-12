import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { IResource, NewResource } from '../resource.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IResource for edit and NewResourceFormGroupInput for create.
 */
type ResourceFormGroupInput = IResource | PartialWithRequiredKeyOf<NewResource>;

type ResourceFormDefaults = Pick<NewResource, 'id'>;

type ResourceFormGroupContent = {
  id: FormControl<IResource['id'] | NewResource['id']>;
  resourceName: FormControl<IResource['resourceName']>;
  resourceDescription: FormControl<IResource['resourceDescription']>;
  resourceURL: FormControl<IResource['resourceURL']>;
  resourcePreviewImage: FormControl<IResource['resourcePreviewImage']>;
  resourceType: FormControl<IResource['resourceType']>;
  weight: FormControl<IResource['weight']>;
  discipline: FormControl<IResource['discipline']>;
  program: FormControl<IResource['program']>;
  course: FormControl<IResource['course']>;
  lesson: FormControl<IResource['lesson']>;
};

export type ResourceFormGroup = FormGroup<ResourceFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class ResourceFormService {
  createResourceFormGroup(resource: ResourceFormGroupInput = { id: null }): ResourceFormGroup {
    const resourceRawValue = {
      ...this.getFormDefaults(),
      ...resource,
    };
    return new FormGroup<ResourceFormGroupContent>({
      id: new FormControl(
        { value: resourceRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      resourceName: new FormControl(resourceRawValue.resourceName),
      resourceDescription: new FormControl(resourceRawValue.resourceDescription),
      resourceURL: new FormControl(resourceRawValue.resourceURL),
      resourcePreviewImage: new FormControl(resourceRawValue.resourcePreviewImage),
      resourceType: new FormControl(resourceRawValue.resourceType),
      weight: new FormControl(resourceRawValue.weight),
      discipline: new FormControl(resourceRawValue.discipline),
      program: new FormControl(resourceRawValue.program),
      course: new FormControl(resourceRawValue.course),
      lesson: new FormControl(resourceRawValue.lesson),
    });
  }

  getResource(form: ResourceFormGroup): IResource | NewResource {
    return form.getRawValue() as IResource | NewResource;
  }

  resetForm(form: ResourceFormGroup, resource: ResourceFormGroupInput): void {
    const resourceRawValue = { ...this.getFormDefaults(), ...resource };
    form.reset(
      {
        ...resourceRawValue,
        id: { value: resourceRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): ResourceFormDefaults {
    return {
      id: null,
    };
  }
}
