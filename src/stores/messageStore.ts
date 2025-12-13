import { create } from 'zustand';

export const useMessageStore = create<messageStore>((set, get) => ({
    messages: [],
    setMessages: (msgs) => set({ messages: msgs }),
    addMessage: (msg) => set((prev) => ({ messages: [...prev.messages, msg] })),
    getLastMessage: () => {
        return get().messages.slice(-1)[0];
    },
    editLastMessage: (msg) => {
        set((prev) => {
            const list = [...prev.messages];
            list[list.length - 1] = msg;
            return { messages: list };
        })
    }
}));