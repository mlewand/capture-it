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

const isOsX = navigator.userAgent.includes( 'OS X' );

function getActiveWorkspace(): WorkspaceInfo | undefined {
	if ( activeWorkspaceIndex !== undefined ) {
		return config!.workspaces[ activeWorkspaceIndex ];
	}
}

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
		const metaOrCtrlIsPressed = isOsX ? event.metaKey : event.ctrlKey;
		let commandToCall = null;
		let extraArgs: any[] = [];

		if ( event.key === 'Escape' && noModifierKeysPressed ) {
			// Esc key should hide the window.
			commandToCall = 'hide';
		} else if ( event.key === 'q' && event.ctrlKey && !isOsX ) {
			// Ctrl + Q should quit the app.
			// For macOS there's a separate handling, see https://github.com/mlewand/capture-it/issues/31.
			commandToCall = 'quit';
		} else if ( event.key == 'Tab' && event.ctrlKey ) {
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
}

function ensureReasonableFocus(): void {
	if ( document.activeElement === document.body ) {
		// This has to be set only if there's no good focus.
		const selectors = [ '#textInput', '#config-missing-tab .create-missing-config-button', '#no-workspaces-tab .add-workspace' ];
		const focusCandidates = document.querySelectorAll( selectors.join( ', ' ) ) as NodeListOf<HTMLElement>;

		for (const focusCandidate of focusCandidates) {
			if ( focusCandidate.offsetParent ) {
				focusCandidate.focus();
				break;
			}
		}
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