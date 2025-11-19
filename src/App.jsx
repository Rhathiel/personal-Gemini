import { useState, useEffect } from 'react';
import Chat from './components/chat/Chat.jsx';
import SideBar from './components/sidebar/SideBar.jsx';
import Monitor from './components/monitor/Monitor.jsx';
import styled from 'styled-components';

const Div = styled.div`
`;

function App() {
  useEffect(() => {
    console.log("version: 1.2.2");
  }, []);

  const [isNewChat, setNewChat] = useState(false);
  
  return (
    <Div>
      <SideBar setNewChat={setNewChat} />
      <Chat isNewChat={isNewChat}/>
      <Monitor />
    </Div>
  )
}

export default App
