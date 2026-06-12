import { Injectable } from '@angular/core'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { HttpClient } from '@angular/common/http'
import { catchError, map, of, switchMap } from 'rxjs'
import * as WorkspaceActions from './workspaces.actions'
import { PaginatedResponse, Workspace } from '../../shared/models'
import { environment } from '../../../environments/environment'

const BASE = `${environment.apiUrl}/api/v1/admin/platform`

@Injectable()
export class WorkspacesEffects {
  loadWorkspaces$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.loadWorkspaces),
      switchMap(({ page }) =>
        this.http.get<PaginatedResponse<Workspace>>(`${BASE}/workspaces`, { params: { page, limit: 20 } }).pipe(
          map((res) => WorkspaceActions.loadWorkspacesSuccess({ workspaces: res.data, total: res.total })),
          catchError((err) => of(WorkspaceActions.loadWorkspacesFailure({ error: err.message })))
        )
      )
    )
  )

  suspendWorkspace$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.suspendWorkspace),
      switchMap(({ id }) =>
        this.http.patch<Workspace>(`${BASE}/workspaces/${id}/suspend`, {}).pipe(
          map((workspace) => WorkspaceActions.suspendWorkspaceSuccess({ workspace })),
          catchError((err) => of(WorkspaceActions.suspendWorkspaceFailure({ error: err.message })))
        )
      )
    )
  )

  changePlan$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.changePlan),
      switchMap(({ id, plan }) =>
        this.http.patch<Workspace>(`${BASE}/workspaces/${id}/plan`, { plan }).pipe(
          map((workspace) => WorkspaceActions.changePlanSuccess({ workspace })),
          catchError((err) => of(WorkspaceActions.changePlanFailure({ error: err.message })))
        )
      )
    )
  )

  constructor(private actions$: Actions, private http: HttpClient) {}
}
