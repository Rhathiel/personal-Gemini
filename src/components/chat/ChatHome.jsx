import {Div} from './Chat.styled.jsx'
import ChatHomeInputBox from './ChatHomeInputBox.jsx'

function ChatHome({setSessionList, setUiState, setNewSession}) {

    const sendPrompt = async (prompt) => {
        if (!prompt) return;
        const sessionId = crypto.randomUUID(); //id용 난수 생성
        const userMsg = {role: "user", parts: [{ text: prompt}]};
        
        setNewSession({
            userMsg: userMsg,
            isNewSession: true
        })
        setSessionList(prev => {
            const list = [...prev];
            list.push({
                sessionId: sessionId,
                title: "새 채팅"
            })
            return list;
        })
        setUiState(prev => ({
            ...prev,
            sessionId: sessionId,
            mode: "session"
        }))
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