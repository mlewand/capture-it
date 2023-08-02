// A copy of new notion target - @todo: unify.

// Alias for compatibility across the files.
window.electronBridge = window.electron;

window.confirmationState = {};

document.addEventListener('DOMContentLoaded', async () => {
	addListeners();
} );

electronBridge.receive( 'alert', ( message ) => {
	alert( message );
} );

electronBridge.receive( 'confirmationState', applyState );

function addListeners() {
	const targetNameInput = document.getElementById( 'targetName' );
	const saveButton = document.getElementById( 'save-button' );
	const signInLink = document.getElementById( 'sign-in-link' );

	targetNameInput.addEventListener( 'input', () => checkValidity() );
	targetNameInput.addEventListener( 'change', () => checkValidity() );

	saveButton && saveButton.addEventListener( 'click', async () => {
		checkValidity();
		if ( targetNameInput.reportValidity() !== true ) {
			return;
		}

		const pageRadioInputs = Array.from( document.querySelectorAll( 'input[type="radio"][name="page_id"]' ) );
		const checkedPageRadio = pageRadioInputs.find( ( { checked } ) => checked );

		if ( !checkedPageRadio ) {
			alert( 'Please select a database or page.' );
		}

		const state = window.confirmationState;

		electronBridge.invoke( 'executeCommand', 'addNotionTarget', {
			name: targetNameInput.value,
			notionToken: state.notionToken,
			[ checkedPageRadio.dataset[ 'idProperty' ] ]: checkedPageRadio.value,
		} );
		window.close();
	} );

	signInLink && signInLink.addEventListener( 'click', async () => {
		checkValidity();
		if ( targetNameInput.reportValidity() !== true ) {
			return;
		}

		electronBridge.invoke( 'executeCommand', 'addNotionTarget', { name: targetNameInput.value } );
		window.close();
	} );

	function checkValidity() {
		const { value } = targetNameInput;
		targetNameInput.setCustomValidity( validateTargetName( value ) );
	}

	function validateTargetName( targetName ) {
		targetName = String( targetName );

		if ( !targetName.trim().length ) {
			return 'Target name can\'t be empty.';
		}

		if ( targetName == 'test' ) {
			return 'Target name can\'t be "test".';
		}

		// Empty string means no issues are present.
		return '';
	}
}

if ( location.search.length > 1 ) {
	const parsed = new URLSearchParams( location.search );

	if ( parsed.has( 'state' ) ) {
		applyState( JSON.parse( parsed.get( 'state' ) ) );
	}

	if ( parsed.has( 'synchronous' ) && parsed.get( 'synchronous' ) == '1' ) {
		hideSpinner();
	}
}

function hideSpinner() {
	document.getElementById( 'page-loader' ).classList.add( 'hidden' );
	document.getElementById( 'main-tab' ).classList.remove( 'hidden' );
}

function applyState( state ) {
	window.confirmationState = state;
	console.log(state);
	hideSpinner();
	document.getElementById( 'targetName' ).value = state.name || '';

	const mainTab = document.getElementById( 'main-tab' );

	const pagePickerContainer = document.getElementById( 'page-picker-container' );
	const isConfirmView = 'pages' in state;

	mainTab.dataset[ 'tabType' ] = isConfirmView ? 'confirm' : 'new';

	if ( state.pages ) {
		const sortedPages = state.pages.sort( ( a, b ) => {
			if ( !a.knownWorkspace && b.knownWorkspace ) {
				return -1;
			} else if ( a.knownWorkspace && !b.knownWorkspace ) {
				return 1;
			} else {
				return 0;
			}
		} );

		for (const page of sortedPages ) {
			addPage( page );
		}
	}

	function addPage( page ) {
		const {
			id,
			object,
			icon,
			title,
			knownWorkspace
		} = page;

		const checkboxId = `page_value_${ id }`;
		let containerClasses = 'item'
		let workspaceDescription = '';

		if ( knownWorkspace ) {
			containerClasses += ' item-known';
			workspaceDescription = ` - added already to &quot;${ knownWorkspace }&quot; workspace`;
		}

		pagePickerContainer.insertAdjacentHTML( 'beforeend', `<div class="${ containerClasses }">
				<input type="radio" name="page_id" id="${ checkboxId }" value="${ id }" data-id-property="${ page.idPropertyName }" ${ knownWorkspace ? ' disabled="true"' : '' }>
				<label for="${ checkboxId }">${ title } (${ object + workspaceDescription })</label>
			</div>` );
	}
}