import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useUiStateStore = create<UiStateStore>()(
    persist(
        (set) => ({
            uiState: {
                mode: "home",
                sessionId: null,
                sideIsOpened: false
            },
            setUiState: (uiState) => set((prev) => 
                ({ uiState: { ...prev.uiState, ...uiState } })
            ),
            toggleSideIsOpened: () => set((prev) => ({ 
                uiState: { 
                    ...prev.uiState, 
                    sideIsOpened: !prev.uiState.sideIsOpened 
                } 
            }))
        }),
        {
            name: 'uiState',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);

