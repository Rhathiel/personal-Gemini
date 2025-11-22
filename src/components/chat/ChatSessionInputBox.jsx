import { useState } from "react";
import {StyledSessionInput, StyledHomeInput} from './chat.styled.jsx'

function ChatSessionInputBox({sendPrompt}) {
    const [input, setInput] = useState("");
    
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