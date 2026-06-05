import { Routes } from '@angular/router';
import { adminAuthGuard, guestGuard } from './core/guards/admin-auth.guard';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [adminAuthGuard],
    component: AdminLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'companies',
        loadComponent: () =>
          import('./features/companies/companies-list.component').then(
            (m) => m.CompaniesListComponent,
          ),
      },
      {
        path: 'companies/:id',
        loadComponent: () =>
          import('./features/companies/company-detail.component').then(
            (m) => m.CompanyDetailComponent,
          ),
      },
      {
        path: 'sessions',
        loadComponent: () =>
          import('./features/sessions/sessions-list.component').then(
            (m) => m.SessionsListComponent,
          ),
      },
      {
        path: 'sessions/:id',
        loadComponent: () =>
          import('./features/sessions/session-detail.component').then(
            (m) => m.SessionDetailComponent,
          ),
      },
      {
        path: 'candidates',
        loadComponent: () =>
          import('./features/candidates/candidates-list.component').then(
            (m) => m.CandidatesListComponent,
          ),
      },
      {
        path: 'providers',
        loadComponent: () =>
          import('./features/providers/providers-list.component').then(
            (m) => m.ProvidersListComponent,
          ),
      },
      {
        path: 'credits',
        loadComponent: () =>
          import('./features/credits/credits-list.component').then(
            (m) => m.CreditsListComponent,
          ),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./features/payments/payments-list.component').then((m) => m.PaymentsListComponent),
      },
      {
        path: 'audit',
        loadComponent: () =>
          import('./features/audit/audit-list.component').then((m) => m.AuditListComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
