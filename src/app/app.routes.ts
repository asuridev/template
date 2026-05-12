import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: ':partnerId',
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/pages/home.page'),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./not-found/pages/not-found.page'),
  },
];
