import { createReducer, on } from '@ngrx/store'
import { Workspace } from '../../shared/models'
import * as WorkspaceActions from './workspaces.actions'

export interface WorkspacesState {
  workspaces: Workspace[]
  loading: boolean
  error: string | null
  pagination: { page: number; total: number; limit: number }
}

const initialState: WorkspacesState = {
  workspaces: [],
  loading: false,
  error: null,
  pagination: { page: 1, total: 0, limit: 20 },
}

export const workspacesReducer = createReducer(
  initialState,
  on(WorkspaceActions.loadWorkspaces, (state, { page }) => ({
    ...state,
    loading: true,
    error: null,
    pagination: { ...state.pagination, page },
  })),
  on(WorkspaceActions.loadWorkspacesSuccess, (state, { workspaces, total }) => ({
    ...state,
    loading: false,
    workspaces,
    pagination: { ...state.pagination, total },
  })),
  on(WorkspaceActions.loadWorkspacesFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(WorkspaceActions.suspendWorkspaceSuccess, WorkspaceActions.changePlanSuccess, (state, { workspace }) => ({
    ...state,
    workspaces: state.workspaces.map((w) => (w.id === workspace.id ? workspace : w)),
  }))
)
