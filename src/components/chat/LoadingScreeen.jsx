import styled from 'styled-components';

const Div = styled.div`
  position: fixed;
  top: 5%;
  bottom: 5%;
  left: 240px;  
  right: 470px;    
  background: #705454ff;
  z-index: 10;
`;

function LoadingScreen (){
    return (<Div>
    </Div>)
}

export default LoadingScreen;