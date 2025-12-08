import {Div} from './Chat.styled.jsx'
import ChatHomeInputBox from './ChatHomeInputBox.jsx'
import * as storage from '../../lib/storage.jsx'

function ChatHome({setChatList, setUiState, setChatCommand}) {

    const sendPrompt = async (prompt) => {
        if (!prompt) return;
        const sessionId = crypto.randomUUID(); //id용 난수 생성

        const userMsg = {role: "user", parts: [{ text: prompt}]};
        const messages = [userMsg];
        await storage.saveMessages(sessionId, messages);

        setUiState(prev => ({
            ...prev,
            sessionId: sessionId,
            mode: "session"
        }))
        setChatList(prev => {
            const list = [...prev];
            list.push({
                sessionId: sessionId,
                title: "새 채팅"
            })
            return list;
        })
        setChatCommand({prompt: prompt, isSessionChanged: true});
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