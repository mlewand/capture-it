import { app, Tray, Menu } from 'electron';
import * as path from 'path';
import type AppMainWindow from './AppMainWindow';
import { promises as fs, readFileSync, existsSync } from 'fs';

export function getTray( mainWindow: AppMainWindow, rootPath: string ): Tray {
	let tray = new Tray( path.join( rootPath, 'assets', 'icon.png' ) );
	tray.setToolTip( 'Electron app' );

	// Create context menu for the tray
	const contextMenu = Menu.buildFromTemplate( [
		{
			label: 'Close',
			click: () => {
				if ( mainWindow ) {
					mainWindow.forceClose();
					app.quit();
				}
			}
		}
	] );
	tray.setContextMenu( contextMenu );

	tray.on( 'click', () => {
		if ( mainWindow ) {
			mainWindow.show();
		}
	} );

	return tray;
}

/**
 * Returns a config object or null if config is missing.
 */
export function getConfig( rootPath: string ) : any {
	const configPath = path.join( rootPath, 'config.json' );
	if ( !existsSync(configPath) ) {
		return null;
	}

	return JSON.parse( readFileSync( configPath, 'utf-8' ) );
}
