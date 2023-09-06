import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectNoteInput = ( state: RootState ) => state.note.input;

const noteSlice = createSlice( {
	name: 'note',
	initialState: {
		// Value of the text input (quick input) in the main window.
		input: '',
	},
	reducers: {
		clearNoteInput: ( state ) => {
			state.input = '';
		},
		setNoteInput: ( state, action: PayloadAction<string> ) => {
			state.input = action.payload;
		}
	}
} );

export const { clearNoteInput, setNoteInput } = noteSlice.actions;
export default noteSlice.reducer;
