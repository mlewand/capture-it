import { app as electronApp, globalShortcut, ipcMain, Tray, BrowserWindow } from 'electron';
import * as path from 'path';
import * as electronLocalShortcut from 'electron-localshortcut';
import AppMainWindow from './AppMainWindow';
import { getTray, getConfig } from './helpers';
import { promises as fs, readFileSync, existsSync } from 'fs';
import type ConfigInterface from './ConfigInterface';

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

	constructor( rootPath: string ) {
		this.rootPath = rootPath;
	}

	async start() {
		this.config = await getConfig( this.rootPath );

		this.electronApp = await this._createElectronApp();

		ipcMain.handle( 'getConfig', async () => {
			return this.config;
		} );
	}

	private _createMainWindow() : AppMainWindow {
		const mainWindow = new AppMainWindow( { rootPath: this.rootPath } );

		mainWindow.loadFile( path.join( this.rootPath, 'app', 'index.html' ) );

		mainWindow.on('closed', () => {
			this.mainWindow = undefined;
		});

		// Add a hotkey for closing the window.
		electronLocalShortcut.register(mainWindow, 'Ctrl+Q', () => {
			if (mainWindow) {
				mainWindow.forceClose();
				electronApp.quit();
			}
		});

		electronLocalShortcut.register( mainWindow, 'Esc', () => {
			if ( mainWindow && mainWindow.isFocused() ) {
				mainWindow.hide();
			}
		} );

		return mainWindow;
	}

	private _createElectronApp() : Promise<Electron.App> {
		return new Promise( ( resolve, reject ) => {
			electronApp.on( 'ready', () => {
				this.mainWindow = this._createMainWindow();
				this._electronAppReady();
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

	private _electronAppReady() : void {
		const { mainWindow } = this;

		if ( mainWindow ) {
			this._addTrayItem( mainWindow );
			this._registerHotkeys( mainWindow );
		}

	}

	_addTrayItem( mainWindow: AppMainWindow ) : void {
		getTray( mainWindow, this.rootPath );
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