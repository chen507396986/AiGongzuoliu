const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Database Logic (Replicated from server/db.js)
const DB_FILE = path.join(app.getPath('userData'), 'database.json');
let db = { workflows: [] };

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading DB:', error);
  }
}

function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Initialize DB on start
loadDB();
console.log('Database loaded from:', DB_FILE);

// IPC Handlers
ipcMain.handle('save-workflow', async (event, name, data) => {
  const id = Date.now();
  const workflow = {
    id,
    name,
    data: JSON.stringify(data),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  db.workflows.push(workflow);
  saveDB();
  return { id, name };
});

ipcMain.handle('update-workflow', async (event, id, name, data) => {
  const index = db.workflows.findIndex(w => w.id == id);
  if (index !== -1) {
    db.workflows[index] = {
      ...db.workflows[index],
      name,
      data: JSON.stringify(data),
      updated_at: new Date().toISOString()
    };
    saveDB();
    return { id, name };
  }
  throw new Error('Workflow not found');
});

ipcMain.handle('get-workflows', async () => {
  return db.workflows.map(({ id, name, created_at, updated_at }) => ({
    id, name, created_at, updated_at
  })).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
});

ipcMain.handle('get-workflow', async (event, id) => {
  const workflow = db.workflows.find(w => w.id == id);
  if (workflow) {
    return {
      ...workflow,
      data: JSON.parse(workflow.data)
    };
  }
  return null;
});


function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // In development, load the local Vite server
  // In production, load the built index.html
  const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
  
  if (isDev) {
    // In dev mode, use the default vite port
    mainWindow.loadURL('http://localhost:5175/');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
