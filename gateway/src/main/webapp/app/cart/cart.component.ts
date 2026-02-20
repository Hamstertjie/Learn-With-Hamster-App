import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import SharedModule from 'app/shared/shared.module';
import { CartService } from './cart.service';

@Component({
  selector: 'jhi-cart',
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
  imports: [SharedModule, RouterModule],
})
export default class CartComponent {
  readonly cartService = inject(CartService);

  removeItem(courseId: number): void {
    this.cartService.removeFromCart(courseId);
  }
}
