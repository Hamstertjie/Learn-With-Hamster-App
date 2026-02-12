import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { ICourse } from '../course.model';

@Component({
  selector: 'jhi-course-detail',
  templateUrl: './course-detail.component.html',
  imports: [SharedModule, RouterModule],
})
export class CourseDetailComponent {
  course = input<ICourse | null>(null);

  previousState(): void {
    window.history.back();
  }
}
