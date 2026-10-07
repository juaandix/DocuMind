import { Workspace } from '../../shared/models'
import * as A from './workspaces.actions'
import { workspacesReducer, WorkspacesState } from './workspaces.reducer'
import { selectPagination, selectWorkspaces } from './workspaces.selectors'

const ws = (id: string, overrides: Partial<Workspace> = {}): Workspace => ({
  id,
  name: `WS ${id}`,
  plan: 'FREE',
  status: 'ACTIVE',
  owner_email: `${id}@example.com`,
  member_count: 1,
  document_count: 0,
  storage_bytes: 0,
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('workspacesReducer', () => {
  const initial = workspacesReducer(undefined, { type: '@@init' })

  it('sets loading and page on load', () => {
    const state = workspacesReducer(initial, A.loadWorkspaces({ page: 3 }))
    expect(state.loading).toBeTrue()
    expect(state.error).toBeNull()
    expect(state.pagination.page).toBe(3)
  })

  it('stores workspaces and total on success', () => {
    const loading = workspacesReducer(initial, A.loadWorkspaces({ page: 1 }))
    const state = workspacesReducer(loading, A.loadWorkspacesSuccess({ workspaces: [ws('a')], total: 42 }))
    expect(state.loading).toBeFalse()
    expect(state.workspaces.length).toBe(1)
    expect(state.pagination.total).toBe(42)
  })

  it('stores error on failure', () => {
    const state = workspacesReducer(initial, A.loadWorkspacesFailure({ error: 'boom' }))
    expect(state.loading).toBeFalse()
    expect(state.error).toBe('boom')
  })

  it('replaces the updated workspace on suspend / plan change', () => {
    const loaded = workspacesReducer(initial, A.loadWorkspacesSuccess({ workspaces: [ws('a'), ws('b')], total: 2 }))
    const suspended = workspacesReducer(loaded, A.suspendWorkspaceSuccess({ workspace: ws('a', { status: 'SUSPENDED' }) }))
    const upgraded = workspacesReducer(suspended, A.changePlanSuccess({ workspace: ws('b', { plan: 'PRO' }) }))
    expect(upgraded.workspaces.map((w) => [w.status, w.plan])).toEqual([
      ['SUSPENDED', 'FREE'],
      ['ACTIVE', 'PRO'],
    ])
  })

  it('selectors read from the workspaces feature', () => {
    const state: { workspaces: WorkspacesState } = {
      workspaces: workspacesReducer(initial, A.loadWorkspacesSuccess({ workspaces: [ws('a')], total: 1 })),
    }
    expect(selectWorkspaces(state).length).toBe(1)
    expect(selectPagination(state).total).toBe(1)
  })
})
