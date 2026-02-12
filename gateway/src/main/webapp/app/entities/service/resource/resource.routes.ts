import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ASC } from 'app/config/navigation.constants';
import ResourceResolve from './route/resource-routing-resolve.service';

const resourceRoute: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/resource.component').then(m => m.ResourceComponent),
    data: {
      defaultSort: `id,${ASC}`,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    loadComponent: () => import('./detail/resource-detail.component').then(m => m.ResourceDetailComponent),
    resolve: {
      resource: ResourceResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    loadComponent: () => import('./update/resource-update.component').then(m => m.ResourceUpdateComponent),
    resolve: {
      resource: ResourceResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./update/resource-update.component').then(m => m.ResourceUpdateComponent),
    resolve: {
      resource: ResourceResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default resourceRoute;
