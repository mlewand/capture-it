import { app as electronApp, globalShortcut, ipcMain } from 'electron';
import * as path from 'path';
import AppMainWindow from './AppMainWindow';
import { getTray, getConfig } from './helpers';
import type ConfigInterface from './ConfigInterface';
import QuitCommand from './Command/Quit';
import HideCommand from './Command/Hide';
import OpenConfigCommand from './Command/OpenConfig';
import CommandSet from './Command/CommandSet';

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

	config?: ConfigInterface;

	electronApp?: Electron.App;

	commands: CommandSet;

	constructor( rootPath: string ) {
		this.rootPath = rootPath;
		this.commands = new CommandSet();
	}

	async start() {
		await Promise.all( [
				getConfig( this.rootPath ),
				this._createElectronApp()
			] )
			.then( results => {
				this.config = results[ 0 ];
				this.electronApp = results[ 1 ];

				this.mainWindow = this._createMainWindow();
				this._initCommands();
				this._electronAppReady();

				ipcMain.handle( 'getConfig', async () => {
					return this.config;
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

	private _createMainWindow() : AppMainWindow {
		const mainWindow = new AppMainWindow( { rootPath: this.rootPath } );

		mainWindow.loadFile( path.join( this.rootPath, 'app', 'index.html' ) );

		mainWindow.on('closed', () => {
			this.mainWindow = undefined;
		});

		return mainWindow;
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

			electronApp.on( 'activate', () => {
				if ( this.mainWindow === undefined ) {
					this.mainWindow = this._createMainWindow();
				}
			} );
		} );
	}

	private _initCommands() : void {
		this.commands.add( new QuitCommand( { app: this } ) );
		this.commands.add( new HideCommand( { app: this } ) );
		this.commands.add( new OpenConfigCommand( { app: this } ) );

		ipcMain.handle( 'executeCommand', async ( event, commandName ) => this.commands.execute( commandName ) );
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