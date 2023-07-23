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
	document.getElementById( 'targetName' ).value = state.targetName;

	const pagePickerContainer = document.getElementById( 'playground' );

	for (const page of state.pages ) {
		addPage( page );
	}

	function addPage( page ) {
		const {
			id,
			object,
			icon,
			title
		} = page;

		const checkboxId = `page_value_${ id }`;

		pagePickerContainer.insertAdjacentHTML( 'beforeend', `<div class="item">
				<input type="radio" name="page_id" id="${ checkboxId }" value="${ id }"> <label for="${ checkboxId }">${ title } (${ object })</label>
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

		electronBridge.invoke( 'executeCommand', 'addNotionTarget', targetNameInput.value );
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