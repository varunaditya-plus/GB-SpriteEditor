export const floodFill = (startIndex, fillColor, pixels, gridSize, setPixels) => {
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
    const row = Math.floor(index / gridSize)
    const col = index % gridSize
    const neighbors = []

    if (row > 0) neighbors.push(index - gridSize)
    if (row < gridSize - 1) neighbors.push(index + gridSize)
    if (col > 0) neighbors.push(index - 1)
    if (col < gridSize - 1) neighbors.push(index + 1)

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

export const handleFillDown = (index, fillColor, pixels, gridSize, setPixels) => {
  floodFill(index, fillColor, pixels, gridSize, setPixels)
}
