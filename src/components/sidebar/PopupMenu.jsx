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

function PopupMenu ({isClosed, setEditing, setInput, menu}){

  return createPortal(
    <>
      <Closer onClick={isClosed}/>
      <MenuWrapper x={menu.x} y={menu.y}>
        <button onClick={() => {
          //부모-자식이 동시에 랜더 큐에 잡히면, 자식은 항상 우선적으로 랜더된다.
          //즉, 동시에 큐에 진입하더라도 순서에 따라 예약 순서가 바뀌므로 자식 컴포넌츠의 상태 변경이 우선적으로 오게 한다.
          isClosed();
          setEditing({sessionId: menu.sessionId, isEditing: true});
          setInput(menu.title);
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