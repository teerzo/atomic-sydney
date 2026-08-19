import { useFrame } from '@react-three/fiber'
import { useRef, type MutableRefObject, type RefObject } from 'react'
import type { Group } from 'three'

const BODY = '#5eead4'
const LIMB = '#3aa99a'
const JOINT = '#2e8a7e'
const HEAD = '#9af0e3'
const HAND = '#7ed9cb'
const GUN = '#1b2433'
const GUN_METAL = '#3d4a5c'
const GUN_ACCENT = '#5eead4'
const POSE_LAMBDA = 14

export type Locomotion = {
  forward: boolean
  back: boolean
  left: boolean
  right: boolean
  grounded: boolean
  crouched: boolean
  aiming: boolean
}

type PlayerModelProps = {
  locomotion: MutableRefObject<Locomotion>
  muzzle: RefObject<Group | null>
}

function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt))
}

function dampEuler(group: Group | null, x: number, y: number, z: number, lambda: number, dt: number) {
  if (!group) return
  group.rotation.x = damp(group.rotation.x, x, lambda, dt)
  group.rotation.y = damp(group.rotation.y, y, lambda, dt)
  group.rotation.z = damp(group.rotation.z, z, lambda, dt)
}

function Box({
  size,
  position,
  color,
}: {
  size: [number, number, number]
  position: [number, number, number]
  color: string
}) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.45} metalness={0.15} />
    </mesh>
  )
}

function Gun() {
  return (
    <group rotation={[0.12, 0, 0]} position={[0.02, -0.02, -0.04]}>
      <Box size={[0.07, 0.09, 0.28]} position={[0, 0.02, 0.02]} color={GUN} />
      <Box size={[0.05, 0.07, 0.18]} position={[0, 0.01, 0.22]} color={GUN_METAL} />
      <Box size={[0.04, 0.05, 0.42]} position={[0, 0.03, -0.28]} color={GUN_METAL} />
      <Box size={[0.055, 0.055, 0.08]} position={[0, 0.03, -0.52]} color={GUN} />
      <Box size={[0.06, 0.14, 0.08]} position={[0, -0.08, 0.04]} color={GUN} />
      <Box size={[0.04, 0.12, 0.05]} position={[0, -0.1, -0.08]} color={GUN_METAL} />
      <Box size={[0.03, 0.05, 0.03]} position={[0, 0.08, -0.02]} color={GUN_ACCENT} />
      <Box size={[0.02, 0.04, 0.02]} position={[0, 0.07, -0.38]} color={GUN_ACCENT} />
    </group>
  )
}

export function PlayerModel({ locomotion, muzzle }: PlayerModelProps) {
  const bob = useRef<Group>(null)
  const leftShoulder = useRef<Group>(null)
  const leftElbow = useRef<Group>(null)
  const leftHand = useRef<Group>(null)
  const rightShoulder = useRef<Group>(null)
  const rightElbow = useRef<Group>(null)
  const rightHand = useRef<Group>(null)
  const leftThigh = useRef<Group>(null)
  const leftKnee = useRef<Group>(null)
  const leftFoot = useRef<Group>(null)
  const rightThigh = useRef<Group>(null)
  const rightKnee = useRef<Group>(null)
  const rightFoot = useRef<Group>(null)

  useFrame((state, delta) => {
    const { forward, back, left, right, grounded, crouched, aiming } = locomotion.current
    const walk = (forward ? 1 : 0) - (back ? 1 : 0)
    const strafe = (right ? 1 : 0) - (left ? 1 : 0)
    const moving = walk !== 0 || strafe !== 0
    const t = state.clock.elapsedTime
    const step = crouched ? 0.55 : 1
    const squat = crouched ? 0.55 : 0
    const kneeSquat = crouched ? 0.85 : 0.12
    const speed = crouched ? 7 : 9
    const phase = Math.sin(t * speed)
    const idle = Math.sin(t * 2.2)

    let bobY = crouched ? -0.2 : 0
    let bobX = 0
    let leanZ = 0
    let hipY = 0

    let lShoulder = { x: -0.95, y: 0.52, z: -0.42 }
    let rShoulder = { x: -1.05, y: -0.22, z: 0.32 }
    let lElbow = { x: 1.25, y: 0.15, z: 0.08 }
    let rElbow = { x: 1.12, y: 0, z: 0.05 }
    let lHand = { x: 0.15, y: 0.2, z: 0.1 }
    let rHand = { x: 0.18, y: 0.08, z: 0 }
    let lThigh = { x: squat, y: 0, z: 0 }
    let rThigh = { x: squat, y: 0, z: 0 }
    let lKnee = { x: kneeSquat, y: 0, z: 0 }
    let rKnee = { x: kneeSquat, y: 0, z: 0 }
    let lFoot = { x: crouched ? 0.12 : -0.08, y: 0, z: 0 }
    let rFoot = { x: crouched ? 0.12 : -0.08, y: 0, z: 0 }

    if (aiming) {
      lShoulder = { x: -1.22, y: 0.38, z: -0.28 }
      rShoulder = { x: -1.32, y: -0.12, z: 0.18 }
      lElbow = { x: 1.05, y: 0.05, z: 0.04 }
      rElbow = { x: 0.82, y: 0, z: 0 }
      lHand = { x: 0.05, y: 0.1, z: 0.05 }
      rHand = { x: 0.05, y: 0.04, z: 0 }
    }

    if (!grounded) {
      lThigh.x = squat + 0.35
      rThigh.x = squat + 0.5
      lKnee.x = kneeSquat + 0.4
      rKnee.x = kneeSquat + 0.55
      lFoot.x = 0.2
      rFoot.x = 0.28
      lShoulder.x -= 0.12
      rShoulder.x -= 0.08
    } else if (moving) {
      bobY += Math.abs(phase) * 0.035 * step
      hipY = phase * 0.08 * step

      const leftSwing = phase * 0.55 * step
      const rightSwing = -phase * 0.55 * step
      if (aiming) {
        const walkSwing = walk !== 0 ? walk : 0
        lThigh.x = squat + leftSwing * (walkSwing || 0.35)
        rThigh.x = squat + rightSwing * (walkSwing || 0.35)
        if (strafe !== 0) {
          leanZ = -strafe * 0.12 * step
          bobX = phase * 0.04 * strafe * step
          lThigh.z = phase * 0.42 * strafe * step
          rThigh.z = -phase * 0.42 * strafe * step
        }
      } else {
        lThigh.x = squat + leftSwing
        rThigh.x = squat + rightSwing
      }

      lKnee.x = kneeSquat + Math.max(0, -leftSwing) * 0.85 + Math.max(0, leftSwing) * 0.2
      rKnee.x = kneeSquat + Math.max(0, -rightSwing) * 0.85 + Math.max(0, rightSwing) * 0.2
      lFoot.x = crouched ? 0.1 : -0.12 + Math.max(0, leftSwing) * 0.25
      rFoot.x = crouched ? 0.1 : -0.12 + Math.max(0, rightSwing) * 0.25

      lShoulder.z += phase * 0.04
      rShoulder.z -= phase * 0.04
      lElbow.x += idle * 0.02
      rElbow.x += idle * 0.02
    } else {
      bobY += idle * (crouched ? 0.018 : 0.032)
      lShoulder.x += idle * 0.03
      rShoulder.x += idle * 0.03
      lElbow.x += idle * 0.02
    }

    if (bob.current) {
      bob.current.position.y = damp(bob.current.position.y, bobY, POSE_LAMBDA, delta)
      bob.current.position.x = damp(bob.current.position.x, bobX, POSE_LAMBDA, delta)
      bob.current.rotation.y = damp(bob.current.rotation.y, hipY, POSE_LAMBDA, delta)
      bob.current.rotation.z = damp(bob.current.rotation.z, leanZ, POSE_LAMBDA, delta)
    }

    dampEuler(leftShoulder.current, lShoulder.x, lShoulder.y, lShoulder.z, POSE_LAMBDA, delta)
    dampEuler(rightShoulder.current, rShoulder.x, rShoulder.y, rShoulder.z, POSE_LAMBDA, delta)
    dampEuler(leftElbow.current, lElbow.x, lElbow.y, lElbow.z, POSE_LAMBDA, delta)
    dampEuler(rightElbow.current, rElbow.x, rElbow.y, rElbow.z, POSE_LAMBDA, delta)
    dampEuler(leftHand.current, lHand.x, lHand.y, lHand.z, POSE_LAMBDA, delta)
    dampEuler(rightHand.current, rHand.x, rHand.y, rHand.z, POSE_LAMBDA, delta)
    dampEuler(leftThigh.current, lThigh.x, lThigh.y, lThigh.z, POSE_LAMBDA, delta)
    dampEuler(rightThigh.current, rThigh.x, rThigh.y, rThigh.z, POSE_LAMBDA, delta)
    dampEuler(leftKnee.current, lKnee.x, lKnee.y, lKnee.z, POSE_LAMBDA, delta)
    dampEuler(rightKnee.current, rKnee.x, rKnee.y, rKnee.z, POSE_LAMBDA, delta)
    dampEuler(leftFoot.current, lFoot.x, lFoot.y, lFoot.z, POSE_LAMBDA, delta)
    dampEuler(rightFoot.current, rFoot.x, rFoot.y, rFoot.z, POSE_LAMBDA, delta)
  })

  return (
    <group ref={bob}>
      <Box size={[0.32, 0.32, 0.32]} position={[0, 0.62, 0]} color={HEAD} />
      <Box size={[0.44, 0.5, 0.26]} position={[0, 0.16, 0]} color={BODY} />

      <group ref={leftShoulder} position={[-0.24, 0.36, 0]}>
        <Box size={[0.12, 0.08, 0.16]} position={[-0.04, 0, 0]} color={JOINT} />
        <Box size={[0.11, 0.24, 0.11]} position={[0, -0.12, 0]} color={LIMB} />
        <group ref={leftElbow} position={[0, -0.24, 0]}>
          <Box size={[0.08, 0.08, 0.08]} position={[0, 0, 0]} color={JOINT} />
          <Box size={[0.1, 0.22, 0.1]} position={[0, -0.12, 0]} color={LIMB} />
          <group ref={leftHand} position={[0, -0.24, 0]}>
            <Box size={[0.08, 0.08, 0.1]} position={[0, -0.03, -0.02]} color={HAND} />
          </group>
        </group>
      </group>

      <group ref={rightShoulder} position={[0.24, 0.36, 0]}>
        <Box size={[0.12, 0.08, 0.16]} position={[0.04, 0, 0]} color={JOINT} />
        <Box size={[0.11, 0.24, 0.11]} position={[0, -0.12, 0]} color={LIMB} />
        <group ref={rightElbow} position={[0, -0.24, 0]}>
          <Box size={[0.08, 0.08, 0.08]} position={[0, 0, 0]} color={JOINT} />
          <Box size={[0.1, 0.22, 0.1]} position={[0, -0.12, 0]} color={LIMB} />
          <group ref={rightHand} position={[0, -0.24, 0]}>
            <Box size={[0.08, 0.08, 0.1]} position={[0, -0.03, -0.02]} color={HAND} />
            <Gun />
            <group ref={muzzle} position={[0.02, 0.01, -0.58]} rotation={[0, Math.PI, 0]} />
          </group>
        </group>
      </group>

      <group ref={leftThigh} position={[-0.11, -0.16, 0]}>
        <Box size={[0.16, 0.32, 0.16]} position={[0, -0.16, 0]} color={LIMB} />
        <group ref={leftKnee} position={[0, -0.32, 0]}>
          <Box size={[0.1, 0.1, 0.1]} position={[0, 0, 0]} color={JOINT} />
          <Box size={[0.14, 0.3, 0.14]} position={[0, -0.16, 0]} color={LIMB} />
          <group ref={leftFoot} position={[0, -0.32, 0]}>
            <Box size={[0.13, 0.07, 0.22]} position={[0, -0.02, -0.06]} color={JOINT} />
          </group>
        </group>
      </group>

      <group ref={rightThigh} position={[0.11, -0.16, 0]}>
        <Box size={[0.16, 0.32, 0.16]} position={[0, -0.16, 0]} color={LIMB} />
        <group ref={rightKnee} position={[0, -0.32, 0]}>
          <Box size={[0.1, 0.1, 0.1]} position={[0, 0, 0]} color={JOINT} />
          <Box size={[0.14, 0.3, 0.14]} position={[0, -0.16, 0]} color={LIMB} />
          <group ref={rightFoot} position={[0, -0.32, 0]}>
            <Box size={[0.13, 0.07, 0.22]} position={[0, -0.02, -0.06]} color={JOINT} />
          </group>
        </group>
      </group>
    </group>
  )
}
