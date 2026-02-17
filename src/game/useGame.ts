import { useCallback, useEffect, useRef, useState } from 'react'
import type { Obstacle, Player } from './types'
import { drawRoad, drawBike, drawCrashOverlay } from './draw'

const LANES = 3
const OBSTACLE_COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899']
const BOOST_DURATION = 2500
const BOOST_MULTIPLIER = 1.6
const CRASH_DURATION = 50
const OVERLAP_MARGIN = 10
const SWIPE_THRESHOLD = 28
const SWIPE_MAX_TIME = 350

export function useGame(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(() =>
    parseInt(localStorage.getItem('bikeGameBest') || '0')
  )
  const [gameState, setGameState] = useState<'start' | 'playing' | 'crashing' | 'over'>('start')
  const [boostActive, setBoostActive] = useState(false)

  const stateRef = useRef({
    player: { x: 0, y: 0, width: 0, height: 0, lane: 1 } as Player,
    obstacles: [] as Obstacle[],
    roadOffset: 0,
    boostActive: false,
    boostEndTime: 0,
    crashFrame: 0,
    lastTouchTime: 0,
    touchStartX: 0,
    touchStartY: 0,
    touchStartTime: 0,
    swipeHandled: false,
    lastClickWasTouch: false,
  })

  const animRef = useRef<number>(0)
  const scoreRef = useRef(0)
  const bestScoreRef = useRef(bestScore)
  const boostActiveRef = useRef(false)
  scoreRef.current = score
  bestScoreRef.current = bestScore

  const getOccupiedLanes = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return new Set<number>()
    const h = canvas.height
    const dangerTop = h * 0.25
    const dangerBottom = h + 80
    const occupied = new Set<number>()
    for (const obs of stateRef.current.obstacles) {
      const obsBottom = obs.y + obs.height
      const obsTop = obs.y
      if (obsBottom > dangerTop && obsTop < dangerBottom) occupied.add(obs.lane)
    }
    return occupied
  }, [canvasRef])

  const createObstacle = useCallback(() => {
    const occupied = getOccupiedLanes()
    const available: number[] = []
    for (let i = 0; i < LANES; i++) {
      if (!occupied.has(i)) available.push(i)
    }
    if (available.length === 0) return

    const canvas = canvasRef.current
    if (!canvas) return
    const laneWidth = canvas.width / LANES
    const lane = available[Math.floor(Math.random() * available.length)]
    const width = laneWidth * 0.6
    const height = width * 1.3

    stateRef.current.obstacles.push({
      x: lane * laneWidth + (laneWidth - width) / 2,
      y: -height,
      width,
      height,
      lane,
      color: OBSTACLE_COLORS[Math.floor(Math.random() * OBSTACLE_COLORS.length)],
    })
  }, [canvasRef, getOccupiedLanes])

  const initGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const laneWidth = canvas.width / LANES
    const w = laneWidth * 0.6
    const h = w * 1.3

    stateRef.current = {
      ...stateRef.current,
      player: {
        x: laneWidth * 1 + (laneWidth - w) / 2,
        y: canvas.height - h - 30,
        width: w,
        height: h,
        lane: 1,
      },
      obstacles: [],
      roadOffset: 0,
      boostActive: false,
      crashFrame: 0,
      swipeHandled: false,
    }
    boostActiveRef.current = false
    setBoostActive(false)
    scoreRef.current = 0
    const stored = parseInt(localStorage.getItem('bikeGameBest') || '0')
    bestScoreRef.current = Math.max(bestScoreRef.current, stored)
    setScore(0)
    setBestScore(bestScoreRef.current)
    setGameState('playing')
  }, [canvasRef])

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const state = stateRef.current
    const { player } = state

    if (gameState === 'crashing') {
      state.crashFrame++
      if (state.crashFrame >= CRASH_DURATION) {
        setGameState('over')
        return
      }
      const t = state.crashFrame / CRASH_DURATION
      const shakeX = (Math.random() - 0.5) * 14 * (1 - t)
      const shakeY = (Math.random() - 0.5) * 10 * (1 - t)

      drawRoad(ctx, state.roadOffset, canvas.width, canvas.height)
      drawBike(ctx, player.x, player.y, player.width, player.height, '#f97316', true, shakeX, shakeY)
      for (const o of state.obstacles) {
        drawBike(ctx, o.x, o.y, o.width, o.height, o.color, false)
      }
      drawCrashOverlay(ctx, t, canvas.width, canvas.height)
      animRef.current = requestAnimationFrame(gameLoop)
      return
    }

    if (gameState !== 'playing') return

    const now = Date.now()
    if (state.boostActive && now > state.boostEndTime) {
      state.boostActive = false
      if (boostActiveRef.current) {
        boostActiveRef.current = false
        setBoostActive(false)
      }
    }

    const laneWidth = canvas.width / LANES
    const baseSpeed = 4 + scoreRef.current * 0.007
    const speed = state.boostActive ? baseSpeed * BOOST_MULTIPLIER : baseSpeed
    state.roadOffset += state.boostActive ? 9 : 6
    if (state.roadOffset > 50) state.roadOffset = 0

    player.x = laneWidth * player.lane + (laneWidth - player.width) / 2

    if (Math.random() < 0.016) createObstacle()

    for (let i = state.obstacles.length - 1; i >= 0; i--) {
      state.obstacles[i].y += speed
      if (state.obstacles[i].y > canvas.height) {
        state.obstacles.splice(i, 1)
        scoreRef.current += 10
        setScore(scoreRef.current)
        if (scoreRef.current > bestScoreRef.current) {
          bestScoreRef.current = scoreRef.current
          localStorage.setItem('bikeGameBest', String(scoreRef.current))
          setBestScore(scoreRef.current)
        }
      }
    }

    for (const obs of state.obstacles) {
      const overlapX =
        Math.min(player.x + player.width - OVERLAP_MARGIN, obs.x + obs.width - OVERLAP_MARGIN) -
        Math.max(player.x + OVERLAP_MARGIN, obs.x + OVERLAP_MARGIN)
      const overlapY =
        Math.min(player.y + player.height - OVERLAP_MARGIN, obs.y + obs.height - OVERLAP_MARGIN) -
        Math.max(player.y + OVERLAP_MARGIN, obs.y + OVERLAP_MARGIN)
      if (overlapX > 0 && overlapY > 0) {
        state.crashFrame = 0
        setGameState('crashing')
        animRef.current = requestAnimationFrame(gameLoop)
        return
      }
    }

    drawRoad(ctx, state.roadOffset, canvas.width, canvas.height)
    drawBike(ctx, player.x, player.y, player.width, player.height, '#f97316', true)
    for (const o of state.obstacles) {
      drawBike(ctx, o.x, o.y, o.width, o.height, o.color, false)
    }

    animRef.current = requestAnimationFrame(gameLoop)
  }, [canvasRef, gameState, createObstacle])

  useEffect(() => {
    if (gameState === 'playing' || gameState === 'crashing') {
      gameLoop()
    }
    return () => cancelAnimationFrame(animRef.current)
  }, [gameState, gameLoop])

  const startGame = useCallback(() => {
    initGame()
  }, [initGame])

  const moveLeft = useCallback(() => {
    if (gameState !== 'playing') return
    const { player } = stateRef.current
    if (player.lane > 0) player.lane--
  }, [gameState])

  const moveRight = useCallback(() => {
    if (gameState !== 'playing') return
    const { player } = stateRef.current
    if (player.lane < LANES - 1) player.lane++
  }, [gameState])

  const activateBoost = useCallback(() => {
    if (gameState !== 'playing') return
    const now = Date.now()
    if (now - stateRef.current.lastTouchTime < 120) return
    stateRef.current.lastTouchTime = now
    stateRef.current.boostActive = true
    stateRef.current.boostEndTime = now + BOOST_DURATION
    if (!boostActiveRef.current) {
      boostActiveRef.current = true
      setBoostActive(true)
    }
  }, [gameState])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (gameState !== 'playing') return
      e.preventDefault()
      const t = e.touches[0]
      stateRef.current.touchStartX = t.clientX
      stateRef.current.touchStartY = t.clientY
      stateRef.current.touchStartTime = Date.now()
      stateRef.current.swipeHandled = false
    },
    [gameState]
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (gameState !== 'playing') return
      e.preventDefault()
      const t = e.changedTouches[0]
      if (!t || stateRef.current.swipeHandled) return
      const dx = t.clientX - stateRef.current.touchStartX
      const dy = t.clientY - stateRef.current.touchStartY
      const dt = Date.now() - stateRef.current.touchStartTime
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      if (
        Math.abs(dx) > SWIPE_THRESHOLD &&
        Math.abs(dx) > Math.abs(dy) &&
        dt < SWIPE_MAX_TIME
      ) {
        stateRef.current.swipeHandled = true
        stateRef.current.lastClickWasTouch = true
        dx > 0 ? moveRight() : moveLeft()
      } else if (
        t.clientX >= rect.left &&
        t.clientX <= rect.right &&
        t.clientY >= rect.top &&
        t.clientY <= rect.bottom
      ) {
        stateRef.current.swipeHandled = true
        stateRef.current.lastClickWasTouch = true
        ;(t.clientX - rect.left) / rect.width < 0.5 ? moveLeft() : moveRight()
      }
    },
    [gameState, moveLeft, moveRight, canvasRef]
  )

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (gameState !== 'playing') return
      if (stateRef.current.lastClickWasTouch) {
        stateRef.current.lastClickWasTouch = false
        return
      }
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = (e.clientX - rect.left) / rect.width
      ;(x < 0.5 ? moveLeft : moveRight)()
    },
    [gameState, moveLeft, moveRight, canvasRef]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (gameState !== 'playing') return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        moveLeft()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        moveRight()
      } else if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault()
        activateBoost()
      }
    },
    [gameState, moveLeft, moveRight, activateBoost]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return {
    score,
    bestScore,
    gameState,
    boostActive,
    startGame,
    moveLeft,
    moveRight,
    activateBoost,
    handleTouchStart,
    handleTouchEnd,
    handleClick,
  }
}
