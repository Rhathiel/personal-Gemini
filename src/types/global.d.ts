interface UiState {
    mode: "home" | "session";
    sessionId: string | null;
    sideIsOpened: boolean;
}

interface session {
   title: string;
   sessionId: string | null; 
}

interface message {
    role: "user" | "model";
    parts: Array<{ text: string }>;
}

interface NewSessionState {
    sessionId: string | null;
    prompt: string | null;
}

interface SessionStore {
    sessionList: session[];
    addSession: (s: session) => void;
    setSessions: (list: session[]) => void;
    remSessionById: (sessionId: string) => void;
    editSessionById: (sessionId: string, newData: session) => void;
}

interface UiStateStore {
    uiState: UiState;
    setUiState: (uiState: Partial<UiState>) => void; //부분만 받아서 업데이트 가능
    toggleSideIsOpened: () => void;
}

interface messageStore {
    messages: message[];
    setMessages: (msgs: message[]) => void;
    addMessage: (msg: message) => void;
    getLastMessage: () => message | undefined;
}