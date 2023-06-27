const {
	ipcRenderer, shell
} = require( 'electron' );

interface Config {
	pageId?: string;
	dataBaseId?: string;
	notionToken: string;
}

let config: Config | undefined;

async function asyncInitialization(): Promise<void> {
	let containerToBeShown: HTMLElement | null = document.getElementById('app-tab');
	let errorContent: string | null = null;

	try {
		config = JSON.parse(await ipcRenderer.invoke('getConfig'));
		console.log('config fetched', config);

		window.requestIdleCallback(() => {
			setupInitialFocus();

			addNotification( 'notification content', 'loading' );
			addNotification( 'notification content', 'success' );
			addNotification( 'notification content', 'error' );
		});
	} catch (error) {
		errorContent = String(error);
		containerToBeShown = document.getElementById('config-missing-tab');
	}

	if (containerToBeShown) {
		containerToBeShown.style.display = 'block';
	}

	if (errorContent) {
		console.error(errorContent);
		window.requestIdleCallback(() => {
			// Rendering it synchronously would freeze the UI thread. I want error "tab" to be visible in bg.
			alert(errorContent);
		});
	}
}

asyncInitialization();

document.getElementById('submitButton')!.addEventListener('click', () => {
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

	insertPromise.then( response => {
			addNotification( text, 'success', notification );
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

	if ( type === 'loading' ) {
		notification.insertAdjacentHTML( 'afterbegin', '<span class="loader"></span>' );
	}

	notification.insertAdjacentText( 'beforeend', text );

	document.getElementById( 'notification-area' )?.appendChild( notification );

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
		.then(response => response.json())
		.then(data => {
			console.log('Paragraph appended successfully:', data);
		})
		.catch(error => {
			console.error('Error appending paragraph:', error);
		});
}

async function appendPageToDatabase(databaseId: string, apiToken: string, pageText: string): Promise<void> {
	try {
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
			console.error('Error appending page:', data);
		}
	} catch (error) {
		console.error('Error appending page:', error);
	}
}

document.addEventListener('DOMContentLoaded', () => {
	const textInput = document.getElementById('textInput');
	setupInitialFocus();

	textInput!.addEventListener('keyup', (event: KeyboardEvent) => {
		if (event.key === 'Enter' && (!event.shiftKey && !event.altKey)) {
			// CTRL / CMD modifiers are allowed. Typically ctrl+enter means confirm an action.
			event.preventDefault();
			document.getElementById('submitButton')!.click();
		}
	});
});

document.addEventListener('click', (event: MouseEvent) => {
	// Absolute links should open in a browser.
	if ((event.target as Element).tagName === 'A' && (event.target as HTMLAnchorElement).href.startsWith('http')) {
		event.preventDefault();
		shell.openExternal((event.target as HTMLAnchorElement).href);
	}
});

function setupInitialFocus(): void {
	const textInput = document.getElementById('textInput');

	if (textInput) {
		(textInput as HTMLInputElement).focus();
	}
}
