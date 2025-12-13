import {Div} from './Chat.styled.tsx'
import ChatHomeInputBox from './ChatHomeInputBox.tsx'

interface ChatHomeProps {
    setNewSession: React.Dispatch<React.SetStateAction<NewSession>>;
}

function ChatHome({setNewSession}: ChatHomeProps) {

    const sendPrompt = async (prompt: string) => {
        if (!prompt) return;
        const sessionId = crypto.randomUUID(); //id용 난수 생성

        setNewSession({
            sessionId: sessionId,
            prompt: prompt,
            isNewSession: true
        })
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