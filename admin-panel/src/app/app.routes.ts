import { Routes } from '@angular/router'
import { authGuard } from './core/guards/auth.guard'

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent) },
  {
    path: '',
    loadComponent: () => import('./features/shell/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'workspaces',
        loadComponent: () => import('./features/workspaces/workspaces.component').then((m) => m.WorkspacesComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notifications.component').then((m) => m.NotificationsComponent),
      },
      {
        path: 'logs',
        loadComponent: () => import('./features/logs/logs.component').then((m) => m.LogsComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
]
