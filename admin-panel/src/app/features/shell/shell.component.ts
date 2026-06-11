import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatListModule } from '@angular/material/list'
import { MatIconModule } from '@angular/material/icon'
import { MatButtonModule } from '@angular/material/button'
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
  imports: [CommonModule, RouterModule, MatSidenavModule, MatToolbarModule, MatListModule, MatIconModule, MatButtonModule],
  template: `
    <mat-sidenav-container class="app-container">
      <mat-sidenav mode="side" opened class="sidenav">
        <div class="brand">DocuMind Admin</div>
        <mat-nav-list>
          <a mat-list-item *ngFor="let item of navItems" [routerLink]="item.route" routerLinkActive="active-link">
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            <span matListItemTitle>{{ item.label }}</span>
          </a>
        </mat-nav-list>
        <div class="sidenav-footer">
          <button mat-button (click)="logout()"><mat-icon>logout</mat-icon> Sign out</button>
        </div>
      </mat-sidenav>
      <mat-sidenav-content>
        <router-outlet />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .app-container { height: 100vh; }
    .sidenav { width: 240px; display: flex; flex-direction: column; background: #1e1b4b; color: #e0e7ff; }
    .brand { padding: 20px 16px; font-size: 16px; font-weight: 700; color: #fff; border-bottom: 1px solid #312e81; }
    mat-nav-list { flex: 1; }
    .active-link { background: rgba(255,255,255,.1) !important; border-radius: 8px; }
    .sidenav-footer { padding: 12px; }
    mat-icon { color: #a5b4fc !important; }
  `],
})
export class ShellComponent {
  navItems = NAV_ITEMS
  constructor(private auth: AuthService) {}
  logout() { this.auth.logout() }
}
