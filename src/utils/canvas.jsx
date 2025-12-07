export const initializeCanvas = (canvas, canvasWidth, canvasHeight) => {
  if (!canvas) return

  const dpr = window.devicePixelRatio || 1
  canvas.width = canvasWidth * dpr
  canvas.height = canvasHeight * dpr
  canvas.style.width = `${canvasWidth}px`
  canvas.style.height = `${canvasHeight}px`
}

export const drawCanvas = (canvas, canvasWidth, canvasHeight, gridWidth, gridHeight, cellSizeX, cellSizeY, layers, selection) => {
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.scale(dpr, dpr)

  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  ctx.strokeStyle = '#404040'
  ctx.lineWidth = 1
  for (let i = 0; i <= gridWidth; i++) {
    const pos = i * cellSizeX + 0.5
    ctx.beginPath()
    ctx.moveTo(pos, 0)
    ctx.lineTo(pos, canvasHeight)
    ctx.stroke()
  }
  for (let i = 0; i <= gridHeight; i++) {
    const pos = i * cellSizeY + 0.5
    ctx.beginPath()
    ctx.moveTo(0, pos)
    ctx.lineTo(canvasWidth, pos)
    ctx.stroke()
  }

  const compositePixels = Array(gridWidth * gridHeight).fill(null)
  
  layers.forEach(layer => {
    if (layer.visible) {
      layer.pixels.forEach((color, index) => {
        if (color) {
          compositePixels[index] = color
        }
      })
    }
  })

  compositePixels.forEach((color, index) => {
    if (color) {
      const row = Math.floor(index / gridWidth)
      const col = index % gridWidth
      // Calculate pixel position accounting for grid line offset (0.5)
      // Ensure pixels don't overlap by using Math.floor and proper boundaries
      const x = Math.floor(col * cellSizeX) + 0.5
      const y = Math.floor(row * cellSizeY) + 0.5
      // Calculate cell dimensions that fit within boundaries
      // For the last column/row, use remaining space to avoid overflow
      const width = col === gridWidth - 1 
        ? Math.floor(canvasWidth - x) - 0.5
        : Math.floor((col + 1) * cellSizeX) - x - 0.5
      const height = row === gridHeight - 1
        ? Math.floor(canvasHeight - y) - 0.5
        : Math.floor((row + 1) * cellSizeY) - y - 0.5
      ctx.fillStyle = color
      ctx.fillRect(x, y, width, height)
    }
  })

  if (selection.size > 0) {
    ctx.fillStyle = 'rgba(59, 130, 246, 0.4)'
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)'
    ctx.lineWidth = 1

    selection.forEach((index) => {
      const row = Math.floor(index / gridWidth)
      const col = index % gridWidth
      // Calculate selection position accounting for grid line offset (0.5)
      const x = Math.floor(col * cellSizeX) + 0.5
      const y = Math.floor(row * cellSizeY) + 0.5
      // Calculate cell dimensions that fit within boundaries
      const width = col === gridWidth - 1 
        ? Math.floor(canvasWidth - x) - 0.5
        : Math.floor((col + 1) * cellSizeX) - x - 0.5
      const height = row === gridHeight - 1
        ? Math.floor(canvasHeight - y) - 0.5
        : Math.floor((row + 1) * cellSizeY) - y - 0.5

      ctx.fillRect(x, y, width, height)
      ctx.strokeRect(x, y, width, height)
    })
  }
}

export const getPixelIndex = (canvas, x, y, gridWidth, gridHeight, cellSizeX, cellSizeY) => {
  if (!canvas) return null
  
  const rect = canvas.getBoundingClientRect()
  const canvasX = x - rect.left
  const canvasY = y - rect.top
  
  const cellX = Math.floor(canvasX / cellSizeX)
  const cellY = Math.floor(canvasY / cellSizeY)
  
  if (cellX < 0 || cellX >= gridWidth || cellY < 0 || cellY >= gridHeight) {
    return null
  }
  
  return cellY * gridWidth + cellX
}

