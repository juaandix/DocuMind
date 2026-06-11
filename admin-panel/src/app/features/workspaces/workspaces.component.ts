import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Store } from '@ngrx/store'
import { MatTableModule } from '@angular/material/table'
import { MatButtonModule } from '@angular/material/button'
import { MatChipsModule } from '@angular/material/chips'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator'
import { loadWorkspaces, suspendWorkspace, changePlan } from '../../store/workspaces/workspaces.actions'
import { selectWorkspaces, selectWorkspacesLoading, selectPagination } from '../../store/workspaces/workspaces.selectors'
import { Workspace } from '../../shared/models'

@Component({
  selector: 'app-workspaces',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatChipsModule, MatProgressSpinnerModule, MatPaginatorModule],
  template: `
    <div class="page">
      <h1 class="page-title">Workspaces</h1>

      <div *ngIf="loading$ | async" class="loading"><mat-spinner diameter="40" /></div>

      <table mat-table [dataSource]="(workspaces$ | async) ?? []" class="mat-elevation-z2 full-width" *ngIf="!(loading$ | async)">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let w">{{ w.name }}</td>
        </ng-container>
        <ng-container matColumnDef="owner">
          <th mat-header-cell *matHeaderCellDef>Owner</th>
          <td mat-cell *matCellDef="let w">{{ w.owner_email }}</td>
        </ng-container>
        <ng-container matColumnDef="plan">
          <th mat-header-cell *matHeaderCellDef>Plan</th>
          <td mat-cell *matCellDef="let w">
            <mat-chip [color]="w.plan === 'PRO' ? 'accent' : 'default'" highlighted>{{ w.plan }}</mat-chip>
          </td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let w">
            <mat-chip [color]="w.status === 'ACTIVE' ? 'primary' : 'warn'" highlighted>{{ w.status }}</mat-chip>
          </td>
        </ng-container>
        <ng-container matColumnDef="members">
          <th mat-header-cell *matHeaderCellDef>Members</th>
          <td mat-cell *matCellDef="let w">{{ w.member_count }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let w">
            <button mat-stroked-button color="warn" (click)="suspend(w)" *ngIf="w.status === 'ACTIVE'" class="action-btn">
              Suspend
            </button>
            <button mat-stroked-button (click)="togglePlan(w)" class="action-btn">
              {{ w.plan === 'FREE' ? '↑ Upgrade to PRO' : '↓ Downgrade' }}
            </button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>

      <mat-paginator
        [length]="(pagination$ | async)?.total ?? 0"
        [pageSize]="20"
        (page)="onPage($event)"
      />
    </div>
  `,
  styles: [`
    .page { padding: 32px; }
    .page-title { font-size: 22px; font-weight: 700; margin-bottom: 24px; }
    .loading { display: flex; justify-content: center; padding: 60px; }
    .full-width { width: 100%; }
    .action-btn { margin-right: 8px; font-size: 12px; }
  `],
})
export class WorkspacesComponent implements OnInit {
  displayedColumns = ['name', 'owner', 'plan', 'status', 'members', 'actions']
  workspaces$ = this.store.select(selectWorkspaces)
  loading$ = this.store.select(selectWorkspacesLoading)
  pagination$ = this.store.select(selectPagination)

  constructor(private store: Store) {}

  ngOnInit() {
    this.store.dispatch(loadWorkspaces({ page: 1 }))
  }

  onPage(e: PageEvent) {
    this.store.dispatch(loadWorkspaces({ page: e.pageIndex + 1 }))
  }

  suspend(w: Workspace) {
    if (confirm(`Suspend workspace "${w.name}"?`)) {
      this.store.dispatch(suspendWorkspace({ id: w.id }))
    }
  }

  togglePlan(w: Workspace) {
    const plan = w.plan === 'FREE' ? 'PRO' : 'FREE'
    this.store.dispatch(changePlan({ id: w.id, plan }))
  }
}
