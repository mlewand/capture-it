import { configureStore } from '@reduxjs/toolkit'
import workspacesReducer from './workspaces/workspacesSlice'
import configReducer from './config/configSlice';
import noteReducer from './note/noteSlice';


const store = configureStore( {
	reducer: {
		workspaces: workspacesReducer,
		config: configReducer,
		note: noteReducer,
	},
} );

export default store;

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
