import { useState } from 'react';
import ReactMarkdown from "react-markdown";
import './App.css'

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState("");
  const [done, setDone] = useState(true);

  async function sendPrompt() {

    if (!done) return;

    const prompt = input;
    if (!prompt) return;

    setDone(false);
    setInput("")
    setMessages("")

    const response = await fetch("/api/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    try {
      await streaming(response);
    } finally {
      setDone(true);
    }
  }

  async function streaming(response){
    const reader = response.body.getReader();
    const dec = new TextDecoder("utf-8");

    while(true){
      const chunk = await reader.read();
      if(chunk.done){
        break;
      }
      const text = dec.decode(chunk.value, { stream: true });
      setMessages((prev) => prev + text);
    }
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
        <div id="chat-output">
          <ReactMarkdown>{messages}</ReactMarkdown>
        </div>
      </main>
    </>
  )
}

export default App
