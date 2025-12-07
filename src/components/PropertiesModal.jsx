import { useState, useEffect } from 'react'

export default function PropertiesModal({ isOpen, onClose, gridWidth, gridHeight, onGridSizeChange, canvasBackgroundColor, onCanvasBackgroundColorChange }) {
  const [localGridWidth, setLocalGridWidth] = useState(gridWidth)
  const [localGridHeight, setLocalGridHeight] = useState(gridHeight)
  const [localBackgroundColor, setLocalBackgroundColor] = useState(canvasBackgroundColor)

  useEffect(() => {
    if (isOpen) {
      setLocalGridWidth(gridWidth)
      setLocalGridHeight(gridHeight)
      setLocalBackgroundColor(canvasBackgroundColor)
    }
  }, [isOpen, gridWidth, gridHeight, canvasBackgroundColor])

  if (!isOpen) return null

  const handleSave = () => {
    if (localGridWidth < 1 || localGridWidth > 256) {
      alert('Width must be between 1 and 256 pixels')
      return
    }
    if (localGridHeight < 1 || localGridHeight > 256) {
      alert('Height must be between 1 and 256 pixels')
      return
    }
    onGridSizeChange(localGridWidth, localGridHeight)
    onCanvasBackgroundColorChange(localBackgroundColor)
    onClose()
  }

  const handleCancel = () => {
    setLocalGridWidth(gridWidth)
    setLocalGridHeight(gridHeight)
    setLocalBackgroundColor(canvasBackgroundColor)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 w-96 max-w-[90vw] flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="text-lg font-semibold text-neutral-200">Properties</div>
        
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-300">Canvas Dimensions</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="256"
                value={localGridWidth}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1
                  if (value > 256) {
                    setLocalGridWidth(256)
                  } else if (value < 1) {
                    setLocalGridWidth(1)
                  } else {
                    setLocalGridWidth(value)
                  }
                }}
                className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-neutral-200 text-sm focus:outline-none focus:border-blue-500"
                placeholder="Width"
              />
              <span className="text-sm text-neutral-400">×</span>
              <input
                type="number"
                min="1"
                max="256"
                value={localGridHeight}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1
                  if (value > 256) {
                    setLocalGridHeight(256)
                  } else if (value < 1) {
                    setLocalGridHeight(1)
                  } else {
                    setLocalGridHeight(value)
                  }
                }}
                className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-neutral-200 text-sm focus:outline-none focus:border-blue-500"
                placeholder="Height"
              />
            </div>
            <div className="text-xs text-neutral-500">Grid dimensions (1-256 pixels each)</div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-300">Canvas Background Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={localBackgroundColor}
                onChange={(e) => setLocalBackgroundColor(e.target.value)}
                className="w-12 h-10 bg-neutral-700 border border-neutral-600 rounded cursor-pointer"
              />
              <input
                type="text"
                value={localBackgroundColor}
                onChange={(e) => setLocalBackgroundColor(e.target.value)}
                className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-neutral-200 text-sm font-mono focus:outline-none focus:border-blue-500"
                placeholder="#000000"
              />
            </div>
            <div className="text-xs text-neutral-500">Background color (for display only)</div>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-neutral-700">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-sm text-neutral-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

