export const getRectangleSelection = (startIndex, endIndex, gridSize) => {
  if (startIndex === null || endIndex === null) return new Set()

  const startRow = Math.floor(startIndex / gridSize)
  const startCol = startIndex % gridSize
  const endRow = Math.floor(endIndex / gridSize)
  const endCol = endIndex % gridSize

  const selection = new Set()
  const minRow = Math.min(startRow, endRow)
  const maxRow = Math.max(startRow, endRow)
  const minCol = Math.min(startCol, endCol)
  const maxCol = Math.max(startCol, endCol)

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const index = row * gridSize + col
      if (index >= 0 && index < gridSize * gridSize) {
        selection.add(index)
      }
    }
  }

  return selection
}

export const handleRectangleSelectionDown = (index, gridSize, setStartPoint) => {
  if (index !== null) {
    setStartPoint(index)
  }
}

export const handleRectangleSelectionMove = (index, startIndex, gridSize, setSelection) => {
  if (startIndex !== null && index !== null) {
    const selection = getRectangleSelection(startIndex, index, gridSize)
    setSelection(selection)
  }
}

export const handleRectangleSelectionUp = (index, startIndex, gridSize, setSelection, setStartPoint) => {
  if (startIndex !== null && index !== null) {
    const selection = getRectangleSelection(startIndex, index, gridSize)
    setSelection(selection)
  }
  setStartPoint(null)
}
