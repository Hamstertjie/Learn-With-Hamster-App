import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IResource } from '../resource.model';
import { ResourceService } from '../service/resource.service';

@Component({
  templateUrl: './resource-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class ResourceDeleteDialogComponent {
  resource?: IResource;

  protected resourceService = inject(ResourceService);
  protected activeModal = inject(NgbActiveModal);

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: number): void {
    this.resourceService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
