import {Div} from './Chat.styled.jsx'
import ChatHomeInputBox from './ChatHomeInputBox.jsx'
import * as storage from '../../lib/storage.jsx'

function ChatHome({setChatList, setUiState}) {

    const sendPrompt = async (prompt) => {
        if (!prompt) return;
        const sessionId = crypto.randomUUID(); //id용 난수 생성

        const userMsg = {role: "user", parts: [{ text: prompt}]};
        const messages = [userMsg];
        
        //저장로직
        //일단 messages는 DB에만 저장하고, session이 여러개인 만큼 
        //selectedSession같은 flag를 통해 그때마다 messages 배열에 동기화하는게 좋아보임. 
        await storage.saveMessages(sessionId, messages); 
        //chat이 켜질때마다 load하는거로 결정.
        setChatList(prev => {
            const list = [...prev];
            list.push({
                sessionId: sessionId,
                title: "새 채팅"
            })
            return list;
        })

        //Ui상태 변경. (session 이동도 수행)
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