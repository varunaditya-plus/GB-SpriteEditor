export default function ExportModal({ isOpen, onClose, onExport }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 w-96 max-w-[90vw] flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="text-lg font-semibold text-neutral-200">Export Options</div>
        <div className="text-sm text-neutral-400 mb-2">Choose export format:</div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              onExport('png')
              onClose()
            }}
            className="w-full px-4 py-3 bg-neutral-700 hover:bg-neutral-600 rounded text-sm text-neutral-200 transition-colors text-left"
          >
            <div className="font-medium">PNG</div>
            <div className="text-xs text-neutral-400 mt-1">Export as PNG image (frames arranged horizontally)</div>
          </button>
          <button
            onClick={() => {
              onExport('gif')
              onClose()
            }}
            className="w-full px-4 py-3 bg-neutral-700 hover:bg-neutral-600 rounded text-sm text-neutral-200 transition-colors text-left"
          >
            <div className="font-medium">GIF</div>
            <div className="text-xs text-neutral-400 mt-1">Export as animated GIF</div>
          </button>
          <button
            onClick={() => {
              onExport('ch')
              onClose()
            }}
            className="w-full px-4 py-3 bg-neutral-700 hover:bg-neutral-600 rounded text-sm text-neutral-200 transition-colors text-left"
          >
            <div className="font-medium">C/H (ZIP)</div>
            <div className="text-xs text-neutral-400 mt-1">Export as Game Boy C and H files in ZIP</div>
          </button>
          <button
            onClick={() => {
              onExport('json')
              onClose()
            }}
            className="w-full px-4 py-3 bg-neutral-700 hover:bg-neutral-600 rounded text-sm text-neutral-200 transition-colors text-left"
          >
            <div className="font-medium">JSON</div>
            <div className="text-xs text-neutral-400 mt-1">Export project with all settings</div>
          </button>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-sm text-neutral-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

