import { TestBed, fakeAsync, inject, tick, waitForAsync } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ActivateService } from './activate.service';
import ActivateComponent from './activate.component';

describe('ActivateComponent', () => {
  let comp: ActivateComponent;
  let mockRouter: { navigate: jest.Mock };

  beforeEach(waitForAsync(() => {
    mockRouter = { navigate: jest.fn() };

    TestBed.configureTestingModule({
      imports: [ActivateComponent],
      providers: [
        provideHttpClient(),
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({ key: 'ABC123' }) },
        },
        {
          provide: Router,
          useValue: mockRouter,
        },
      ],
    })
      .overrideTemplate(ActivateComponent, '')
      .compileComponents();
  }));

  beforeEach(() => {
    const fixture = TestBed.createComponent(ActivateComponent);
    comp = fixture.componentInstance;
  });

  it('calls activate.get with the key from params', inject(
    [ActivateService],
    fakeAsync((service: ActivateService) => {
      jest.spyOn(service, 'get').mockReturnValue(of());

      comp.ngOnInit();
      tick(3000);

      expect(service.get).toHaveBeenCalledWith('ABC123');
    }),
  ));

  it('should set set success to true upon successful activation', inject(
    [ActivateService],
    fakeAsync((service: ActivateService) => {
      jest.spyOn(service, 'get').mockReturnValue(of({}));

      comp.ngOnInit();
      tick(3000);

      expect(comp.error()).toBe(false);
      expect(comp.success()).toBe(true);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    }),
  ));

  it('should set set error to true upon activation failure', inject(
    [ActivateService],
    fakeAsync((service: ActivateService) => {
      jest.spyOn(service, 'get').mockReturnValue(throwError(Error));

      comp.ngOnInit();
      tick();

      expect(comp.error()).toBe(true);
      expect(comp.success()).toBe(false);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    }),
  ));
});
