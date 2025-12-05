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

export const drawRectangle = (startIndex, endIndex, color, strokeWidth, gridSize, setPixels, originalPixels, filled = false) => {
  if (startIndex === null || endIndex === null) return

  const startRow = Math.floor(startIndex / gridSize)
  const startCol = startIndex % gridSize
  const endRow = Math.floor(endIndex / gridSize)
  const endCol = endIndex % gridSize

  const newPixels = [...originalPixels]

  const minRow = Math.min(startRow, endRow)
  const maxRow = Math.max(startRow, endRow)
  const minCol = Math.min(startCol, endCol)
  const maxCol = Math.max(startCol, endCol)

  if (filled) {
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const index = row * gridSize + col
        if (index >= 0 && index < newPixels.length) {
          newPixels[index] = color
        }
      }
    }
  } else {
    for (let col = minCol; col <= maxCol; col++) {
      drawPixelWithStroke(col, minRow, color, strokeWidth, gridSize, newPixels)
      drawPixelWithStroke(col, maxRow, color, strokeWidth, gridSize, newPixels)
    }
    for (let row = minRow; row <= maxRow; row++) {
      drawPixelWithStroke(minCol, row, color, strokeWidth, gridSize, newPixels)
      drawPixelWithStroke(maxCol, row, color, strokeWidth, gridSize, newPixels)
    }
  }

  setPixels(newPixels)
}

export const handleRectangleDown = (index, color, gridSize, setStartPoint) => {
  if (index !== null) {
    setStartPoint(index)
  }
}

export const handleRectangleMove = (index, startIndex, color, strokeWidth, gridSize, setPixels, originalPixels, filled = false) => {
  if (startIndex !== null && index !== null) {
    drawRectangle(startIndex, index, color, strokeWidth, gridSize, setPixels, originalPixels, filled)
  }
}

export const handleRectangleUp = (index, startIndex, color, strokeWidth, gridSize, setPixels, originalPixels, setStartPoint, filled = false) => {
  if (startIndex !== null && index !== null) {
    drawRectangle(startIndex, index, color, strokeWidth, gridSize, setPixels, originalPixels, filled)
  }
  setStartPoint(null)
}
