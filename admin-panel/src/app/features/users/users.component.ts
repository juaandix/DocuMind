import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { HttpClient } from '@angular/common/http'
import { MatTableModule } from '@angular/material/table'
import { MatButtonModule } from '@angular/material/button'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatChipsModule } from '@angular/material/chips'
import { MatTooltipModule } from '@angular/material/tooltip'
import { GlobalUser } from '../../shared/models'
import { environment } from '../../../environments/environment'

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule,
    MatInputModule, MatFormFieldModule, MatProgressSpinnerModule,
    MatChipsModule, MatTooltipModule,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Users</h1>
        <span class="count-badge">{{ users.length }} results</span>
      </div>

      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search by email or name</mat-label>
        <input matInput [(ngModel)]="search" (input)="onSearch()" />
      </mat-form-field>

      <div *ngIf="loading" class="loading"><mat-spinner diameter="36" /></div>

      <div *ngIf="!loading && users.length === 0" class="empty-state">No users found.</div>

      <table mat-table [dataSource]="users" class="mat-elevation-z1 full-width" *ngIf="!loading && users.length > 0">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let u">
            <div class="user-cell">
              <div class="avatar">{{ initials(u.full_name) }}</div>
              <div>
                <div class="user-name">{{ u.full_name }}</div>
                <div class="user-meta">{{ u.email }}</div>
              </div>
            </div>
          </td>
        </ng-container>

        <ng-container matColumnDef="workspace">
          <th mat-header-cell *matHeaderCellDef>Workspace</th>
          <td mat-cell *matCellDef="let u" class="secondary">{{ u.workspace_name || '—' }}</td>
        </ng-container>

        <ng-container matColumnDef="role">
          <th mat-header-cell *matHeaderCellDef>Role</th>
          <td mat-cell *matCellDef="let u">
            <mat-chip [class]="'role-chip role-' + u.role.toLowerCase()" highlighted>{{ u.role }}</mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let u">
            <span [class]="'status-dot ' + (u.is_active ? 'active' : 'inactive')"></span>
            {{ u.is_active ? 'Active' : 'Inactive' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="last_login">
          <th mat-header-cell *matHeaderCellDef>Last Login</th>
          <td mat-cell *matCellDef="let u" class="secondary">
            {{ u.last_login ? (u.last_login | date:'MMM d, y') : 'Never' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let u">
            <button mat-stroked-button color="warn" (click)="forceLogout(u)"
              matTooltip="Invalidate all sessions" class="action-btn">
              Force logout
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  styles: [`
    .page { padding: 32px; }
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .page-title { font-size: 22px; font-weight: 700; margin: 0; }
    .count-badge { font-size: 12px; background: #f3f4f6; color: #6b7280; padding: 3px 10px; border-radius: 20px; }
    .search-field { width: 340px; margin-bottom: 12px; display: block; }
    .loading { display: flex; justify-content: center; padding: 60px; }
    .empty-state { text-align: center; color: #9ca3af; padding: 48px; font-size: 14px; }
    .full-width { width: 100%; }
    .action-btn { font-size: 12px; height: 28px; line-height: 28px; }

    .user-cell { display: flex; align-items: center; gap: 10px; padding: 8px 0; }
    .avatar { width: 34px; height: 34px; border-radius: 50%; background: #e0e7ff; color: #4f46e5;
              display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .user-name { font-size: 13px; font-weight: 500; }
    .user-meta { font-size: 11px; color: #9ca3af; }
    .secondary { font-size: 13px; color: #6b7280; }

    .status-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 5px; vertical-align: middle; }
    .status-dot.active { background: #10b981; }
    .status-dot.inactive { background: #d1d5db; }

    .role-chip { font-size: 11px !important; min-height: 22px !important; }
    .role-owner { background: #ede9fe !important; color: #7c3aed !important; }
    .role-admin { background: #e0e7ff !important; color: #4338ca !important; }
    .role-member { background: #f3f4f6 !important; color: #6b7280 !important; }
  `],
})
export class UsersComponent implements OnInit {
  displayedColumns = ['name', 'workspace', 'role', 'status', 'last_login', 'actions']
  users: GlobalUser[] = []
  loading = false
  search = ''
  private searchTimeout: ReturnType<typeof setTimeout> | null = null

  constructor(private http: HttpClient) {}

  ngOnInit() { this.fetch() }

  onSearch() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout)
    this.searchTimeout = setTimeout(() => this.fetch(), 400)
  }

  fetch() {
    this.loading = true
    const params: Record<string, string> = this.search ? { email: this.search } : {}
    this.http.get<GlobalUser[]>(`${environment.apiUrl}/api/v1/admin/platform/users`, { params }).subscribe({
      next: (data) => { this.users = data; this.loading = false },
      error: () => { this.loading = false },
    })
  }

  forceLogout(u: GlobalUser) {
    if (confirm(`Force logout for ${u.email}?\nThis will invalidate all active sessions.`)) {
      this.http.delete(`${environment.apiUrl}/api/v1/admin/platform/users/${u.id}/sessions`).subscribe()
    }
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }
}
