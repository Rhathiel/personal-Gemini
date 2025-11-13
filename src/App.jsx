import { useState, useEffect } from 'react';
import ReactMarkdown from "react-markdown";
import './App.css'

function App() {
  useEffect(() => {
    console.log("version: 1.0.9594");
  }, []);

  const [input, setInput] = useState("");
  const [done, setDone] = useState(true);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  //내부값이더라도 초기화 되는걸 막기 위해 useState로 선언함.

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


    //try-catch로 에러 컨트롤
    try {
      await streaming(response); //stream 호츨 done 받을 때 까지 대기, streaming함수가 async이기 때문에 await으로 호출.
    } catch(e){
      console.error(e);
    }
    finally { 
      setDone(true); //문제 없으면 끝났음을 알림
    }
  }

  async function streaming(response){
    const dec = new TextDecoder("utf-8"); //받은 객체를 복호화함
    
    let buffer = "";
    let empty = { role: "model", parts: [{text: "..."}]}; //대화 말풍선 양식
    let queue = "";
    let decoded = {}; 
    setMessages(prev => [...prev, empty]);
    //setMessages에 빈 청크 삽입
    for await (const chunk of response.body){
      try{
        queue += dec.decode(chunk, { stream: true }); //TextDecoder는 stream true일 경우 잘려진 2진 비트를 기억하기 때문에 관리 필요 X 
        decoded = JSON.parse(queue); //해당 queue를 JSON 객체로 파싱 후 decoded에 대입
        console.log(decoded);
        queue = "";
      } catch {
        continue; 
      //파싱 실패시, 즉 decode 내부 버퍼에는 잘려진 청크 ~10이 남고, parse는 실패, chunk는 채워져 있는 경우 그냥 다음으로 넘어감
      //현재 확인된 바로는 청크가 완전하지 않는 경우는 거의 발생하지 않음.
      }
      //청크가 완전하지만 error인 경우를 컨트롤함. 이 경우 이전 대화를 모두 날리고 대화를 종료.
      if(decoded?.error){
        console.log("API Error");
        buffer = buffer + "\n" + "Status: " + decoded.error.status + "\n" + "Code: " + decoded.error.code; 
        setMessages(prev => {
          let newMessages = [...prev];
          newMessages[newMessages.length - 1] = {role: "model", parts: [{ text: buffer }]};
          return newMessages; 
        });
        break;
      }
      if(decoded?.candidates?.[0]?.content?.parts?.[0]?.text){
        const { role, parts } = decoded.candidates[0].content; //해석한 객체에서 역할과 텍스트를 뽑아옴
        buffer = buffer + parts[0].text;
        setMessages(prev => {
          let newMessages = [...prev];
          newMessages[newMessages.length - 1] = {role, parts: [{ text: buffer }]};
          return newMessages;
        });
      }
    }
    setHistory(prev => [...prev, {role: "model", parts: [{ text: buffer }]}] );

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
