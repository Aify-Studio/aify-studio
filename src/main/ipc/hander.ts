import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/message-port";
import { router } from "./router";

export const ipcHandler = new RPCHandler(router, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});
