import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import type { WorkspaceInfo } from '@mlewand/capture-it-core';
import { RootState } from '../store';

export const selectWorkspaces = createSelector(
	[ ( state: any ) => state.config ],
	( config ) => {
		return config.value?.workspaces || [];
	}
);

export const selectActiveWorkspaceIndex = createSelector(
	[ ( state: any ) => state.workspaces ],
	( state ) => {
		return state.activeWorkspace || undefined;
	}
);

export const selectActiveWorkspace = ( state: RootState ) => {
	const workspaces = state.config.value?.workspaces || [];
	const focusedIndex = state.workspaces._activeWorkspaceIndex;

	if ( focusedIndex !== undefined && focusedIndex >= 0 && focusedIndex < workspaces.length ) {
		return workspaces[ focusedIndex ];
	}
	return null;
}

type ActiveWorkspaceIndex = number | undefined;

export const workspacesSlice = createSlice( {
	name: 'workspaces',
	initialState: {
		_activeWorkspaceIndex: undefined as ActiveWorkspaceIndex,
	},
	reducers: {
		// These reducers are handled in config slice.
		addWorkspace: ( state, action: PayloadAction<WorkspaceInfo> ) => { },
		removeWorkspace: ( state, action: PayloadAction<number> ) => { },
		setActiveWorkspaceIndex: ( state, action: PayloadAction<ActiveWorkspaceIndex> ) => {
			state._activeWorkspaceIndex = action.payload;
		}
	},
} );

export default workspacesSlice.reducer;
export const { addWorkspace, removeWorkspace, setActiveWorkspaceIndex } = workspacesSlice.actions;