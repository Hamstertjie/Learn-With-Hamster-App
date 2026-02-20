import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { mergeMap } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { ActivateService } from './activate.service';

@Component({
  selector: 'jhi-activate',
  imports: [SharedModule, RouterModule],
  templateUrl: './activate.component.html',
})
export default class ActivateComponent implements OnInit {
  error = signal(false);
  success = signal(false);

  private readonly activateService = inject(ActivateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.route.queryParams.pipe(mergeMap(params => this.activateService.get(params.key))).subscribe({
      next: () => {
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/']), 3000);
      },
      error: () => this.error.set(true),
    });
  }
}
