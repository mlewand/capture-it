import { app as electronApp, globalShortcut, ipcMain } from 'electron';
import * as path from 'path';
import AppMainWindow from './AppMainWindow';
import { getTray } from './helpers';
import QuitCommand from './Command/Quit';
import HideCommand from './Command/Hide';
import OpenConfigCommand from './Command/OpenConfig';
import OpenNotionPageCommand from './Command/OpenNotionPage';
import OpenBrowserCommand from './Command/OpenBrowser';
import SetWorkspaceCommand from './Command/SetWorkspace';
import CommandSet from './Command/CommandSet';
import Config from './Config';
import type { WorkspaceInfo } from './Config';

export type SetActiveWorkspaceParameter = number | 'next' | 'previous';

/**
 * The top-level API of the application.
 *
 * Holds a reference to app, commands, Electron windows.
 *
 * In future should also be entry point for model operations.
 */
export default class NoteQuickAdd {

	mainWindow?: AppMainWindow;

	rootPath: string;

	config?: Config;

	electronApp?: Electron.App;

	commands: CommandSet;

	activeWorkspace?: WorkspaceInfo;

	constructor( rootPath: string ) {
		this.rootPath = rootPath;
		this.commands = new CommandSet();
	}

	async start() {
		const configWrapper = async () => {
			try {
				return await Config.loadFromUserDirectory();
			} catch ( e ) {
				console.error( e );
				return undefined;
			}
		}

		console.log('App.start');


		ipcMain.handle( 'getConfig', async () => {
			return this.config || null;
		} );

		this.addPromisedIpcListener( 'experiment', async ( event: any, ...args: Array<any> ) => {
			return { status: 'good', args };
		} );

		await Promise.all( [
				configWrapper(),
				this._createElectronApp()
			] )
			.then( async (results) => {
				this.config = results[ 0 ];
				this.electronApp = results[ 1 ];

				this.mainWindow = await this._createMainWindow();

				this._initCommands();
				this._electronAppReady();

				console.log('wrapping app ready');

				this.send( 'configChanged', this.config );
				this.setActiveWorkspace( 0 );
			} );
	}

	public setActiveWorkspace( index: SetActiveWorkspaceParameter ) {
		const workspaces = this.config!.workspaces;
		const currentIndex = workspaces.indexOf( this.activeWorkspace! );

		if ( index === 'next' || index === 'previous' ) {
			index = currentIndex + ( index === 'next' ? 1 : -1 );
			if ( index >= workspaces.length ) {
				index = 0;
			} else if ( index < 0 ) {
				index = workspaces.length - 1;
			}
		}

		if ( currentIndex == index ) {
			return;
		}

		this.activeWorkspace = workspaces[ index ];

		this.send( 'activeWorkspaceChanged', this.activeWorkspace );
		this.send( 'activeWorkspaceIndexChanged', index );
	}

	/**
	 * Sends a message to renderer.
	 *
	 * @param channel
	 * @param args
	 */
	public send( channel : string, ...args : any[] ) {
		if ( this.mainWindow ) {
			this.mainWindow.webContents.send( channel, ...args );
		}
	}

	public addPromisedIpcListener( channel : string, listener : any ) {
		ipcMain.on( `promised/call/${ channel }`, ( event: any, ...args ) => {
			console.log( `MAIN: got promise request (${channel} channel)` );

			const ret = listener( event, ...args );

			if ( !ret.then ) {
				throw new Error( 'Promised IPC listener must return a promise' );
			}

			ret
				.then( ( result : any ) => {
					this.send( `promised/then/${ channel }`, result );
				} )
				.catch( ( error : any ) => {
					this.send( `promised/catch/${ channel }`, error );
				} );
		} );
	}

	/**
	 * Immediately closes the app.
	 */
	public quit() : void {
		if (this.mainWindow) {
			this.mainWindow.forceClose();
			this.electronApp!.quit();
		}
	}

	/**
	 * Hides any visible windows.
	 */
	public hide() : void {
		const { mainWindow } = this;

		if ( mainWindow && mainWindow.isFocused() ) {
			mainWindow.hide();
		}
	}

	private async _createMainWindow() : Promise<AppMainWindow> {
		const mainWindow = new AppMainWindow( { rootPath: this.rootPath } );

		mainWindow.loadFile( path.join( this.rootPath, 'app', 'index.html' ) );

		mainWindow.on('closed', () => {
			this.mainWindow = undefined;
		});

		return new Promise( ( resolve, reject ) => {
			mainWindow.webContents.once( 'dom-ready', () => {
				resolve( mainWindow );
			} );
		} );
	}

	private _createElectronApp() : Promise<Electron.App> {
		return new Promise( ( resolve, reject ) => {
			electronApp.on( 'ready', () => {
				resolve( electronApp );
			} );

			electronApp.on( 'window-all-closed', () => {
				if ( process.platform !== 'darwin' ) {
					electronApp.quit();
				}
			} );

			electronApp.on( 'activate', async () => {
				if ( this.mainWindow === undefined ) {
					this.mainWindow = await this._createMainWindow();
				}
			} );
		} );
	}

	private _initCommands() : void {
		this.commands.add( new QuitCommand( { app: this } ) );
		this.commands.add( new HideCommand( { app: this } ) );
		this.commands.add( new OpenNotionPageCommand( { app: this } ) );
		this.commands.add( new OpenConfigCommand( { app: this } ) );
		this.commands.add( new OpenBrowserCommand( { app: this } ) );
		this.commands.add( new SetWorkspaceCommand( { app: this } ) );

		ipcMain.handle( 'executeCommand', async ( event, commandName: string, ...args: Array<any> ) =>{
			return this.commands.execute( commandName, ...args )
		} );
	}

	private _electronAppReady() : void {
		const { mainWindow } = this;

		if ( mainWindow ) {
			this._addTrayItem();
			this._registerHotkeys( mainWindow );
		}

	}

	_addTrayItem() : void {
		getTray( this, this.rootPath );
	}

	private _registerHotkeys( mainWindow: AppMainWindow ) {
		// Global hotkeys.
		const INVOCATION_HOT_KEY = ( this.config && this.config.invocationHotKey ) || 'CommandOrControl+Shift+M';

		const ret = globalShortcut.register( INVOCATION_HOT_KEY, () => {
			if ( mainWindow ) {
				if ( !mainWindow.isFocused() || !mainWindow.isVisible() ) {
					mainWindow.show();
					this.send( 'globalHotkeyFocus' );
				} else {
					mainWindow.hide();
				}
			}
		} );

		if ( ret ) {
			electronApp.on( 'will-quit', () => {
				// Unregister the shortcut.
				globalShortcut.unregister( INVOCATION_HOT_KEY );

				// Unregister all shortcuts.
				globalShortcut.unregisterAll();
			} );
		} else {
			console.log( 'Global shortcut registration failed' );
		}
	}
}