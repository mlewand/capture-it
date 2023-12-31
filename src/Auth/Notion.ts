import { app, BrowserWindow, ipcMain, session } from 'electron';
import type { BrowserWindow as BrowserWindowType } from 'electron';
import { stringify } from 'querystring';
import Store from 'electron-store';

export interface PageInfo {
	id: string;
	object: string;
	icon?: {
		type?: string;
		emoji?: string;
	};
	title: string;
}

const store = new Store();

const clientId = '1e8d4f0b-9ac2-408d-b815-9da5ca359360';
const captureItRedirectLocation = 'https://capture-it.org/';
const redirectUri = `${ captureItRedirectLocation }?oauth`;

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
		// Eventually the filter could be more specific but it will do for now.
		urls: [ captureItRedirectLocation + '*' ]
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

	const requestOptions = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify( body )
	};

	// Using a proxy to avoid exposing NOTION_AUTH_CLIENT_SECRET which would otherwise needed to be shared
	// in client side code.
	const response = await fetch( 'https://capture-it-notion-token.smietniczek.workers.dev/', requestOptions );
	const data = await response.json();

	if ( data.error ) {
		throw new Error( `Error exchanging code for token: ${data.error}` );
	}

	return data.access_token;
}

export async function getPages( token?: string ) : Promise<PageInfo[]> {
	const notionToken = token || store.get( 'notionToken' );

	return Promise.all( [ requestNotionResources( 'database' ), requestNotionResources( 'page' ) ] )
		.then( ( [ databases, pages ] ) => {
			return databases.concat( pages );
		} );

	async function requestNotionResources( resourceType: 'database' | 'page' ) {
		const options = {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${ token }`,
				'Notion-Version': '2022-06-28',
				'content-type': 'application/json'
			},
			body: JSON.stringify( {
				filter: {
					property: 'object',
					value: resourceType
				},
				sort: {
					direction: 'descending',
					timestamp: 'last_edited_time'
				},
				page_size: 20
			} )
		};

		return fetch( 'https://api.notion.com/v1/search', options )
			.then( response => { return response.json(); } )
			.then( data => {
					console.log('data retrieved', data);
					return data.results.map( ( result: any ) => {
						return {
							id: result.id,
							object: result.object,
							icon: result.icon,
							title: simplifyNotionName( result )
						};
					} );
				}
			);
	}

	function simplifyNotionName( notionPage : any ) {
		let titleSource = notionPage.title;

		// page has a different interface :(
		if ( !titleSource ) {
			for ( const entry of Object.entries( notionPage.properties ) ) {
				const value = entry[ 1 ] as any;

				if ( value.type === 'title' ) {
					titleSource = value.title;
					break;
				}
			}

			if ( !titleSource ) {
				return 'none none';
			}

		}

		return titleSource.reduce( ( acc: string, title: any ) => {
			if ( title.type === 'text' ) {
				return acc + title.text.content;
			}

			return acc;
		}, '' ) || 'Missing title';
	}
};
