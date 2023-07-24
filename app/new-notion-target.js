
// Alias for compatibility across the files.
window.electronBridge = window.electron;

document.addEventListener('DOMContentLoaded', async () => {
	addListeners();
} );

electronBridge.receive( 'alert', ( message ) => {
	alert( message );
} );

function addListeners() {
	const targetNameInput = document.getElementById( 'targetName' );

	targetNameInput.addEventListener( 'input', () => checkValidity() );

	// Force adding validity check synchronously.
	checkValidity();

	document.getElementById( 'sign-in-link' ).addEventListener( 'click', async () => {
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