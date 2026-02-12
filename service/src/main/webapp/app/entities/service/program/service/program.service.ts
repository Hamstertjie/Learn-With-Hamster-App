import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, asapScheduler, scheduled } from 'rxjs';

import { catchError } from 'rxjs/operators';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { SearchWithPagination } from 'app/core/request/request.model';
import { IProgram, NewProgram } from '../program.model';

export type PartialUpdateProgram = Partial<IProgram> & Pick<IProgram, 'id'>;

export type EntityResponseType = HttpResponse<IProgram>;
export type EntityArrayResponseType = HttpResponse<IProgram[]>;

@Injectable({ providedIn: 'root' })
export class ProgramService {
  protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/programs', 'service');
  protected resourceSearchUrl = this.applicationConfigService.getEndpointFor('api/programs/_search', 'service');

  create(program: NewProgram): Observable<EntityResponseType> {
    return this.http.post<IProgram>(this.resourceUrl, program, { observe: 'response' });
  }

  update(program: IProgram): Observable<EntityResponseType> {
    return this.http.put<IProgram>(`${this.resourceUrl}/${this.getProgramIdentifier(program)}`, program, { observe: 'response' });
  }

  partialUpdate(program: PartialUpdateProgram): Observable<EntityResponseType> {
    return this.http.patch<IProgram>(`${this.resourceUrl}/${this.getProgramIdentifier(program)}`, program, { observe: 'response' });
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http.get<IProgram>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IProgram[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  search(req: SearchWithPagination): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<IProgram[]>(this.resourceSearchUrl, { params: options, observe: 'response' })
      .pipe(catchError(() => scheduled([new HttpResponse<IProgram[]>()], asapScheduler)));
  }

  getProgramIdentifier(program: Pick<IProgram, 'id'>): number {
    return program.id;
  }

  compareProgram(o1: Pick<IProgram, 'id'> | null, o2: Pick<IProgram, 'id'> | null): boolean {
    return o1 && o2 ? this.getProgramIdentifier(o1) === this.getProgramIdentifier(o2) : o1 === o2;
  }

  addProgramToCollectionIfMissing<Type extends Pick<IProgram, 'id'>>(
    programCollection: Type[],
    ...programsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const programs: Type[] = programsToCheck.filter(isPresent);
    if (programs.length > 0) {
      const programCollectionIdentifiers = programCollection.map(programItem => this.getProgramIdentifier(programItem));
      const programsToAdd = programs.filter(programItem => {
        const programIdentifier = this.getProgramIdentifier(programItem);
        if (programCollectionIdentifiers.includes(programIdentifier)) {
          return false;
        }
        programCollectionIdentifiers.push(programIdentifier);
        return true;
      });
      return [...programsToAdd, ...programCollection];
    }
    return programCollection;
  }
}
