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
		invoke: ( channel, data ) => {
			// let validChannels = [ 'renderer-ready' ];
			// if ( !validChannels.includes( channel ) ) {
			// 	return;
			// }
			return ipcRenderer.invoke( channel, data );
		}
	}
);