"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

function FloatingBoxes() {
  const groupRef = useRef(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) {
      return;
    }

    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.25;

    groupRef.current.children.forEach((child, index) => {
      child.position.y = Math.sin(t * 1.2 + index) * 0.15;
    });
  });

  return (
    <group ref={groupRef}>
      <mesh position={[-1.1, 0, 0]}>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial color="#16b4a2" />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial color="#2563eb" />
      </mesh>
      <mesh position={[1.1, -0.1, 0]}>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
    </group>
  );
}

export default function VariableBoxes3D() {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-slate-700">Variable Storage Visual</p>
      <div className="h-44 w-full">
        <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 5], fov: 40 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 3, 4]} intensity={0.9} />
          <FloatingBoxes />
        </Canvas>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-slate-600">
        <p className="rounded bg-brand-50 px-2 py-1">name</p>
        <p className="rounded bg-sky-50 px-2 py-1">age</p>
        <p className="rounded bg-amber-50 px-2 py-1">marks</p>
      </div>
    </div>
  );
}
