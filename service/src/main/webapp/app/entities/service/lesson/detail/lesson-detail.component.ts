import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { ILesson } from '../lesson.model';

@Component({
  selector: 'jhi-lesson-detail',
  templateUrl: './lesson-detail.component.html',
  imports: [SharedModule, RouterModule],
})
export class LessonDetailComponent {
  lesson = input<ILesson | null>(null);

  previousState(): void {
    window.history.back();
  }
}
