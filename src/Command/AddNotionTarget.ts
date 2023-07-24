import type { CommandConstructorOptions } from './Command';
import type CaptureIt from '../CaptureIt';
import Command from './Command';
import { authenticate, getPages } from '../Auth/Notion';
import type { PageInfo } from '../Auth/Notion';
import { NotionTarget } from '../Target';
import type { WorkspaceInfo } from '../Config';

import { BrowserWindow } from 'electron';
import path from 'path';

type PageInfoExtended = PageInfo & {
	knownWorkspace?: string,
	idPropertyName: 'dataBaseId' | 'pageId'
};

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
			openNewWindow( this.app, 'add-notion-target.html', { synchronous: '1' } );
		} else if ( name && targetInfo?.notionToken && ( targetInfo?.pageId || targetInfo?.dataBaseId ) ) {
			// All the necessary info is given, we can add it.
			const newWorkspace: WorkspaceInfo = {
				name: name,
				notionToken: targetInfo.notionToken,
				pageId: targetInfo.pageId || '', // @todo - the property can be simply skipped if not present.
				dataBaseId: targetInfo.dataBaseId || ''
			};

			console.log( 'adding a workspace :TADA:' );
			this.app.config!.addWorkspace( newWorkspace );
		} else {
			let confirmWnd: BrowserWindow | null = null;
			try {
				const token = await authenticate( this.app.mainWindow );

				const target: NotionTarget = {
					name: name,
					notionToken: token
				};

				confirmWnd = await openNewWindow( this.app, 'add-notion-target.html' );

				const onConfirmWindowLoaded = new Promise( ( resolve, reject ) => {
					confirmWnd!.webContents.on( 'did-finish-load', resolve );
					confirmWnd!.on( 'closed', reject );
				} );

				const pages = await getPages( token ) as PageInfoExtended[];
				let selectedEntity = null;

				this._decoratePagesInfo( pages );
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

					onConfirmWindowLoaded.then( () => {
						confirmWnd!.webContents.send( 'confirmationState', { name, notionToken: token, pages } );
					} );
				}
			} catch ( e ) {
				if ( confirmWnd ) {
					confirmWnd.destroy();
				}

				const fallbackWindow = await openNewWindow( this.app, 'add-notion-target.html', {
					// Provide only name without token / pages so that it always fallbacks to the first step.
					state: JSON.stringify( { name } )
				} );

				fallbackWindow.webContents.on( 'did-finish-load', () => {
					fallbackWindow.webContents.send( 'alert', String( e ) );
				} );
			}
		}
	}

	// Adds information such as the name of matched workspace (if any) or the name of id property.
	_decoratePagesInfo( pages: PageInfoExtended[] ) {
		const knownPageIds = new Map();
		for (const workspace of this.app.config!.workspaces ) {
			if ( workspace.pageId ) {
				knownPageIds.set( unifyNotionPageId( workspace.pageId ), workspace.name );
			}

			if ( workspace.dataBaseId ) {
				knownPageIds.set( unifyNotionPageId( workspace.dataBaseId ), workspace.name );
			}
		}

		for ( const page of pages ) {
			const unifiedPageId = unifyNotionPageId( page.id );

			if ( knownPageIds.has( unifiedPageId ) ) {
				page.knownWorkspace = knownPageIds.get( unifiedPageId );
			}

			page.idPropertyName = page.object == 'database' ? 'dataBaseId' : 'pageId';
		}
	}
}

export function unifyNotionPageId( id : string ) {
	// Notion page ID may but doesn't have to include dashes.
	return id.replace( /-/g, '' ).toLowerCase();
}

async function openNewWindow( app: CaptureIt, htmlFileName: string, query?: { [ key: string ]: string } ) {
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

	authWindow.loadFile( path.join( app.rootPath, 'app', htmlFileName ), {
		query: query || undefined
	} );

	authWindow.show();

	authWindow.once( 'close', () => {
		authWindow.destroy();
	} );

	return authWindow;
}