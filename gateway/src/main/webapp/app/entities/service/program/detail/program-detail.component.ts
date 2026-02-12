import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { IProgram } from '../program.model';

@Component({
  selector: 'jhi-program-detail',
  templateUrl: './program-detail.component.html',
  imports: [SharedModule, RouterModule],
})
export class ProgramDetailComponent {
  program = input<IProgram | null>(null);

  previousState(): void {
    window.history.back();
  }
}
