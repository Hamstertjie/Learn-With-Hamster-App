import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./catalog/catalog.component'),
    title: 'browse.catalog.title',
  },
  {
    path: 'discipline/:id',
    loadComponent: () => import('./discipline/discipline-browse.component'),
    title: 'browse.discipline.title',
  },
  {
    path: 'course/:id',
    loadComponent: () => import('./course/course-browse.component'),
    title: 'browse.course.title',
  },
  {
    path: 'lesson/:id',
    loadComponent: () => import('./lesson/lesson-browse.component'),
    title: 'browse.lesson.title',
  },
];

export default routes;
