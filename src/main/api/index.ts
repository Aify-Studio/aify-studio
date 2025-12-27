import { createServer } from "node:http";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/node";
import { CORSPlugin } from "@orpc/server/plugins";
import { router } from "./api.router";

const handler = new RPCHandler(router, {
  plugins: [new CORSPlugin()],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export const apiServer = createServer(async (req, res) => {
  const { matched } = await handler.handle(req, res, {
    prefix: "/api",
    context: {},
  });

  if (matched) {
    return;
  }

  res.statusCode = 404;
  res.end("Not found");
});
