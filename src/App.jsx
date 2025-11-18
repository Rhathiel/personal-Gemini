import { useEffect } from 'react';
import Chat from './components/chat/Chat.jsx';

function App() {
  useEffect(() => {
    console.log("version: 1.2.2");
  }, []);

  return (
    <div>
      <Chat />
    </div>
  )
}

export default App
