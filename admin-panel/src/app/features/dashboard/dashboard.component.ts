import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { MatCardModule } from '@angular/material/card'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { NgChartsModule } from 'ng2-charts'
import { ChartData, ChartOptions } from 'chart.js'
import { PlatformStats } from '../../shared/models'
import { environment } from '../../../../environments/environment'

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, NgChartsModule],
  template: `
    <div class="page">
      <h1 class="page-title">Platform Dashboard</h1>

      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="40" />
      </div>

      <ng-container *ngIf="stats && !loading">
        <div class="stats-grid">
          <mat-card *ngFor="let metric of metrics">
            <mat-card-content>
              <p class="metric-label">{{ metric.label }}</p>
              <p class="metric-value" [style.color]="metric.color">{{ metric.value }}</p>
            </mat-card-content>
          </mat-card>
        </div>

        <mat-card class="chart-card">
          <mat-card-header><mat-card-title>Workspace Distribution</mat-card-title></mat-card-header>
          <mat-card-content>
            <canvas baseChart [data]="pieData" [options]="pieOptions" type="pie" width="300" height="300"></canvas>
          </mat-card-content>
        </mat-card>
      </ng-container>
    </div>
  `,
  styles: [`
    .page { padding: 32px; }
    .page-title { font-size: 22px; font-weight: 700; margin-bottom: 24px; }
    .loading { display: flex; justify-content: center; padding: 60px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .metric-label { font-size: 13px; color: #6b7280; margin: 0; }
    .metric-value { font-size: 28px; font-weight: 700; margin: 4px 0 0; }
    .chart-card { max-width: 400px; }
  `],
})
export class DashboardComponent implements OnInit {
  stats: PlatformStats | null = null
  loading = true
  metrics: { label: string; value: string | number; color: string }[] = []

  pieData: ChartData<'pie'> = { labels: [], datasets: [{ data: [] }] }
  pieOptions: ChartOptions<'pie'> = { responsive: true }

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<PlatformStats>(`${environment.apiUrl}/api/v1/admin/platform/stats`).subscribe({
      next: (s) => {
        this.stats = s
        this.metrics = [
          { label: 'Total Workspaces', value: s.total_workspaces, color: '#4f46e5' },
          { label: 'Active Workspaces', value: s.active_workspaces, color: '#10b981' },
          { label: 'Total Users', value: s.total_users, color: '#4f46e5' },
          { label: 'Total Documents', value: s.total_documents, color: '#4f46e5' },
          { label: 'Processed Today', value: s.documents_processed_today, color: '#10b981' },
          { label: 'Jobs Pending', value: s.celery_jobs_pending, color: '#f59e0b' },
          { label: 'Jobs Failed Today', value: s.celery_jobs_failed_today, color: '#ef4444' },
        ]
        this.pieData = {
          labels: ['Active', 'Suspended'],
          datasets: [{ data: [s.active_workspaces, s.total_workspaces - s.active_workspaces], backgroundColor: ['#4f46e5', '#e5e7eb'] }],
        }
        this.loading = false
      },
      error: () => { this.loading = false },
    })
  }
}
