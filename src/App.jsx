import { useState, useEffect, useRef } from 'react';
import Chat from './components/chat/Chat.jsx'
import ChatHome from './components/chat/ChatHome.jsx';
import LoadingScreen from './components/chat/LoadingScreeen.jsx'
import SideBar from './components/sidebar/SideBar.jsx';
import Monitor from './components/monitor/Monitor.jsx';
import styled from 'styled-components';
import * as storage from './lib/storage.jsx'
import * as utils from './lib/utils.jsx'

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
`;

function App() {

  const [isAppLoading, setAppIsLoading] = useState(true);

  const [uiState, setUiState] = useState({
    mode: null,
    sessionId: null,
    sideIsOpened: false
  });
  const [chatList, setChatList] = useState([]);

  //버전
  useEffect(() => {
    console.log("version: 1.2.3");
  }, []);

  //갱신 로직
  useEffect(() => {
    const obj = utils.parseText(sessionStorage.getItem("uiState"));
    console.log(obj);
    if(obj){
      setUiState(obj);
    } else {
      setUiState({
        mode: "home",
        sessionId: "null",
        sideIsOpened: false
      })
    }
  }, []); 
  useEffect(() => {
    (async () => {
      const list = await storage.loadSessionList();  
      console.log("sessionList: ", list);
      setChatList(list);
    })();
    setAppIsLoading(false);
  }, []);

  //저장 로직
  useEffect(() => {
    if(isAppLoading === true){
      return;
    }
    sessionStorage.setItem("uiState", utils.stringifyJson(uiState));
  }, [uiState]); 
  useEffect(() => {
    (async () => {
      if(isAppLoading === true){
        return;
      }
      await storage.saveSessionList(chatList);
    })();

  }, [chatList])

  //Main Renderer
  const Main = () => {
    switch (uiState.mode) {
      case "home":
        return <ChatHome/>;
      case "session":
        return <Chat/>;
      default:
        return <LoadingScreen/>;
    }
  };

  return (
    <>
      {isAppLoading && <Overlay />}
      <SideBar uiState={uiState} setUiState={setUiState} chatList={chatList} setChatList={setChatList}/>
      <Main/>
      <Monitor />
    </>
  )
}

export default App
