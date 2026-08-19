import { RigidBody } from '@react-three/rapier'

const walls: Array<{ position: [number, number, number]; size: [number, number, number] }> = [
  { position: [0, 1.5, -20], size: [40, 3, 1] },
  { position: [0, 1.5, 20], size: [40, 3, 1] },
  { position: [-20, 1.5, 0], size: [1, 3, 40] },
  { position: [20, 1.5, 0], size: [1, 3, 40] },
]

const pillars: Array<[number, number, number]> = [
  [-8, 1.5, -8],
  [8, 1.5, -8],
  [-8, 1.5, 8],
  [8, 1.5, 8],
]

const crates: Array<[number, number, number]> = [
  [2, 0.55, -3],
  [3.15, 0.55, -2.4],
  [-4, 0.55, 2],
  [0.4, 0.55, 5],
  [6, 0.55, 1],
]

export function Obstacles() {
  return (
    <>
      {walls.map((wall) => (
        <RigidBody key={wall.position.join(',')} type="fixed" position={wall.position} colliders="cuboid">
          <mesh castShadow receiveShadow>
            <boxGeometry args={wall.size} />
            <meshStandardMaterial color="#4a6270" />
          </mesh>
        </RigidBody>
      ))}

      {pillars.map((position) => (
        <RigidBody key={position.join(',')} type="fixed" position={position} colliders="cuboid">
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.4, 3, 1.4]} />
            <meshStandardMaterial color="#5b6e7a" />
          </mesh>
        </RigidBody>
      ))}

      {crates.map((position) => (
        <RigidBody
          key={position.join(',')}
          type="dynamic"
          position={position}
          colliders="cuboid"
          restitution={0.15}
          friction={0.8}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#c48a4a" />
          </mesh>
        </RigidBody>
      ))}
    </>
  )
}
