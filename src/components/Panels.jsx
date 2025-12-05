import ColorPicker from './ColorPicker'

export default function Panels({
  selectedTool,
  currentColor,
  onColorChange,
  brushThickness,
  onBrushThicknessChange,
  brushOpacity,
  onOpacityChange,
  strokeWidth,
  onStrokeWidthChange
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
    </div>
  )
}

