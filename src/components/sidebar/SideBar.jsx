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

let StyledChatList = styled.div`
`;

let StyledChatListItem = styled.div`
  background: #151515ff;
  background: ${(props) => (props.isSelected ? '#6c6c6c3f' : '#151515ff')};
`;

function SideBar({isNewChat, setNewChat, setSelectedSession, isSelectedSession, setHome}) {
  const [chatList, setChatList] = useState([]);
  const [input, setInput] = useState("");
  const [editing, setEditing] = useState({
    sessionId: null,
    isEditing: false
  });

  useEffect(() => {
    const raw = localStorage.getItem("sessionList");  
    console.log("raw sessionList: ", raw);
    const list = raw ? JSON.parse(raw) : []; 
    setChatList(list);
  }, []);

  //새 채팅 생성
  const activeClick = () => {
    setHome(false);
    setNewChat(true);
    const raw = localStorage.getItem("sessionList");  
    const list = raw ? JSON.parse(raw) : []; 
    const sessionId = crypto.randomUUID();
    const newChat = {
      sessionId: sessionId,
      title: "새 채팅"
    }
    list.push(newChat) //새 sessionList
    localStorage.setItem("sessionList", JSON.stringify(list));
    console.log("New Session Created: ", sessionId);
    const raw2 = localStorage.getItem("sessionList");
    console.log("Updated sessionList: ", raw2);
    setChatList(list);
    setNewChat(false);
    setSelectedSession({
      sessionId: sessionId,
      isSelected: true
    });
  }

  //채팅 제목 수정
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
          </StyledChatListItem>
        ))}
      </StyledChatList>
    </StyledSideBar>
  );
}

export default SideBar;