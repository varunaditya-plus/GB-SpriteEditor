const eraseWithOpacity = (existingColor, opacity) => {
  if (!existingColor) return null
  if (opacity === 10) return null
  
  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }
  
  const rgbToHex = (r, g, b) => {
    return `#${[r, g, b].map(x => {
      const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('').toUpperCase()}`
  }
  
  const existing = hexToRgb(existingColor)
  const alpha = opacity / 10
  const r = existing.r * (1 - alpha) + 255 * alpha
  const g = existing.g * (1 - alpha) + 255 * alpha
  const b = existing.b * (1 - alpha) + 255 * alpha
  
  return rgbToHex(r, g, b)
}

const getBrushPixels = (centerIndex, brushThickness, gridSize) => {
  if (brushThickness === 1) {
    return [centerIndex]
  }
  
  const centerRow = Math.floor(centerIndex / gridSize)
  const centerCol = centerIndex % gridSize
  const radius = Math.floor(brushThickness / 2)
  const pixels = []
  
  for (let row = centerRow - radius; row <= centerRow + radius; row++) {
    for (let col = centerCol - radius; col <= centerCol + radius; col++) {
      const distance = Math.sqrt((row - centerRow) ** 2 + (col - centerCol) ** 2)
      if (distance <= radius && row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
        const index = row * gridSize + col
        if (index >= 0 && index < gridSize * gridSize) {
          pixels.push(index)
        }
      }
    }
  }
  
  return pixels
}

export const handleEraserDown = (index, brushThickness, brushOpacity, gridSize, pixels, setPixel) => {
  if (index !== null && index >= 0) {
    const brushPixels = getBrushPixels(index, brushThickness, gridSize)
    brushPixels.forEach(pixelIndex => {
      if (brushOpacity === 10) {
        setPixel(pixelIndex, null)
      } else {
        const existingColor = pixels[pixelIndex]
        const erasedColor = eraseWithOpacity(existingColor, brushOpacity)
        setPixel(pixelIndex, erasedColor)
      }
    })
  }
}

export const handleEraserMove = (index, brushThickness, brushOpacity, gridSize, pixels, setPixel) => {
  if (index !== null && index >= 0) {
    const brushPixels = getBrushPixels(index, brushThickness, gridSize)
    brushPixels.forEach(pixelIndex => {
      if (brushOpacity === 10) {
        setPixel(pixelIndex, null)
      } else {
        const existingColor = pixels[pixelIndex]
        const erasedColor = eraseWithOpacity(existingColor, brushOpacity)
        setPixel(pixelIndex, erasedColor)
      }
    })
  }
}
