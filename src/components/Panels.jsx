import ColorPicker from './ColorPicker'
import Layers from './Layers'
import { AnimationPreview } from './Frames'

export default function Panels({
  selectedTool,
  currentColor,
  onColorChange,
  brushThickness,
  onBrushThicknessChange,
  brushOpacity,
  onOpacityChange,
  strokeWidth,
  onStrokeWidthChange,
  layers,
  activeLayerIndex,
  onLayerSelect,
  onLayerAdd,
  onLayerDelete,
  onLayerToggleVisibility,
  onLayerReorder,
  framesEnabled,
  onFramesToggle,
  frames,
  frameLayers,
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
  const showBrushSettings = selectedTool === 'pencil' || selectedTool === 'eraser'
  const showStrokeSettings = selectedTool === 'line' || selectedTool === 'rectangle' || selectedTool === 'circle'

  return (
    <div className="w-64 bg-neutral-800 border-l border-neutral-700 p-4 flex flex-col gap-4 h-full overflow-y-auto">
      <ColorPicker currentColor={currentColor} onColorChange={onColorChange} />

      {showBrushSettings && (
        <div className="flex flex-col gap-3 pt-2 border-t border-neutral-700">
          <div className="text-sm font-medium text-neutral-300">Brush Settings</div>
          
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-neutral-400">Thickness</label>
              <span className="text-xs text-neutral-300 font-mono">{brushThickness}</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="1"
                max="10"
                value={brushThickness}
                onChange={(e) => onBrushThicknessChange(parseInt(e.target.value))}
                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((brushThickness - 1) / 9) * 100}%, #404040 ${((brushThickness - 1) / 9) * 100}%, #404040 100%)`
                }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-neutral-400">Opacity</label>
              <span className="text-xs text-neutral-300 font-mono">{brushOpacity}</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="1"
                max="10"
                value={brushOpacity}
                onChange={(e) => onOpacityChange(parseInt(e.target.value))}
                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((brushOpacity - 1) / 9) * 100}%, #404040 ${((brushOpacity - 1) / 9) * 100}%, #404040 100%)`
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showStrokeSettings && (
        <div className="flex flex-col gap-3 pt-2 border-t border-neutral-700">
          <div className="text-sm font-medium text-neutral-300">Stroke Settings</div>
          
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-neutral-400">Width</label>
              <span className="text-xs text-neutral-300 font-mono">{strokeWidth}</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="1"
                max="10"
                value={strokeWidth}
                onChange={(e) => onStrokeWidthChange(parseInt(e.target.value))}
                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((strokeWidth - 1) / 9) * 100}%, #404040 ${((strokeWidth - 1) / 9) * 100}%, #404040 100%)`
                }}
              />
            </div>
          </div>
        </div>
      )}

      <Layers
        layers={layers}
        activeLayerIndex={activeLayerIndex}
        onLayerSelect={onLayerSelect}
        onLayerAdd={onLayerAdd}
        onLayerDelete={onLayerDelete}
        onLayerToggleVisibility={onLayerToggleVisibility}
        onLayerReorder={onLayerReorder}
      />

      <div className="flex flex-col gap-2 pt-2 border-t border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-neutral-300">Frames</div>
            <button
              onClick={onFramesToggle}
              className={`w-10 h-5 rounded-full transition-colors ${
                framesEnabled ? 'bg-blue-600' : 'bg-neutral-600'
              }`}
              title={framesEnabled ? 'Disable frames' : 'Enable frames'}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  framesEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
                style={{ marginTop: '2px' }}
              />
            </button>
          </div>
        </div>

        {framesEnabled && frames.length > 0 && (
          <AnimationPreview
            frames={frames}
            layers={frameLayers}
            fps={fps}
            onFpsChange={onFpsChange}
            gridSize={gridSize}
            cellSize={cellSize}
            canvasSize={canvasSize}
          />
        )}
      </div>

    </div>
  )
}

