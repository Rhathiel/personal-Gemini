import { useState, useEffect} from 'react';
import Chat from './components/chat/Chat.tsx'
import ChatHome from './components/chat/ChatHome.tsx';
import LoadingScreen from './components/chat/LoadingScreeen.tsx'
import SideBar from './components/sidebar/SideBar.tsx';
import Monitor from './components/monitor/Monitor.tsx';
import * as storage from './lib/storage.ts'
import * as utils from './lib/utils.ts'

function App() {

  const [uiState, setUiState] = useState<UiState>(() => {
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
  const [sessionList, setSessionList] = useState<Array<session>>([]);
  const [newSession, setNewSession] = useState<NewSession>({
    sessionId: null,
    prompt: null,
    isNewSession: false
  });

  //버전
  useEffect(() => {
    console.log("version: 1.2.3");
  }, []);

  //SessionList 갱신 로직
  useEffect(() => {
    (async () => {
      const list = await storage.loadSessionList(); 
      setSessionList(list);
    })();
  }, []);

  //uiState 저장 로직
  useEffect(() => {
    sessionStorage.setItem("uiState", utils.stringifyJson(uiState));
  }, [uiState]); 

  //Main Renderer
  const Main = () => {
    switch (uiState.mode) {
      case "home":
        return <ChatHome setNewSession={setNewSession}/>;
      case "session":
        return <Chat uiState={uiState} 
                setUiState={setUiState}
                newSession={newSession}
                setNewSession={setNewSession}
                setSessionList={setSessionList}/>;
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
