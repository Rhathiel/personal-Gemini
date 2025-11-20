import { useState, useEffect } from 'react';
import Chat from './components/chat/Chat.jsx';
import ChatHome from './components/chat/ChatHome.jsx';
import SideBar from './components/sidebar/SideBar.jsx';
import Monitor from './components/monitor/Monitor.jsx';
import styled from 'styled-components';

const Div = styled.div`
`;

function App() {
  useEffect(() => {
    localStorage.clear()
    console.log("version: 1.2.2");
  }, []);

  const [isHome, setHome] = useState(true);
 
  const [isSelectedSession, setSelectedSession] = useState({
    sessionId: null,
    isSelected: false
  });
  
  return (
    <Div>
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
    </Div>
  )
}

export default App
