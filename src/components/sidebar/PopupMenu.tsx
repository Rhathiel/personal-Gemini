import {MenuWrapper, Overlay} from './Sidebar.styled.tsx';
import type { editState, menuState } from './SideBar.tsx';

interface PopupMenuProps {
  onClose: () => void;
  setEditState: React.Dispatch<React.SetStateAction<editState>>;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  menuState: menuState;
  onRemove: (data: session) => void;
}

function PopupMenu ({onClose, setEditState, setInput, menuState, onRemove}: PopupMenuProps) {

return(
  <>
    <Overlay onClick={onClose}/>
    <MenuWrapper x={menuState.x} y={menuState.y}>
      <button onClick={() => {
        setInput(menuState.data!.title);
        setEditState({sessionId: menuState.data!.sessionId, isEditing: true});
        onClose();
      }}>
        수정
      </button>
      <button onClick={() => {
        onRemove(menuState.data!);
        onClose();
      }}>
        삭제
      </button> 
    </MenuWrapper>
  </>
)}

export default PopupMenu;