import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    localStorage.clear();
    service = new CartService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('addToCart', () => {
    it('should add an item to the cart', () => {
      service.addToCart(1, 'Test Course', 29.99);

      expect(service.cartCount()).toBe(1);
      expect(service.cartItems()[0].courseId).toBe(1);
      expect(service.cartItems()[0].courseTitle).toBe('Test Course');
      expect(service.cartItems()[0].coursePrice).toBe(29.99);
    });

    it('should not add duplicate items', () => {
      service.addToCart(1, 'Test Course', 29.99);
      service.addToCart(1, 'Test Course', 29.99);

      expect(service.cartCount()).toBe(1);
    });

    it('should add multiple different items', () => {
      service.addToCart(1, 'Course A', 19);
      service.addToCart(2, 'Course B', 29);

      expect(service.cartCount()).toBe(2);
    });

    it('should persist to localStorage', () => {
      service.addToCart(1, 'Test Course', 29.99);

      const stored = JSON.parse(localStorage.getItem('lwh_cart') ?? '[]');
      expect(stored.length).toBe(1);
      expect(stored[0].courseId).toBe(1);
    });
  });

  describe('removeFromCart', () => {
    it('should remove an item from the cart', () => {
      service.addToCart(1, 'Course A', 19);
      service.addToCart(2, 'Course B', 29);

      service.removeFromCart(1);

      expect(service.cartCount()).toBe(1);
      expect(service.cartItems()[0].courseId).toBe(2);
    });

    it('should do nothing when removing non-existent item', () => {
      service.addToCart(1, 'Course A', 19);

      service.removeFromCart(999);

      expect(service.cartCount()).toBe(1);
    });
  });

  describe('isInCart', () => {
    it('should return true for items in cart', () => {
      service.addToCart(1, 'Test', 10);

      expect(service.isInCart(1)).toBe(true);
    });

    it('should return false for items not in cart', () => {
      expect(service.isInCart(999)).toBe(false);
    });
  });

  describe('clearCart', () => {
    it('should remove all items', () => {
      service.addToCart(1, 'Course A', 19);
      service.addToCart(2, 'Course B', 29);

      service.clearCart();

      expect(service.cartCount()).toBe(0);
      expect(service.cartItems().length).toBe(0);
    });

    it('should clear localStorage', () => {
      service.addToCart(1, 'Test', 10);

      service.clearCart();

      expect(localStorage.getItem('lwh_cart')).toBeNull();
    });
  });

  describe('cartTotal', () => {
    it('should return 0 for empty cart', () => {
      expect(service.cartTotal()).toBe(0);
    });

    it('should sum all item prices', () => {
      service.addToCart(1, 'Course A', 19);
      service.addToCart(2, 'Course B', 29);
      service.addToCart(3, 'Course C', 49);

      expect(service.cartTotal()).toBe(97);
    });
  });

  describe('localStorage persistence', () => {
    it('should load items from localStorage on construction', () => {
      const items = [{ courseId: 5, courseTitle: 'Saved Course', coursePrice: 25, addedAt: new Date().toISOString() }];
      localStorage.setItem('lwh_cart', JSON.stringify(items));

      const freshService = new CartService();

      expect(freshService.cartCount()).toBe(1);
      expect(freshService.cartItems()[0].courseTitle).toBe('Saved Course');
    });

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem('lwh_cart', 'not-valid-json');

      const freshService = new CartService();

      expect(freshService.cartCount()).toBe(0);
    });
  });
});
