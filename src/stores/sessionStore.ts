import { create } from 'zustand';

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessionList: [],
  addSession: (s) =>
    set((prev) => ({
      sessionList: [...prev.sessionList, s],
    })),
  setSessions: (list) => set({ sessionList: list }),
  remSessionById: (sessionId) => 
    set((prev) => {
        const list = [...prev.sessionList];
        const index = list.findIndex(item => item.sessionId === sessionId);
        list.splice(index, 1);
        return { sessionList: list };
    })
}));

