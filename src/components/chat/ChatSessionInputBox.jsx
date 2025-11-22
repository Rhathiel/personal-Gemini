import { useState, useEffect } from "react";
import {StyledSessionInput} from './chat.styled.jsx'

function ChatSessionInputBox({sendPrompt}) {
    const [input, setInput] = useState(() => {
        return sessionStorage.getItem("input") ?? "";
    });

    useEffect(() => {
        sessionStorage.setItem("input", input);
    }, [input]);
    
    const activeEnter = (e) => {
        if(e.key === "Enter"){
            sendPrompt(input);
            setInput("");
        }
    }
    const activeClick = () => {
        sendPrompt(input);
        setInput("");
    }
    
    return (
        <div>
            <StyledSessionInput type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => activeEnter(e)}/>
            <button type="button" onClick={activeClick}>전송</button>
        </div>
    );
}   

export default ChatSessionInputBox;