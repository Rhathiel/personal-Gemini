import { useState, useEffect } from "react";
import {StyledHomeInput} from './Chat.styled.jsx'

function ChatHomeInputBox({sendPrompt}) {

    const [input, setInput] = useState(() => {
        return sessionStorage.getItem("chathomeinput") ?? "";
    });

    useEffect(() => {
        sessionStorage.setItem("chathomeinput", input);
    }, [input]);
    //input 갱신마다 setItem 해줌. 새로고침하면 바로 불러옴. input이 
    
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
            <StyledHomeInput type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => activeEnter(e)}/>
            <button type="button" onClick={activeClick}>전송</button>
        </div>
    );
}   

export default ChatHomeInputBox;