import { useEffect } from 'react';
import SideBar from './components/sidebar/SideBar.tsx';
import Monitor from './components/monitor/Monitor.tsx';
import * as utils from './lib/utils.ts'
import MainView from './components/MainView.tsx';
import { useUiStateStore } from './stores/uiStateStore.ts';

function App() {
  const { uiState, setUiState } = useUiStateStore();

  setUiState({mode: "session"});

  //버전
  useEffect(() => {
    console.log("version: 1.2.3");
  }, []);

  //uiState 저장 로직
  useEffect(() => {
    sessionStorage.setItem("uiState", utils.stringifyJson(uiState));
  }, [uiState]); 

  return (
    <>
      <SideBar/>
      <MainView/>
      <Monitor/>
    </>
  );
}



export default App
