const LANES = 3

function shadeColor(hex: string, percent: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const r = Math.min(255, Math.max(0, (n >> 16) + amt))
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amt))
  const b = Math.min(255, Math.max(0, (n & 0xff) + amt))
  return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)
}

export function drawRoad(ctx: CanvasRenderingContext2D, roadOffset: number, w: number, h: number) {
  const laneWidth = w / LANES

  ctx.fillStyle = '#0d1117'
  ctx.fillRect(0, 0, w, h)

  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, '#161b22')
  grad.addColorStop(0.3, '#21262d')
  grad.addColorStop(0.7, '#21262d')
  grad.addColorStop(1, '#161b22')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 2
  for (let i = 1; i < LANES; i++) {
    const x = i * laneWidth
    for (let y = (roadOffset % 56) - 56; y < h + 56; y += 56) {
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x, Math.min(y + 36, h))
      ctx.stroke()
    }
  }

  const curbWidth = 16
  const curbGrad = ctx.createLinearGradient(0, 0, 0, h)
  curbGrad.addColorStop(0, '#238636')
  curbGrad.addColorStop(0.5, '#2ea043')
  curbGrad.addColorStop(1, '#238636')
  ctx.fillStyle = curbGrad
  ctx.fillRect(0, 0, curbWidth, h)
  ctx.fillRect(w - curbWidth, 0, curbWidth, h)

  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(curbWidth, 0)
  ctx.lineTo(curbWidth, h)
  ctx.moveTo(w - curbWidth, 0)
  ctx.lineTo(w - curbWidth, h)
  ctx.stroke()
}

export function drawBike(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  facingUp: boolean,
  shakeX = 0,
  shakeY = 0
) {
  const d = facingUp ? 1 : -1
  const cx = x + w / 2 + shakeX
  const cy = y + h / 2 + shakeY

  ctx.save()

  const bodyGrad = ctx.createLinearGradient(x, y, x + w, y + h)
  bodyGrad.addColorStop(0, color)
  bodyGrad.addColorStop(0.5, color)
  bodyGrad.addColorStop(1, shadeColor(color, -25))
  ctx.fillStyle = bodyGrad
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 1.5

  const wheelR = Math.min(w, h) * 0.22
  const bodyLen = h * 0.5

  ctx.beginPath()
  ctx.ellipse(cx, cy - d * bodyLen * 0.35, wheelR, wheelR * 1.1, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.beginPath()
  ctx.ellipse(cx, cy + d * bodyLen * 0.35, wheelR, wheelR * 1.1, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = shadeColor(color, -15)
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.15, cy - d * bodyLen * 0.35)
  ctx.lineTo(cx - w * 0.15, cy + d * bodyLen * 0.35)
  ctx.lineTo(cx + w * 0.15, cy + d * bodyLen * 0.35)
  ctx.lineTo(cx + w * 0.15, cy - d * bodyLen * 0.35)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = 'rgba(20,22,28,0.95)'
  ctx.beginPath()
  ctx.ellipse(cx, cy - d * bodyLen * 0.1, w * 0.2, h * 0.15, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.fillStyle = '#fffef5'
  ctx.shadowColor = '#ffeb99'
  ctx.shadowBlur = 4
  ctx.beginPath()
  ctx.arc(cx - w * 0.12, cy - d * bodyLen * 0.45, w * 0.06, 0, Math.PI * 2)
  ctx.arc(cx + w * 0.12, cy - d * bodyLen * 0.45, w * 0.06, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.fillStyle = '#ff3333'
  ctx.beginPath()
  ctx.arc(cx - w * 0.12, cy + d * bodyLen * 0.45, w * 0.05, 0, Math.PI * 2)
  ctx.arc(cx + w * 0.12, cy + d * bodyLen * 0.45, w * 0.05, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

export function drawCrashOverlay(ctx: CanvasRenderingContext2D, progress: number, w: number, h: number) {
  ctx.fillStyle = `rgba(220, 38, 38, ${0.5 * (1 - progress)})`
  ctx.fillRect(0, 0, w, h)
}
