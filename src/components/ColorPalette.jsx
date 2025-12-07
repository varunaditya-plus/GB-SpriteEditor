import { useMemo } from 'react'

// Helper function to convert hex to RGB for sorting
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

// Helper function to calculate brightness for sorting
const getBrightness = (hex) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
}

// Helper function to extract hue for sorting
const getHue = (hex) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  
  if (delta === 0) return 0
  
  let h = 0
  if (max === r) {
    h = ((g - b) / delta) % 6
  } else if (max === g) {
    h = (b - r) / delta + 2
  } else {
    h = (r - g) / delta + 4
  }
  
  h = h / 6
  if (h < 0) h += 1
  return h
}

export default function ColorPalette({ frames, frameLayers, framesEnabled, currentColor, onColorChange }) {
  // Extract unique colors from all frames
  const uniqueColors = useMemo(() => {
    const colorSet = new Set()
    
    // Determine which frames to check
    const framesToCheck = framesEnabled ? frames : (frames.length > 0 ? [frames[0]] : [])
    
    // Iterate through frames
    framesToCheck.forEach((frame) => {
      if (!frame || !frame.layerPixels) return
      
      // Iterate through layers
      frame.layerPixels.forEach((layerPixels, layerIndex) => {
        // Check if layer is visible
        const layer = frameLayers && frameLayers[layerIndex]
        if (layer && layer.visible === false) return
        
        // Extract colors from this layer
        if (Array.isArray(layerPixels)) {
          layerPixels.forEach((color) => {
            if (color && typeof color === 'string') {
              colorSet.add(color.toUpperCase())
            }
          })
        }
      })
    })
    
    // Convert Set to Array and sort by hue, then brightness
    const colorsArray = Array.from(colorSet)
    colorsArray.sort((a, b) => {
      const hueA = getHue(a)
      const hueB = getHue(b)
      if (Math.abs(hueA - hueB) > 0.01) {
        return hueA - hueB
      }
      return getBrightness(b) - getBrightness(a) // Brightest first within same hue
    })
    
    return colorsArray
  }, [frames, frameLayers, framesEnabled])

  if (uniqueColors.length === 0) {
    return (
      <div className="flex flex-col gap-2 pt-2 border-t border-neutral-700">
        <div className="text-sm font-medium text-neutral-300">Color Palette</div>
        <div className="text-xs text-neutral-500">No colors used yet</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 pt-2 border-t border-neutral-700">
      <div className="text-sm font-medium text-neutral-300">Color Palette</div>
      <div className="grid grid-cols-6 gap-1">
        {uniqueColors.map((color) => {
          const isSelected = currentColor.toUpperCase() === color.toUpperCase()
          return (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-500/50'
                  : 'border-neutral-600 hover:border-neutral-500'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          )
        })}
      </div>
    </div>
  )
}

