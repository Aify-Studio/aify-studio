import type { IpcChannels } from "@/shared/constants";

export type IpcData<T> = {
  type: IpcChannels;
  payload: T;
};
