import { useState, useEffect, useMemo } from 'react'

// Convert 15-bit RGB (0-31) to 24-bit hex
const toHex = (r5, g5, b5) => {
  const r8 = (r5 << 3) | (r5 >> 2)
  const g8 = (g5 << 3) | (g5 >> 2)
  const b8 = (b5 << 3) | (b5 >> 2)
  return `#${((1 << 24) | (r8 << 16) | (g8 << 8) | b8).toString(16).slice(1).toUpperCase()}`
}

// Convert 24-bit hex to 15-bit RGB
const fromHex = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return {
    r: Math.min(31, Math.floor(r / 8)),
    g: Math.min(31, Math.floor(g / 8)),
    b: Math.min(31, Math.floor(b / 8))
  }
}

// Convert HSV to RGB (all values 0-1)
const hsvToRgb = (h, s, v) => {
  const c = v * s
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
  const m = v - c
  
  let r, g, b
  if (h < 1/6) {
    r = c; g = x; b = 0
  } else if (h < 2/6) {
    r = x; g = c; b = 0
  } else if (h < 3/6) {
    r = 0; g = c; b = x
  } else if (h < 4/6) {
    r = 0; g = x; b = c
  } else if (h < 5/6) {
    r = x; g = 0; b = c
  } else {
    r = c; g = 0; b = x
  }
  
  return {
    r: Math.round((r + m) * 31),
    g: Math.round((g + m) * 31),
    b: Math.round((b + m) * 31)
  }
}

// Convert RGB to HSV (RGB 0-31, HSV 0-1)
const rgbToHsv = (r, g, b) => {
  const rNorm = r / 31
  const gNorm = g / 31
  const bNorm = b / 31
  
  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const delta = max - min
  
  let h = 0
  if (delta !== 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta) % 6
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / delta + 2
    } else {
      h = (rNorm - gNorm) / delta + 4
    }
    h = h / 6
    if (h < 0) h += 1
  }
  
  const s = max === 0 ? 0 : delta / max
  const v = max
  
  return { h, s, v }
}

// Quantize RGB to 15-bit (0-31 per channel)
const quantize15Bit = (r, g, b) => {
  return {
    r: Math.min(31, Math.max(0, Math.round(r))),
    g: Math.min(31, Math.max(0, Math.round(g))),
    b: Math.min(31, Math.max(0, Math.round(b)))
  }
}

// Convert 15-bit RGB to Game Boy format (4-digit hex)
const toGameBoyFormat = (r, g, b) => {
  // Game Boy format: (Blue << 10) | (Green << 5) | Red
  const value = (b << 10) | (g << 5) | r
  return value.toString(16).toUpperCase().padStart(4, '0')
}

export default function ColorPicker({ currentColor, onColorChange }) {
  // Initialize RGB values from currentColor
  const [rgb15, setRgb15] = useState(() => {
    if (currentColor) {
      return fromHex(currentColor)
    }
    return { r: 31, g: 31, b: 31 }
  })

  // Get HSV from current RGB
  const hsv = useMemo(() => rgbToHsv(rgb15.r, rgb15.g, rgb15.b), [rgb15.r, rgb15.g, rgb15.b])
  const [hue, setHue] = useState(hsv.h)

  // Update RGB when currentColor prop changes externally
  useEffect(() => {
    if (currentColor) {
      const newRgb = fromHex(currentColor)
      const currentHex = toHex(rgb15.r, rgb15.g, rgb15.b)
      // Only update if the hex values are different to avoid unnecessary re-renders
      if (currentColor.toUpperCase() !== currentHex) {
        setRgb15(newRgb)
        const newHsv = rgbToHsv(newRgb.r, newRgb.g, newRgb.b)
        setHue(newHsv.h)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentColor])

  // Update hue when RGB changes externally
  useEffect(() => {
    const newHsv = rgbToHsv(rgb15.r, rgb15.g, rgb15.b)
    setHue(newHsv.h)
  }, [rgb15.r, rgb15.g, rgb15.b])

  // Generate 2D color grid (32x32 for better granularity)
  const colorGrid = useMemo(() => {
    const grid = []
    const gridSize = 32
    
    for (let row = 0; row < gridSize; row++) {
      const rowColors = []
      for (let col = 0; col < gridSize; col++) {
        // X axis: saturation (0 = desaturated, 1 = fully saturated)
        const saturation = col / (gridSize - 1)
        // Y axis: value/brightness (0 = black at bottom, 1 = white/light at top)
        const value = 1 - (row / (gridSize - 1))
        
        // Convert HSV to RGB
        const rgb = hsvToRgb(hue, saturation, value)
        // Quantize to 15-bit
        const rgb15 = quantize15Bit(rgb.r, rgb.g, rgb.b)
        
        rowColors.push({
          ...rgb15,
          hex: toHex(rgb15.r, rgb15.g, rgb15.b)
        })
      }
      grid.push(rowColors)
    }
    return grid
  }, [hue])

  const handleGridClick = (color) => {
    setRgb15({ r: color.r, g: color.g, b: color.b })
    onColorChange(color.hex)
  }

  const handleGridMouseDown = (e) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const gridSize = 32
    
    const getColorFromPosition = (clientX, clientY) => {
      const x = clientX - rect.left
      const y = clientY - rect.top
      
      // Calculate grid cell indices
      const col = Math.floor((x / rect.width) * gridSize)
      const row = Math.floor((y / rect.height) * gridSize)
      
      // Clamp to valid range
      const clampedCol = Math.max(0, Math.min(gridSize - 1, col))
      const clampedRow = Math.max(0, Math.min(gridSize - 1, row))
      
      return colorGrid[clampedRow][clampedCol]
    }

    // Handle initial click
    const initialColor = getColorFromPosition(e.clientX, e.clientY)
    handleGridClick(initialColor)

    const handleMouseMove = (moveEvent) => {
      const color = getColorFromPosition(moveEvent.clientX, moveEvent.clientY)
      handleGridClick(color)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleHueChange = (newHue) => {
    setHue(newHue)
    // Update RGB based on new hue, keeping current saturation and value
    const currentHsv = rgbToHsv(rgb15.r, rgb15.g, rgb15.b)
    const newRgb = hsvToRgb(newHue, currentHsv.s, currentHsv.v)
    const rgb15New = quantize15Bit(newRgb.r, newRgb.g, newRgb.b)
    setRgb15(rgb15New)
    onColorChange(toHex(rgb15New.r, rgb15New.g, rgb15New.b))
  }

  const handleHueSliderMouseDown = (e) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const newHue = Math.max(0, Math.min(1, y / rect.height))
    handleHueChange(newHue)

    const handleMouseMove = (moveEvent) => {
      const newY = moveEvent.clientY - rect.top
      const newHueValue = Math.max(0, Math.min(1, newY / rect.height))
      handleHueChange(newHueValue)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const currentHex = toHex(rgb15.r, rgb15.g, rgb15.b)

  return (
    <>   
      {/* Color Preview */}
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded flex-shrink-0"
          style={{ backgroundColor: currentHex }}
        />
        <div className="text-sm text-neutral-400 font-mono flex gap-2">
          <span>{currentHex}</span>
          <span className="text-neutral-500">{toGameBoyFormat(rgb15.r, rgb15.g, rgb15.b)}</span>
        </div>
      </div>

      {/* Color Grid */}
      <div className="flex gap-0">
        <div className="relative border border-neutral-700 border-r-0 rounded-l overflow-hidden flex-1" style={{ aspectRatio: '1' }}>
          <div
            className="grid gap-0 w-full h-full"
            style={{ gridTemplateColumns: 'repeat(32, 1fr)', gridTemplateRows: 'repeat(32, 1fr)' }}
            onMouseDown={handleGridMouseDown}
          >
            {colorGrid.map((row, rowIndex) =>
              row.map((color, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleGridClick(color)}
                  className="border-0 p-0 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{backgroundColor: color.hex}}
                  title={color.hex}
                />
              ))
            )}
          </div>
        </div>
        {/* Hue Slider */}
        <div 
          className="relative border border-neutral-700 rounded-r overflow-visible w-5 flex-shrink-0 cursor-pointer" 
          style={{ aspectRatio: '1' }}
          onMouseDown={handleHueSliderMouseDown}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{background: `linear-gradient(to bottom, #FF0000 0%, #FFFF00 16.67%, #00FF00 33.33%, #00FFFF 50%, #0000FF 66.67%, #FF00FF 83.33%, #FF0000 100%)`}}
          />
          {/* Caret */}
          <div
            className="absolute pointer-events-none z-20"
            style={{ top: `${hue * 100}%`, right: '-8px', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderRight: '5px solid #ffffff', filter: 'drop-shadow(0 0 1px rgba(0, 0, 0, 0.5))' }}
          />
        </div>
      </div>
    </>
  )
}

