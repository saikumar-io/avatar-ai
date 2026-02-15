import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { useSpeech } from "../hooks/useSpeech";
import facialExpressions from "../constants/facialExpressions";
import visemesMapping from "../constants/visemesMapping";
import morphTargets from "../constants/morphTargets";

export function Avatar(props) {
  const group = useRef();

  const { nodes, materials, scene } = useGLTF("/models/avatar.glb");
  const { animations } = useGLTF("/models/animations.glb");

  const {
    message,
    onMessageEnded,
  } = useSpeech();

  const { actions } = useAnimations(animations, group);

  const [lipsync, setLipsync] = useState(null);
  const [audio, setAudio] = useState(null);
  const [blink, setBlink] = useState(false);
  const [facialExpression, setFacialExpression] = useState("neutral");

  /* =========================================================
     🎭 ANIMATION LAYERS
     ========================================================= */

  // Base Idle animation – ALWAYS running
  useEffect(() => {
    if (!actions.Idle) return;

    actions.Idle.reset();
    actions.Idle.setLoop(THREE.LoopRepeat, Infinity);
    actions.Idle.fadeIn(0.5);
    actions.Idle.play();

    return () => actions.Idle?.fadeOut(0.5);
  }, []);

  // Talking animation – overlay
  useEffect(() => {
    if (!actions.Talking) return;

    if (message) {
      actions.Talking.reset();
      actions.Talking.setLoop(THREE.LoopRepeat, Infinity);
      actions.Talking.fadeIn(0.25);
      actions.Talking.play();
    } else {
      actions.Talking.fadeOut(0.25);
    }
  }, [message]);

  /* =========================================================
     🔊 AUDIO + LIPSYNC
     ========================================================= */
  useEffect(() => {
    if (!message) {
      setLipsync(null);
      setAudio(null);
      return;
    }

    setFacialExpression(message.facialExpression || "neutral");
    setLipsync(message.lipsync);

    const audioObj = new Audio(
      "data:audio/mp3;base64," + message.audio
    );

    setAudio(audioObj);

    audioObj.onended = () => {
      onMessageEnded();
      setLipsync(null);
      setAudio(null);
    };

    audioObj.play();
  }, [message]);

  /* =========================================================
     🧠 MORPH TARGET UTIL
     ========================================================= */
  const lerpMorphTarget = (target, value, speed = 0.1) => {
    scene.traverse((child) => {
      if (!child.isSkinnedMesh || !child.morphTargetDictionary) return;

      const index = child.morphTargetDictionary[target];
      if (index === undefined) return;

      child.morphTargetInfluences[index] =
        THREE.MathUtils.lerp(
          child.morphTargetInfluences[index],
          value,
          speed
        );
    });
  };

  /* =========================================================
     🎞 FRAME LOOP
     ========================================================= */
  useFrame(() => {
    // Facial expression
    morphTargets.forEach((key) => {
      if (key.includes("eyeBlink")) return;
      lerpMorphTarget(
        key,
        facialExpressions[facialExpression]?.[key] || 0,
        0.1
      );
    });

    // Blink
    lerpMorphTarget("eyeBlinkLeft", blink ? 1 : 0, 0.4);
    lerpMorphTarget("eyeBlinkRight", blink ? 1 : 0, 0.4);

    // Lip sync
    if (audio && lipsync) {
      const t = audio.currentTime;
      let activeViseme = null;

      for (const cue of lipsync.mouthCues) {
        if (t >= cue.start && t <= cue.end) {
          activeViseme = visemesMapping[cue.value];
          break;
        }
      }

      Object.values(visemesMapping).forEach((viseme) => {
        lerpMorphTarget(
          viseme,
          viseme === activeViseme ? 1 : 0,
          0.2
        );
      });
    }
  });

  /* =========================================================
     👁 BLINK LOOP
     ========================================================= */
  useEffect(() => {
    let timeout;
    const blinkLoop = () => {
      timeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => {
          setBlink(false);
          blinkLoop();
        }, 150);
      }, THREE.MathUtils.randInt(2500, 5000));
    };
    blinkLoop();
    return () => clearTimeout(timeout);
  }, []);

  /* =========================================================
     🧍 MODEL
     ========================================================= */
  return (
    <group {...props} ref={group} position={[0, -0.5, 0]} dispose={null}>
      <primitive object={nodes.Hips} />

      {Object.values(nodes).map(
        (node) =>
          node.isSkinnedMesh && (
            <skinnedMesh
              key={node.uuid}
              geometry={node.geometry}
              material={materials[node.material?.name]}
              skeleton={node.skeleton}
              morphTargetDictionary={node.morphTargetDictionary}
              morphTargetInfluences={node.morphTargetInfluences}
            />
          )
      )}
    </group>
  );
}

useGLTF.preload("/models/avatar.glb");
