import { useState } from "react";
import {StyledSessionInput, StyledHomeInput} from './chat.styled.jsx'

function ChatInputBox({sendPrompt, uiState}) {
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
    
    const Main = () => {
        switch (uiState.mode) {
            case "home":
                return (<div>
                            <StyledHomeInput type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => activeEnter(e)}/>
                            <button type="button" onClick={activeClick}>전송</button>
                        </div>);
            case "session":
                return (<div>
                            <StyledSessionInput type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => activeEnter(e)}/>
                            <button type="button" onClick={activeClick}>전송</button>
                        </div>);
            default:
                return null;
        }
    };
    
    return <Main/>
}   

export default ChatInputBox;