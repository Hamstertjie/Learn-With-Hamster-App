import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import CartComponent from './cart.component';
import { CartService } from './cart.service';

describe('CartComponent', () => {
  let comp: CartComponent;
  let fixture: ComponentFixture<CartComponent>;
  let cartService: CartService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CartComponent, TranslateModule.forRoot()],
      providers: [provideRouter([])],
    })
      .overrideTemplate(CartComponent, '')
      .compileComponents();
  }));

  beforeEach(() => {
    localStorage.clear();
    fixture = TestBed.createComponent(CartComponent);
    comp = fixture.componentInstance;
    cartService = TestBed.inject(CartService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(comp).toBeTruthy();
  });

  it('should inject CartService', () => {
    expect(comp.cartService).toBeTruthy();
  });

  it('should remove item from cart when removeItem is called', () => {
    cartService.addToCart(1, 'Test Course', 25);
    expect(cartService.cartCount()).toBe(1);

    comp.removeItem(1);

    expect(cartService.cartCount()).toBe(0);
  });
});
