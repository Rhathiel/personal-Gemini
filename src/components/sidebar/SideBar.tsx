import { useState, useEffect } from 'react';
import PopupMenu from './PopupMenu.tsx';
import {
  Overlay,
  StyledOpenButton,
  StyledInput,
  StyledSideBar,
  StyledNewChatButton,
  StyledButton,
  StyledChatList,
  StyledChatListItem,
} from "./Sidebar.styled.js";
import * as storage from "../../lib/storage.ts";
import { useUiStateStore } from '../../stores/uiStateStore.ts';
import { useSessionStore } from '../../stores/sessionStore.ts';
import { useMessageStore } from '../../stores/messageStore.ts';

interface InteractionListItemState {
  isHover: boolean;
  onClick: boolean;
  sessionId: string | null;
}
export interface editState {
  sessionId: string | null;
  isEditing: boolean;
}
export interface menuState {
  x: number;
  y: number;
  visiable: boolean;
  data: session | null;
}

function SideBar() {
  const { uiState, setUiState, toggleSideIsOpened } = useUiStateStore();
  const { sessionList, setSessions, remSessionById, editSessionById } = useSessionStore();
  const { setMessages } = useMessageStore();
  const [input, setInput] = useState<string>("");
  const [interactionListItemState, setInteractionListItemState] = useState<InteractionListItemState>({
    isHover: false,
    onClick: false,
    sessionId: null,
  });
  const [editState, setEditState] = useState<editState>({
    sessionId: null,
    isEditing: false
  });
  const [menuState, setMenuState] = useState<menuState>({
    x: 0, y: 0, visiable: false, data: null
  });

  //SessionList 갱신 로직
  useEffect(() => {
    (async () => {
      const list = await storage.loadSessionList(); 
      setSessions(list);
    })();
  }, []);

  const activeClick = async () => {
    setUiState({ mode: "home", sessionId: null })
  };

  const activeEnter = (e: React.KeyboardEvent<HTMLInputElement>, data: session) => {
    if(e.key === "Enter"){
      editTitle(input, data);
      setEditState({ sessionId: null, isEditing: false });
      setInput("");
    }
  };

  const editTitle = async (input: string, oldData: session) => {
    const newData = {
      ...oldData,
      title: input
    }
    storage.editSession(oldData, newData)
    editSessionById(oldData.sessionId!, newData);
  };

  const onOpen = (e: React.MouseEvent<HTMLButtonElement>, data: session) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuState({
      x: rect.left,
      y: rect.bottom,
      visiable: true,
      data: data
    })
  };

  const onClose = () => {
    setMenuState({
      x: 0,
      y: 0,
      visiable: false,
      data: null
    })
  };

  const onRemove = async (data: session) => {
    if(data.sessionId === uiState.sessionId){
      setUiState({ mode: "home", sessionId: null });
      setMessages([]);
    }
    storage.deleteSession(data);
    storage.deleteMessages(data.sessionId);
    remSessionById(data.sessionId!);
  };

  return (
    <>
      <StyledOpenButton onClick={toggleSideIsOpened}>
        ☰
      </StyledOpenButton>
      <StyledSideBar $isOpened={uiState.sideIsOpened}>

        <StyledNewChatButton type="button" onClick={activeClick}>
          새 채팅
        </StyledNewChatButton>
        <StyledChatList>
          {sessionList.map((data) => (
            <StyledChatListItem key={data.sessionId} 
            $isHover={interactionListItemState.isHover} 
            $onClick={interactionListItemState.onClick} 
            $selectedSessionId={uiState.sessionId} 
            $currentSessionId={data.sessionId} 
            $interactionSessionId={interactionListItemState.sessionId}>
              {!(editState.isEditing && editState.sessionId === data.sessionId) && 
              <StyledButton onClick={() => {
                setMessages([]);
                setUiState({ mode: "session", sessionId: data.sessionId })
              }} 
                onMouseEnter={() => setInteractionListItemState(prev => ({
                  ...prev,
                  isHover: true,
                  sessionId: data.sessionId
                }))}
                onMouseLeave={() => setInteractionListItemState(prev => ({
                  ...prev,
                  isHover: false,
                  sessionId: null
                }))}
                onMouseDown={() => setInteractionListItemState(prev => ({
                  ...prev,
                  onClick: true,
                  sessionId: data.sessionId
                }))}                
                onMouseUp={() => setInteractionListItemState(prev => ({
                  ...prev,
                  onClick: false,
                  sessionId: null
                }))}>                
                {data.title}
              </StyledButton>}
              {(editState.isEditing && editState.sessionId === data.sessionId) &&           
                <>
                  <Overlay onClick={() => {
                    setEditState({sessionId: null, isEditing: false});
                  }}/>
                  <StyledInput type="text" value={input} onChange={(e) => setInput(e.target.value)} 
                  onKeyDown={(e) => activeEnter(e, data)}/>
                </>
              }
              <button onClick={(e) => {onOpen(e, data)}}>
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