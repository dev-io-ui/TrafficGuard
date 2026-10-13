import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

const QUESTION_SETS = [
  {
    title: 'Signals & junctions',
    description: 'Read lights and approach intersections safely.',
    icon: '🚦',
    questions: [
      { type: 'amber', title: 'The signal turns amber as you approach.', detail: 'You have enough distance to stop smoothly before the line.', choices: ['Accelerate to beat the red light', 'Stop smoothly before the line', 'Reverse to the previous junction'], answer: 1, explanation: 'When you can stop safely, stop before the line. Never speed up to beat a signal.' },
      { type: 'signal', title: 'Your light turns green, but the junction is blocked.', detail: 'Vehicles ahead have not cleared the intersection.', choices: ['Wait behind the stop line until there is room', 'Enter and wait in the middle', 'Use the other lane to get around them'], answer: 0, explanation: 'Keep the junction clear. Enter only when you can proceed without blocking cross traffic.' },
      { type: 'signal', title: 'You reach a stop sign at a quiet junction.', detail: 'You cannot see any other vehicles nearby.', choices: ['Slow down and roll through', 'Stop fully, check, then proceed when clear', 'Honk and continue without stopping'], answer: 1, explanation: 'A stop sign requires a complete stop. Check carefully and proceed only when safe.' },
    ],
  },
  {
    title: 'Pedestrians & crossings',
    description: 'Share crossings and protect people walking.',
    icon: '🚶',
    questions: [
      { type: 'crossing', title: 'A person steps onto the zebra crossing.', detail: 'You have a green light, but someone is already crossing ahead.', choices: ['Slow down and let them cross', 'Sound the horn and continue', 'Drive around the crossing'], answer: 0, explanation: 'People on a marked crossing have priority. Stop safely and wait until it is clear.' },
      { type: 'crossing', title: 'A school bus has stopped to let children off.', detail: 'Children may cross from in front of or behind the bus.', choices: ['Pass quickly before anyone crosses', 'Slow down and be ready to stop', 'Honk so children know you are coming'], answer: 1, explanation: 'Children can be difficult to see and may move unpredictably. Reduce speed and be ready to stop.' },
      { type: 'crossing', title: 'You are turning into a side street.', detail: 'A pedestrian is crossing the street you are turning into.', choices: ['Yield and let them finish crossing', 'Turn behind them closely', 'Assume they will stop for your vehicle'], answer: 0, explanation: 'Check the path you are turning into and yield to people crossing before completing the turn.' },
    ],
  },
  {
    title: 'Speed & safe distance',
    description: 'Manage speed, following space, and stopping.',
    icon: '⏱️',
    questions: [
      { type: 'speed', title: 'Traffic ahead suddenly slows down.', detail: 'You are following the vehicle in front more closely than usual.', choices: ['Increase your following distance when safe', 'Keep the same gap and brake late', 'Move closer so nobody cuts in'], answer: 0, explanation: 'A larger following gap gives you more time to react and brake smoothly.' },
      { type: 'speed', title: 'You are driving through heavy rain.', detail: 'The road is wet and visibility is reduced.', choices: ['Keep the usual speed to match traffic', 'Slow down and leave extra space', 'Use cruise control and follow closely'], answer: 1, explanation: 'Wet roads reduce grip and increase stopping distance. Lower speed and a larger gap improve safety.' },
      { type: 'speed', title: 'You are running late for an appointment.', detail: 'The road is busy and you are tempted to speed.', choices: ['Stay within the posted limit', 'Speed only on straight sections', 'Follow another fast driver'], answer: 0, explanation: 'A posted speed limit is not a target to exceed. Arriving safely matters more than saving a few minutes.' },
    ],
  },
  {
    title: 'Emergency vehicles',
    description: 'Respond calmly when emergency help is coming through.',
    icon: '🚑',
    questions: [
      { type: 'emergency', title: 'An ambulance approaches from behind.', detail: 'Its siren is on and traffic is moving slowly.', choices: ['Make space when safe and let it pass', 'Follow closely behind it', 'Stop suddenly in your lane'], answer: 0, explanation: 'Stay calm, check around you, and move aside only when safe. Never follow or block an emergency vehicle.' },
      { type: 'emergency', title: 'An emergency vehicle approaches at a junction.', detail: 'You have a green light, but it is crossing your path.', choices: ['Proceed because your light is green', 'Yield and let it pass safely', 'Race through before it reaches you'], answer: 1, explanation: 'Give way to responding emergency vehicles. Do not enter their path, even when your signal permits movement.' },
      { type: 'emergency', title: 'You hear a siren but cannot see its source.', detail: 'Vehicles around you are beginning to slow.', choices: ['Stay alert, check mirrors, and avoid blocking lanes', 'Stop immediately wherever you are', 'Change lanes without checking'], answer: 0, explanation: 'Locate the vehicle while staying predictable. Make room when safe; sudden or unchecked movements can cause collisions.' },
    ],
  },
  {
    title: 'Sharing the road',
    description: 'Look out for motorcycles, bicycles, and large vehicles.',
    icon: '🚲',
    questions: [
      { type: 'sharing', title: 'A cyclist is riding ahead near the curb.', detail: 'You need to pass and there is limited space.', choices: ['Wait until you can pass with ample room', 'Squeeze past at the same speed', 'Sound the horn and pass immediately'], answer: 0, explanation: 'Give cyclists generous passing space. Wait until there is enough room to pass safely.' },
      { type: 'sharing', title: 'A large truck is turning across your lane.', detail: 'It has signaled and needs extra room to complete the turn.', choices: ['Squeeze between the truck and curb', 'Wait behind it and give it turning space', 'Race past on the inside'], answer: 1, explanation: 'Large vehicles need extra space to turn and have significant blind spots. Stay back and let the turn finish.' },
      { type: 'sharing', title: 'A motorcycle is beside you in slow traffic.', detail: 'You are about to change lanes.', choices: ['Check mirrors and blind spot before moving', 'Assume it will move out of your way', 'Signal after you start changing lanes'], answer: 0, explanation: 'Motorcycles can be hard to see in mirrors. Signal early and check your blind spot before changing lanes.' },
    ],
  },
  {
    title: 'Parking & stopping',
    description: 'Choose safe places to stop and park.',
    icon: '🅿️',
    questions: [
      { type: 'parking', title: 'You are dropping someone off near a junction.', detail: 'There is an open space right beside the corner.', choices: ['Stop at the corner for a quick drop-off', 'Choose a legal stopping place away from the junction', 'Stop in the crossing if the passenger is quick'], answer: 1, explanation: 'Stopping near junctions and crossings can block sight lines. Use a permitted place that does not obstruct others.' },
      { type: 'parking', title: 'You need to check directions on your phone.', detail: 'You are currently driving in moving traffic.', choices: ['Hold the phone low and glance down', 'Pull over somewhere legal and safe first', 'Ask a passenger to hold it in front of you'], answer: 1, explanation: 'Do not handle a phone while driving. Stop in a safe, legal place before checking directions.' },
      { type: 'parking', title: 'You find a space marked for accessible parking.', detail: 'You do not have authorization to use it.', choices: ['Use it briefly because you will be quick', 'Leave it available for authorized users', 'Park across two spaces nearby'], answer: 1, explanation: 'Keep accessible spaces available for people who are authorized to use them.' },
    ],
  },
  {
    title: 'Weather & visibility',
    description: 'Adapt your driving when conditions change.',
    icon: '🌧️',
    questions: [
      { type: 'weather', title: 'Fog makes it difficult to see far ahead.', detail: 'The road markings are still visible nearby.', choices: ['Reduce speed and use appropriate lights', 'Use high beams and drive at normal speed', 'Follow the taillights in front very closely'], answer: 0, explanation: 'Slow down, increase following distance, and use lights appropriate for the conditions. High beams can worsen glare in fog.' },
      { type: 'weather', title: 'The road is flooded across your route.', detail: 'You cannot tell how deep the water is.', choices: ['Drive through quickly before it rises', 'Turn around and find a safer route', 'Follow the vehicle ahead through it'], answer: 1, explanation: 'Water depth and road damage may be hidden. Do not enter floodwater; find a safe alternative route.' },
      { type: 'weather', title: 'Bright sun is creating glare on your windscreen.', detail: 'You are approaching a busy crossing.', choices: ['Slow down and increase caution', 'Look directly into the glare', 'Speed up to clear the area sooner'], answer: 0, explanation: 'Glare reduces visibility. Reduce speed, keep your windscreen clear, and be extra alert for people and vehicles.' },
    ],
  },
  {
    title: 'Seat belts & helmets',
    description: 'Protect yourself and passengers on every trip.',
    icon: '🪖',
    questions: [
      { type: 'protection', title: 'You are making a very short car trip.', detail: 'A passenger says a seat belt is unnecessary for such a short ride.', choices: ['Buckle up before moving', 'Skip it because the trip is short', 'Use the belt only on highways'], answer: 0, explanation: 'Wear a seat belt on every trip, no matter how short. Make sure passengers are buckled up too.' },
      { type: 'protection', title: 'You are riding a motorcycle to a nearby shop.', detail: 'The trip is only a few minutes away.', choices: ['Wear a properly fastened helmet', 'Ride slowly without a helmet', 'Carry the helmet on your arm'], answer: 0, explanation: 'Wear a properly fitted and fastened helmet on every ride, including short journeys.' },
      { type: 'protection', title: 'A child is travelling in your car.', detail: 'The regular adult belt does not fit them correctly.', choices: ['Use an appropriate child restraint', 'Let them sit on an adult’s lap', 'Have them share one belt with an adult'], answer: 0, explanation: 'Use a child restraint suited to the child and follow local requirements. Never share one belt.' },
    ],
  },
  {
    title: 'Signs & road markings',
    description: 'Use signs and lane markings to guide your decisions.',
    icon: '🛑',
    questions: [
      { type: 'signs', title: 'Road signs indicate a lower speed limit ahead.', detail: 'The new limit begins before a busy area.', choices: ['Reduce speed before reaching the posted limit', 'Wait until you see other vehicles slow down', 'Ignore it if the road looks clear'], answer: 0, explanation: 'Observe posted limits and adjust speed in time for the road conditions and upcoming hazards.' },
      { type: 'signs', title: 'A solid line separates your lane from oncoming traffic.', detail: 'The vehicle ahead is moving slowly.', choices: ['Stay in lane and wait for a permitted passing area', 'Cross the line to overtake immediately', 'Use the shoulder to pass'], answer: 0, explanation: 'Follow lane markings and only pass where it is permitted and safe. Never use the shoulder to overtake.' },
      { type: 'signs', title: 'A sign warns of a sharp bend ahead.', detail: 'You are approaching at the current road speed.', choices: ['Slow down before the bend', 'Brake hard halfway through the bend', 'Accelerate to get through quickly'], answer: 0, explanation: 'Reduce speed before entering a bend and maintain control through it.' },
    ],
  },
  {
    title: 'Responsible driving',
    description: 'Stay focused, rested, and considerate.',
    icon: '🧠',
    questions: [
      { type: 'responsible', title: 'You feel sleepy during a long drive.', detail: 'You have started blinking more and missing signs.', choices: ['Stop somewhere safe and rest', 'Open the window and keep driving', 'Turn up music and drive faster'], answer: 0, explanation: 'Fatigue impairs reaction and judgment. Stop somewhere safe to rest; do not rely on tricks to stay awake.' },
      { type: 'responsible', title: 'A driver makes a mistake that delays you.', detail: 'You feel frustrated and want to react.', choices: ['Keep calm and leave space', 'Tailgate to show your annoyance', 'Block their vehicle from merging'], answer: 0, explanation: 'Stay calm and predictable. Aggressive driving increases risk for everyone.' },
      { type: 'responsible', title: 'Your phone buzzes while you are driving.', detail: 'You are approaching a complex intersection.', choices: ['Ignore it until you are safely stopped', 'Pick it up at the red light while rolling', 'Read the message while approaching'], answer: 0, explanation: 'Keep your attention on the road. Check messages only after stopping in a safe, permitted place.' },
    ],
  },
];

function IntersectionScene({ type }) {
  const car = useRef();
  const signalLight = useRef();

  useFrame((state, delta) => {
    if (car.current) {
      const targetX = Math.sin(state.clock.elapsedTime * 0.48) * 2.15;
      car.current.position.x += (targetX - car.current.position.x) * Math.min(delta * 1.4, 1);
    }

    if (signalLight.current && type === 'emergency') {
      signalLight.current.material.color.set(
        Math.sin(state.clock.elapsedTime * 8) > 0 ? '#ef4444' : '#2563eb'
      );
    }
  });

  const activeSignal = type === 'amber' ? '#f59e0b' : type === 'emergency' ? '#22c55e' : '#ef4444';

  return (
    <>
      <color attach="background" args={['#eff6ff']} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[4, 8, 5]} intensity={2} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.14, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#e6f0fb" roughness={0.9} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
        <planeGeometry args={[12, 2.8]} />
        <meshStandardMaterial color="#64748b" roughness={0.82} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.07, 0]}>
        <planeGeometry args={[2.8, 12]} />
        <meshStandardMaterial color="#64748b" roughness={0.82} />
      </mesh>

      {[-1.7, 1.7].flatMap((z) =>
        Array.from({ length: 7 }, (_, i) => (
          <mesh key={`${z}-${i}`} position={[-0.9 + i * 0.3, -0.045, z]}>
            <boxGeometry args={[0.15, 0.025, 0.42]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        ))
      )}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.035, 0]}>
        <planeGeometry args={[0.09, 4.4]} />
        <meshBasicMaterial color="#f8fafc" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.035, 0]}>
        <planeGeometry args={[4.4, 0.09]} />
        <meshBasicMaterial color="#f8fafc" />
      </mesh>

      <group position={[-2.15, 0, -2.25]}>
        <mesh position={[0, 0.72, 0]}>
          <cylinderGeometry args={[0.045, 0.055, 1.4, 12]} />
          <meshStandardMaterial color="#475569" metalness={0.45} roughness={0.45} />
        </mesh>
        <mesh position={[0.05, 1.55, 0]}>
          <boxGeometry args={[0.3, 0.85, 0.26]} />
          <meshStandardMaterial color="#334155" roughness={0.48} />
        </mesh>
        {['#ef4444', '#f59e0b', '#22c55e'].map((color, index) => (
          <mesh
            key={color}
            ref={index === (type === 'amber' ? 1 : type === 'emergency' ? 2 : 0) ? signalLight : null}
            position={[0.05, 1.82 - index * 0.27, 0.14]}
          >
            <sphereGeometry args={[0.075, 16, 16]} />
            <meshStandardMaterial
              color={index === (type === 'amber' ? 1 : type === 'emergency' ? 2 : 0) ? activeSignal : '#cbd5e1'}
              emissive={index === (type === 'amber' ? 1 : type === 'emergency' ? 2 : 0) ? activeSignal : '#000000'}
              emissiveIntensity={0.65}
            />
          </mesh>
        ))}
      </group>

      {type === 'crossing' && (
        <group position={[0.95, 0, 2.35]}>
          <mesh position={[0, 0.48, 0]}>
            <capsuleGeometry args={[0.16, 0.5, 4, 8]} />
            <meshStandardMaterial color="#2563eb" roughness={0.55} />
          </mesh>
          <mesh position={[0, 0.9, 0]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#f4c7a1" roughness={0.7} />
          </mesh>
        </group>
      )}

      <group ref={car} position={[-1.2, 0, 0.72]}>
        <mesh position={[0, 0.28, 0]}>
          <boxGeometry args={[1.05, 0.38, 0.62]} />
          <meshStandardMaterial color="#2563eb" metalness={0.25} roughness={0.35} />
        </mesh>
        <mesh position={[-0.08, 0.55, 0]}>
          <boxGeometry args={[0.52, 0.24, 0.49]} />
          <meshPhysicalMaterial color="#bfdbfe" metalness={0.15} roughness={0.2} clearcoat={0.8} />
        </mesh>
        {[-0.34, 0.34].map((x) =>
          [-0.24, 0.24].map((z) => (
            <mesh key={`${x}-${z}`} position={[x, 0.16, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.11, 0.11, 0.08, 16]} />
              <meshStandardMaterial color="#1e293b" roughness={0.8} />
            </mesh>
          ))
        )}
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, -3.1]}>
        <ringGeometry args={[2.45, 2.49, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} />
      </mesh>
    </>
  );
}

function RuleScene({ type }) {
  return (
    <div className="rule-game-scene" aria-hidden="true">
      <Canvas
        camera={{ position: [5.8, 7.5, 8.5], fov: 38 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
      >
        <IntersectionScene type={type} />
      </Canvas>
      <span className="rule-scene-caption">INTERSECTION SIMULATION</span>
    </div>
  );
}

export default function RuleGame() {
  const [setIndex, setSetIndex] = useState(null);
  const [round, setRound] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const activeSet = setIndex === null ? null : QUESTION_SETS[setIndex];
  const questions = activeSet?.questions ?? [];
  const complete = round >= questions.length;
  const scenario = questions[Math.min(round, questions.length - 1)];
  const answeredCorrectly = answer !== null && scenario !== undefined && answer === scenario.answer;

  const startSet = (index) => {
    setSetIndex(index);
    setRound(0);
    setAnswer(null);
    setScore(0);
    setStreak(0);
  };

  const chooseAnswer = (index) => {
    if (answer !== null) return;
    setAnswer(index);
    if (index === scenario.answer) {
      setScore((current) => current + 1);
      setStreak((current) => current + 1);
    } else {
      setStreak(0);
    }
  };

  const nextRound = () => {
    setAnswer(null);
    setRound((current) => current + 1);
  };

  const restart = () => {
    setRound(0);
    setAnswer(null);
    setScore(0);
    setStreak(0);
  };

  const backToSets = () => {
    setSetIndex(null);
    restart();
  };

  return (
    <section className="rule-game-panel reveal" aria-labelledby="rule-game-title">
      <div className="rule-game-heading">
        <div className="section-heading">
          <p>Learn as you play</p>
          <h2 id="rule-game-title">Think fast. Drive safe.</h2>
          <span>Pick a topic and practice safer decisions with 10 sets of road scenarios.</span>
        </div>
        {activeSet && (
          <div className="rule-game-score" aria-live="polite">
            <span>Score</span>
            <strong>{score}<small> / {questions.length}</small></strong>
            <span>{streak > 1 ? `${streak} in a row` : 'Safe choices'}</span>
          </div>
        )}
      </div>

      {activeSet === null ? (
        <div className="rule-game-set-grid">
          {QUESTION_SETS.map((set, index) => (
            <button key={set.title} className="rule-game-set-card" type="button" onClick={() => startSet(index)}>
              <span className="rule-game-set-icon" aria-hidden="true">{set.icon}</span>
              <span className="rule-game-set-number">SET {String(index + 1).padStart(2, '0')}</span>
              <strong>{set.title}</strong>
              <span className="rule-game-set-description">{set.description}</span>
              <span className="rule-game-set-count">3 scenarios <span aria-hidden="true">↗</span></span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="rule-game-active-set">
            <div>
              <span>{activeSet.icon} SET {String(setIndex + 1).padStart(2, '0')}</span>
              <strong>{activeSet.title}</strong>
            </div>
            <button type="button" className="rule-game-change-set" onClick={backToSets}>Choose another set</button>
          </div>

          <div className="rule-game-layout">
            <RuleScene type={complete ? 'signal' : scenario.type} />

            <div className="rule-game-content" aria-live="polite">
              {complete ? (
                <div className="rule-game-finish">
                  <span className="rule-game-medal" aria-hidden="true">{score === questions.length ? '★' : '✓'}</span>
                  <p className="rule-game-eyebrow">Set complete</p>
                  <h3>{score === questions.length ? 'Perfect drive!' : 'Nice work!'}</h3>
                  <p>You made {score} safe {score === 1 ? 'choice' : 'choices'} out of {questions.length}. Every safe decision helps protect everyone on the road.</p>
                  <button className="btn" type="button" onClick={restart}>Play this set again</button>
                </div>
              ) : (
                <>
                  <div className="rule-game-progress">
                    <span>SCENARIO {round + 1} / {questions.length}</span>
                    <div aria-hidden="true">
                      {questions.map((item, index) => (
                        <i key={`${item.type}-${item.title}`} className={index <= round ? 'current' : ''} />
                      ))}
                    </div>
                  </div>
                  <p className="rule-game-eyebrow">What would you do?</p>
                  <h3>{scenario.title}</h3>
                  <p className="rule-game-detail">{scenario.detail}</p>

                  <div className="rule-game-choices">
                    {scenario.choices.map((choice, index) => {
                      let stateClass = '';
                      if (answer !== null && index === scenario.answer) stateClass = 'correct';
                      else if (answer === index) stateClass = 'incorrect';

                      return (
                        <button
                          key={choice}
                          type="button"
                          className={`rule-game-choice ${stateClass}`}
                          onClick={() => chooseAnswer(index)}
                          disabled={answer !== null}
                        >
                          <span>{String.fromCharCode(65 + index)}</span>
                          {choice}
                        </button>
                      );
                    })}
                  </div>

                  {answer !== null && (
                    <div className={`rule-game-feedback ${answeredCorrectly ? 'is-correct' : 'is-incorrect'}`}>
                      <strong>{answeredCorrectly ? 'That’s the safe choice.' : 'Here’s the safer move.'}</strong>
                      <p>{scenario.explanation}</p>
                      <button className="btn sm" type="button" onClick={nextRound}>
                        {round === questions.length - 1 ? 'See your result' : 'Next scenario'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
