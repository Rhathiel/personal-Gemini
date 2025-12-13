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

    useEffect(() => {
        sessionStorage.setItem("chatsessioninput", input);
    }, [input]);
    
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