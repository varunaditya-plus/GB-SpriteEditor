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

export const drawLine = (startIndex, endIndex, color, strokeWidth, gridWidth, gridHeight, setPixels, originalPixels) => {
  if (startIndex === null || endIndex === null) return

  const startRow = Math.floor(startIndex / gridWidth)
  const startCol = startIndex % gridWidth
  const endRow = Math.floor(endIndex / gridWidth)
  const endCol = endIndex % gridWidth

  const newPixels = [...originalPixels]
  
  let x0 = startCol
  let y0 = startRow
  let x1 = endCol
  let y1 = endRow

  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy

  while (true) {
    drawPixelWithStroke(x0, y0, color, strokeWidth, gridWidth, gridHeight, newPixels)

    if (x0 === x1 && y0 === y1) break

    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x0 += sx
    }
    if (e2 < dx) {
      err += dx
      y0 += sy
    }
  }

  setPixels(newPixels)
}

export const handleLineDown = (index, color, gridWidth, gridHeight, setStartPoint) => {
  if (index !== null) {
    setStartPoint(index)
  }
}

export const handleLineMove = (index, startIndex, color, strokeWidth, gridWidth, gridHeight, setPixels, originalPixels) => {
  if (startIndex !== null && index !== null) {
    drawLine(startIndex, index, color, strokeWidth, gridWidth, gridHeight, setPixels, originalPixels)
  }
}

export const handleLineUp = (index, startIndex, color, strokeWidth, gridWidth, gridHeight, setPixels, originalPixels, setStartPoint) => {
  if (startIndex !== null && index !== null) {
    drawLine(startIndex, index, color, strokeWidth, gridWidth, gridHeight, setPixels, originalPixels)
  }
  setStartPoint(null)
}
