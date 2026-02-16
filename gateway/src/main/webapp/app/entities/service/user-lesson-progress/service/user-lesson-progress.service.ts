import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { IUserLessonProgress } from '../user-lesson-progress.model';

@Injectable({ providedIn: 'root' })
export class UserLessonProgressService {
  protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/user-lesson-progress', 'service');

  markProgress(lessonId: number, courseId: number): Observable<HttpResponse<IUserLessonProgress>> {
    return this.http.post<IUserLessonProgress>(`${this.resourceUrl}/mark`, { lessonId, courseId }, { observe: 'response' });
  }

  getCourseProgress(courseId: number): Observable<HttpResponse<IUserLessonProgress[]>> {
    return this.http.get<IUserLessonProgress[]>(`${this.resourceUrl}/course/${courseId}`, { observe: 'response' });
  }
}
