import { KeyboardControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { Ground } from '../game/Ground'
import { Obstacles } from '../game/Obstacles'
import { Player } from '../game/Player'
import { Projectile, type ProjectileSpawn } from '../game/Projectile'

const controls = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'back', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] },
  { name: 'jump', keys: ['Space'] },
]

type GameProps = {
  sensitivity: number
  onExit: () => void
}

function GameWorld({
  sensitivity,
  onShoot,
}: {
  sensitivity: number
  onShoot: (shot: Omit<ProjectileSpawn, 'id'>) => void
}) {
  return (
    <>
      <Ground />
      <Obstacles />
      <Player sensitivity={sensitivity} onShoot={onShoot} />
    </>
  )
}

export function Game({ sensitivity, onExit }: GameProps) {
  const [shots, setShots] = useState<ProjectileSpawn[]>([])
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Escape') onExit()
    }
    const onLockChange = () => {
      setLocked(Boolean(document.pointerLockElement))
    }

    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerlockchange', onLockChange)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerlockchange', onLockChange)
    }
  }, [onExit])

  const onShoot = useCallback((shot: Omit<ProjectileSpawn, 'id'>) => {
    const id = Date.now() + Math.random()
    setShots((current) => [...current, { id, ...shot }])
    window.setTimeout(() => {
      setShots((current) => current.filter((item) => item.id !== id))
    }, 2500)
  }, [])

  return (
    <div className="screen">
      <Canvas shadows camera={{ fov: 60, position: [0, 5, 10] }}>
        <color attach="background" args={['#87a0b8']} />
        <fog attach="fog" args={['#87a0b8', 28, 70]} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[12, 22, 10]} intensity={1.25} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
        <KeyboardControls map={controls}>
          <Suspense fallback={null}>
            <Physics gravity={[0, -9.81, 0]}>
              <GameWorld sensitivity={sensitivity} onShoot={onShoot} />
              {shots.map((shot) => (
                <Projectile key={shot.id} position={shot.position} velocity={shot.velocity} />
              ))}
            </Physics>
          </Suspense>
        </KeyboardControls>
      </Canvas>
      {locked && <div className="crosshair" />}
      <p className="hud-hint">
        {locked ? 'WASD move · Mouse look · Click shoot · Space jump · Esc menu' : 'Click to play · Esc menu'}
      </p>
    </div>
  )
}
