import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ASC } from 'app/config/navigation.constants';
import LessonResolve from './route/lesson-routing-resolve.service';

const lessonRoute: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/lesson.component').then(m => m.LessonComponent),
    data: {
      defaultSort: `id,${ASC}`,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    loadComponent: () => import('./detail/lesson-detail.component').then(m => m.LessonDetailComponent),
    resolve: {
      lesson: LessonResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    loadComponent: () => import('./update/lesson-update.component').then(m => m.LessonUpdateComponent),
    resolve: {
      lesson: LessonResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./update/lesson-update.component').then(m => m.LessonUpdateComponent),
    resolve: {
      lesson: LessonResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default lessonRoute;
