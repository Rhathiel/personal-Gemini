import { useState, useEffect, useRef } from 'react';
import Chat from './components/chat/Chat.jsx'
import ChatHome from './components/chat/ChatHome.jsx';
import LoadingScreen from './components/chat/LoadingScreeen.jsx'
import SideBar from './components/sidebar/SideBar.jsx';
import Monitor from './components/monitor/Monitor.jsx';
import * as utils from './lib/utils.jsx'

function App() {

  const firstRender = useRef(true);
  //랜더 이후에도 값을 유지하고 state처럼 새로고침 시 초기화가 되는 useRef의 성질을 활용하여
  //첫번째 랜더 여부를 감지 가능함.

  const [isHome, setHome] = useState(null);
  const [isSelectedSession, setSelectedSession] = useState({
    sessionId: null,
    isSelected: false
  });

  useEffect(() => {
    console.log("version: 1.2.3");
  }, []);

  useEffect(() => {
    const obj = utils.parseText(sessionStorage.getItem("uiState"));
    if(obj){
      setHome(obj.isHome);
      setSelectedSession(obj.isSelectedSession);
    } 
  }, []); 

  useEffect(() => {
    if(firstRender.current === true){
      firstRender.current = false;
      return;
    }
    sessionStorage.setItem("uiState", utils.stringifyJson({
      isHome: isHome,
      isSelectedSession: isSelectedSession
    }));
  }, [isHome, isSelectedSession]); 

  return (
    <>
      <SideBar 
      setSelectedSession={setSelectedSession}
      isSelectedSession={isSelectedSession}
      setHome={setHome}
      />
      {isHome === null ? <LoadingScreen /> :
        isHome === true ? 
        <ChatHome />: 
        <Chat  
        setSelectedSession={setSelectedSession}
        selectedSession={isSelectedSession}
        />
      }
      <Monitor />
    </>
  )
}

export default App
