import { RigidBody } from '@react-three/rapier'

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
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#ffe082" emissive="#ffca28" emissiveIntensity={0.85} />
      </mesh>
    </RigidBody>
  )
}
