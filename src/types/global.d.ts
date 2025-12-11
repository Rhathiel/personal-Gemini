interface UiState {
    mode: "home" | "session" | "loading";
    sessionId: string | null;
    sideIsOpened: boolean;
}

interface session {
   title: string;
   sessionId: string; 
}

interface message {
    role: "user" | "assistant" | "system";
    parts: Array<{ text: string }>;
}