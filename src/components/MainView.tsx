import { useRef } from 'react';
import { useUiStateStore } from '../stores/uiStateStore.ts';
import Chat from './chat/Chat.tsx';
import ChatHome from './chat/ChatHome.tsx';
import LoadingScreen from './chat/LoadingScreeen.tsx'

function MainView() {
    const mode = useUiStateStore(s => s.uiState.mode);
    const newSessionStateRef = useRef<NewSessionState>({
        sessionId: null,
        prompt: null,
    });

    switch (mode) {
        case "home":
        return ( <ChatHome newSessionStateRef={newSessionStateRef}/> );
        case "session":
        return ( <Chat newSessionStateRef={newSessionStateRef}/> );
        default:
        return ( <LoadingScreen/> );     
    }
}

export default MainView;