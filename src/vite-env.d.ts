/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __COMMIT_HASH__: string;
declare const __BUILD_DATE__: string;

interface Window {
  electronAPI?: {
    saveWorkflow: (name: string, data: any) => Promise<{ id: number, name: string }>;
    updateWorkflow: (id: number, name: string, data: any) => Promise<{ id: number, name: string }>;
    getWorkflows: () => Promise<any[]>;
    getWorkflow: (id: number) => Promise<any>;
  };
}
