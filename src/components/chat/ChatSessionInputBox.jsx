import { useState, useEffect } from "react";
import {StyledSessionInput} from './Chat.styled.jsx'

function ChatSessionInputBox({sendPrompt, state}) {
    const [input, setInput] = useState(() => {
        return sessionStorage.getItem("input") ?? "";
    });

    useEffect(() => {
        sessionStorage.setItem("input", input);
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
                    if(!state.isDone || !input) {
                        return;
                    }
                    active(e);
                }
            }}/>
            <button disabled={!state.isDone || !input} type="button" onClick={active}>전송</button>
        </div>
    );
}   

export default ChatSessionInputBox;