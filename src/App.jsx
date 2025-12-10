import { useState, useEffect, useRef } from 'react';
import Chat from './components/chat/Chat.jsx'
import ChatHome from './components/chat/ChatHome.jsx';
import LoadingScreen from './components/chat/LoadingScreeen.jsx'
import SideBar from './components/sidebar/SideBar.jsx';
import Monitor from './components/monitor/Monitor.jsx';
import styled from 'styled-components';
import * as storage from './lib/storage.jsx'
import * as utils from './lib/utils.jsx'

function App() {

  const isSessionListRender = useRef(false);
  //sessionStorage inistial render 방지 flag

  const [uiState, setUiState] = useState(() => {
    const obj = utils.parseText(sessionStorage.getItem("uiState"));

    if(obj){
      return obj;
    } else {
      return {
        mode: "home",
        sessionId: "null",
        sideIsOpened: false
      }
    }
  });
  const [sessionList, setSessionList] = useState([]);


  //버전
  useEffect(() => {
    console.log("version: 1.2.3");
  }, []);

  //갱신 로직
  useEffect(() => {
    (async () => {
      const list = await storage.loadSessionList();  
      setSessionList(list);
    })();
    isSessionListRender.current = true; 
  }, []);

  //저장 로직
  useEffect(() => {
    sessionStorage.setItem("uiState", utils.stringifyJson(uiState));
  }, [uiState]); 
  useEffect(() => {
    (async () => {
      if(isSessionListRender.current === false){
        console.log("세션리스트저장실패!")
        return;
      }
      await storage.saveSessionList(sessionList);
    })();
  }, [sessionList])

  //Main Renderer
  const Main = () => {
    switch (uiState.mode) {
      case "home":
        return <ChatHome setSessionList={setSessionList} setUiState={setUiState} />;
      case "session":
        return <Chat uiState={uiState} />;
      default:
        return <LoadingScreen/>;
    }
  };

  return (
    <>
      <SideBar uiState={uiState} setUiState={setUiState} sessionList={sessionList} setSessionList={setSessionList}/>
      <Main/>
      <Monitor />
    </>
  )
}

export default App
