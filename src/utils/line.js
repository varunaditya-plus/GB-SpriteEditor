export const drawLine = (startIndex, endIndex, color, gridSize, setPixels, originalPixels) => {
  if (startIndex === null || endIndex === null) return

  const startRow = Math.floor(startIndex / gridSize)
  const startCol = startIndex % gridSize
  const endRow = Math.floor(endIndex / gridSize)
  const endCol = endIndex % gridSize

  const newPixels = [...originalPixels]
  
  // Bresenham's line algorithm
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
    const index = y0 * gridSize + x0
    if (index >= 0 && index < newPixels.length) {
      newPixels[index] = color
    }

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

export const handleLineDown = (index, color, gridSize, setStartPoint) => {
  if (index !== null) {
    setStartPoint(index)
  }
}

export const handleLineMove = (index, startIndex, color, gridSize, setPixels, originalPixels) => {
  if (startIndex !== null && index !== null) {
    drawLine(startIndex, index, color, gridSize, setPixels, originalPixels)
  }
}

export const handleLineUp = (index, startIndex, color, gridSize, setPixels, originalPixels, setStartPoint) => {
  if (startIndex !== null && index !== null) {
    drawLine(startIndex, index, color, gridSize, setPixels, originalPixels)
  }
  setStartPoint(null)
}
