import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, from, of } from 'rxjs';

import { ILesson } from 'app/entities/service/lesson/lesson.model';
import { LessonService } from 'app/entities/service/lesson/service/lesson.service';
import { IProgram } from 'app/entities/service/program/program.model';
import { ProgramService } from 'app/entities/service/program/service/program.service';
import { ICourse } from '../course.model';
import { CourseService } from '../service/course.service';
import { CourseFormService } from './course-form.service';

import { CourseUpdateComponent } from './course-update.component';

describe('Course Management Update Component', () => {
  let comp: CourseUpdateComponent;
  let fixture: ComponentFixture<CourseUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let courseFormService: CourseFormService;
  let courseService: CourseService;
  let lessonService: LessonService;
  let programService: ProgramService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CourseUpdateComponent],
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
      .overrideTemplate(CourseUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(CourseUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    courseFormService = TestBed.inject(CourseFormService);
    courseService = TestBed.inject(CourseService);
    lessonService = TestBed.inject(LessonService);
    programService = TestBed.inject(ProgramService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('should call Lesson query and add missing value', () => {
      const course: ICourse = { id: 3722 };
      const lessons: ILesson[] = [{ id: 5747 }];
      course.lessons = lessons;

      const lessonCollection: ILesson[] = [{ id: 5747 }];
      jest.spyOn(lessonService, 'query').mockReturnValue(of(new HttpResponse({ body: lessonCollection })));
      const additionalLessons = [...lessons];
      const expectedCollection: ILesson[] = [...additionalLessons, ...lessonCollection];
      jest.spyOn(lessonService, 'addLessonToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ course });
      comp.ngOnInit();

      expect(lessonService.query).toHaveBeenCalled();
      expect(lessonService.addLessonToCollectionIfMissing).toHaveBeenCalledWith(
        lessonCollection,
        ...additionalLessons.map(expect.objectContaining),
      );
      expect(comp.lessonsSharedCollection).toEqual(expectedCollection);
    });

    it('should call Program query and add missing value', () => {
      const course: ICourse = { id: 3722 };
      const programs: IProgram[] = [{ id: 31584 }];
      course.programs = programs;

      const programCollection: IProgram[] = [{ id: 31584 }];
      jest.spyOn(programService, 'query').mockReturnValue(of(new HttpResponse({ body: programCollection })));
      const additionalPrograms = [...programs];
      const expectedCollection: IProgram[] = [...additionalPrograms, ...programCollection];
      jest.spyOn(programService, 'addProgramToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ course });
      comp.ngOnInit();

      expect(programService.query).toHaveBeenCalled();
      expect(programService.addProgramToCollectionIfMissing).toHaveBeenCalledWith(
        programCollection,
        ...additionalPrograms.map(expect.objectContaining),
      );
      expect(comp.programsSharedCollection).toEqual(expectedCollection);
    });

    it('should update editForm', () => {
      const course: ICourse = { id: 3722 };
      const lessons: ILesson = { id: 5747 };
      course.lessons = [lessons];
      const programs: IProgram = { id: 31584 };
      course.programs = [programs];

      activatedRoute.data = of({ course });
      comp.ngOnInit();

      expect(comp.lessonsSharedCollection).toContainEqual(lessons);
      expect(comp.programsSharedCollection).toContainEqual(programs);
      expect(comp.course).toEqual(course);
    });
  });

  describe('save', () => {
    it('should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ICourse>>();
      const course = { id: 2858 };
      jest.spyOn(courseFormService, 'getCourse').mockReturnValue(course);
      jest.spyOn(courseService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ course });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: course }));
      saveSubject.complete();

      // THEN
      expect(courseFormService.getCourse).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(courseService.update).toHaveBeenCalledWith(expect.objectContaining(course));
      expect(comp.isSaving).toEqual(false);
    });

    it('should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ICourse>>();
      const course = { id: 2858 };
      jest.spyOn(courseFormService, 'getCourse').mockReturnValue({ id: null });
      jest.spyOn(courseService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ course: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: course }));
      saveSubject.complete();

      // THEN
      expect(courseFormService.getCourse).toHaveBeenCalled();
      expect(courseService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ICourse>>();
      const course = { id: 2858 };
      jest.spyOn(courseService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ course });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(courseService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });

  describe('Compare relationships', () => {
    describe('compareLesson', () => {
      it('should forward to lessonService', () => {
        const entity = { id: 5747 };
        const entity2 = { id: 25298 };
        jest.spyOn(lessonService, 'compareLesson');
        comp.compareLesson(entity, entity2);
        expect(lessonService.compareLesson).toHaveBeenCalledWith(entity, entity2);
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
  });
});
