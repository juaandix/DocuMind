import { workspacesReducer } from './workspaces/workspaces.reducer'
import { WorkspacesEffects } from './workspaces/workspaces.effects'

export const reducers = { workspaces: workspacesReducer }
export const effects = [WorkspacesEffects]
