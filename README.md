# Atomic Sydney

A basic third-person shooter built with React, React Three Fiber, Three.js, and Rapier physics.

The main menu runs on its own Three.js canvas. **Play** unmounts that scene and loads a Rapier-powered arena with a capsule player, mouse-look camera, and simple projectiles.

## Stack

- [Vite](https://vite.dev/) + React + TypeScript
- [Three.js](https://threejs.org/)
- [@react-three/fiber](https://r3f.docs.pmnd.rs/)
- [@react-three/drei](https://github.com/pmndrs/drei)
- [@react-three/rapier](https://github.com/pmndrs/react-three-rapier)

## Getting started

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`).

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Typecheck and build for production |
| `npm run preview` | Preview the production build |

## How to play

1. **Play** starts the game. Click the canvas to capture the mouse.
2. **Options** sets mouse sensitivity, then **Back** returns to the menu.
3. **Esc** in-game returns to the main menu.

| Input | Action |
| --- | --- |
| W A S D / arrows | Move (relative to the camera) |
| Mouse | Look |
| Left click | Shoot |
| Space | Jump |
| Esc | Return to menu |

The arena has a ground plane, static walls and pillars, and a few dynamic crates you can knock around with projectiles.

## Project layout

```
src/
  App.tsx                 Screen state: menu, options, game
  screens/
    MainMenu.tsx          Play / Options overlay
    OptionsMenu.tsx       Sensitivity slider
    Game.tsx              Game canvas, physics world, HUD
  menu/
    MenuScene.tsx         Decorative Three.js menu background
  game/
    Player.tsx            Third-person capsule, camera, shooting
    Ground.tsx            Static ground collider
    Obstacles.tsx         Walls, pillars, dynamic crates
    Projectile.tsx        Short-lived physics spheres
```

Menu and gameplay use **separate canvases**. Opening Play tears down the menu scene and mounts the Rapier world.
