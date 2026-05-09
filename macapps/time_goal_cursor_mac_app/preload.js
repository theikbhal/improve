const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: () => ipcRenderer.sendSync('get-settings'),
  saveSettings: (settings) => ipcRenderer.send('save-settings', settings),
  onUpdateCounters: (callback) => ipcRenderer.on('update-counters', (event, data) => callback(data)),
  onUpdateGoal: (callback) => ipcRenderer.on('update-goal', (event, data) => callback(data))
});
