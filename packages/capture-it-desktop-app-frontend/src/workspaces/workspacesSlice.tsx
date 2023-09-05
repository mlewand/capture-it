import { createSlice } from '@reduxjs/toolkit';

import { createSelector } from '@reduxjs/toolkit';

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
	},
} );

export default workspacesSlice.reducer;