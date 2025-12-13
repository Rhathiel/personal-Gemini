import { useEffect } from 'react';
import SideBar from './components/sidebar/SideBar.tsx';
import Monitor from './components/monitor/Monitor.tsx';
import MainView from './components/MainView.tsx';

function App() {

  //버전
  useEffect(() => {
    console.log("version: 1.2.3");
  }, []);

  return (
    <>
      <SideBar/>
      <MainView/>
      <Monitor/>
    </>
  );
}



export default App
