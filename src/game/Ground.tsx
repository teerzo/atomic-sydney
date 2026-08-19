import { RigidBody } from '@react-three/rapier'
import { PixelBox, maps } from './pixelArt'

export function Ground() {
  return (
    <RigidBody type="fixed" position={[0, -0.5, 0]} friction={1} restitution={0}>
      <PixelBox args={[80, 1, 80]} map={maps.floor} tileSize={2} castShadow={false} roughness={0.92} />
    </RigidBody>
  )
}
