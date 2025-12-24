import { os } from "@orpc/server";

export const hello = os.handler(() => {
  return { hello: "world" };
});
