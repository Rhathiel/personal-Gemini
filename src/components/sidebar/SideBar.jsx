import { useState, useEffect } from 'react';
import styled from 'styled-components'

let StyledSideBar = styled.div`
    left: 0;
    transform: translateX(-150px);
    width: 200px;
    height: 100%;
    background: #151515ff;
    position: fixed;
    overflow-y: auto;
    transition: transform 0.6s;

    &:hover {
        transform: translateX(0px);
    }
`;

let StyledNewChatButton1 = styled.button`
    display: block;
    height: 50px;
    width: 90%;
    margin: 100px auto 100px auto;
    border-radius: 50px;
    border: 0px;
    background: #151515ff;  

    &:hover {
        background: #6c6c6c3f;    
    }

    &:active {
        background: #3636363f;
    }
`;

function SideBar({setNewChat, setSelectedSessionId, selectedSessionId}) {
  const [chatList, setChatList] = useState([]);
  const [input, setInput] = useState("");
  const [editing, setEditing] = useState({
    sessionId: null,
    isEditing: false
  });

  useEffect(() => {
    const raw = localStorage.getItem("sessionList");
    const list = raw ? JSON.parse(raw) : [];
    setChatList(list);
  }, []);

  useEffect(() => {
    localStorage.setItem("sessionList", JSON.stringify(chatList));
  }, [chatList]);

  const activeEnter = (e, sessionId) => {
    if(e.key === "Enter"){
      editTitle(input, sessionId);
      setEditing({ sessionId: null, isEditing: false });
      setInput("");
    }
  }

  const editTitle = (input, sessionId) => {
    setChatList((prev) => {
      let newChatList = [...prev];
      const index = newChatList.findIndex(item => item.sessionId === sessionId);
      newChatList[index] = {
        title: input,
        sessionId: sessionId
      };
      return newChatList; 
    })
  }

  const activeClick = () => {
    setNewChat(true);
  }

  return (
    <StyledSideBar>
      <StyledNewChatButton1 type="button" onClick={activeClick}>
        새 채팅
      </StyledNewChatButton1>
        {chatList.map((chat) => (
          <div key={chat.sessionId}>
            {!(editing.isEditing && editing.sessionId === chat.sessionId) && <div onClick={() => {
              setSelectedSessionId(chat.sessionId);}}>
              {chat.title}
            </div>}
              {(editing.isEditing && editing.sessionId === chat.sessionId) && 
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => activeEnter(e, chat.sessionId)}/>}
            <button onClick={() => {
              setEditing({sessionId: chat.sessionId, isEditing: true});
              setInput(chat.title);
            }}>
              수정
            </button>
          </div>
        ))}
    </StyledSideBar>
  );
}

export default SideBar;