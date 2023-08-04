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

electronBridge.receive( 'alert', ( message: string ) => {
	alert( message );
} );

electronBridge.receive( 'configChanged', handleConfigChange );

function handleConfigChange( newConfig: any) {
	console.log( 'configChanged', newConfig );
	config = newConfig;

	updateWorkspacesBar();
	updateVisibleTab();
}

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

/**
 *
 * @returns {string|null} Explanation message or null if default view is visible.
 */
function updateVisibleTab(): string | null {
	let containerIdToBeShown: string = 'app-tab';
	let retValue: string | null = null;

	if ( !config ) {
		retValue = 'The .capture-it-config.json configuration file is missing or invalid.';
		containerIdToBeShown = 'config-missing-tab';
	} else if ( !hasWorkspaces( config ) ) {
		retValue = 'No workspaces defined.';
		containerIdToBeShown = 'no-workspaces-tab';
	}

	for ( const tabSection of Array.from( document.querySelectorAll( 'body > section[id$="-tab"]' ) ) ) {
		console.log(tabSection.id, containerIdToBeShown);
		( tabSection as HTMLElement ).style.display = tabSection.id == containerIdToBeShown ? 'block' : 'none';
	}

	if (retValue) {
		console.error( 'updateVisibleTab(): ' + retValue );
	}

	return retValue || null;

	function hasWorkspaces( cfg: any ) {
		return cfg.workspaces && cfg.workspaces.length;
	}
}

async function asyncInitialization(): Promise<boolean> {
	let containerToBeShown: HTMLElement | null = document.getElementById('app-tab');
	let errorContent: string | null = null;

	config = (await electronBridge.invoke('getConfig')) as any;

	if ( updateVisibleTab() === null ) {
		window.requestIdleCallback( () => {
			setupInitialFocus();
			initializeProTips();
			initializeWorkspacesBar();
		} );

		return true;
	}

	return false;
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
		// The only allowed shift combination is shift + alt for now.
		if ( event.key === 'Enter' && ( !event.shiftKey || event.altKey ) ) {
			// CTRL / CMD modifiers are allowed. Typically ctrl+enter means confirm an action.
			event.preventDefault();

			const clickEvent = new MouseEvent("click", {
				altKey: event.altKey,
				ctrlKey: event.ctrlKey,
				metaKey: event.metaKey,
				shiftKey: event.shiftKey
			} );
			document.getElementById('submitButton')!.dispatchEvent( clickEvent );
		}
	} );

	document.getElementById( 'notification-area-container' )?.addEventListener( 'click', ( event: MouseEvent ) => {
		if ( ( event.target as HTMLElement ).classList.contains( 'button-dismiss' ) ) {
			( event.target as HTMLElement ).closest( '.notification' )?.remove();
		}
	} );

	for ( const button of Array.from( document.querySelectorAll( '.create-missing-config-button' ) ) ) {
		button.addEventListener( 'click', event => {
			electronBridge.invoke( 'executeCommand', 'openConfig' );
			event.preventDefault();
		} );
	}

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

	document.getElementById( 'submitButton' )!.addEventListener( 'click', clickEvent => {
		const textInput = document.getElementById( 'textInput' ) as HTMLInputElement;
		const text = textInput.value;
		textInput.value = '';

		submitNote( text, clickEvent.altKey && !clickEvent.shiftKey, clickEvent.altKey && clickEvent.shiftKey );
	} );

	const addWorkspaceButtons = document.querySelectorAll( '.add-workspace, #add-workspace' );

	for ( const button of Array.from( addWorkspaceButtons ) ) {
		button.addEventListener( 'click', async () => {
			electronBridge.invoke( 'executeCommand', 'addNotionWorkspace' );
		} );
	}
}

function setupInitialFocus(): void {
	const textInput = document.getElementById('textInput');

	if (textInput) {
		(textInput as HTMLInputElement).focus();
	}
}

function submitNote( text: string, openPage = false, copyToClipboard = false ) : void {
	const insertPromise = electronBridge.promisedInvoke( 'executeCommandAsync', 'captureItem', text );
	const notification = addNotification( text, 'loading' );

	insertPromise.then( (data: any) => {
			addNotification( text, 'success', notification );

			if ( data.redirect_url && copyToClipboard ) {
				navigator.clipboard.writeText( data.redirect_url );
			} else if ( data.redirect_url && openPage ) {
				electronBridge.invoke( 'executeCommand', 'openNotionPage', data.redirect_url );
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

	workspacesBar.addEventListener( 'click', event => {
		const target = event.target as HTMLElement;
		const workspaceKey = target.dataset.workspaceKey;

		if ( workspaceKey ) {
			electronBridge.invoke( 'executeCommand', 'setWorkspace', parseInt( workspaceKey ) );
		}
	} );

	updateWorkspacesBar();
}

function updateWorkspacesBar() {
	const activeWorkspace = getActiveWorkspace();
	const workspaces = config!.workspaces;
	let innerHTML = '';

	const appTab = document.getElementById( 'app-tab' )!;

	appTab.classList.toggle( 'has-workspaces', workspaces.length > 0 );
	appTab.classList.toggle( 'has-one-workspace', workspaces.length == 1 );
	appTab.classList.toggle( 'has-many-workspaces', workspaces.length > 1 );

	for (let index = 0; index < workspaces.length; index++) {
		const curWorkspace = workspaces[ index ];
		const isActive = index === activeWorkspaceIndex;
		const name = curWorkspace.name || `Workspace ${ index + 1 }`;

		innerHTML += `<a href="#" data-workspace-key="${ index }" class="${ isActive ? 'active' : '' }">${ name }</a>`;
	}

	document.getElementById( 'tabs' )!.innerHTML = innerHTML;
}