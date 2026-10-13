import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

const TOTAL_CROSSINGS = 3;
const ACTION_DURATIONS = {
  drive: 2100,
  walk: 2100,
  crash: 1700,
  wait: 700,
};

function CrossingScene({ phase, action }) {
  const car = useRef();
  const pedestrian = useRef();
  const signal = useRef([]);

  useFrame((state) => {
    const carLight = signal.current[0];
    const walkLight = signal.current[1];
    if (carLight) {
      carLight.material.color.set(phase === 'vehicle' ? '#22c55e' : '#ef4444');
      carLight.material.emissive.set(phase === 'vehicle' ? '#22c55e' : '#ef4444');
    }
    if (walkLight) {
      walkLight.material.color.set(phase === 'pedestrian' ? '#22c55e' : '#cbd5e1');
      walkLight.material.emissive.set(phase === 'pedestrian' ? '#22c55e' : '#000000');
    }

    if (!action) {
      if (phase === 'vehicle') {
        if (car.current) car.current.position.x = -4;
        if (pedestrian.current) pedestrian.current.position.z = 3.5;
      } else if (phase === 'pedestrian') {
        if (car.current) car.current.position.x = 4;
        if (pedestrian.current) pedestrian.current.position.z = 3.5;
      }
      return;
    }

    const progress = Math.min((performance.now() - action.startedAt) / ACTION_DURATIONS[action.type], 1);
    const eased = progress * progress * (3 - 2 * progress);

    if (action.type === 'drive' && car.current) {
      car.current.position.x = -4 + eased * 8;
      car.current.position.y = 0.05 + Math.sin(progress * Math.PI) * 0.04;
    } else if (action.type === 'walk' && pedestrian.current) {
      pedestrian.current.position.z = 3.5 - eased * 7;
      pedestrian.current.position.x = Math.sin(progress * Math.PI * 8) * 0.045;
    } else if (action.type === 'crash') {
      if (car.current) car.current.position.x = -4 + eased * 4;
      if (pedestrian.current) pedestrian.current.position.z = 3.5 - eased * 3.1;
    }
  });

  return (
    <>
      <color attach="background" args={['#eff6ff']} />
      <ambientLight intensity={1.4} />
      <directionalLight position={[3, 8, 6]} intensity={2} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]}>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#e5eef8" roughness={0.92} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[12, 4]} />
        <meshStandardMaterial color="#64748b" roughness={0.84} />
      </mesh>

      {Array.from({ length: 11 }, (_, index) => (
        <mesh key={index} position={[-4.1 + index * 0.82, -0.045, 2.45]}>
          <boxGeometry args={[0.62, 0.025, 0.72]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.6, -0.04, 0]}>
        <planeGeometry args={[0.13, 4]} />
        <meshBasicMaterial color="#f8fafc" />
      </mesh>

      <group position={[-3.7, 0, -1.15]}>
        <mesh position={[0, 0.78, 0]}>
          <cylinderGeometry args={[0.045, 0.06, 1.55, 12]} />
          <meshStandardMaterial color="#475569" metalness={0.35} roughness={0.55} />
        </mesh>
        <mesh position={[0, 1.68, 0]}>
          <boxGeometry args={[0.34, 0.8, 0.29]} />
          <meshStandardMaterial color="#1e293b" roughness={0.45} />
        </mesh>
        {[0, 1].map((index) => (
          <mesh
            key={index}
            ref={(node) => { signal.current[index] = node; }}
            position={[0, 1.88 - index * 0.4, 0.16]}
          >
            <sphereGeometry args={[0.105, 20, 20]} />
            <meshStandardMaterial
              color={index === 0 ? '#22c55e' : '#cbd5e1'}
              emissive={index === 0 ? '#22c55e' : '#000000'}
              emissiveIntensity={0.8}
            />
          </mesh>
        ))}
      </group>

      <group ref={car} position={[-4, 0.05, 0]}>
        <mesh position={[0, 0.38, 0]}>
          <boxGeometry args={[1.45, 0.5, 0.82]} />
          <meshStandardMaterial color="#2563eb" metalness={0.28} roughness={0.32} />
        </mesh>
        <mesh position={[0.04, 0.72, 0]}>
          <boxGeometry args={[0.76, 0.28, 0.68]} />
          <meshPhysicalMaterial color="#bfdbfe" metalness={0.12} roughness={0.2} clearcoat={0.8} />
        </mesh>
        {[-0.48, 0.48].flatMap((x) =>
          [-0.32, 0.32].map((z) => (
            <mesh key={`${x}-${z}`} position={[x, 0.22, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.16, 0.16, 0.12, 18]} />
              <meshStandardMaterial color="#1e293b" roughness={0.78} />
            </mesh>
          ))
        )}
        {[-0.25, 0.25].map((x) => (
          <mesh key={x} position={[0.74, 0.42, x]}>
            <boxGeometry args={[0.04, 0.12, 0.16]} />
            <meshBasicMaterial color="#fff7cc" />
          </mesh>
        ))}
      </group>

      <group ref={pedestrian} position={[0, 0, 3.5]}>
        <mesh position={[0, 0.55, 0]}>
          <capsuleGeometry args={[0.17, 0.56, 4, 8]} />
          <meshStandardMaterial color="#0e7490" roughness={0.55} />
        </mesh>
        <mesh position={[0, 1.02, 0]}>
          <sphereGeometry args={[0.16, 18, 18]} />
          <meshStandardMaterial color="#f1c8a5" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.35, 0.38, 0.06, 20]} />
          <meshStandardMaterial color="#2563eb" transparent opacity={0.18} />
        </mesh>
      </group>
    </>
  );
}

export default function PlayableCrossingGame() {
  const [phase, setPhase] = useState('vehicle');
  const [action, setAction] = useState(null);
  const [lastChoice, setLastChoice] = useState(null);
  const [crossings, setCrossings] = useState(0);
  const [best, setBest] = useState(0);
  const nextActionId = useRef(0);
  const complete = phase === 'complete';
  const crashed = phase === 'crash';
  const busy = action !== null;

  const chooseAction = (type) => {
    if (busy || complete) return;
    setLastChoice(null);
    nextActionId.current += 1;
    setAction({ id: nextActionId.current, type, startedAt: performance.now() });
  };

  const handleActionComplete = useCallback((type) => {
    setAction(null);
    if (type === 'drive') {
      setPhase('pedestrian');
      return;
    }

    if (type === 'walk') {
      const next = crossings + 1;
      setCrossings(next);
      setBest((record) => Math.max(record, next));
      setPhase(next >= TOTAL_CROSSINGS ? 'complete' : 'vehicle');
      return;
    }

    if (type === 'crash') {
      setPhase('crash');
      return;
    }

    setLastChoice('wait');
  }, [crossings]);

  useEffect(() => {
    if (!action) return undefined;

    const timeout = window.setTimeout(
      () => handleActionComplete(action.type),
      ACTION_DURATIONS[action.type]
    );

    return () => window.clearTimeout(timeout);
  }, [action, handleActionComplete]);

  const resetGame = () => {
    setPhase('vehicle');
    setAction(null);
    setLastChoice(null);
    setCrossings(0);
  };

  const choices = phase === 'vehicle'
    ? [
      { label: 'Drive through on green', hint: 'The vehicle signal is green.', action: 'drive', icon: '➜' },
      { label: 'Walk across before the walk signal', hint: 'The pedestrian signal is still red.', action: 'crash', icon: '♙' },
      { label: 'Wait at the stop line', hint: 'A safe choice, though traffic will pause.', action: 'wait', icon: 'Ⅱ' },
    ]
    : [
      { label: 'Walk across on the walk signal', hint: 'Vehicles are stopped at the red light.', action: 'walk', icon: '♙' },
      { label: 'Drive through while the signal is red', hint: 'A pedestrian is entering the crossing.', action: 'crash', icon: '➜' },
      { label: 'Wait until you are sure it is safe', hint: 'Take your time before crossing.', action: 'wait', icon: 'Ⅱ' },
    ];

  return (
    <section className="playable-crossing-panel reveal" aria-labelledby="playable-crossing-title">
      <div className="playable-crossing-heading">
        <div className="section-heading">
          <p>Take the controls</p>
          <h2 id="playable-crossing-title">Choose the move. See what happens.</h2>
          <span>Pick an action for the signal. Safe choices move the car or pedestrian; an unsafe choice causes a simulated accident.</span>
        </div>
        <div className="crossing-score" aria-live="polite">
          <span>SAFE CROSSINGS</span>
          <strong>{crossings}<small> / {TOTAL_CROSSINGS}</small></strong>
          <span>Best: {best}</span>
        </div>
      </div>

      <div className="playable-crossing-layout">
        <div className="playable-crossing-scene">
          <Canvas
            camera={{ position: [7.5, 8, 10], fov: 39 }}
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: false }}
          >
            <CrossingScene phase={phase} action={action} />
          </Canvas>
          <div className={`signal-status ${phase}`} aria-live="polite">
            <span />
            {complete
              ? 'Crossing complete'
              : crashed
                ? 'Accident · unsafe choice'
                : phase === 'vehicle'
                  ? 'Green light · Choose an action'
                  : 'Red light · Choose an action'}
          </div>
          {crashed && <div className="crossing-crash-overlay" aria-hidden="true"><span>!</span></div>}
        </div>

        <div className="playable-crossing-controls" aria-live="polite">
          {crashed ? (
            <div className="crossing-finish crossing-accident">
              <span className="crossing-finish-icon" aria-hidden="true">!</span>
              <p className="rule-game-eyebrow">Accident simulated</p>
              <h3>That choice was unsafe.</h3>
              <p>The car and pedestrian entered the crossing at the same time. Follow the signal and wait until the crossing is clear before moving.</p>
              <button className="btn" type="button" onClick={resetGame}>Try again</button>
            </div>
          ) : complete ? (
            <div className="crossing-finish">
              <span className="crossing-finish-icon" aria-hidden="true">✓</span>
              <p className="rule-game-eyebrow">All clear</p>
              <h3>Everyone crossed safely.</h3>
              <p>You stopped for the pedestrian at every red light. Ready for another run?</p>
              <button className="btn" type="button" onClick={resetGame}>Play again</button>
            </div>
          ) : (
            <>
              <span className={`crossing-phase-label ${phase}`}>
                {phase === 'vehicle' ? 'VEHICLE SIGNAL · GREEN' : 'VEHICLE SIGNAL · RED'}
              </span>
              <h3>{phase === 'vehicle' ? 'The vehicle light is green.' : 'The vehicle light is red.'}</h3>
              <p>
                {phase === 'vehicle'
                  ? 'Choose what the driver or pedestrian should do at this signal.'
                  : 'The car must stop. Choose how the pedestrian should respond.'}
              </p>
              <div className="crossing-progress" aria-label={`${crossings} of ${TOTAL_CROSSINGS} crossings completed`}>
                {Array.from({ length: TOTAL_CROSSINGS }, (_, index) => (
                  <i key={index} className={index < crossings ? 'done' : ''} />
                ))}
              </div>
              <div className="crossing-choices">
                {choices.map((choice, index) => (
                  <button
                    key={choice.action}
                    className={`crossing-choice ${lastChoice === choice.action && choice.action === 'wait' ? 'selected-wait' : ''}`}
                    type="button"
                    onClick={() => chooseAction(choice.action)}
                    disabled={busy}
                  >
                    <span className="crossing-choice-letter">{String.fromCharCode(65 + index)}</span>
                    <span className="crossing-choice-copy">
                      <strong>{busy && action.type === choice.action ? 'In progress…' : choice.label}</strong>
                      <small>{choice.hint}</small>
                    </span>
                    <span className="crossing-choice-icon" aria-hidden="true">{choice.icon}</span>
                  </button>
                ))}
              </div>
              {lastChoice === 'wait' && (
                <p className="crossing-wait-feedback">Good call. You waited safely. Choose when you are ready to continue.</p>
              )}
              {busy && (
                <span className="crossing-hint">
                  {action.type === 'drive' ? 'Car moving through the intersection…' : action.type === 'walk' ? 'Pedestrian crossing safely…' : action.type === 'crash' ? 'Unsafe actions meet in the crossing…' : 'Waiting…'}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
