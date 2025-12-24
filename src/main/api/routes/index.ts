import { hello } from "../service/hello.service";

export const router = {
  hello: {
    get: hello,
  },
};
