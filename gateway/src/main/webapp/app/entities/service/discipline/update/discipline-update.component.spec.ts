import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, from, of } from 'rxjs';

import { IProgram } from 'app/entities/service/program/program.model';
import { ProgramService } from 'app/entities/service/program/service/program.service';
import { DisciplineService } from '../service/discipline.service';
import { IDiscipline } from '../discipline.model';
import { DisciplineFormService } from './discipline-form.service';

import { DisciplineUpdateComponent } from './discipline-update.component';

describe('Discipline Management Update Component', () => {
  let comp: DisciplineUpdateComponent;
  let fixture: ComponentFixture<DisciplineUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let disciplineFormService: DisciplineFormService;
  let disciplineService: DisciplineService;
  let programService: ProgramService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DisciplineUpdateComponent],
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
      .overrideTemplate(DisciplineUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(DisciplineUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    disciplineFormService = TestBed.inject(DisciplineFormService);
    disciplineService = TestBed.inject(DisciplineService);
    programService = TestBed.inject(ProgramService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('should call Program query and add missing value', () => {
      const discipline: IDiscipline = { id: 31095 };
      const programs: IProgram[] = [{ id: 31584 }];
      discipline.programs = programs;

      const programCollection: IProgram[] = [{ id: 31584 }];
      jest.spyOn(programService, 'query').mockReturnValue(of(new HttpResponse({ body: programCollection })));
      const additionalPrograms = [...programs];
      const expectedCollection: IProgram[] = [...additionalPrograms, ...programCollection];
      jest.spyOn(programService, 'addProgramToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ discipline });
      comp.ngOnInit();

      expect(programService.query).toHaveBeenCalled();
      expect(programService.addProgramToCollectionIfMissing).toHaveBeenCalledWith(
        programCollection,
        ...additionalPrograms.map(expect.objectContaining),
      );
      expect(comp.programsSharedCollection).toEqual(expectedCollection);
    });

    it('should update editForm', () => {
      const discipline: IDiscipline = { id: 31095 };
      const programs: IProgram = { id: 31584 };
      discipline.programs = [programs];

      activatedRoute.data = of({ discipline });
      comp.ngOnInit();

      expect(comp.programsSharedCollection).toContainEqual(programs);
      expect(comp.discipline).toEqual(discipline);
    });
  });

  describe('save', () => {
    it('should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IDiscipline>>();
      const discipline = { id: 8998 };
      jest.spyOn(disciplineFormService, 'getDiscipline').mockReturnValue(discipline);
      jest.spyOn(disciplineService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ discipline });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: discipline }));
      saveSubject.complete();

      // THEN
      expect(disciplineFormService.getDiscipline).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(disciplineService.update).toHaveBeenCalledWith(expect.objectContaining(discipline));
      expect(comp.isSaving).toEqual(false);
    });

    it('should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IDiscipline>>();
      const discipline = { id: 8998 };
      jest.spyOn(disciplineFormService, 'getDiscipline').mockReturnValue({ id: null });
      jest.spyOn(disciplineService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ discipline: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: discipline }));
      saveSubject.complete();

      // THEN
      expect(disciplineFormService.getDiscipline).toHaveBeenCalled();
      expect(disciplineService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IDiscipline>>();
      const discipline = { id: 8998 };
      jest.spyOn(disciplineService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ discipline });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(disciplineService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });

  describe('Compare relationships', () => {
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
