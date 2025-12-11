import { useState, useEffect, useRef } from 'react';
import ChatSessionInputBox from './ChatSessionInputBox.jsx';
import ChatMessages from './ChatMessages.jsx';
import * as storage from '../../lib/storage.jsx'
import * as utils from '../../lib/utils.jsx'
import {Div} from './Chat.styled.jsx'

function Chat({uiState, newSession, setNewSession}) {
  const [messages, setMessages] = useState([]);
  const [isDone, setIsDone] = useState(true);

  useEffect (() => {
    (async () => {
      if(newSession.isNewSession === true){ // 전달된값은 prompt
        await storage.appendMessages(uiState.sessionId, newSession.userMsg);
        setNewSession({
          userMsg: null,
          isNewSession: false
        })  
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

  const sendPrompt = async (prompt) => {
    const userMsg = {role: "user", parts: [{ text: prompt}]};

    if(isDone === true){
      return;
    }

    setMessages(prev => [...prev, userMsg]); //ui갱신
    storage.appendMessages(uiState.sessionId, userMsg); //db갱신
    const response = await fetch("https://personal-gemini.vercel.app/api/stream", {
      method: "POST", 
      headers: {
        "Content-Type": "application/json"
      },
      body: utils.stringifyJson({sessionId: uiState.sessionId, userMsg: userMsg})
    });

    try {
      streaming(response)
    } catch(e){
      console.error(e);
    } finally {
      setIsDone(true);
    }
  }
 
  const streaming = async(response) => {
    let buffer = "";
    let queue = "";
    let decoded = {}; 
    setMessages(prev => [...prev, {role: "model", parts: [{ text: "" }]}]);
    for await (const chunk of response.body){
      try{
        queue += utils.decodeText(chunk);
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

  const printMessage = (decoded, buffer) => {
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
