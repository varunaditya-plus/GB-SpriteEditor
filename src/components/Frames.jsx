import { useRef, useEffect, useState, useCallback } from 'react'

const GRID_SIZE = 32
const PREVIEW_SIZE = 80
const PREVIEW_CANVAS_SIZE = 128

function FramePreview({ layers, layerPixels, visible, isActive }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cellSize = PREVIEW_SIZE / GRID_SIZE

    ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE)
    
    ctx.fillStyle = '#171717'
    ctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE)

    ctx.fillStyle = '#1f1f1f'
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if ((row + col) % 2 === 0) {
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize)
        }
      }
    }

    const compositePixels = Array(GRID_SIZE * GRID_SIZE).fill(null)
    
    layers.forEach((layer, layerIndex) => {
      if (layer.visible && layerPixels[layerIndex]) {
        layerPixels[layerIndex].forEach((color, index) => {
          if (color) {
            compositePixels[index] = color
          }
        })
      }
    })

    compositePixels.forEach((color, index) => {
      if (color) {
        const row = Math.floor(index / GRID_SIZE)
        const col = index % GRID_SIZE
        const x = col * cellSize
        const y = row * cellSize
        ctx.fillStyle = color
        ctx.fillRect(x, y, cellSize, cellSize)
      }
    })
  }, [layers, layerPixels])

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

export function AnimationPreview({ frames, layers, fps, onFpsChange, gridSize, cellSize, canvasSize }) {
  const canvasRef = useRef(null)
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const animationRef = useRef(null)
  const previewSize = 128
  const previewCellSize = previewSize / gridSize

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
    if (currentFrame) {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.clearRect(0, 0, previewSize, previewSize)
      ctx.fillStyle = '#171717'
      ctx.fillRect(0, 0, previewSize, previewSize)

      ctx.strokeStyle = '#404040'
      ctx.lineWidth = 1
      for (let i = 0; i <= gridSize; i++) {
        const pos = i * previewCellSize + 0.5
        ctx.beginPath()
        ctx.moveTo(pos, 0)
        ctx.lineTo(pos, previewSize)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, pos)
        ctx.lineTo(previewSize, pos)
        ctx.stroke()
      }

      const compositePixels = Array(gridSize * gridSize).fill(null)
      
      layers.forEach((layer, layerIndex) => {
        if (layer.visible && currentFrame.layerPixels[layerIndex]) {
          currentFrame.layerPixels[layerIndex].forEach((color, index) => {
            if (color) {
              compositePixels[index] = color
            }
          })
        }
      })

      compositePixels.forEach((color, index) => {
        if (color) {
          const row = Math.floor(index / gridSize)
          const col = index % gridSize
          const x = col * previewCellSize
          const y = row * previewCellSize
          ctx.fillStyle = color
          ctx.fillRect(x, y, previewCellSize, previewCellSize)
        }
      })
    }
  }, [frames, layers, currentFrameIndex, gridSize, previewCellSize, previewSize])

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
  layers,
  activeFrameIndex,
  onFrameSelect,
  onFrameAdd,
  onFrameDelete,
  onFrameToggleVisibility,
  onFrameReorder,
  fps,
  onFpsChange,
  gridSize,
  cellSize,
  canvasSize
}) {
  const canDelete = frames.length > 1
  const scrollContainerRef = useRef(null)
  const isDraggingRef = useRef(false)
  const dragStartXRef = useRef(0)
  const scrollStartXRef = useRef(0)

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
            onContextMenu={(e) => {
              e.preventDefault()
              if (canDelete) {
                onFrameDelete(index)
              }
            }}
            title={canDelete ? 'Right-click to delete' : 'Cannot delete last frame'}
          >
            <FramePreview 
              layers={layers} 
              layerPixels={frame.layerPixels} 
              visible={true}
              isActive={activeFrameIndex === index}
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
    </div>
  )
}

