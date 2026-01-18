import { create } from "zustand";

interface AppState {
  chatId: string | undefined;
  setChatId: (chatId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  chatId: undefined,
  setChatId: (chatId: string) => set(() => ({ chatId })),
}));
