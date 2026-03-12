import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { TranslateDirective } from 'app/shared/language';

@Component({
  selector: 'jhi-footer',
  templateUrl: './footer.component.html',
  imports: [TranslateDirective, RouterModule, FaIconComponent],
})
export default class FooterComponent {}
