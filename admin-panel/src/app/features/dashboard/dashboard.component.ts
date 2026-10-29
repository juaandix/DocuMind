import { Component, OnInit, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { BaseChartDirective, provideCharts } from 'ng2-charts'
import { BarController, BarElement, CategoryScale, ChartData, ChartOptions, LinearScale, Tooltip } from 'chart.js'
import { catchError, forkJoin, interval, of, Subscription, switchMap, startWith } from 'rxjs'
import { CeleryJob, PlatformStats } from '../../shared/models'
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
    <!-- Departures band: counts on the left, live job board on the right -->
    <section class="band" aria-labelledby="dash-title">
      <div class="band-inner">
        <div class="page-header">
          <div>
            <h1 id="dash-title" class="page-title on-ink">Platform Dashboard</h1>
            <p class="page-sub on-ink-2">All workspaces on this DocuMind instance.</p>
          </div>
          <span class="refresh label" *ngIf="lastRefresh" aria-live="polite">
            <span class="dot" aria-hidden="true"></span>Updated {{ lastRefresh | date:'HH:mm:ss' }}
          </span>
        </div>

        <div *ngIf="loading && !stats" class="loading"><mat-spinner diameter="36" /></div>

        <div class="band-grid" *ngIf="stats">
          <div class="counts">
            <dl class="strip">
              <div class="stat-card" *ngFor="let m of metrics" [class.stat-card--danger]="m.tone === 'danger'">
                <dt class="label">{{ m.label }}</dt>
                <dd class="stat-value">{{ m.value }}</dd>
              </div>
            </dl>
            <div class="status" aria-labelledby="status-title">
              <p id="status-title" class="label">Workspace Status</p>
              <div class="meter" role="img"
                [attr.aria-label]="stats.active_workspaces + ' active, ' + suspended + ' suspended of ' + stats.total_workspaces + ' workspaces'">
                <span class="meter-active" [style.flex-grow]="stats.active_workspaces"></span>
                <span class="meter-suspended" *ngIf="suspended > 0" [style.flex-grow]="suspended"></span>
              </div>
              <p class="status-text"><b>{{ stats.active_workspaces }}</b> active · <b>{{ suspended }}</b> suspended</p>
            </div>
          </div>

          <div class="board" aria-live="polite">
            <p class="board-head label">Jobs needing attention</p>
            <p class="board-empty" *ngIf="attention.length === 0">No failed or pending jobs.</p>
            <ul *ngIf="attention.length > 0">
              <li *ngFor="let j of attention" class="board-row" [class.board-row--failed]="j.status === 'FAILURE'">
                <span class="job">{{ j.task_name }}</span>
                <span class="tag" [ngClass]="j.status === 'FAILURE' ? 'tag--danger' : 'tag--pending'">{{ j.status }}</span>
                <span class="when">{{ j.started_at ? (j.started_at | date:'HH:mm') : '—' }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <div class="page" *ngIf="stats">
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
      </div>
    </div>
  `,
  styles: [`
    .band { background: var(--dm-rail); color: var(--dm-rail-ink); }
    .band-inner { max-width: 1280px; margin: 0 auto; padding: 32px; display: flex; flex-direction: column; gap: 24px; }
    .on-ink { color: var(--dm-on-ink); } .on-ink-2 { color: var(--dm-rail-ink-2); }
    .refresh { display: inline-flex; align-items: center; gap: 8px; color: var(--dm-rail-ink-2); }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--dm-alert); }
    .band .label { color: var(--dm-rail-ink-2); }

    .band-grid { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 20px; }
    .counts { border: 1px solid var(--dm-rail-2); border-radius: 6px; }
    .strip { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 0; }
    .stat-card { padding: 14px 18px; border-left: 1px solid var(--dm-rail-2); border-top: 1px solid var(--dm-rail-2); margin: -1px 0 0 -1px; }
    .stat-value { margin: 6px 0 0; font: 600 34px/1 var(--font-display); color: var(--dm-on-ink); font-variant-numeric: tabular-nums; }
    .stat-card--danger .stat-value { color: var(--dm-danger-on-ink); }
    .stat-card:last-child { grid-column: span 2; }
    .status { padding: 14px 18px; border-top: 1px solid var(--dm-rail-2); display: flex; flex-direction: column; gap: 8px; }
    .meter { display: flex; gap: 2px; height: 10px; border-radius: 3px; overflow: hidden; }
    .meter-active { background: var(--dm-rail-ink); } .meter-suspended { background: var(--dm-rail-2); }
    .status-text { margin: 0; font-size: 14px; color: var(--dm-rail-ink-2); } .status-text b { color: var(--dm-on-ink); font-weight: 600; }

    .board { border: 1px solid var(--dm-rail-2); border-radius: 6px; overflow: hidden; }
    .board-head { margin: 0; padding: 12px 16px; border-bottom: 1px solid var(--dm-rail-2); }
    .board ul { list-style: none; margin: 0; padding: 0; }
    .board-row { display: grid; grid-template-columns: minmax(0, 1fr) auto 48px; align-items: center; gap: 12px; padding: 10px 16px; border-top: 1px solid var(--dm-rail-2); }
    .board-row:first-child { border-top: 0; }
    .job { font: 600 13px var(--font-mono); color: var(--dm-on-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .when { font: 500 12px var(--font-mono); color: var(--dm-rail-ink-2); text-align: right; }
    .band .tag--pending { color: var(--dm-rail-ink); border-color: var(--dm-rail-ink-2); }
    .band .tag--danger { background: transparent; color: var(--dm-danger-on-ink); border-color: var(--dm-danger-on-ink); }
    .board-empty { margin: 0; padding: 16px; font-size: 14px; color: var(--dm-rail-ink); }

    .charts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    .chart { padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }
    .chart-title { margin: 0; font-size: 15px; font-weight: 600; color: var(--dm-ink); }
    .canvas-box { position: relative; height: 220px; }

    @media (max-width: 1100px) { .band-grid { grid-template-columns: 1fr; } }
    @media (max-width: 760px) { .strip { grid-template-columns: repeat(2, minmax(0, 1fr)); } .charts { grid-template-columns: 1fr; } .band-inner { padding: 24px 16px; } }
  `],
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats: PlatformStats | null = null
  history: DayStats[] = []
  loading = true
  lastRefresh: Date | null = null
  metrics: Metric[] = []
  attention: CeleryJob[] = []
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
          // The job board is a bonus: if it fails, the counts still render.
          jobs: this.http.get<CeleryJob[]>(`${this.BASE}/jobs`).pipe(catchError(() => of([] as CeleryJob[]))),
        })
      )
    ).subscribe({
      next: ({ stats, history, jobs }) => {
        this.attention = jobs.filter(j => j.status !== 'SUCCESS')
          .sort((a, b) => Number(b.status === 'FAILURE') - Number(a.status === 'FAILURE')).slice(0, 5)
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
      { label: 'Total Workspaces', value: s.total_workspaces },
      { label: 'Total Users', value: s.total_users },
      { label: 'Total Documents', value: s.total_documents },
      { label: 'Storage Used', value: `${storageMB} MB` },
      { label: 'Processed Today', value: s.documents_processed_today },
      { label: 'Jobs Pending', value: s.celery_jobs_pending, tone: 'pending' },
      { label: 'Jobs Failed Today', value: s.celery_jobs_failed_today, tone: s.celery_jobs_failed_today > 0 ? 'danger' : undefined },
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
