import { Component, OnInit, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { MatCardModule } from '@angular/material/card'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { BaseChartDirective } from 'ng2-charts'
import { ChartData, ChartOptions } from 'chart.js'
import { forkJoin, interval, Subscription, switchMap, startWith } from 'rxjs'
import { PlatformStats } from '../../shared/models'
import { environment } from '../../../environments/environment'

interface DayStats { date: string; docs_processed: number; new_users: number }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, BaseChartDirective],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Platform Dashboard</h1>
        <span class="refresh-badge" *ngIf="lastRefresh">
          Updated {{ lastRefresh | date:'HH:mm:ss' }}
        </span>
      </div>

      <div *ngIf="loading && !stats" class="loading">
        <mat-spinner diameter="40" />
      </div>

      <ng-container *ngIf="stats">
        <!-- Stat cards -->
        <div class="stats-grid">
          <div class="stat-card" *ngFor="let m of metrics">
            <p class="stat-label">{{ m.label }}</p>
            <p class="stat-value" [style.color]="m.color">{{ m.value }}</p>
            <p class="stat-sub" *ngIf="m.sub">{{ m.sub }}</p>
          </div>
        </div>

        <!-- Charts row -->
        <div class="charts-row">
          <!-- Bar: docs processed per day -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>Documents Processed — Last 7 Days</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <canvas baseChart
                [data]="barData"
                [options]="barOptions"
                type="bar"
                style="max-height:220px">
              </canvas>
            </mat-card-content>
          </mat-card>

          <!-- Pie: workspace status -->
          <mat-card class="chart-card chart-card--small">
            <mat-card-header>
              <mat-card-title>Workspace Status</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <canvas baseChart
                [data]="pieData"
                [options]="pieOptions"
                type="doughnut"
                style="max-height:200px">
              </canvas>
            </mat-card-content>
          </mat-card>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .page { padding: 32px; max-width: 1200px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 22px; font-weight: 700; margin: 0; }
    .refresh-badge { font-size: 12px; color: #6b7280; background: #f3f4f6; padding: 4px 10px; border-radius: 20px; }
    .loading { display: flex; justify-content: center; padding: 60px; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; margin-bottom: 24px; }
    .stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px 20px; }
    .stat-label { font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: .05em; margin: 0; }
    .stat-value { font-size: 30px; font-weight: 700; margin: 4px 0 0; line-height: 1.1; }
    .stat-sub { font-size: 11px; color: #6b7280; margin: 4px 0 0; }

    .charts-row { display: grid; grid-template-columns: 1fr 320px; gap: 16px; }
    .chart-card { border-radius: 12px !important; }
    .chart-card--small { max-width: 320px; }
    mat-card-title { font-size: 14px !important; font-weight: 600 !important; color: #374151 !important; }

    @media (max-width: 900px) {
      .charts-row { grid-template-columns: 1fr; }
    }
  `],
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats: PlatformStats | null = null
  history: DayStats[] = []
  loading = true
  lastRefresh: Date | null = null
  metrics: { label: string; value: string | number; color: string; sub?: string }[] = []

  barData: ChartData<'bar'> = { labels: [], datasets: [] }
  barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f3f4f6' } },
      x: { grid: { display: false } },
    },
  }

  pieData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [] }] }
  pieOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    cutout: '60%',
  }

  private sub?: Subscription
  private BASE = `${environment.apiUrl}/api/v1/admin/platform`

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.sub = interval(30_000).pipe(
      startWith(0),
      switchMap(() =>
        forkJoin({
          stats: this.http.get<PlatformStats>(`${this.BASE}/stats`),
          history: this.http.get<DayStats[]>(`${this.BASE}/stats/history`),
        })
      )
    ).subscribe({
      next: ({ stats, history }) => {
        this.stats = stats
        this.history = history
        this.lastRefresh = new Date()
        this.loading = false
        this._buildMetrics(stats)
        this._buildCharts(stats, history)
      },
      error: () => { this.loading = false },
    })
  }

  ngOnDestroy() { this.sub?.unsubscribe() }

  private _buildMetrics(s: PlatformStats) {
    const storageMB = (s.storage_total_bytes / (1024 * 1024)).toFixed(0)
    this.metrics = [
      { label: 'Total Workspaces', value: s.total_workspaces, color: '#4f46e5' },
      { label: 'Active', value: s.active_workspaces, color: '#10b981', sub: 'workspaces' },
      { label: 'Total Users', value: s.total_users, color: '#4f46e5' },
      { label: 'Total Documents', value: s.total_documents, color: '#4f46e5' },
      { label: 'Processed Today', value: s.documents_processed_today, color: '#10b981' },
      { label: 'Jobs Pending', value: s.celery_jobs_pending, color: '#f59e0b' },
      { label: 'Jobs Failed Today', value: s.celery_jobs_failed_today, color: '#ef4444' },
      { label: 'Storage Used', value: `${storageMB} MB`, color: '#6366f1' },
    ]
  }

  private _buildCharts(s: PlatformStats, history: DayStats[]) {
    this.barData = {
      labels: history.map(d => d.date),
      datasets: [
        {
          label: 'Docs Processed',
          data: history.map(d => d.docs_processed),
          backgroundColor: 'rgba(99,102,241,0.75)',
          borderColor: '#4f46e5',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'New Users',
          data: history.map(d => d.new_users),
          backgroundColor: 'rgba(16,185,129,0.65)',
          borderColor: '#10b981',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    }

    const suspended = s.total_workspaces - s.active_workspaces
    this.pieData = {
      labels: ['Active', 'Suspended'],
      datasets: [{
        data: [s.active_workspaces, suspended],
        backgroundColor: ['#4f46e5', '#e5e7eb'],
        borderWidth: 0,
      }],
    }
  }
}
