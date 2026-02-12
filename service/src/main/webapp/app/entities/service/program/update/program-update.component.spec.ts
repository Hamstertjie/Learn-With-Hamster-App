import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, from, of } from 'rxjs';

import { ICourse } from 'app/entities/service/course/course.model';
import { CourseService } from 'app/entities/service/course/service/course.service';
import { IDiscipline } from 'app/entities/service/discipline/discipline.model';
import { DisciplineService } from 'app/entities/service/discipline/service/discipline.service';
import { IProgram } from '../program.model';
import { ProgramService } from '../service/program.service';
import { ProgramFormService } from './program-form.service';

import { ProgramUpdateComponent } from './program-update.component';

describe('Program Management Update Component', () => {
  let comp: ProgramUpdateComponent;
  let fixture: ComponentFixture<ProgramUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let programFormService: ProgramFormService;
  let programService: ProgramService;
  let courseService: CourseService;
  let disciplineService: DisciplineService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProgramUpdateComponent],
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
      .overrideTemplate(ProgramUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(ProgramUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    programFormService = TestBed.inject(ProgramFormService);
    programService = TestBed.inject(ProgramService);
    courseService = TestBed.inject(CourseService);
    disciplineService = TestBed.inject(DisciplineService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('should call Course query and add missing value', () => {
      const program: IProgram = { id: 28657 };
      const courses: ICourse[] = [{ id: 2858 }];
      program.courses = courses;

      const courseCollection: ICourse[] = [{ id: 2858 }];
      jest.spyOn(courseService, 'query').mockReturnValue(of(new HttpResponse({ body: courseCollection })));
      const additionalCourses = [...courses];
      const expectedCollection: ICourse[] = [...additionalCourses, ...courseCollection];
      jest.spyOn(courseService, 'addCourseToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ program });
      comp.ngOnInit();

      expect(courseService.query).toHaveBeenCalled();
      expect(courseService.addCourseToCollectionIfMissing).toHaveBeenCalledWith(
        courseCollection,
        ...additionalCourses.map(expect.objectContaining),
      );
      expect(comp.coursesSharedCollection).toEqual(expectedCollection);
    });

    it('should call Discipline query and add missing value', () => {
      const program: IProgram = { id: 28657 };
      const disciplines: IDiscipline[] = [{ id: 8998 }];
      program.disciplines = disciplines;

      const disciplineCollection: IDiscipline[] = [{ id: 8998 }];
      jest.spyOn(disciplineService, 'query').mockReturnValue(of(new HttpResponse({ body: disciplineCollection })));
      const additionalDisciplines = [...disciplines];
      const expectedCollection: IDiscipline[] = [...additionalDisciplines, ...disciplineCollection];
      jest.spyOn(disciplineService, 'addDisciplineToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ program });
      comp.ngOnInit();

      expect(disciplineService.query).toHaveBeenCalled();
      expect(disciplineService.addDisciplineToCollectionIfMissing).toHaveBeenCalledWith(
        disciplineCollection,
        ...additionalDisciplines.map(expect.objectContaining),
      );
      expect(comp.disciplinesSharedCollection).toEqual(expectedCollection);
    });

    it('should update editForm', () => {
      const program: IProgram = { id: 28657 };
      const courses: ICourse = { id: 2858 };
      program.courses = [courses];
      const disciplines: IDiscipline = { id: 8998 };
      program.disciplines = [disciplines];

      activatedRoute.data = of({ program });
      comp.ngOnInit();

      expect(comp.coursesSharedCollection).toContainEqual(courses);
      expect(comp.disciplinesSharedCollection).toContainEqual(disciplines);
      expect(comp.program).toEqual(program);
    });
  });

  describe('save', () => {
    it('should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IProgram>>();
      const program = { id: 31584 };
      jest.spyOn(programFormService, 'getProgram').mockReturnValue(program);
      jest.spyOn(programService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ program });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: program }));
      saveSubject.complete();

      // THEN
      expect(programFormService.getProgram).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(programService.update).toHaveBeenCalledWith(expect.objectContaining(program));
      expect(comp.isSaving).toEqual(false);
    });

    it('should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IProgram>>();
      const program = { id: 31584 };
      jest.spyOn(programFormService, 'getProgram').mockReturnValue({ id: null });
      jest.spyOn(programService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ program: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: program }));
      saveSubject.complete();

      // THEN
      expect(programFormService.getProgram).toHaveBeenCalled();
      expect(programService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IProgram>>();
      const program = { id: 31584 };
      jest.spyOn(programService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ program });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(programService.update).toHaveBeenCalled();
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

    describe('compareDiscipline', () => {
      it('should forward to disciplineService', () => {
        const entity = { id: 8998 };
        const entity2 = { id: 31095 };
        jest.spyOn(disciplineService, 'compareDiscipline');
        comp.compareDiscipline(entity, entity2);
        expect(disciplineService.compareDiscipline).toHaveBeenCalledWith(entity, entity2);
      });
    });
  });
});
