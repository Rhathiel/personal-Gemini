import { create } from 'zustand';
import * as utils from '../lib/utils.ts'

export const useUiStateStore = create<UiStateStore>((set) => ({ 
    uiState: utils.parseText(sessionStorage.getItem("uiState")) || {
        mode: "home",
        sessionId: null,
        sideIsOpened: false
    },
    setUiState: (uiState) => set((prev) => 
        ({uiState: { ...prev.uiState, ...uiState } } )),
    toggleSideIsOpened: () => set((prev) => ({ 
        uiState: { 
            ...prev.uiState, 
            sideIsOpened: !prev.uiState.sideIsOpened 
        } 
    }))
}));

