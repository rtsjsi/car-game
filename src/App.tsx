import { useRef, useEffect, useCallback } from 'react'
import { useGame } from './game/useGame'
import { drawRoad, drawBike } from './game/draw'
import './App.css'

const CANVAS_WIDTH = 400
const CANVAS_HEIGHT = 600

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    score,
    bestScore,
    gameState,
    startGame,
    moveLeft,
    moveRight,
    activateBoost,
    handleTouchStart,
    handleTouchEnd,
    handleClick,
    boostActive,
  } = useGame(canvasRef)

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const maxW = Math.min(CANVAS_WIDTH, window.innerWidth - 48)
    canvas.width = maxW
    canvas.height = (maxW / CANVAS_WIDTH) * CANVAS_HEIGHT
  }, [])

  useEffect(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [resizeCanvas])

  useEffect(() => {
    if (gameState === 'playing') canvasRef.current?.focus()
  }, [gameState])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || gameState !== 'start') return
    drawRoad(ctx, 0, canvas.width, canvas.height)
    const laneWidth = canvas.width / 3
    const w = laneWidth * 0.6
    const h = w * 1.3
    const playerX = laneWidth * 1 + (laneWidth - w) / 2
    const playerY = canvas.height - h - 30
    drawBike(ctx, playerX, playerY, w, h, '#f97316', true)
  }, [gameState])

  const handleContainerTouch = useCallback(
    (e: React.TouchEvent) => {
      if (!(e.target as HTMLElement).closest('button')) activateBoost()
    },
    [activateBoost]
  )

  const handleContainerMouse = useCallback(
    (e: React.MouseEvent) => {
      if (!(e.target as HTMLElement).closest('button')) activateBoost()
    },
    [activateBoost]
  )

  return (
    <div className="app">
      <div className="app-bg" />
      <div className="app-content">
        <h1 className="logo">Bike Rush</h1>
        <div
          ref={containerRef}
          className="game-container"
          onTouchStart={handleContainerTouch}
          onMouseDown={handleContainerMouse}
          onClick={handleContainerMouse}
        >
          <div className="score-bar">
            <span>Score <strong>{score}</strong></span>
            <span>Best <strong>{bestScore}</strong></span>
            {boostActive && <span className="boost-indicator">TURBO</span>}
          </div>

          {gameState === 'start' && (
            <div className="overlay overlay-start">
              <h2>Ready to Ride</h2>
              <p>One lane is always clear — find it!</p>
              <button className="btn-primary" onClick={startGame}>
                Start
              </button>
            </div>
          )}

          {gameState === 'over' && (
            <div className="overlay overlay-gameover">
              <h2>Game Over</h2>
              <p>Score: <strong>{score}</strong></p>
              <button className="btn-primary" onClick={startGame}>
                Play Again
              </button>
            </div>
          )}

          <canvas
            ref={canvasRef}
            className="game-canvas"
            tabIndex={0}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={(e) => gameState === 'playing' && e.preventDefault()}
            onClick={handleClick}
            style={{ touchAction: 'none' }}
          />
        </div>

        <div className="controls">
          <button
            type="button"
            className="control-btn"
            onTouchStart={(e) => { e.preventDefault(); moveLeft() }}
            onMouseDown={(e) => { e.preventDefault(); moveLeft() }}
            aria-label="Left"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            className="control-btn"
            onTouchStart={(e) => { e.preventDefault(); moveRight() }}
            onMouseDown={(e) => { e.preventDefault(); moveRight() }}
            aria-label="Right"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <p className="hint desktop-hint">
          ← → keys to steer · Space/Up to boost
        </p>
        <p className="hint mobile-hint">
          Swipe or tap to steer · Tap anywhere to boost
        </p>
      </div>
    </div>
  )
}

export default App
