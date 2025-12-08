import { useState, useEffect } from 'react';
import ChatSessionInputBox from './ChatSessionInputBox.jsx';
import ChatMessages from './ChatMessages.jsx';
import * as storage from '../../lib/storage.jsx'
import * as utils from '../../lib/utils.jsx'
import {Div} from './Chat.styled.jsx'

function Chat({uiState, chatCommand, setChatCommand}) {
  const [messages, setMessages] = useState([]);
  const [state, setState] = useState({
    isFetching: false,
    isChatLoading: false,
    isDone: true,
    isSaving: false
  })

  //세션 변경
  useEffect (() => {
    if(state.isSessionChanged === true){
      setState(prev => ({
        ...prev,
        isDone: true,
      }))
    }
  }, [chatCommand.isSessionChanged]);

  //세션 갱신
  useEffect (() => {
    (async () => {
      const list = await storage.loadMessages(uiState.sessionId);
      setMessages(list);
    })();
    setState(prev => ({
      ...prev,
      isChatLoading: false
    }))
  }, [uiState.sessionId]);

  //세션 저장

  useEffect (() => {

    const interval = setInterval(() => {
      
    }, 8000);


  }, [messages, uiState.sessionId]), 

  useEffect (() => {
    (async () => {
      if(state.isSaving !== true){
        return;
      }
      await storage.saveMessages(uiState.sessionId, messages);
    })();
  }, [messages, state.isChatLoading, uiState.sessionId, state.isSaving]);


  //세션 변경 시 저 
  useEffect (() => {
    (async () => {
      if(state.isSaving !== true){
        return;
      }
      await storage.saveMessages(uiState.sessionId, messages);
    })();
  }, [messages, state.isChatLoading, uiState.sessionId]);

  useEffect (() => {
    (async () => {
      if(!state.isFetching){ //isDone -> 응답 초기 시작, 이후 응답 완전히 끝날때까지 
        return;
      }//이후 messages 갱신부터 effect가 실행되는걸 막아줌

      const response = await fetch("https://personal-gemini.vercel.app/api/stream", {
        method: "POST", 
        headers: {
          "Content-Type": "application/json"
        },
        body: utils.stringifyJson({ messages: messages }) 
      });

      setState(prev => ({
        ...prev,
        isFetching: false
      }))

      try {
        await streaming(response);
      } catch(e){
        console.error(e);
      }
      finally { 
        setState(prev => ({
          ...prev,
          isDone: true
        }))
      }
    })();
  }, [messages, state.isFetching]);

  
 //effect trigger
  const sendPrompt = async (prompt) => {
    const userMsg = {role: "user", parts: [{ text: prompt}]};
    setMessages(prev => [...prev, userMsg]);

    setState(prev => ({
      ...prev,
      isDone: false,
      isFetching: true
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
      <ChatMessages messages={messages} isDone={state.isDone}/>
      <ChatSessionInputBox sendPrompt={sendPrompt} state={state}/>
    </Div>
  )
}

export default Chat;
