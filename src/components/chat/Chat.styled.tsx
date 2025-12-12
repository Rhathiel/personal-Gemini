import styled from 'styled-components'

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

const StyledSessionInput = styled.input`
    width: 90%;
    margin = 10px auto 10px auto;
    border-radius: 16px;
`;

const StyledHomeInput = styled.input`
    width: 90%;
    margin = 10px auto 10px auto;
    border-radius: 16px;
`;

export {
    Div,
    StyledSessionInput,
    StyledHomeInput
}