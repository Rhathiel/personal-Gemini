import { useState, useEffect } from 'react';
import ReactMarkdown from "react-markdown";
import './App.css'

function App() {
  useEffect(() => {
    console.log("version: 1.0.3");
  },[]);

  const [input, setInput] = useState("");
  const [done, setDone] = useState(true);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);

  async function sendPrompt() {

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
      await streaming(response); //stream 호츨 done 받을 때 까지 대기
    } catch(e){
      console.error(e);
    }
    finally { 
      setDone(true); 
    }
  }

  async function streaming(response){
    const dec = new TextDecoder("utf-8");
    
    let buffer = "";
    let empty = { role: "model", parts: [{text: ""}]};
    let queue = "";
    let decoded = {};
    setMessages(prev => [...prev, empty]);
    for await (const chunk of response.body){
      try{
        queue += dec.decode(chunk);
        decoded = JSON.parse(queue);
        queue = "";
      } catch {
        continue;
      }
      if(decoded instanceof ApiError){
        setMessages(prev => {
          let newMessages = [...prev];
          newMessages[newMessages.length - 1] = {role: "model", parts: [{ text: "응답이 너무 많습니다! 다시 시도해주세요." }]};
          return newMessages;
        });
      }
      const { role, parts } = decoded.candidates[0].content;
      buffer += parts?.[0]?.text || "";
      setMessages(prev => {
        let newMessages = [...prev];
        newMessages[newMessages.length - 1] = {role, parts: [{ text: buffer }]};
        return newMessages;
      });
    }
    setHistory(prev => [...prev, { role: "model", parts: [{text: buffer}]}]);

    console.log("status", response.status);
    console.log("ok?", response.ok);
    console.log("headers", [...response.headers]);
  }

  return (
    <>
      <div className="layout">
        <aside id="sidebar">
            <header>
                <h1>LOGO</h1>
                <button id="toggle-btn">☰</button>
            </header>
            <nav>
                <button>새 채팅</button>
                <button>채팅 검색</button>
                <ul> 
                    <li>주제A</li>
                    <li>주제B</li>
                    <li>주제C</li>
                </ul>
            </nav>
        </aside>
      </div>

      <main>
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}/>
        <button id="sendBtn" type="button" onClick={sendPrompt}>전송</button>
          <ul id="messages">
            {messages.map((msg, i) => (
              <li key={i}>
                <ReactMarkdown>
                  {(msg.role === "user" ? "**나:**" : "**AI:**") + " " + (msg.parts?.[0]?.text)}
                </ReactMarkdown>
              </li>
            ))}
          </ul>
      </main>
    </>
  )
}

export default App
