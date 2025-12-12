import { useState, useEffect } from "react";
import {StyledSessionInput} from './Chat.styled.tsx'

interface ChatSessionInputBoxProps {
    sendPrompt: (prompt: string) => void;
    isDone: boolean;
}

function ChatSessionInputBox({sendPrompt, isDone}: ChatSessionInputBoxProps) {
    const [input, setInput] = useState(() => {
        return sessionStorage.getItem("chatsessioninput") ?? "";
    });

    useEffect(() => {
        sessionStorage.setItem("chatsessioninput", input);
    }, [input]);
    
    const active = () => {
        sendPrompt(input);
        setInput("");
    }

    return (
        <div>
            <StyledSessionInput type="text" value={input} onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => {
                if(e.key === "Enter"){
                    if(!isDone || !input) {
                        return;
                    }
                    active();
                }
            }}/>
            <button disabled={!isDone || !input} type="button" onClick={active}>전송</button>
        </div>
    );
}   

export default ChatSessionInputBox;