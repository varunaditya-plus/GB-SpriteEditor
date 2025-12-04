import { useState, useRef, useCallback, useEffect } from 'react'
import ColorPicker from './components/ColorPicker'
import { handleToolMouseDown, handleToolMouseMove, handleToolMouseUp, checkHoveringSelection } from './utils/toolHandler'

const GRID_SIZE = 32
const CELL_SIZE = 24

export default function App() {
  const [selectedTool, setSelectedTool] = useState('pencil')
  const [currentColor, setCurrentColor] = useState('#ffffff')
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
  const canvasRef = useRef(null)

  // Clear selection when switching tools (unless switching to a selection tool)
  useEffect(() => {
    if (selectedTool !== 'rectangleSelection' && selectedTool !== 'lassoSelection') {
      setSelection(new Set())
      setLassoPath([])
    }
  }, [selectedTool])

  const getPixelIndex = (x, y) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return null
    
    const cellX = Math.floor((x - rect.left) / CELL_SIZE)
    const cellY = Math.floor((y - rect.top) / CELL_SIZE)
    
    if (cellX < 0 || cellX >= GRID_SIZE || cellY < 0 || cellY >= GRID_SIZE) {
      return null
    }
    
    return cellY * GRID_SIZE + cellX
  }

  const setPixel = useCallback((index, color) => {
    if (index === null || index < 0 || index >= pixels.length) return
    
    setPixels(prev => {
      const newPixels = [...prev]
      newPixels[index] = color
      return newPixels
    })
  }, [pixels.length])

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
      setPixel,
      setPixels,
      setSelection,
      setLassoPath,
      setHasMoved
    })
  }

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

  return (
    <div className="bg-neutral-900 text-white w-full h-screen flex flex-row items-center justify-center">
      <div className="w-16 flex flex-col items-center justify-start">
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
        <div
          ref={canvasRef}
          className="relative"
          style={{display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`, gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`, border: '1px solid #404040', backgroundColor: 'transparent', cursor: isHoveringSelection ? 'pointer' : 'crosshair'}}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={(e) => {
            handleMouseUp(e)
            setIsHoveringSelection(false)
          }}
          onContextMenu={handleContextMenu}
        >
          {pixels.map((color, index) => (
            <div
              key={index}
              className="border border-neutral-800/30 relative"
              style={{backgroundColor: color || 'transparent', width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`}}
            >
              {selection.has(index) && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.4)',
                    border: '1px solid rgba(59, 130, 246, 0.6)'
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <ColorPicker currentColor={currentColor} onColorChange={handleColorChange} />
    </div>
  )
}
