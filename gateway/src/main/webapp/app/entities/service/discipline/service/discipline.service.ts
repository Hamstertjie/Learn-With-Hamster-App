import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IDiscipline, NewDiscipline } from '../discipline.model';

export type PartialUpdateDiscipline = Partial<IDiscipline> & Pick<IDiscipline, 'id'>;

export type EntityResponseType = HttpResponse<IDiscipline>;
export type EntityArrayResponseType = HttpResponse<IDiscipline[]>;

@Injectable({ providedIn: 'root' })
export class DisciplineService {
  protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/disciplines', 'service');

  create(discipline: NewDiscipline): Observable<EntityResponseType> {
    return this.http.post<IDiscipline>(this.resourceUrl, discipline, { observe: 'response' });
  }

  update(discipline: IDiscipline): Observable<EntityResponseType> {
    return this.http.put<IDiscipline>(`${this.resourceUrl}/${this.getDisciplineIdentifier(discipline)}`, discipline, {
      observe: 'response',
    });
  }

  partialUpdate(discipline: PartialUpdateDiscipline): Observable<EntityResponseType> {
    return this.http.patch<IDiscipline>(`${this.resourceUrl}/${this.getDisciplineIdentifier(discipline)}`, discipline, {
      observe: 'response',
    });
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http.get<IDiscipline>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IDiscipline[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getDisciplineIdentifier(discipline: Pick<IDiscipline, 'id'>): number {
    return discipline.id;
  }

  compareDiscipline(o1: Pick<IDiscipline, 'id'> | null, o2: Pick<IDiscipline, 'id'> | null): boolean {
    return o1 && o2 ? this.getDisciplineIdentifier(o1) === this.getDisciplineIdentifier(o2) : o1 === o2;
  }

  addDisciplineToCollectionIfMissing<Type extends Pick<IDiscipline, 'id'>>(
    disciplineCollection: Type[],
    ...disciplinesToCheck: (Type | null | undefined)[]
  ): Type[] {
    const disciplines: Type[] = disciplinesToCheck.filter(isPresent);
    if (disciplines.length > 0) {
      const disciplineCollectionIdentifiers = disciplineCollection.map(disciplineItem => this.getDisciplineIdentifier(disciplineItem));
      const disciplinesToAdd = disciplines.filter(disciplineItem => {
        const disciplineIdentifier = this.getDisciplineIdentifier(disciplineItem);
        if (disciplineCollectionIdentifiers.includes(disciplineIdentifier)) {
          return false;
        }
        disciplineCollectionIdentifiers.push(disciplineIdentifier);
        return true;
      });
      return [...disciplinesToAdd, ...disciplineCollection];
    }
    return disciplineCollection;
  }
}
