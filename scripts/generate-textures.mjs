import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '../src/assets/textures')

const C = {
  ink: [18, 22, 28],
  grout: [36, 42, 48],
  moss: [45, 74, 58],
  mossMid: [61, 90, 76],
  mossLite: [86, 122, 98],
  stone: [74, 88, 84],
  stoneLite: [98, 112, 104],
  stoneDark: [52, 64, 60],
  brick: [74, 98, 112],
  brickLite: [98, 122, 134],
  brickDark: [52, 72, 84],
  brickDeep: [40, 56, 66],
  mortar: [32, 40, 46],
  pillar: [91, 110, 122],
  pillarLite: [118, 136, 146],
  pillarDark: [64, 80, 90],
  band: [46, 168, 154],
  bandDark: [30, 110, 102],
  wood: [196, 138, 74],
  woodLite: [220, 168, 104],
  woodMid: [168, 112, 58],
  woodDark: [112, 70, 36],
  woodDeep: [72, 44, 24],
  iron: [58, 62, 70],
  ironLite: [92, 98, 108],
  ironDark: [32, 34, 40],
  nail: [28, 28, 32],
  head: [154, 240, 227],
  headLite: [196, 252, 242],
  headDark: [110, 196, 186],
  body: [94, 234, 212],
  bodyLite: [140, 248, 228],
  bodyDark: [46, 168, 154],
  bodyDeep: [30, 110, 102],
  limb: [58, 169, 154],
  limbLite: [90, 196, 182],
  limbDark: [40, 122, 112],
  joint: [46, 138, 126],
  jointLite: [72, 164, 152],
  jointDark: [28, 96, 88],
  hand: [126, 217, 203],
  handLite: [168, 236, 224],
  handDark: [86, 168, 156],
  visor: [18, 28, 36],
  visorGlow: [94, 234, 212],
  eye: [232, 252, 248],
  gun: [27, 36, 51],
  gunLite: [58, 72, 92],
  gunMid: [42, 54, 72],
  metal: [61, 74, 92],
  metalLite: [96, 112, 132],
  metalDark: [36, 46, 60],
  accent: [94, 234, 212],
  accentLite: [180, 255, 240],
  bulletCore: [255, 252, 232],
  bullet: [255, 224, 130],
  bulletMid: [255, 186, 64],
  bulletRim: [232, 140, 32],
  bulletDark: [140, 72, 16],
}

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type)
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1)
    raw[row] = 0
    for (let x = 0; x < width; x++) {
      const s = (y * width + x) * 4
      const d = row + 1 + x * 4
      raw[d] = rgba[s]
      raw[d + 1] = rgba[s + 1]
      raw[d + 2] = rgba[s + 2]
      raw[d + 3] = rgba[s + 3]
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function hash(x, y, seed = 0) {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1274126177)
  n = Math.imul(n ^ (n >>> 13), 1274126177)
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296
}

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

function shade(c, amt) {
  return [
    Math.min(255, Math.max(0, c[0] + amt)),
    Math.min(255, Math.max(0, c[1] + amt)),
    Math.min(255, Math.max(0, c[2] + amt)),
  ]
}

class Pix {
  constructor(w, h, fill = [0, 0, 0, 255]) {
    this.w = w
    this.h = h
    this.data = new Uint8Array(w * h * 4)
    this.fill(fill)
  }

  fill(c) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) this.p(x, y, c)
  }

  p(x, y, c) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return
    const i = (y * this.w + x) * 4
    this.data[i] = c[0]
    this.data[i + 1] = c[1]
    this.data[i + 2] = c[2]
    this.data[i + 3] = c[3] ?? 255
  }

  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.p(x + i, y + j, c)
  }

  frame(x, y, w, h, c) {
    this.rect(x, y, w, 1, c)
    this.rect(x, y + h - 1, w, 1, c)
    this.rect(x, y, 1, h, c)
    this.rect(x + w - 1, y, 1, h, c)
  }

  line(x0, y0, x1, y1, c) {
    const dx = Math.abs(x1 - x0)
    const sx = x0 < x1 ? 1 : -1
    const dy = -Math.abs(y1 - y0)
    const sy = y0 < y1 ? 1 : -1
    let err = dx + dy
    for (;;) {
      this.p(x0, y0, c)
      if (x0 === x1 && y0 === y1) break
      const e2 = 2 * err
      if (e2 >= dy) {
        err += dy
        x0 += sx
      }
      if (e2 <= dx) {
        err += dx
        y0 += sy
      }
    }
  }

  noise(fn) {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const c = fn(x, y, hash(x, y, 7))
        if (c) this.p(x, y, c)
      }
    }
  }

  png() {
    return encodePng(this.w, this.h, this.data)
  }
}

function armorPanel(size, base, lite, dark, { emblem = false, visor = false, top = false } = {}) {
  const p = new Pix(size, size, base)
  p.rect(1, 1, size - 2, Math.ceil(size * 0.45), lite)
  p.rect(1, Math.floor(size * 0.62), size - 2, size - Math.floor(size * 0.62) - 1, dark)
  p.frame(0, 0, size, size, C.ink)
  p.frame(1, 1, size - 2, size - 2, dark)
  p.rect(2, 2, size - 4, 1, lite)
  p.rect(2, 2, 1, size - 4, lite)
  if (top) {
    p.rect(3, 3, size - 6, size - 6, lite)
    p.rect(5, 5, size - 10, size - 10, base)
    p.p(size / 2 - 1, size / 2 - 1, dark)
    p.p(size / 2, size / 2 - 1, dark)
    p.p(size / 2 - 1, size / 2, dark)
    p.p(size / 2, size / 2, dark)
  }
  if (visor) {
    p.rect(2, 5, size - 4, 6, C.visor)
    p.rect(3, 6, size - 6, 4, shade(C.visor, 12))
    p.p(4, 7, C.eye)
    p.p(5, 7, C.visorGlow)
    p.p(size - 6, 7, C.eye)
    p.p(size - 5, 7, C.visorGlow)
    p.rect(6, 8, size - 12, 1, C.visorGlow)
    p.rect(3, 12, size - 6, 2, dark)
  }
  if (emblem) {
    p.rect(5, 4, 6, 1, dark)
    p.rect(4, 5, 8, 6, C.bodyDeep)
    p.rect(5, 6, 6, 4, C.visor)
    p.p(7, 7, C.accentLite)
    p.p(8, 7, C.visorGlow)
    p.p(7, 8, C.visorGlow)
    p.p(8, 8, C.bodyLite)
    p.rect(5, 11, 6, 1, dark)
  }
  p.p(2, 2, lite)
  p.p(size - 3, size - 3, C.ink)
  return p
}

function floorTex() {
  const p = new Pix(32, 32, C.moss)
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const tile = Math.floor(x / 8) + Math.floor(y / 8) * 4
      const grout = x % 8 === 0 || y % 8 === 0
      if (grout) {
        p.p(x, y, hash(x, y, 1) > 0.35 ? C.grout : C.stoneDark)
        continue
      }
      const n = hash(x, y, tile)
      const base = n > 0.72 ? C.mossLite : n > 0.28 ? C.mossMid : C.moss
      p.p(x, y, n > 0.93 ? C.stone : n > 0.88 ? C.stoneLite : base)
    }
  }
  for (const [sx, sy] of [
    [3, 11],
    [18, 5],
    [11, 22],
    [25, 19],
  ]) {
    p.p(sx, sy, C.stoneDark)
    p.p(sx + 1, sy, C.grout)
    p.p(sx, sy + 1, C.grout)
  }
  return p
}

function wallTex() {
  const p = new Pix(32, 32, C.mortar)
  const brickH = 8
  const brickW = 16
  for (let row = 0; row < 4; row++) {
    const y = row * brickH
    const offset = row % 2 === 0 ? 0 : brickW / 2
    for (let col = -1; col < 3; col++) {
      const x = col * brickW + offset
      const n = hash(col + 3, row, 4)
      const fill = n > 0.66 ? C.brickLite : n > 0.33 ? C.brick : C.brickDark
      p.rect(x + 1, y + 1, brickW - 1, brickH - 1, fill)
      p.rect(x + 2, y + 1, brickW - 3, 1, shade(fill, 18))
      p.rect(x + 2, y + brickH - 2, brickW - 3, 1, shade(fill, -22))
      p.p(x + 3, y + 3, shade(fill, 28))
      if (n > 0.8) p.p(x + 8, y + 4, C.brickDeep)
    }
  }
  return p
}

function pillarTex() {
  const p = new Pix(32, 32, C.pillar)
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      let c = C.pillar
      if (x < 4) c = C.pillarDark
      else if (x < 8) c = mix(C.pillarDark, C.pillar, 0.5)
      else if (x > 27) c = C.pillarDark
      else if (x > 23) c = mix(C.pillar, C.pillarLite, 0.35)
      else if (hash(x, y, 9) > 0.82) c = shade(C.pillar, hash(x, y, 3) > 0.5 ? 12 : -14)
      p.p(x, y, c)
    }
  }
  for (const y of [0, 1, 15, 16, 30, 31]) {
    p.rect(2, y, 28, 1, y % 15 === 0 ? C.bandDark : C.band)
  }
  p.rect(0, 0, 2, 32, C.ink)
  p.rect(30, 0, 2, 32, C.ink)
  for (const y of [7, 23]) {
    p.p(15, y, C.ironDark)
    p.p(16, y, C.ironLite)
    p.p(15, y + 1, C.iron)
    p.p(16, y + 1, C.ironDark)
  }
  return p
}

function crateTex() {
  const p = new Pix(32, 32, C.wood)
  for (let y = 3; y < 29; y++) {
    const plank = Math.floor((y - 3) / 5)
    const fill = plank % 2 === 0 ? C.wood : C.woodMid
    p.rect(3, y, 26, 1, fill)
    for (let x = 3; x < 29; x++) {
      if (hash(x, y, 12) > 0.9) p.p(x, y, shade(fill, -18))
      if (hash(x, y, 21) > 0.96) p.p(x, y, C.woodLite)
    }
  }
  p.frame(0, 0, 32, 32, C.ironDark)
  p.frame(1, 1, 30, 30, C.iron)
  p.frame(2, 2, 28, 28, C.ironLite)
  const brace = C.woodDeep
  p.line(5, 5, 26, 26, brace)
  p.line(6, 5, 26, 25, C.woodDark)
  p.line(26, 5, 5, 26, brace)
  p.line(25, 5, 5, 25, C.woodDark)
  for (const [x, y] of [
    [2, 2],
    [26, 2],
    [2, 26],
    [26, 26],
  ]) {
    p.rect(x, y, 4, 4, C.iron)
    p.frame(x, y, 4, 4, C.ironDark)
    p.p(x + 1, y + 1, C.ironLite)
  }
  for (const [x, y] of [
    [8, 4],
    [23, 4],
    [8, 27],
    [23, 27],
    [4, 10],
    [27, 10],
    [4, 21],
    [27, 21],
  ]) {
    p.p(x, y, C.nail)
    p.p(x + 1, y, C.ironLite)
  }
  return p
}

function limbTex() {
  const p = armorPanel(16, C.limb, C.limbLite, C.limbDark)
  p.rect(3, 7, 10, 2, C.limbDark)
  p.rect(4, 8, 8, 1, C.jointDark)
  return p
}

function jointTex() {
  const p = new Pix(8, 8, C.joint)
  p.rect(1, 1, 6, 6, C.jointLite)
  p.rect(2, 2, 4, 4, C.joint)
  p.frame(0, 0, 8, 8, C.jointDark)
  p.p(2, 2, C.bodyLite)
  p.p(5, 5, C.ink)
  return p
}

function handTex() {
  const p = new Pix(8, 8, C.hand)
  p.rect(1, 1, 6, 3, C.handLite)
  p.frame(0, 0, 8, 8, C.handDark)
  p.rect(2, 5, 4, 1, C.handDark)
  p.p(2, 2, C.headLite)
  return p
}

function footTex() {
  const p = new Pix(8, 8, C.joint)
  p.rect(1, 1, 6, 2, C.jointLite)
  p.rect(1, 5, 6, 2, C.jointDark)
  p.frame(0, 0, 8, 8, C.ink)
  p.rect(2, 3, 4, 1, C.bodyDeep)
  return p
}

function gunTex() {
  const p = new Pix(16, 16, C.gun)
  p.rect(1, 1, 14, 6, C.gunMid)
  p.rect(1, 1, 14, 1, C.gunLite)
  p.frame(0, 0, 16, 16, C.ink)
  for (let x = 2; x < 14; x += 3) p.rect(x, 8, 1, 6, C.gunMid)
  p.rect(2, 3, 12, 1, C.metalDark)
  p.p(12, 2, C.accent)
  return p
}

function gunMetalTex() {
  const p = new Pix(16, 16, C.metal)
  p.rect(1, 1, 14, 5, C.metalLite)
  p.frame(0, 0, 16, 16, C.metalDark)
  for (let y = 6; y < 15; y += 2) p.rect(2, y, 12, 1, C.metalDark)
  p.p(3, 3, C.accent)
  p.p(12, 3, shade(C.metalLite, 20))
  return p
}

function gunAccentTex() {
  const p = new Pix(8, 8, C.accent)
  p.rect(1, 1, 6, 3, C.accentLite)
  p.frame(0, 0, 8, 8, C.bodyDeep)
  p.p(2, 2, C.eye)
  p.p(5, 5, C.bodyDark)
  return p
}

function bulletTex() {
  const p = new Pix(16, 16, C.bulletDark)
  const cx = 7.5
  const cy = 7.5
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x - cx, y - cy)
      if (d < 1.6) p.p(x, y, C.bulletCore)
      else if (d < 3.2) p.p(x, y, C.bullet)
      else if (d < 4.6) p.p(x, y, C.bulletMid)
      else if (d < 6) p.p(x, y, C.bulletRim)
      else if (d < 7.4) p.p(x, y, C.bulletDark)
    }
  }
  p.p(6, 6, C.eye)
  p.p(5, 7, C.bulletCore)
  return p
}

const textures = {
  'floor.png': floorTex(),
  'wall.png': wallTex(),
  'pillar.png': pillarTex(),
  'crate.png': crateTex(),
  'char-head.png': armorPanel(16, C.head, C.headLite, C.headDark),
  'char-head-front.png': armorPanel(16, C.head, C.headLite, C.headDark, { visor: true }),
  'char-head-top.png': armorPanel(16, C.head, C.headLite, C.headDark, { top: true }),
  'char-body.png': armorPanel(16, C.body, C.bodyLite, C.bodyDark),
  'char-body-front.png': armorPanel(16, C.body, C.bodyLite, C.bodyDark, { emblem: true }),
  'char-limb.png': limbTex(),
  'char-joint.png': jointTex(),
  'char-hand.png': handTex(),
  'char-foot.png': footTex(),
  'gun.png': gunTex(),
  'gun-metal.png': gunMetalTex(),
  'gun-accent.png': gunAccentTex(),
  'bullet.png': bulletTex(),
}

mkdirSync(outDir, { recursive: true })
for (const [name, pix] of Object.entries(textures)) {
  writeFileSync(join(outDir, name), pix.png())
}
console.log(`Wrote ${Object.keys(textures).length} textures to ${outDir}`)
