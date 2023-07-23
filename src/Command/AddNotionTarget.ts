import type { CommandConstructorOptions } from './Command';
import type CaptureIt from '../CaptureIt';
import Command from './Command';
import { authenticate, getPages } from '../Auth/Notion';
import type { PageInfo } from '../Auth/Notion';
import { NotionTarget } from '../Target';

import { BrowserWindow } from 'electron';
import path from 'path';

type PageInfoExtended = PageInfo & { knownWorkspace?: string };

export default class AddNotionTargetCommand extends Command {
	constructor( options: CommandConstructorOptions ) {

		options.name = 'addNotionTarget';

		super( options );
	}

	// todo, should take an object with potential id
	public async execute( targetInfo? : NotionTarget ): Promise<any> {
		const name = targetInfo?.name || null;
		console.log( `Command AddNotionTarget executed with targetName: ${name}` );
		if ( !name ) {
			openNewWindow( this.app, 'new-notion-target.html' );
		} else {
			try {
				const token = await authenticate( this.app.mainWindow );

				const target: NotionTarget = {
					name: name,
					notionToken: token
				};

				const pages = await getPages( token ) as PageInfoExtended[];
				let selectedEntity = null;

				this._markKnownPages( pages );
				const unknownPages = pages.filter( page => !page.knownWorkspace );

				if ( unknownPages.length === 1 ) {
					console.log('---- got one page');
					selectedEntity = unknownPages[ 0 ];
				} else if ( unknownPages.length === 0 ) {
					console.log('---- got no page');
					throw new Error( 'No pages or databases were shared with the integration. You need to select at least one item when granting permissions.' )
				} else {
					console.log('---- got multiple pages');
					// Multiple pages were selected.
					const confirmWnd = await openNewWindow( this.app, 'confirm-notion-target.html' );

					confirmWnd.webContents.on( 'did-finish-load', () => {
						confirmWnd.webContents.send( 'confirmationState', { name, token, pages } );
					} );

					// selectedEntity = 'foo?'; // todo
					selectedEntity = unknownPages[ 0 ]; // mock
				}

				target[ selectedEntity.object == 'database' ? 'dataBaseId' : 'pageId' ] = selectedEntity.id;

				// Add it to the config.
				// Save the config.
			} catch ( e ) {
				alert( e );
				// @todo: set the input for a target name to targetName.
				openNewWindow( this.app, 'new-notion-target.html' );
			}
		}
	}

	_markKnownPages( pages: PageInfoExtended[] ) {
		const knownPageIds = new Map();
		for (const workspace of this.app.config!.workspaces ) {
			if ( workspace.pageId ) {
				knownPageIds.set( workspace.pageId, workspace.name );
			}

			if ( workspace.dataBaseId ) {
				knownPageIds.set( workspace.dataBaseId, workspace.name );
			}
		}

		for ( const page of pages ) {
				const unifiedPageId = this._unifyNotionPageId( page.id );

				if ( knownPageIds.has( unifiedPageId ) ) {
					page.knownWorkspace = knownPageIds.get( unifiedPageId );
				}
		}
	}

	_unifyNotionPageId( id: string ) {
		// Notion page ID may but doesn't have to include dashes.
		return id.replace( /-/g, '' );
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