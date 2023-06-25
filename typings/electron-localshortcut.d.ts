declare module 'electron-localshortcut' {
    function register(win: Electron.BrowserWindow, accelerator: string, callback: () => void): void;
}
