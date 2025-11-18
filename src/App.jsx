import { useEffect } from 'react';

function App() {
  useEffect(() => {
    console.log("version: 1.2.1");
  }, []);

  return (
    <div>
      <Chat />
    </div>
  )
}

export default App
