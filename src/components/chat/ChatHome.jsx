import {Div} from './chat.styled.jsx'
import {ChatSessionInputBox} from './ChatSessionInputBox.jsx'

//새 채팅을 만들 수 있는 권한을 SideBar에서 ChatHome으로 옮겨야함.
//ChatHome에서 인풋 박스에 입력하는거 자체를 트리거로 삼자.
//ChatHome과 Chat은 서로 독립된 객체, 
//ChatHome에서 sessuionId와 messages 배열을 만들고
//DB에 각각 따로 저장한다 (직접)
//setUiState로 sessionId 변경, home끄고, setChatList로 List
//이 때, Chat으로 화면이 바뀌고, Chat은 당장 받은 것들 기준으로 랜더링하려고 할것.
//그러면 Home에서 입력한 값이 Chat으로 올라간다. (이건 useEffect에서 의존성배열 해야할듯)
//새 session을 띄우라는 명령 state를 만들고 갱신하도록 하면 될듯.
//그러면 prompt와 명령(불리언)을 담은 객체를 App에서 만들어서 쏴주는 느낌으로 가자.
//Chat에서 모두 처리하는거지
//이때 prompt 유무로 새 채팅 생성인지, 기존 채팅 호출인지를 조건분기하면 될듯.


function ChatHome({setChatList, setUiState, setChatCommand}) {



    return (
        <Div>
            <h1>Welcome to Chat Home</h1>
            <p>Select a chat session from the sidebar or start a new chat.</p>
            <ChatSessionInputBox sendPrompt={sendPrompt} uiState={uiState} />
        </Div>
    );
}

export default ChatHome;