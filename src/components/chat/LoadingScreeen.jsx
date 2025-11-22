import styled from 'styled-components';

const Div = styled.div`
  position: fixed;
  top: 5%;
  bottom: 5%;
  left: 300px;  
  right: 500px;    
  border-radius: 5%;
  background: #272727ff;
  z-index: 10;
`;

function LoadingScreen (){
    return (<Div>
    </Div>)
}

export default LoadingScreen;