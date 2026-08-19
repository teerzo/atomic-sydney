import { useKeyboardControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { CapsuleCollider, RigidBody, useRapier, type RapierCollider, type RapierRigidBody } from '@react-three/rapier'
import { useEffect, useRef } from 'react'
import { Group, PerspectiveCamera, Vector3 } from 'three'
import { PlayerModel, type Locomotion } from './PlayerModel'
import type { ProjectileSpawn } from './Projectile'

const MOVE_SPEED = 7
const CROUCH_SPEED_SCALE = 0.45
const JUMP_VELOCITY = 7.5
const CAMERA_DISTANCE = 6.2
const ADS_DISTANCE = 3.8
const HIP_FOV = 60
const ADS_FOV = 38
const ADS_LOOK_SCALE = 0.65
const CAMERA_FOLLOW_LAMBDA = 6
const LOOK_HEIGHT_LAMBDA = 8
const ZOOM_LAMBDA = 8
const MOVE_TURN_LAMBDA = 32
const MOVE_TURN_MAX_RAD_PER_SEC = 50
const AIM_TURN_LAMBDA = 9
const AIM_TURN_MAX_RAD_PER_SEC = 10
const LOOK_HEIGHT = 1.15
const CROUCH_LOOK_HEIGHT = 0.7
const CAPSULE_RADIUS = 0.4
const CAPSULE_HALF_HEIGHT = 0.5
const CROUCH_HALF_HEIGHT = 0.25
const GROUND_SKIN = 0.1

function capsuleCenterY(halfHeight: number) {
  return halfHeight + CAPSULE_RADIUS
}

function applyCapsuleFromFeet(capsule: RapierCollider, halfHeight: number) {
  capsule.setHalfHeight(halfHeight)
  capsule.setTranslationWrtParent({ x: 0, y: capsuleCenterY(halfHeight), z: 0 })
}

function currentHalfHeight(crouched: boolean) {
  return crouched ? CROUCH_HALF_HEIGHT : CAPSULE_HALF_HEIGHT
}

const SHOULDER_OFFSET = 0.62
const SHOULDER_ADS_OFFSET = 0.72
const SHOULDER_LAMBDA = 10
const PROJECTILE_SPEED = 38

function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt))
}

function dampAngle(current: number, target: number, lambda: number, dt: number, maxSpeed: number) {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current))
  const maxStep = maxSpeed * dt
  const step = Math.max(-maxStep, Math.min(maxStep, delta * (1 - Math.exp(-lambda * dt))))
  return current + step
}

type Controls = {
  forward: boolean
  back: boolean
  left: boolean
  right: boolean
  jump: boolean
  crouch: boolean
  shoulder: boolean
}

type PlayerProps = {
  sensitivity: number
  onShoot: (shot: Omit<ProjectileSpawn, 'id'>) => void
}

export function Player({ sensitivity, onShoot }: PlayerProps) {
  const body = useRef<RapierRigidBody>(null)
  const collider = useRef<RapierCollider>(null)
  const visual = useRef<Group>(null)
  const muzzle = useRef<Group>(null)
  const locomotion = useRef<Locomotion>({
    forward: false,
    back: false,
    left: false,
    right: false,
    grounded: true,
    crouched: false,
    aiming: false,
    aimPitch: 0,
    aimYawOffset: 0,
  })
  const crouched = useRef(false)
  const crouchHeld = useRef(false)
  const aiming = useRef(false)
  const shoulder = useRef(1)
  const shoulderHeld = useRef(false)
  const shoulderBlend = useRef(1)
  const lookHeight = useRef(LOOK_HEIGHT)
  const cameraDistance = useRef(CAMERA_DISTANCE)
  const fov = useRef(HIP_FOV)
  const yaw = useRef(0)
  const pitch = useRef(0.28)
  const visualYaw = useRef(0)
  const lookAt = useRef(new Vector3())
  const desiredCam = useRef(new Vector3())
  const { gl, camera } = useThree()
  const { rapier, world } = useRapier()
  const downRay = useRef(new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 })).current
  const upRay = useRef(new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 })).current
  const [, get] = useKeyboardControls<keyof Controls>()

  useEffect(() => {
    const canvas = gl.domElement

    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return
      const lookScale = aiming.current ? ADS_LOOK_SCALE : 1
      yaw.current -= event.movementX * sensitivity * 0.0022 * lookScale
      pitch.current = Math.min(0.85, Math.max(-0.55, pitch.current + event.movementY * sensitivity * 0.0022 * lookScale))
    }

    const onMouseDown = (event: MouseEvent) => {
      if (event.button === 2) {
        if (document.pointerLockElement === canvas) aiming.current = true
        return
      }
      if (event.button !== 0) return
      if (document.pointerLockElement !== canvas) {
        void canvas.requestPointerLock()
        return
      }

      const tip = muzzle.current
      if (!tip) return
      const origin = new Vector3()
      const dir = new Vector3()
      tip.getWorldPosition(origin)
      tip.getWorldDirection(dir)
      if (dir.lengthSq() < 1e-6) return
      dir.normalize()

      onShoot({
        position: [origin.x + dir.x * 0.12, origin.y + dir.y * 0.12, origin.z + dir.z * 0.12],
        velocity: [dir.x * PROJECTILE_SPEED, dir.y * PROJECTILE_SPEED, dir.z * PROJECTILE_SPEED],
      })
    }

    const onMouseUp = (event: MouseEvent) => {
      if (event.button === 2) aiming.current = false
    }

    const onContextMenu = (event: Event) => {
      event.preventDefault()
    }

    const onPointerLockChange = () => {
      if (document.pointerLockElement !== canvas) aiming.current = false
    }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('contextmenu', onContextMenu)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('pointerlockchange', onPointerLockChange)
    return () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('contextmenu', onContextMenu)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
    }
  }, [gl, onShoot, sensitivity])

  useFrame((_, delta) => {
    const rigidBody = body.current
    const capsule = collider.current
    if (!rigidBody) return

    const origin = rigidBody.translation()
    const { forward, back, left, right, jump, crouch, shoulder: shoulderKey } = get()
    const crouchPressed = crouch && !crouchHeld.current
    crouchHeld.current = crouch
    if (shoulderKey && !shoulderHeld.current) {
      shoulder.current *= -1
    }
    shoulderHeld.current = shoulderKey

    const canStand = () => {
      const crouchTop = origin.y + 2 * capsuleCenterY(CROUCH_HALF_HEIGHT)
      const extra = 2 * (CAPSULE_HALF_HEIGHT - CROUCH_HALF_HEIGHT) + 0.08
      upRay.origin.x = origin.x
      upRay.origin.y = crouchTop
      upRay.origin.z = origin.z
      return world.castRay(upRay, extra, true, undefined, undefined, undefined, rigidBody) === null
    }

    const setCrouched = (next: boolean) => {
      if (next === crouched.current) return
      if (!next && !canStand()) return
      crouched.current = next
      if (capsule) applyCapsuleFromFeet(capsule, currentHalfHeight(next))
    }

    if (crouchPressed) {
      setCrouched(!crouched.current)
    }
    let stoodFromJump = false
    if (jump && crouched.current) {
      const wasCrouched = crouched.current
      setCrouched(false)
      stoodFromJump = wasCrouched && !crouched.current
    }

    const halfHeight = currentHalfHeight(crouched.current)
    const centerY = origin.y + capsuleCenterY(halfHeight)
    downRay.origin.x = origin.x
    downRay.origin.y = centerY
    downRay.origin.z = origin.z
    const grounded =
      world.castRay(
        downRay,
        halfHeight + CAPSULE_RADIUS + GROUND_SKIN,
        true,
        undefined,
        undefined,
        undefined,
        rigidBody,
      ) !== null

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
    locomotion.current.forward = forward
    locomotion.current.back = back
    locomotion.current.left = left
    locomotion.current.right = right
    locomotion.current.grounded = grounded
    locomotion.current.crouched = crouched.current
    locomotion.current.aiming = aiming.current
    const speed = MOVE_SPEED * (crouched.current ? CROUCH_SPEED_SCALE : 1)
    if (length > 0) {
      moveX = (moveX / length) * speed
      moveZ = (moveZ / length) * speed
    }

    const velocity = rigidBody.linvel()
    const nextY = jump && grounded && !crouched.current && !stoodFromJump ? JUMP_VELOCITY : velocity.y
    rigidBody.setLinvel({ x: moveX, y: nextY, z: moveZ }, true)

    if (aiming.current) {
      visualYaw.current = dampAngle(
        visualYaw.current,
        yaw.current,
        AIM_TURN_LAMBDA,
        delta,
        AIM_TURN_MAX_RAD_PER_SEC,
      )
    } else if (length > 0) {
      const moveYaw = Math.atan2(-moveX, -moveZ)
      visualYaw.current = dampAngle(
        visualYaw.current,
        moveYaw,
        MOVE_TURN_LAMBDA,
        delta,
        MOVE_TURN_MAX_RAD_PER_SEC,
      )
    }
    locomotion.current.aimPitch = pitch.current
    locomotion.current.aimYawOffset = yaw.current - visualYaw.current

    const pos = rigidBody.translation()
    if (visual.current) {
      visual.current.position.set(pos.x, pos.y + capsuleCenterY(halfHeight), pos.z)
      visual.current.rotation.y = visualYaw.current
    }
    lookHeight.current = damp(
      lookHeight.current,
      crouched.current ? CROUCH_LOOK_HEIGHT : LOOK_HEIGHT,
      LOOK_HEIGHT_LAMBDA,
      delta,
    )
    cameraDistance.current = damp(
      cameraDistance.current,
      aiming.current ? ADS_DISTANCE : CAMERA_DISTANCE,
      ZOOM_LAMBDA,
      delta,
    )
    fov.current = damp(fov.current, aiming.current ? ADS_FOV : HIP_FOV, ZOOM_LAMBDA, delta)
    if (camera instanceof PerspectiveCamera) {
      camera.fov = fov.current
      camera.updateProjectionMatrix()
    }
    shoulderBlend.current = damp(shoulderBlend.current, shoulder.current, SHOULDER_LAMBDA, delta)
    const lateral =
      shoulderBlend.current * (aiming.current ? SHOULDER_ADS_OFFSET : SHOULDER_OFFSET)
    const rightX = Math.cos(yaw.current)
    const rightZ = -Math.sin(yaw.current)
    const eyeY = pos.y + capsuleCenterY(halfHeight) + lookHeight.current
    lookAt.current.set(pos.x + rightX * lateral, eyeY, pos.z + rightZ * lateral)
    const cosPitch = Math.cos(pitch.current)
    desiredCam.current.set(
      pos.x + Math.sin(yaw.current) * cosPitch * cameraDistance.current + rightX * lateral,
      eyeY + Math.sin(pitch.current) * cameraDistance.current,
      pos.z + Math.cos(yaw.current) * cosPitch * cameraDistance.current + rightZ * lateral,
    )
    camera.position.lerp(desiredCam.current, 1 - Math.exp(-CAMERA_FOLLOW_LAMBDA * delta))
    camera.lookAt(lookAt.current)
  })

  return (
    <>
      <RigidBody
        ref={body}
        position={[0, 1.2, 0]}
        colliders={false}
        lockRotations
        friction={0.8}
        restitution={0}
        canSleep={false}
      >
        <CapsuleCollider
          ref={collider}
          args={[CAPSULE_HALF_HEIGHT, CAPSULE_RADIUS]}
          position={[0, capsuleCenterY(CAPSULE_HALF_HEIGHT), 0]}
          mass={1}
        />
      </RigidBody>
      <group ref={visual} position={[0, 1.2 + capsuleCenterY(CAPSULE_HALF_HEIGHT), 0]}>
        <PlayerModel locomotion={locomotion} muzzle={muzzle} />
      </group>
    </>
  )
}
