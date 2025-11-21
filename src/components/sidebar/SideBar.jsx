import { useState, useEffect } from 'react';
import styled from 'styled-components'
import * as storage from '../../lib/storage.jsx'

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
let StyledChatList = styled.div`
`;
let StyledChatListItem = styled.div`
  background: #151515ff;
  background: ${(props) => (props.isSelected ? '#6c6c6c3f' : '#151515ff')};
`;

function SideBar({setSelectedSession, isSelectedSession, setHome}) {
  const [chatList, setChatList] = useState([]);
  const [input, setInput] = useState("");
  const [editing, setEditing] = useState({
    sessionId: null,
    isEditing: false
  });

  useEffect(() => {
    chatListSync();
  }, []);

  const activeClick = async () => {
    setHome(false); 
    const sessionId = crypto.randomUUID();
    const newChat = {
      sessionId: sessionId,
      title: "새 채팅"
    }

    const list = await storage.loadSessionList();
    list.push(newChat);
    console.log(list);
    await storage.saveSessionList(list);
    setChatList(list);

    setSelectedSession({
      sessionId: sessionId,
      isSelected: true
    });
  }

  const chatListSync = async () => {
    const list = await storage.loadSessionList();  
    console.log("sessionList: ", list);
    setChatList(list);
  }

  const activeEnter = (e, sessionId) => {
    if(e.key === "Enter"){
      editTitle(input, sessionId);
      setEditing({ sessionId: null, isEditing: false });
      setInput("");
    }
  }

  const editTitle = (input, sessionId) => {
    setChatList(async (prev) => {
      let newChatList = [...prev];
      const index = newChatList.findIndex(item => item.sessionId === sessionId);
      newChatList[index] = {
        title: input,
        sessionId: sessionId
      };
      await storage.saveSessionList(newChatList);
      return newChatList; 
    })
  }

  return (
    <StyledSideBar>
      <StyledNewChatButton1 type="button" onClick={activeClick}>
        새 채팅
      </StyledNewChatButton1>
      <StyledChatList>
        {chatList.map((chat) => (
          <StyledChatListItem key={chat.sessionId} $isSelected={isSelectedSession.sessionId === chat.sessionId}>
            {!(editing.isEditing && editing.sessionId === chat.sessionId) && <div onClick={() => {
              setSelectedSession({
                sessionId: chat.sessionId,
                isSelected: true
              });}}>
              {chat.title}
            </div>}
              {(editing.isEditing && editing.sessionId === chat.sessionId) && 
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => activeEnter(e, chat.sessionId)}/>}
            <button onClick={() => {
              if(editing.isEditing && editing.sessionId === chat.sessionId){
                setEditing({sessionId: null, isEditing: false});
              }else{
                setEditing({sessionId: chat.sessionId, isEditing: true});
                setInput(chat.title);
              }
            }}>
              수정
            </button>
            <button onClick={() => {
            }}>
              삭제
            </button>
          </StyledChatListItem>
        ))}
      </StyledChatList>
    </StyledSideBar>
  );
}

export default SideBar;