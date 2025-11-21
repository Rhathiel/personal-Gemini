import {useState, useEffect} from 'react';
import styled from "styled-components";
import { createPortal } from "react-dom";

const MenuWrapper = styled.div`
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

const Closer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9998;
  background: rgba(0,0,0,0);
`;

function PopupMenu ({onClose, setEditing, setInput, menu}){

  return createPortal(
    <>
      <Closer onClick={onClose}/>
      <MenuWrapper x={menu.x} y={menu.y}>
        <button onClick={(e) => {
          setInput(menu.title);
          setEditing({sessionId: menu.sessionId, isEditing: true})
          onClose(e)
        }}>
          수정
        </button>
        <button onClick={() => {
        }}>
          삭제
        </button> 
      </MenuWrapper>
    </>, document.body
  )
}

export default PopupMenu;