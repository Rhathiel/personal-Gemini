import { useState } from 'react';
import ReactMarkdown from "react-markdown";
import './App.css'

function App() {
  console.log("version: 1.0.3");

  const [input, setInput] = useState("");
  const [done, setDone] = useState(true);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);

  async function sendPrompt() {

    if (!done) return;

    const prompt = input;
    if (!prompt) return;

    setMessages(prev => [...prev, {role: "user", parts: [{ text: prompt }]}]);
    setHistory(prev => [...prev, {role: "user", parts: [{ text: prompt }]}]);

    setDone(false);
    setInput("");

    const response = await fetch("https://personal-gemini.vercel.app/api/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt: prompt, history: history })
    });

    try {
      await streaming(response); //stream 호츨 done 받을 때 까지 대기
    } finally { 
      setDone(true); 
    }
  }

  async function streaming(response){
    const dec = new TextDecoder("utf-8");
    let buffer = "";
    let role = "";
    let text = "";

    for await (const chunk of response.body){
      ({ role, text } = JSON.parse(dec.decode(chunk, { stream: true })));
      buffer += text;
      setMessages([...messages, {role: role, parts: [{ text: buffer }]}]);
    }

    setHistory([...messages, {role: role, parts: [{ text: buffer }]}]);

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
                {msg.role === "user" ? <b>나:</b> : <b>AI:</b>}{" "} 
                {msg.parts?.[0]?.text || (msg.role === "model" ? <i>생각 중...</i> : null)}
              </li>
            ))}
          </ul>
      </main>
    </>
  )
}

export default App
