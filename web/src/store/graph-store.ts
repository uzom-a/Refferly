import { create } from "zustand";

export type DistanceFilter = "YOU" | "ONE" | "TWO" | "ALL";

interface GraphFilters {
  distance: DistanceFilter;
  minTrust: number;
  tradeTypes: string[];
  timeRange: "1M" | "6M" | "ALL";
}

interface GraphState {
  focusWorkerId: string | null;
  filters: GraphFilters;
  setFocusWorkerId: (id: string | null) => void;
  setFilters: (filters: Partial<GraphFilters>) => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  focusWorkerId: null,
  filters: {
    distance: "TWO",
    minTrust: 60,
    tradeTypes: [],
    timeRange: "6M",
  },
  setFocusWorkerId: (id) => set({ focusWorkerId: id }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
}));


