import { useState, useRef, useCallback, useEffect } from 'react'
import Panels from './components/Panels'
import Frames from './components/Frames'
import { handleToolMouseDown, handleToolMouseMove, handleToolMouseUp, checkHoveringSelection } from './utils/toolHandler'
import { initializeCanvas, drawCanvas, getPixelIndex as getPixelIndexUtil } from './utils/canvas'
import { createHistory, saveToHistory, undo, redo, canUndo, canRedo } from './utils/history'

const GRID_SIZE = 32
const CELL_SIZE = 24

export default function App() {
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
      layerPixels: [Array(GRID_SIZE * GRID_SIZE).fill(null)],
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
    frames: [{ id: 0, name: 'Frame 1', layerPixels: [Array(GRID_SIZE * GRID_SIZE).fill(null)], visible: true }]
  }
  const historyState = createHistory(initialHistoryState)
  const [history, setHistory] = useState(historyState.history)
  const [historyIndex, setHistoryIndex] = useState(historyState.historyIndex)
  const isUndoRedoRef = historyState.isUndoRedoRef
  const fillJustUsedRef = useRef(false)
  const canvasRef = useRef(null)
  const canvasSize = GRID_SIZE * CELL_SIZE

  const getCurrentLayers = useCallback(() => {
    if (framesEnabled) {
      const frame = frames[activeFrameIndex]
      if (!frame) return []
      return layers.map((layer, index) => ({
        ...layer,
        pixels: frame.layerPixels && frame.layerPixels[index] ? frame.layerPixels[index] : Array(GRID_SIZE * GRID_SIZE).fill(null)
      }))
    } else {
      const frame = frames[0]
      if (!frame) return layers.map(layer => ({ ...layer, pixels: Array(GRID_SIZE * GRID_SIZE).fill(null) }))
      return layers.map((layer, index) => ({
        ...layer,
        pixels: frame.layerPixels && frame.layerPixels[index] ? frame.layerPixels[index] : Array(GRID_SIZE * GRID_SIZE).fill(null)
      }))
    }
  }, [framesEnabled, frames, activeFrameIndex, layers])

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
    if (!canvas) return
    initializeCanvas(canvas, canvasSize)
  }, [canvasSize])

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawCanvas(canvas, canvasSize, GRID_SIZE, CELL_SIZE, currentLayers, selection)
  }, [currentLayers, selection, canvasSize])

  useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  const getPixelIndex = (x, y) => {
    const canvas = canvasRef.current
    return getPixelIndexUtil(canvas, x, y, GRID_SIZE, CELL_SIZE)
  }

  const setPixel = useCallback((index, color) => {
    if (index === null || index < 0 || index >= GRID_SIZE * GRID_SIZE) return
    
    const frameIndex = framesEnabled ? activeFrameIndex : 0
    
    setFrames(prev => {
      const newFrames = [...prev]
      const frame = newFrames[frameIndex]
      const newLayerPixels = [...frame.layerPixels]
      if (!newLayerPixels[activeLayerIndex]) {
        newLayerPixels[activeLayerIndex] = Array(GRID_SIZE * GRID_SIZE).fill(null)
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
      layerPixels: [...frame.layerPixels, Array(GRID_SIZE * GRID_SIZE).fill(null)]
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
      const currentLayerPixels = frames[0]?.layerPixels || layers.map(() => Array(GRID_SIZE * GRID_SIZE).fill(null))
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
        layerPixels: layers.map(() => Array(GRID_SIZE * GRID_SIZE).fill(null)),
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
      GRID_SIZE,
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
      GRID_SIZE,
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
      GRID_SIZE,
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
    <div className="bg-neutral-900 text-white w-full h-screen flex flex-row">
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

          <div className="flex-1 h-full flex items-center justify-center p-4">
            <canvas
              ref={canvasRef}
              width={canvasSize}
              height={canvasSize}
              className="border border-neutral-700 cursor-crosshair"
              style={{ cursor: isHoveringSelection ? 'pointer' : 'crosshair' }}
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
            gridSize={GRID_SIZE}
            cellSize={CELL_SIZE}
            canvasSize={canvasSize}
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
        gridSize={GRID_SIZE}
        cellSize={CELL_SIZE}
        canvasSize={canvasSize}
      />
    </div>
  )
}
