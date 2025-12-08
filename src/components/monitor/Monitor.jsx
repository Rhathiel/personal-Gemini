import { Canvas } from '@react-three/fiber';
import { MMDLoader } from 'three/examples/jsm/loaders/MMDLoader';
import { Suspense } from 'react';
import { useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import styled from 'styled-components';

const Div = styled.div`
    top: 5%;
    right: 2.5%;
    bottom: 5%;
    width: 400px;
    position: fixed;
    border-radius: 50px;
    
    background: #2f2e2eff;
    z-index: 2;
`;

function MmdModel({ url }) {
    const nodes = useLoader(MMDLoader, url)
    return <primitive object={nodes} dispose={null} />
}

function Monitor() {

    return (
        <Div>
            <Canvas camera={{ position: [0, 30, 30], fov: 45 }}>
                <ambientLight intensity={1} />
                <directionalLight position={[10, 10, 10]} intensity={1} />
                    <OrbitControls
                    enableDamping
                    dampingFactor={0.1}
                    enablePan={true}
                    enableZoom={true}
                    target={[0, 10, 0]} // 모델 중심 쪽으로 맞추고 싶으면 여기 값 조정
                    />
                <Suspense fallback={null}>
                    <MmdModel url="/personal-Gemini/model/PMX/kanata.pmx"/>
                </Suspense>
            </Canvas>
        </Div>
    );
}

export default Monitor;