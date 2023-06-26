const {
	ipcRenderer, shell
} = require( 'electron' );

let config = undefined;

async function asyncInitialization() {
	let containerToBeShown = document.getElementById( 'app-tab' );
	let errorContent = null;
	try {
		config = await ipcRenderer.invoke( 'getConfig' );
		config = JSON.parse( config );
		console.log( 'config fetched', config );

		style="display: none;"
	} catch ( error ) {
		errorContent = String( error );
		containerToBeShown = document.getElementById( 'config-missing-tab' );
	}

	containerToBeShown.style.display = 'block';
	if ( errorContent) {
		console.error( errorContent );
		window.requestIdleCallback( () => {
			// Rendering it synchronously would freeze the UI thread. I want error "tab" to be visible in bg.
			alert( errorContent );
		} );
	}
}

asyncInitialization();

document.getElementById( 'submitButton' ).addEventListener( 'click', () => {
	const textInput = document.getElementById( 'textInput' );
	const text = textInput.value;
	textInput.value = '';

	const {
		pageId,
		dataBaseId,
		notionToken
	} = config;

	if ( text.strip() === '' ) {
		console.warn( 'Can\'t send empty item.' );
		return;
	}

	if ( dataBaseId ) {
		appendPageToDatabase( dataBaseId, notionToken, text );
	} else {
		appendParagraphToNotionPage( pageId, notionToken, text );
	}
} );


function appendParagraphToNotionPage( pageId, notionToken, paragraphText ) {
	const url = `https://api.notion.com/v1/blocks/${pageId}/children`;
	const requestOptions = {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${notionToken}`,
			'Notion-Version': '2021-05-13' // Replace with the desired Notion API version
		},
		body: JSON.stringify( {
			children: [ {
				object: 'block',
				type: 'paragraph',
				paragraph: {
					text: [ {
						type: 'text',
						text: {
							content: paragraphText
						}
					} ]
				}
			} ]
		} )
	};

	return fetch( url, requestOptions )
		.then( response => response.json() )
		.then( data => {
			console.log( 'Paragraph appended successfully:', data );
		} )
		.catch( error => {
			console.error( 'Error appending paragraph:', error );
		} );
}

async function appendPageToDatabase( databaseId, apiToken, pageText ) {
	try {
		const response = await fetch( 'https://api.notion.com/v1/pages', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiToken}`,
				'Content-Type': 'application/json',
				'Notion-Version': '2021-05-13',
			},
			body: JSON.stringify( {
				parent: {
					database_id: databaseId
				},
				properties: {
					Name: {
						title: [ {
							text: {
								content: pageText,
							},
						}, ],
					},
				},
			} ),
		} );

		const data = await response.json();

		if ( response.ok ) {
			console.log( 'Page appended successfully:', data );
		} else {
			console.error( 'Error appending page:', data );
		}
	} catch ( error ) {
		console.error( 'Error appending page:', error );
	}
}


document.addEventListener( 'DOMContentLoaded', ( event ) => {
	const textInput = document.getElementById( 'textInput' );

	textInput.focus();

	textInput.addEventListener( 'keyup', ( event ) => {
		if ( event.key === 'Enter' && ( !event.shiftKey && !event.altKey ) ) {
			// CTRL / CMD modifiers are allowed. Typically ctrl+enter means confirm an action.
			event.preventDefault();
			document.getElementById( 'submitButton' ).click();
		}
	} );
} );

document.addEventListener( 'click', ( event ) => {
	// Absolute links should open in a browser.
	if ( event.target.tagName === 'A' && event.target.href.startsWith( 'http' ) ) {
		event.preventDefault();
		shell.openExternal( event.target.href );
	}
} );