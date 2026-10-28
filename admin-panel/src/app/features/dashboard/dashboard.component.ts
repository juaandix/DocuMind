import { Component, OnInit, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { BaseChartDirective, provideCharts } from 'ng2-charts'
import { BarController, BarElement, CategoryScale, ChartData, ChartOptions, LinearScale, Tooltip } from 'chart.js'
import { forkJoin, interval, Subscription, switchMap, startWith } from 'rxjs'
import { PlatformStats } from '../../shared/models'
import { environment } from '../../../environments/environment'

interface DayStats { date: string; docs_processed: number; new_users: number }
interface Metric { label: string; value: string | number; sub?: string; tone?: 'danger' | 'pending' }

/** Read a design token so charts follow the light/dark theme. */
function token(name: string, fallback: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, BaseChartDirective],
  // Register only what the bar charts need, inside this lazy route.
  providers: [provideCharts({ registerables: [BarController, BarElement, CategoryScale, LinearScale, Tooltip] })],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Platform Dashboard</h1>
          <p class="page-sub">All workspaces on this DocuMind instance.</p>
        </div>
        <span class="refresh label" *ngIf="lastRefresh" aria-live="polite">
          <span class="dot" aria-hidden="true"></span>Updated {{ lastRefresh | date:'HH:mm:ss' }}
        </span>
      </div>

      <div *ngIf="loading && !stats" class="loading">
        <mat-spinner diameter="36" />
      </div>

      <ng-container *ngIf="stats">
        <!-- Counts as one segmented strip, like the segments of a pass -->
        <dl class="strip panel">
          <div class="stat-card" *ngFor="let m of metrics" [class.stat-card--danger]="m.tone === 'danger'">
            <dt class="label">{{ m.label }}</dt>
            <dd class="stat-value">{{ m.value }}</dd>
            <dd class="stat-sub" *ngIf="m.sub">{{ m.sub }}</dd>
          </div>
        </dl>

        <div class="charts">
          <section class="panel chart" aria-labelledby="docs-title">
            <h2 id="docs-title" class="chart-title">Documents Processed — Last 7 Days</h2>
            <div class="canvas-box">
              <canvas baseChart [data]="docsData" [options]="barOptions" type="bar" role="img"
                [attr.aria-label]="'Documents processed per day: ' + summary('docs_processed')"></canvas>
            </div>
          </section>

          <section class="panel chart" aria-labelledby="users-title">
            <h2 id="users-title" class="chart-title">New Users — Last 7 Days</h2>
            <div class="canvas-box">
              <canvas baseChart [data]="usersData" [options]="barOptions" type="bar" role="img"
                [attr.aria-label]="'New users per day: ' + summary('new_users')"></canvas>
            </div>
          </section>

          <!-- Two parts of one whole read better as a meter than as a donut -->
          <section class="panel status" aria-labelledby="status-title">
            <h2 id="status-title" class="chart-title">Workspace Status</h2>
            <div class="meter" role="img"
              [attr.aria-label]="stats.active_workspaces + ' active, ' + suspended + ' suspended of ' + stats.total_workspaces + ' workspaces'">
              <span class="meter-active" [style.flex-grow]="stats.active_workspaces"></span>
              <span class="meter-suspended" *ngIf="suspended > 0" [style.flex-grow]="suspended"></span>
            </div>
            <dl class="status-legend">
              <div><dt class="label"><span class="swatch swatch--active"></span>Active</dt><dd class="status-value">{{ stats.active_workspaces }}</dd></div>
              <div><dt class="label"><span class="swatch swatch--suspended"></span>Suspended</dt><dd class="status-value">{{ suspended }}</dd></div>
            </dl>
          </section>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .refresh { display: inline-flex; align-items: center; gap: 8px; }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--dm-alert); }

    .strip { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 0; }
    .stat-card { padding: 16px 20px; border-left: 1px solid var(--dm-line); border-top: 1px solid var(--dm-line); margin: -1px 0 0 -1px; }
    .stat-value { margin: 6px 0 0; font: 600 38px/1 var(--font-display); color: var(--dm-ink); font-variant-numeric: tabular-nums; }
    .stat-card--danger .stat-value { color: var(--dm-danger); }
    .stat-sub { margin: 4px 0 0; font-size: 13px; color: var(--dm-ink-2); }

    .charts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)) 300px; gap: 16px; }
    .chart, .status { padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }
    .chart-title { margin: 0; font-size: 15px; font-weight: 600; color: var(--dm-ink); }
    .canvas-box { position: relative; height: 220px; }

    .meter { display: flex; gap: 2px; height: 14px; border-radius: 4px; overflow: hidden; margin-top: 8px; }
    .meter-active { background: var(--dm-primary); }
    .meter-suspended { background: var(--dm-line); }
    .status-legend { display: grid; grid-template-columns: 1fr 1fr; margin: 0; }
    .status-legend > div + div { border-left: 1px dashed var(--dm-line); padding-left: 16px; }
    .swatch { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 6px; vertical-align: -1px; }
    .swatch--active { background: var(--dm-primary); }
    .swatch--suspended { background: var(--dm-line); }
    .status-value { margin: 6px 0 0; font: 600 34px/1 var(--font-display); color: var(--dm-ink); }

    @media (max-width: 1100px) { .charts { grid-template-columns: 1fr 1fr; } .status { grid-column: span 2; } }
    @media (max-width: 760px) {
      .strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .charts { grid-template-columns: 1fr; } .status { grid-column: auto; }
    }
  `],
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats: PlatformStats | null = null
  history: DayStats[] = []
  loading = true
  lastRefresh: Date | null = null
  metrics: Metric[] = []
  suspended = 0

  docsData: ChartData<'bar'> = { labels: [], datasets: [] }
  usersData: ChartData<'bar'> = { labels: [], datasets: [] }
  barOptions: ChartOptions<'bar'> = this._barOptions()

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
        this.suspended = stats.total_workspaces - stats.active_workspaces
        this.lastRefresh = new Date()
        this.loading = false
        this._buildMetrics(stats)
        this._buildCharts(history)
      },
      error: () => { this.loading = false },
    })
  }

  ngOnDestroy() { this.sub?.unsubscribe() }

  summary(key: 'docs_processed' | 'new_users') {
    return this.history.map(d => `${d.date} ${d[key]}`).join(', ')
  }

  private _buildMetrics(s: PlatformStats) {
    const storageMB = (s.storage_total_bytes / (1024 * 1024)).toFixed(0)
    this.metrics = [
      { label: 'Total Workspaces', value: s.total_workspaces, sub: `${s.active_workspaces} active` },
      { label: 'Total Users', value: s.total_users },
      { label: 'Total Documents', value: s.total_documents },
      { label: 'Storage Used', value: `${storageMB} MB` },
      { label: 'Processed Today', value: s.documents_processed_today },
      { label: 'Jobs Pending', value: s.celery_jobs_pending, tone: 'pending' },
      { label: 'Jobs Failed Today', value: s.celery_jobs_failed_today, tone: s.celery_jobs_failed_today > 0 ? 'danger' : undefined },
      { label: 'Active Workspaces', value: s.active_workspaces, sub: `${s.total_workspaces - s.active_workspaces} suspended` },
    ]
  }

  private _buildCharts(history: DayStats[]) {
    const ink = token('--dm-primary', '#0b0d10')
    const bar = { backgroundColor: ink, borderRadius: 4, borderSkipped: 'start' as const, maxBarThickness: 28 }
    const labels = history.map(d => new Date(`${d.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
    this.barOptions = this._barOptions()
    this.docsData = { labels, datasets: [{ label: 'Documents processed', data: history.map(d => d.docs_processed), ...bar }] }
    this.usersData = { labels, datasets: [{ label: 'New users', data: history.map(d => d.new_users), ...bar }] }
  }

  // Thin single-series bars, recessive grid, mono tick labels, ink tooltip.
  private _barOptions(): ChartOptions<'bar'> {
    const muted = token('--dm-ink-3', '#60656d')
    const line = token('--dm-line', '#d5d8dd')
    const mono = { family: 'Red Hat Mono Variable, ui-monospace, monospace', size: 11 }
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: token('--dm-rail', '#0b0d10'),
          titleFont: { ...mono, weight: 600 },
          bodyFont: { family: 'Red Hat Text Variable, system-ui, sans-serif', size: 13 },
          padding: 10, cornerRadius: 5, displayColors: false,
        },
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0, color: muted, font: mono }, grid: { color: line }, border: { display: false } },
        x: { ticks: { color: muted, font: mono, maxRotation: 0, autoSkip: true }, grid: { display: false }, border: { color: line } },
      },
    }
  }
}
