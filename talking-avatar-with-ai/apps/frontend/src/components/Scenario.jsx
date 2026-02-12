import { CameraControls, Environment } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { Avatar } from "./Avatar";

export const Scenario = () => {
  const cameraControls = useRef();

  useEffect(() => {
    if (cameraControls.current) {
      cameraControls.current.setLookAt(
        0, 2.2, 5,   // camera position
        0, 1.0, 0,   // look target
        true
      );
    }
  }, []);

  return (
    <>
      <CameraControls ref={cameraControls} />
      <Environment preset="sunset" />
      <Avatar />
    </>
  );
};
