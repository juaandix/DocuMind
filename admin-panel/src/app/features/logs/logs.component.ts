import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { MatTableModule } from '@angular/material/table'
import { MatChipsModule } from '@angular/material/chips'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { CeleryJob } from '../../shared/models'
import { environment } from '../../../../environments/environment'

const STATUS_COLOR: Record<string, string> = {
  SUCCESS: 'primary', FAILURE: 'warn', STARTED: 'accent', PENDING: 'default',
}

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatChipsModule, MatProgressSpinnerModule],
  template: `
    <div class="page">
      <h1 class="page-title">Celery Job Logs</h1>
      <div *ngIf="loading" class="loading"><mat-spinner diameter="40" /></div>
      <table mat-table [dataSource]="jobs" class="mat-elevation-z2 full-width" *ngIf="!loading">
        <ng-container matColumnDef="task">
          <th mat-header-cell *matHeaderCellDef>Task</th>
          <td mat-cell *matCellDef="let j">{{ j.task_name }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let j">
            <mat-chip [color]="statusColor(j.status)" highlighted>{{ j.status }}</mat-chip>
          </td>
        </ng-container>
        <ng-container matColumnDef="duration">
          <th mat-header-cell *matHeaderCellDef>Duration</th>
          <td mat-cell *matCellDef="let j">{{ j.duration_seconds != null ? j.duration_seconds + 's' : '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="error">
          <th mat-header-cell *matHeaderCellDef>Error</th>
          <td mat-cell *matCellDef="let j" class="error-cell">{{ j.error ?? '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="started_at">
          <th mat-header-cell *matHeaderCellDef>Started</th>
          <td mat-cell *matCellDef="let j">{{ j.started_at ? (j.started_at | date:'short') : '—' }}</td>
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
    .error-cell { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: #ef4444; }
  `],
})
export class LogsComponent implements OnInit {
  displayedColumns = ['task', 'status', 'duration', 'error', 'started_at']
  jobs: CeleryJob[] = []
  loading = false

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loading = true
    this.http.get<CeleryJob[]>(`${environment.apiUrl}/api/v1/admin/platform/jobs`).subscribe({
      next: (data) => { this.jobs = data; this.loading = false },
      error: () => { this.loading = false },
    })
  }

  statusColor(s: string) { return STATUS_COLOR[s] ?? 'default' }
}
