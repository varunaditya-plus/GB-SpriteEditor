// Helper function to normalize pixel array to correct size
const normalizePixelArray = (pixels, gridWidth, gridHeight) => {
  const targetSize = gridWidth * gridHeight
  if (!pixels || pixels.length !== targetSize) {
    const normalized = Array(targetSize).fill(null)
    if (pixels) {
      const copyLength = Math.min(pixels.length, targetSize)
      for (let i = 0; i < copyLength; i++) {
        normalized[i] = pixels[i] || null
      }
    }
    return normalized
  }
  return [...pixels]
}

export const createSelectionContextMenuHandlers = ({ selection, framesEnabled, activeFrameIndex, activeLayerIndex, frames, nextLayerId, nextFrameId, gridWidth, gridHeight, setFrames, setNextLayerId, setNextFrameId, setActiveLayerIndex, setActiveFrameIndex, setSelection, handleSaveToHistory }) => {
  const handleDeleteSelection = () => {
    if (selection.size === 0) return
    
    const frameIndex = framesEnabled ? activeFrameIndex : 0
    if (frameIndex < 0 || frameIndex >= frames.length) return
    
    setFrames(prev => {
      const newFrames = [...prev]
      const frame = newFrames[frameIndex]
      if (!frame || !frame.layers || activeLayerIndex < 0 || activeLayerIndex >= frame.layers.length) return newFrames
      
      const newLayers = [...frame.layers]
      const currentLayer = newLayers[activeLayerIndex]
      if (!currentLayer) return newFrames
      
      // Normalize pixel array to ensure correct size
      const newPixels = normalizePixelArray(currentLayer.pixels, gridWidth, gridHeight)
      
      selection.forEach(index => {
        if (index >= 0 && index < newPixels.length) {
          newPixels[index] = null
        }
      })
      
      newLayers[activeLayerIndex] = {
        ...currentLayer,
        pixels: newPixels
      }
      newFrames[frameIndex] = {
        ...frame,
        layers: newLayers
      }
      return newFrames
    })
    
    setSelection(new Set())
    handleSaveToHistory()
  }

  const handleSplitToLayer = () => {
    if (selection.size === 0) return
    
    const frameIndex = framesEnabled ? activeFrameIndex : 0
    if (frameIndex < 0 || frameIndex >= frames.length) return
    const currentFrame = frames[frameIndex]
    if (!currentFrame || !currentFrame.layers || activeLayerIndex < 0 || activeLayerIndex >= currentFrame.layers.length) return
    
    const currentLayer = currentFrame.layers[activeLayerIndex]
    if (!currentLayer) return
    
    // Normalize pixel array to ensure correct size
    const currentPixels = normalizePixelArray(currentLayer.pixels, gridWidth, gridHeight)
    
    const newLayerPixels = Array(gridWidth * gridHeight).fill(null)
    selection.forEach(index => {
      if (index >= 0 && index < currentPixels.length && index < newLayerPixels.length) {
        newLayerPixels[index] = currentPixels[index]
      }
    })
    
    const updatedCurrentPixels = [...currentPixels]
    selection.forEach(index => {
      if (index >= 0 && index < updatedCurrentPixels.length) {
        updatedCurrentPixels[index] = null
      }
    })
    
    // Get the next layer ID and increment it
    let newLayerId = nextLayerId
    setNextLayerId(prev => {
      newLayerId = prev
      return prev + 1
    })
    
    setFrames(prev => {
      const newFrames = [...prev]
      const frame = newFrames[frameIndex]
      if (!frame || !frame.layers) return newFrames
      
      const newLayers = [...frame.layers]
      // Update current layer
      newLayers[activeLayerIndex] = {
        ...currentLayer,
        pixels: normalizePixelArray(updatedCurrentPixels, gridWidth, gridHeight)
      }
      
      // Add new layer
      newLayers.push({
        id: newLayerId,
        name: `Layer ${newLayers.length + 1}`,
        visible: true,
        pixels: normalizePixelArray(newLayerPixels, gridWidth, gridHeight)
      })
      newFrames[frameIndex] = {
        ...frame,
        layers: newLayers
      }
      return newFrames
    })
    
    setActiveLayerIndex(currentFrame.layers.length)
    setSelection(new Set())
    handleSaveToHistory()
  }

  const handleCopyToLayer = () => {
    if (selection.size === 0) return
    
    const frameIndex = framesEnabled ? activeFrameIndex : 0
    if (frameIndex < 0 || frameIndex >= frames.length) return
    const currentFrame = frames[frameIndex]
    if (!currentFrame || !currentFrame.layers || activeLayerIndex < 0 || activeLayerIndex >= currentFrame.layers.length) return
    
    const currentLayer = currentFrame.layers[activeLayerIndex]
    if (!currentLayer) return
    
    // Normalize pixel array to ensure correct size
    const currentPixels = normalizePixelArray(currentLayer.pixels, gridWidth, gridHeight)
    
    const newLayerPixels = Array(gridWidth * gridHeight).fill(null)
    selection.forEach(index => {
      if (index >= 0 && index < currentPixels.length && index < newLayerPixels.length) {
        newLayerPixels[index] = currentPixels[index]
      }
    })
    
    // Get the next layer ID and increment it
    let newLayerId = nextLayerId
    setNextLayerId(prev => {
      newLayerId = prev
      return prev + 1
    })
    
    setFrames(prev => {
      const newFrames = [...prev]
      const frame = newFrames[frameIndex]
      if (!frame || !frame.layers) return newFrames
      
      const newLayers = [...frame.layers]
      
      // Add new layer
      newLayers.push({
        id: newLayerId,
        name: `Layer ${newLayers.length + 1}`,
        visible: true,
        pixels: normalizePixelArray(newLayerPixels, gridWidth, gridHeight)
      })
      newFrames[frameIndex] = {
        ...frame,
        layers: newLayers
      }
      return newFrames
    })
    
    setActiveLayerIndex(currentFrame.layers.length)
    handleSaveToHistory()
  }

  const handleSplitToFrame = () => {
    if (selection.size === 0) return
    
    const frameIndex = framesEnabled ? activeFrameIndex : 0
    if (frameIndex < 0 || frameIndex >= frames.length) return
    const currentFrame = frames[frameIndex]
    if (!currentFrame || !currentFrame.layers || activeLayerIndex < 0 || activeLayerIndex >= currentFrame.layers.length) return
    
    const currentLayer = currentFrame.layers[activeLayerIndex]
    if (!currentLayer) return
    
    // Normalize pixel array to ensure correct size
    const currentPixels = normalizePixelArray(currentLayer.pixels, gridWidth, gridHeight)
    
    const newFramePixels = Array(gridWidth * gridHeight).fill(null)
    selection.forEach(index => {
      if (index >= 0 && index < currentPixels.length && index < newFramePixels.length) {
        newFramePixels[index] = currentPixels[index]
      }
    })
    
    const updatedCurrentPixels = [...currentPixels]
    selection.forEach(index => {
      if (index >= 0 && index < updatedCurrentPixels.length) {
        updatedCurrentPixels[index] = null
      }
    })
    
    // Create new frame with only ONE layer containing the selected pixels
    let newFrameId = nextFrameId
    setNextFrameId(prev => {
      newFrameId = prev
      return prev + 1
    })
    
    setFrames(prev => {
      const newFrame = {
        id: newFrameId,
        name: `Frame ${prev.length + 1}`,
        layers: [{
          id: 0,
          name: 'Layer 1',
          visible: true,
          pixels: normalizePixelArray(newFramePixels, gridWidth, gridHeight)
        }],
        visible: true
      }
      
      const newFrames = [...prev]
      const frame = newFrames[frameIndex]
      if (!frame || !frame.layers) return newFrames
      
      const newLayers = [...frame.layers]
      // Update current layer
      newLayers[activeLayerIndex] = {
        ...currentLayer,
        pixels: normalizePixelArray(updatedCurrentPixels, gridWidth, gridHeight)
      }
      newFrames[frameIndex] = {
        ...frame,
        layers: newLayers
      }
      newFrames.splice(frameIndex + 1, 0, newFrame)
      return newFrames
    })
    
    setActiveFrameIndex(frameIndex + 1)
    setActiveLayerIndex(0) // Reset to first layer in new frame
    setSelection(new Set())
    handleSaveToHistory()
  }

  const handleCopyToFrame = () => {
    if (selection.size === 0) return
    
    const frameIndex = framesEnabled ? activeFrameIndex : 0
    if (frameIndex < 0 || frameIndex >= frames.length) return
    const currentFrame = frames[frameIndex]
    if (!currentFrame || !currentFrame.layers || activeLayerIndex < 0 || activeLayerIndex >= currentFrame.layers.length) return
    
    const currentLayer = currentFrame.layers[activeLayerIndex]
    if (!currentLayer) return
    
    // Normalize pixel array to ensure correct size
    const currentPixels = normalizePixelArray(currentLayer.pixels, gridWidth, gridHeight)
    
    const newFramePixels = Array(gridWidth * gridHeight).fill(null)
    selection.forEach(index => {
      if (index >= 0 && index < currentPixels.length && index < newFramePixels.length) {
        newFramePixels[index] = currentPixels[index]
      }
    })
    
    // Create new frame with only ONE layer containing the selected pixels
    let newFrameId = nextFrameId
    setNextFrameId(prev => {
      newFrameId = prev
      return prev + 1
    })
    
    setFrames(prev => {
      const newFrame = {
        id: newFrameId,
        name: `Frame ${prev.length + 1}`,
        layers: [{
          id: 0,
          name: 'Layer 1',
          visible: true,
          pixels: normalizePixelArray(newFramePixels, gridWidth, gridHeight)
        }],
        visible: true
      }
      const newFrames = [...prev]
      newFrames.splice(frameIndex + 1, 0, newFrame)
      return newFrames
    })
    
    setActiveFrameIndex(frameIndex + 1)
    setActiveLayerIndex(0) // Reset to first layer in new frame
    handleSaveToHistory()
  }

  return { handleDeleteSelection, handleSplitToLayer, handleCopyToLayer, handleSplitToFrame, handleCopyToFrame }
}
