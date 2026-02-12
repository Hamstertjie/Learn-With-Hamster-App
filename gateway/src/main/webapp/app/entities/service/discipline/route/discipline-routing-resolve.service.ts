import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IDiscipline } from '../discipline.model';
import { DisciplineService } from '../service/discipline.service';

const disciplineResolve = (route: ActivatedRouteSnapshot): Observable<null | IDiscipline> => {
  const id = route.params.id;
  if (id) {
    return inject(DisciplineService)
      .find(id)
      .pipe(
        mergeMap((discipline: HttpResponse<IDiscipline>) => {
          if (discipline.body) {
            return of(discipline.body);
          }
          inject(Router).navigate(['404']);
          return EMPTY;
        }),
      );
  }
  return of(null);
};

export default disciplineResolve;
