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
}

function Chat({uiState, newSession, setNewSession}: ChatProps) {
  const [messages, setMessages] = useState<Array<message>>([]);
  const [isDone, setIsDone] = useState<boolean>(true);

  useEffect (() => {
    (async () => {
      if(newSession.isNewSession === true){ // 전달된값은 prompt
        await storage.appendMessages(uiState.sessionId, newSession.userMsg);
        await storage.appendSession({
          sessionId: uiState.sessionId,
          title: "새 채팅"
        });
        setNewSession({
          userMsg: null,
          isNewSession: false
        })  
        console.log("새 세션 만들어졌다요!"); 
        return;
      }
      if(newSession.isNewSession === false){
        const list = await storage.loadMessages(uiState.sessionId);
        setMessages(list);
      }
    })();
  }, [uiState.sessionId, newSession]);

  //즉, usState 변경 시 
  //왜 이전 state의 메시지가 초기화되니까

  const sendPrompt = async (prompt: string) => {
    const userMsg: message = {role: "user", parts: [{ text: prompt}]};

    setMessages(prev => [...prev, userMsg]); //ui갱신
    storage.appendMessages(uiState.sessionId, userMsg); //db갱신
    const response = await fetch("https://personal-gemini.vercel.app/api/stream", {
      method: "POST", 
      headers: {
        "Content-Type": "application/json"
      },
      body: utils.stringifyJson({sessionId: uiState.sessionId, userMsg: userMsg})
    });

    const stream: ReadableStream<Uint8Array<ArrayBuffer>> | null = response.body;

    try {
      streaming(stream)
    } catch(e){
      console.error(e);
    } finally {
      setIsDone(true);
    }
  }
 
  const streaming = async(stream: ReadableStream<Uint8Array<ArrayBuffer>> | null) => {
    //예외
    if(!stream) return;

    //선언부
    let buffer = "";
    let queue = "";
    let decoded = {}; 
    const reader = stream.getReader();
    const emptyMessage: message = {role: "model", parts: [{ text: ""}]};

    //연산
    setMessages(prev => [...prev, emptyMessage]);
    while (true){
      const { done, value } = await reader.read();
      if(done) break;
      try{  
        queue += utils.decodeText(value);
        if(queue.includes("}{")){
          queue = "[" + queue.split("}{").join("},{") + "]";
        }
        decoded = utils.parseText(queue); 
        queue = "";
      } catch(e) {
        console.error(e);
        continue; 
      }
      if(Array.isArray(decoded) === true){
        for(let e of decoded){
          printMessage(e, buffer);
        }
      } else {
        printMessage(decoded, buffer);
      }
    }
  }

  const printMessage = (decoded: any, buffer: string) => {
    if(decoded?.error){
      console.log("API Error");
      buffer = buffer + "\n" + "Status: " + decoded.error.status + "\n" + "Code: " + decoded.error.code; 
      setMessages(prev => {
        let newMessages = [...prev];
        newMessages[newMessages.length - 1] = {role: "model", parts: [{ text: buffer }]};
        return newMessages; 
      });
    } else if(decoded?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()){
      const { role, parts } = decoded.candidates[0].content; 
      buffer = buffer + parts[0].text;
      setMessages(prev => {
        let newMessages = [...prev];
        newMessages[newMessages.length - 1] = {role, parts: [{ text: buffer }]};
        return newMessages;
      }); 
      if (decoded?.candidates?.[0]?.finishReason === "MAX_TOKENS"){
        setMessages(prev => {
          let newMessages = [...prev];
          newMessages[newMessages.length - 1] = {role, parts: [{ text: buffer + "토큰이 최대에 도달했습니다. 다시 시도해주세요." }]};
          return newMessages;
        }); 
      }
    }
  }

  return (
    <Div>
      <ChatMessages messages={messages} isDone={isDone}/>
      <ChatSessionInputBox sendPrompt={sendPrompt} isDone={isDone}/>
    </Div>
  )
}

export default Chat;
