import { Component, OnInit, inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ICourse } from 'app/entities/service/course/course.model';
import { CourseService } from 'app/entities/service/course/service/course.service';
import { IDiscipline } from 'app/entities/service/discipline/discipline.model';
import { DisciplineService } from 'app/entities/service/discipline/service/discipline.service';
import { ProgramService } from '../service/program.service';
import { IProgram } from '../program.model';
import { ProgramFormGroup, ProgramFormService } from './program-form.service';

@Component({
  selector: 'jhi-program-update',
  templateUrl: './program-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class ProgramUpdateComponent implements OnInit {
  isSaving = false;
  program: IProgram | null = null;

  coursesSharedCollection: ICourse[] = [];
  disciplinesSharedCollection: IDiscipline[] = [];

  protected programService = inject(ProgramService);
  protected programFormService = inject(ProgramFormService);
  protected courseService = inject(CourseService);
  protected disciplineService = inject(DisciplineService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: ProgramFormGroup = this.programFormService.createProgramFormGroup();

  compareCourse = (o1: ICourse | null, o2: ICourse | null): boolean => this.courseService.compareCourse(o1, o2);

  compareDiscipline = (o1: IDiscipline | null, o2: IDiscipline | null): boolean => this.disciplineService.compareDiscipline(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ program }) => {
      this.program = program;
      if (program) {
        this.updateForm(program);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const program = this.programFormService.getProgram(this.editForm);
    if (program.id !== null) {
      this.subscribeToSaveResponse(this.programService.update(program));
    } else {
      this.subscribeToSaveResponse(this.programService.create(program));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IProgram>>): void {
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

  protected updateForm(program: IProgram): void {
    this.program = program;
    this.programFormService.resetForm(this.editForm, program);

    this.coursesSharedCollection = this.courseService.addCourseToCollectionIfMissing<ICourse>(
      this.coursesSharedCollection,
      ...(program.courses ?? []),
    );
    this.disciplinesSharedCollection = this.disciplineService.addDisciplineToCollectionIfMissing<IDiscipline>(
      this.disciplinesSharedCollection,
      ...(program.disciplines ?? []),
    );
  }

  protected loadRelationshipsOptions(): void {
    this.courseService
      .query()
      .pipe(map((res: HttpResponse<ICourse[]>) => res.body ?? []))
      .pipe(
        map((courses: ICourse[]) => this.courseService.addCourseToCollectionIfMissing<ICourse>(courses, ...(this.program?.courses ?? []))),
      )
      .subscribe((courses: ICourse[]) => (this.coursesSharedCollection = courses));

    this.disciplineService
      .query()
      .pipe(map((res: HttpResponse<IDiscipline[]>) => res.body ?? []))
      .pipe(
        map((disciplines: IDiscipline[]) =>
          this.disciplineService.addDisciplineToCollectionIfMissing<IDiscipline>(disciplines, ...(this.program?.disciplines ?? [])),
        ),
      )
      .subscribe((disciplines: IDiscipline[]) => (this.disciplinesSharedCollection = disciplines));
  }
}
