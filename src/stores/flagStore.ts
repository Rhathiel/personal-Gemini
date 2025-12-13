import { create } from 'zustand';

export const useFlagStore = create<flagStore>((set) => ({ 
    isResponseDone: true,
    setIsResponseDone: (isResponseDone) => set({ isResponseDone: isResponseDone })
}));

