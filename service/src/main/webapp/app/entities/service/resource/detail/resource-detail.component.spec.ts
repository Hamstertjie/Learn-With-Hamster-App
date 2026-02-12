import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { ResourceDetailComponent } from './resource-detail.component';

describe('Resource Management Detail Component', () => {
  let comp: ResourceDetailComponent;
  let fixture: ComponentFixture<ResourceDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceDetailComponent],
      providers: [
        provideRouter(
          [
            {
              path: '**',
              loadComponent: () => import('./resource-detail.component').then(m => m.ResourceDetailComponent),
              resolve: { resource: () => of({ id: 12681 }) },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    })
      .overrideTemplate(ResourceDetailComponent, '')
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourceDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('should load resource on init', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', ResourceDetailComponent);

      // THEN
      expect(instance.resource()).toEqual(expect.objectContaining({ id: 12681 }));
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
