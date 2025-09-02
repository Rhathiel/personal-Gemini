import { useState, useRef } from 'react';
import ReactMarkdown from "react-markdown";
import './App.css'

function App() {
  const [input, setInput] = useState("");
  const [done, setDone] = useState(true);
  const [finalText, setFinalText] = useState("");
  const boxRef = useRef(null);

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function sendPrompt() {

    if (!done) return;

    const prompt = input;
    if (!prompt) return;

    setDone(false);
    setInput("");
    setFinalText("");
    boxRef.current.textContent = "";

    const response = await fetch("https://431641535202.netlify.app/api/stream", {
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
        const finalText = dec.decode(undefined, { stream: false });
        if (finalText) {
          await writer.write(enc.encode(finalText));
        }
        break;
      }
      const text = dec.decode(chunk.value, { stream: true });
      if (boxRef.current) {
        boxRef.current.insertAdjacentText("beforeend", text);
      }
    }
    setFinalText(boxRef.current);
    console.log("update?" + "yes");
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
        <div id="chat-output" ref={boxRef}>
          <ReactMarkdown>{finalText}</ReactMarkdown>
        </div>
      </main>
    </>
  )
}

export default App
