"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

function PythonCube() {
  const cubeRef = useRef(null);

  useFrame((state, delta) => {
    if (!cubeRef.current) {
      return;
    }
    cubeRef.current.rotation.x += delta * 0.2;
    cubeRef.current.rotation.y += delta * 0.35;
    cubeRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.15;
  });

  return (
    <mesh ref={cubeRef} castShadow>
      <boxGeometry args={[1.8, 1.8, 1.8]} />
      <meshStandardMaterial color="#1d4ed8" metalness={0.15} roughness={0.45} />
    </mesh>
  );
}

export default function Hero3D() {
  return (
    <div className="h-[300px] w-full sm:h-[380px] lg:h-[440px]">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 3, 2]} intensity={1.1} />
        <pointLight position={[-2, -1, 3]} intensity={0.8} color="#f59e0b" />
        <PythonCube />
      </Canvas>
    </div>
  );
}
