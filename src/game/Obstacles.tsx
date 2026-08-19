import { RigidBody } from '@react-three/rapier'
import { PixelBox, maps } from './pixelArt'

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
          <PixelBox args={wall.size} map={maps.wall} roughness={0.84} />
        </RigidBody>
      ))}

      {pillars.map((position) => (
        <RigidBody key={position.join(',')} type="fixed" position={position} colliders="cuboid">
          <PixelBox args={[1.4, 3, 1.4]} map={maps.pillar} roughness={0.72} metalness={0.18} />
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
          <PixelBox args={[1, 1, 1]} map={maps.crate} roughness={0.88} metalness={0.04} />
        </RigidBody>
      ))}
    </>
  )
}
