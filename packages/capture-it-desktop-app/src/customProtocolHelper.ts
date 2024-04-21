import { app, protocol } from 'electron';

const PROTOCOL_NAME = 'my-app';

export function announceProtocol() {
	protocol.registerSchemesAsPrivileged( [
		{
			scheme: PROTOCOL_NAME,
			privileges: {
				standard: true,
				secure: true,
				supportFetchAPI: true
			}
		}
	] )
}

export default function registerProtocolListener() {
	console.log( '@@@@ adding a protocol listener' );

	protocol.handle( PROTOCOL_NAME, request => {
		console.log( 'Handling request... ' + request.url );

		if ( request.url.endsWith( '//example-log' ) ) {
			console.log( 'interesting request received' );

			return new Response( `Nice, your text was: ${request.url}`, {
				headers: { 'content-type': 'text/plain' }
			} );
		}

		return new Response( 'Unhandled response', {
			headers: { 'content-type': 'text/plain' }
		} );

	} );

	return () => {
		protocol.unhandle( PROTOCOL_NAME );
	}
}
