const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
let djangoProcess = null;


function createWindow() {
    console.log('ELECTRON_DEV:', process.env.ELECTRON_DEV); // <-- Depuración

    // Inicia el backend Django como proceso hijo
    if (!djangoProcess) {
        const isDev = process.env.ELECTRON_DEV === 'true';
        const backendPath = path.join(__dirname, '../');
        if (isDev) {
            // Desarrollo: usa Python normal
            const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
            djangoProcess = spawn(pythonCmd, ['manage.py', 'runserver', '127.0.0.1:8000'], {
                cwd: backendPath,
                shell: true,
                detached: false
            });
        } else {
            // Producción: ejecuta el backend empaquetado (minimarket-backend.exe)
            const backendExe = process.platform === 'win32'
                ? path.join(backendPath, 'dist', 'minimarket-backend.exe')
                : path.join(backendPath, 'dist', 'minimarket-backend');
            djangoProcess = spawn(backendExe, [], {
                cwd: backendPath,
                shell: true,
                detached: false
            });
        }
        djangoProcess.stdout.on('data', (data) => {
            console.log(`[Django] ${data}`);
        });
        djangoProcess.stderr.on('data', (data) => {
            console.error(`[Django ERROR] ${data}`);
        });
        djangoProcess.on('close', (code) => {
            console.log(`[Django] proceso terminado con código ${code}`);
        });
    }

    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    const isDev = process.env.ELECTRON_DEV === 'true';

    if (isDev) {
        // Carga React en modo desarrollo
        console.log('Electron está en modo desarrollo: cargando la app desde http://localhost:3000');
        win.loadURL('http://localhost:3000').catch(err => {
            console.error('No se pudo cargar http://localhost:3000. ¿Ejecutaste npm start en la carpeta app?');
            console.error(err);
            win.loadURL('data:text/html,<h2 style=\"color:red;font-family:sans-serif;\">No se pudo conectar a http://localhost:3000.<br>¿Ejecutaste <code>npm start</code> en la carpeta <code>app</code>?</h2>');
        });
        win.webContents.openDevTools();
    } else {
        console.log('Electron está en modo producción: cargando la app desde build');
        win.loadFile(path.join(__dirname, '../../app/build/index.html'));
    }
}


app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});


app.on('window-all-closed', () => {
    if (djangoProcess) {
        djangoProcess.kill();
        djangoProcess = null;
    }
    if (process.platform !== 'darwin') app.quit();
});