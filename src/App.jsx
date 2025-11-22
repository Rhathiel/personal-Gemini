import { useState, useEffect } from 'react';
import Chat from './components/chat/Chat.jsx'
import ChatHome from './components/chat/ChatHome.jsx';
import SideBar from './components/sidebar/SideBar.jsx';
import Monitor from './components/monitor/Monitor.jsx';

function App() {
  useEffect(() => {
    console.log("version: 1.2.2");
  }, []);

  const [isHome, setHome] = useState(true);
 
  const [isSelectedSession, setSelectedSession] = useState({
    sessionId: null,
    isSelected: false
  });
  
  return (
    <>
      <SideBar 
      setSelectedSession={setSelectedSession}
      isSelectedSession={isSelectedSession}
      setHome={setHome}
      />
      {isHome === true ? 
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
