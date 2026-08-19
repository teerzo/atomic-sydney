import { useFrame } from '@react-three/fiber'
import { useRef, type MutableRefObject } from 'react'
import type { Group } from 'three'

const BODY = '#5eead4'
const LIMB = '#3aa99a'
const HEAD = '#9af0e3'
const GUN = '#1a2332'
const POSE_LAMBDA = 12

export type Locomotion = {
  forward: boolean
  back: boolean
  left: boolean
  right: boolean
  grounded: boolean
  crouched: boolean
}

type PlayerModelProps = {
  locomotion: MutableRefObject<Locomotion>
}

function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt))
}

export function PlayerModel({ locomotion }: PlayerModelProps) {
  const bob = useRef<Group>(null)
  const leftArm = useRef<Group>(null)
  const rightArm = useRef<Group>(null)
  const leftLeg = useRef<Group>(null)
  const rightLeg = useRef<Group>(null)

  useFrame((state, delta) => {
    const { forward, back, left, right, grounded, crouched } = locomotion.current
    const walk = (forward ? 1 : 0) - (back ? 1 : 0)
    const strafe = (right ? 1 : 0) - (left ? 1 : 0)
    const moving = walk !== 0 || strafe !== 0
    const t = state.clock.elapsedTime
    const swing = crouched ? 0.55 : 1
    const squat = crouched ? 0.5 : 0

    let bobY = crouched ? -0.22 : 0
    let bobX = 0
    let leanZ = 0
    let leftArmX = 0
    let rightArmX = 0
    let leftLegX = squat
    let rightLegX = squat
    let leftLegZ = 0
    let rightLegZ = 0

    if (!grounded) {
      leftArmX = 0.35
      rightArmX = 0.18
      leftLegX = 0.28 + squat
      rightLegX = 0.4 + squat
    } else if (moving) {
      const phase = Math.sin(t * (crouched ? 7 : 9))
      bobY += Math.abs(phase) * 0.04 * swing

      if (walk !== 0) {
        leftLegX = squat - phase * 0.55 * walk * swing
        rightLegX = squat + phase * 0.55 * walk * swing
        leftArmX = phase * 0.42 * walk * swing
        rightArmX = -phase * 0.28 * walk * swing
      }

      if (strafe !== 0) {
        leanZ = -strafe * 0.14 * swing
        bobX = phase * 0.05 * strafe * swing
        leftLegZ = phase * 0.5 * strafe * swing
        rightLegZ = -phase * 0.5 * strafe * swing
        if (walk === 0) {
          leftArmX = phase * 0.18 * swing
          rightArmX = -phase * 0.12 * swing
        }
      }
    } else {
      const idle = Math.sin(t * 2.2)
      bobY += idle * (crouched ? 0.02 : 0.038)
      leftArmX = idle * 0.1 * swing
      rightArmX = -idle * 0.06 * swing
    }

    if (bob.current) {
      bob.current.position.y = damp(bob.current.position.y, bobY, POSE_LAMBDA, delta)
      bob.current.position.x = damp(bob.current.position.x, bobX, POSE_LAMBDA, delta)
      bob.current.rotation.z = damp(bob.current.rotation.z, leanZ, POSE_LAMBDA, delta)
    }
    if (leftArm.current) {
      leftArm.current.rotation.x = damp(leftArm.current.rotation.x, leftArmX, POSE_LAMBDA, delta)
    }
    if (rightArm.current) {
      rightArm.current.rotation.x = damp(rightArm.current.rotation.x, rightArmX, POSE_LAMBDA, delta)
    }
    if (leftLeg.current) {
      leftLeg.current.rotation.x = damp(leftLeg.current.rotation.x, leftLegX, POSE_LAMBDA, delta)
      leftLeg.current.rotation.z = damp(leftLeg.current.rotation.z, leftLegZ, POSE_LAMBDA, delta)
    }
    if (rightLeg.current) {
      rightLeg.current.rotation.x = damp(rightLeg.current.rotation.x, rightLegX, POSE_LAMBDA, delta)
      rightLeg.current.rotation.z = damp(rightLeg.current.rotation.z, rightLegZ, POSE_LAMBDA, delta)
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

      <group ref={leftLeg} position={[-0.12, -0.21, 0]}>
        <mesh position={[0, -0.31, 0]} castShadow>
          <boxGeometry args={[0.18, 0.62, 0.18]} />
          <meshStandardMaterial color={LIMB} />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.12, -0.21, 0]}>
        <mesh position={[0, -0.31, 0]} castShadow>
          <boxGeometry args={[0.18, 0.62, 0.18]} />
          <meshStandardMaterial color={LIMB} />
        </mesh>
      </group>
    </group>
  )
}
