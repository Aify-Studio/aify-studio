// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../shared/constants";

window.addEventListener("message", (event) => {
  if (event.data === IPC_CHANNELS.START_IPC_SERVER) {
    const [serverPort] = event.ports;

    ipcRenderer.postMessage(IPC_CHANNELS.START_IPC_SERVER, null, [serverPort]);
  }
});
