import { Component, OnInit, inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IProgram } from 'app/entities/service/program/program.model';
import { ProgramService } from 'app/entities/service/program/service/program.service';
import { IDiscipline } from '../discipline.model';
import { DisciplineService } from '../service/discipline.service';
import { DisciplineFormGroup, DisciplineFormService } from './discipline-form.service';

@Component({
  selector: 'jhi-discipline-update',
  templateUrl: './discipline-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class DisciplineUpdateComponent implements OnInit {
  isSaving = false;
  discipline: IDiscipline | null = null;

  programsSharedCollection: IProgram[] = [];

  protected disciplineService = inject(DisciplineService);
  protected disciplineFormService = inject(DisciplineFormService);
  protected programService = inject(ProgramService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: DisciplineFormGroup = this.disciplineFormService.createDisciplineFormGroup();

  compareProgram = (o1: IProgram | null, o2: IProgram | null): boolean => this.programService.compareProgram(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ discipline }) => {
      this.discipline = discipline;
      if (discipline) {
        this.updateForm(discipline);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const discipline = this.disciplineFormService.getDiscipline(this.editForm);
    if (discipline.id !== null) {
      this.subscribeToSaveResponse(this.disciplineService.update(discipline));
    } else {
      this.subscribeToSaveResponse(this.disciplineService.create(discipline));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IDiscipline>>): void {
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

  protected updateForm(discipline: IDiscipline): void {
    this.discipline = discipline;
    this.disciplineFormService.resetForm(this.editForm, discipline);

    this.programsSharedCollection = this.programService.addProgramToCollectionIfMissing<IProgram>(
      this.programsSharedCollection,
      ...(discipline.programs ?? []),
    );
  }

  protected loadRelationshipsOptions(): void {
    this.programService
      .query()
      .pipe(map((res: HttpResponse<IProgram[]>) => res.body ?? []))
      .pipe(
        map((programs: IProgram[]) =>
          this.programService.addProgramToCollectionIfMissing<IProgram>(programs, ...(this.discipline?.programs ?? [])),
        ),
      )
      .subscribe((programs: IProgram[]) => (this.programsSharedCollection = programs));
  }
}
