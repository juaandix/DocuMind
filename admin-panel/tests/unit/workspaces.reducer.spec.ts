import { workspacesReducer, WorkspacesState } from '../../src/app/store/workspaces/workspaces.reducer'
import * as WorkspaceActions from '../../src/app/store/workspaces/workspaces.actions'
import { Workspace } from '../../src/app/shared/models'

const initialState: WorkspacesState = {
  workspaces: [],
  loading: false,
  error: null,
  pagination: { page: 1, total: 0, limit: 20 },
}

const mockWorkspace: Workspace = {
  id: 'w1', name: 'Test Workspace', plan: 'FREE', status: 'ACTIVE',
  owner_email: 'owner@test.com', member_count: 3, document_count: 10,
  storage_bytes: 1024 * 1024, created_at: new Date().toISOString(),
}

describe('workspacesReducer', () => {
  it('sets loading true on loadWorkspaces', () => {
    const state = workspacesReducer(initialState, WorkspaceActions.loadWorkspaces({ page: 1 }))
    expect(state.loading).toBeTrue()
    expect(state.error).toBeNull()
  })

  it('updates workspaces on loadWorkspacesSuccess', () => {
    const state = workspacesReducer(initialState, WorkspaceActions.loadWorkspacesSuccess({
      workspaces: [mockWorkspace], total: 1,
    }))
    expect(state.workspaces).toHaveSize(1)
    expect(state.loading).toBeFalse()
    expect(state.pagination.total).toBe(1)
  })

  it('sets error on loadWorkspacesFailure', () => {
    const state = workspacesReducer(initialState, WorkspaceActions.loadWorkspacesFailure({ error: 'Network error' }))
    expect(state.error).toBe('Network error')
    expect(state.loading).toBeFalse()
  })

  it('updates workspace in list on suspendWorkspaceSuccess', () => {
    const withWorkspace: WorkspacesState = { ...initialState, workspaces: [mockWorkspace] }
    const suspended = { ...mockWorkspace, status: 'SUSPENDED' as const }
    const state = workspacesReducer(withWorkspace, WorkspaceActions.suspendWorkspaceSuccess({ workspace: suspended }))
    expect(state.workspaces[0].status).toBe('SUSPENDED')
  })
})
