import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'discipline',
    data: { pageTitle: 'serviceApp.serviceDiscipline.home.title' },
    loadChildren: () => import('./service/discipline/discipline.routes'),
  },
  {
    path: 'program',
    data: { pageTitle: 'serviceApp.serviceProgram.home.title' },
    loadChildren: () => import('./service/program/program.routes'),
  },
  {
    path: 'course',
    data: { pageTitle: 'serviceApp.serviceCourse.home.title' },
    loadChildren: () => import('./service/course/course.routes'),
  },
  {
    path: 'lesson',
    data: { pageTitle: 'serviceApp.serviceLesson.home.title' },
    loadChildren: () => import('./service/lesson/lesson.routes'),
  },
  {
    path: 'resource',
    data: { pageTitle: 'serviceApp.serviceResource.home.title' },
    loadChildren: () => import('./service/resource/resource.routes'),
  },
  /* jhipster-needle-add-entity-route - JHipster will add entity modules routes here */
];

export default routes;
