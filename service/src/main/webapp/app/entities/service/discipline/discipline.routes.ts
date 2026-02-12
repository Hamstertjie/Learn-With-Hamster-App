import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ASC } from 'app/config/navigation.constants';
import DisciplineResolve from './route/discipline-routing-resolve.service';

const disciplineRoute: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/discipline.component').then(m => m.DisciplineComponent),
    data: {
      defaultSort: `id,${ASC}`,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    loadComponent: () => import('./detail/discipline-detail.component').then(m => m.DisciplineDetailComponent),
    resolve: {
      discipline: DisciplineResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    loadComponent: () => import('./update/discipline-update.component').then(m => m.DisciplineUpdateComponent),
    resolve: {
      discipline: DisciplineResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./update/discipline-update.component').then(m => m.DisciplineUpdateComponent),
    resolve: {
      discipline: DisciplineResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default disciplineRoute;
