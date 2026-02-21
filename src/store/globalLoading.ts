import { create } from "zustand";

type GlobalLoadingState = {
  pendingCount: number;
  start: () => void;
  stop: () => void;
  reset: () => void;
};

export const useGlobalLoading = create<GlobalLoadingState>((set) => ({
  pendingCount: 0,
  start: () => set((state) => ({ pendingCount: state.pendingCount + 1 })),
  stop: () =>
    set((state) => ({
      pendingCount: Math.max(0, state.pendingCount - 1),
    })),
  reset: () => set({ pendingCount: 0 }),
}));

export const startGlobalLoading = () => useGlobalLoading.getState().start();
export const stopGlobalLoading = () => useGlobalLoading.getState().stop();
