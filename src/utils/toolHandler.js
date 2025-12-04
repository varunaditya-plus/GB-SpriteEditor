// Centralized tool handler - Routes tool actions to appropriate utilities
import { handlePencilDown, handlePencilMove } from './pencil'
import { handleEraserDown, handleEraserMove } from './eraser'
import { handleFillDown } from './fill'
import { handleLineDown, handleLineMove, handleLineUp } from './line'
import { handleRectangleDown, handleRectangleMove, handleRectangleUp } from './rectangle'
import { handleCircleDown, handleCircleMove, handleCircleUp } from './circle'
import { handleColorPickerDown } from './colorPicker'
import { handleRectangleSelectionDown, handleRectangleSelectionMove, handleRectangleSelectionUp } from './rectangleSelection'
import { handleLassoSelectionDown, handleLassoSelectionMove, handleLassoSelectionUp } from './lassoSelection'
import { moveSelection, updateSelectionIndices, isInSelection } from './moveSelection'

export const handleToolMouseDown = ({
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
}) => {
  // Check if clicking on selection to move it
  if (selection.size > 0 && index !== null && isInSelection(index, selection) && !isRightButton) {
    setIsMovingSelection(true)
    setMoveStartIndex(index)
    setOriginalPixels([...pixels])
    setOriginalSelection(new Set(selection))
    return
  }

  // Clear selection if clicking outside the selection area (for any tool)
  if (selection.size > 0 && (index === null || !isInSelection(index, selection)) && !isRightButton) {
    setSelection(new Set())
    setLassoPath([])
  }

  // Clear selection if clicking outside with selection tools (starting new selection)
  if ((selectedTool === 'rectangleSelection' || selectedTool === 'lassoSelection') && selection.size > 0 && !isRightButton) {
    setSelection(new Set())
    setLassoPath([])
  }

  // Save original pixels for preview tools
  if (selectedTool === 'line' || selectedTool === 'rectangle' || selectedTool === 'circle') {
    setOriginalPixels([...pixels])
  }

  // If right-click with pencil or eraser, treat as eraser
  if ((selectedTool === 'pencil' || selectedTool === 'eraser') && isRightButton) {
    handleEraserDown(index, setPixel)
    return
  }

  // Route to appropriate tool handler
  switch (selectedTool) {
    case 'pencil':
      handlePencilDown(index, currentColor, setPixel)
      break
    case 'eraser':
      handleEraserDown(index, setPixel)
      break
    case 'fill':
      handleFillDown(index, currentColor, pixels, GRID_SIZE, setPixels)
      break
    case 'line':
      handleLineDown(index, currentColor, GRID_SIZE, setStartPoint)
      break
    case 'rectangle':
      handleRectangleDown(index, currentColor, GRID_SIZE, setStartPoint)
      break
    case 'circle':
      handleCircleDown(index, currentColor, GRID_SIZE, setStartPoint)
      break
    case 'rectangleSelection':
      handleRectangleSelectionDown(index, GRID_SIZE, setStartPoint)
      setSelection(new Set())
      break
    case 'lassoSelection':
      handleLassoSelectionDown(index, GRID_SIZE, setLassoPath)
      setSelection(new Set())
      break
    case 'colorPicker':
      handleColorPickerDown(index, pixels, setCurrentColor)
      break
    default:
      break
  }
}

export const handleToolMouseMove = ({
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
}) => {
  if (!isDrawing) return

  setHasMoved(true)

  // Handle moving selection
  if (isMovingSelection && moveStartIndex !== null && originalPixels !== null && originalSelection !== null) {
    moveSelection(originalSelection, moveStartIndex, index, pixels, GRID_SIZE, setPixels, originalPixels)
    const newSelection = updateSelectionIndices(originalSelection, moveStartIndex, index, GRID_SIZE)
    setSelection(newSelection)
    return
  }

  // If right-click with pencil or eraser, treat as eraser
  if ((selectedTool === 'pencil' || selectedTool === 'eraser') && isRightClick) {
    handleEraserMove(index, setPixel)
    return
  }

  // Route to appropriate tool handler
  switch (selectedTool) {
    case 'pencil':
      handlePencilMove(index, currentColor, setPixel)
      break
    case 'eraser':
      handleEraserMove(index, setPixel)
      break
    case 'line':
      if (startPoint !== null && originalPixels !== null) {
        setPixels([...originalPixels])
        handleLineMove(index, startPoint, currentColor, GRID_SIZE, setPixels, originalPixels)
      }
      break
    case 'rectangle':
      if (startPoint !== null && originalPixels !== null) {
        setPixels([...originalPixels])
        handleRectangleMove(index, startPoint, currentColor, GRID_SIZE, setPixels, originalPixels, false)
      }
      break
    case 'circle':
      if (startPoint !== null && originalPixels !== null) {
        setPixels([...originalPixels])
        handleCircleMove(index, startPoint, currentColor, GRID_SIZE, setPixels, originalPixels, false)
      }
      break
    case 'rectangleSelection':
      if (startPoint !== null) {
        handleRectangleSelectionMove(index, startPoint, GRID_SIZE, setSelection)
      }
      break
    case 'lassoSelection':
      handleLassoSelectionMove(index, lassoPath, GRID_SIZE, setLassoPath, setSelection)
      break
    default:
      break
  }
}

export const handleToolMouseUp = ({
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
}) => {
  if (!isDrawing) return

  // Handle finishing moving selection
  if (isMovingSelection && moveStartIndex !== null && originalPixels !== null && originalSelection !== null) {
    if (index !== null) {
      moveSelection(originalSelection, moveStartIndex, index, pixels, GRID_SIZE, setPixels, originalPixels)
      const newSelection = updateSelectionIndices(originalSelection, moveStartIndex, index, GRID_SIZE)
      setSelection(newSelection)
    } else {
      setPixels([...originalPixels])
      setSelection(new Set(originalSelection))
    }
    setIsMovingSelection(false)
    setMoveStartIndex(null)
    setOriginalPixels(null)
    setOriginalSelection(null)
    setIsDrawing(false)
    setIsRightClick(false)
    return
  }

  // Route to appropriate tool handler
  switch (selectedTool) {
    case 'line':
      if (startPoint !== null && originalPixels !== null && index !== null) {
        handleLineUp(index, startPoint, currentColor, GRID_SIZE, setPixels, originalPixels, setStartPoint)
      } else if (startPoint !== null) {
        setPixels([...originalPixels])
        setStartPoint(null)
      }
      break
    case 'rectangle':
      if (startPoint !== null && originalPixels !== null && index !== null) {
        handleRectangleUp(index, startPoint, currentColor, GRID_SIZE, setPixels, originalPixels, setStartPoint, false)
      } else if (startPoint !== null) {
        setPixels([...originalPixels])
        setStartPoint(null)
      }
      break
    case 'circle':
      if (startPoint !== null && originalPixels !== null && index !== null) {
        handleCircleUp(index, startPoint, currentColor, GRID_SIZE, setPixels, originalPixels, setStartPoint, false)
      } else if (startPoint !== null) {
        setPixels([...originalPixels])
        setStartPoint(null)
      }
      break
    case 'rectangleSelection':
      if (startPoint !== null && index !== null && hasMoved) {
        handleRectangleSelectionUp(index, startPoint, GRID_SIZE, setSelection, setStartPoint)
      } else if (startPoint !== null) {
        setSelection(new Set())
        setStartPoint(null)
      }
      break
    case 'lassoSelection':
      if (lassoPath.length > 0 && hasMoved) {
        handleLassoSelectionUp(index, lassoPath, GRID_SIZE, setLassoPath, setSelection)
      } else if (lassoPath.length > 0) {
        setSelection(new Set())
        setLassoPath([])
      }
      break
    default:
      break
  }

  setIsDrawing(false)
  setOriginalPixels(null)
  setIsRightClick(false)
}

export const checkHoveringSelection = (index, selection, isDrawing) => {
  if (!isDrawing && selection.size > 0 && index !== null) {
    return isInSelection(index, selection)
  }
  return false
}
