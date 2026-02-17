export interface Player {
  x: number
  y: number
  width: number
  height: number
  lane: number
}

export interface Obstacle {
  x: number
  y: number
  width: number
  height: number
  lane: number
  color: string
}

export type GameState = 'start' | 'playing' | 'crashing' | 'over'
