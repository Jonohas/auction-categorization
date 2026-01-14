import { create } from "zustand";

interface ItemSelectionState {
  selectedItemIds: Set<string>;
  isSelectionMode: boolean;
  toggleSelectionMode: () => void;
  toggleItem: (itemId: string) => void;
  selectAll: (itemIds: string[]) => void;
  clearSelection: () => void;
  isSelected: (itemId: string) => boolean;
}

export const useItemSelectionStore = create<ItemSelectionState>((set, get) => ({
  selectedItemIds: new Set(),
  isSelectionMode: false,

  toggleSelectionMode: () => {
    set((state) => ({
      isSelectionMode: !state.isSelectionMode,
      selectedItemIds: state.isSelectionMode ? new Set() : state.selectedItemIds,
    }));
  },

  toggleItem: (itemId: string) => {
    set((state) => {
      const newSet = new Set(state.selectedItemIds);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return { selectedItemIds: newSet };
    });
  },

  selectAll: (itemIds: string[]) => {
    set({ selectedItemIds: new Set(itemIds) });
  },

  clearSelection: () => {
    set({ selectedItemIds: new Set() });
  },

  isSelected: (itemId: string) => {
    return get().selectedItemIds.has(itemId);
  },
}));
