export const floodFill = (startIndex, fillColor, pixels, gridWidth, gridHeight, setPixels) => {
  if (startIndex === null || startIndex < 0 || startIndex >= pixels.length) {
    return
  }

  const targetColor = pixels[startIndex]
  
  if (targetColor === fillColor) {
    return
  }

  const newPixels = [...pixels]
  const visited = new Set()
  const stack = [startIndex]

  const getNeighbors = (index) => {
    const row = Math.floor(index / gridWidth)
    const col = index % gridWidth
    const neighbors = []

    if (row > 0) neighbors.push(index - gridWidth)
    if (row < gridHeight - 1) neighbors.push(index + gridWidth)
    if (col > 0) neighbors.push(index - 1)
    if (col < gridWidth - 1) neighbors.push(index + 1)

    return neighbors
  }

  while (stack.length > 0) {
    const currentIndex = stack.pop()

    if (visited.has(currentIndex)) continue
    if (newPixels[currentIndex] !== targetColor) continue

    visited.add(currentIndex)
    newPixels[currentIndex] = fillColor

    const neighbors = getNeighbors(currentIndex)
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor) && newPixels[neighbor] === targetColor) {
        stack.push(neighbor)
      }
    }
  }

  setPixels(newPixels)
}

export const handleFillDown = (index, fillColor, pixels, gridWidth, gridHeight, setPixels) => {
  floodFill(index, fillColor, pixels, gridWidth, gridHeight, setPixels)
}
