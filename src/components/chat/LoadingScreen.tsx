import {Div} from './Chat.styled.tsx'

function LoadingScreen (){
    return (<Div>
    </Div>)
}

export default LoadingScreen;

//일단은 renderer default에 걸려있긴 한데.. 좀더 홣용방안을 생각해야할듯.

//일단 지금 방식처럼 unmount - mount는 개애바고, MainView에 loading state를 두고 js문으로 오버레이 하면 될듯.