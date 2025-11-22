import {Div} from './chat.styled.jsx'
import {ChatInputBox} from './ChatInputBox.jsx'

//새 채팅을 만들 수 있는 권한을 SideBar에서 ChatHome으로 옮겨야함.
//ChatHome에서 인풋 박스에 입력하는거 자체를 트리거로 삼자.

function ChatHome({setChatList, setUiState}) {

    const sendPrompt = async (prompt) => {

        if (!isDone) return;
        if (!prompt) return;

        const userMsg = {role: "user", parts: [{ text: prompt}]};
        setMessages(prev => [...prev, userMsg]);

        setIsDone(false);

        const response = await fetch("https://personal-gemini.vercel.app/api/stream", {
        method: "POST", 
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ messages: messages })
        });

        try {
        await streaming(response);
        } catch(e){
        console.error(e);
        }
        finally { 
        setIsDone(true);
        }
    }

    return (
        <Div>
            <h1>Welcome to Chat Home</h1>
            <p>Select a chat session from the sidebar or start a new chat.</p>
            <ChatInputBox sendPrompt={sendPrompt} uiState={uiState} />
        </Div>
    );
}

export default ChatHome;