import { Injectable, signal, computed } from '@angular/core';
import { ICartItem } from './cart.model';

const CART_KEY = 'lwh_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private items = signal<ICartItem[]>(this.loadFromStorage());

  cartCount = computed(() => this.items().length);
  cartTotal = computed(() => this.items().reduce((sum, item) => sum + item.coursePrice, 0));
  cartItems = computed(() => this.items());

  addToCart(courseId: number, courseTitle: string, coursePrice: number): void {
    if (this.isInCart(courseId)) return;
    const item: ICartItem = { courseId, courseTitle, coursePrice, addedAt: new Date().toISOString() };
    const updated = [...this.items(), item];
    this.items.set(updated);
    this.saveToStorage(updated);
  }

  removeFromCart(courseId: number): void {
    const updated = this.items().filter(i => i.courseId !== courseId);
    this.items.set(updated);
    this.saveToStorage(updated);
  }

  isInCart(courseId: number): boolean {
    return this.items().some(i => i.courseId === courseId);
  }

  clearCart(): void {
    this.items.set([]);
    localStorage.removeItem(CART_KEY);
  }

  private loadFromStorage(): ICartItem[] {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(items: ICartItem[]): void {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }
}
