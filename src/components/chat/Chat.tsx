import { useState, useEffect } from 'react';
import ChatSessionInputBox from './ChatSessionInputBox.tsx';
import ChatMessages from './ChatMessages.tsx';
import * as storage from '../../lib/storage.ts'
import * as utils from '../../lib/utils.ts'
import {Div} from './Chat.styled.tsx'

interface ChatProps {
  uiState: UiState;
  newSession: NewSession;
  setNewSession: React.Dispatch<React.SetStateAction<NewSession>>;
  setSessionList: React.Dispatch<React.SetStateAction<Array<session>>>;
}

function Chat({uiState, newSession, setNewSession, setSessionList}: ChatProps) {
  const [messages, setMessages] = useState<Array<message>>([]);
  const [isDone, setIsDone] = useState<boolean>(true);

  useEffect (() => {
    (async () => {

    })();
  }, [uiState.sessionId]);

  useEffect(() => {
    (async () => {
      const list = await storage.loadMessages(uiState.sessionId);
      setMessages(list);

      if(newSession.sessionId || newSession.prompt) {
        await sendPrompt(newSession.sessionId!, newSession.prompt!);

        await storage.appendSession({ sessionId: newSession.sessionId, title: "새 채팅" });

        setSessionList(prev => {
            const list = [...prev];
            list.push({
                sessionId: newSession.sessionId,
                title: "새 채팅"
            })
            return list;
        })
            
        setNewSession({
          sessionId: null,
          prompt: null,
        });
      }
    })();
  }, [uiState.sessionId, newSession]);

  //즉, usState 변경 시 
  //왜 이전 state의 메시지가 초기화되니까

  const sendPrompt = async (sessionId: string, prompt: string) => {
    setIsDone(false);
    const userMsg: message = {role: "user", parts: [{ text: prompt}]};

    setMessages(prev => [...prev, userMsg]); //ui갱신
    await storage.appendMessages(sessionId, userMsg); //db갱신
    const response = await fetch("https://personal-gemini.vercel.app/api/stream", {
      method: "POST", 
      headers: {
        "Content-Type": "application/json"
      },
      body: utils.stringifyJson({sessionId: sessionId, userMsg: userMsg})
    });

    const contentType = response.headers.get("Content-Type") ?? "";

    if(contentType.includes("application/json")){
      const error = await response.json();
      console.log(error);

      switch (error.code){
        case 400: {
          // INVALID_ARGUMENT / FAILED_PRECONDITION
          setMessages(prev => [
            ...prev,
            { role: "model", parts: [{ text: error.status }] }
          ]);
          break;
        }
        case 403: {
          // PERMISSION_DENIED
          setMessages(prev => [
            ...prev,
            { role: "model", parts: [{ text: error.status }] }
          ]);
          break;
        }
        case 404: {
          // NOT_FOUND
          setMessages(prev => [
            ...prev,
            { role: "model", parts: [{ text: error.status }] }
          ]);
          break;
        }
        case 429: {
          // RESOURCE_EXHAUSTED
          setMessages(prev => [
            ...prev,
            { role: "model", parts: [{ text: error.status }] }
          ]);
          break;
        }
        case 500: {
          // INTERNAL
          setMessages(prev => [
            ...prev,
            { role: "model", parts: [{ text: error.status }] }
          ]);
          break;
        }
        case 503: {
          // SERVICE_UNAVAILABLE
          setMessages(prev => [
            ...prev,
            { role: "model", parts: [{ text: error.status }] }
          ]);
          break;
        }
        case 504: {
          // DEADLINE_EXCEEDED
          setMessages(prev => [
            ...prev,
            { role: "model", parts: [{ text: error.status }] }
          ]);
          break;
        }
        default: {
          // 알 수 없는 에러
          setMessages(prev => [
            ...prev,
            { role: "model", parts: [{ text: "UNKNOWN_ERROR" }] }
          ]);
          break;
        }
      }

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
    setMessages(prev => [...prev, emptyMessage]);
    while (true){
      const { done, value } = await reader.read();

      if(done) break;

      queue = utils.decodeText(value);
      if(queue.includes("}{")){
        queue = "[" + queue.split("}{").join("},{") + "]";
      }
      decoded = utils.parseText(queue); 

      if(!decoded) continue;

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
      setMessages(prev => {
        let newMessages = [...prev];
        let buffer = newMessages[newMessages.length - 1].parts[0].text + parts[0].text;

        newMessages[newMessages.length - 1] = {role, parts: [{ text: buffer + "토큰이 최대에 도달했습니다. 나중에 다시 시도해주세요." }]};

        return newMessages;
      }); 
    } else {
      setMessages(prev => {
        let newMessages = [...prev];
        let buffer = newMessages[newMessages.length - 1].parts[0].text + parts[0].text;

        newMessages[newMessages.length - 1] = {role, parts: [{ text: buffer }]};

        return newMessages;
      }); 
    }
  }

  return (
    <Div>
      <ChatMessages messages={messages} isDone={isDone}/>
      <ChatSessionInputBox uiState={uiState} sendPrompt={sendPrompt} isDone={isDone}/>
    </Div>
  )
}

export default Chat;
