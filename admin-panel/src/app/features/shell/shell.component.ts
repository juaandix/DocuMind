import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatIconModule } from '@angular/material/icon'
import { AuthService } from '../../core/services/auth.service'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
  { label: 'Workspaces', icon: 'business', route: '/workspaces' },
  { label: 'Users', icon: 'people', route: '/users' },
  { label: 'Notifications', icon: 'notifications', route: '/notifications' },
  { label: 'Celery Logs', icon: 'assignment', route: '/logs' },
]

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, MatSidenavModule, MatIconModule],
  template: `
    <mat-sidenav-container class="app-container">
      <mat-sidenav mode="side" opened class="rail">
        <a routerLink="/dashboard" class="brand" aria-label="DocuMind Admin, go to dashboard">
          <span class="mark" aria-hidden="true">D<span class="notch"></span></span>
          <span class="brand-text">
            <span class="wordmark">DocuMind</span>
            <span class="scope">Platform admin</span>
          </span>
        </a>
        <nav class="nav" aria-label="Admin">
          <a *ngFor="let item of navItems" [routerLink]="item.route" routerLinkActive="active" ariaCurrentWhenActive="page" class="nav-item">
            <mat-icon class="nav-icon" aria-hidden="true">{{ item.icon }}</mat-icon>
            <span>{{ item.label }}</span>
          </a>
        </nav>
        <button type="button" class="signout" (click)="logout()">
          <mat-icon aria-hidden="true">logout</mat-icon> Sign out
        </button>
      </mat-sidenav>
      <mat-sidenav-content class="content">
        <router-outlet />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .app-container { height: 100dvh; background: var(--dm-ground); }
    .rail { width: 248px; display: flex; flex-direction: column; background: var(--dm-rail) !important; color: var(--dm-rail-ink); border: 0 !important; }
    :host ::ng-deep .rail .mat-drawer-inner-container { display: flex; flex-direction: column; }
    .brand { display: flex; align-items: center; gap: 12px; padding: 24px 20px 20px; text-decoration: none; }
    .mark { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 5px;
      background: var(--dm-alert); color: var(--dm-on-alert); font: 700 21px/1 var(--font-display); }
    .notch { position: absolute; top: 50%; right: -3px; width: 6px; height: 6px; border-radius: 50%; background: var(--dm-rail); transform: translateY(-50%); }
    .brand-text { display: flex; flex-direction: column; }
    .wordmark { font: 700 21px/1 var(--font-display); letter-spacing: 0.06em; text-transform: uppercase; color: #fff; }
    .scope { margin-top: 5px; font: 600 11px var(--font-mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--dm-alert); }
    .nav { flex: 1; display: flex; flex-direction: column; gap: 2px; padding: 8px 12px; }
    .nav-item { display: flex; align-items: center; gap: 12px; min-height: 40px; padding: 0 12px; border-radius: 5px;
      color: var(--dm-rail-ink-2); text-decoration: none; font-size: 14px; font-weight: 500;
      transition: background-color 140ms ease, color 140ms ease; }
    .nav-item:hover { background: var(--dm-rail-2); color: #fff; }
    .nav-item.active { background: var(--dm-rail-2); color: #fff; font-weight: 600; }
    .nav-icon { font-size: 19px; width: 19px; height: 19px; }
    .nav-item.active .nav-icon { color: var(--dm-alert); }
    .signout { display: flex; align-items: center; gap: 10px; margin: 12px; padding: 10px 12px; border: 0; border-top: 1px solid var(--dm-rail-2);
      background: transparent; color: var(--dm-rail-ink-2); font: 500 14px var(--font-sans); cursor: pointer; border-radius: 0; }
    .signout:hover { color: #fff; }
    .signout mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .content { background: var(--dm-ground); }
  `],
})
export class ShellComponent {
  navItems = NAV_ITEMS
  constructor(private auth: AuthService) {}
  logout() { this.auth.logout() }
}
