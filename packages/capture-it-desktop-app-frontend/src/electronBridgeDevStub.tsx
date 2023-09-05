
import { setActiveWorkspaceIndex } from "./workspaces/workspacesSlice";
import store from "./store";

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
	activeWorkspaceIndexChanged: 1
};

const callbacksMocks = {
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
	}
};

export default function addDevelopmentStub() {
	( window as any ).electron = {
		receive: ( channel: string, func: any ) => {
			// ipcRenderer.on( channel, ( event, ...args ) => func( ...args ) );

			if ( channel in ( mocks as any ) ) {
				setTimeout( () => {
					func( ( mocks as any )[ channel ] );
				}, 400 );
			} else {
				console.error( 'ipcRenderer#receive has no mock handling for channel: ' + channel );
			}

		},
		send: ( channel: string, data: any ) => {

			console.warn( 'ipcRenderer#send stub is unsupported, requested with channel: ' + channel );
		},
		invoke: ( channel: string, data: string, ...args: any[] ) => {
			if ( channel === 'executeCommand' && data in callbacksMocks ) {
				( callbacksMocks as any )[ data ]( ...args );
			} else {
				console.warn( 'ipcRenderer#invoke stub is unsupported, requested with channel: ' + channel );
			}

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