import { useState } from 'react';
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

function Chat({isNewChat}) {

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
