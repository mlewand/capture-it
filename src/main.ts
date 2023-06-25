import { app, globalShortcut, Tray } from 'electron';
import * as path from 'path';
import * as electronLocalShortcut from 'electron-localshortcut';
import AppMainWindow from './AppMainWindow';
import { getTray } from './helpers';

let mainWindow: AppMainWindow | null;
let tray: Tray | null;

function createWindow() {
  mainWindow = new AppMainWindow();

  mainWindow.loadFile(path.join(__dirname, '../app/index.html'));

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
}

app.on('ready', () => {
  createWindow();

  // Create system tray
  tray = getTray(mainWindow!);

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
