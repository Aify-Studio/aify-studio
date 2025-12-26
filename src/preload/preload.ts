// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { ipcRenderer } from "electron";

window.addEventListener("message", (event) => {
  if (event.data === "start-native-client") {
    const [serverPort] = event.ports;

    ipcRenderer.postMessage("start-native-server", null, [serverPort]);
  }
});
