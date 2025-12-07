export const getCropSelection = (startIndex, endIndex, gridWidth, gridHeight) => {
  if (startIndex === null || endIndex === null) return null

  const startRow = Math.floor(startIndex / gridWidth)
  const startCol = startIndex % gridWidth
  const endRow = Math.floor(endIndex / gridWidth)
  const endCol = endIndex % gridWidth

  const minRow = Math.max(0, Math.min(startRow, endRow))
  const maxRow = Math.min(gridHeight - 1, Math.max(startRow, endRow))
  const minCol = Math.max(0, Math.min(startCol, endCol))
  const maxCol = Math.min(gridWidth - 1, Math.max(startCol, endCol))

  return {
    minRow,
    maxRow,
    minCol,
    maxCol,
    width: maxCol - minCol + 1,
    height: maxRow - minRow + 1
  }
}

export const handleCropDown = (index, gridWidth, gridHeight, setStartPoint) => {
  if (index !== null) {
    setStartPoint(index)
  }
}

export const handleCropMove = (index, startIndex, gridWidth, gridHeight, setCropSelection) => {
  if (startIndex !== null && index !== null) {
    const cropSelection = getCropSelection(startIndex, index, gridWidth, gridHeight)
    setCropSelection(cropSelection)
  }
}

export const handleCropUp = (index, startIndex, gridWidth, gridHeight, setCropSelection, setStartPoint) => {
  if (startIndex !== null && index !== null) {
    const cropSelection = getCropSelection(startIndex, index, gridWidth, gridHeight)
    setCropSelection(cropSelection)
  }
  setStartPoint(null)
}


