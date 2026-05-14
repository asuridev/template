import { Routes } from '@angular/router';
import { partnerGuard } from './guards/partner.guard';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'not-found',
    loadComponent: () => import('./not-found/pages/not-found.page'),
  },
  {
    path: ':partnerId',
    canActivate: [partnerGuard, authGuard],
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
