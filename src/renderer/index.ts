/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import { RPCLink } from "@orpc/client/message-port";
import "./index.css";
import { createORPCClient } from "@orpc/client";
import type { RouterClient } from "@orpc/server";
import type { router } from "@/main/api/routes";

console.log('👋 This message is being logged by "renderer.ts", included via Vite');

const { port1: clientPort, port2: serverPort } = new MessageChannel();

window.postMessage("start-api-client", "*", [serverPort]);

const link = new RPCLink({
  port: clientPort,
});

clientPort.start();

export const orpc: RouterClient<typeof router> = createORPCClient(link);

const res = await orpc.hello.get();
console.log(res.hello);

import "./app";
