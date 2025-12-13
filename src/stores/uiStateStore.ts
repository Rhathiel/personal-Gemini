import { create } from 'zustand';

interface UiActions {
    setUiState: (uiState: UiState) => void;
}

export const useUiStateStore = create<UiState & UiActions>((set) => ({ 
    mode: "home",
    sessionId: "null",
    sideIsOpened: false,
    setUiState: (uiState) => set( uiState )
}));

