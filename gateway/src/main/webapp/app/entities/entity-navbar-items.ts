import NavbarItem from 'app/layouts/navbar/navbar-item.model';

export const EntityNavbarItems: NavbarItem[] = [
  {
    name: 'Discipline',
    route: '/discipline',
    translationKey: 'global.menu.entities.serviceDiscipline',
  },
  {
    name: 'Program',
    route: '/program',
    translationKey: 'global.menu.entities.serviceProgram',
  },
  {
    name: 'Course',
    route: '/course',
    translationKey: 'global.menu.entities.serviceCourse',
  },
  {
    name: 'Lesson',
    route: '/lesson',
    translationKey: 'global.menu.entities.serviceLesson',
  },
  {
    name: 'Resource',
    route: '/resource',
    translationKey: 'global.menu.entities.serviceResource',
  },
];
