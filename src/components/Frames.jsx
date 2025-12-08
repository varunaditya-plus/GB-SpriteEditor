import { useRef, useEffect, useState, useCallback } from 'react'
import ContextMenu from './ContextMenu'

const PREVIEW_SIZE = 80

function FramePreview({ layers, visible, isActive, gridWidth, gridHeight }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cellSizeX = PREVIEW_SIZE / gridWidth
    const cellSizeY = PREVIEW_SIZE / gridHeight

    ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE)
    
    ctx.fillStyle = '#171717'
    ctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE)

    ctx.fillStyle = '#1f1f1f'
    for (let row = 0; row < gridHeight; row++) {
      for (let col = 0; col < gridWidth; col++) {
        if ((row + col) % 2 === 0) {
          // Use Math.floor to prevent overlap from fractional sizes
          const x = Math.floor(col * cellSizeX)
          const y = Math.floor(row * cellSizeY)
          const width = col === gridWidth - 1 
            ? PREVIEW_SIZE - x
            : Math.floor((col + 1) * cellSizeX) - x
          const height = row === gridHeight - 1
            ? PREVIEW_SIZE - y
            : Math.floor((row + 1) * cellSizeY) - y
          ctx.fillRect(x, y, width, height)
        }
      }
    }

    const compositePixels = Array(gridWidth * gridHeight).fill(null)
    
    layers.forEach((layer) => {
      if (layer.visible && layer.pixels) {
        // Ensure we only process valid indices
        const pixelArray = layer.pixels
        const maxIndex = Math.min(pixelArray.length, gridWidth * gridHeight)
        for (let i = 0; i < maxIndex; i++) {
          if (pixelArray[i]) {
            compositePixels[i] = pixelArray[i]
          }
        }
      }
    })

    compositePixels.forEach((color, index) => {
      if (color && index < gridWidth * gridHeight) {
        const row = Math.floor(index / gridWidth)
        const col = index % gridWidth
        // Use Math.floor to prevent overlap from fractional sizes
        const x = Math.floor(col * cellSizeX)
        const y = Math.floor(row * cellSizeY)
        const width = col === gridWidth - 1 
          ? PREVIEW_SIZE - x
          : Math.floor((col + 1) * cellSizeX) - x
        const height = row === gridHeight - 1
          ? PREVIEW_SIZE - y
          : Math.floor((row + 1) * cellSizeY) - y
        ctx.fillStyle = color
        ctx.fillRect(x, y, width, height)
      }
    })
  }, [layers, gridWidth, gridHeight])

  return (
    <div className="relative flex-shrink-0">
      <canvas
        ref={canvasRef}
        width={PREVIEW_SIZE}
        height={PREVIEW_SIZE}
        className={`border ${isActive ? 'border-blue-500' : 'border-neutral-600'}`}
        style={{ width: `${PREVIEW_SIZE}px`, height: `${PREVIEW_SIZE}px`, imageRendering: 'pixelated' }}
      />
      {!visible && (
        <div className="absolute inset-0 bg-neutral-900/70 flex items-center justify-center">
          <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        </div>
      )}
    </div>
  )
}

export function AnimationPreview({ frames, fps, onFpsChange, gridWidth, gridHeight }) {
  const canvasRef = useRef(null)
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const animationRef = useRef(null)
  const previewSize = 128
  const previewCellSizeX = previewSize / gridWidth
  const previewCellSizeY = previewSize / gridHeight

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || frames.length === 0) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = previewSize * dpr
    canvas.height = previewSize * dpr
    canvas.style.width = `${previewSize}px`
    canvas.style.height = `${previewSize}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)

    const currentFrame = frames[currentFrameIndex]
    if (currentFrame && currentFrame.layers) {
      ctx.clearRect(0, 0, previewSize, previewSize)
      ctx.fillStyle = '#171717'
      ctx.fillRect(0, 0, previewSize, previewSize)

      ctx.strokeStyle = '#404040'
      ctx.lineWidth = 1
      for (let i = 0; i <= gridWidth; i++) {
        const pos = i * previewCellSizeX + 0.5
        ctx.beginPath()
        ctx.moveTo(pos, 0)
        ctx.lineTo(pos, previewSize)
        ctx.stroke()
      }
      for (let i = 0; i <= gridHeight; i++) {
        const pos = i * previewCellSizeY + 0.5
        ctx.beginPath()
        ctx.moveTo(0, pos)
        ctx.lineTo(previewSize, pos)
        ctx.stroke()
      }

      const compositePixels = Array(gridWidth * gridHeight).fill(null)
      
      currentFrame.layers.forEach((layer) => {
        if (layer.visible && layer.pixels) {
          // Ensure we only process valid indices
          const pixelArray = layer.pixels
          const maxIndex = Math.min(pixelArray.length, gridWidth * gridHeight)
          for (let i = 0; i < maxIndex; i++) {
            if (pixelArray[i]) {
              compositePixels[i] = pixelArray[i]
            }
          }
        }
      })

      compositePixels.forEach((color, index) => {
        if (color && index < gridWidth * gridHeight) {
          const row = Math.floor(index / gridWidth)
          const col = index % gridWidth
          // Use Math.floor to prevent overlap from fractional sizes
          const x = Math.floor(col * previewCellSizeX)
          const y = Math.floor(row * previewCellSizeY)
          const width = col === gridWidth - 1 
            ? previewSize - x
            : Math.floor((col + 1) * previewCellSizeX) - x
          const height = row === gridHeight - 1
            ? previewSize - y
            : Math.floor((row + 1) * previewCellSizeY) - y
          ctx.fillStyle = color
          ctx.fillRect(x, y, width, height)
        }
      })
    }
  }, [frames, currentFrameIndex, gridWidth, gridHeight, previewCellSizeX, previewCellSizeY, previewSize])

  useEffect(() => {
    if (frames.length === 0) return

    const interval = 1000 / fps
    animationRef.current = setInterval(() => {
      setCurrentFrameIndex(prev => (prev + 1) % frames.length)
    }, interval)

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current)
      }
    }
  }, [fps, frames.length])

  if (frames.length === 0) return null

  return (
    <div className="flex flex-col gap-2 pt-2 border-t border-neutral-700">
      <div className="text-sm font-medium text-neutral-300">Preview</div>
      <div className="flex items-center justify-center bg-neutral-900 rounded border border-neutral-700 p-2">
        <canvas
          ref={canvasRef}
          className="border border-neutral-600"
          style={{ 
            imageRendering: 'pixelated'
          }}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-neutral-400">FPS</label>
        <input
          type="range"
          min="1"
          max="30"
          value={fps}
          onChange={(e) => onFpsChange(parseInt(e.target.value))}
          className="flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((fps - 1) / 29) * 100}%, #404040 ${((fps - 1) / 29) * 100}%, #404040 100%)`
          }}
        />
        <span className="text-xs text-neutral-300 font-mono w-8">{fps}</span>
      </div>
    </div>
  )
}

export default function Frames({
  framesEnabled,
  onFramesToggle,
  frames,
  activeFrameIndex,
  onFrameSelect,
  onFrameAdd,
  onFrameDelete,
  onFrameDuplicate,
  onFrameToggleVisibility,
  onFrameReorder,
  fps,
  onFpsChange,
  gridWidth,
  gridHeight
}) {
  const canDelete = frames.length > 1
  const scrollContainerRef = useRef(null)
  const isDraggingRef = useRef(false)
  const dragStartXRef = useRef(0)
  const scrollStartXRef = useRef(0)
  const [frameContextMenu, setFrameContextMenu] = useState({ isOpen: false, x: 0, y: 0, frameIndex: null })

  const handleWheel = useCallback((e) => {
    if (scrollContainerRef.current) {
      e.preventDefault()
      scrollContainerRef.current.scrollLeft += e.deltaY
    }
  }, [])

  const handleMouseDown = useCallback((e) => {
    if (scrollContainerRef.current && e.button === 0) {
      isDraggingRef.current = true
      dragStartXRef.current = e.clientX
      scrollStartXRef.current = scrollContainerRef.current.scrollLeft
      scrollContainerRef.current.style.cursor = 'grabbing'
      scrollContainerRef.current.style.userSelect = 'none'
    }
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (isDraggingRef.current && scrollContainerRef.current) {
      const deltaX = e.clientX - dragStartXRef.current
      scrollContainerRef.current.scrollLeft = scrollStartXRef.current - deltaX
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    if (scrollContainerRef.current) {
      isDraggingRef.current = false
      scrollContainerRef.current.style.cursor = 'grab'
      scrollContainerRef.current.style.userSelect = ''
    }
  }, [])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp])

  const handleFrameClick = useCallback((index, e) => {
    if (!isDraggingRef.current) {
      onFrameSelect(index)
    }
  }, [onFrameSelect])

  const handleFrameContextMenu = useCallback((index, e) => {
    e.preventDefault()
    setFrameContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      frameIndex: index
    })
  }, [])

  const handleContextMenuClose = useCallback(() => {
    setFrameContextMenu({ isOpen: false, x: 0, y: 0, frameIndex: null })
  }, [])

  const handleContextMenuDuplicate = useCallback(() => {
    if (frameContextMenu.frameIndex !== null) {
      onFrameDuplicate(frameContextMenu.frameIndex)
    }
  }, [frameContextMenu.frameIndex, onFrameDuplicate])

  const handleContextMenuDelete = useCallback(() => {
    if (frameContextMenu.frameIndex !== null && canDelete) {
      onFrameDelete(frameContextMenu.frameIndex)
    }
  }, [frameContextMenu.frameIndex, canDelete, onFrameDelete])

  const handleContextMenuMoveUp = useCallback(() => {
    if (frameContextMenu.frameIndex !== null && frameContextMenu.frameIndex > 0) {
      onFrameReorder(frameContextMenu.frameIndex, frameContextMenu.frameIndex - 1)
    }
  }, [frameContextMenu.frameIndex, onFrameReorder])

  const handleContextMenuMoveDown = useCallback(() => {
    if (frameContextMenu.frameIndex !== null && frameContextMenu.frameIndex < frames.length - 1) {
      onFrameReorder(frameContextMenu.frameIndex, frameContextMenu.frameIndex + 1)
    }
  }, [frameContextMenu.frameIndex, frames.length, onFrameReorder])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (frameContextMenu.isOpen) {
        setFrameContextMenu({ isOpen: false, x: 0, y: 0, frameIndex: null })
      }
    }

    if (frameContextMenu.isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => {
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [frameContextMenu.isOpen])

  if (!framesEnabled) return null

  return (
    <div className="bg-neutral-800 border-t border-neutral-700 p-2 flex-shrink-0">
      <div 
        ref={scrollContainerRef}
        className="flex flex-row gap-2 overflow-x-auto cursor-grab"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {frames.map((frame, index) => (
          <div
            key={frame.id}
            className="flex-shrink-0 cursor-pointer"
            onClick={(e) => handleFrameClick(index, e)}
            onContextMenu={(e) => handleFrameContextMenu(index, e)}
            title="Right-click for options"
          >
            <FramePreview 
              layers={frame.layers} 
              visible={true}
              isActive={activeFrameIndex === index}
              gridWidth={gridWidth}
              gridHeight={gridHeight}
            />
          </div>
        ))}
        
        <button
          onClick={onFrameAdd}
          className="flex-shrink-0 w-20 h-20 bg-neutral-700 hover:bg-neutral-600 rounded border border-neutral-600 flex items-center justify-center cursor-pointer"
          title="Add Frame"
        >
          <svg className="w-8 h-8 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      <ContextMenu
        isOpen={frameContextMenu.isOpen}
        position={{ x: frameContextMenu.x, y: frameContextMenu.y }}
        onClose={handleContextMenuClose}
        items={[
          { label: 'Duplicate', onClick: handleContextMenuDuplicate },
          { label: 'Delete', onClick: handleContextMenuDelete, disabled: !canDelete },
          { type: 'separator' },
          { label: 'Move left', onClick: handleContextMenuMoveUp, disabled: frameContextMenu.frameIndex === null || frameContextMenu.frameIndex === 0 },
          { label: 'Move right', onClick: handleContextMenuMoveDown, disabled: frameContextMenu.frameIndex === null || frameContextMenu.frameIndex === frames.length - 1 }
        ]}
      />
    </div>
  )
}

