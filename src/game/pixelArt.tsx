import { useLoader } from '@react-three/fiber'
import { useLayoutEffect, useMemo } from 'react'
import {
  BoxGeometry,
  NearestFilter,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from 'three'
import bullet from '../assets/textures/bullet.png'
import body from '../assets/textures/char-body.png'
import bodyFront from '../assets/textures/char-body-front.png'
import foot from '../assets/textures/char-foot.png'
import hand from '../assets/textures/char-hand.png'
import head from '../assets/textures/char-head.png'
import headFront from '../assets/textures/char-head-front.png'
import headTop from '../assets/textures/char-head-top.png'
import joint from '../assets/textures/char-joint.png'
import limb from '../assets/textures/char-limb.png'
import crate from '../assets/textures/crate.png'
import floor from '../assets/textures/floor.png'
import gun from '../assets/textures/gun.png'
import gunAccent from '../assets/textures/gun-accent.png'
import gunMetal from '../assets/textures/gun-metal.png'
import pillar from '../assets/textures/pillar.png'
import wall from '../assets/textures/wall.png'

export const maps = {
  floor,
  wall,
  pillar,
  crate,
  head,
  headFront,
  headTop,
  body,
  bodyFront,
  limb,
  joint,
  hand,
  foot,
  gun,
  gunMetal,
  gunAccent,
  bullet,
}

function configurePixelTexture(texture: Texture) {
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = NearestFilter
  texture.minFilter = NearestFilter
  texture.generateMipmaps = false
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.needsUpdate = true
  return texture
}

export function usePixelMap(url: string) {
  const source = useLoader(TextureLoader, url)
  const texture = useMemo(() => configurePixelTexture(source.clone()), [source])
  useLayoutEffect(() => () => texture.dispose(), [texture])
  return texture
}

function usePixelMaps(urls: readonly string[]) {
  const sources = useLoader(TextureLoader, urls as string[])
  const textures = useMemo(
    () => sources.map((source) => configurePixelTexture(source.clone())),
    [sources],
  )
  useLayoutEffect(() => () => textures.forEach((item) => item.dispose()), [textures])
  return textures
}

export function tiledBoxGeometry(width: number, height: number, depth: number, tile = 1) {
  const geometry = new BoxGeometry(width, height, depth)
  const uv = geometry.attributes.uv
  const scales: Array<[number, number]> = [
    [depth / tile, height / tile],
    [depth / tile, height / tile],
    [width / tile, depth / tile],
    [width / tile, depth / tile],
    [width / tile, height / tile],
    [width / tile, height / tile],
  ]
  for (let face = 0; face < 6; face++) {
    const [uScale, vScale] = scales[face]
    for (let i = 0; i < 4; i++) {
      const index = face * 4 + i
      uv.setXY(index, uv.getX(index) * uScale, uv.getY(index) * vScale)
    }
  }
  uv.needsUpdate = true
  return geometry
}

type MaterialOpts = {
  attach?: string
  roughness?: number
  metalness?: number
  emissive?: string
  emissiveIntensity?: number
  emissiveMap?: Texture
  toneMapped?: boolean
}

function PixelMaterial({
  map,
  attach,
  roughness = 0.78,
  metalness = 0.08,
  emissive,
  emissiveIntensity,
  emissiveMap,
  toneMapped,
}: { map: Texture } & MaterialOpts) {
  return (
    <meshStandardMaterial
      attach={attach}
      map={map}
      roughness={roughness}
      metalness={metalness}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
      emissiveMap={emissiveMap}
      toneMapped={toneMapped}
    />
  )
}

type PixelBoxProps = {
  args: [number, number, number]
  map: string
  tileSize?: number
  castShadow?: boolean
  receiveShadow?: boolean
} & Omit<MaterialOpts, 'attach'>

export function PixelBox({
  args: [width, height, depth],
  map,
  tileSize = 1,
  castShadow = true,
  receiveShadow = true,
  ...material
}: PixelBoxProps) {
  const texture = usePixelMap(map)
  const geometry = useMemo(
    () => tiledBoxGeometry(width, height, depth, tileSize),
    [width, height, depth, tileSize],
  )
  useLayoutEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh geometry={geometry} castShadow={castShadow} receiveShadow={receiveShadow}>
      <PixelMaterial map={texture} {...material} />
    </mesh>
  )
}

type FaceMaps = {
  right?: string
  left?: string
  top?: string
  bottom?: string
  back?: string
  front?: string
}

type PixelPartProps = {
  size: [number, number, number]
  position: [number, number, number]
  map: string
  faces?: FaceMaps
} & Omit<MaterialOpts, 'attach'>

function FacedPixelPart({
  size,
  position,
  map,
  faces,
  ...material
}: PixelPartProps & { faces: FaceMaps }) {
  const urls = useMemo(
    () => [
      faces.right ?? map,
      faces.left ?? map,
      faces.top ?? map,
      faces.bottom ?? map,
      faces.back ?? map,
      faces.front ?? map,
    ],
    [map, faces.right, faces.left, faces.top, faces.bottom, faces.back, faces.front],
  )
  const textures = usePixelMaps(urls)

  return (
    <mesh position={position} castShadow>
      <boxGeometry args={size} />
      {textures.map((texture, index) => (
        <PixelMaterial key={index} attach={`material-${index}`} map={texture} {...material} />
      ))}
    </mesh>
  )
}

function UniformPixelPart({ size, position, map, ...material }: PixelPartProps) {
  const texture = usePixelMap(map)
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={size} />
      <PixelMaterial map={texture} {...material} />
    </mesh>
  )
}

export function PixelPart(props: PixelPartProps) {
  return props.faces ? <FacedPixelPart {...props} faces={props.faces} /> : <UniformPixelPart {...props} />
}
