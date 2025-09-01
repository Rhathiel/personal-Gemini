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

    useEffect(() => {
      const es = new EventSource("/.netlify/edge-functions/stream");

      es.onmessage = (event)
    })
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
