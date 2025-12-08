import { useRef, useEffect, useState } from 'react'

export default function ContextMenu({ isOpen, position, onClose, items }) {
  const menuRef = useRef(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)

  useEffect(() => {
    if (!isOpen || !menuRef.current) return

    const menu = menuRef.current
    const menuHeight = menu.offsetHeight
    const windowHeight = window.innerHeight
    const spaceBelow = windowHeight - position.y
    const spaceAbove = position.y

    // If menu would go off-screen at the bottom and there's more space above, position it above
    if (menuHeight > spaceBelow && spaceAbove > spaceBelow) {
      setAdjustedPosition({
        x: position.x,
        y: position.y - menuHeight
      })
    } else {
      setAdjustedPosition(position)
    }
  }, [isOpen, position])

  if (!isOpen) return null

  return (
    <div ref={menuRef} className="fixed z-50" style={{ left: `${adjustedPosition.x}px`, top: `${adjustedPosition.y}px` }} onClick={(e) => e.stopPropagation()}>
      <div className="bg-[#141414]/50 backdrop-blur-lg border border-white/20 ring-1 ring-black rounded-md px-1 py-1 text-[#E0E0E0] text-sm flex flex-col w-max min-w-[calc(100%+2rem)] gap-[0.1] cursor-default shadow-[0_0_3rem_#00000070]">
        {items.map((item, index) => {
          if (item.type === 'separator') {
            return <div key={index} className="h-[1px] bg-white/20 my-1 mx-2"></div>
          }
          
          return (
            <button
              key={index}
              onClick={() => {
                if (item.onClick) item.onClick()
                if (onClose) onClose()
              }}
              disabled={item.disabled}
              className="hover:bg-[#1266BF] px-2.5 py-[0.1rem] rounded text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}