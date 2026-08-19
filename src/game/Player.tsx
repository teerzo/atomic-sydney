import { useKeyboardControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { CapsuleCollider, RigidBody, useRapier, type RapierRigidBody } from '@react-three/rapier'
import { useEffect, useRef } from 'react'
import { Group, Vector3 } from 'three'
import type { ProjectileSpawn } from './Projectile'

const MOVE_SPEED = 7
const JUMP_VELOCITY = 7.5
const CAMERA_DISTANCE = 6.2
const LOOK_HEIGHT = 1.15
const CAPSULE_RADIUS = 0.4
const CAPSULE_HALF_HEIGHT = 0.5
const GROUND_RAY_LENGTH = CAPSULE_HALF_HEIGHT + CAPSULE_RADIUS + 0.12
const PROJECTILE_SPEED = 38

type Controls = {
  forward: boolean
  back: boolean
  left: boolean
  right: boolean
  jump: boolean
}

type PlayerProps = {
  sensitivity: number
  onShoot: (shot: Omit<ProjectileSpawn, 'id'>) => void
}

export function Player({ sensitivity, onShoot }: PlayerProps) {
  const body = useRef<RapierRigidBody>(null)
  const visual = useRef<Group>(null)
  const yaw = useRef(0)
  const pitch = useRef(0.28)
  const lookAt = useRef(new Vector3())
  const desiredCam = useRef(new Vector3())
  const { gl, camera } = useThree()
  const { rapier, world } = useRapier()
  const ray = useRef(new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 })).current
  const [, get] = useKeyboardControls<keyof Controls>()

  useEffect(() => {
    const canvas = gl.domElement

    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return
      yaw.current -= event.movementX * sensitivity * 0.0022
      pitch.current = Math.min(0.85, Math.max(-0.55, pitch.current + event.movementY * sensitivity * 0.0022))
    }

    const onMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return
      if (document.pointerLockElement !== canvas) {
        void canvas.requestPointerLock()
        return
      }

      const rigidBody = body.current
      if (!rigidBody) return

      const origin = rigidBody.translation()
      const cosPitch = Math.cos(pitch.current)
      const dirX = -Math.sin(yaw.current) * cosPitch
      const dirY = Math.sin(pitch.current)
      const dirZ = -Math.cos(yaw.current) * cosPitch

      onShoot({
        position: [origin.x + dirX * 1.3, origin.y + 0.35 + dirY * 1.3, origin.z + dirZ * 1.3],
        velocity: [dirX * PROJECTILE_SPEED, dirY * PROJECTILE_SPEED, dirZ * PROJECTILE_SPEED],
      })
    }

    canvas.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mousemove', onMouseMove)
    return () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
    }
  }, [gl, onShoot, sensitivity])

  useFrame((_, delta) => {
    const rigidBody = body.current
    if (!rigidBody) return

    const origin = rigidBody.translation()
    ray.origin.x = origin.x
    ray.origin.y = origin.y
    ray.origin.z = origin.z
    const grounded = world.castRay(ray, GROUND_RAY_LENGTH, true, undefined, undefined, undefined, rigidBody) !== null

    const { forward, back, left, right, jump } = get()
    const fx = -Math.sin(yaw.current)
    const fz = -Math.cos(yaw.current)
    let moveX = 0
    let moveZ = 0
    if (forward) {
      moveX += fx
      moveZ += fz
    }
    if (back) {
      moveX -= fx
      moveZ -= fz
    }
    if (right) {
      moveX -= fz
      moveZ += fx
    }
    if (left) {
      moveX += fz
      moveZ -= fx
    }

    const length = Math.hypot(moveX, moveZ)
    if (length > 0) {
      moveX = (moveX / length) * MOVE_SPEED
      moveZ = (moveZ / length) * MOVE_SPEED
    }

    const velocity = rigidBody.linvel()
    const nextY = jump && grounded ? JUMP_VELOCITY : velocity.y
    rigidBody.setLinvel({ x: moveX, y: nextY, z: moveZ }, true)

    if (visual.current) {
      visual.current.rotation.y = yaw.current
    }

    lookAt.current.set(origin.x, origin.y + LOOK_HEIGHT, origin.z)
    const cosPitch = Math.cos(pitch.current)
    desiredCam.current.set(
      origin.x + Math.sin(yaw.current) * cosPitch * CAMERA_DISTANCE,
      origin.y + LOOK_HEIGHT + Math.sin(pitch.current) * CAMERA_DISTANCE,
      origin.z + Math.cos(yaw.current) * cosPitch * CAMERA_DISTANCE,
    )
    camera.position.lerp(desiredCam.current, 1 - Math.exp(-10 * delta))
    camera.lookAt(lookAt.current)
  })

  return (
    <RigidBody
      ref={body}
      position={[0, 2, 0]}
      colliders={false}
      lockRotations
      friction={0.8}
      restitution={0}
      canSleep={false}
    >
      <CapsuleCollider args={[CAPSULE_HALF_HEIGHT, CAPSULE_RADIUS]} mass={1} />
      <group ref={visual}>
        <mesh castShadow>
          <capsuleGeometry args={[CAPSULE_RADIUS, CAPSULE_HALF_HEIGHT * 2, 4, 12]} />
          <meshStandardMaterial color="#5eead4" />
        </mesh>
        <mesh position={[0.35, 0.12, -0.58]} rotation={[0.08, 0, 0]} castShadow>
          <boxGeometry args={[0.12, 0.12, 0.72]} />
          <meshStandardMaterial color="#1a2332" />
        </mesh>
      </group>
    </RigidBody>
  )
}
