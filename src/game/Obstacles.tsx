import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { PixelBox, PixelSphere, maps } from './pixelArt'

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

const blocks: Array<{ position: [number, number, number]; size: [number, number, number] }> = [
  { position: [-1, 1, -12], size: [3.2, 2, 3.2] },
  { position: [5.5, 1.5, 11], size: [4, 3, 2.4] },
  { position: [-11, 2, -11], size: [2.6, 4, 2.6] },
  { position: [14, 0.9, 2], size: [2.2, 1.8, 5] },
]

function Stairs({
  position,
  rotationY = 0,
  steps = 8,
  width = 3.2,
  stepHeight = 0.3,
  stepDepth = 0.55,
}: {
  position: [number, number, number]
  rotationY?: number
  steps?: number
  width?: number
  stepHeight?: number
  stepDepth?: number
}) {
  return (
    <RigidBody type="fixed" position={position} rotation={[0, rotationY, 0]} colliders={false} friction={1}>
      {Array.from({ length: steps }, (_, index) => {
        const y = stepHeight * index + stepHeight / 2
        const z = stepDepth * index + stepDepth / 2
        return (
          <group key={index} position={[0, y, z]}>
            <CuboidCollider args={[width / 2, stepHeight / 2, stepDepth / 2]} />
            <PixelBox args={[width, stepHeight, stepDepth]} map={maps.stairs} tileSize={0.5} roughness={0.86} />
          </group>
        )
      })}
    </RigidBody>
  )
}

function Ramp({
  position,
  rotationY = 0,
  width = 3.4,
  length = 6.4,
  height = 2.2,
}: {
  position: [number, number, number]
  rotationY?: number
  width?: number
  length?: number
  height?: number
}) {
  const angle = Math.atan2(height, length)
  const diag = Math.hypot(length, height)
  return (
    <RigidBody type="fixed" position={position} rotation={[0, rotationY, 0]} colliders={false} friction={1}>
      <group position={[0, height / 2, length / 2]} rotation={[-angle, 0, 0]}>
        <CuboidCollider args={[width / 2, 0.14, diag / 2]} />
        <PixelBox args={[width, 0.28, diag]} map={maps.ramp} tileSize={0.7} roughness={0.62} metalness={0.12} />
      </group>
    </RigidBody>
  )
}

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

      {blocks.map((block) => (
        <RigidBody key={block.position.join(',')} type="fixed" position={block.position} colliders="cuboid" friction={0.95}>
          <PixelBox args={block.size} map={maps.block} tileSize={1.2} roughness={0.78} metalness={0.1} />
        </RigidBody>
      ))}

      <Stairs position={[-13, 0, 7]} rotationY={Math.PI / 2} />
      <Stairs position={[9, 0, -14]} steps={10} width={3.6} />

      <Ramp position={[11, 0, 6]} rotationY={-Math.PI / 2} />
      <Ramp position={[-15, 0, -6]} rotationY={0.4} length={7.2} height={2.6} width={3.8} />

      <RigidBody type="fixed" position={[7.2, 1.15, -5.2]} colliders="ball" friction={0.4} restitution={0.35}>
        <PixelSphere radius={1.15} map={maps.sphere} roughness={0.38} metalness={0.28} />
      </RigidBody>
      <RigidBody type="fixed" position={[-6.4, 1.5, 13]} colliders="ball" friction={0.4} restitution={0.4}>
        <PixelSphere radius={1.5} map={maps.sphere} roughness={0.38} metalness={0.28} />
      </RigidBody>
      <RigidBody type="dynamic" position={[4.2, 1.4, 8.2]} colliders="ball" friction={0.35} restitution={0.45} mass={4}>
        <PixelSphere radius={0.85} map={maps.sphere} roughness={0.38} metalness={0.28} />
      </RigidBody>
    </>
  )
}
