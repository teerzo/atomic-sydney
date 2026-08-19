import { RigidBody } from '@react-three/rapier'
import { maps, usePixelMap } from './pixelArt'

export type ProjectileSpawn = {
  id: number
  position: [number, number, number]
  velocity: [number, number, number]
}

type ProjectileProps = {
  position: [number, number, number]
  velocity: [number, number, number]
}

export function Projectile({ position, velocity }: ProjectileProps) {
  const map = usePixelMap(maps.bullet)

  return (
    <RigidBody
      position={position}
      linearVelocity={velocity}
      colliders="ball"
      ccd
      friction={0.2}
      restitution={0.05}
      canSleep={false}
    >
      <mesh castShadow>
        <boxGeometry args={[0.14, 0.14, 0.22]} />
        <meshStandardMaterial
          map={map}
          emissiveMap={map}
          emissive="#ffcc66"
          emissiveIntensity={1.35}
          roughness={0.32}
          metalness={0.08}
          toneMapped={false}
        />
      </mesh>
    </RigidBody>
  )
}
