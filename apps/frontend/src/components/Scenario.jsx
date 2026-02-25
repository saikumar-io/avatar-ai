import { CameraControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { Avatar } from "./Avatar";

export const Scenario = () => {
  const cameraControls = useRef(null);

  useEffect(() => {
    if (cameraControls.current) {
      cameraControls.current.setLookAt(
        0, 1.9, 4.2,
        0, 1.2, 0,
        true
      );
    }
  }, []);

  return (
    <>
      {/* NO background mesh at all */}

      {/* Lighting */}
      <ambientLight intensity={0.6} />

      <directionalLight
        position={[4, 5, 4]}
        intensity={1.3}
        color="#c5a059"
      />

      <directionalLight
        position={[-4, 3, 2]}
        intensity={0.6}
        color="#ffffff"
      />

      <pointLight
        position={[0, 3, -3]}
        intensity={0.5}
        color="#c5a059"
      />

      <CameraControls
        ref={cameraControls}
        enableZoom={false}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 3}
      />

      <Avatar />
    </>
  );
};