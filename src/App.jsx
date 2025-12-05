import { useState, useRef, useCallback, useEffect } from 'react'
import Panels from './components/Panels'
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
  const [pixels, setPixels] = useState(() => 
    Array(GRID_SIZE * GRID_SIZE).fill(null)
  )
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
  const initialHistoryState = Array(GRID_SIZE * GRID_SIZE).fill(null)
  const historyState = createHistory(initialHistoryState)
  const [history, setHistory] = useState(historyState.history)
  const [historyIndex, setHistoryIndex] = useState(historyState.historyIndex)
  const isUndoRedoRef = historyState.isUndoRedoRef
  const fillJustUsedRef = useRef(false)
  const canvasRef = useRef(null)
  const canvasSize = GRID_SIZE * CELL_SIZE

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
    drawCanvas(canvas, canvasSize, GRID_SIZE, CELL_SIZE, pixels, selection)
  }, [pixels, selection, canvasSize])

  useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  const getPixelIndex = (x, y) => {
    const canvas = canvasRef.current
    return getPixelIndexUtil(canvas, x, y, GRID_SIZE, CELL_SIZE)
  }

  const setPixel = useCallback((index, color) => {
    if (index === null || index < 0 || index >= pixels.length) return
    
    setPixels(prev => {
      const newPixels = [...prev]
      newPixels[index] = color
      return newPixels
    })
  }, [pixels.length])

  const handleSaveToHistory = useCallback((newPixels) => {
    const result = saveToHistory(history, historyIndex, newPixels, isUndoRedoRef)
    if (result) {
      setHistory(result.history)
      setHistoryIndex(result.historyIndex)
    }
  }, [historyIndex, history])

  const handleUndo = useCallback(() => {
    const newIndex = undo(history, historyIndex, setPixels, isUndoRedoRef)
    if (newIndex !== historyIndex) {
      setHistoryIndex(newIndex)
    }
  }, [historyIndex, history])

  const handleRedo = useCallback(() => {
    const newIndex = redo(history, historyIndex, setPixels, isUndoRedoRef)
    if (newIndex !== historyIndex) {
      setHistoryIndex(newIndex)
    }
  }, [historyIndex, history])

  const handleMouseDown = (e) => {
    const isRightButton = e.button === 2
    setIsRightClick(isRightButton)
    setIsDrawing(true)
    setHasMoved(false)
    const index = getPixelIndex(e.clientX, e.clientY)
    
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
      setPixels,
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
      setPixels,
      setSelection,
      setLassoPath,
      setHasMoved
    })
  }

  const prevIsDrawingRef = useRef(isDrawing)
  useEffect(() => {
    if (prevIsDrawingRef.current && !isDrawing && hasMoved) {
      const timer = setTimeout(() => {
        handleSaveToHistory(pixels)
        setHasMoved(false)
      }, 50)
      prevIsDrawingRef.current = isDrawing
      return () => clearTimeout(timer)
    }
    if (fillJustUsedRef.current && !isDrawing) {
      const timer = setTimeout(() => {
        handleSaveToHistory(pixels)
        fillJustUsedRef.current = false
      }, 100)
      return () => clearTimeout(timer)
    }
    prevIsDrawingRef.current = isDrawing
  }, [isDrawing, hasMoved, pixels, handleSaveToHistory])

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
      setPixels,
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
    <div className="bg-neutral-900 text-white w-full h-screen flex flex-row items-center justify-center">
      <div className="w-16 flex flex-col items-center justify-start">
        <button
          onClick={handleUndo}
          disabled={!undoAvailable}
          className={`w-16 h-16 bg-neutral-700 flex items-center justify-center border-b-2 border-neutral-800 active:bg-neutral-700/50 ${!undoAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Undo"
        >
          <img 
            src="/undo.png" 
            alt="Undo"
            className="w-7 h-7"
          />
        </button>
        <button
          onClick={handleRedo}
          disabled={!redoAvailable}
          className={`w-16 h-16 bg-neutral-700 flex items-center justify-center border-b-2 border-neutral-800 active:bg-neutral-700/50 ${!redoAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Redo"
        >
          <img 
            src="/redo.png" 
            alt="Redo"
            className="w-7 h-7"
          />
        </button>

        {tools.map((tool) => (
          <button 
            key={tool.id} 
            onClick={() => setSelectedTool(tool.id)} 
            className={`w-16 h-16 bg-neutral-700 flex items-center justify-center border-b-2 border-neutral-800 active:bg-neutral-700/50 ${selectedTool === tool.id ? 'bg-neutral-800/50' : ''}`} 
            title={tool.label}
          >
            <img 
              src={`/${tool.id}.png`} 
              alt={tool.label}
              className="w-7 h-7"
            />
          </button>
        ))}
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
      />
    </div>
  )
}
