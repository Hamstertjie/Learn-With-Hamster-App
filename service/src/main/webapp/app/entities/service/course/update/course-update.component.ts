import { Component, OnInit, inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ILesson } from 'app/entities/service/lesson/lesson.model';
import { LessonService } from 'app/entities/service/lesson/service/lesson.service';
import { IProgram } from 'app/entities/service/program/program.model';
import { ProgramService } from 'app/entities/service/program/service/program.service';
import { Level } from 'app/entities/enumerations/level.model';
import { CourseService } from '../service/course.service';
import { ICourse } from '../course.model';
import { CourseFormGroup, CourseFormService } from './course-form.service';

@Component({
  selector: 'jhi-course-update',
  templateUrl: './course-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class CourseUpdateComponent implements OnInit {
  isSaving = false;
  course: ICourse | null = null;
  levelValues = Object.keys(Level);

  lessonsSharedCollection: ILesson[] = [];
  programsSharedCollection: IProgram[] = [];

  protected courseService = inject(CourseService);
  protected courseFormService = inject(CourseFormService);
  protected lessonService = inject(LessonService);
  protected programService = inject(ProgramService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: CourseFormGroup = this.courseFormService.createCourseFormGroup();

  compareLesson = (o1: ILesson | null, o2: ILesson | null): boolean => this.lessonService.compareLesson(o1, o2);

  compareProgram = (o1: IProgram | null, o2: IProgram | null): boolean => this.programService.compareProgram(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ course }) => {
      this.course = course;
      if (course) {
        this.updateForm(course);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const course = this.courseFormService.getCourse(this.editForm);
    if (course.id !== null) {
      this.subscribeToSaveResponse(this.courseService.update(course));
    } else {
      this.subscribeToSaveResponse(this.courseService.create(course));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<ICourse>>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
      next: () => this.onSaveSuccess(),
      error: () => this.onSaveError(),
    });
  }

  protected onSaveSuccess(): void {
    this.previousState();
  }

  protected onSaveError(): void {
    // Api for inheritance.
  }

  protected onSaveFinalize(): void {
    this.isSaving = false;
  }

  protected updateForm(course: ICourse): void {
    this.course = course;
    this.courseFormService.resetForm(this.editForm, course);

    this.lessonsSharedCollection = this.lessonService.addLessonToCollectionIfMissing<ILesson>(
      this.lessonsSharedCollection,
      ...(course.lessons ?? []),
    );
    this.programsSharedCollection = this.programService.addProgramToCollectionIfMissing<IProgram>(
      this.programsSharedCollection,
      ...(course.programs ?? []),
    );
  }

  protected loadRelationshipsOptions(): void {
    this.lessonService
      .query()
      .pipe(map((res: HttpResponse<ILesson[]>) => res.body ?? []))
      .pipe(
        map((lessons: ILesson[]) => this.lessonService.addLessonToCollectionIfMissing<ILesson>(lessons, ...(this.course?.lessons ?? []))),
      )
      .subscribe((lessons: ILesson[]) => (this.lessonsSharedCollection = lessons));

    this.programService
      .query()
      .pipe(map((res: HttpResponse<IProgram[]>) => res.body ?? []))
      .pipe(
        map((programs: IProgram[]) =>
          this.programService.addProgramToCollectionIfMissing<IProgram>(programs, ...(this.course?.programs ?? [])),
        ),
      )
      .subscribe((programs: IProgram[]) => (this.programsSharedCollection = programs));
  }
}
