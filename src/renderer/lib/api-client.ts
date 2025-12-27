import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { router } from "../../main/api/api.router";

const apiLink = new RPCLink({
  url: "http://127.0.0.1:20000/api",
});

export const apiClient: RouterClient<typeof router> = createORPCClient(apiLink);
