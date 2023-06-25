import { app, BrowserWindow, globalShortcut, Tray, Menu } from 'electron';
import * as path from 'path';
import { CLIENT_RENEG_WINDOW } from 'tls';

class AppMainWindow extends BrowserWindow {
  _finalClosing: boolean = false;

  public forceClose() {
    this._finalClosing = true;
    this.emit('close', { defaultPrevented: false } );
  }
}

let mainWindow: AppMainWindow | null;
let tray: Tray | null;

function createWindow() {
  mainWindow = new AppMainWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../app/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('close', ( event : any ) => {
    if ( event && mainWindow && !mainWindow._finalClosing ) {

      event.preventDefault();
      mainWindow.hide();
    }
  });
}

app.on('ready', () => {
  createWindow();

  // Create system tray
  tray = new Tray(path.join(__dirname, '..', 'assets', 'icon.png'));
  tray.setToolTip('Electron app');

  // Create context menu for the tray
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Close',
      click: () => {
        if (mainWindow) {
          mainWindow.forceClose();
          app.quit();
        }
      }
    }
  ]);
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  // Create global shortcut
  const ret = globalShortcut.register('CommandOrControl+Shift+M', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized() || !mainWindow.isVisible()) {
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
