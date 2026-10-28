import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { HttpClient } from '@angular/common/http'
import { MatTableModule } from '@angular/material/table'
import { MatButtonModule } from '@angular/material/button'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatTooltipModule } from '@angular/material/tooltip'
import { GlobalUser } from '../../shared/models'
import { environment } from '../../../environments/environment'

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule,
    MatInputModule, MatFormFieldModule, MatProgressSpinnerModule, MatTooltipModule,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div><h1 class="page-title">Users</h1><p class="page-sub">{{ users.length }} results</p></div>
      </div>

      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search by email or name</mat-label>
        <input matInput [(ngModel)]="search" (input)="onSearch()" />
      </mat-form-field>

      <div *ngIf="loading" class="loading"><mat-spinner diameter="36" /></div>

      <div *ngIf="!loading && users.length === 0" class="empty-state">No users found.</div>

      <div class="panel table-box" *ngIf="!loading && users.length > 0">
      <table mat-table [dataSource]="users" class="full-width">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let u">
            <div class="user-cell">
              <div class="avatar" aria-hidden="true">{{ initials(u.full_name) }}</div>
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
            <span class="tag" [class.tag--fill]="u.role === 'OWNER' || u.role === 'PLATFORM_ADMIN'">{{ u.role }}</span>
          </td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let u">
            <span class="tag" [class.tag--pending]="!u.is_active">{{ u.is_active ? 'Active' : 'Inactive' }}</span>
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
    </div>
  `,
  styles: [`
    .search-field { width: 100%; max-width: 360px; display: block; margin-bottom: -20px; }
    .empty-state { text-align: center; color: var(--dm-ink-2); padding: 48px; font-size: 14px; border: 1px dashed var(--dm-line); border-radius: 6px; background: var(--dm-surface); }
    .table-box { overflow-x: auto; }
    .action-btn { font-size: 13px; }

    .user-cell { display: flex; align-items: center; gap: 10px; padding: 8px 0; }
    .avatar { width: 32px; height: 32px; border-radius: 5px; background: var(--dm-surface); box-shadow: var(--dm-shadow); color: var(--dm-ink);
              display: flex; align-items: center; justify-content: center; font: 600 12px var(--font-mono); flex-shrink: 0; }
    .user-name { font-size: 14px; font-weight: 600; }
    .user-meta { font-size: 13px; color: var(--dm-ink-2); }
    .secondary { font-size: 13px; color: var(--dm-ink-2); font-family: var(--font-mono); }
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
