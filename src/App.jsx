import { useState, useEffect } from 'react';
import ReactMarkdown from "react-markdown";
import './App.css'

function App() {
  useEffect(() => {
    console.log("version: 1.0.4");
  },[]);

  const [input, setInput] = useState("");
  const [done, setDone] = useState(true);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);

  async function sendPrompt() {

    if (!done) return;
    //응답이 끝나지 않았으면 종료

    const prompt = input;
    if (!prompt) return;
    //state 객체 input 값을 prompt에 저장
    //input 값이 존재하지 않을 경우 종료

    const userMsg = {role: "user", parts: [{ text: prompt}]};
    //받은 input과 role을 userMsg 객체에 저장
    setMessages(prev => [...prev, userMsg]);
    //받은 객체를 setMessages배열에 이어붙임 (user의 메시지를 로그에 표기하기 위한 기능)
    const newHistory = [...history, userMsg];
    //stream.js에 보낼때 필요한 history 객체도 새로 생성함 (실제로 응답을 주는 대상은 history객체)
    setHistory(newHistory);
    //hitory 갱신

    //중요 point : 객체 전체를 교체하는 이유 -> 리렌더링 강제

    setDone(false);
    setInput("");
    //상태 초기화, input은 비워놓음(전달되었으므로)

    const response = await fetch("https://personal-gemini.vercel.app/api/stream", { //fetch메소드로 prompt 전달
      method: "POST", //post방식(장점: 길다. 주소창에 표시 안되서 보안 장점)
      headers: {
        "Content-Type": "application/json" //전달 타입이 객체임을 명시.
      },
      body: JSON.stringify({ prompt: prompt, history: newHistory }) //history를 전달함. database 구성 후에는 필요없는 동작.
    });

    //response객체 생성(정보를 받는 객체), fetch로 목표 지정
    //일종의 수레처럼 동작함.

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
      if(decoded.error){
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
