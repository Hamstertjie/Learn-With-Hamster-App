import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'authority',
    data: { pageTitle: 'gatewayApp.adminAuthority.home.title' },
    loadChildren: () => import('./admin/authority/authority.routes'),
  },
  {
    path: 'discipline',
    data: { pageTitle: 'gatewayApp.serviceDiscipline.home.title' },
    loadChildren: () => import('./service/discipline/discipline.routes'),
  },
  {
    path: 'program',
    data: { pageTitle: 'gatewayApp.serviceProgram.home.title' },
    loadChildren: () => import('./service/program/program.routes'),
  },
  {
    path: 'course',
    data: { pageTitle: 'gatewayApp.serviceCourse.home.title' },
    loadChildren: () => import('./service/course/course.routes'),
  },
  {
    path: 'lesson',
    data: { pageTitle: 'gatewayApp.serviceLesson.home.title' },
    loadChildren: () => import('./service/lesson/lesson.routes'),
  },
  {
    path: 'resource',
    data: { pageTitle: 'gatewayApp.serviceResource.home.title' },
    loadChildren: () => import('./service/resource/resource.routes'),
  },
  /* jhipster-needle-add-entity-route - JHipster will add entity modules routes here */
];

export default routes;
