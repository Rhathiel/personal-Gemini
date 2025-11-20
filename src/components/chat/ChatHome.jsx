import styled from 'styled-components';

const Div = styled.div`
  position: fixed;
  top: 5%;
  bottom: 5%;
  left: 240px;  
  right: 470px;    
  background: #705454ff;
  z-index: 10;
`;

function ChatHome() {

    return (
        <Div>
            <h1>Welcome to Chat Home</h1>
            <p>Select a chat session from the sidebar or start a new chat.</p>
        </Div>
    );
}

export default ChatHome;