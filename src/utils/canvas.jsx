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
      const x = col * cellSizeX
      const y = row * cellSizeY
      ctx.fillStyle = color
      ctx.fillRect(x, y, cellSizeX, cellSizeY)
    }
  })

  if (selection.size > 0) {
    ctx.fillStyle = 'rgba(59, 130, 246, 0.4)'
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)'
    ctx.lineWidth = 1

    selection.forEach((index) => {
      const row = Math.floor(index / gridWidth)
      const col = index % gridWidth
      const x = col * cellSizeX
      const y = row * cellSizeY

      ctx.fillRect(x, y, cellSizeX, cellSizeY)
      ctx.strokeRect(x + 0.5, y + 0.5, cellSizeX - 1, cellSizeY - 1)
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

