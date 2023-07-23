import { create } from "zustand";

type AppState = {
    selectedSafe: string;
    setSelectedSafe: (safe: string) => void;
}
export const useStore = create<AppState>((set) => ({
    selectedSafe: "",
    setSelectedSafe: (safe: string) => set({ selectedSafe: safe }),
}));