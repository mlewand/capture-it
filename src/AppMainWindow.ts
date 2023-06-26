import { BrowserWindow } from 'electron';
import * as path from 'path';

export default class AppMainWindow extends BrowserWindow {
	_finalClosing: boolean = false;

	constructor( options?: Electron.BrowserWindowConstructorOptions ) {
		super( Object.assign( {}, {
			width: 800,
			height: 240,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false, // @todo review if I'm ok with it. It's neeeded by the electron-localshortcut lib.
			},
		}, options ) );

		this.loadFile( path.join( __dirname, '../app/index.html' ) );

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