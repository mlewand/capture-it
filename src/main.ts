import { app, BrowserWindow, globalShortcut, Tray } from 'electron';
import * as path from 'path';
import * as url from 'url';

let mainWindow: Electron.BrowserWindow | null;
let tray: Tray | null;

function createWindow() {
  mainWindow = new BrowserWindow({
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

  mainWindow.on('close', (event) => {
    if (mainWindow) {
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
