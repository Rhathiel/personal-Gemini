import { useEffect, useState } from 'react';
import './App.css'

function App() {
  function sendPrompt() {
    const input = document.getElementById('chat-input');
    const prompt = input.value;
    if (!prompt) return;

    const chatOutput = document.getElementById('chat-output');
  }

  function streamViewer(){
    const [messages, setMessages] = useState([]);
    const [done, setDone] = useState(false);

    useEffect(() => {
      const es = new EventSource("/api/stream");

      es.onmessage = (e) => {
        setMessages((prev) => {return [...prev, e.data]});
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

      return () => {
        es.close();
      };
    }, []);
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
        <input id="chat-input" type="text"/>
        <button id="sendBtn" type="button">전송</button>
        <div id="chat-output"></div>
      </main>
    </>
  )
}

export default App
