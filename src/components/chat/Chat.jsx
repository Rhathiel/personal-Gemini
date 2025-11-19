import { useState, useEffect } from 'react';
import ChatInputBox from './ChatInputBox.jsx';
import ChatMessages from './ChatMessages.jsx';
import styled from 'styled-components';

const Div = styled.div`
  position: fixed;
  top: 5%;
  bottom: 5%;
  left: 90px;  
  right: 470px;    
  background: #705454ff;
  z-index: 10;
`;

//정리:
//세션 별로 난수 생성, 난수 생성은 프론트에서 결정
//해당 동작은 useEffect로 처리하는게 좋아보임. 이후 렌더부터 실행되면 안됨.
//localstorage로 채팅방 id를 관리하고, 존재하지 않을때만 난수를 생성하면 됨.
//생성한 난수를 prompt와 함께 백엔드에 전송, 백엔드에서 해당 난수에 대응하는 key에 
//value: history를 저장함.
//프론트에서 생성한 난수 session id를 local storage에 넣고, 
//해당 session id를 첫 fetch(스타트포인트)에 prompt와 함께 
// 백엔드에 박고 응답시작마다 fetch되고, 응답마다 데이터베이스에 
// 그대로 history가 저장되도록 함. 
// case 1: 새로고침의경우 현재 sessionId의 value를 백엔드에 
// fetch하여 해당하는 history를 받고 messages에 표현하면 될듯 
// case 2: 새 채팅 생성의 경우 새로 sessionId를 만들고 이하 똑같이 진행

function Chat({isNewChat, setSelectedSessionId, selectedSessionId}) {

  useEffect (() => {

  }, []);

  useEffect (() => {
    const raw = localStorage.getItem("sessionList");  
    const list = raw ? JSON.parse(raw) : []; 
    const sessionId = crypto.randomUUID();
    const newChat = {
      sessionId: sessionId,
      title: "새 채팅"
    }
    list.push(newChat) //새 sessionList
    localStorage.setItem("sessionList", list);
    console.log("New Session Created: ", sessionId);
  }, [isNewChat]);

  const [done, setDone] = useState(true);
  const [messages, setMessages] = useState([]);

  const printMessage = (decoded, buffer) => {
    if(decoded?.error){
      console.log("API Error");
      buffer.sumText = buffer.sumText + "\n" + "Status: " + decoded.error.status + "\n" + "Code: " + decoded.error.code; 
      setMessages(prev => {
        let newMessages = [...prev];
        newMessages[newMessages.length - 1] = {role: "model", parts: [{ text: buffer.sumText }]};
        return newMessages; 
      });
    } else if(decoded?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()){
      const { role, parts } = decoded.candidates[0].content; 
      buffer.sumText = buffer.sumText + parts[0].text;
      setMessages(prev => {
        let newMessages = [...prev];
        newMessages[newMessages.length - 1] = {role, parts: [{ text: buffer.sumText }]};
        return newMessages;
      }); 
      if (decoded?.candidates?.[0]?.finishReason === "MAX_TOKENS"){
        setMessages(prev => {
          let newMessages = [...prev];
          newMessages[newMessages.length - 1] = {role, parts: [{ text: buffer.sumText + "토큰이 최대에 도달했습니다. 다시 시도해주세요." }]};
          return newMessages;
        }); 
      }
    }
  }

  const sendPrompt = async (prompt) => {

    if (!done) return;
    if (!prompt) return;

    const userMsg = {role: "user", parts: [{ text: prompt}]};
    setMessages(prev => [...prev, userMsg]);

    setDone(false);

    const response = await fetch("https://personal-gemini.vercel.app/api/stream", {
      method: "POST", 
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt: prompt,  isNewSession: true })
    });

    try {
      await streaming(response);
    } catch(e){
      console.error(e);
    }
    finally { 
      setDone(true);
    }
  }

  const streaming = async(response) => {
    const dec = new TextDecoder("utf-8"); 
    let buffer = {sumText: ""};
    let queue = "";
    let decoded = {}; 
    setMessages(prev => [...prev, null]);
    for await (const chunk of response.body){
      try{
        queue += dec.decode(chunk, { stream: true });
        if(queue.includes("}{")){
          queue = "[" + queue.split("}{").join("},{") + "]";
        }
        decoded = JSON.parse(queue); 
        console.log(decoded);
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

  return (
    <Div>
      <ChatMessages messages={messages} done={done}/>
      <ChatInputBox sendPrompt={sendPrompt}/>
    </Div>
  )
}

export default Chat;
