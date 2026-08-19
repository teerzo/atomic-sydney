import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { MenuScene } from './menu/MenuScene'
import { Game } from './screens/Game'
import { MainMenu } from './screens/MainMenu'
import { OptionsMenu } from './screens/OptionsMenu'

type Screen = 'menu' | 'options' | 'game'

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [sensitivity, setSensitivity] = useState(1)

  if (screen === 'game') {
    return <Game sensitivity={sensitivity} onExit={() => setScreen('menu')} />
  }

  return (
    <div className="screen">
      <Canvas camera={{ position: [10, 5, 10], fov: 50 }} shadows>
        <MenuScene />
      </Canvas>
      {screen === 'menu' ? (
        <MainMenu onPlay={() => setScreen('game')} onOptions={() => setScreen('options')} />
      ) : (
        <OptionsMenu
          sensitivity={sensitivity}
          onSensitivityChange={setSensitivity}
          onBack={() => setScreen('menu')}
        />
      )}
    </div>
  )
}
