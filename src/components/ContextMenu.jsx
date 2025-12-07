export default function ContextMenu({ isOpen, position, onClose, onDelete, onSplitToLayer, onCopyToLayer, onSplitToFrame, onCopyToFrame, framesEnabled }) {
  if (!isOpen) return null

  return (
    <div className="fixed z-50" style={{ left: `${position.x}px`, top: `${position.y}px` }} onClick={(e) => e.stopPropagation()}>
      <div className="bg-[#141414]/50 backdrop-blur-lg border border-white/20 ring-1 ring-black rounded-md px-1 py-1 text-[#E0E0E0] text-sm flex flex-col w-max min-w-[calc(100%+2rem)] gap-[0.1] cursor-default shadow-[0_0_3rem_#00000070]">
        <button onClick={() => { onDelete(); onClose() }} className="hover:bg-[#1266BF] px-2.5 py-[0.1rem] rounded text-left">
          Delete selected area
        </button>
        <div className="h-[1px] bg-white/20 my-1 mx-2"></div>
        <button onClick={() => { onSplitToLayer(); onClose() }} className="hover:bg-[#1266BF] px-2.5 py-[0.1rem] rounded text-left">
          Split to another layer
        </button>
        <button onClick={() => { onCopyToLayer(); onClose() }} className="hover:bg-[#1266BF] px-2.5 py-[0.1rem] rounded text-left">
          Copy to another layer
        </button>
        <div className="h-[1px] bg-white/20 my-1 mx-2"></div>
        <button onClick={() => { onSplitToFrame(); onClose() }} disabled={!framesEnabled} className="hover:bg-[#1266BF] px-2.5 py-[0.1rem] rounded text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent">
          Split to another frame
        </button>
        <button onClick={() => { onCopyToFrame(); onClose() }} disabled={!framesEnabled} className="hover:bg-[#1266BF] px-2.5 py-[0.1rem] rounded text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent">
          Copy to another frame
        </button>
      </div>
    </div>
  )
}