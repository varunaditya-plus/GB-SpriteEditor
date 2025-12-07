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

export const createSelectionContextMenuHandlers = ({ selection, framesEnabled, activeFrameIndex, activeLayerIndex, frames, layers, nextLayerId, nextFrameId, gridWidth, gridHeight, setFrames, setLayers, setNextLayerId, setNextFrameId, setActiveLayerIndex, setActiveFrameIndex, setSelection, handleSaveToHistory }) => {
  const handleDeleteSelection = () => {
    if (selection.size === 0) return
    
    const frameIndex = framesEnabled ? activeFrameIndex : 0
    setFrames(prev => {
      const newFrames = [...prev]
      const frame = newFrames[frameIndex]
      const newLayerPixels = [...frame.layerPixels]
      if (!newLayerPixels[activeLayerIndex]) {
        newLayerPixels[activeLayerIndex] = Array(gridWidth * gridHeight).fill(null)
      }
      // Normalize pixel array to ensure correct size
      const newPixels = normalizePixelArray(newLayerPixels[activeLayerIndex], gridWidth, gridHeight)
      
      selection.forEach(index => {
        if (index >= 0 && index < newPixels.length) {
          newPixels[index] = null
        }
      })
      
      newLayerPixels[activeLayerIndex] = newPixels
      newFrames[frameIndex] = {
        ...frame,
        layerPixels: newLayerPixels
      }
      return newFrames
    })
    
    setSelection(new Set())
    handleSaveToHistory()
  }

  const handleSplitToLayer = () => {
    if (selection.size === 0) return
    
    const frameIndex = framesEnabled ? activeFrameIndex : 0
    const currentFrame = frames[frameIndex]
    // Normalize pixel array to ensure correct size
    const currentPixels = normalizePixelArray(currentFrame.layerPixels[activeLayerIndex], gridWidth, gridHeight)
    
    const newLayer = {
      id: nextLayerId,
      name: `Layer ${layers.length + 1}`,
      visible: true
    }
    
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
    
    setLayers(prev => [...prev, newLayer])
    setNextLayerId(prev => prev + 1)
    
    setFrames(prev => prev.map((frame, idx) => {
      if (idx === frameIndex) {
        const newLayerPixelsArray = [...frame.layerPixels]
        // Normalize arrays before operations
        newLayerPixelsArray[activeLayerIndex] = normalizePixelArray(updatedCurrentPixels, gridWidth, gridHeight)
        newLayerPixelsArray.push(normalizePixelArray(newLayerPixels, gridWidth, gridHeight))
        return {
          ...frame,
          layerPixels: newLayerPixelsArray
        }
      }
      // Normalize existing arrays and add new normalized array
      const normalizedLayerPixels = frame.layerPixels.map(pixels => 
        normalizePixelArray(pixels, gridWidth, gridHeight)
      )
      normalizedLayerPixels.push(Array(gridWidth * gridHeight).fill(null))
      return {
        ...frame,
        layerPixels: normalizedLayerPixels
      }
    }))
    
    setActiveLayerIndex(layers.length)
    setSelection(new Set())
    handleSaveToHistory()
  }

  const handleCopyToLayer = () => {
    if (selection.size === 0) return
    
    const frameIndex = framesEnabled ? activeFrameIndex : 0
    const currentFrame = frames[frameIndex]
    // Normalize pixel array to ensure correct size
    const currentPixels = normalizePixelArray(currentFrame.layerPixels[activeLayerIndex], gridWidth, gridHeight)
    
    const newLayer = {
      id: nextLayerId,
      name: `Layer ${layers.length + 1}`,
      visible: true
    }
    
    const newLayerPixels = Array(gridWidth * gridHeight).fill(null)
    selection.forEach(index => {
      if (index >= 0 && index < currentPixels.length && index < newLayerPixels.length) {
        newLayerPixels[index] = currentPixels[index]
      }
    })
    
    setLayers(prev => [...prev, newLayer])
    setNextLayerId(prev => prev + 1)
    
    setFrames(prev => prev.map((frame, idx) => {
      if (idx === frameIndex) {
        const newLayerPixelsArray = [...frame.layerPixels]
        // Normalize arrays before operations
        newLayerPixelsArray.push(normalizePixelArray(newLayerPixels, gridWidth, gridHeight))
        return {
          ...frame,
          layerPixels: newLayerPixelsArray
        }
      }
      // Normalize existing arrays and add new normalized array
      const normalizedLayerPixels = frame.layerPixels.map(pixels => 
        normalizePixelArray(pixels, gridWidth, gridHeight)
      )
      normalizedLayerPixels.push(Array(gridWidth * gridHeight).fill(null))
      return {
        ...frame,
        layerPixels: normalizedLayerPixels
      }
    }))
    
    setActiveLayerIndex(layers.length)
    handleSaveToHistory()
  }

  const handleSplitToFrame = () => {
    if (selection.size === 0) return
    
    const frameIndex = framesEnabled ? activeFrameIndex : 0
    const currentFrame = frames[frameIndex]
    // Normalize pixel array to ensure correct size
    const currentPixels = normalizePixelArray(currentFrame.layerPixels[activeLayerIndex], gridWidth, gridHeight)
    
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
    
    const newFrame = {
      id: nextFrameId,
      name: `Frame ${frames.length + 1}`,
      layerPixels: frames[frameIndex].layerPixels.map((layerPixels, layerIdx) => {
        if (layerIdx === activeLayerIndex) {
          return newFramePixels
        }
        // Normalize existing layer pixels or create new array
        return normalizePixelArray(layerPixels, gridWidth, gridHeight)
      }),
      visible: true
    }
    
    setFrames(prev => {
      const newFrames = [...prev]
      const updatedLayerPixels = [...newFrames[frameIndex].layerPixels]
      // Ensure all layer pixel arrays are normalized
      updatedLayerPixels[activeLayerIndex] = normalizePixelArray(updatedCurrentPixels, gridWidth, gridHeight)
      // Normalize all other layer pixel arrays
      for (let i = 0; i < updatedLayerPixels.length; i++) {
        if (i !== activeLayerIndex) {
          updatedLayerPixels[i] = normalizePixelArray(updatedLayerPixels[i], gridWidth, gridHeight)
        }
      }
      newFrames[frameIndex] = {
        ...newFrames[frameIndex],
        layerPixels: updatedLayerPixels
      }
      newFrames.splice(frameIndex + 1, 0, newFrame)
      return newFrames
    })
    
    setNextFrameId(prev => prev + 1)
    setActiveFrameIndex(frameIndex + 1)
    setSelection(new Set())
    handleSaveToHistory()
  }

  const handleCopyToFrame = () => {
    if (selection.size === 0) return
    
    const frameIndex = framesEnabled ? activeFrameIndex : 0
    const currentFrame = frames[frameIndex]
    // Normalize pixel array to ensure correct size
    const currentPixels = normalizePixelArray(currentFrame.layerPixels[activeLayerIndex], gridWidth, gridHeight)
    
    const newFramePixels = Array(gridWidth * gridHeight).fill(null)
    selection.forEach(index => {
      if (index >= 0 && index < currentPixels.length && index < newFramePixels.length) {
        newFramePixels[index] = currentPixels[index]
      }
    })
    
    const newFrame = {
      id: nextFrameId,
      name: `Frame ${frames.length + 1}`,
      layerPixels: frames[frameIndex].layerPixels.map((layerPixels, layerIdx) => {
        if (layerIdx === activeLayerIndex) {
          return newFramePixels
        }
        // Normalize existing layer pixels or create new array
        return normalizePixelArray(layerPixels, gridWidth, gridHeight)
      }),
      visible: true
    }
    
    setFrames(prev => {
      const newFrames = [...prev]
      newFrames.splice(frameIndex + 1, 0, newFrame)
      return newFrames
    })
    
    setNextFrameId(prev => prev + 1)
    setActiveFrameIndex(frameIndex + 1)
    handleSaveToHistory()
  }

  return { handleDeleteSelection, handleSplitToLayer, handleCopyToLayer, handleSplitToFrame, handleCopyToFrame }
}
