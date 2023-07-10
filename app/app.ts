interface ElectronBridge {
	receive: ( channel: string, func: ( ...args: any[] ) => void ) => void;
	invoke: ( channel: string, ...args: any[] ) => Promise<any>;
	send: ( channel: string, ...args: any[] ) => void;
	promisedInvoke: ( channel: string, ...args: any[] ) => Promise<any>;
}

interface WorkspaceInfo {
	name?: string;
	pageId: string;
	dataBaseId: string;
	notionToken: string;
}

interface ConfigFileInterface {
	workspaces: WorkspaceInfo[];
	invocationHotKey: string;
	forceOpenLinksInNotionApp: boolean;
}

const electronBridge: ElectronBridge = ( window as any ).electron;
let config: ConfigFileInterface | undefined;
let activeWorkspaceIndex: number | undefined;

const configPromise = new Promise<ConfigFileInterface>( (resolve, reject) => {
	electronBridge.invoke( 'getConfig' )
		.then( resolve )
		.catch( reject );
} );

electronBridge.receive('configChanged', (newConfig: any) => {
	// @todo handle it more dynamically.
	console.log('newcfg', newConfig);
} );

electronBridge.receive( 'activeWorkspaceIndexChanged', ( index: number ) => {
	activeWorkspaceIndex = index;
	updateWorkspacesBar();
} );

electronBridge.receive('globalHotkeyFocus', () => {
	setupInitialFocus();
} );

function getActiveWorkspace(): WorkspaceInfo | undefined {
	if ( activeWorkspaceIndex !== undefined ) {
		return config!.workspaces[ activeWorkspaceIndex ];
	}
}

async function asyncInitialization(): Promise<boolean> {
	let containerToBeShown: HTMLElement | null = document.getElementById('app-tab');
	let errorContent: string | null = null;

	config = (await electronBridge.invoke('getConfig')) as any;

	if ( config ) {
		window.requestIdleCallback( () => {
			setupInitialFocus();
			initializeProTips();
			initializeWorkspacesBar();
		} );
	} else {
		errorContent = 'The .capture-it-config.json configuration file is missing or invalid.';
		containerToBeShown = document.getElementById('config-missing-tab');
	}

	if (containerToBeShown) {
		containerToBeShown.style.display = 'block';
	}

	if (errorContent) {
		console.error(errorContent);
	}

	return errorContent === null;
}

document.addEventListener('DOMContentLoaded', async () => {
	addListeners();

	if( !await asyncInitialization() ) {
		console.log('initialization failed');
		return;
	}
	console.log('initialization went fine');

	setupInitialFocus();
} );

function addListeners() {
	const textInput = document.getElementById('textInput');

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
		electronBridge.invoke( 'executeCommand', 'openConfig' );
	} );

	document.addEventListener( 'keyup', ( event: KeyboardEvent ) => {
		const noModifierKeysPressed = !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
		let commandToCall = null;
		let extraArgs: any[] = [];

		if ( event.key === 'Escape' && noModifierKeysPressed ) {
			// Esc key should hide the window.
			commandToCall = 'hide';
		} else if ( event.key === 'q' && event.ctrlKey ) {
			// Ctrl + Q should quit the app.
			commandToCall = 'quit';
		} else if ( event.key == 'Tab' && ( event.ctrlKey || event.metaKey ) ) {
			commandToCall = 'setWorkspace';

			extraArgs.push( event.shiftKey ? 'previous' : 'next' );
		} else if ( ( event.code.startsWith( 'Digit' ) && event.code != 'Digit0' ) && event.shiftKey && event.altKey ) {
			// alt + shift + 1 - 9 handing to change the workspace.
			commandToCall = 'setWorkspace';
			extraArgs = [ parseInt( event.code.substr( 5 ) ) - 1 ];
		}

		if ( commandToCall ) {
			electronBridge.invoke( 'executeCommand', commandToCall, ...extraArgs );
			event.preventDefault();
		}
	} );

	document.addEventListener('click', (event: MouseEvent) => {
		// Absolute links should open in a browser.
		if ((event.target as Element).tagName === 'A' && (event.target as HTMLAnchorElement).href.startsWith('http')) {
			event.preventDefault();
			electronBridge.invoke( 'executeCommand', 'openBrowser', (event.target as HTMLAnchorElement).href );
		}
	});

	document.getElementById('submitButton')!.addEventListener('click', clickEvent => {
		const textInput = document.getElementById('textInput') as HTMLInputElement;
		const text = textInput.value;
		textInput.value = '';

		submitNote( text, clickEvent.altKey );
	});
}

function setupInitialFocus(): void {
	const textInput = document.getElementById('textInput');

	if (textInput) {
		(textInput as HTMLInputElement).focus();
	}
}

function submitNote( text: string, openPage = false ) : void {
	const insertPromise = electronBridge.promisedInvoke( 'executeCommandAsync', 'captureItem', text );
	const notification = addNotification( text, 'loading' );

	insertPromise.then( (data: any) => {
			addNotification( text, 'success', notification );

			if ( data.url && openPage ) {
				electronBridge.invoke( 'executeCommand', 'openNotionPage', data.url )
			}
		} )
		.catch( error => {
			addNotification( `${ text } - ${ error }`, 'error', notification );
			console.error( error );
		} );
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

function initializeWorkspacesBar() {
	const workspacesBar = document.getElementById( 'workspaces-bar' )!;

	const cssClassMethod = config!.workspaces.length <= 2 ? 'add' : 'remove';
	document.getElementById('workspaces-bar')!.classList[ cssClassMethod ]('hidden');


	workspacesBar.addEventListener( 'click', event => {
		const target = event.target as HTMLElement;
		const workspaceKey = target.dataset.workspaceKey;

		if ( workspaceKey ) {
			electronBridge.invoke( 'executeCommand', 'setWorkspace', parseInt( workspaceKey ) );
		}
	} );
}

function updateWorkspacesBar() {
	const activeWorkspace = getActiveWorkspace();
	const workspaces = config!.workspaces;
	let innerHTML = '';

	const cssClassMethod = workspaces.length <= 2 ? 'add' : 'remove';
	document.getElementById('workspaces-bar')!.classList[ cssClassMethod ]('hidden');

	for (let index = 0; index < workspaces.length; index++) {
		const curWorkspace = workspaces[ index ];
		const isActive = index === activeWorkspaceIndex;
		const name = curWorkspace.name || `Workspace ${ index + 1 }`;

		innerHTML += `<a href="#" data-workspace-key="${ index }" class="${ isActive ? 'active' : '' }">${ name }</a>`;
	}

	document.getElementById( 'workspaces-bar' )!.innerHTML = innerHTML;
}