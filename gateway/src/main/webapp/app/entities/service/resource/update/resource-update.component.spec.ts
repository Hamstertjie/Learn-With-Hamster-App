import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, from, of } from 'rxjs';

import { IDiscipline } from 'app/entities/service/discipline/discipline.model';
import { DisciplineService } from 'app/entities/service/discipline/service/discipline.service';
import { IProgram } from 'app/entities/service/program/program.model';
import { ProgramService } from 'app/entities/service/program/service/program.service';
import { ICourse } from 'app/entities/service/course/course.model';
import { CourseService } from 'app/entities/service/course/service/course.service';
import { ILesson } from 'app/entities/service/lesson/lesson.model';
import { LessonService } from 'app/entities/service/lesson/service/lesson.service';
import { IResource } from '../resource.model';
import { ResourceService } from '../service/resource.service';
import { ResourceFormService } from './resource-form.service';

import { ResourceUpdateComponent } from './resource-update.component';

describe('Resource Management Update Component', () => {
  let comp: ResourceUpdateComponent;
  let fixture: ComponentFixture<ResourceUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let resourceFormService: ResourceFormService;
  let resourceService: ResourceService;
  let disciplineService: DisciplineService;
  let programService: ProgramService;
  let courseService: CourseService;
  let lessonService: LessonService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ResourceUpdateComponent],
      providers: [
        provideHttpClient(),
        FormBuilder,
        {
          provide: ActivatedRoute,
          useValue: {
            params: from([{}]),
          },
        },
      ],
    })
      .overrideTemplate(ResourceUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(ResourceUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    resourceFormService = TestBed.inject(ResourceFormService);
    resourceService = TestBed.inject(ResourceService);
    disciplineService = TestBed.inject(DisciplineService);
    programService = TestBed.inject(ProgramService);
    courseService = TestBed.inject(CourseService);
    lessonService = TestBed.inject(LessonService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('should call Discipline query and add missing value', () => {
      const resource: IResource = { id: 18114 };
      const discipline: IDiscipline = { id: 8998 };
      resource.discipline = discipline;

      const disciplineCollection: IDiscipline[] = [{ id: 8998 }];
      jest.spyOn(disciplineService, 'query').mockReturnValue(of(new HttpResponse({ body: disciplineCollection })));
      const additionalDisciplines = [discipline];
      const expectedCollection: IDiscipline[] = [...additionalDisciplines, ...disciplineCollection];
      jest.spyOn(disciplineService, 'addDisciplineToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ resource });
      comp.ngOnInit();

      expect(disciplineService.query).toHaveBeenCalled();
      expect(disciplineService.addDisciplineToCollectionIfMissing).toHaveBeenCalledWith(
        disciplineCollection,
        ...additionalDisciplines.map(expect.objectContaining),
      );
      expect(comp.disciplinesSharedCollection).toEqual(expectedCollection);
    });

    it('should call Program query and add missing value', () => {
      const resource: IResource = { id: 18114 };
      const program: IProgram = { id: 31584 };
      resource.program = program;

      const programCollection: IProgram[] = [{ id: 31584 }];
      jest.spyOn(programService, 'query').mockReturnValue(of(new HttpResponse({ body: programCollection })));
      const additionalPrograms = [program];
      const expectedCollection: IProgram[] = [...additionalPrograms, ...programCollection];
      jest.spyOn(programService, 'addProgramToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ resource });
      comp.ngOnInit();

      expect(programService.query).toHaveBeenCalled();
      expect(programService.addProgramToCollectionIfMissing).toHaveBeenCalledWith(
        programCollection,
        ...additionalPrograms.map(expect.objectContaining),
      );
      expect(comp.programsSharedCollection).toEqual(expectedCollection);
    });

    it('should call Course query and add missing value', () => {
      const resource: IResource = { id: 18114 };
      const course: ICourse = { id: 2858 };
      resource.course = course;

      const courseCollection: ICourse[] = [{ id: 2858 }];
      jest.spyOn(courseService, 'query').mockReturnValue(of(new HttpResponse({ body: courseCollection })));
      const additionalCourses = [course];
      const expectedCollection: ICourse[] = [...additionalCourses, ...courseCollection];
      jest.spyOn(courseService, 'addCourseToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ resource });
      comp.ngOnInit();

      expect(courseService.query).toHaveBeenCalled();
      expect(courseService.addCourseToCollectionIfMissing).toHaveBeenCalledWith(
        courseCollection,
        ...additionalCourses.map(expect.objectContaining),
      );
      expect(comp.coursesSharedCollection).toEqual(expectedCollection);
    });

    it('should call Lesson query and add missing value', () => {
      const resource: IResource = { id: 18114 };
      const lesson: ILesson = { id: 5747 };
      resource.lesson = lesson;

      const lessonCollection: ILesson[] = [{ id: 5747 }];
      jest.spyOn(lessonService, 'query').mockReturnValue(of(new HttpResponse({ body: lessonCollection })));
      const additionalLessons = [lesson];
      const expectedCollection: ILesson[] = [...additionalLessons, ...lessonCollection];
      jest.spyOn(lessonService, 'addLessonToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ resource });
      comp.ngOnInit();

      expect(lessonService.query).toHaveBeenCalled();
      expect(lessonService.addLessonToCollectionIfMissing).toHaveBeenCalledWith(
        lessonCollection,
        ...additionalLessons.map(expect.objectContaining),
      );
      expect(comp.lessonsSharedCollection).toEqual(expectedCollection);
    });

    it('should update editForm', () => {
      const resource: IResource = { id: 18114 };
      const discipline: IDiscipline = { id: 8998 };
      resource.discipline = discipline;
      const program: IProgram = { id: 31584 };
      resource.program = program;
      const course: ICourse = { id: 2858 };
      resource.course = course;
      const lesson: ILesson = { id: 5747 };
      resource.lesson = lesson;

      activatedRoute.data = of({ resource });
      comp.ngOnInit();

      expect(comp.disciplinesSharedCollection).toContainEqual(discipline);
      expect(comp.programsSharedCollection).toContainEqual(program);
      expect(comp.coursesSharedCollection).toContainEqual(course);
      expect(comp.lessonsSharedCollection).toContainEqual(lesson);
      expect(comp.resource).toEqual(resource);
    });
  });

  describe('save', () => {
    it('should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IResource>>();
      const resource = { id: 12681 };
      jest.spyOn(resourceFormService, 'getResource').mockReturnValue(resource);
      jest.spyOn(resourceService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ resource });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: resource }));
      saveSubject.complete();

      // THEN
      expect(resourceFormService.getResource).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(resourceService.update).toHaveBeenCalledWith(expect.objectContaining(resource));
      expect(comp.isSaving).toEqual(false);
    });

    it('should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IResource>>();
      const resource = { id: 12681 };
      jest.spyOn(resourceFormService, 'getResource').mockReturnValue({ id: null });
      jest.spyOn(resourceService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ resource: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: resource }));
      saveSubject.complete();

      // THEN
      expect(resourceFormService.getResource).toHaveBeenCalled();
      expect(resourceService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IResource>>();
      const resource = { id: 12681 };
      jest.spyOn(resourceService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ resource });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(resourceService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });

  describe('Compare relationships', () => {
    describe('compareDiscipline', () => {
      it('should forward to disciplineService', () => {
        const entity = { id: 8998 };
        const entity2 = { id: 31095 };
        jest.spyOn(disciplineService, 'compareDiscipline');
        comp.compareDiscipline(entity, entity2);
        expect(disciplineService.compareDiscipline).toHaveBeenCalledWith(entity, entity2);
      });
    });

    describe('compareProgram', () => {
      it('should forward to programService', () => {
        const entity = { id: 31584 };
        const entity2 = { id: 28657 };
        jest.spyOn(programService, 'compareProgram');
        comp.compareProgram(entity, entity2);
        expect(programService.compareProgram).toHaveBeenCalledWith(entity, entity2);
      });
    });

    describe('compareCourse', () => {
      it('should forward to courseService', () => {
        const entity = { id: 2858 };
        const entity2 = { id: 3722 };
        jest.spyOn(courseService, 'compareCourse');
        comp.compareCourse(entity, entity2);
        expect(courseService.compareCourse).toHaveBeenCalledWith(entity, entity2);
      });
    });

    describe('compareLesson', () => {
      it('should forward to lessonService', () => {
        const entity = { id: 5747 };
        const entity2 = { id: 25298 };
        jest.spyOn(lessonService, 'compareLesson');
        comp.compareLesson(entity, entity2);
        expect(lessonService.compareLesson).toHaveBeenCalledWith(entity, entity2);
      });
    });
  });
});
