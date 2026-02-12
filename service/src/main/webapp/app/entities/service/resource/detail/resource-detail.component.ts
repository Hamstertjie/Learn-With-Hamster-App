import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { IResource } from '../resource.model';

@Component({
  selector: 'jhi-resource-detail',
  templateUrl: './resource-detail.component.html',
  imports: [SharedModule, RouterModule],
})
export class ResourceDetailComponent {
  resource = input<IResource | null>(null);

  previousState(): void {
    window.history.back();
  }
}
