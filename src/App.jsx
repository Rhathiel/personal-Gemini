import { useEffect, useState } from 'react';
import ReactMarkdown from "react-markdown";
import './App.css'

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState("");
  const [done, setDone] = useState(false);

  async function sendPrompt() {
    const prompt = input.value;
    if (!prompt) return;

    setInput("")

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    streaming();
  }

  function streaming(){
    const es = new EventSource("/api/stream");

    es.onmessage = (e) => {
      setMessages((prev) => prev + e.data);
    };

    es.addEventListener("done", () => {
      setDone(true);
      es.close();
    });

    es.addEventListener("error", (event) => { 
      console.error("서버 에러:", event.data);
    });

    es.onerror = (err) => {
      console.error("네트워크 에러:", err);
      es.close();
    };
  }

  return (
    <>
      <div class="layout">
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
