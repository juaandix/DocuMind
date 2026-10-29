import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { MatTableModule } from '@angular/material/table'
import { MatButtonModule } from '@angular/material/button'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { AdminNotification } from '../../shared/models'
import { environment } from '../../../environments/environment'

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="page">
      <div class="page-header"><div><h1 class="page-title">Notification Queue</h1><p class="page-sub">Events delivered by the notification service, in-app and by email.</p></div></div>
      <div *ngIf="loading" class="loading"><mat-spinner diameter="40" /></div>
      <div class="panel table-box" *ngIf="!loading">
      <table mat-table [dataSource]="notifications" class="full-width">
        <ng-container matColumnDef="type">
          <th mat-header-cell *matHeaderCellDef>Type</th>
          <td mat-cell *matCellDef="let n"><span class="tag">{{ n.type }}</span></td>
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
            <span class="tag" [class.tag--fill]="n.email_sent" [class.tag--danger]="!n.email_sent">{{ n.email_sent ? 'Yes' : 'No' }}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="created_at">
          <th mat-header-cell *matHeaderCellDef>Created</th>
          <td mat-cell *matCellDef="let n" class="secondary">{{ n.created_at | date:'short' }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
      </div>
    </div>
  `,
  styles: [`
    .table-box { overflow-x: auto; }
    .secondary { font-family: var(--font-mono); font-size: 13px; color: var(--dm-ink-2) !important; }
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
