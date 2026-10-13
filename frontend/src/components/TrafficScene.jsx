
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Car({ position, color = "#2563eb", scale = 1, speed = 1 }) {
  const ref = useRef();
  const wheels = useRef([]);

  useFrame((state, delta) => {
    if (!ref.current) return;

    ref.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 2 * speed) * 0.025;

    wheels.current.forEach((wheel) => {
      if (wheel) wheel.rotation.x += delta * 2.5 * speed;
    });
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh castShadow position={[0, 0.43, 0]}>
        <boxGeometry args={[1.65, 0.35, 2.6]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.23} />
      </mesh>

      <mesh castShadow position={[0, 0.78, -0.2]}>
        <boxGeometry args={[1.13, 0.45, 1.25]} />
        <meshPhysicalMaterial
          color="#173b5d"
          metalness={0.6}
          roughness={0.18}
          clearcoat={1}
        />
      </mesh>

      {[-0.53, 0.53].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.47, 1.32]}>
            <boxGeometry args={[0.35, 0.09, 0.04]} />
            <meshBasicMaterial color="#dff7ff" />
          </mesh>

          <mesh position={[x, 0.47, -1.32]}>
            <boxGeometry args={[0.36, 0.09, 0.04]} />
            <meshBasicMaterial color="#ff234f" />
          </mesh>
        </group>
      ))}

      {[
        [-0.77, 0.22, 0.75],
        [0.77, 0.22, 0.75],
        [-0.77, 0.22, -0.75],
        [0.77, 0.22, -0.75],
      ].map((p, i) => (
        <mesh
          key={i}
          ref={(el) => (wheels.current[i] = el)}
          position={p}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.25, 0.25, 0.18, 24]} />
          <meshStandardMaterial color="#080d16" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function City() {
  const buildings = useMemo(() => {
    let seed = 91;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    return Array.from({ length: 58 }, (_, i) => ({
      x: (i % 2 ? 1 : -1) * (8 + rand() * 10),
      z: -48 + Math.floor(i / 2) * 3.5,
      h: 2 + rand() * 9,
      w: 1.2 + rand() * 1.8,
    }));
  }, []);

  return buildings.map((b, i) => (
    <group key={i} position={[b.x, b.h / 2, b.z]}>
      <mesh>
        <boxGeometry args={[b.w, b.h, b.w * 0.8]} />
        <meshStandardMaterial
          color={i % 3 ? "#dfeaf6" : "#c3d9f7"}
          metalness={0.4}
          roughness={0.75}
        />
      </mesh>

      {Array.from({ length: Math.floor(b.h) }, (_, j) => (
        <mesh
          key={j}
          position={[0, -b.h / 2 + j + 0.6, b.w * 0.405]}
        >
          <boxGeometry args={[b.w * 0.45, 0.045, 0.015]} />
          <meshBasicMaterial
            color={i % 4 === 0 ? "#38bdf8" : "#1d4ed8"}
            transparent
            opacity={0.75}
          />
        </mesh>
      ))}
    </group>
  ));
}

function Road() {
  const dashes = useRef([]);

  useFrame((_, delta) => {
    dashes.current.forEach((dash) => {
      if (!dash) return;
      dash.position.z += delta * 11;
      if (dash.position.z > 7) dash.position.z = -49;
    });
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -18]}>
        <planeGeometry args={[13, 100]} />
        <meshStandardMaterial color="#dfeaf8" roughness={0.75} metalness={0.25} />
      </mesh>

      {[-6.2, 6.2].map((x) => (
        <mesh
          key={x}
          position={[x, 0.005, -18]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.08, 100]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      ))}

      {[-2, 2].flatMap((x, lane) =>
        Array.from({ length: 15 }, (_, i) => (
          <mesh
            key={`${lane}-${i}`}
            ref={(el) => (dashes.current[lane * 15 + i] = el)}
            position={[x, 0.01, -49 + i * 4]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[0.07, 1.7]} />
            <meshBasicMaterial color="#bfdbfe" />
          </mesh>
        ))
      )}
    </group>
  );
}

function Particles() {
  const ref = useRef();

  const positions = useMemo(() => {
    const arr = new Float32Array(450 * 3);
    for (let i = 0; i < 450; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 35;
      arr[i * 3 + 1] = Math.random() * 13;
      arr[i * 3 + 2] = -45 + Math.random() * 50;
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.009;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.15;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#60a5fa"
        size={0.055}
        transparent
        opacity={0.7}
      />
    </points>
  );
}

function Scene() {
  const group = useRef();

  useFrame((state, delta) => {
    if (!group.current) return;

    const scrollProgress = window.scrollY / Math.max(window.innerHeight, 1);
    const scrollSway = Math.sin(scrollProgress * 0.45) * 0.025;
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      state.pointer.x * 0.035 + scrollSway,
      2,
      delta
    );

    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      -state.pointer.y * 0.018,
      2,
      delta
    );
    group.current.position.y = THREE.MathUtils.damp(
      group.current.position.y,
      Math.sin(scrollProgress * 0.5) * 0.12,
      2,
      delta
    );
  });

  return (
    <>
      <color attach="background" args={["#f7fbff"]} />
      <fog attach="fog" args={["#f7fbff", 20, 58]} />
      <ambientLight intensity={1.2} />
      <hemisphereLight args={["#dbeafe", "#cfe8ff", 1.5]} />
      <directionalLight position={[5, 10, 6]} intensity={2.2} color="#ffffff" />

      <pointLight position={[-5, 4, 0]} intensity={18} color="#60a5fa" distance={25} />
      <pointLight position={[5, 3, -10]} intensity={18} color="#06b6d4" distance={28} />

      <group ref={group}>
        <City />
        <Road />
        <Car position={[1.2, 0.03, 2]} scale={0.85} speed={1} />
        <Car position={[-2.2, 0.02, -8]} scale={0.46} color="#dbeafe" speed={1.5} />
        <Car position={[2.5, 0.02, -17]} scale={0.42} color="#dc2626" speed={0.8} />
        <Particles />
      </group>
    </>
  );
}

export default function TrafficScene() {
  return (
    <div className="traffic-scene" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 5, 12], fov: 44, near: 0.1, far: 100 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}