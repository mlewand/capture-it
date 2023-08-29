import { Tray, Menu, MenuItem, nativeImage, NativeImage, shell  } from 'electron';
import * as path from 'path';
import { homedir } from 'os';
import { promises as fs, readFileSync, existsSync } from 'fs';
import type CaptureIt from './CaptureIt';
import { parse as JSONParse } from 'comment-json';
import getDefaultMenu from 'electron-default-menu';

export function menuCustomizations( app: CaptureIt ) {
	if ( process.platform !== 'darwin' ) {
		// This magic is only needed for macOS, see https://github.com/mlewand/capture-it/issues/31 and
		// https://github.com/mlewand/capture-it/issues/37.
		return;
	}

	const defaultTemplate = getDefaultMenu( app.electronApp!, shell );
	// No need for view menu, there's the inspector, refresh command, etc.
	const output = defaultTemplate.filter( item => item.label != 'View' );

	const mainSubmenuTemplate = getCommonMenuTemplate( app );
	const quitOption = mainSubmenuTemplate.find( item => item.label === 'Quit' ) as any | null;

	if ( quitOption ) {
		quitOption.accelerator = 'CmdOrCtrl+Q';
	}

	output[ 0 ].submenu = mainSubmenuTemplate;

	Menu.setApplicationMenu( Menu.buildFromTemplate( output ) );
}

export function getTray( app: CaptureIt, rootPath: string ): Tray {
	let image: string | NativeImage = path.join( rootPath, 'assets', 'icon.png' );

	if ( process.platform === 'darwin' ) {
		const nativeImg = nativeImage.createFromPath( path.join( rootPath, 'assets', 'macTrayIconTemplate.png' ) );
		nativeImg.setTemplateImage( true );
		image = nativeImg;
	}

	const tray = new Tray( image );

	tray.setToolTip( 'Capture It' );

	// Create context menu for the tray
	const contextMenu = Menu.buildFromTemplate( getCommonMenuTemplate( app ) );
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

	return JSONParse( readFileSync( configPath, 'utf-8' ) );
}

export function getConfigPath( rootPath: string ) : string {
	return path.join( homedir(), '.capture-it-config.json' );
}

function getCommonMenuTemplate( app: CaptureIt ) {
	return [
		{
			label: 'Add Notion workspace',
			click: () => app.commands.execute( 'addNotionWorkspace' )
		},
		{
			label: 'Configuration',
			click: () => app.commands.execute( 'openConfig' )
		},
		{
			label: 'Quit',
			click: () => app.commands.execute( 'quit' )
		}
	];
}