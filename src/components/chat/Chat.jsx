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

  //세션 변경 -> 새로고침, 변경마다 실행되어야함. session저장은 전달마다 수행되게 해야함.
  //즉, flag를 사용하는게 좋아보임. 일단 동기화는 flag
  //세션 갱신
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

  //세션 저장, 트리거는 sendPrompt면 될거같음. flag로 처리하면 될듯?
  //사실 flag도 필요 없고, 어짜피 새로고침마다 불러오는거니까
  //첫 시행 때 갱신 로직이 실행 될거고, flag 필요할듯?
  //그러면 , 
  useEffect (() => {
    (async () => {
      if(state.isMessagesRender === true){
        return;
      }
      await storage.saveMessages(uiState.sessionId, messagesRef.current);
    })();
  }, [state.isMessagesRender]); 
  //첫 시도, 혹은 messages 배열의 갱신마다 처리되도록 함.
  //즉, 모든 messages의 DB저장은  Ui update가 선행되어야함.

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

 //effect trigger
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
