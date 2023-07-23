// A copy of new notion target - @todo: unify.

// Alias for compatibility across the files.
window.electronBridge = window.electron;

window.confirmationState = {};

document.addEventListener('DOMContentLoaded', async () => {
	addListeners();
} );

electronBridge.receive( 'confirmationState', ( state ) => {
	window.confirmationState = state;
	console.log(state);
	document.getElementById( 'targetName' ).value = state.name;

	const pagePickerContainer = document.getElementById( 'playground' );

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
				<input type="radio" name="page_id" id="${ checkboxId }" value="${ id }" ${ knownWorkspace ? ' disabled="true"' : '' }>
				<label for="${ checkboxId }">${ title } (${ object + workspaceDescription })</label>
			</div>` );
	}
} );

function addListeners() {
	const targetNameInput = document.getElementById( 'targetName' );

	targetNameInput.addEventListener( 'input', () => checkValidity() );

	document.getElementById( 'save-button' ).addEventListener( 'click', async () => {
		if ( targetNameInput.reportValidity() !== true ) {
			return;
		}

		const pageRadioInputs = Array.from( document.querySelectorAll( 'input[type="radio"][name="page_id"]' ) );

		if ( !pageRadioInputs.find( ( { checked } ) => checked ) ) {
			alert( 'Please select a database or page.' );
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