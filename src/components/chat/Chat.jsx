import { useState, useEffect } from 'react';
import ChatSessionInputBox from './ChatSessionInputBox.jsx';
import ChatMessages from './ChatMessages.jsx';
import * as storage from '../../lib/storage.jsx'
import * as utils from '../../lib/utils.jsx'
import {Div} from './chat.styled.jsx'
import { StaticElement } from 'three/examples/jsm/transpiler/AST.js';

function Chat({uiState, chatCommand, setChatCommand}) {
  const [messages, setMessages] = useState([]);
  const [state, setState] = useState({
    isFetching: false,
    isChatLoading: false,
    isDone: true
  })

  //세션 갱신
  useEffect (() => {
    if(chatCommand.isSessionChanged === false){
      return;
    }
    setIsDone(true);
    (async () => {
      const list = await storage.loadMessages(uiState.sessionId);
      setMessages(list);
    })();
    setChatIsLoading(false);
  }, [chatCommand.isSessionChanged, uiState.sessionId]);

  //세션 저장
  useEffect (() => {
    (async () => {
      if(state.isChatLoading === true){
        return;
      }
      await storage.saveMessages(uiState.sessionId, messages);
    })();
  }, [messages, state.isChatLoading, uiState.sessionId]);

  //response 받기
  useEffect (() => {
    (async () => {
      if(state.isDone && !state.isFetching){
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
  }, [messages, state]);

 //effect trigger
  const sendPrompt = async (prompt) => {
    if (!state.isDone) return;
    if (!prompt) return;

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
    setMessages(prev => [...prev, null]); //갱신됐지만 조건분기해서 use에 안걸림
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



  if(chatCommand.isSessionChanged && chatCommand.prompt){
    (async () => {
      await sendPrompt(chatCommand.prompt)
      setChatCommand({
        messages: "",
        isSessionChanged: false
      })
    })(); 
  }

  return (
    <Div>
      <ChatMessages messages={messages} isDone={state.isDone}/>
      <ChatSessionInputBox sendPrompt={sendPrompt}/>
    </Div>
  )
}

export default Chat;
