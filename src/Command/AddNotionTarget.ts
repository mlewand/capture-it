import type { CommandConstructorOptions } from './Command';
import type CaptureIt from '../CaptureIt';
import Command from './Command';
import { authenticate } from '../Auth/Notion';
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
			openNewWindow( this.app );
		} else {
			try {
				const token = await authenticate( this.app.mainWindow );

				const target: NotionTarget = {
					name: targetName,
					notionToken: token
				};

				target.dataBaseId = '1';
			} catch ( e ) {
				alert( e );
				// @todo: set the input for a target name to targetName.
				openNewWindow( this.app );
			}
		}
	}
}

async function openNewWindow( app: CaptureIt ) {
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
	authWindow.loadFile( path.join( app.rootPath, 'app', 'new-notion-target.html' ) );
	authWindow.show();

	authWindow.once( 'close', () => {
		authWindow.destroy();
	} );
}