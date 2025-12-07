const drawPixelWithStroke = (x, y, color, strokeWidth, gridWidth, gridHeight, newPixels) => {
  if (strokeWidth === 1) {
    if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
      const index = y * gridWidth + x
      if (index >= 0 && index < newPixels.length) {
        newPixels[index] = color
      }
    }
    return
  }
  
  const radius = Math.floor(strokeWidth / 2)
  for (let row = y - radius; row <= y + radius; row++) {
    for (let col = x - radius; col <= x + radius; col++) {
      const distance = Math.sqrt((row - y) ** 2 + (col - x) ** 2)
      if (distance <= radius && row >= 0 && row < gridHeight && col >= 0 && col < gridWidth) {
        const index = row * gridWidth + col
        if (index >= 0 && index < newPixels.length) {
          newPixels[index] = color
        }
      }
    }
  }
}

export const drawRectangle = (startIndex, endIndex, color, strokeWidth, gridWidth, gridHeight, setPixels, originalPixels, filled = false) => {
  if (startIndex === null || endIndex === null) return

  const startRow = Math.floor(startIndex / gridWidth)
  const startCol = startIndex % gridWidth
  const endRow = Math.floor(endIndex / gridWidth)
  const endCol = endIndex % gridWidth

  const newPixels = [...originalPixels]

  const minRow = Math.min(startRow, endRow)
  const maxRow = Math.max(startRow, endRow)
  const minCol = Math.min(startCol, endCol)
  const maxCol = Math.max(startCol, endCol)

  if (filled) {
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        if (row >= 0 && row < gridHeight && col >= 0 && col < gridWidth) {
          const index = row * gridWidth + col
          if (index >= 0 && index < newPixels.length) {
            newPixels[index] = color
          }
        }
      }
    }
  } else {
    for (let col = minCol; col <= maxCol; col++) {
      drawPixelWithStroke(col, minRow, color, strokeWidth, gridWidth, gridHeight, newPixels)
      drawPixelWithStroke(col, maxRow, color, strokeWidth, gridWidth, gridHeight, newPixels)
    }
    for (let row = minRow; row <= maxRow; row++) {
      drawPixelWithStroke(minCol, row, color, strokeWidth, gridWidth, gridHeight, newPixels)
      drawPixelWithStroke(maxCol, row, color, strokeWidth, gridWidth, gridHeight, newPixels)
    }
  }

  setPixels(newPixels)
}

export const handleRectangleDown = (index, color, gridWidth, gridHeight, setStartPoint) => {
  if (index !== null) {
    setStartPoint(index)
  }
}

export const handleRectangleMove = (index, startIndex, color, strokeWidth, gridWidth, gridHeight, setPixels, originalPixels, filled = false) => {
  if (startIndex !== null && index !== null) {
    drawRectangle(startIndex, index, color, strokeWidth, gridWidth, gridHeight, setPixels, originalPixels, filled)
  }
}

export const handleRectangleUp = (index, startIndex, color, strokeWidth, gridWidth, gridHeight, setPixels, originalPixels, setStartPoint, filled = false) => {
  if (startIndex !== null && index !== null) {
    drawRectangle(startIndex, index, color, strokeWidth, gridWidth, gridHeight, setPixels, originalPixels, filled)
  }
  setStartPoint(null)
}
