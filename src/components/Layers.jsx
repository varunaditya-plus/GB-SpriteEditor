import { useRef, useEffect } from 'react'

const PREVIEW_SIZE = 32

function LayerPreview({ pixels, visible, gridWidth, gridHeight }) {
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
          ctx.fillRect(col * cellSizeX, row * cellSizeY, cellSizeX, cellSizeY)
        }
      }
    }

    if (!pixels) return

    pixels.forEach((color, index) => {
      if (color) {
        const row = Math.floor(index / gridWidth)
        const col = index % gridWidth
        const x = col * cellSizeX
        const y = row * cellSizeY
        ctx.fillStyle = color
        ctx.fillRect(x, y, cellSizeX, cellSizeY)
      }
    })
  }, [pixels, gridWidth, gridHeight])

  return (
    <div className="relative flex-shrink-0">
      <canvas
        ref={canvasRef}
        width={PREVIEW_SIZE}
        height={PREVIEW_SIZE}
        className="border border-neutral-600"
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

export default function Layers({
  layers,
  activeLayerIndex,
  onLayerSelect,
  onLayerAdd,
  onLayerDelete,
  onLayerToggleVisibility,
  onLayerReorder,
  gridWidth,
  gridHeight
}) {
  const canDelete = layers.length > 1

  return (
    <div className="flex flex-col gap-2 pt-2 border-t border-neutral-700">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-neutral-300">Layers</div>
        <button
          onClick={onLayerAdd}
          className="px-1 py-0.5 text-xs bg-neutral-700 hover:bg-neutral-600 rounded border border-neutral-600"
          title="Add Layer"
        >
          New Layer
        </button>
      </div>

      <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            className={`flex items-center gap-2 p-1 rounded cursor-pointer ${
              activeLayerIndex === index
                ? 'bg-neutral-700 border border-neutral-600'
                : 'hover:bg-neutral-700/50'
            }`}
            onClick={() => onLayerSelect(index)}
          >
            <div
              onClick={(e) => {
                e.stopPropagation()
                onLayerToggleVisibility(index)
              }}
              className="cursor-pointer"
              title={layer.visible ? 'Hide layer' : 'Show layer'}
            >
              <LayerPreview pixels={layer.pixels} visible={layer.visible} gridWidth={gridWidth} gridHeight={gridHeight} />
            </div>

            <div className="flex-1 text-xs text-neutral-300 truncate">
              {layer.name}
            </div>

            {index > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onLayerReorder(index, index - 1)
                }}
                className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-neutral-400 hover:text-neutral-200"
                title="Move up"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}

            {index < layers.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onLayerReorder(index, index + 1)
                }}
                className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-neutral-400 hover:text-neutral-200"
                title="Move down"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation()
                onLayerDelete(index)
              }}
              disabled={!canDelete}
              className={`flex-shrink-0 w-5 h-5 flex items-center justify-center ${
                canDelete
                  ? 'text-neutral-400 hover:text-red-400'
                  : 'text-neutral-600 cursor-not-allowed'
              }`}
              title={canDelete ? 'Delete layer' : 'Cannot delete last layer'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

