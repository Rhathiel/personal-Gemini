import { Canvas } from '@react-three/fiber';
import { MMDLoader } from 'three/examples/jsm/loaders/MMDLoader';
import { Suspense } from 'react';
import { useLoader } from '@react-three/fiber';
import styled from 'styled-components';

const Div = styled.div`
    top: 50%;
    height: 100%;
`;

function MmdModel({ url }) {
    const nodes = useLoader(MMDLoader, url)
    return <primitive object={nodes} dispose={null} />
}

function Monitor() {

    return (
        <Div>
            <Canvas camera={{ position: [0, 10, 30], fov: 40 }}>
                <ambientLight intensity={1} />
                <directionalLight position={[10, 10, 10]} intensity={1} />
                <Suspense fallback={null}>
                    <MmdModel url="/personal-Gemini/model/PMX/kanata.pmx"/>
                </Suspense>
            </Canvas>
        </Div>
    );
}

export default Monitor;