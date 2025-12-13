interface UiState {
    mode: "home" | "session" | "loading";
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

interface NewSession {
    sessionId: string | null;
    prompt: string | null;
}
