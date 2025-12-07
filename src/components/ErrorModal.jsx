export default function ErrorModal({ isOpen, onClose, message }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 w-96 max-w-[90vw] flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="text-lg font-semibold text-red-400">Error</div>
        <div className="text-sm text-neutral-300">{message}</div>
        <div className="flex gap-2 justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

