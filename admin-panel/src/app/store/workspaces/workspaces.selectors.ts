import { createFeatureSelector, createSelector } from '@ngrx/store'
import { WorkspacesState } from './workspaces.reducer'

const selectWorkspacesState = createFeatureSelector<WorkspacesState>('workspaces')

export const selectWorkspaces = createSelector(selectWorkspacesState, (s) => s.workspaces)
export const selectWorkspacesLoading = createSelector(selectWorkspacesState, (s) => s.loading)
export const selectWorkspacesError = createSelector(selectWorkspacesState, (s) => s.error)
export const selectPagination = createSelector(selectWorkspacesState, (s) => s.pagination)
