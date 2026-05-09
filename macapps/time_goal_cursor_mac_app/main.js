const { app, BrowserWindow, screen, Tray, Menu, globalShortcut, ipcMain } = require('electron');
const path = require('path');
let Store = require('electron-store');
if (typeof Store !== 'function' && Store.default) {
  Store = Store.default;
}

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
  offsetY: 20,
  hasSeenOnboarding: false
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
    {
      label: 'Change Goal',
      click: () => {
        const { x, y } = screen.getCursorScreenPoint();
        let promptWindow = new BrowserWindow({
          width: 300,
          height: 120,
          frame: false,
          alwaysOnTop: true,
          webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
          }
        });
        promptWindow.setPosition(x, y);
        promptWindow.loadURL(`data:text/html,
          <body style="-webkit-app-region: drag; font-family: sans-serif; padding: 20px; background: #1a1a1a; color: white;">
            <div style="margin-bottom: 10px;">Enter New Goal:</div>
            <input id="i" style="width: 100%; padding: 5px; margin-bottom: 10px;" value="${store.get('goalText')}">
            <button onclick="require('electron').ipcRenderer.send('set-goal', document.getElementById('i').value); window.close()">Save</button>
            <button onclick="window.close()">Cancel</button>
          </body>
        `);
      }
    },
    { type: 'separator' },
    { label: 'How to Use', click: showHelpWindow },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);

  tray.setToolTip('Cursor Time Tracker');
  tray.setContextMenu(contextMenu);
}

function showHelpWindow() {
  let helpWindow = new BrowserWindow({
    width: 500,
    height: 600,
    title: 'How to Use',
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  helpWindow.loadFile('help.html');
  helpWindow.setAlwaysOnTop(true);
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

  // Onboarding check
  if (!store.get('hasSeenOnboarding')) {
    showHelpWindow();
    store.set('hasSeenOnboarding', true);
  }

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

ipcMain.on('set-goal', (event, newGoal) => {
  store.set('goalText', newGoal);
  mainWindow.webContents.send('update-goal', newGoal);
});
