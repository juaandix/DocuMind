import { createAction, props } from '@ngrx/store'
import { Workspace } from '../../shared/models'

export const loadWorkspaces = createAction('[Workspaces] Load', props<{ page: number }>())
export const loadWorkspacesSuccess = createAction(
  '[Workspaces] Load Success',
  props<{ workspaces: Workspace[]; total: number }>()
)
export const loadWorkspacesFailure = createAction('[Workspaces] Load Failure', props<{ error: string }>())

export const suspendWorkspace = createAction('[Workspaces] Suspend', props<{ id: string }>())
export const suspendWorkspaceSuccess = createAction('[Workspaces] Suspend Success', props<{ workspace: Workspace }>())
export const suspendWorkspaceFailure = createAction('[Workspaces] Suspend Failure', props<{ error: string }>())

export const changePlan = createAction('[Workspaces] Change Plan', props<{ id: string; plan: 'FREE' | 'PRO' }>())
export const changePlanSuccess = createAction('[Workspaces] Change Plan Success', props<{ workspace: Workspace }>())
export const changePlanFailure = createAction('[Workspaces] Change Plan Failure', props<{ error: string }>())
