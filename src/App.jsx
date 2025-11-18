import { useEffect } from 'react';
import Chat from './components/chat/chat.jsx';

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
