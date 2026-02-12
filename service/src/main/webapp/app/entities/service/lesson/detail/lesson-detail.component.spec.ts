import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { LessonDetailComponent } from './lesson-detail.component';

describe('Lesson Management Detail Component', () => {
  let comp: LessonDetailComponent;
  let fixture: ComponentFixture<LessonDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonDetailComponent],
      providers: [
        provideRouter(
          [
            {
              path: '**',
              loadComponent: () => import('./lesson-detail.component').then(m => m.LessonDetailComponent),
              resolve: { lesson: () => of({ id: 5747 }) },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    })
      .overrideTemplate(LessonDetailComponent, '')
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LessonDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('should load lesson on init', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', LessonDetailComponent);

      // THEN
      expect(instance.lesson()).toEqual(expect.objectContaining({ id: 5747 }));
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
