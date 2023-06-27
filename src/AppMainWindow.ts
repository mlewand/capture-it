import { BrowserWindow } from 'electron';
import * as path from 'path';

type AppMainWindowOptions = { electronOptions?: Electron.BrowserWindowConstructorOptions, rootPath: string };

export default class AppMainWindow extends BrowserWindow {
	_finalClosing: boolean = false;

	constructor( options: AppMainWindowOptions ) {
		super( Object.assign( {}, {
			width: 800,
			height: 200,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false, // @todo review if I'm ok with it. It's needed by the electron-localshortcut lib.
			},
		}, options.electronOptions || {} ) );

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
}