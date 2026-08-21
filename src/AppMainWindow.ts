import { BrowserWindow, Menu } from 'electron';
import * as path from 'path';

type AppMainWindowOptions = { electronOptions?: Electron.BrowserWindowConstructorOptions, rootPath: string };

export default class AppMainWindow extends BrowserWindow {
	_finalClosing: boolean = false;

	constructor( options: AppMainWindowOptions, productionBuild: boolean ) {
		super( Object.assign( {}, {
			width: 820,
			height: 270,
			webPreferences: {
				preload: path.join( options.rootPath, 'src', 'preload.js' ),
				devTools: !productionBuild
			},
		}, options.electronOptions || {} ) );

		if ( productionBuild ) {
			Menu.setApplicationMenu( null );
		}

		this.loadFile( path.join( options.rootPath, '..', 'app', 'index.html' ) );

		this.on( 'close', ( event: any ) => {
			if ( event && !this._finalClosing ) {
				event.preventDefault();
				this.hide();
			}
		} );
	}

	public forceClose() {
		this._finalClosing = true;
		this.emit( 'close', { defaultPrevented: false } );
	}

	/**
	 * Marks the window so that a subsequent native 'close' event (e.g. triggered by Electron
	 * as part of an app-wide quit) is allowed to actually close the window instead of being
	 * intercepted and turned into a hide.
	 */
	public prepareForQuit() {
		this._finalClosing = true;
	}
}