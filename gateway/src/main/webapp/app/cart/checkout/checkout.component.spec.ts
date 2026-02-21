jest.mock('app/core/auth/account.service');

import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AccountService } from 'app/core/auth/account.service';
import { UserCourseEnrollmentService } from 'app/entities/service/user-course-enrollment/service/user-course-enrollment.service';
import { CartService } from '../cart.service';
import CheckoutComponent from './checkout.component';

describe('CheckoutComponent', () => {
  let comp: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;
  let cartService: CartService;
  let router: Router;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CheckoutComponent, TranslateModule.forRoot()],
      providers: [AccountService, provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    })
      .overrideTemplate(CheckoutComponent, '')
      .compileComponents();
  }));

  beforeEach(() => {
    localStorage.clear();
    fixture = TestBed.createComponent(CheckoutComponent);
    comp = fixture.componentInstance;
    cartService = TestBed.inject(CartService);
    router = TestBed.inject(Router);

    const accountService = TestBed.inject(AccountService);
    accountService.identity = jest.fn(() => of(null));
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(comp).toBeTruthy();
  });

  it('should redirect to /cart if cart is empty on init', () => {
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    comp.ngOnInit();

    expect(navigateSpy).toHaveBeenCalledWith(['/cart']);
  });

  it('should load cart items on init when cart has items', () => {
    cartService.addToCart(1, 'Course A', 25);
    cartService.addToCart(2, 'Course B', 49);

    comp.ngOnInit();

    expect(comp.items().length).toBe(2);
    expect(comp.total()).toBe(74);
  });

  it('should call enrollment service and clear cart on placeOrder', fakeAsync(() => {
    cartService.addToCart(1, 'Course A', 25);
    comp.ngOnInit();

    const enrollmentService = TestBed.inject(UserCourseEnrollmentService);
    jest.spyOn(enrollmentService, 'enroll').mockReturnValue(of({} as any));
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    comp.placeOrder();
    tick();

    expect(enrollmentService.enroll).toHaveBeenCalledWith(1);
    expect(cartService.cartCount()).toBe(0);
    expect(navigateSpy).toHaveBeenCalledWith(['/order-confirmation']);
  }));
});
