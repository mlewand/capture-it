
import './QuickInput.css';
import { getElectronBridge } from './appHelpers';
import { setNoteInput, clearNoteInput } from './note/noteSlice';
import { useAppDispatch, useAppSelector } from './hooks';

export default function QuickInput() {
	const dispatch = useAppDispatch();
	const noteInputValue = useAppSelector( state => state.note.input );

	function submitHandler( clickEvent: React.MouseEvent ) {
		submitNote(
			noteInputValue,
			clickEvent.altKey && !clickEvent.shiftKey,
			clickEvent.altKey && clickEvent.shiftKey
		);
		dispatch( clearNoteInput() );
	}

	function noteInputHandler( event: React.ChangeEvent<HTMLInputElement> ) {
		dispatch( setNoteInput( event.target.value ) );
	}

	return (
		<section id="quick-input-container">
			<input value={noteInputValue} onChange={noteInputHandler} placeholder="What's on your mind?" type="text" id="textInput" />
			<button id="submitButton" onClick={submitHandler}>Add todo</button>
		</section>
	);
}

function addNotification( ...args: any[] ) {
}

function submitNote( text: string, openPage = false, copyToClipboard = false ): void {
	const electronBridge = getElectronBridge();
	const insertPromise = electronBridge.promisedInvoke( 'executeCommandAsync', 'captureItem', text );
	const notification = addNotification( text, 'loading' );

	insertPromise.then( ( data: any ) => {
		addNotification( text, 'success', notification );

		if ( data.redirect_url && copyToClipboard ) {
			navigator.clipboard.writeText( data.redirect_url );
		} else if ( data.redirect_url && openPage ) {
			electronBridge.invoke( 'executeCommand', 'openNotionPage', data.redirect_url );
		}
	} )
		.catch( error => {
			addNotification( `${text} - ${error}`, 'error', notification );
			console.error( error );
		} );
}