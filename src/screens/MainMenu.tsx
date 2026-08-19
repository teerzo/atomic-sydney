type MainMenuProps = {
  onPlay: () => void
  onOptions: () => void
}

export function MainMenu({ onPlay, onOptions }: MainMenuProps) {
  return (
    <div className="overlay">
      <p className="menu-kicker">Third-person</p>
      <h1 className="menu-title">Atomic Sydney</h1>
      <p className="menu-subtitle">Rapier playground</p>
      <button className="menu-btn" type="button" onClick={onPlay}>
        Play
      </button>
      <button className="menu-btn" type="button" onClick={onOptions}>
        Options
      </button>
    </div>
  )
}
