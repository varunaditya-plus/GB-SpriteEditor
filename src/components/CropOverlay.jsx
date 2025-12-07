export default function CropOverlay({ 
  cropSelection, 
  canvasRef, 
  canvasDisplaySize, 
  gridWidth, 
  gridHeight,
  onSave,
  onCancel,
  isDrawing
}) {
  if (!cropSelection) return null

  const cellSizeX = canvasDisplaySize.width / gridWidth
  const cellSizeY = canvasDisplaySize.height / gridHeight

  const x = cropSelection.minCol * cellSizeX
  const y = cropSelection.minRow * cellSizeY
  const width = cropSelection.width * cellSizeX
  const height = cropSelection.height * cellSizeY

  const canvasRect = canvasRef.current?.getBoundingClientRect()
  if (!canvasRect) return null

  return (
    <>
      <div
        className="fixed z-50 flex gap-2"
        style={{
          left: `${canvasRect.left + x + width / 2 - 80}px`,
          top: `${canvasRect.top + y + height + 10}px`,
          pointerEvents: isDrawing ? 'none' : 'auto'
        }}
      >
        <button onClick={onSave} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium shadow-lg">
          Save Crop
        </button>
        <button onClick={onCancel} className="px-4 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md font-medium shadow-lg">
          Cancel
        </button>
      </div>
    </>
  )
}

