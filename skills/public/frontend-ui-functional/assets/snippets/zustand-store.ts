import { create } from "zustand";

export type UIState = {
  count: number;
  increment: () => void;
  reset: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  reset: () => set({ count: 0 }),
}));
