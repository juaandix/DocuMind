import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { HttpClient } from '@angular/common/http'
import { MatTableModule } from '@angular/material/table'
import { MatButtonModule } from '@angular/material/button'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { GlobalUser } from '../../shared/models'
import { environment } from '../../../../environments/environment'

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatProgressSpinnerModule],
  template: `
    <div class="page">
      <h1 class="page-title">Users</h1>
      <mat-form-field appearance="outline">
        <mat-label>Search by email</mat-label>
        <input matInput [(ngModel)]="search" (input)="onSearch()" />
      </mat-form-field>

      <div *ngIf="loading" class="loading"><mat-spinner diameter="40" /></div>

      <table mat-table [dataSource]="users" class="mat-elevation-z2 full-width" *ngIf="!loading">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let u">{{ u.full_name }}</td>
        </ng-container>
        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Email</th>
          <td mat-cell *matCellDef="let u">{{ u.email }}</td>
        </ng-container>
        <ng-container matColumnDef="workspace">
          <th mat-header-cell *matHeaderCellDef>Workspace</th>
          <td mat-cell *matCellDef="let u">{{ u.workspace_name }}</td>
        </ng-container>
        <ng-container matColumnDef="role">
          <th mat-header-cell *matHeaderCellDef>Role</th>
          <td mat-cell *matCellDef="let u">{{ u.role }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let u">
            <button mat-stroked-button color="warn" (click)="forceLogout(u)">Force logout</button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  styles: [`
    .page { padding: 32px; }
    .page-title { font-size: 22px; font-weight: 700; margin-bottom: 24px; }
    .loading { display: flex; justify-content: center; padding: 60px; }
    .full-width { width: 100%; }
    mat-form-field { margin-bottom: 16px; min-width: 300px; }
  `],
})
export class UsersComponent implements OnInit {
  displayedColumns = ['name', 'email', 'workspace', 'role', 'actions']
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
    const params = this.search ? { email: this.search } : {}
    this.http.get<GlobalUser[]>(`${environment.apiUrl}/api/v1/admin/platform/users`, { params }).subscribe({
      next: (data) => { this.users = data; this.loading = false },
      error: () => { this.loading = false },
    })
  }

  forceLogout(u: GlobalUser) {
    if (confirm(`Force logout for ${u.email}?`)) {
      this.http.delete(`${environment.apiUrl}/api/v1/admin/platform/users/${u.id}/sessions`).subscribe()
    }
  }
}
