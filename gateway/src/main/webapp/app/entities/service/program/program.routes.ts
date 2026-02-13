import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ASC } from 'app/config/navigation.constants';
import { Authority } from 'app/config/authority.constants';
import ProgramResolve from './route/program-routing-resolve.service';

const programRoute: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/program.component').then(m => m.ProgramComponent),
    data: {
      defaultSort: `id,${ASC}`,
      authorities: [Authority.ADMIN],
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    loadComponent: () => import('./detail/program-detail.component').then(m => m.ProgramDetailComponent),
    resolve: {
      program: ProgramResolve,
    },
    data: { authorities: [Authority.ADMIN] },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    loadComponent: () => import('./update/program-update.component').then(m => m.ProgramUpdateComponent),
    resolve: {
      program: ProgramResolve,
    },
    data: { authorities: [Authority.ADMIN] },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./update/program-update.component').then(m => m.ProgramUpdateComponent),
    resolve: {
      program: ProgramResolve,
    },
    data: { authorities: [Authority.ADMIN] },
    canActivate: [UserRouteAccessService],
  },
];

export default programRoute;
