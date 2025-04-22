import { contextBridge, ipcRenderer } from "electron";

type Channel = string;
type Callback = (...args: unknown[]) => void;

contextBridge.exposeInMainWorld("electronAPI", {
  on: (channel: Channel, callback: Callback) => {
    ipcRenderer.on(channel, callback);
  },
  send: (channel: Channel, args: unknown) => {
    ipcRenderer.send(channel, args);
  },
});
