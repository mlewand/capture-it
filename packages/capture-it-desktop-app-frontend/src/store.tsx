import { configureStore } from '@reduxjs/toolkit'
import workspacesReducer from './workspaces/workspacesSlice'

const store = configureStore( {
	reducer: {
		workspaces: workspacesReducer,
	},
} );

export default store;

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
