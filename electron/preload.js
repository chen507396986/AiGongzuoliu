const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveWorkflow: (name, data) => ipcRenderer.invoke('save-workflow', name, data),
  updateWorkflow: (id, name, data) => ipcRenderer.invoke('update-workflow', id, name, data),
  getWorkflows: () => ipcRenderer.invoke('get-workflows'),
  getWorkflow: (id) => ipcRenderer.invoke('get-workflow', id),
});
