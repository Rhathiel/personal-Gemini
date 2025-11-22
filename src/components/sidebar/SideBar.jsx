import { useState, useEffect} from 'react';
import PopupMenu from './PopupMenu.jsx';
import {
  Overlay,
  StyledOpenButton,
  StyledInput,
  StyledSideBar,
  StyledNewChatButton,
  StyledButton,
  StyledChatList,
  StyledChatListItem,
} from "./sidebar.styled.jsx";

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
      mode: "home",
      sessionId: null
    }))
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
      setUiState(prev => ({
        ...prev,
        mode: "home",
        sessionId: null,
      }))
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