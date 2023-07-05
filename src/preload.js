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
				channel = 'experiment';
				// @todo the method should be picky.
				// throw new Error( 'Missing channel name' );
			}
			const PROMISE_TIMEOUT_TIME = 5000;

			return new Promise( ( resolve, reject ) => {
				console.log("frontend: sending a promise");
				// @todo add a timeout to reject the promise if it takes too long.
				const cleanup = () => {
					ipcRenderer.removeListener( 'experiment-then', thenCallback );
					ipcRenderer.removeListener( 'experiment-catch', catchCallback );
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

				ipcRenderer.once( 'experiment-then', thenCallback );
				ipcRenderer.once( 'experiment-catch', catchCallback );

				ipcRenderer.send( `${ channel }-promised`, ...args );
			} );
		}
	}
);