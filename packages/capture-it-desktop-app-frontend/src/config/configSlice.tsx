import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { addWorkspace, removeWorkspace } from '../workspaces/workspacesSlice';

interface ConfigState {
  value: any; // Ideally, you'd use a more specific type than 'any'
}

const initialState: ConfigState = {
  value: {
    workspaces: [],
  },
};

const configSlice = createSlice( {
  name: 'config',
  initialState,
  reducers: {
    setConfig: ( state, action: PayloadAction<any> ) => {
      state.value = action.payload;
    },
  },
  extraReducers: ( builder ) => {
    builder.addCase( addWorkspace, ( state, action ) => {
      state.value.workspaces.push( action.payload );
    } );

    builder.addCase( removeWorkspace, ( state, action ) => {
      state.value.workspaces = state.value.workspaces.splice( action.payload, 1 );
    } );
  }
} );

export const { setConfig } = configSlice.actions;
export default configSlice.reducer;
