import { os } from "@orpc/server";

export const healthcheck = os.handler(() => {
  return "OK";
});
