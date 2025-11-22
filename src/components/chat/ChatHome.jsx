import styled from 'styled-components';

const Div = styled.div`
  position: fixed;
  top: 5%;
  bottom: 5%;
  left: 300px;  
  right: 500px;    
  border-radius: 5%;
  background: #272727ff;
  z-index: 10;
`;

//새 채팅을 만들 수 있는 권한을 SideBar에서 ChatHome으로 옮겨야함.
//ChatHome에서 인풋 박스에 입력하는거 자체를 트리거로 삼자.

function ChatHome() {

    return (
        <Div>
            <h1>Welcome to Chat Home</h1>
            <p>Select a chat session from the sidebar or start a new chat.</p>
        </Div>
    );
}

export default ChatHome;