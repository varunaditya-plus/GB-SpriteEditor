export const initializeCanvas = (canvas, canvasSize) => {
  if (!canvas) return

  const dpr = window.devicePixelRatio || 1
  canvas.width = canvasSize * dpr
  canvas.height = canvasSize * dpr
  canvas.style.width = `${canvasSize}px`
  canvas.style.height = `${canvasSize}px`
}

export const drawCanvas = (canvas, canvasSize, gridSize, cellSize, pixels, selection) => {
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.scale(dpr, dpr)

  ctx.clearRect(0, 0, canvasSize, canvasSize)
  ctx.fillStyle = 'transparent'
  ctx.fillRect(0, 0, canvasSize, canvasSize)

  ctx.strokeStyle = '#404040'
  ctx.lineWidth = 1
  for (let i = 0; i <= gridSize; i++) {
    const pos = i * cellSize + 0.5
    ctx.beginPath()
    ctx.moveTo(pos, 0)
    ctx.lineTo(pos, canvasSize)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, pos)
    ctx.lineTo(canvasSize, pos)
    ctx.stroke()
  }

  pixels.forEach((color, index) => {
    if (color) {
      const row = Math.floor(index / gridSize)
      const col = index % gridSize
      const x = col * cellSize
      const y = row * cellSize
      ctx.fillStyle = color
      ctx.fillRect(x, y, cellSize, cellSize)
    }
  })

  if (selection.size > 0) {
    ctx.fillStyle = 'rgba(59, 130, 246, 0.4)'
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)'
    ctx.lineWidth = 1

    selection.forEach((index) => {
      const row = Math.floor(index / gridSize)
      const col = index % gridSize
      const x = col * cellSize
      const y = row * cellSize

      ctx.fillRect(x, y, cellSize, cellSize)
      ctx.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1)
    })
  }
}

export const getPixelIndex = (canvas, x, y, gridSize, cellSize) => {
  if (!canvas) return null
  
  const rect = canvas.getBoundingClientRect()
  const canvasX = x - rect.left
  const canvasY = y - rect.top
  
  const cellX = Math.floor(canvasX / cellSize)
  const cellY = Math.floor(canvasY / cellSize)
  
  if (cellX < 0 || cellX >= gridSize || cellY < 0 || cellY >= gridSize) {
    return null
  }
  
  return cellY * gridSize + cellX
}

