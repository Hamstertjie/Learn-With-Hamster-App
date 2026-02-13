import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateDirective } from 'app/shared/language';

@Component({
  selector: 'jhi-footer',
  templateUrl: './footer.component.html',
  imports: [TranslateDirective, RouterModule],
})
export default class FooterComponent {}
