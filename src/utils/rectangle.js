export const drawRectangle = (startIndex, endIndex, color, gridSize, setPixels, originalPixels, filled = false) => {
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
      const topIndex = minRow * gridSize + col
      const bottomIndex = maxRow * gridSize + col
      if (topIndex >= 0 && topIndex < newPixels.length) {
        newPixels[topIndex] = color
      }
      if (bottomIndex >= 0 && bottomIndex < newPixels.length) {
        newPixels[bottomIndex] = color
      }
    }
    for (let row = minRow; row <= maxRow; row++) {
      const leftIndex = row * gridSize + minCol
      const rightIndex = row * gridSize + maxCol
      if (leftIndex >= 0 && leftIndex < newPixels.length) {
        newPixels[leftIndex] = color
      }
      if (rightIndex >= 0 && rightIndex < newPixels.length) {
        newPixels[rightIndex] = color
      }
    }
  }

  setPixels(newPixels)
}

export const handleRectangleDown = (index, color, gridSize, setStartPoint) => {
  if (index !== null) {
    setStartPoint(index)
  }
}

export const handleRectangleMove = (index, startIndex, color, gridSize, setPixels, originalPixels, filled = false) => {
  if (startIndex !== null && index !== null) {
    drawRectangle(startIndex, index, color, gridSize, setPixels, originalPixels, filled)
  }
}

export const handleRectangleUp = (index, startIndex, color, gridSize, setPixels, originalPixels, setStartPoint, filled = false) => {
  if (startIndex !== null && index !== null) {
    drawRectangle(startIndex, index, color, gridSize, setPixels, originalPixels, filled)
  }
  setStartPoint(null)
}
