import { useState, useEffect } from 'react';
import ChatSessionInputBox from './ChatSessionInputBox.tsx';
import ChatMessages from './ChatMessages.tsx';
import * as storage from '../../lib/storage.ts'
import * as utils from '../../lib/utils.ts'
import {Div} from './Chat.styled.tsx'
import { useUiStateStore } from '../../stores/uiStateStore.ts';
import { useSessionStore } from '../../stores/sessionStore.ts';
import { useMessageStore } from '../../stores/messageStore.ts';

function Chat({ newSessionStateRef }: { newSessionStateRef: React.MutableRefObject<NewSessionState> }) {
  const [ isDone, setIsDone ] = useState<boolean>(true);
  const { addSession } = useSessionStore();
  const { addMessage, setMessages, getLastMessage } = useMessageStore();
  const { uiState } = useUiStateStore();

  useEffect(() => {
    (async () => {
      if(newSessionStateRef.current.sessionId && newSessionStateRef.current.prompt) {

        await sendPrompt(newSessionStateRef.current.sessionId!, newSessionStateRef.current.prompt!);

        await storage.appendSession({ sessionId: newSessionStateRef.current.sessionId, title: "새 채팅" });

        addSession( { sessionId: newSessionStateRef.current.sessionId, title: "새 채팅" } );
            
        newSessionStateRef.current = { sessionId: null, prompt: null };

        return; 
      }

      const list = await storage.loadMessages(uiState.sessionId);
      setMessages(list);
    })();
  }, [uiState.sessionId]);

  //즉, usState 변경 시 
  //왜 이전 state의 메시지가 초기화되니까

  const sendPrompt = async (sessionId: string, prompt: string) => {
    
    //초기화
    setIsDone(false);
    const userMsg: message = {role: "user", parts: [{ text: prompt}]};

    //갱신
    addMessage(userMsg);
    await storage.appendMessages(sessionId, userMsg); 

    //API 요청
    const response = await fetch("https://personal-gemini.vercel.app/api/stream", {
      method: "POST", 
      headers: {
        "Content-Type": "application/json"
      },
      body: utils.stringifyJson({sessionId: sessionId, userMsg: userMsg})
    });

    //에러 처리
    const contentType = response.headers.get("Content-Type") ?? "";

    if(contentType.includes("application/json")){
      const { error } = await response.json();
      console.log(error.status);
      const errorMsg: message = { role: "model", parts: [{ text: error.status }] }

      switch (error.code){
        case 400: {
          // INVALID_ARGUMENT / FAILED_PRECONDITION
          addMessage(errorMsg);
          break;
        }
        case 403: {
          // PERMISSION_DENIED
          addMessage(errorMsg);
          break;
        }
        case 404: {
          // NOT_FOUND
          addMessage(errorMsg);
          break;
        }
        case 429: {
          // RESOURCE_EXHAUSTED
          addMessage(errorMsg);
          break;
        }
        case 500: {
          // INTERNAL
          addMessage(errorMsg);
          break;
        }
        case 503: {
          // SERVICE_UNAVAILABLE
          addMessage(errorMsg);
          break;
        }
        case 504: {
          // DEADLINE_EXCEEDED
          addMessage(errorMsg);
          break;
        }
        default: {
          break;
        }
      }

      await storage.appendMessages(sessionId, { role: "model", parts: [{ text: error.status }] });
      setIsDone(true);
    } 

    else {
      try {
        await streaming(response.body)
      } 
      catch(e) {
        console.error(e);
      } 
      finally {
        setIsDone(true);
      }
    }
  }
 
  const streaming = async(stream: ReadableStream<Uint8Array<ArrayBuffer>> | null) => {
    //예외
    if(!stream) {
      throw new Error("No stream found");
    };

    //선언부
    let queue = "";
    let decoded = null; 
    const reader = stream.getReader();
    const emptyMessage: message = {role: "model", parts: [{ text: ""}]};

    //연산
    addMessage(emptyMessage);
    while (true){
      const { done, value } = await reader.read();

      if(done) break;

      queue = utils.decodeText(value);
      if(queue.includes("}{")){
        queue = "[" + queue.split("}{").join("},{") + "]";
      }
      decoded = utils.parseText(queue); 

      if(!decoded) continue;

      console.log("decoded:", decoded);

      if(Array.isArray(decoded) === true){
        for(let e of decoded){
          printMessage(e);
        }
      } else {
        printMessage(decoded);
      }
    }
  }

  const printMessage = (decoded: any) => {
    const { role, parts } = decoded.candidates[0].content; 

    if (decoded?.candidates?.[0]?.finishReason === "MAX_TOKENS"){
      let buffer = getLastMessage()!.parts[0].text + parts[0].text + "\n\n[최대 토큰 수 도달]";
      addMessage({ role, parts: [{ text: buffer }] });
    } else {
      let buffer = getLastMessage()!.parts[0].text + parts[0].text;
      addMessage({ role, parts: [{ text: buffer }] });
    }
  }

  return (
    <Div>
      <ChatMessages isDone={isDone}/>
      <ChatSessionInputBox sendPrompt={sendPrompt} isDone={isDone}/>
    </Div>
  )
}

export default Chat;
