import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, from, of } from 'rxjs';

import { ICourse } from 'app/entities/service/course/course.model';
import { CourseService } from 'app/entities/service/course/service/course.service';
import { LessonService } from '../service/lesson.service';
import { ILesson } from '../lesson.model';
import { LessonFormService } from './lesson-form.service';

import { LessonUpdateComponent } from './lesson-update.component';

describe('Lesson Management Update Component', () => {
  let comp: LessonUpdateComponent;
  let fixture: ComponentFixture<LessonUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let lessonFormService: LessonFormService;
  let lessonService: LessonService;
  let courseService: CourseService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LessonUpdateComponent],
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
      .overrideTemplate(LessonUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(LessonUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    lessonFormService = TestBed.inject(LessonFormService);
    lessonService = TestBed.inject(LessonService);
    courseService = TestBed.inject(CourseService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('should call Course query and add missing value', () => {
      const lesson: ILesson = { id: 25298 };
      const courses: ICourse[] = [{ id: 2858 }];
      lesson.courses = courses;

      const courseCollection: ICourse[] = [{ id: 2858 }];
      jest.spyOn(courseService, 'query').mockReturnValue(of(new HttpResponse({ body: courseCollection })));
      const additionalCourses = [...courses];
      const expectedCollection: ICourse[] = [...additionalCourses, ...courseCollection];
      jest.spyOn(courseService, 'addCourseToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ lesson });
      comp.ngOnInit();

      expect(courseService.query).toHaveBeenCalled();
      expect(courseService.addCourseToCollectionIfMissing).toHaveBeenCalledWith(
        courseCollection,
        ...additionalCourses.map(expect.objectContaining),
      );
      expect(comp.coursesSharedCollection).toEqual(expectedCollection);
    });

    it('should update editForm', () => {
      const lesson: ILesson = { id: 25298 };
      const courses: ICourse = { id: 2858 };
      lesson.courses = [courses];

      activatedRoute.data = of({ lesson });
      comp.ngOnInit();

      expect(comp.coursesSharedCollection).toContainEqual(courses);
      expect(comp.lesson).toEqual(lesson);
    });
  });

  describe('save', () => {
    it('should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ILesson>>();
      const lesson = { id: 5747 };
      jest.spyOn(lessonFormService, 'getLesson').mockReturnValue(lesson);
      jest.spyOn(lessonService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ lesson });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: lesson }));
      saveSubject.complete();

      // THEN
      expect(lessonFormService.getLesson).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(lessonService.update).toHaveBeenCalledWith(expect.objectContaining(lesson));
      expect(comp.isSaving).toEqual(false);
    });

    it('should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ILesson>>();
      const lesson = { id: 5747 };
      jest.spyOn(lessonFormService, 'getLesson').mockReturnValue({ id: null });
      jest.spyOn(lessonService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ lesson: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: lesson }));
      saveSubject.complete();

      // THEN
      expect(lessonFormService.getLesson).toHaveBeenCalled();
      expect(lessonService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ILesson>>();
      const lesson = { id: 5747 };
      jest.spyOn(lessonService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ lesson });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(lessonService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });

  describe('Compare relationships', () => {
    describe('compareCourse', () => {
      it('should forward to courseService', () => {
        const entity = { id: 2858 };
        const entity2 = { id: 3722 };
        jest.spyOn(courseService, 'compareCourse');
        comp.compareCourse(entity, entity2);
        expect(courseService.compareCourse).toHaveBeenCalledWith(entity, entity2);
      });
    });
  });
});
