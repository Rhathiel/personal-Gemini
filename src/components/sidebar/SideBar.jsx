import { useState } from 'react';
import styled from 'styled-components'

let StyledSideBar = styled.div`
    top: 0;
    left: 0;
    transform: translateX(-200px);
    width: 300px;
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
    width: 240px;
    margin: 100px auto 0px auto;
    border-radius: 16px;
    border: 0px;
    background: #151515ff;  

    &:hover {
        background: #6c6c6c3f;    
    }

    &:active {
        background: #3636363f;
    }
`;

function SideBar({setNewChat}) {

  const activeClick = () => {
    setNewChat(true);
  }

  return (
    <StyledSideBar>
      <StyledNewChatButton1 type="button" onClick={activeClick}>새 채팅</StyledNewChatButton1>
    </StyledSideBar>
  );
}

export default SideBar;