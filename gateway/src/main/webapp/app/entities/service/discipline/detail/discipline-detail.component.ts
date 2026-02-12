import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { IDiscipline } from '../discipline.model';

@Component({
  selector: 'jhi-discipline-detail',
  templateUrl: './discipline-detail.component.html',
  imports: [SharedModule, RouterModule],
})
export class DisciplineDetailComponent {
  discipline = input<IDiscipline | null>(null);

  previousState(): void {
    window.history.back();
  }
}
