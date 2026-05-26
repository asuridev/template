import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { partnerGuard } from './home/guards/partner.guard';


export const routes: Routes = [
  {
    path: 'not-found',
    loadComponent: () => import('./not-found/pages/not-found.page'),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./admin/layout/admin-layout'),
    children: [
      { path: '', redirectTo: 'partners', pathMatch: 'full' },
      {
        path: 'partners',
        loadComponent: () => import('./admin/pages/partners-list.page'),
      },
      {
        path: 'partners/new',
        loadComponent: () => import('./admin/pages/partner-create.page'),
      },
      {
        path: 'partners/:partnerId',
        loadComponent: () => import('./admin/pages/partner-detail.page'),
      },
      {
        path: 'partners/:partnerId/edit',
        loadComponent: () => import('./admin/pages/partner-edit.page'),
      },
    ],
  },
  {
    path: ':partnerId',
    canActivate: [partnerGuard],
    children: [
      {
        path: 'home',
        canActivate: [authGuard],
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
