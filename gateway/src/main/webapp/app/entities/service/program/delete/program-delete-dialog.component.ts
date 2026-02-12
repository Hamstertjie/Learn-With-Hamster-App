import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IProgram } from '../program.model';
import { ProgramService } from '../service/program.service';

@Component({
  templateUrl: './program-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class ProgramDeleteDialogComponent {
  program?: IProgram;

  protected programService = inject(ProgramService);
  protected activeModal = inject(NgbActiveModal);

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: number): void {
    this.programService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
