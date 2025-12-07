// Convert 24-bit RGB to 15-bit RGB (nearest color)
export const rgb24To15Bit = (r, g, b) => {
  return {
    r: Math.min(31, Math.max(0, Math.floor(r / 8))),
    g: Math.min(31, Math.max(0, Math.floor(g / 8))),
    b: Math.min(31, Math.max(0, Math.floor(b / 8)))
  }
}

// Convert 15-bit RGB to hex string
export const rgb15ToHex = (r5, g5, b5) => {
  const r8 = (r5 << 3) | (r5 >> 2)
  const g8 = (g5 << 3) | (g5 >> 2)
  const b8 = (b5 << 3) | (b5 >> 2)
  return `#${((1 << 24) | (r8 << 16) | (g8 << 8) | b8).toString(16).slice(1).toUpperCase()}`
}

// Convert 15-bit RGB to Game Boy Color format (16-bit value)
export const rgb15ToGameBoy = (r, g, b) => {
  return (b << 10) | (g << 5) | r
}

// Load image and convert to pixel array, return dimensions
export const loadImageToPixels = async (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    img.onload = () => {
      const imageWidth = img.width
      const imageHeight = img.height
      
      canvas.width = imageWidth
      canvas.height = imageHeight
      
      ctx.drawImage(img, 0, 0, imageWidth, imageHeight)
      const imageData = ctx.getImageData(0, 0, imageWidth, imageHeight)
      const pixels = Array(imageWidth * imageHeight).fill(null)
      
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i]
        const g = imageData.data[i + 1]
        const b = imageData.data[i + 2]
        const a = imageData.data[i + 3]
        
        if (a > 128) {
          const rgb15 = rgb24To15Bit(r, g, b)
          pixels[i / 4] = rgb15ToHex(rgb15.r, rgb15.g, rgb15.b)
        }
      }
      
      resolve({ pixels, width: imageWidth, height: imageHeight })
    }
    
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

// Load animated GIF frames, return dimensions
export const loadGifFrames = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result
        const uint8Array = new Uint8Array(arrayBuffer)
        
        // Dynamic import of omggif
        const { GifReader } = await import('omggif')
        const gifReader = new GifReader(uint8Array)
        
        const imageWidth = gifReader.width
        const imageHeight = gifReader.height
        const numFrames = gifReader.numFrames()
        
        const frames = []
        
        // Create a canvas to composite frames
        const compositeCanvas = document.createElement('canvas')
        const compositeCtx = compositeCanvas.getContext('2d')
        compositeCanvas.width = imageWidth
        compositeCanvas.height = imageHeight
        
        // Fill with transparent background
        compositeCtx.clearRect(0, 0, imageWidth, imageHeight)
        
        for (let frameIndex = 0; frameIndex < numFrames; frameIndex++) {
          const frameInfo = gifReader.frameInfo(frameIndex)
          const framePixels = new Uint8Array(imageWidth * imageHeight * 4)
          
          // Decode the frame
          gifReader.decodeAndBlitFrameRGBA(frameIndex, framePixels)
          
          // Create ImageData from the frame pixels
          const frameImageData = compositeCtx.createImageData(imageWidth, imageHeight)
          frameImageData.data.set(framePixels)
          
          // Apply disposal method from previous frame before drawing new one
          if (frameIndex > 0) {
            const prevFrameInfo = gifReader.frameInfo(frameIndex - 1)
            if (prevFrameInfo.disposal === 2) {
              // Clear the area where the previous frame was drawn
              compositeCtx.clearRect(prevFrameInfo.x, prevFrameInfo.y, prevFrameInfo.width, prevFrameInfo.height)
            }
          }
          
          // Draw current frame at its position (it will composite with what's already there)
          compositeCtx.putImageData(frameImageData, frameInfo.x, frameInfo.y)
          
          // Get the current composited state
          const currentImageData = compositeCtx.getImageData(0, 0, imageWidth, imageHeight)
          
          // Convert to pixel array
          const pixels = Array(imageWidth * imageHeight).fill(null)
          for (let i = 0; i < currentImageData.data.length; i += 4) {
            const r = currentImageData.data[i]
            const g = currentImageData.data[i + 1]
            const b = currentImageData.data[i + 2]
            const a = currentImageData.data[i + 3]
            
            if (a > 128) {
              const rgb15 = rgb24To15Bit(r, g, b)
              pixels[i / 4] = rgb15ToHex(rgb15.r, rgb15.g, rgb15.b)
            }
          }
          
          frames.push({ pixels, width: imageWidth, height: imageHeight })
        }
        
        resolve(frames)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

// Convert hex color to 15-bit RGB
const hexToRgb15 = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return rgb24To15Bit(r, g, b)
}

// Convert pixels array to C code files
export const pixelsToCCode = (pixels, gridWidth, gridHeight) => {
  const gameBoyBytes = []
  
  for (let i = 0; i < pixels.length; i++) {
    let gbValue = 0
    if (pixels[i]) {
      const rgb15 = hexToRgb15(pixels[i])
      gbValue = rgb15ToGameBoy(rgb15.r, rgb15.g, rgb15.b)
    }
    
    // Split 16-bit value into two bytes (little-endian)
    const lowByte = gbValue & 0xFF
    const highByte = (gbValue >> 8) & 0xFF
    gameBoyBytes.push(`0x${lowByte.toString(16).toUpperCase().padStart(2, '0')}`)
    gameBoyBytes.push(`0x${highByte.toString(16).toUpperCase().padStart(2, '0')}`)
  }
  
  // Calculate tile count (each tile is 8x8, so we need to calculate how many tiles fit)
  const tileCount = Math.ceil((gridWidth * gridHeight) / 64)
  
  // Generate .c file
  const cLines = []
  cLines.push('#include "sprite.h"')
  cLines.push('')
  cLines.push('const unsigned char SpriteTiles[] = {')
  
  for (let i = 0; i < gameBoyBytes.length; i += 16) {
    const chunk = gameBoyBytes.slice(i, i + 16)
    cLines.push('  ' + chunk.join(', ') + (i + 16 < gameBoyBytes.length ? ',' : ''))
  }
  
  cLines.push('};')
  
  // Generate .h file
  const hLines = []
  hLines.push('#ifndef __SPRITE_H__')
  hLines.push('#define __SPRITE_H__')
  hLines.push('')
  hLines.push(`#define SPRITE_TILE_COUNT ${tileCount}`)
  hLines.push('')
  hLines.push('extern const unsigned char SpriteTiles[];')
  hLines.push('')
  hLines.push('#endif')
  
  return {
    c: cLines.join('\n'),
    h: hLines.join('\n')
  }
}

