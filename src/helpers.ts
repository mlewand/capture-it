import { Tray, Menu } from 'electron';
import * as path from 'path';
import { promises as fs, readFileSync, existsSync } from 'fs';
import type NoteQuickAdd from './NoteQuickAdd';

export function getTray( app: NoteQuickAdd, rootPath: string ): Tray {
	let tray = new Tray( path.join( rootPath, 'assets', 'icon.png' ) );
	tray.setToolTip( 'Electron app' );

	// Create context menu for the tray
	const contextMenu = Menu.buildFromTemplate( [
		{
			label: 'Configuration',
			click: () => app.commands.execute( 'openConfig' )
		},
		{
			label: 'Close',
			click: () => app.commands.execute( 'quit' )
		}
	] );
	tray.setContextMenu( contextMenu );

	tray.on( 'click', () => {
		if ( app.mainWindow ) {
			app.mainWindow.show();
		}
	} );

	return tray;
}

/**
 * Returns a config object or null if config is missing.
 */
export function getConfig( rootPath: string ) : any {
	const configPath = getConfigPath( rootPath );
	if ( !existsSync(configPath) ) {
		return null;
	}

	return JSON.parse( readFileSync( configPath, 'utf-8' ) );
}

export function getConfigPath( rootPath: string ) : string {
	return path.join( rootPath, 'config.json' );
}
