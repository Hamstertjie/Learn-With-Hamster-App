import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IDiscipline } from '../discipline.model';
import { DisciplineService } from '../service/discipline.service';

@Component({
  templateUrl: './discipline-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class DisciplineDeleteDialogComponent {
  discipline?: IDiscipline;

  protected disciplineService = inject(DisciplineService);
  protected activeModal = inject(NgbActiveModal);

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: number): void {
    this.disciplineService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
