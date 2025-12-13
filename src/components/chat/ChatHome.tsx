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
        setUiState({ //Ui 변경 트리거(MainViewm, SideBar), 실질적인 새 세션 트리거(Chat.jsx의 useEffect 확인)
            mode: "session",
            sessionId: sessionId
        });
    }

    return (
        <Div>
            <h1>personal-Gemini에 어서오세요!</h1>
            <p>기존의 세션을 선택하거나 새로운 세션을 시작해주세요.</p>
            <ChatHomeInputBox sendPrompt={sendPrompt}/>
        </Div>
    );
}

export default ChatHome;