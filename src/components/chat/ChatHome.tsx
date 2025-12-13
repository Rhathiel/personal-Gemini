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

        newSessionStateRef.current = { //Chat.jsx에 전달해줄 새 session의 정보
            sessionId: sessionId,
            prompt: prompt,
        };

        setMessages([]); //session의 변경을 야기하므로 messages를 지워줌. (안지우면 기존 messages에 추가됨)
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