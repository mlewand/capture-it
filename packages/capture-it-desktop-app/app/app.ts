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
	document.getElementById( 'notification-area-container' )?.addEventListener( 'click', ( event: MouseEvent ) => {
		if ( ( event.target as HTMLElement ).classList.contains( 'button-dismiss' ) ) {
			( event.target as HTMLElement ).closest( '.notification' )?.remove();
		}
	} );
}

function updateWorkspacesBar() {
	const activeWorkspace = getActiveWorkspace();
	const workspaces = config!.workspaces;
	let innerHTML = '';

	const appTab = document.getElementById( 'app-tab' )!;

	appTab.classList.toggle( 'has-workspaces', workspaces.length > 0 );
	appTab.classList.toggle( 'has-one-workspace', workspaces.length == 1 );
	appTab.classList.toggle( 'has-many-workspaces', workspaces.length > 1 );

	for ( let index = 0; index < workspaces.length; index++ ) {
		const curWorkspace = workspaces[ index ];
		const isActive = index === activeWorkspaceIndex;
		const name = curWorkspace.name || `Workspace ${index + 1}`;

		innerHTML += `<a href="#" data-workspace-key="${index}" class="${isActive ? 'active' : ''}">${name}</a>`;
	}

	document.getElementById( 'tabs' )!.innerHTML = innerHTML;
}