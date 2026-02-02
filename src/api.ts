const API_BASE = 'http://localhost:3001/api';

// Check if we are running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
};

export async function checkServerHealth() {
  if (isElectron()) {
    // In Electron, the "server" (Main Process) is always "healthy" if the app is running
    return true;
  }
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function saveWorkflowToServer(name: string, data: any) {
  if (isElectron() && window.electronAPI) {
    return window.electronAPI.saveWorkflow(name, data);
  }
  const res = await fetch(`${API_BASE}/workflows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, data })
  });
  if (!res.ok) throw new Error('Failed to save to server');
  return res.json();
}

export async function getWorkflowsFromServer() {
  if (isElectron() && window.electronAPI) {
    return window.electronAPI.getWorkflows();
  }
  const res = await fetch(`${API_BASE}/workflows`);
  if (!res.ok) throw new Error('Failed to fetch workflows');
  return res.json();
}

export async function getWorkflowFromServer(id: number) {
  if (isElectron() && window.electronAPI) {
    return window.electronAPI.getWorkflow(id);
  }
  const res = await fetch(`${API_BASE}/workflows/${id}`);
  if (!res.ok) throw new Error('Failed to fetch workflow');
  return res.json();
}
