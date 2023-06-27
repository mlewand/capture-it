import { app, globalShortcut, ipcMain, Tray, BrowserWindow } from 'electron';
import * as path from 'path';
import * as electronLocalShortcut from 'electron-localshortcut';
import AppMainWindow from './AppMainWindow';
import { getTray } from './helpers';
import { promises as fs } from 'fs';

const ROOT_DIRECTORY = path.join( __dirname, '..', '..' );

let mainWindow: AppMainWindow | null;
let tray: Tray | null;

function createWindow() {
  mainWindow = new AppMainWindow( { rootPath: ROOT_DIRECTORY } );

  mainWindow.loadFile( path.join( ROOT_DIRECTORY, 'app', 'index.html' ) );

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Add a hotkey for closing the window.
  electronLocalShortcut.register(mainWindow, 'Ctrl+Q', () => {
    if (mainWindow) {
      mainWindow.forceClose();
      app.quit();
    }
  });

  electronLocalShortcut.register( mainWindow, 'Esc', () => {
    if ( mainWindow && mainWindow.isFocused() ) {
      mainWindow.hide();
    }
  } );
}

app.on('ready', () => {
  createWindow();

  // Create system tray
  tray = getTray( mainWindow!, ROOT_DIRECTORY );

  // Create global shortcut
  const ret = globalShortcut.register('CommandOrControl+Shift+M', () => {
    if (mainWindow) {
      if ( !mainWindow.isFocused() || !mainWindow.isVisible() ) {
        mainWindow.show();
      } else {
        mainWindow.hide();
      }
    }
  });

  if (!ret) {
    console.log('Global shortcut registration failed');
  }
});

app.on('will-quit', () => {
  // Unregister the shortcut.
  globalShortcut.unregister('CommandOrControl+Shift+M');

  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.handle('getConfig', async () => {
  return await fs.readFile( path.join( ROOT_DIRECTORY, 'config.json' ), 'utf-8' );
});