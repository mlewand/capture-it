import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ConfigState {
  value: any; // Ideally, you'd use a more specific type than 'any'
}

const initialState: ConfigState = {
  value: {},
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setConfig: (state, action: PayloadAction<any>) => {
      state.value = action.payload;
    },
  },
});

export const { setConfig } = configSlice.actions;
export default configSlice.reducer;
