import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import http from 'http';
import { fork, ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

const PORT = 5000;
const SERVER_URL = `http://localhost:${PORT}`;

// Check if port is already listening
function checkServerRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`${SERVER_URL}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Start embedded local backend server if needed
async function ensureServerRunning() {
  const isRunning = await checkServerRunning();
  if (isRunning) {
    console.log('✓ POS backend server is already running.');
    return;
  }

  console.log('⚡ Launching embedded POS backend server...');
  const serverScript = path.resolve(__dirname, '../../server/dist/server.js');

  serverProcess = fork(serverScript, [], {
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: 'production',
    },
    stdio: 'ignore',
  });

  // Wait for server to become healthy
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const ready = await checkServerRunning();
    if (ready) {
      console.log('✓ Embedded server is up and healthy.');
      return;
    }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'DEEP E-BIKE & TOY - Retail POS Management System',
    backgroundColor: '#0F172A',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  });

  mainWindow.loadURL(SERVER_URL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers for Thermal & A4 Printing
ipcMain.handle('get-printers', async () => {
  if (!mainWindow) return [];
  return await mainWindow.webContents.getPrintersAsync();
});

ipcMain.handle('print-thermal', async (_event, htmlContent: string) => {
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: false },
  });

  await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

  return new Promise((resolve) => {
    printWindow.webContents.print(
      {
        silent: false, // Prompts standard or thermal printer dialog
        printBackground: true,
        pageSize: { width: 80000, height: 297000 }, // 80mm roll width
      },
      (success, failureReason) => {
        printWindow.close();
        resolve({ success, failureReason });
      }
    );
  });
});

ipcMain.handle('get-machine-id', () => {
  return `POS-WIN-${process.env.COMPUTERNAME || 'LOCAL'}`;
});

app.whenReady().then(async () => {
  await ensureServerRunning();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
