import { useState, useEffect } from "react";
import {StyledSessionInput} from './Chat.styled.tsx'
import { useUiStateStore } from "../../stores/uiStateStore.ts";
import { useFlagStore } from "../../stores/flagStore.ts";

function ChatSessionInputBox({ sendPrompt }: { sendPrompt: (sessionId: string, prompt: string) => Promise<void>; }) {
    const { uiState } = useUiStateStore();
    const { isResponseDone } = useFlagStore();
    const [input, setInput] = useState(() => {
        return sessionStorage.getItem("chatsessioninput") ?? "";
    });
    //새로고침 되어도 input 값이 유지되게 함

    useEffect(() => {
        sessionStorage.setItem("chatsessioninput", input);
    }, [input]);
    //input과 sessionStorage를 동기화
    
    const active = () => {
        sendPrompt(uiState.sessionId!, input);
        setInput("");
    }

    return (
        <div>
            <StyledSessionInput type="text" value={input} onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => {
                if(e.key === "Enter"){
                    if(!isResponseDone || !input) {
                        return;
                    }
                    active();
                }
            }}/>
            <button disabled={!isResponseDone || !input} type="button" onClick={active}>전송</button>
        </div>
    );
}   

export default ChatSessionInputBox;