import { RigidBody } from '@react-three/rapier'

export function Ground() {
  return (
    <RigidBody type="fixed" position={[0, -0.5, 0]} friction={1} restitution={0}>
      <mesh receiveShadow>
        <boxGeometry args={[80, 1, 80]} />
        <meshStandardMaterial color="#3d5a4c" />
      </mesh>
    </RigidBody>
  )
}
