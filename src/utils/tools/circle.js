const drawPixelWithStroke = (x, y, color, strokeWidth, gridSize, newPixels) => {
  if (strokeWidth === 1) {
    const index = y * gridSize + x
    if (index >= 0 && index < newPixels.length && x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
      newPixels[index] = color
    }
    return
  }
  
  const radius = Math.floor(strokeWidth / 2)
  for (let row = y - radius; row <= y + radius; row++) {
    for (let col = x - radius; col <= x + radius; col++) {
      const distance = Math.sqrt((row - y) ** 2 + (col - x) ** 2)
      if (distance <= radius && row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
        const index = row * gridSize + col
        if (index >= 0 && index < newPixels.length) {
          newPixels[index] = color
        }
      }
    }
  }
}

export const drawCircle = (startIndex, endIndex, color, strokeWidth, gridSize, setPixels, originalPixels, filled = false) => {
  if (startIndex === null || endIndex === null) return

  const centerRow = Math.floor(startIndex / gridSize)
  const centerCol = startIndex % gridSize
  const edgeRow = Math.floor(endIndex / gridSize)
  const edgeCol = endIndex % gridSize

  const dx = edgeCol - centerCol
  const dy = edgeRow - centerRow
  const radius = Math.sqrt(dx * dx + dy * dy)

  const newPixels = [...originalPixels]

  if (filled) {
    // Draw filled circle using midpoint algorithm
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const dx = col - centerCol
        const dy = row - centerRow
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance <= radius) {
          const index = row * gridSize + col
          if (index >= 0 && index < newPixels.length) {
            newPixels[index] = color
          }
        }
      }
    }
  } else {
    // Draw circle outline using midpoint circle algorithm
    let x = 0
    let y = Math.round(radius)
    let d = 1 - Math.round(radius)

    const setCirclePixel = (cx, cy, x, y) => {
      const points = [
        [cx + x, cy + y],
        [cx - x, cy + y],
        [cx + x, cy - y],
        [cx - x, cy - y],
        [cx + y, cy + x],
        [cx - y, cy + x],
        [cx + y, cy - x],
        [cx - y, cy - x]
      ]

      for (const [px, py] of points) {
        drawPixelWithStroke(px, py, color, strokeWidth, gridSize, newPixels)
      }
    }

    setCirclePixel(centerCol, centerRow, x, y)

    while (y > x) {
      if (d < 0) {
        d += 2 * x + 3
      } else {
        d += 2 * (x - y) + 5
        y--
      }
      x++
      setCirclePixel(centerCol, centerRow, x, y)
    }
  }

  setPixels(newPixels)
}

export const handleCircleDown = (index, color, gridSize, setStartPoint) => {
  if (index !== null) {
    setStartPoint(index)
  }
}

export const handleCircleMove = (index, startIndex, color, strokeWidth, gridSize, setPixels, originalPixels, filled = false) => {
  if (startIndex !== null && index !== null) {
    drawCircle(startIndex, index, color, strokeWidth, gridSize, setPixels, originalPixels, filled)
  }
}

export const handleCircleUp = (index, startIndex, color, strokeWidth, gridSize, setPixels, originalPixels, setStartPoint, filled = false) => {
  if (startIndex !== null && index !== null) {
    drawCircle(startIndex, index, color, strokeWidth, gridSize, setPixels, originalPixels, filled)
  }
  setStartPoint(null)
}
