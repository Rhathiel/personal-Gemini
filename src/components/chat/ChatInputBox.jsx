import { useState } from "react";
import styled from 'styled-components'

let StyledInput = styled.input`
    position: sticky;
    bottom: 0;
    width: 80%;
    margin = 10px auto 10px auto;
    border-radius: 16px;
`;

function ChatInputBox({sendPrompt}) {
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
            <StyledInput type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => activeEnter(e)}/>
            <button type="button" onClick={activeClick}>전송</button>
        </div>
    );
}   

export default ChatInputBox;