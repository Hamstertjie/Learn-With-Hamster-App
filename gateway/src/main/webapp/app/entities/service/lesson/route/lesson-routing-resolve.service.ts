import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { ILesson } from '../lesson.model';
import { LessonService } from '../service/lesson.service';

const lessonResolve = (route: ActivatedRouteSnapshot): Observable<null | ILesson> => {
  const id = route.params.id;
  if (id) {
    return inject(LessonService)
      .find(id)
      .pipe(
        mergeMap((lesson: HttpResponse<ILesson>) => {
          if (lesson.body) {
            return of(lesson.body);
          }
          inject(Router).navigate(['404']);
          return EMPTY;
        }),
      );
  }
  return of(null);
};

export default lessonResolve;
