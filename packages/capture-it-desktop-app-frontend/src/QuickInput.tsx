
import './QuickInput.css';
import { getElectronBridge } from './appHelpers';
import { setNoteInput, clearNoteInput } from './note/noteSlice';
import { useAppDispatch, useAppSelector } from './hooks';
import { toast } from 'react-toastify';

export default function QuickInput() {
	const dispatch = useAppDispatch();
	const noteInputValue = useAppSelector( state => state.note.input );

	function submitHandler( clickEvent: React.MouseEvent ) {
		if ( !noteInputValue ) {
			toast.error( 'Can\'t submit empty note.' );
			return;
		}

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

	function keyUpHandler( event: React.KeyboardEvent<HTMLInputElement> ) {
		// The only allowed shift combination is shift + alt for now.
		if ( event.key === 'Enter' && ( !event.shiftKey || event.altKey ) ) {
			// CTRL / CMD modifiers are allowed. Typically ctrl+enter means confirm an action.
			event.preventDefault();

			const clickEvent = new MouseEvent( 'click', {
				altKey: event.altKey,
				ctrlKey: event.ctrlKey,
				metaKey: event.metaKey,
				shiftKey: event.shiftKey,
				bubbles: true,
			} );

			document.getElementById( 'submitButton' )!.dispatchEvent( clickEvent );
		}
	}

	return (
		<section id="quick-input-container">
			<input
				value={noteInputValue}
				onChange={noteInputHandler}
				onKeyUp={keyUpHandler}
				placeholder="What's on your mind?"
				type="text"
				id="textInput" />
			<button id="submitButton" onClick={submitHandler}>Add todo</button>
		</section>
	);
}

function submitNote( text: string, openPage = false, copyToClipboard = false ): Promise<void> {
	const electronBridge = getElectronBridge();
	const insertPromise = electronBridge.promisedInvoke( 'executeCommandAsync', 'captureItem', text );
	const toastId = toast.loading( `Adding "${text}"…` );

	insertPromise.then( ( data: any ) => {
		toast.update( toastId, { render: `"${ text }" added!`, type: 'success', isLoading: false, autoClose: 5000 } );

		if ( data.redirect_url && copyToClipboard ) {
			navigator.clipboard.writeText( data.redirect_url );
		} else if ( data.redirect_url && openPage ) {
			electronBridge.invoke( 'executeCommand', 'openNotionPage', data.redirect_url );
		}
	} )
		.catch( error => {
			toast.update( toastId, { render: `"${text}" failed, because: ${error}`, type: 'error', isLoading: false, autoClose: false } );
			console.error( error );
		} );

	return insertPromise;
}