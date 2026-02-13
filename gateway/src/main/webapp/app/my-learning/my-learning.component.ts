import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { AccountService } from 'app/core/auth/account.service';

@Component({
  selector: 'jhi-my-learning',
  templateUrl: './my-learning.component.html',
  styleUrl: './my-learning.component.scss',
  imports: [SharedModule, RouterModule],
})
export default class MyLearningComponent {
  account = inject(AccountService).trackCurrentAccount();
}
