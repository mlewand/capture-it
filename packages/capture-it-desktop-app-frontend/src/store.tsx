import { configureStore } from '@reduxjs/toolkit'
import workspacesReducer from './workspaces/workspacesSlice'

export default configureStore( {
	reducer: {
		workspaces: workspacesReducer,
	},
} );

