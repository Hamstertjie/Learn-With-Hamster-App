import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ASC } from 'app/config/navigation.constants';
import { Authority } from 'app/config/authority.constants';
import CourseResolve from './route/course-routing-resolve.service';

const courseRoute: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/course.component').then(m => m.CourseComponent),
    data: {
      defaultSort: `id,${ASC}`,
      authorities: [Authority.ADMIN],
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    loadComponent: () => import('./detail/course-detail.component').then(m => m.CourseDetailComponent),
    resolve: {
      course: CourseResolve,
    },
    data: { authorities: [Authority.ADMIN] },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    loadComponent: () => import('./update/course-update.component').then(m => m.CourseUpdateComponent),
    resolve: {
      course: CourseResolve,
    },
    data: { authorities: [Authority.ADMIN] },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./update/course-update.component').then(m => m.CourseUpdateComponent),
    resolve: {
      course: CourseResolve,
    },
    data: { authorities: [Authority.ADMIN] },
    canActivate: [UserRouteAccessService],
  },
];

export default courseRoute;
