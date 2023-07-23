import type { CommandConstructorOptions } from './Command';
import type CaptureIt from '../CaptureIt';
import Command from './Command';
import { authenticate, getPages } from '../Auth/Notion';
import { NotionTarget } from '../Target';

import { BrowserWindow } from 'electron';
import path from 'path';

export default class AddNotionTargetCommand extends Command {
	constructor( options: CommandConstructorOptions ) {

		options.name = 'addNotionTarget';

		super( options );
	}

	public async execute( targetName?: string ): Promise<any> {
		console.log( `Command AddNotionTarget executed with targetName: ${targetName}` );
		if ( !targetName ) {
			openNewWindow( this.app, 'new-notion-target.html' );
		} else {
			try {
				const token = await authenticate( this.app.mainWindow );

				const target: NotionTarget = {
					name: targetName,
					notionToken: token
				};

				const pages = await getPages( token );
				let selectedEntity = null;

				if ( pages.length === 1 ) {
					console.log('---- got one page');
					selectedEntity = pages[ 0 ];
				} else if ( pages.length === 0 ) {
					console.log('---- got no page');
					throw new Error( 'No pages or databases were shared with the integration. You need to select at least one item when granting permissions.' )
				} else {
					console.log('---- got multiple pages');
					// Multiple pages were selected.
					const confirmWnd = await openNewWindow( this.app, 'confirm-notion-target.html' );

					confirmWnd.webContents.on( 'did-finish-load', () => {
						confirmWnd.webContents.send( 'confirmationState', { targetName, token, pages } );
					} );

					// selectedEntity = 'foo?'; // todo
					selectedEntity = pages[ 0 ]; // mock
				}

				target[ selectedEntity.object == 'database' ? 'dataBaseId' : 'pageId' ] = selectedEntity.id;

				// target.dataBaseId = '1';
			} catch ( e ) {
				alert( e );
				// @todo: set the input for a target name to targetName.
				openNewWindow( this.app, 'new-notion-target.html' );
			}
		}
	}
}

async function openNewWindow( app: CaptureIt, htmlFileName: string ) {
	// Create a new window for the OAuth2 login
	const authWindow = new BrowserWindow( {
		modal: true,
		show: false,
		webPreferences: {
			preload: path.join( app.rootPath, 'src', 'preload.js' ),
			nodeIntegration: false,
			contextIsolation: true
		}
	} );
	authWindow.loadFile( path.join( app.rootPath, 'app', htmlFileName ) );
	authWindow.show();

	authWindow.once( 'close', () => {
		authWindow.destroy();
	} );

	return authWindow;
}