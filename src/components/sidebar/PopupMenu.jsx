import {MenuWrapper, Overlay} from './Sidebar.styled.jsx'

function PopupMenu ({onClose, setEditState, setInput, menuState, onRemove}){

return(
  <>
    <Overlay onClick={onClose}/>
    <MenuWrapper x={menuState.x} y={menuState.y}>
      <button onClick={(e) => {
        setInput(menuState.title);
        setEditState({sessionId: menuState.sessionId, isEditing: true});
        onClose(e);
      }}>
        수정
      </button>
      <button onClick={(e) => {
        onRemove(menuState.sessionId);
        onClose(e);
      }}>
        삭제
      </button> 
    </MenuWrapper>
  </>
)}

export default PopupMenu;