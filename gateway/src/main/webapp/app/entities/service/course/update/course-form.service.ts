import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { ICourse, NewCourse } from '../course.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts ICourse for edit and NewCourseFormGroupInput for create.
 */
type CourseFormGroupInput = ICourse | PartialWithRequiredKeyOf<NewCourse>;

type CourseFormDefaults = Pick<NewCourse, 'id' | 'lessons' | 'programs'>;

type CourseFormGroupContent = {
  id: FormControl<ICourse['id'] | NewCourse['id']>;
  courseTitle: FormControl<ICourse['courseTitle']>;
  courseDescription: FormControl<ICourse['courseDescription']>;
  coursePrice: FormControl<ICourse['coursePrice']>;
  courseLevel: FormControl<ICourse['courseLevel']>;
  lessons: FormControl<ICourse['lessons']>;
  programs: FormControl<ICourse['programs']>;
};

export type CourseFormGroup = FormGroup<CourseFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class CourseFormService {
  createCourseFormGroup(course: CourseFormGroupInput = { id: null }): CourseFormGroup {
    const courseRawValue = {
      ...this.getFormDefaults(),
      ...course,
    };
    return new FormGroup<CourseFormGroupContent>({
      id: new FormControl(
        { value: courseRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      courseTitle: new FormControl(courseRawValue.courseTitle, {
        validators: [Validators.required],
      }),
      courseDescription: new FormControl(courseRawValue.courseDescription),
      coursePrice: new FormControl(courseRawValue.coursePrice),
      courseLevel: new FormControl(courseRawValue.courseLevel),
      lessons: new FormControl(courseRawValue.lessons ?? []),
      programs: new FormControl(courseRawValue.programs ?? []),
    });
  }

  getCourse(form: CourseFormGroup): ICourse | NewCourse {
    return form.getRawValue() as ICourse | NewCourse;
  }

  resetForm(form: CourseFormGroup, course: CourseFormGroupInput): void {
    const courseRawValue = { ...this.getFormDefaults(), ...course };
    form.reset(
      {
        ...courseRawValue,
        id: { value: courseRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): CourseFormDefaults {
    return {
      id: null,
      lessons: [],
      programs: [],
    };
  }
}
