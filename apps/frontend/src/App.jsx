import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Scenario } from "./components/Scenario";
import { ChatInterface } from "./components/ChatInterface";

function App() {
  return (
    <>
      <Loader />
      <Leva collapsed hidden />

      <div className="w-screen h-screen flex bg-black">

        {/* AVATAR – 60% */}
        <div className="w-[60%] h-full relative">
          <Canvas shadows camera={{ position: [0, 0, 0], fov: 10 }}>
            <Scenario />
          </Canvas>
        </div>

        {/* CHAT – 40% */}
        <div className="w-[40%] h-full relative">
          <ChatInterface />
        </div>

      </div>
    </>
  );
}

export default App;
