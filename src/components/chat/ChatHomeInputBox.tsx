import { useState, useEffect } from "react";
import {StyledHomeInput} from './Chat.styled.tsx'

function ChatHomeInputBox({sendPrompt}: {sendPrompt: (prompt: string) => void}) {

    const [input, setInput] = useState(() => {
        return sessionStorage.getItem("chathomeinput") ?? "";
    });

    useEffect(() => {
        sessionStorage.setItem("chathomeinput", input);
    }, [input]);
    //input 갱신마다 setItem 해줌. 새로고침하면 바로 불러옴. input이 
    
    const active = () => {
        sendPrompt(input);
        //unmount될 시 해당 컴포넌츠가 가지는 모든 정보가 삭제되고, 렌더가 더이상 진행되지 않으므로, 직접적으로 storage에서 제거해줘야함. 
        sessionStorage.setItem("chathomeinput", "");
    }
    
    return (
        <div>
            <StyledHomeInput type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => {
                if(e.key === "Enter"){
                    active();
                }
            }}/>
            <button type="button" onClick={active}>전송</button>
        </div>
    );
}   

export default ChatHomeInputBox;