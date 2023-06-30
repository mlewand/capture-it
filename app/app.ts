interface ElectronBridge {
	receive: ( channel: string, func: ( ...args: any[] ) => void ) => void;
	invoke: ( channel: string, ...args: any[] ) => Promise<any>;
	send: ( channel: string, ...args: any[] ) => void;
}

interface Config {
	pageId?: string;
	dataBaseId?: string;
	notionToken: string;
	invocationHotKey?: string;
	forceOpenLinksInNotionApp?: boolean;
}

const electronBridge: ElectronBridge = ( window as any ).electron;
let config: Config | undefined;

async function asyncInitialization(): Promise<void> {
	let containerToBeShown: HTMLElement | null = document.getElementById('app-tab');
	let errorContent: string | null = null;

	config = (await electronBridge.invoke('getConfig')) as any;

	if ( config ) {
		window.requestIdleCallback( () => {
			setupInitialFocus();
			initializeProTips();
		} );
	} else {
		errorContent = 'The .note-quick-add-config.json configuration file is missing or invalid.';
		containerToBeShown = document.getElementById('config-missing-tab');
	}

	if (containerToBeShown) {
		containerToBeShown.style.display = 'block';
	}

	if (errorContent) {
		console.error(errorContent);
	}
}

electronBridge.receive('configChanged', (event: any, newConfig: any) => {
	alert( 'Config changed' );
	console.log(newConfig);
} );

document.getElementById('submitButton')!.addEventListener('click', clickEvent => {
	const textInput = document.getElementById('textInput') as HTMLInputElement;
	const text = textInput.value;
	textInput.value = '';

	if (!config) {
		console.error('Configuration not loaded');
		return;
	}

	const { pageId, dataBaseId, notionToken } = config;

	if (text.trim() === '') {
		console.warn("Can't send empty item.");
		return;
	}

	const insertPromise = dataBaseId ? appendPageToDatabase(dataBaseId, notionToken, text)
		: appendParagraphToNotionPage(pageId!, notionToken, text);

	const notification = addNotification( text, 'loading' );

	insertPromise.then( (data: any) => {
			addNotification( text, 'success', notification );

			if ( data.url && clickEvent.altKey ) {

				// shell.openExternal( config!.forceOpenLinksInNotionApp ? data.url.replace( /^https:/, 'notion:' ) : data.url  );
				console.log( 'shell call', config!.forceOpenLinksInNotionApp ? data.url.replace( /^https:/, 'notion:' ) : data.url  );
			}
		} )
		.catch( error => {
			addNotification( `${ text } - ${ error }`, 'error', notification );
			console.error( error );
		} );
});

function addNotification( text: string, type: 'success' | 'error' | 'loading', existingNotification?: HTMLElement) {

	if ( existingNotification ) {
		// If reusing notification, make sure to clear its content.
		existingNotification.className = '';
		existingNotification.innerHTML = '';
	}

	const loadingBox = type === 'loading' ? '<span class="loader"></span>' : '';
	const notification = document.createElement( 'div' );

	notification.className = `notification ${ type }`;

	notification.insertAdjacentText( 'beforeend', text );

	if ( type === 'error' ) {
		notification.insertAdjacentHTML( 'beforeend', '<button class="button-dismiss">dismiss</button>' );
	} else if ( type === 'loading' ) {
		notification.insertAdjacentHTML( 'afterbegin', '<span class="loader"></span>' );
	} else if ( type === 'success' ) {
		// The success notification should be automatically dismissed after 5 seconds, but not if it's hovered.
		const timerId = window.setInterval( () => {
			if ( !notification.matches( '.notification:hover' ) ) {
				notification.remove();
				window.clearInterval( timerId );
			}
		}, 5000 );
	}

	document.getElementById( 'notification-area-container' )?.appendChild( notification );

	return notification;
}

function appendParagraphToNotionPage(pageId: string, notionToken: string, paragraphText: string): Promise<void> {
	const url = `https://api.notion.com/v1/blocks/${pageId}/children`;
	const requestOptions: RequestInit = {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${notionToken}`,
			'Notion-Version': '2021-05-13' // Replace with the desired Notion API version
		},
		body: JSON.stringify({
			children: [
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						text: [
							{
								type: 'text',
								text: {
									content: paragraphText
								}
							}
						]
					}
				}
			]
		})
	};

	return fetch(url, requestOptions)
		.then(async ( response ) => {
			const data = await response.json() as any;

			if ( !response.ok ) {
				throw `Error (${ response.status }, ${ data.code }): ${ data.message }`;
			}

			return data;
		} )
		.then( data => {
			console.log( 'Paragraph appended successfully:', data );

			return data;
		} );
}

async function appendPageToDatabase(databaseId: string, apiToken: string, pageText: string): Promise<void> {
	const response = await fetch('https://api.notion.com/v1/pages', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${apiToken}`,
			'Content-Type': 'application/json',
			'Notion-Version': '2021-05-13'
		},
		body: JSON.stringify({
			parent: {
				database_id: databaseId
			},
			properties: {
				Name: {
					title: [
						{
							text: {
								content: pageText
							}
						}
					]
				}
			}
		})
	});

	const data = await response.json();

	if (response.ok) {
		console.log('Page appended successfully:', data);
	} else {
		throw `Error (${ response.status }, ${ data.code }): ${ data.message }`;
	}

	return data;
}

document.addEventListener('DOMContentLoaded', async () => {
	await asyncInitialization();

	const textInput = document.getElementById('textInput');
	setupInitialFocus();

	textInput!.addEventListener('keyup', (event: KeyboardEvent) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			// CTRL / CMD modifiers are allowed. Typically ctrl+enter means confirm an action.
			event.preventDefault();

			const clickEvent = new MouseEvent("click", {
				altKey: event.altKey,
				ctrlKey: event.ctrlKey,
				metaKey: event.metaKey
			} );
			document.getElementById('submitButton')!.dispatchEvent( clickEvent );
		}
	} );

	document.getElementById( 'notification-area-container' )?.addEventListener( 'click', ( event: MouseEvent ) => {
		if ( ( event.target as HTMLElement ).classList.contains( 'button-dismiss' ) ) {
			( event.target as HTMLElement ).closest( '.notification' )?.remove();
		}
	} );

	document.getElementById( 'create-missing-config-button' )?.addEventListener( 'click', () => {
		// ipcRenderer.invoke( 'executeCommand', 'openConfig' );
		electronBridge.send( 'executeCommand', 'openConfig' );
	} );
} );

document.addEventListener( 'keyup', ( event: KeyboardEvent ) => {
	const noModifierKeysPressed = !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
	let commandToCall = null;

	if ( event.key === 'Escape' && noModifierKeysPressed ) {
		// Esc key should hide the window.
		commandToCall = 'hide';
	} else if ( event.key === 'q' && event.ctrlKey ) {
		// Ctrl + Q should quit the app.
		commandToCall = 'quit';
	}

	if ( commandToCall ) {
		// ipcRenderer.invoke( 'executeCommand', commandToCall );
		electronBridge.send( 'executeCommand', commandToCall );
		event.preventDefault();
	}
} );

document.addEventListener('click', (event: MouseEvent) => {
	// Absolute links should open in a browser.
	if ((event.target as Element).tagName === 'A' && (event.target as HTMLAnchorElement).href.startsWith('http')) {
		event.preventDefault();
		// shell.openExternal((event.target as HTMLAnchorElement).href);
		console.log( 'shell call',(event.target as HTMLAnchorElement).href);
	}
});

function setupInitialFocus(): void {
	const textInput = document.getElementById('textInput');

	if (textInput) {
		(textInput as HTMLInputElement).focus();
	}
}

function initializeProTips() {
	const container = document.getElementById( 'pro-tip-container' )!;

	Array.from( container.querySelectorAll( '[data-pro-tip-placeholder=invocation-key]' ) ).map( item => {
		item.textContent = config!.invocationHotKey || 'CommandOrControl+Shift+M';
	} );

	refreshProTip();

	window.setInterval( refreshProTip, 30000 );

	function refreshProTip() {
		const items = Array.from( container.querySelectorAll( 'p' ) );

		items.map( item => item.classList.remove( 'visible' ) );

		const randomItem = items[ Math.floor( Math.random() * items.length ) ];
		randomItem.classList.add( 'visible' );
	}
}