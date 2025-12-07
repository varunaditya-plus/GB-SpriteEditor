export const isInSelection = (index, selection) => {
  return selection.has(index)
}

export const moveSelection = (selection, startIndex, endIndex, pixels, gridWidth, gridHeight, setPixels, originalPixels) => {
  if (selection.size === 0 || startIndex === null || endIndex === null) return

  const startRow = Math.floor(startIndex / gridWidth)
  const startCol = startIndex % gridWidth
  const endRow = Math.floor(endIndex / gridWidth)
  const endCol = endIndex % gridWidth

  const deltaRow = endRow - startRow
  const deltaCol = endCol - startCol

  // Start with original pixels
  const newPixels = [...originalPixels]

  const selectedIndices = Array.from(selection).sort((a, b) => a - b)

  // First, clear the original positions
  for (const index of selectedIndices) {
    newPixels[index] = null
  }

  // Then, place pixels at new positions
  for (const index of selectedIndices) {
    const row = Math.floor(index / gridWidth)
    const col = index % gridWidth
    const newRow = row + deltaRow
    const newCol = col + deltaCol

    // Check bounds
    if (newRow >= 0 && newRow < gridHeight && newCol >= 0 && newCol < gridWidth) {
      const newIndex = newRow * gridWidth + newCol
      if (newIndex >= 0 && newIndex < newPixels.length) {
        newPixels[newIndex] = originalPixels[index]
      }
    }
  }

  setPixels(newPixels)
}

export const updateSelectionIndices = (selection, startIndex, endIndex, gridWidth, gridHeight) => {
  if (selection.size === 0 || startIndex === null || endIndex === null) return selection

  const startRow = Math.floor(startIndex / gridWidth)
  const startCol = startIndex % gridWidth
  const endRow = Math.floor(endIndex / gridWidth)
  const endCol = endIndex % gridWidth

  const deltaRow = endRow - startRow
  const deltaCol = endCol - startCol

  const newSelection = new Set()

  for (const index of selection) {
    const row = Math.floor(index / gridWidth)
    const col = index % gridWidth
    const newRow = row + deltaRow
    const newCol = col + deltaCol

    // Check bounds
    if (newRow >= 0 && newRow < gridHeight && newCol >= 0 && newCol < gridWidth) {
      const newIndex = newRow * gridWidth + newCol
      if (newIndex >= 0 && newIndex < gridWidth * gridHeight) {
        newSelection.add(newIndex)
      }
    }
  }

  return newSelection
}
