const { app, BrowserWindow, screen, Tray, Menu, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

let mainWindow;
let tray;
let followInterval;

// Default Settings
const defaults = {
  isEnabled: true,
  goalIcon: '🎯',
  goalText: 'FOCUS',
  thanksCount: 0,
  sorryCount: 0,
  thanksShortcut: 'Alt+T',
  sorryShortcut: 'Alt+S',
  offsetX: 20,
  offsetY: 20
};

// Initialize store with defaults if empty
if (!store.has('isEnabled')) {
  store.set(defaults);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 300,
    height: 100,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.setIgnoreMouseEvents(true);
  mainWindow.loadFile('index.html');

  // Keep on top of everything, including full-screen apps on macOS
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setAlwaysOnTop(true, 'screen-saver');

  startFollowingCursor();
}

function startFollowingCursor() {
  if (followInterval) clearInterval(followInterval);
  
  followInterval = setInterval(() => {
    if (!mainWindow || !store.get('isEnabled')) return;

    const { x, y } = screen.getCursorScreenPoint();
    const offsetX = store.get('offsetX') || 20;
    const offsetY = store.get('offsetY') || 20;

    mainWindow.setPosition(x + offsetX, y + offsetY);
  }, 16); // ~60fps tracking
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'icon16.png')); // We'll need a placeholder or real icon
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Cursor Time Tracker', enabled: false },
    { type: 'separator' },
    { 
      label: 'Enabled', 
      type: 'checkbox', 
      checked: store.get('isEnabled'),
      click: (item) => {
        store.set('isEnabled', item.checked);
        if (item.checked) {
          mainWindow.show();
        } else {
          mainWindow.hide();
        }
      }
    },
    { 
      label: 'Reset Counters', 
      click: () => {
        store.set('thanksCount', 0);
        store.set('sorryCount', 0);
        mainWindow.webContents.send('update-counters', { thanks: 0, sorry: 0 });
      } 
    },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);

  tray.setToolTip('Cursor Time Tracker');
  tray.setContextMenu(contextMenu);
}

function registerShortcuts() {
  globalShortcut.unregisterAll();

  const thanksKey = store.get('thanksShortcut');
  const sorryKey = store.get('sorryShortcut');

  globalShortcut.register(thanksKey, () => {
    let count = store.get('thanksCount') + 1;
    store.set('thanksCount', count);
    mainWindow.webContents.send('update-counters', { thanks: count });
  });

  globalShortcut.register(sorryKey, () => {
    let count = store.get('sorryCount') + 1;
    store.set('sorryCount', count);
    mainWindow.webContents.send('update-counters', { sorry: count });
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  registerShortcuts();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Listeners
ipcMain.on('get-settings', (event) => {
  event.returnValue = store.store;
});

ipcMain.on('save-settings', (event, newSettings) => {
  store.set(newSettings);
});
