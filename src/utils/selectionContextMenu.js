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
      const newPixels = [...newLayerPixels[activeLayerIndex]]
      
      selection.forEach(index => {
        newPixels[index] = null
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
    const currentPixels = currentFrame.layerPixels[activeLayerIndex] || Array(gridWidth * gridHeight).fill(null)
    
    const newLayer = {
      id: nextLayerId,
      name: `Layer ${layers.length + 1}`,
      visible: true
    }
    
    const newLayerPixels = Array(gridWidth * gridHeight).fill(null)
    selection.forEach(index => {
      newLayerPixels[index] = currentPixels[index]
    })
    
    const updatedCurrentPixels = [...currentPixels]
    selection.forEach(index => {
      updatedCurrentPixels[index] = null
    })
    
    setLayers(prev => [...prev, newLayer])
    setNextLayerId(prev => prev + 1)
    
    setFrames(prev => prev.map((frame, idx) => {
      if (idx === frameIndex) {
        const newLayerPixelsArray = [...frame.layerPixels]
        newLayerPixelsArray[activeLayerIndex] = updatedCurrentPixels
        newLayerPixelsArray.push(newLayerPixels)
        return {
          ...frame,
          layerPixels: newLayerPixelsArray
        }
      }
      return {
        ...frame,
        layerPixels: [...frame.layerPixels, Array(gridWidth * gridHeight).fill(null)]
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
    const currentPixels = currentFrame.layerPixels[activeLayerIndex] || Array(gridWidth * gridHeight).fill(null)
    
    const newLayer = {
      id: nextLayerId,
      name: `Layer ${layers.length + 1}`,
      visible: true
    }
    
    const newLayerPixels = Array(gridWidth * gridHeight).fill(null)
    selection.forEach(index => {
      newLayerPixels[index] = currentPixels[index]
    })
    
    setLayers(prev => [...prev, newLayer])
    setNextLayerId(prev => prev + 1)
    
    setFrames(prev => prev.map((frame, idx) => {
      if (idx === frameIndex) {
        const newLayerPixelsArray = [...frame.layerPixels]
        newLayerPixelsArray.push(newLayerPixels)
        return {
          ...frame,
          layerPixels: newLayerPixelsArray
        }
      }
      return {
        ...frame,
        layerPixels: [...frame.layerPixels, Array(gridWidth * gridHeight).fill(null)]
      }
    }))
    
    setActiveLayerIndex(layers.length)
    handleSaveToHistory()
  }

  const handleSplitToFrame = () => {
    if (selection.size === 0) return
    
    const frameIndex = framesEnabled ? activeFrameIndex : 0
    const currentFrame = frames[frameIndex]
    const currentPixels = currentFrame.layerPixels[activeLayerIndex] || Array(gridWidth * gridHeight).fill(null)
    
    const newFramePixels = Array(gridWidth * gridHeight).fill(null)
    selection.forEach(index => {
      newFramePixels[index] = currentPixels[index]
    })
    
    const updatedCurrentPixels = [...currentPixels]
    selection.forEach(index => {
      updatedCurrentPixels[index] = null
    })
    
    const newFrame = {
      id: nextFrameId,
      name: `Frame ${frames.length + 1}`,
      layerPixels: frames[frameIndex].layerPixels.map((layerPixels, layerIdx) => {
        if (layerIdx === activeLayerIndex) {
          return newFramePixels
        }
        return Array(gridWidth * gridHeight).fill(null)
      }),
      visible: true
    }
    
    setFrames(prev => {
      const newFrames = [...prev]
      const updatedLayerPixels = [...newFrames[frameIndex].layerPixels]
      updatedLayerPixels[activeLayerIndex] = updatedCurrentPixels
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
    const currentPixels = currentFrame.layerPixels[activeLayerIndex] || Array(gridWidth * gridHeight).fill(null)
    
    const newFramePixels = Array(gridWidth * gridHeight).fill(null)
    selection.forEach(index => {
      newFramePixels[index] = currentPixels[index]
    })
    
    const newFrame = {
      id: nextFrameId,
      name: `Frame ${frames.length + 1}`,
      layerPixels: frames[frameIndex].layerPixels.map((layerPixels, layerIdx) => {
        if (layerIdx === activeLayerIndex) {
          return newFramePixels
        }
        return Array(gridWidth * gridHeight).fill(null)
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
