import {Div} from './Chat.styled.tsx'
import ChatHomeInputBox from './ChatHomeInputBox.tsx'
import { useUiStateStore } from '../../stores/uiStateStore.ts';
import { useMessageStore } from '../../stores/messageStore.ts';

function ChatHome({newSessionStateRef}: {newSessionStateRef: React.MutableRefObject<NewSessionState>}) {
    const { setUiState } = useUiStateStore();
    const { setMessages } = useMessageStore();
    const sendPrompt = async (prompt: string) => {
        if (!prompt) return;
        const sessionId = crypto.randomUUID(); //id용 난수 생성

        newSessionStateRef.current = {
            sessionId: sessionId,
            prompt: prompt,
        };

        setMessages([]);
        setUiState({
            mode: "session",
            sessionId: sessionId
        });
    }

    return (
        <Div>
            <h1>Welcome to Chat Home</h1>
            <p>Select a chat session from the sidebar or start a new chat.</p>
            <ChatHomeInputBox sendPrompt={sendPrompt}/>
        </Div>
    );
}

export default ChatHome;