import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import SharedModule from 'app/shared/shared.module';
import { AccountService } from 'app/core/auth/account.service';
import { UserCourseEnrollmentService } from 'app/entities/service/user-course-enrollment/service/user-course-enrollment.service';
import { CartService } from '../cart.service';
import { ICartItem } from '../cart.model';

@Component({
  selector: 'jhi-checkout',
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
  imports: [SharedModule, RouterModule],
})
export default class CheckoutComponent implements OnInit {
  items = signal<ICartItem[]>([]);
  total = signal(0);
  processing = signal(false);
  firstName = signal('');
  lastName = signal('');
  email = signal('');

  private readonly cartService = inject(CartService);
  private readonly enrollmentService = inject(UserCourseEnrollmentService);
  private readonly accountService = inject(AccountService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.items.set(this.cartService.cartItems());
    this.total.set(this.cartService.cartTotal());

    if (this.items().length === 0) {
      this.router.navigate(['/cart']);
      return;
    }

    this.accountService.identity().subscribe(account => {
      if (account) {
        this.firstName.set(account.firstName ?? '');
        this.lastName.set(account.lastName ?? '');
        this.email.set(account.email);
      }
    });
  }

  placeOrder(): void {
    this.processing.set(true);

    // Enroll in all cart courses
    // TODO: Payment gateway integration point — process payment before enrolling
    const enrollCalls = this.items().map(item => this.enrollmentService.enroll(item.courseId));

    forkJoin(enrollCalls).subscribe({
      next: () => {
        this.cartService.clearCart();
        this.router.navigate(['/order-confirmation']);
      },
      error: () => {
        this.processing.set(false);
      },
    });
  }
}
