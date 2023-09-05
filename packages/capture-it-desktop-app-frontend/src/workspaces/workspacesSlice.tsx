import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import type { WorkspaceInfo } from '@mlewand/capture-it-core';

export const selectWorkspaces = createSelector(
	[ ( state: any ) => state.config ],
	( config ) => {
		return config.value?.workspaces || [];
	}
);

export const workspacesSlice = createSlice( {
	name: 'workspaces',
	initialState: {
		value: [],
	},
	reducers: {
		// These reducers are handled in config slice.
		addWorkspace: ( state, action: PayloadAction<WorkspaceInfo> ) => { },
		removeWorkspace: ( state, action: PayloadAction<number> ) => { },
	},
} );

export default workspacesSlice.reducer;
export const { addWorkspace, removeWorkspace } = workspacesSlice.actions;