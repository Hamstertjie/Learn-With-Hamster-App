import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { IUserCourseEnrollment } from '../user-course-enrollment.model';

@Injectable({ providedIn: 'root' })
export class UserCourseEnrollmentService {
  protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/user-course-enrollment', 'service');

  enroll(courseId: number): Observable<HttpResponse<IUserCourseEnrollment>> {
    return this.http.post<IUserCourseEnrollment>(`${this.resourceUrl}/enroll`, { courseId }, { observe: 'response' });
  }

  unenroll(courseId: number): Observable<HttpResponse<void>> {
    return this.http.delete<void>(`${this.resourceUrl}/${courseId}`, { observe: 'response' });
  }

  getEnrollments(): Observable<HttpResponse<IUserCourseEnrollment[]>> {
    return this.http.get<IUserCourseEnrollment[]>(this.resourceUrl, { observe: 'response' });
  }

  isEnrolled(courseId: number): Observable<HttpResponse<boolean>> {
    return this.http.get<boolean>(`${this.resourceUrl}/check/${courseId}`, { observe: 'response' });
  }
}
