# Bike Rush — Motorcycle Racing Game

A fast-paced bike racing game built with **Vite + React + TypeScript**. Avoid oncoming bikes, find the clear lane, and beat your high score.

## Tech Stack

- **Vite** — Fast build tool and dev server
- **React 18** — UI framework
- **TypeScript** — Type safety
- **Canvas API** — Game rendering

## How to Play

- **Avoid** the oncoming bikes
- **Steer** left or right to stay in a lane
- **Boost** by tapping anywhere or pressing Space/Up
- **Score** points for each bike you pass
- One lane is always clear — find it!

## Controls

| Device | Steer | Boost |
|--------|-------|-------|
| **Desktop** | ← → arrow keys | Space or Up arrow |
| **Mobile** | Swipe or tap left/right | Tap anywhere |

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Build

```bash
npm run build
npm run preview
```

The built files are in `dist/` — deploy to any static host (Vercel, Netlify, GitHub Pages).

## Features

- Responsive — works on mobile and desktop
- Touch controls — swipe to steer
- Speed boost — tap anywhere
- Fair spawn logic — always one lane free
- Crash animation
- Best score saved in browser
