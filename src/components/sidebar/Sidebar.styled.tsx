import { styled } from 'styled-components';

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

interface StyledSideBarProps {
    $isOpened: boolean;
}

const StyledSideBar = styled.div<StyledSideBarProps>`
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

const StyledNewChatButton = styled.button`
    display: block;
    height: 50px;
    width: 90%;
    margin: 100px auto 100px auto; 
    border-radius: 50px;
    border: 0px;
    background: #151515ff;  
    textcolor: white;
    color: white;

    &:hover {
        background: #6c6c6c3f;    
    }

    &:active {
        background: #3636363f;
    }
`;

const StyledButton = styled.button`
    color: white;
    display: block;
    width: 90%;
    border-radius: 50px;
    border: 0px;
    background: rgba(0, 0, 0, 0);
`;

const StyledChatList = styled.div`
`;

interface StyledChatListItemProps {
    $currentSessionId: string | null;
    $selectedSessionId: string | null;
    $isHover: boolean;
    $onClick: boolean;
    $interactionSessionId: string | null;
}

const StyledChatListItem = styled.div<StyledChatListItemProps>`
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

interface MenuWrapperProps {
    x: number;
    y: number;
}

const MenuWrapper = styled.div<MenuWrapperProps>`
  position: absolute;
  top: ${({ y }) => y}px;
  left: ${({ x }) => x}px;
  background: #1f1f1f;
  border-radius: 12px;
  padding: 8px 0;
  width: 200px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  z-index: 9999;
`;

export {
    Overlay,
    StyledOpenButton,
    StyledInput,
    StyledSideBar,
    StyledNewChatButton,
    StyledButton,
    StyledChatList,
    StyledChatListItem,
    MenuWrapper
};