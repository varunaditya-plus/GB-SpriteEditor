// Uses a simple point-in-polygon algorithm for the selection area

// Check if a point is inside a polygon using ray casting algorithm
const pointInPolygon = (x, y, polygon) => {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0]
    const yi = polygon[i][1]
    const xj = polygon[j][0]
    const yj = polygon[j][1]

    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

export const getLassoSelection = (path, gridWidth, gridHeight) => {
  if (path.length < 3) {
    // Need at least 3 points for a polygon
    return new Set(path)
  }

  const polygon = path.map(index => {
    const row = Math.floor(index / gridWidth)
    const col = index % gridWidth
    return [col, row]
  })

  // Also include all points on the path itself
  const selection = new Set(path)

  const cols = polygon.map(p => p[0])
  const rows = polygon.map(p => p[1])
  const minCol = Math.min(...cols)
  const maxCol = Math.max(...cols)
  const minRow = Math.min(...rows)
  const maxRow = Math.max(...rows)

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (row >= 0 && row < gridHeight && col >= 0 && col < gridWidth) {
        const index = row * gridWidth + col
        if (index >= 0 && index < gridWidth * gridHeight) {
          if (pointInPolygon(col, row, polygon)) {
            selection.add(index)
          }
        }
      }
    }
  }

  return selection
}

export const handleLassoSelectionDown = (index, gridWidth, gridHeight, setLassoPath) => {
  if (index !== null) {
    setLassoPath([index])
  }
}

export const handleLassoSelectionMove = (index, lassoPath, gridWidth, gridHeight, setLassoPath, setSelection) => {
  if (index === null) return
  
  if (lassoPath.length === 0) {
    setLassoPath([index])
    setSelection(new Set([index]))
    return
  }
  
  if (lassoPath[lassoPath.length - 1] !== index) {
    const newPath = [...lassoPath, index]
    setLassoPath(newPath)
    const selection = getLassoSelection(newPath, gridWidth, gridHeight)
    setSelection(selection)
  }
}

export const handleLassoSelectionUp = (index, lassoPath, gridWidth, gridHeight, setLassoPath, setSelection) => {
  if (lassoPath.length > 0) {
    const selection = getLassoSelection(lassoPath, gridWidth, gridHeight)
    setSelection(selection)
    setLassoPath([])
  }
}
