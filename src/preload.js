console.log( 'preload loaded' );

const {
	contextBridge,
	ipcRenderer
} = require( 'electron' );

contextBridge.exposeInMainWorld(
	'electron', {
		receive: ( channel, func ) => {
			// let validChannels = [ 'message' ];
			// if ( !validChannels.includes( channel ) ) {
			// 	return;
			// }
			ipcRenderer.on( channel, ( event, ...args ) => func( ...args ) );
		},
		send: ( channel, data ) => {
			// let validChannels = [ 'renderer-ready' ];
			// if ( !validChannels.includes( channel ) ) {
			// 	return;
			// }
			ipcRenderer.send( channel, data );
		},
		invoke: ( channel, data, ...args ) => {
			// let validChannels = [ 'renderer-ready' ];
			// if ( !validChannels.includes( channel ) ) {
			// 	return;
			// }
			return ipcRenderer.invoke( channel, data, ...args );
		},
		experiment: ( channel, ...args ) => {
			if ( !channel ) {
				throw new Error( 'Missing channel name' );
			}
			const PROMISE_TIMEOUT_TIME = 5000;
			// const PROMISE_TIMEOUT_TIME = 30000;

			return new Promise( ( resolve, reject ) => {
				console.log("frontend: sending a promise", `promised/call/${ channel }`);

				// const uniqueId = await ipcRenderer.invoke( `promised/call/${ channel }`, ...args );
				const uniqueId = ipcRenderer.sendSync( `promised/call/${ channel }`, ...args );

				// @todo add a timeout to reject the promise if it takes too long.
				const cleanup = () => {
					ipcRenderer.removeListener( `promised/then/${ channel }/${ uniqueId }`, thenCallback );
					ipcRenderer.removeListener( `promised/catch/${ channel }/${ uniqueId }`, catchCallback );
					clearTimeout( timeoutHandler );
				}

				const timeoutHandler = setTimeout( () => {
					cleanup();
					reject( new Error( `Promise timeout, maybe there's no listener on "${ channel }" channel in the main process?`  ) );
				}, PROMISE_TIMEOUT_TIME );

				const thenCallback = ( event, ...args ) => {
					cleanup();
					resolve( ...args );
				};
				const catchCallback = ( event, ...args ) => {
					cleanup();
					reject( ...args );
				};

				console.log( 'frontend, received id: ', uniqueId );

				console.log('listening to ', `promised/then/${ channel }/${ uniqueId }`);

				ipcRenderer.once( `promised/then/${ channel }/${ uniqueId }`, thenCallback );
				ipcRenderer.once( `promised/catch/${ channel }/${ uniqueId }`, catchCallback );
			} );
		}
	}
);