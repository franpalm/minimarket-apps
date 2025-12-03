const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

function logError(message) {
  const fs = require('fs');
  // Always log to the same directory as electron.js for portability
  const logPath = path.resolve(__dirname, 'electron-error.log');
  fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
}

function createWindow() {
  // Use absolute paths for icon and build/index.html for win-unpacked compatibility
  const iconPath = path.resolve(__dirname, 'icon.ico');
  logError(`Icon path resolved: ${iconPath}`);
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: iconPath
  });

  try {
    if (isDev) {
      win.loadURL('http://localhost:3000');
      win.webContents.openDevTools();
      logError('Modo desarrollo: Cargando http://localhost:3000');
    } else {
      const fs = require('fs');
      // Try both possible build paths for win-unpacked and dev
      const buildPath1 = path.resolve(__dirname, '../build/index.html');
      const buildPath2 = path.resolve(__dirname, 'build/index.html');
      logError(`Modo producción: Buscando ${buildPath1} y ${buildPath2}`);
      let buildPath = null;
      if (fs.existsSync(buildPath1)) {
        buildPath = buildPath1;
      } else if (fs.existsSync(buildPath2)) {
        buildPath = buildPath2;
      }
      if (buildPath) {
        win.loadFile(buildPath);
        logError(`index.html encontrado y cargado correctamente en: ${buildPath}`);
      } else {
        const { dialog } = require('electron');
        const errorMsg = `No se encontró el archivo build/index.html en ${buildPath1} ni en ${buildPath2}. Ejecuta "npm run build" antes de empaquetar.`;
        dialog.showErrorBox('Error', errorMsg);
        logError(errorMsg);
        app.quit();
      }
    }
  } catch (err) {
    const { dialog } = require('electron');
    dialog.showErrorBox('Error crítico', err.message);
    logError(`Error crítico: ${err.stack}`);
    app.quit();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});