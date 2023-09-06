
import { setActiveWorkspaceIndex } from "./workspaces/workspacesSlice";
import store from "./store";
import { getElectronBridge } from "./appHelpers";

const mockScenario = null;
// const mockScenario = 'empty_workspaces';
// const mockScenario = 'no_config';
// const mockScenario = 'missing_workspaces';

const IGNORE_MOCK = Symbol();

const mocks = {
	configChanged: {
		"_events": {},
		"_eventsCount": 1,
		"workspaces": [
			{
				"name": "Workspace 1",
				"pageId": "page_id_hash",
				"dataBaseId": "database_id_hash",
				"notionToken": "notion_token_secr",
				"tags": {
					"@tag1": "first tag",
					"@tag2": "second tag",
				}
			},
			{
				"name": "Workspace 3",
				"pageId": "page_id_hash",
				"dataBaseId": "database_id_hash",
				"notionToken": "notion_token_secr",
				"tags": {
					"@tt": "twiter"
				}
			},
			{
				"name": "Final workspace",
				"dataBaseId": "database_id_hash",
				"notionToken": "notion_token_secr",
				"tags": {
					"@workspace": "testing db"
				}
			},
		],
		"invocationHotKey": "Control+Shift+M",
		"forceOpenLinksInNotionApp": true,
		"tags": {
			"@foo": "foobar",
			"@gtg": "getting things done",
		}
	},
	configChanged__no_config: undefined,
	configChanged__empty_workspaces: {
		"_events": {},
		"_eventsCount": 1,
		"workspaces": [],
		"invocationHotKey": "Control+Shift+M",
		"forceOpenLinksInNotionApp": true,
		"tags": {
			"@foo": "foobar",
			"@gtg": "getting things done",
		}
	},
	configChanged__missing_workspaces: {
		"invocationHotKey": "Control+Shift+M",
		"forceOpenLinksInNotionApp": true
	},
	alert: IGNORE_MOCK,
	activeWorkspaceIndexChanged: 1,
	activeWorkspaceIndexChanged__no_config: undefined,
	activeWorkspaceIndexChanged__empty_workspaces: undefined,
	activeWorkspaceIndexChanged__missing_workspaces: undefined,
	globalHotkeyFocus: null,
};

const callbackMocks = {
	setWorkspace: ( newIndex: number | string ) => {
		const currentValue = store.getState().workspaces._activeWorkspaceIndex || 0;

		console.log( 'nextTab command mock, polled index', currentValue, newIndex );

		if ( newIndex === 'next' ) {
			newIndex = currentValue + 1;
		} else if ( newIndex === 'prev' ) {
			newIndex = currentValue - 1;
		}

		if ( typeof newIndex === 'number' ) {
			store.dispatch( setActiveWorkspaceIndex( newIndex ) );
		}
	},
	openConfig: () => {
		alert( 'openConfig command mock' );
	},
	openBrowser: ( url: string ) => {
		alert( `Called command to open a link: "${url}"` );
	},
	captureItem: ( ...args: any[] ) => {
		alert( `Called command captureItem with arguments: "${JSON.stringify( args )}"` );
	},
};

export default function addDevelopmentStub() {
	function pickMock( name: string, mocksResource: any, mockResourceName: string = 'mocks' ) {
		if ( mockScenario && `${name}__${mockScenario}` in mocksResource ) {
			return mocksResource[ `${name}__${mockScenario}` ];
		} else if ( name in mocksResource ) {
			return mocksResource[ name ];
		} else {
			throw new Error( `Couldn\'t find mock resource "${name}" in ${mockResourceName} group.` );
		}
	}

	function pickCallbackMock( name: string, mocksResource: any ) {
		return pickMock( name, mocksResource, 'callbacksMocks' );
	}

	( window as any ).electron = {
		receive: ( channel: string, func: any ) => {
			try {
				const mockResponse = pickMock( channel, mocks );

				if ( mockResponse !== IGNORE_MOCK ) {
					setTimeout( () => {
						func( mockResponse as any );
					}, 400 );
				}
			} catch ( e ) {
				console.error( e );
			}
		},
		send: ( channel: string, data: any ) => {

			console.warn( 'ipcRenderer#send stub is unsupported, requested with channel: ' + channel );
		},
		invoke: ( channel: string, data: string, ...args: any[] ) => {
			try {
				if ( channel === 'executeCommand' ) {
					const commandMock = pickCallbackMock( data, callbackMocks );
					commandMock( ...args );
				} else {
					throw new Error( 'ipcRenderer#invoke stub is unsupported, requested with channel: ' + channel );
				}
			} catch ( e ) {
				console.error( e );
			}
		},
		promisedInvoke: ( channel: string, ...args: any[] ) => {
			return new Promise( ( resolve, reject ) => {
				if ( channel.endsWith( 'Async' ) ) {
					channel = channel.replace( /Async$/, '' );
				}

				setTimeout( () => {
					return getElectronBridge().invoke( channel, ...args )
				}, 100 );
			} );
		},

		// A custom implementation of invoke, that returns a promise.
		// This promise will resolve if main's process promise resolved or get rejected accordingly.
		// It has a 30 sec timeout.
		// promisedInvoke: ( channel, ...args ) => {
		// 	if ( !channel ) {
		// 		throw new Error( 'Missing channel name' );
		// 	}

		// 	const PROMISE_TIMEOUT_TIME = 30000;

		// 	return new Promise( async ( resolve, reject ) => {
		// 		const uniqueId = await ipcRenderer.invoke( `promised/call/${channel}`, ...args );

		// 		const cleanup = () => {
		// 			ipcRenderer.removeListener( `promised/then/${channel}/${uniqueId}`, thenCallback );
		// 			ipcRenderer.removeListener( `promised/catch/${channel}/${uniqueId}`, catchCallback );
		// 			clearTimeout( timeoutHandler );
		// 		}

		// 		const timeoutHandler = setTimeout( () => {
		// 			cleanup();
		// 			reject( new Error( `Promise timeout, maybe there's no listener on "${channel}" channel in the main process?` ) );
		// 		}, PROMISE_TIMEOUT_TIME );

		// 		const thenCallback = ( event, ...args ) => {
		// 			cleanup();
		// 			resolve( ...args );
		// 		};
		// 		const catchCallback = ( event, ...args ) => {
		// 			cleanup();
		// 			reject( ...args );
		// 		};

		// 		console.log( 'frontend, received id: ', uniqueId );

		// 		console.log( 'listening to ', `promised/then/${channel}/${uniqueId}` );

		// 		ipcRenderer.once( `promised/then/${channel}/${uniqueId}`, thenCallback );
		// 		ipcRenderer.once( `promised/catch/${channel}/${uniqueId}`, catchCallback );
		// 	} );
		// }
	};
};