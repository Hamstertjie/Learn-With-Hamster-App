import { Component, OnInit, inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IDiscipline } from 'app/entities/service/discipline/discipline.model';
import { DisciplineService } from 'app/entities/service/discipline/service/discipline.service';
import { IProgram } from 'app/entities/service/program/program.model';
import { ProgramService } from 'app/entities/service/program/service/program.service';
import { ICourse } from 'app/entities/service/course/course.model';
import { CourseService } from 'app/entities/service/course/service/course.service';
import { ILesson } from 'app/entities/service/lesson/lesson.model';
import { LessonService } from 'app/entities/service/lesson/service/lesson.service';
import { ResourceType } from 'app/entities/enumerations/resource-type.model';
import { ResourceService } from '../service/resource.service';
import { IResource } from '../resource.model';
import { ResourceFormGroup, ResourceFormService } from './resource-form.service';

@Component({
  selector: 'jhi-resource-update',
  templateUrl: './resource-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class ResourceUpdateComponent implements OnInit {
  isSaving = false;
  resource: IResource | null = null;
  resourceTypeValues = Object.keys(ResourceType);

  disciplinesSharedCollection: IDiscipline[] = [];
  programsSharedCollection: IProgram[] = [];
  coursesSharedCollection: ICourse[] = [];
  lessonsSharedCollection: ILesson[] = [];

  protected resourceService = inject(ResourceService);
  protected resourceFormService = inject(ResourceFormService);
  protected disciplineService = inject(DisciplineService);
  protected programService = inject(ProgramService);
  protected courseService = inject(CourseService);
  protected lessonService = inject(LessonService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: ResourceFormGroup = this.resourceFormService.createResourceFormGroup();

  compareDiscipline = (o1: IDiscipline | null, o2: IDiscipline | null): boolean => this.disciplineService.compareDiscipline(o1, o2);

  compareProgram = (o1: IProgram | null, o2: IProgram | null): boolean => this.programService.compareProgram(o1, o2);

  compareCourse = (o1: ICourse | null, o2: ICourse | null): boolean => this.courseService.compareCourse(o1, o2);

  compareLesson = (o1: ILesson | null, o2: ILesson | null): boolean => this.lessonService.compareLesson(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ resource }) => {
      this.resource = resource;
      if (resource) {
        this.updateForm(resource);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const resource = this.resourceFormService.getResource(this.editForm);
    if (resource.id !== null) {
      this.subscribeToSaveResponse(this.resourceService.update(resource));
    } else {
      this.subscribeToSaveResponse(this.resourceService.create(resource));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IResource>>): void {
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

  protected updateForm(resource: IResource): void {
    this.resource = resource;
    this.resourceFormService.resetForm(this.editForm, resource);

    this.disciplinesSharedCollection = this.disciplineService.addDisciplineToCollectionIfMissing<IDiscipline>(
      this.disciplinesSharedCollection,
      resource.discipline,
    );
    this.programsSharedCollection = this.programService.addProgramToCollectionIfMissing<IProgram>(
      this.programsSharedCollection,
      resource.program,
    );
    this.coursesSharedCollection = this.courseService.addCourseToCollectionIfMissing<ICourse>(
      this.coursesSharedCollection,
      resource.course,
    );
    this.lessonsSharedCollection = this.lessonService.addLessonToCollectionIfMissing<ILesson>(
      this.lessonsSharedCollection,
      resource.lesson,
    );
  }

  protected loadRelationshipsOptions(): void {
    this.disciplineService
      .query()
      .pipe(map((res: HttpResponse<IDiscipline[]>) => res.body ?? []))
      .pipe(
        map((disciplines: IDiscipline[]) =>
          this.disciplineService.addDisciplineToCollectionIfMissing<IDiscipline>(disciplines, this.resource?.discipline),
        ),
      )
      .subscribe((disciplines: IDiscipline[]) => (this.disciplinesSharedCollection = disciplines));

    this.programService
      .query()
      .pipe(map((res: HttpResponse<IProgram[]>) => res.body ?? []))
      .pipe(map((programs: IProgram[]) => this.programService.addProgramToCollectionIfMissing<IProgram>(programs, this.resource?.program)))
      .subscribe((programs: IProgram[]) => (this.programsSharedCollection = programs));

    this.courseService
      .query()
      .pipe(map((res: HttpResponse<ICourse[]>) => res.body ?? []))
      .pipe(map((courses: ICourse[]) => this.courseService.addCourseToCollectionIfMissing<ICourse>(courses, this.resource?.course)))
      .subscribe((courses: ICourse[]) => (this.coursesSharedCollection = courses));

    this.lessonService
      .query()
      .pipe(map((res: HttpResponse<ILesson[]>) => res.body ?? []))
      .pipe(map((lessons: ILesson[]) => this.lessonService.addLessonToCollectionIfMissing<ILesson>(lessons, this.resource?.lesson)))
      .subscribe((lessons: ILesson[]) => (this.lessonsSharedCollection = lessons));
  }
}
