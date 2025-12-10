import { useState, useEffect, useRef } from 'react';
import ChatSessionInputBox from './ChatSessionInputBox.jsx';
import ChatMessages from './ChatMessages.jsx';
import * as storage from '../../lib/storage.jsx'
import * as utils from '../../lib/utils.jsx'
import {Div} from './Chat.styled.jsx'

function Chat({uiState}) {
  const messagesRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [state, setState] = useState({
    isMessagesRender: true,
    isDone: true,
  })

  useEffect (() => {
    (async () => {
      const list = await storage.loadMessages(uiState.sessionId);
      setMessages(list);
      setState(prev => ({
        ...prev,
        isMessagesRender: false
      }));
    })();
  }, [uiState.sessionId]);

  useEffect(() => {
    messagesRef.current = messages; // always latest
  }, [messages]);

  useEffect (() => {
    (async () => {
      if(state.isMessagesRender === true){
        return;
      }
      await storage.saveMessages(uiState.sessionId, messages);
    })();
  }, [messages, state.isMessagesRender]); 

  useEffect (() => {
    (async () => {
      if(state.isDone === true){
        return;
      }

      const response = await fetch("https://personal-gemini.vercel.app/api/stream", {
        method: "POST", 
        headers: {
          "Content-Type": "application/json"
        },
        body: utils.stringifyJson({messages: messagesRef.current})
      });

      try {
        streaming(response)
      } catch(e){
        console.error(e);
      } finally {
        setState(prev => ({
          ...prev,
          isDone: true,
        }))
      }
    })();
  }, [state.isDone])

  //즉, usState 변경 시 
  //왜 이전 state의 메시지가 초기화되니까

  const sendPrompt = async (prompt) => {
    const userMsg = {role: "user", parts: [{ text: prompt}]};
    setMessages(prev => [...prev, userMsg]);

    setState(prev => ({
      ...prev,
      isDone: false
    }))
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
      <ChatMessages messages={messages} state={state}/>
      <ChatSessionInputBox sendPrompt={sendPrompt} state={state}/>
    </Div>
  )
}

export default Chat;
