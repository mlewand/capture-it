import { createSlice } from '@reduxjs/toolkit';

import { createSelector } from '@reduxjs/toolkit';

const configState = ( state: any ) => state.config;
export const selectWorkspaces = createSelector(
	[ configState ],
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