import { create } from 'zustand';

export const useUiStateStore = create<UiStateStore>((set) => ({ 
    uiState: {
        mode: "loading",
        sessionId: null,
        sideIsOpened: false,
    },
    setUiState: (uiState) => set((prev) => 
        ({uiState: { ...prev.uiState, uiState } } )),
    toggleSideIsOpened: () => set((prev) => ({ 
        uiState: { 
            ...prev.uiState, 
            sideIsOpened: !prev.uiState.sideIsOpened 
        } 
    }))
}));

