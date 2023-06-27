import { app, Tray, Menu } from 'electron';
import * as path from 'path';
import type AppMainWindow from './AppMainWindow';

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
