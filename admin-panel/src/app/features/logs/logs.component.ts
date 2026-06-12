import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { MatTableModule } from '@angular/material/table'
import { MatChipsModule } from '@angular/material/chips'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { FormsModule } from '@angular/forms'
import { CeleryJob } from '../../shared/models'
import { environment } from '../../../environments/environment'

type StatusFilter = 'ALL' | 'FAILURE' | 'PENDING' | 'STARTED' | 'SUCCESS'

const CHIP_COLOR: Record<string, { bg: string; color: string }> = {
  SUCCESS: { bg: '#d1fae5', color: '#065f46' },
  FAILURE: { bg: '#fee2e2', color: '#991b1b' },
  STARTED: { bg: '#dbeafe', color: '#1e40af' },
  PENDING: { bg: '#f3f4f6', color: '#374151' },
}

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatChipsModule, MatProgressSpinnerModule, MatButtonToggleModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Celery Job Logs</h1>
        <mat-button-toggle-group [(ngModel)]="statusFilter" (ngModelChange)="applyFilter()" class="toggle-group">
          <mat-button-toggle value="ALL">All</mat-button-toggle>
          <mat-button-toggle value="FAILURE">Failed</mat-button-toggle>
          <mat-button-toggle value="PENDING">Pending</mat-button-toggle>
          <mat-button-toggle value="STARTED">Running</mat-button-toggle>
          <mat-button-toggle value="SUCCESS">Done</mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      <div *ngIf="loading" class="loading"><mat-spinner diameter="36" /></div>

      <div *ngIf="!loading && filtered.length === 0" class="empty-state">No jobs found.</div>

      <table mat-table [dataSource]="filtered" class="mat-elevation-z1 full-width" *ngIf="!loading && filtered.length > 0">
        <ng-container matColumnDef="task">
          <th mat-header-cell *matHeaderCellDef>Task</th>
          <td mat-cell *matCellDef="let j" class="task-cell">{{ j.task_name }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let j">
            <span class="status-chip" [style.background]="chipStyle(j.status).bg" [style.color]="chipStyle(j.status).color">
              {{ j.status }}
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="duration">
          <th mat-header-cell *matHeaderCellDef>Duration</th>
          <td mat-cell *matCellDef="let j" class="mono">
            {{ j.duration_seconds != null ? j.duration_seconds + 's' : '—' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="error">
          <th mat-header-cell *matHeaderCellDef>Error</th>
          <td mat-cell *matCellDef="let j" class="error-cell" [title]="j.error ?? ''">
            {{ j.error ?? '—' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="started_at">
          <th mat-header-cell *matHeaderCellDef>Started</th>
          <td mat-cell *matCellDef="let j" class="secondary">
            {{ j.started_at ? (j.started_at | date:'MMM d, HH:mm:ss') : '—' }}
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"
            [class.row-failure]="row.status === 'FAILURE'"></tr>
      </table>
    </div>
  `,
  styles: [`
    .page { padding: 32px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .page-title { font-size: 22px; font-weight: 700; margin: 0; }
    .toggle-group { height: 36px; font-size: 12px; }
    .loading { display: flex; justify-content: center; padding: 60px; }
    .empty-state { text-align: center; color: #9ca3af; padding: 48px; font-size: 14px; }
    .full-width { width: 100%; }

    .task-cell { font-size: 12px; font-family: monospace; color: #374151; max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .mono { font-family: monospace; font-size: 12px; }
    .secondary { font-size: 12px; color: #6b7280; }
    .error-cell { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: #ef4444; font-family: monospace; }

    .status-chip { display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 12px; }

    .row-failure td { background: #fff8f8 !important; }
  `],
})
export class LogsComponent implements OnInit {
  displayedColumns = ['task', 'status', 'duration', 'error', 'started_at']
  jobs: CeleryJob[] = []
  filtered: CeleryJob[] = []
  statusFilter: StatusFilter = 'ALL'
  loading = false

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loading = true
    this.http.get<CeleryJob[]>(`${environment.apiUrl}/api/v1/admin/platform/jobs`).subscribe({
      next: (data) => {
        this.jobs = data
        this.applyFilter()
        this.loading = false
      },
      error: () => { this.loading = false },
    })
  }

  applyFilter() {
    this.filtered = this.statusFilter === 'ALL'
      ? this.jobs
      : this.jobs.filter(j => j.status === this.statusFilter)
  }

  chipStyle(status: string) {
    return CHIP_COLOR[status] ?? { bg: '#f3f4f6', color: '#374151' }
  }
}
