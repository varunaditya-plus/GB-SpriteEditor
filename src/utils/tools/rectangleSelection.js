export const getRectangleSelection = (startIndex, endIndex, gridWidth, gridHeight) => {
  if (startIndex === null || endIndex === null) return new Set()

  const startRow = Math.floor(startIndex / gridWidth)
  const startCol = startIndex % gridWidth
  const endRow = Math.floor(endIndex / gridWidth)
  const endCol = endIndex % gridWidth

  const selection = new Set()
  const minRow = Math.min(startRow, endRow)
  const maxRow = Math.max(startRow, endRow)
  const minCol = Math.min(startCol, endCol)
  const maxCol = Math.max(startCol, endCol)

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (row >= 0 && row < gridHeight && col >= 0 && col < gridWidth) {
        const index = row * gridWidth + col
        selection.add(index)
      }
    }
  }

  return selection
}

export const handleRectangleSelectionDown = (index, gridWidth, gridHeight, setStartPoint) => {
  if (index !== null) {
    setStartPoint(index)
  }
}

export const handleRectangleSelectionMove = (index, startIndex, gridWidth, gridHeight, setSelection) => {
  if (startIndex !== null && index !== null) {
    const selection = getRectangleSelection(startIndex, index, gridWidth, gridHeight)
    setSelection(selection)
  }
}

export const handleRectangleSelectionUp = (index, startIndex, gridWidth, gridHeight, setSelection, setStartPoint) => {
  if (startIndex !== null && index !== null) {
    const selection = getRectangleSelection(startIndex, index, gridWidth, gridHeight)
    setSelection(selection)
  }
  setStartPoint(null)
}
