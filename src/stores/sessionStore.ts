import { create } from 'zustand';

interface SessionStore {
  sessionList: session[];
  addSession: (s: session) => void;
  setSessions: (list: session[]) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessionList: [],
  addSession: (s) =>
    set((prev) => ({
      sessionList: [...prev.sessionList, s],
    })),
  setSessions: (list) => set({ sessionList: list }),
}));

