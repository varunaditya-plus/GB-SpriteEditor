import { useState, useRef, useCallback, useEffect } from 'react'
import Panels from './components/Panels'
import Frames from './components/Frames'
import PropertiesModal from './components/PropertiesModal'
import ErrorModal from './components/ErrorModal'
import { handleToolMouseDown, handleToolMouseMove, handleToolMouseUp, checkHoveringSelection } from './utils/toolHandler'
import { initializeCanvas, drawCanvas, getPixelIndex as getPixelIndexUtil } from './utils/canvas'
import { createHistory, saveToHistory, undo, redo, canUndo, canRedo } from './utils/history'
import { loadImageToPixels, loadGifFrames, pixelsToCCode } from './utils/imageUtils'

const DEFAULT_GRID_WIDTH = 32
const DEFAULT_GRID_HEIGHT = 32
const CELL_SIZE = 24

export default function App() {
  const [gridWidth, setGridWidth] = useState(DEFAULT_GRID_WIDTH)
  const [gridHeight, setGridHeight] = useState(DEFAULT_GRID_HEIGHT)
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState('#171717')
  const [isPropertiesModalOpen, setIsPropertiesModalOpen] = useState(false)
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' })
  const [selectedTool, setSelectedTool] = useState('pencil')
  const [currentColor, setCurrentColor] = useState('#ffffff')
  const [brushThickness, setBrushThickness] = useState(1)
  const [brushOpacity, setBrushOpacity] = useState(10)
  const [strokeWidth, setStrokeWidth] = useState(1)
  const [nextLayerId, setNextLayerId] = useState(1)
  const [framesEnabled, setFramesEnabled] = useState(false)
  const [nextFrameId, setNextFrameId] = useState(1)
  const [layers, setLayers] = useState(() => [
    { id: 0, name: 'Layer 1', visible: true }
  ])
  const [frames, setFrames] = useState(() => [
    {
      id: 0,
      name: 'Frame 1',
      layerPixels: [Array(DEFAULT_GRID_WIDTH * DEFAULT_GRID_HEIGHT).fill(null)],
      visible: true
    }
  ])
  const [activeFrameIndex, setActiveFrameIndex] = useState(0)
  const [fps, setFps] = useState(12)
  const [activeLayerIndex, setActiveLayerIndex] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState(null)
  const [originalPixels, setOriginalPixels] = useState(null)
  const [isRightClick, setIsRightClick] = useState(false)
  const [selection, setSelection] = useState(new Set())
  const [lassoPath, setLassoPath] = useState([])
  const [isMovingSelection, setIsMovingSelection] = useState(false)
  const [moveStartIndex, setMoveStartIndex] = useState(null)
  const [originalSelection, setOriginalSelection] = useState(null)
  const [hasMoved, setHasMoved] = useState(false)
  const [isHoveringSelection, setIsHoveringSelection] = useState(false)
  const initialHistoryState = {
    layers: [{ id: 0, name: 'Layer 1', visible: true }],
    frames: [{ id: 0, name: 'Frame 1', layerPixels: [Array(DEFAULT_GRID_WIDTH * DEFAULT_GRID_HEIGHT).fill(null)], visible: true }]
  }
  const historyState = createHistory(initialHistoryState)
  const [history, setHistory] = useState(historyState.history)
  const [historyIndex, setHistoryIndex] = useState(historyState.historyIndex)
  const isUndoRedoRef = historyState.isUndoRedoRef
  const fillJustUsedRef = useRef(false)
  const canvasRef = useRef(null)
  const canvasContainerRef = useRef(null)
  const baseCanvasWidth = gridWidth * CELL_SIZE
  const baseCanvasHeight = gridHeight * CELL_SIZE
  const [canvasDisplaySize, setCanvasDisplaySize] = useState({ 
    width: baseCanvasWidth, 
    height: baseCanvasHeight 
  })

  const getCurrentLayers = useCallback(() => {
    if (framesEnabled) {
      const frame = frames[activeFrameIndex]
      if (!frame) return []
      return layers.map((layer, index) => ({
        ...layer,
        pixels: frame.layerPixels && frame.layerPixels[index] ? frame.layerPixels[index] : Array(gridWidth * gridHeight).fill(null)
      }))
    } else {
      const frame = frames[0]
      if (!frame) return layers.map(layer => ({ ...layer, pixels: Array(gridWidth * gridHeight).fill(null) }))
      return layers.map((layer, index) => ({
        ...layer,
        pixels: frame.layerPixels && frame.layerPixels[index] ? frame.layerPixels[index] : Array(gridWidth * gridHeight).fill(null)
      }))
    }
  }, [framesEnabled, frames, activeFrameIndex, layers, gridWidth, gridHeight])

  const currentLayers = getCurrentLayers()
  const pixels = currentLayers[activeLayerIndex]?.pixels || []

  useEffect(() => {
    if (selectedTool !== 'rectangleSelection' && selectedTool !== 'lassoSelection') {
      setSelection(new Set())
      setLassoPath([])
    }
  }, [selectedTool])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = canvasContainerRef.current
    if (!canvas || !container) return
    
    const updateCanvasSize = () => {
      const containerRect = container.getBoundingClientRect()
      const availableWidth = containerRect.width - 32
      const availableHeight = containerRect.height - 32
      
      if (availableWidth <= 0 || availableHeight <= 0) return
      
      const aspectRatio = baseCanvasWidth / baseCanvasHeight
      const containerAspectRatio = availableWidth / availableHeight
      
      let displayWidth, displayHeight
      if (containerAspectRatio > aspectRatio) {
        displayHeight = Math.min(availableHeight, baseCanvasHeight)
        displayWidth = displayHeight * aspectRatio
      } else {
        displayWidth = Math.min(availableWidth, baseCanvasWidth)
        displayHeight = displayWidth / aspectRatio
      }
      
      setCanvasDisplaySize({ width: displayWidth, height: displayHeight })
      initializeCanvas(canvas, displayWidth, displayHeight)
    }
    
    // Initial size calculation
    const timer = setTimeout(updateCanvasSize, 0)
    
    const resizeObserver = new ResizeObserver(updateCanvasSize)
    resizeObserver.observe(container)
    
    window.addEventListener('resize', updateCanvasSize)
    
    return () => {
      clearTimeout(timer)
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateCanvasSize)
    }
  }, [baseCanvasWidth, baseCanvasHeight])

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || canvasDisplaySize.width === 0 || canvasDisplaySize.height === 0) return
    const cellSizeX = canvasDisplaySize.width / gridWidth
    const cellSizeY = canvasDisplaySize.height / gridHeight
    drawCanvas(canvas, canvasDisplaySize.width, canvasDisplaySize.height, gridWidth, gridHeight, cellSizeX, cellSizeY, currentLayers, selection)
  }, [currentLayers, selection, canvasDisplaySize, gridWidth, gridHeight])

  useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  const getPixelIndex = (x, y) => {
    const canvas = canvasRef.current
    if (!canvas || canvasDisplaySize.width === 0 || canvasDisplaySize.height === 0) return null
    const cellSizeX = canvasDisplaySize.width / gridWidth
    const cellSizeY = canvasDisplaySize.height / gridHeight
    return getPixelIndexUtil(canvas, x, y, gridWidth, gridHeight, cellSizeX, cellSizeY)
  }

  const setPixel = useCallback((index, color) => {
    if (index === null || index < 0 || index >= gridWidth * gridHeight) return
    
    const frameIndex = framesEnabled ? activeFrameIndex : 0
    
    setFrames(prev => {
      const newFrames = [...prev]
      const frame = newFrames[frameIndex]
      const newLayerPixels = [...frame.layerPixels]
      if (!newLayerPixels[activeLayerIndex]) {
        newLayerPixels[activeLayerIndex] = Array(gridWidth * gridHeight).fill(null)
      }
      const newPixels = [...newLayerPixels[activeLayerIndex]]
      newPixels[index] = color
      newLayerPixels[activeLayerIndex] = newPixels
      newFrames[frameIndex] = {
        ...frame,
        layerPixels: newLayerPixels
      }
      return newFrames
    })
  }, [activeLayerIndex, framesEnabled, activeFrameIndex])

  const handleSaveToHistory = useCallback(() => {
    const stateToSave = { layers, frames }
    const result = saveToHistory(history, historyIndex, stateToSave, isUndoRedoRef)
    if (result) {
      setHistory(result.history)
      setHistoryIndex(result.historyIndex)
    }
  }, [historyIndex, history, layers, frames])

  const handleUndo = useCallback(() => {
    const restoreState = (state) => {
      setLayers(state.layers)
      setFrames(state.frames)
    }
    const newIndex = undo(history, historyIndex, restoreState, isUndoRedoRef)
    if (newIndex !== historyIndex) {
      setHistoryIndex(newIndex)
    }
  }, [historyIndex, history])

  const handleRedo = useCallback(() => {
    const restoreState = (state) => {
      setLayers(state.layers)
      setFrames(state.frames)
    }
    const newIndex = redo(history, historyIndex, restoreState, isUndoRedoRef)
    if (newIndex !== historyIndex) {
      setHistoryIndex(newIndex)
    }
  }, [historyIndex, history])

  const addLayer = useCallback(() => {
    setLayers(prev => {
      const newLayer = {
        id: nextLayerId,
        name: `Layer ${prev.length + 1}`,
        visible: true
      }
      setNextLayerId(prev => prev + 1)
      return [...prev, newLayer]
    })
    
    setFrames(prev => prev.map(frame => ({
      ...frame,
      layerPixels: [...frame.layerPixels, Array(gridWidth * gridHeight).fill(null)]
    })))
    
    setActiveLayerIndex(prev => prev + 1)
  }, [nextLayerId])

  const deleteLayer = useCallback((index) => {
    if (layers.length <= 1) return
    
    setLayers(prev => prev.filter((_, i) => i !== index))
    
    setFrames(prev => prev.map(frame => ({
      ...frame,
      layerPixels: frame.layerPixels.filter((_, i) => i !== index)
    })))
    
    if (activeLayerIndex >= index && activeLayerIndex > 0) {
      setActiveLayerIndex(prev => Math.max(0, prev - 1))
    } else if (activeLayerIndex >= layers.length - 1) {
      setActiveLayerIndex(layers.length - 2)
    }
  }, [layers.length, activeLayerIndex])

  const selectLayer = useCallback((index) => {
    if (index >= 0 && index < layers.length) {
      setActiveLayerIndex(index)
    }
  }, [layers.length])

  const toggleLayerVisibility = useCallback((index) => {
    setLayers(prev => {
      const newLayers = [...prev]
      newLayers[index] = {
        ...newLayers[index],
        visible: !newLayers[index].visible
      }
      return newLayers
    })
  }, [])

  const reorderLayer = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return
    if (toIndex < 0 || toIndex >= layers.length) return
    
    let newActiveIndex = activeLayerIndex
    
    if (activeLayerIndex === fromIndex) {
      newActiveIndex = toIndex
    } else if (fromIndex < activeLayerIndex && toIndex >= activeLayerIndex) {
      newActiveIndex = activeLayerIndex - 1
    } else if (fromIndex > activeLayerIndex && toIndex <= activeLayerIndex) {
      newActiveIndex = activeLayerIndex + 1
    }
    
    setLayers(prev => {
      const newLayers = [...prev]
      const [movedLayer] = newLayers.splice(fromIndex, 1)
      newLayers.splice(toIndex, 0, movedLayer)
      return newLayers
    })
    
    setFrames(prev => prev.map(frame => {
      const newLayerPixels = [...frame.layerPixels]
      const [movedPixels] = newLayerPixels.splice(fromIndex, 1)
      newLayerPixels.splice(toIndex, 0, movedPixels)
      return {
        ...frame,
        layerPixels: newLayerPixels
      }
    }))
    
    setActiveLayerIndex(newActiveIndex)
  }, [layers.length, activeLayerIndex])

  const toggleFrames = useCallback(() => {
    if (!framesEnabled) {
      const currentLayerPixels = frames[0]?.layerPixels || layers.map(() => Array(gridWidth * gridHeight).fill(null))
      setFrames([{
        id: 0,
        name: 'Frame 1',
        layerPixels: JSON.parse(JSON.stringify(currentLayerPixels)),
        visible: true
      }])
      setActiveFrameIndex(0)
    }
    setFramesEnabled(prev => !prev)
  }, [framesEnabled, frames, layers])

  const addFrame = useCallback(() => {
    setFrames(prev => {
      const newFrame = {
        id: nextFrameId,
        name: `Frame ${prev.length + 1}`,
        layerPixels: layers.map(() => Array(gridWidth * gridHeight).fill(null)),
        visible: true
      }
      setNextFrameId(prev => prev + 1)
      return [...prev, newFrame]
    })
    setActiveFrameIndex(prev => prev + 1)
  }, [nextFrameId, layers])

  const deleteFrame = useCallback((index) => {
    if (frames.length <= 1) return
    
    setFrames(prev => prev.filter((_, i) => i !== index))
    
    if (activeFrameIndex >= index && activeFrameIndex > 0) {
      setActiveFrameIndex(prev => Math.max(0, prev - 1))
    } else if (activeFrameIndex >= frames.length - 1) {
      setActiveFrameIndex(frames.length - 2)
    }
  }, [frames.length, activeFrameIndex])

  const selectFrame = useCallback((index) => {
    if (index >= 0 && index < frames.length) {
      setActiveFrameIndex(index)
      setActiveLayerIndex(0)
    }
  }, [frames.length])

  const toggleFrameVisibility = useCallback((index) => {
    setFrames(prev => {
      const newFrames = [...prev]
      newFrames[index] = {
        ...newFrames[index],
        visible: !newFrames[index].visible
      }
      return newFrames
    })
  }, [])

  const reorderFrame = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return
    if (toIndex < 0 || toIndex >= frames.length) return
    
    let newActiveIndex = activeFrameIndex
    
    if (activeFrameIndex === fromIndex) {
      newActiveIndex = toIndex
    } else if (fromIndex < activeFrameIndex && toIndex >= activeFrameIndex) {
      newActiveIndex = activeFrameIndex - 1
    } else if (fromIndex > activeFrameIndex && toIndex <= activeFrameIndex) {
      newActiveIndex = activeFrameIndex + 1
    }
    
    setFrames(prev => {
      const newFrames = [...prev]
      const [movedFrame] = newFrames.splice(fromIndex, 1)
      newFrames.splice(toIndex, 0, movedFrame)
      return newFrames
    })
    
    setActiveFrameIndex(newActiveIndex)
  }, [frames.length, activeFrameIndex])

  const handleFileUpload = useCallback(async (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    const validFiles = files.filter(file => {
      const fileType = file.type.toLowerCase()
      const isImage = fileType.startsWith('image/')
      const isGif = fileType === 'image/gif'
      const isPng = fileType === 'image/png'
      const isJpg = fileType === 'image/jpeg' || fileType === 'image/jpg'
      return isImage && (isGif || isPng || isJpg)
    })

    if (validFiles.length === 0) {
      alert('Please upload PNG, JPG, JPEG, or GIF files')
      event.target.value = ''
      return
    }

    try {
      const allPixelArrays = []
      let detectedWidth = gridWidth
      let detectedHeight = gridHeight
      
      for (const file of validFiles) {
        const fileType = file.type.toLowerCase()
        const isGif = fileType === 'image/gif'
        
        // Check image dimensions first
        const img = new Image()
        const imageLoadPromise = new Promise((resolve, reject) => {
          img.onload = () => {
            if (img.width > 256 || img.height > 256) {
              reject(new Error(`Image dimensions (${img.width}×${img.height}) exceed the maximum supported size of 256×256 pixels.`))
            } else {
              resolve({ width: img.width, height: img.height })
            }
          }
          img.onerror = () => reject(new Error('Failed to load image'))
          img.src = URL.createObjectURL(file)
        })
        
        try {
          await imageLoadPromise
          URL.revokeObjectURL(img.src)
        } catch (error) {
          URL.revokeObjectURL(img.src)
          setErrorModal({
            isOpen: true,
            message: error.message || 'The canvas does not support images larger than 256×256 pixels.'
          })
          event.target.value = ''
          return
        }
        
        if (isGif) {
          const frames = await loadGifFrames(file)
          if (frames.length > 0 && frames[0].width) {
            detectedWidth = frames[0].width
            detectedHeight = frames[0].height
          }
          allPixelArrays.push(...frames.map(f => f.pixels))
        } else {
          const result = await loadImageToPixels(file)
          if (result.width) {
            detectedWidth = result.width
            detectedHeight = result.height
          }
          allPixelArrays.push(result.pixels)
        }
      }

      if (allPixelArrays.length === 0) {
        alert('Failed to load images')
        event.target.value = ''
        return
      }

      if (detectedWidth !== gridWidth || detectedHeight !== gridHeight) {
        setGridWidth(detectedWidth)
        setGridHeight(detectedHeight)
      }

      const newFrames = allPixelArrays.map((pixels, index) => ({
        id: nextFrameId + index,
        name: `Frame ${index + 1}`,
        layerPixels: [pixels],
        visible: true
      }))

      setNextFrameId(prev => prev + allPixelArrays.length)
      setFrames(newFrames)
      setActiveFrameIndex(0)
      
      if (!framesEnabled) {
        setFramesEnabled(true)
      }

      event.target.value = ''
    } catch (error) {
      console.error('Error loading images:', error)
      alert('Failed to load images: ' + error.message)
      event.target.value = ''
    }
  }, [framesEnabled, nextFrameId, gridWidth, gridHeight])

  const handleExport = useCallback(() => {
    const currentFrame = frames[activeFrameIndex]
    if (!currentFrame || !currentFrame.layerPixels || currentFrame.layerPixels.length === 0) {
      alert('No frame data to export')
      return
    }

    const pixels = currentFrame.layerPixels[0] || Array(gridWidth * gridHeight).fill(null)
    const { c: cCode, h: hCode } = pixelsToCCode(pixels, gridWidth, gridHeight)
    
    // Download .c file
    const cBlob = new Blob([cCode], { type: 'text/plain' })
    const cUrl = URL.createObjectURL(cBlob)
    const cLink = document.createElement('a')
    cLink.href = cUrl
    cLink.download = 'sprite.c'
    document.body.appendChild(cLink)
    cLink.click()
    document.body.removeChild(cLink)
    URL.revokeObjectURL(cUrl)
    
    // Download .h file
    const hBlob = new Blob([hCode], { type: 'text/plain' })
    const hUrl = URL.createObjectURL(hBlob)
    const hLink = document.createElement('a')
    hLink.href = hUrl
    hLink.download = 'sprite.h'
    document.body.appendChild(hLink)
    hLink.click()
    document.body.removeChild(hLink)
    URL.revokeObjectURL(hUrl)
  }, [frames, activeFrameIndex, gridWidth, gridHeight])

  const handleGridSizeChange = useCallback((newWidth, newHeight) => {
    if (newWidth < 1 || newWidth > 256 || newHeight < 1 || newHeight > 256) return

    const resizePixels = (oldPixels, oldWidth, oldHeight, newWidth, newHeight) => {
      if (oldWidth === newWidth && oldHeight === newHeight) return oldPixels
      const newPixels = Array(newWidth * newHeight).fill(null)
      const minWidth = Math.min(oldWidth, newWidth)
      const minHeight = Math.min(oldHeight, newHeight)
      for (let row = 0; row < minHeight; row++) {
        for (let col = 0; col < minWidth; col++) {
          const oldIndex = row * oldWidth + col
          const newIndex = row * newWidth + col
          newPixels[newIndex] = oldPixels[oldIndex] || null
        }
      }
      return newPixels
    }

    setFrames(prev => prev.map(frame => ({
      ...frame,
      layerPixels: frame.layerPixels.map(pixels => resizePixels(pixels || [], gridWidth, gridHeight, newWidth, newHeight))
    })))

    setGridWidth(newWidth)
    setGridHeight(newHeight)
  }, [gridWidth, gridHeight])

  const handleMouseDown = (e) => {
    const isRightButton = e.button === 2
    setIsRightClick(isRightButton)
    setIsDrawing(true)
    setHasMoved(false)
    const index = getPixelIndex(e.clientX, e.clientY)
    
    if (selectedTool === 'line' || selectedTool === 'rectangle' || selectedTool === 'circle') {
      setOriginalPixels([...pixels])
    }
    
    handleToolMouseDown({
      selectedTool,
      index,
      isRightButton,
      currentColor,
      pixels,
      selection,
      startPoint,
      lassoPath,
      isMovingSelection,
      moveStartIndex,
      originalPixels,
      originalSelection,
      gridWidth,
      gridHeight,
      brushThickness,
      brushOpacity,
      strokeWidth,
      setPixel,
      setPixels: (newPixels) => {
        const frameIndex = framesEnabled ? activeFrameIndex : 0
        setFrames(prev => {
          const newFrames = [...prev]
          const frame = newFrames[frameIndex]
          const newLayerPixels = [...frame.layerPixels]
          newLayerPixels[activeLayerIndex] = newPixels
          newFrames[frameIndex] = {
            ...frame,
            layerPixels: newLayerPixels
          }
          return newFrames
        })
      },
      setStartPoint,
      setLassoPath,
      setSelection,
      setIsMovingSelection,
      setMoveStartIndex,
      setOriginalPixels,
      setOriginalSelection,
      setCurrentColor,
      setHasMoved
    })
  }

  const handleMouseHover = (e) => {
    const index = getPixelIndex(e.clientX, e.clientY)
    setIsHoveringSelection(checkHoveringSelection(index, selection, isDrawing))
  }

  const handleMouseMove = (e) => {
    handleMouseHover(e)
    
    const index = getPixelIndex(e.clientX, e.clientY)
    
    handleToolMouseMove({
      selectedTool,
      index,
      isRightClick,
      isDrawing,
      isMovingSelection,
      moveStartIndex,
      originalPixels,
      originalSelection,
      startPoint,
      lassoPath,
      currentColor,
      pixels,
      selection,
      gridWidth,
      gridHeight,
      brushThickness,
      brushOpacity,
      strokeWidth,
      setPixel,
      setPixels: (newPixels) => {
        const frameIndex = framesEnabled ? activeFrameIndex : 0
        setFrames(prev => {
          const newFrames = [...prev]
          const frame = newFrames[frameIndex]
          const newLayerPixels = [...frame.layerPixels]
          newLayerPixels[activeLayerIndex] = newPixels
          newFrames[frameIndex] = {
            ...frame,
            layerPixels: newLayerPixels
          }
          return newFrames
        })
      },
      setSelection,
      setLassoPath,
      setHasMoved
    })
  }

  const prevIsDrawingRef = useRef(isDrawing)
  useEffect(() => {
    if (prevIsDrawingRef.current && !isDrawing && hasMoved) {
      const timer = setTimeout(() => {
        handleSaveToHistory()
        setHasMoved(false)
      }, 50)
      prevIsDrawingRef.current = isDrawing
      return () => clearTimeout(timer)
    }
    if (fillJustUsedRef.current && !isDrawing) {
      const timer = setTimeout(() => {
        handleSaveToHistory()
        fillJustUsedRef.current = false
      }, 100)
      return () => clearTimeout(timer)
    }
    prevIsDrawingRef.current = isDrawing
  }, [isDrawing, hasMoved, handleSaveToHistory])

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isModifierPressed = e.metaKey || e.ctrlKey
      if (!isModifierPressed) return

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
        return
      }

      if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault()
        handleRedo()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  const handleMouseUp = (e) => {
    const index = e ? getPixelIndex(e.clientX, e.clientY) : null

    handleToolMouseUp({
      selectedTool,
      index,
      isDrawing,
      isMovingSelection,
      moveStartIndex,
      originalPixels,
      originalSelection,
      startPoint,
      lassoPath,
      hasMoved,
      currentColor,
      pixels,
      selection,
      gridWidth,
      gridHeight,
      strokeWidth,
      setPixels: (newPixels) => {
        const frameIndex = framesEnabled ? activeFrameIndex : 0
        setFrames(prev => {
          const newFrames = [...prev]
          const frame = newFrames[frameIndex]
          const newLayerPixels = [...frame.layerPixels]
          newLayerPixels[activeLayerIndex] = newPixels
          newFrames[frameIndex] = {
            ...frame,
            layerPixels: newLayerPixels
          }
          return newFrames
        })
      },
      setSelection,
      setStartPoint,
      setLassoPath,
      setIsMovingSelection,
      setMoveStartIndex,
      setOriginalPixels,
      setOriginalSelection,
      setIsDrawing,
      setIsRightClick
    })
  }

  const handleContextMenu = (e) => {
    // Prevent context menu when right-clicking on canvas
    e.preventDefault()
  }

  const handleColorChange = (color) => {
    setCurrentColor(color)
  }

  const tools = [
    { id: 'pencil', label: 'pencil' },
    { id: 'eraser', label: 'eraser' },
    { id: 'fill', label: 'fill' },
    { id: 'line', label: 'line' },
    { id: 'rectangle', label: 'rectangle' },
    { id: 'circle', label: 'circle' },
    { id: 'rectangleSelection', label: 'rectangle selection' },
    { id: 'lassoSelection', label: 'lasso selection' },
    { id: 'colorPicker', label: 'color picker' },
  ]

  const undoAvailable = canUndo(historyIndex)
  const redoAvailable = canRedo(history, historyIndex)

  return (
    <div className="text-white w-full h-screen flex flex-row" style={{ backgroundColor: canvasBackgroundColor }}>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 flex flex-row items-center justify-center min-h-0">
          <div className="flex flex-col gap-2 p-4">
            <div className="flex gap-2">
              <button onClick={handleUndo} disabled={!undoAvailable} className={`w-12 h-12 bg-neutral-700 flex items-center justify-center active:bg-neutral-700/50 rounded-xl ${!undoAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} title="Undo">
                <img src="/undo.png" alt="Undo" className="w-7 h-7" />
              </button>
              <button onClick={handleRedo} disabled={!redoAvailable} className={`w-12 h-12 bg-neutral-700 flex items-center justify-center active:bg-neutral-700/50 rounded-xl ${!redoAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} title="Redo">
                <img src="/redo.png" alt="Redo" className="w-7 h-7" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {tools.map((tool) => (
                <button 
                  key={tool.id} 
                  onClick={() => setSelectedTool(tool.id)} 
                  className={`w-12 h-12 bg-neutral-700 flex items-center justify-center active:bg-neutral-700/50 rounded-xl cursor-pointer ${selectedTool === tool.id ? 'bg-neutral-800/50' : ''}`} 
                  title={tool.label}
                >
                  <img src={`/${tool.id}.png`} alt={tool.label} className="w-7 h-7" />
                </button>
              ))}
            </div>
          </div>

          <div ref={canvasContainerRef} className="flex-1 h-full flex items-center justify-center p-4">
            <canvas
              ref={canvasRef}
              className="border border-neutral-700 cursor-crosshair"
              style={{ 
                cursor: isHoveringSelection ? 'pointer' : 'crosshair',
                width: `${canvasDisplaySize.width}px`,
                height: `${canvasDisplaySize.height}px`,
                imageRendering: 'pixelated'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={(e) => {
                handleMouseUp(e)
                setIsHoveringSelection(false)
              }}
              onContextMenu={handleContextMenu}
            />
          </div>
        </div>

        {framesEnabled && (
          <Frames
            framesEnabled={framesEnabled}
            onFramesToggle={toggleFrames}
            frames={frames}
            layers={layers}
            activeFrameIndex={activeFrameIndex}
            onFrameSelect={selectFrame}
            onFrameAdd={addFrame}
            onFrameDelete={deleteFrame}
            onFrameToggleVisibility={toggleFrameVisibility}
            onFrameReorder={reorderFrame}
            fps={fps}
            onFpsChange={setFps}
            gridWidth={gridWidth}
            gridHeight={gridHeight}
          />
        )}
      </div>

      <Panels
        selectedTool={selectedTool}
        currentColor={currentColor}
        onColorChange={handleColorChange}
        brushThickness={brushThickness}
        onBrushThicknessChange={setBrushThickness}
        brushOpacity={brushOpacity}
        onOpacityChange={setBrushOpacity}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
        layers={currentLayers}
        activeLayerIndex={activeLayerIndex}
        onLayerSelect={selectLayer}
        onLayerAdd={addLayer}
        onLayerDelete={deleteLayer}
        onLayerToggleVisibility={toggleLayerVisibility}
        onLayerReorder={reorderLayer}
        framesEnabled={framesEnabled}
        onFramesToggle={toggleFrames}
        frames={frames}
        frameLayers={layers}
        activeFrameIndex={activeFrameIndex}
        onFrameSelect={selectFrame}
        onFrameAdd={addFrame}
        onFrameDelete={deleteFrame}
        onFrameToggleVisibility={toggleFrameVisibility}
        onFrameReorder={reorderFrame}
        fps={fps}
        onFpsChange={setFps}
        gridWidth={gridWidth}
        gridHeight={gridHeight}
        onFileUpload={handleFileUpload}
        onExport={handleExport}
        onGridSizeChange={handleGridSizeChange}
        canvasBackgroundColor={canvasBackgroundColor}
        onCanvasBackgroundColorChange={setCanvasBackgroundColor}
      />

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, message: '' })}
        message={errorModal.message}
      />
    </div>
  )
}
