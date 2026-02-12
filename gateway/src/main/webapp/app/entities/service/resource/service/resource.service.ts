import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IResource, NewResource } from '../resource.model';

export type PartialUpdateResource = Partial<IResource> & Pick<IResource, 'id'>;

export type EntityResponseType = HttpResponse<IResource>;
export type EntityArrayResponseType = HttpResponse<IResource[]>;

@Injectable({ providedIn: 'root' })
export class ResourceService {
  protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/resources', 'service');

  create(resource: NewResource): Observable<EntityResponseType> {
    return this.http.post<IResource>(this.resourceUrl, resource, { observe: 'response' });
  }

  update(resource: IResource): Observable<EntityResponseType> {
    return this.http.put<IResource>(`${this.resourceUrl}/${this.getResourceIdentifier(resource)}`, resource, { observe: 'response' });
  }

  partialUpdate(resource: PartialUpdateResource): Observable<EntityResponseType> {
    return this.http.patch<IResource>(`${this.resourceUrl}/${this.getResourceIdentifier(resource)}`, resource, { observe: 'response' });
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http.get<IResource>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IResource[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getResourceIdentifier(resource: Pick<IResource, 'id'>): number {
    return resource.id;
  }

  compareResource(o1: Pick<IResource, 'id'> | null, o2: Pick<IResource, 'id'> | null): boolean {
    return o1 && o2 ? this.getResourceIdentifier(o1) === this.getResourceIdentifier(o2) : o1 === o2;
  }

  addResourceToCollectionIfMissing<Type extends Pick<IResource, 'id'>>(
    resourceCollection: Type[],
    ...resourcesToCheck: (Type | null | undefined)[]
  ): Type[] {
    const resources: Type[] = resourcesToCheck.filter(isPresent);
    if (resources.length > 0) {
      const resourceCollectionIdentifiers = resourceCollection.map(resourceItem => this.getResourceIdentifier(resourceItem));
      const resourcesToAdd = resources.filter(resourceItem => {
        const resourceIdentifier = this.getResourceIdentifier(resourceItem);
        if (resourceCollectionIdentifiers.includes(resourceIdentifier)) {
          return false;
        }
        resourceCollectionIdentifiers.push(resourceIdentifier);
        return true;
      });
      return [...resourcesToAdd, ...resourceCollection];
    }
    return resourceCollection;
  }
}
