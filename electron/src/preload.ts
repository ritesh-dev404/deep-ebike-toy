import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  printThermalReceipt: (htmlContent: string) => ipcRenderer.invoke('print-thermal', htmlContent),
  printA4Invoice: (saleId: string) => ipcRenderer.invoke('print-a4', saleId),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  getMachineId: () => ipcRenderer.invoke('get-machine-id'),
});
