import { useState, useEffect} from 'react';
import styled from 'styled-components';
import PopupMenu from './PopupMenu.jsx';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
`;

const StyledOpenButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #151515;
  border: none;
  color: white;
  cursor: pointer;
  position: fixed;
  top: 17px;
  left: 17px;
  z-index: 9999;
  font-size: 15px;
  &:hover {
    background: #2a2a2a;
  }
  &:active {
    background: #000000;
  }
`;

const StyledInput = styled.input`
  position: absolute;
  z-index: 9999;
`;

let StyledSideBar = styled.div`
    left: 0;
    top: 0;
    width: 250px;
    height: 100%;
    background: #151515ff;
    position: fixed;
    overflow-y: auto;
    transition: transform 0.6s;

    transform: ${({$isOpened}) => ($isOpened ? 'translateX(0px)' : 'translateX(-170px)')};
`;

let StyledNewChatButton = styled.button`
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

let StyledButton = styled.button`
    display: block;
    width: 90%;
    border-radius: 50px;
    border: 0px;
    background: rgba(0, 0, 0, 0);
`;

let StyledChatList = styled.div`
`;

let StyledChatListItem = styled.div`
  background: ${({$currentSessionId, $selectedSessionId, $isHover, $onClick, $interactionSessionId}) => 
    ($currentSessionId === $selectedSessionId? 
      '#6c6c6c3f' 
      : (($onClick) && ($currentSessionId === $interactionSessionId) ? 
        '#3636363f' 
        : (($isHover) && ($currentSessionId === $interactionSessionId) ? 
          '#6c6c6c3f' 
          : '#151515ff'))    
    )
  };
`;


function SideBar({uiState, setUiState, chatList, setChatList}) {
  const [input, setInput] = useState("");
  const [interactionListItemState, setInteractionListItemState] = useState({
    isHover: false,
    onClick: false,
    sessionId: null,
  });
  const [editState, setEditState] = useState({
    sessionId: null,
    isEditing: false
  });
  const [menuState, setMenuState] = useState({
    x: 0, y: 0, visiable: false, sessionId: null, title: null
  });

  const activeClick = async () => {
    setUiState(prev => ({
      ...prev,
      mode: "home"
    }))

    const newChat = {
      title: "웅히히",
      sessionId: crypto.randomUUID()
    }

    setChatList(prev => {
      const list = [...prev];
      list.push(newChat);
      return list;
    })
  };

  const activeEnter = (e, sessionId) => {
    if(e.key === "Enter"){
      editTitle(input, sessionId);
      setEditState({ sessionId: null, isEditing: false });
      setInput("");
    }
  };

  const editTitle = async (input, sessionId) => {
    setChatList(prev => {
      const list = [...prev];
      const index = list.findIndex(item => item.sessionId === sessionId)
      list[index] = {
        title: input,
        sessionId: sessionId
      };
      return list
    })
  };

  const onOpen = (e, sessionId, title) => {
    const rect = e.target.getBoundingClientRect();
    setMenuState({
      x: rect.left,
      y: rect.bottom,
      visiable: true,
      sessionId: sessionId,
      title: title
    })
  };

  const onClose = (e) => {
    setMenuState({
      x: 0,
      y: 0,
      visiable: false,
      sessionId: null,
      title: null
    })
  };

  const onRemove = async (sessionId) => {
    if(sessionId === uiState.sessionId){
      setUiState({
        ...prev,
        mode: "home",
        sessionId: null,
      })
    }
    setChatList(prev => {
      const list = [...prev];
      const index = list.findIndex(item => item.sessionId === sessionId);
      list.splice(index, 1);
      return list;
    })
  };

  return (
    <>
      <StyledOpenButton onClick={() => setUiState(prev => ({
        ...prev,
        sideIsOpened: !prev.sideIsOpened
      }))}>
        ☰
      </StyledOpenButton>
      <StyledSideBar $isOpened={uiState.sideIsOpened}>

        <StyledNewChatButton type="button" onClick={activeClick}>
          새 채팅
        </StyledNewChatButton>
        <StyledChatList>
          {chatList.map((chat) => (
            <StyledChatListItem key={chat.sessionId} 
            $isHover={interactionListItemState.isHover} 
            $onClick={interactionListItemState.onClick} 
            $selectedSessionId={uiState.sessionId} 
            $currentSessionId={chat.sessionId} 
            $interactionSessionId={interactionListItemState.sessionId}>
              {!(editState.isEditing && editState.sessionId === chat.sessionId) && 
              <StyledButton onClick={() => {
                setUiState(prev => ({
                  ...prev,
                  sessionId: chat.sessionId,
                  mode: "session"
                }))
              }} 
                onMouseEnter={() => setInteractionListItemState(prev => ({
                  ...prev,
                  isHover: true,
                  sessionId: chat.sessionId
                }))}
                onMouseLeave={() => setInteractionListItemState(prev => ({
                  ...prev,
                  isHover: false,
                  sessionId: null
                }))}
                onMouseDown={() => setInteractionListItemState(prev => ({
                  ...prev,
                  onClick: true,
                  sessionId: chat.sessionId
                }))}                
                onMouseUp={() => setInteractionListItemState(prev => ({
                  ...prev,
                  onClick: false,
                  sessionId: null
                }))}>                
                {chat.title}
              </StyledButton>}
              {(editState.isEditing && editState.sessionId === chat.sessionId) &&           
                <>
                  <Overlay onClick={() => {
                    setEditState({sessionId: null, isEditing: false});
                  }}/>
                  <StyledInput type="text" value={input} onChange={(e) => setInput(e.target.value)} 
                  onKeyDown={(e) => activeEnter(e, chat.sessionId)}/>
                </>
              }
              <button onClick={(e) => {onOpen(e, chat.sessionId, chat.title)}}>
                메뉴
              </button>
            </StyledChatListItem>
          ))}
        </StyledChatList>
      </StyledSideBar>
      {menuState.visiable && (<PopupMenu onClose={onClose}
      setEditState={setEditState} setInput={setInput} menuState={menuState} onRemove={onRemove}/>)}
    </>
  );
}

export default SideBar;