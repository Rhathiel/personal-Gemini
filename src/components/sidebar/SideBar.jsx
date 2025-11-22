import { useState, useEffect} from 'react';
import styled from 'styled-components'
import * as storage from '../../lib/storage.jsx'
import PopupMenu from './PopupMenu.jsx';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
`;

const StyledInput = styled.input`
  position: absolute;
  z-index: 9999;
`;

let StyledSideBar = styled.div`
    left: 0;
    top: 0;
    transform: ${({$menu_visiable, $is_editing}) => {
      if($menu_visiable === false && $is_editing === false){
        return("translateX(-150px)")
      }else{
        return("translateX(0px)")
      }
    }};
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


function SideBar({setSelectedSession, isSelectedSession, setHome}) {
  const [chatList, setChatList] = useState([]);
  const [input, setInput] = useState("");
  const [interaction, setInteraction] = useState({
    isHover: false,
    onClick: false,
    sessionId: null
  });
  const [editing, setEditing] = useState({
    sessionId: null,
    isEditing: false
  });
  const [menu, setMenu] = useState({
    x: 0, y: 0, visiable: false, sessionId: null, title: null
  });

  useEffect(() => {
    chatListSync()
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
    setChatList(list);
    await storage.saveSessionList(list);

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

  const editTitle = async (input, sessionId) => {
    const list = await storage.loadSessionList();
    const index = list.findIndex(item => item.sessionId === sessionId);
    list[index] = {
      title: input,
      sessionId: sessionId
    };
    setChatList(list);
    await storage.saveSessionList(list);
  }

  const isOpened = (e, sessionId, title) => {
    const rect = e.target.getBoundingClientRect();
    setMenu({
      x: rect.left,
      y: rect.bottom,
      visiable: true,
      sessionId: sessionId,
      title: title
    })
  }

  const onClose = (e) => {
    setMenu({
      x: 0,
      y: 0,
      visiable: false,
      sessionId: null,
      title: null
    })
  }

  const onRemove = () => {

  } 

  return (
    <>
      <StyledSideBar $menu_visiable={menu.visiable} $is_editing={editing.isEditing}>
        <StyledNewChatButton type="button" onClick={activeClick}>
          새 채팅
        </StyledNewChatButton>
        <StyledChatList>
          {chatList.map((chat) => (
            <StyledChatListItem key={chat.sessionId} $isHover={interaction.isHover} $onClick={interaction.onClick} $selectedSessionId={isSelectedSession.sessionId}
             $currentSessionId={chat.sessionId} $interactionSessionId={interaction.sessionId}>
              {!(editing.isEditing && editing.sessionId === chat.sessionId) && <StyledButton onClick={() => 
                setSelectedSession({
                  sessionId: chat.sessionId,
                  isSelected: true
                })} 
                onMouseEnter={() => setInteraction(prev => ({
                  ...prev,
                  isHover: true,
                  sessionId: chat.sessionId
                }))}
                onMouseLeave={() => setInteraction(prev => ({
                  ...prev,
                  isHover: false,
                  sessionId: null
                }))}
                onMouseDown={() => setInteraction(prev => ({
                  ...prev,
                  onClick: true,
                  sessionId: chat.sessionId
                }))}                
                onMouseUp={() => setInteraction(prev => ({
                  ...prev,
                  onClick: false,
                  sessionId: null
                }))}>                
                {chat.title}
              </StyledButton>}
              {(editing.isEditing && editing.sessionId === chat.sessionId) &&           
                <>
                  <Overlay onClick={() => {
                    setEditing({sessionId: null, isEditing: false});
                  }}/>
                  <StyledInput type="text" value={input} onChange={(e) => setInput(e.target.value)} 
                  onKeyDown={(e) => activeEnter(e, chat.sessionId)}/>
                </>
              }
              <button onClick={(e) => {isOpened(e, chat.sessionId, chat.title)}}>
                메뉴
              </button>
            </StyledChatListItem>
          ))}
        </StyledChatList>
      </StyledSideBar>
      {menu.visiable && (<PopupMenu onClose={onClose}
      setEditing={setEditing} setInput={setInput} menu={menu} onRemove={onRemove}/>)}
    </>
  );
}

export default SideBar;