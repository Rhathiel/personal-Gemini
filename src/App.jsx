import { useState, useEffect } from 'react';
import ReactMarkdown from "react-markdown";
import './App.css';

function App() {
  useEffect(() => {
    console.log("version: 1.2.1");
  }, []);

  const activeEnter = (e) => {
    if(e.key === "Enter"){
      sendPrompt();
    }
  }

  const [input, setInput] = useState("");
  const [done, setDone] = useState(true);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);

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

  const sendPrompt = async () => {

    if (!done) return;

    const prompt = input;
    if (!prompt) return;

    const userMsg = {role: "user", parts: [{ text: prompt}]};
    setMessages(prev => [...prev, userMsg]);
    const newHistory = [...history, userMsg];
    setHistory(newHistory);


    setDone(false);
    setInput("");


    const response = await fetch("https://personal-gemini.vercel.app/api/stream", {
      method: "POST", 
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt: prompt, history: newHistory })
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
    setMessages(prev => [...prev, {}]);
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
    setHistory(prev => [...prev, {role: "model", parts: [{ text: buffer.sumText }]}] );
  }

  return (
    <div id = "root">
      <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => activeEnter(e)}/>
      <button id="sendBtn" type="button" onClick={sendPrompt}>전송</button>
        <ul id="messages">
          {messages.map((msg, i) => ((Object.keys(msg).length !== 0) &&
            <li key={i}>
              <ReactMarkdown>
                {(msg.role === "user" ? "**나:**" : "**AI:**") + " " + (msg.parts?.[0]?.text)}
              </ReactMarkdown>
            </li>
          ))}
          {(done) ? null : <li>...</li>}
        </ul>
    </div>
  )
}

export default App
