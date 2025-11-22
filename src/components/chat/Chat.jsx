import { useState, useEffect } from 'react';
import ChatInputBox from './ChatInputBox.jsx';
import ChatMessages from './ChatMessages.jsx';
import styled from 'styled-components';
import * as storage from '../../lib/storage.jsx'
import {Div} from './chat.styled.jsx'

function Chat({isNewChat, setSelectedSession, isSelectedSession}) {

  //새로고침 시
  useEffect (() => {
    const raw = localStorage.getItem("currentChatMessages");
    const list = raw ? JSON.parse(raw) : [];
  }, []);

  //setSelectedSession 변경시마다 실행됨. messages 갱신을 위해 필요함!
  useEffect (() => {

  }, []);

  const [done, setDone] = useState(true);
  const [messages, setMessages] = useState([]);

  //전달받은 decoded를 buffer객체에 담아서 갱신과 동시에 출력함.
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

  //prompt를 stream.js에 전송하는 역할
  //여기서 일단 sessionId를 전송하게 수정하면될듯
  const sendPrompt = async (prompt) => {

    if (!done) return; //응답이 끝나지 않았으면 동작 무시
    if (!prompt) return; //마찬가지로 prompt가 비어있으면 동작 무시

    const userMsg = {role: "user", parts: [{ text: prompt}]}; //prompt를 담는 빈 유저 객체
    setMessages(prev => [...prev, userMsg]); //동시에 프론트에서도 갱신해줌 
    //갱신을 그냥 useEffect자체로 관리하는게 어떨까
    //아닌가 ?
    //localStorage를 이용해보자
    //현재 구조는 응답을 쏴주는 stream.js와 db와 소통하는 db.js가 존재한다.
    //messages는 갱신마다 화면을 출력하는 친구
    //일단 이 작업은 db history, front history, chat messages간의 동기화가 제일 중요하다.
    //일단, 유저가 입력한 채팅은 한치의 딜레이도없이 바로 표시되는게 좋은 ui이므로 messages에 그대로 갱신하는게 좋아보임.
    //단, 전달되는 히스토리라던가에 msg가 포함되어 prompt가 두번 입력되는 찐빠가 발생할 수 있음.
    //아니면 그냥 새로고침은 localStorage로 해결하고, history 갱신도 계속 이어지게? 왜냐면 응답때만 fetch하는게 좋아보임.
    //그러니까, chat을 옮기면 현재의 storage는 비우고, 새 chat의 history를 받아서 localStorage와 messages가 동기화되는 감각으로 가면 좋을듯.

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
