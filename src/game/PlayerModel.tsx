import { useFrame } from '@react-three/fiber'
import { useRef, type MutableRefObject } from 'react'
import type { Group } from 'three'

const BODY = '#5eead4'
const LIMB = '#3aa99a'
const HEAD = '#9af0e3'
const GUN = '#1a2332'

type PlayerModelProps = {
  moving: MutableRefObject<boolean>
}

export function PlayerModel({ moving }: PlayerModelProps) {
  const bob = useRef<Group>(null)
  const leftArm = useRef<Group>(null)
  const rightArm = useRef<Group>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const isMoving = moving.current
    const speed = isMoving ? 9 : 2.2
    const amount = isMoving ? 0.05 : 0.038
    const swing = Math.sin(t * speed) * (isMoving ? 0.42 : 0.1)

    if (bob.current) {
      bob.current.position.y = Math.sin(t * speed) * amount
    }
    if (leftArm.current) {
      leftArm.current.rotation.x = swing
    }
    if (rightArm.current) {
      rightArm.current.rotation.x = -swing * 0.45
    }
  })

  return (
    <group ref={bob}>
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[0.34, 0.34, 0.34]} />
        <meshStandardMaterial color={HEAD} />
      </mesh>

      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[0.46, 0.58, 0.28]} />
        <meshStandardMaterial color={BODY} />
      </mesh>

      <group ref={leftArm} position={[-0.32, 0.28, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <boxGeometry args={[0.14, 0.52, 0.14]} />
          <meshStandardMaterial color={LIMB} />
        </mesh>
      </group>

      <group ref={rightArm} position={[0.32, 0.28, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <boxGeometry args={[0.14, 0.52, 0.14]} />
          <meshStandardMaterial color={LIMB} />
        </mesh>
        <mesh position={[0.02, -0.38, -0.38]} rotation={[0.08, 0, 0]} castShadow>
          <boxGeometry args={[0.1, 0.1, 0.62]} />
          <meshStandardMaterial color={GUN} />
        </mesh>
      </group>

      <mesh position={[-0.12, -0.52, 0]} castShadow>
        <boxGeometry args={[0.18, 0.62, 0.18]} />
        <meshStandardMaterial color={LIMB} />
      </mesh>
      <mesh position={[0.12, -0.52, 0]} castShadow>
        <boxGeometry args={[0.18, 0.62, 0.18]} />
        <meshStandardMaterial color={LIMB} />
      </mesh>
    </group>
  )
}
