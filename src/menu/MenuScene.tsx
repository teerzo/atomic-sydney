import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'

function OrbitCamera() {
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.12
    state.camera.position.set(Math.sin(t) * 11, 4.4 + Math.sin(t * 0.6) * 0.4, Math.cos(t) * 11)
    state.camera.lookAt(0, 1.1, 0)
  })
  return null
}

function FloatingShape({
  position,
  color,
  speed,
  kind,
}: {
  position: [number, number, number]
  color: string
  speed: number
  kind: 'box' | 'capsule' | 'icosahedron'
}) {
  const mesh = useRef<Mesh>(null)

  useFrame((_, delta) => {
    if (!mesh.current) return
    mesh.current.rotation.x += delta * speed
    mesh.current.rotation.y += delta * speed * 0.65
  })

  return (
    <mesh ref={mesh} position={position} castShadow>
      {kind === 'box' && <boxGeometry args={[1.15, 1.15, 1.15]} />}
      {kind === 'capsule' && <capsuleGeometry args={[0.38, 0.85, 4, 12]} />}
      {kind === 'icosahedron' && <icosahedronGeometry args={[0.78, 0]} />}
      <meshStandardMaterial color={color} metalness={0.45} roughness={0.28} />
    </mesh>
  )
}

export function MenuScene() {
  const preview = useRef<Group>(null)

  useFrame((_, delta) => {
    if (preview.current) {
      preview.current.rotation.y += delta * 0.18
    }
  })

  return (
    <>
      <color attach="background" args={['#0b1020']} />
      <fog attach="fog" args={['#0b1020', 14, 42]} />
      <ambientLight intensity={0.28} />
      <directionalLight position={[6, 12, 6]} intensity={1.35} castShadow />
      <pointLight position={[-5, 4, -3]} color="#5eead4" intensity={2.2} />
      <pointLight position={[4, 2, 6]} color="#7c9cff" intensity={1.4} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color="#12182b" />
      </mesh>
      <gridHelper args={[40, 40, '#24486d', '#152238']} position={[0, -0.99, 0]} />

      <group ref={preview}>
        <FloatingShape position={[-2.4, 0.6, 1.2]} color="#5eead4" speed={0.35} kind="box" />
        <FloatingShape position={[2.2, 1.4, -1.1]} color="#7c9cff" speed={0.55} kind="icosahedron" />
        <FloatingShape position={[0.2, 2.2, 2.1]} color="#ffe082" speed={0.42} kind="capsule" />
        <FloatingShape position={[-1.1, 1.8, -2.4]} color="#80cbc4" speed={0.28} kind="box" />
        <mesh position={[0, 0.15, 0]} castShadow>
          <capsuleGeometry args={[0.4, 1, 4, 12]} />
          <meshStandardMaterial color="#9ad7cc" metalness={0.2} roughness={0.4} />
        </mesh>
      </group>

      <OrbitCamera />
    </>
  )
}
