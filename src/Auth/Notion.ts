import { app, BrowserWindow, ipcMain, session } from 'electron';
import type { BrowserWindow as BrowserWindowType } from 'electron';
import { stringify } from 'querystring';
import Store from 'electron-store';

const store = new Store();

if ( !process.env.NOTION_AUTH_CLIENT_ID ) {
	throw new Error( 'NOTION_AUTH_CLIENT_ID not set - you\'re probably missing .env file.' );
}

const clientId = process.env.NOTION_AUTH_CLIENT_ID;
const clientSecret = process.env.NOTION_AUTH_CLIENT_SECRET;
const redirectUri = process.env.NOTION_AUTH_REDIRECT_URL;

export async function authenticate( parentWindow?: BrowserWindowType ) {
	// Generate the URL for the OAuth2 flow
	const authUrl = `https://api.notion.com/v1/oauth/authorize?` +
		stringify( {
			client_id: clientId,
			redirect_uri: redirectUri,
			response_type: 'code',
			owner: 'user'
		} );

	// Create a new window for the OAuth2 login
	const authWindow = new BrowserWindow( {
		parent: parentWindow,
		modal: true,
		show: false,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true
		}
	} );
	authWindow.loadURL( authUrl );
	authWindow.show();

	const filter = {
		// urls: [ `${redirectUri}*` ]
		// @todo: change!! @todo: change!! @todo: change!! @todo: change!! @todo: change!! @todo: change!! @todo: change!!
		urls: [ `https://capture-it.org/*` ]
	};
	const session = authWindow.webContents.session;
	const responseDetails = await new Promise( ( resolve, reject ) => {
		session.webRequest.onBeforeRequest( filter, ( details, callback ) => {
			resolve( details );
			callback( { cancel: true } );
		} );

		authWindow.once( 'close', () => {
			reject( new Error( 'Authentication window was closed by user' ) );
		} );
	} );
	const url = (responseDetails as any).url;

	console.log( 'details retrieved', responseDetails );


	const urlParts = new URL( url );
	const code = urlParts.searchParams.get( 'code' );
	const error = urlParts.searchParams.get( 'error' );

	console.log('first answer retrieved ' + { code, error });

	if ( error ) {
		throw new Error( `Authentication yielded error ("${ error }"). It's likely user pressed cancel.` );
	}

	authWindow.destroy();
	const token = await exchangeCodeForToken( String( code ) );

	console.log( 'token received', token );
	store.set( 'notionToken', token );

	return token;
};

export async function exchangeCodeForToken( code : string ) {
	const body = {
		grant_type: "authorization_code",
		code,
		redirect_uri: redirectUri
	};

	const clientIdAndSecretEncoded = Buffer.from( `${clientId}:${clientSecret}` ).toString( 'base64' );

	console.log('sending POST', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Basic "${ clientIdAndSecretEncoded }"`
		},
		body: JSON.stringify( body )
	} );

	const response = await fetch( 'https://api.notion.com/v1/oauth/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Basic "${ clientIdAndSecretEncoded }"`
		},
		body: JSON.stringify( body )
	} );

	const data = await response.json();

	if ( data.error ) {
		throw new Error( `Error exchanging code for token: ${data.error}` );
	}

	return data.access_token;
}

ipcMain.handle( 'get-pages', async () => {
	const notionToken = store.get( 'notionToken' );
	const response = await fetch( 'https://www.notion.so/api/v3/loadUserContent', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${notionToken}`
		},
		body: JSON.stringify( {} )
	} );
	const data = await response.json();
	const pages = Object.values( data.recordMap.block )
		.filter( (block: any) => block.value.type === 'page' )
		.map( (block: any) => ( { id: block.id, title: block.value.properties.title } ) );

	return pages;
} );
