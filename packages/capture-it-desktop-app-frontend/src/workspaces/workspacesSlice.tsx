import { createSlice } from '@reduxjs/toolkit'

export const workspacesSlice = createSlice( {
	name: 'workspaces',
	initialState: {
		value: [],
	},
	reducers: {
		increment: ( state: any ) => {
			// Redux Toolkit allows us to write "mutating" logic in reducers. It
			// doesn't actually mutate the state because it uses the Immer library,
			// which detects changes to a "draft state" and produces a brand new
			// immutable state based off those changes.
			// Also, no return statement is required from these functions.
			//   state.value += 1

			state.value.push( { name: 'test' } );

			// return state;
		},
		decrement: ( state: any ) => {
			state.value.pop();

			// return state;
		},
	},
} );

// Action creators are generated for each case reducer function
export const { increment, decrement } = workspacesSlice.actions;

export default workspacesSlice.reducer;