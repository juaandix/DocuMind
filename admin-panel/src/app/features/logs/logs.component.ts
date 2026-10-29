import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { MatTableModule } from '@angular/material/table'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { FormsModule } from '@angular/forms'
import { CeleryJob } from '../../shared/models'
import { environment } from '../../../environments/environment'

type StatusFilter = 'ALL' | 'FAILURE' | 'PENDING' | 'STARTED' | 'SUCCESS'

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatProgressSpinnerModule, MatButtonToggleModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div><h1 class="page-title">Celery Job Logs</h1><p class="page-sub">Background jobs: document processing and PDF exports.</p></div>
        <mat-button-toggle-group [(ngModel)]="statusFilter" (ngModelChange)="applyFilter()" class="toggle-group"
          hideSingleSelectionIndicator aria-label="Filter jobs by status">
          <mat-button-toggle *ngFor="let f of filters" [value]="f.value">
            {{ f.label }} <span class="count">{{ count(f.value) }}</span>
          </mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      <div *ngIf="loading" class="loading"><mat-spinner diameter="36" /></div>

      <div *ngIf="!loading && filtered.length === 0" class="empty-state">No jobs found.</div>

      <div class="panel table-box" *ngIf="!loading && filtered.length > 0">
      <table mat-table [dataSource]="filtered" class="full-width">
        <ng-container matColumnDef="task">
          <th mat-header-cell *matHeaderCellDef>Task</th>
          <td mat-cell *matCellDef="let j" class="task-cell">{{ j.task_name }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let j">
            <span class="tag" [ngClass]="statusClass(j.status)">{{ j.status }}</span>
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
          <td mat-cell *matCellDef="let j" class="error-cell" [class.error-cell--none]="!j.error" [title]="j.error ?? ''">
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
    </div>
  `,
  styles: [`
    .toggle-group { font-size: 13px; border-color: var(--dm-line) !important; border-radius: 5px !important; background: var(--dm-surface); }
    .count { margin-left: 6px; font: 600 12px var(--font-mono); opacity: .7; }
    :host ::ng-deep .toggle-group .mat-button-toggle-checked { background: var(--dm-primary) !important; color: var(--dm-on-primary) !important; }
    :host ::ng-deep .toggle-group .mat-button-toggle-label-content { font-weight: 600; padding: 0 14px; }
    .empty-state { text-align: center; color: var(--dm-ink-2); padding: 48px; font-size: 14px; border: 1px dashed var(--dm-line); border-radius: 6px; background: var(--dm-surface); }
    .table-box { overflow-x: auto; }

    .task-cell { font-family: var(--font-mono); font-size: 13px; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .mono { font-family: var(--font-mono); font-size: 13px; }
    .secondary { font-family: var(--font-mono); font-size: 13px; color: var(--dm-ink-2) !important; }
    .error-cell { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--font-mono); font-size: 13px; color: var(--dm-danger) !important; }

    .error-cell--none { color: var(--dm-ink-3) !important; }
    .row-failure td { background: var(--dm-danger-soft) !important; }
  `],
})
export class LogsComponent implements OnInit {
  displayedColumns = ['task', 'status', 'duration', 'error', 'started_at']
  jobs: CeleryJob[] = []
  filtered: CeleryJob[] = []
  statusFilter: StatusFilter = 'ALL'
  filters: { value: StatusFilter; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'FAILURE', label: 'Failed' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'STARTED', label: 'Running' },
    { value: 'SUCCESS', label: 'Done' },
  ]

  count(status: StatusFilter) {
    return status === 'ALL' ? this.jobs.length : this.jobs.filter(j => j.status === status).length
  }
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

  // State by form as well as colour: failed = red, pending/running = dashed, done = solid.
  statusClass(status: string) {
    if (status === 'FAILURE') return 'tag--danger'
    if (status === 'PENDING' || status === 'STARTED') return 'tag--pending'
    return ''
  }
}
