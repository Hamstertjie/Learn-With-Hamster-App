import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { DisciplineDetailComponent } from './discipline-detail.component';

describe('Discipline Management Detail Component', () => {
  let comp: DisciplineDetailComponent;
  let fixture: ComponentFixture<DisciplineDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisciplineDetailComponent],
      providers: [
        provideRouter(
          [
            {
              path: '**',
              loadComponent: () => import('./discipline-detail.component').then(m => m.DisciplineDetailComponent),
              resolve: { discipline: () => of({ id: 8998 }) },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    })
      .overrideTemplate(DisciplineDetailComponent, '')
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisciplineDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('should load discipline on init', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', DisciplineDetailComponent);

      // THEN
      expect(instance.discipline()).toEqual(expect.objectContaining({ id: 8998 }));
    });
  });

  describe('PreviousState', () => {
    it('should navigate to previous state', () => {
      jest.spyOn(window.history, 'back');
      comp.previousState();
      expect(window.history.back).toHaveBeenCalled();
    });
  });
});
