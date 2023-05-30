import { RigidBody, useRapier } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import { useState, useEffect, useRef } from "react";
import * as THREE from "three";

export default function Player() {
  const player = useRef();
  const [subscribeKeys, getKeys] = useKeyboardControls();
  const { rapier, world } = useRapier();

  const [smoothCameraPosition] = useState(() => new THREE.Vector3(10, 10, 100));
  const [smoothCameraTarget] = useState(() => new THREE.Vector3());

  const jump = () => {
    const origin = player.current.translation();
    origin.y -= 0.31;
    const direction = { x: 0, y: 1, z: 0 };
    const ray = new rapier.Ray(origin, direction);
    const rapierWorld = world.raw();
    const hit = rapierWorld.castRay(ray, 10, true);
    console.log(hit.toi);

    if (hit.toi < 0.001) player.current.applyImpulse({ x: 0, y: 0.5, z: 0 });
  };
  useEffect(() => {
    const unsubscribe = subscribeKeys(
      (state) => state.jump,
      (value) => {
        if (value) jump();
      }
    );
    return () => {
      unsubscribe();
    };
  }, []);
  useFrame((state, dt) => {
    const { forward, backward, leftward, rightward } = getKeys();

    // console.log(forward, backward, leftward, rightward);

    const force = { x: 0, y: 0, z: 0 };
    const spin = { x: 0, y: 0, z: 0 };
    const forceStrength = 0.6 * dt;
    const spinStrength = 0.2 * dt;
    if (forward) {
      force.z -= forceStrength;
      spin.x -= spinStrength;
    }
    if (backward) {
      force.z += forceStrength;
      spin.x += spinStrength;
    }
    if (leftward) {
      force.x -= forceStrength;
      spin.z += spinStrength;
    }
    if (rightward) {
      force.x += forceStrength;
      spin.z -= spinStrength;
    }
    player.current.applyImpulse(force);
    player.current.applyTorqueImpulse(spin);
    const playerPosition = player.current.translation();
    const cameraPosition = new THREE.Vector3();
    cameraPosition.copy(playerPosition);
    cameraPosition.z += 4.25;
    cameraPosition.y += 1.35;
    const cameraTarget = new THREE.Vector3();
    cameraTarget.copy(playerPosition);
    cameraTarget.y += 0.25;
    smoothCameraPosition.lerp(cameraPosition, 5 * dt);
    smoothCameraTarget.lerp(cameraTarget, 5 * dt);
    state.camera.position.copy(smoothCameraPosition);
    state.camera.lookAt(smoothCameraTarget);

    // console.log(player.current);
  });
  return (
    <RigidBody
      ref={player}
      colliders="ball"
      restitution={0.2}
      friction={1}
      position={[0, 1, 0]}
      linearDamping={0.5}
      angularDamping={0.5}
    >
      <mesh>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshStandardMaterial flatShading color="mediumpurple" />
      </mesh>
    </RigidBody>
  );
}
