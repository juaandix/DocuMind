import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { MatTableModule } from '@angular/material/table'
import { MatChipsModule } from '@angular/material/chips'
import { MatButtonModule } from '@angular/material/button'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { AdminNotification } from '../../shared/models'
import { environment } from '../../../../environments/environment'

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatChipsModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="page">
      <h1 class="page-title">Notification Queue</h1>
      <div *ngIf="loading" class="loading"><mat-spinner diameter="40" /></div>
      <table mat-table [dataSource]="notifications" class="mat-elevation-z2 full-width" *ngIf="!loading">
        <ng-container matColumnDef="type">
          <th mat-header-cell *matHeaderCellDef>Type</th>
          <td mat-cell *matCellDef="let n"><mat-chip>{{ n.type }}</mat-chip></td>
        </ng-container>
        <ng-container matColumnDef="title">
          <th mat-header-cell *matHeaderCellDef>Title</th>
          <td mat-cell *matCellDef="let n">{{ n.title }}</td>
        </ng-container>
        <ng-container matColumnDef="user">
          <th mat-header-cell *matHeaderCellDef>User</th>
          <td mat-cell *matCellDef="let n">{{ n.user_email }}</td>
        </ng-container>
        <ng-container matColumnDef="email_sent">
          <th mat-header-cell *matHeaderCellDef>Email Sent</th>
          <td mat-cell *matCellDef="let n">
            <mat-chip [color]="n.email_sent ? 'primary' : 'warn'" highlighted>{{ n.email_sent ? 'Yes' : 'No' }}</mat-chip>
          </td>
        </ng-container>
        <ng-container matColumnDef="created_at">
          <th mat-header-cell *matHeaderCellDef>Created</th>
          <td mat-cell *matCellDef="let n">{{ n.created_at | date:'short' }}</td>
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
  `],
})
export class NotificationsComponent implements OnInit {
  displayedColumns = ['type', 'title', 'user', 'email_sent', 'created_at']
  notifications: AdminNotification[] = []
  loading = false

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loading = true
    this.http.get<AdminNotification[]>(`${environment.apiUrl}/api/v1/admin/platform/notifications`).subscribe({
      next: (data) => { this.notifications = data; this.loading = false },
      error: () => { this.loading = false },
    })
  }
}
