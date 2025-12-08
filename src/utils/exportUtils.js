import JSZip from 'jszip'
import GIF from 'gif.js'

// Composite layers into a single pixel array
export const compositeLayers = (layers, gridWidth, gridHeight) => {
  const compositePixels = Array(gridWidth * gridHeight).fill(null)
  const expectedSize = gridWidth * gridHeight
  
  if (!layers || layers.length === 0) {
    return compositePixels
  }
  
  layers.forEach((layer) => {
    if (!layer) return
    
    if (layer.visible && layer.pixels && Array.isArray(layer.pixels)) {
      const pixelArray = layer.pixels
      // Normalize pixel array to expected size
      const normalizedPixels = pixelArray.length === expectedSize 
        ? pixelArray 
        : (() => {
            const normalized = Array(expectedSize).fill(null)
            const copyLength = Math.min(pixelArray.length, expectedSize)
            for (let i = 0; i < copyLength; i++) {
              normalized[i] = pixelArray[i] || null
            }
            return normalized
          })()
      
      for (let i = 0; i < expectedSize; i++) {
        if (normalizedPixels[i]) {
          compositePixels[i] = normalizedPixels[i]
        }
      }
    }
  })
  
  return compositePixels
}

// Auto-crop pixels to the used area
export const autoCropPixels = (pixels, gridWidth, gridHeight) => {
  let minRow = gridHeight
  let maxRow = -1
  let minCol = gridWidth
  let maxCol = -1
  
  // Find bounds of used pixels
  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      const index = row * gridWidth + col
      if (pixels[index]) {
        minRow = Math.min(minRow, row)
        maxRow = Math.max(maxRow, row)
        minCol = Math.min(minCol, col)
        maxCol = Math.max(maxCol, col)
      }
    }
  }
  
  // If no pixels found, return a 1x1 frame (instead of full grid to avoid blank PNGs)
  if (maxRow < minRow || maxCol < minCol) {
    return {
      pixels: [null],
      width: 1,
      height: 1,
      offsetX: 0,
      offsetY: 0
    }
  }
  
  // Extract cropped region
  const width = maxCol - minCol + 1
  const height = maxRow - minRow + 1
  const croppedPixels = Array(width * height).fill(null)
  
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const oldRow = minRow + row
      const oldCol = minCol + col
      const oldIndex = oldRow * gridWidth + oldCol
      const newIndex = row * width + col
      croppedPixels[newIndex] = pixels[oldIndex] || null
    }
  }
  
  return {
    pixels: croppedPixels,
    width,
    height,
    offsetX: minCol,
    offsetY: minRow
  }
}

// Convert hex color to RGB
const hexToRgb = (hex) => {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
    return { r: 0, g: 0, b: 0 }
  }
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return { r: 0, g: 0, b: 0 }
  }
  return { r, g, b }
}

// Pad a frame to match target dimensions
const padFrameToSize = (frame, targetWidth, targetHeight) => {
  if (frame.width === targetWidth && frame.height === targetHeight) {
    return frame
  }
  
  const paddedPixels = Array(targetWidth * targetHeight).fill(null)
  
  // Copy existing pixels to the top-left of the padded frame
  for (let row = 0; row < frame.height; row++) {
    for (let col = 0; col < frame.width; col++) {
      const srcIndex = row * frame.width + col
      const dstIndex = row * targetWidth + col
      if (srcIndex < frame.pixels.length && dstIndex < paddedPixels.length) {
        paddedPixels[dstIndex] = frame.pixels[srcIndex] || null
      }
    }
  }
  
  return {
    pixels: paddedPixels,
    width: targetWidth,
    height: targetHeight,
    offsetX: frame.offsetX,
    offsetY: frame.offsetY
  }
}

// Normalize all frames to the same size (largest frame's dimensions)
const normalizeFramesToLargest = (croppedFrames) => {
  if (croppedFrames.length === 0) return croppedFrames
  
  const maxWidth = Math.max(...croppedFrames.map(frame => frame.width))
  const maxHeight = Math.max(...croppedFrames.map(frame => frame.height))
  
  return croppedFrames.map(frame => padFrameToSize(frame, maxWidth, maxHeight))
}

// Convert pixels to ImageData
const pixelsToImageData = (pixels, width, height) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  const imageData = ctx.createImageData(width, height)
  
  for (let i = 0; i < pixels.length; i++) {
    const color = pixels[i]
    const index = i * 4
    
    if (color) {
      const rgb = hexToRgb(color)
      imageData.data[index] = rgb.r
      imageData.data[index + 1] = rgb.g
      imageData.data[index + 2] = rgb.b
      imageData.data[index + 3] = 255
    } else {
      imageData.data[index] = 0
      imageData.data[index + 1] = 0
      imageData.data[index + 2] = 0
      imageData.data[index + 3] = 0
    }
  }
  
  // Put the ImageData onto the canvas
  ctx.putImageData(imageData, 0, 0)
  
  return { imageData, canvas }
}

// Export as PNG (single frame or multiple frames horizontally)
export const exportPNG = async (frames, gridWidth, gridHeight, framesEnabled) => {
  if (!frames || frames.length === 0) {
    throw new Error('No frames to export')
  }
  
  const framesToExport = framesEnabled ? frames.filter(f => f) : [frames[0]].filter(f => f)
  
  if (framesToExport.length === 0) {
    throw new Error('No valid frames to export')
  }
  
  // Get all cropped frames
  let croppedFrames = framesToExport.map((frame) => {
    // Ensure frame has layers
    if (!frame.layers || !Array.isArray(frame.layers) || frame.layers.length === 0) {
      const emptyPixels = Array(gridWidth * gridHeight).fill(null)
      return autoCropPixels(emptyPixels, gridWidth, gridHeight)
    }
    
    const compositePixels = compositeLayers(frame.layers, gridWidth, gridHeight)
    return autoCropPixels(compositePixels, gridWidth, gridHeight)
  })
  
  // Check if all frames are empty (no pixels)
  const hasAnyPixels = croppedFrames.some(frame => 
    frame.pixels.some(pixel => pixel !== null)
  )
  
  // If no pixels in any frame, use original grid dimensions instead of 1x1
  // This ensures the PNG has valid dimensions and is not a tiny blank file
  if (!hasAnyPixels) {
    croppedFrames = croppedFrames.map(() => ({
      pixels: Array(gridWidth * gridHeight).fill(null),
      width: gridWidth,
      height: gridHeight,
      offsetX: 0,
      offsetY: 0
    }))
  }
  
  // Normalize all frames to the largest frame's dimensions
  croppedFrames = normalizeFramesToLargest(croppedFrames)
  
  // If single frame, export it directly
  if (croppedFrames.length === 1) {
    const { pixels, width, height } = croppedFrames[0]
    const { canvas } = pixelsToImageData(pixels, width, height)
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'sprite.png'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        resolve()
      }, 'image/png')
    })
  }
  
  // Multiple frames: arrange horizontally
  const totalWidth = croppedFrames.reduce((sum, frame) => sum + frame.width, 0)
  const maxHeight = Math.max(...croppedFrames.map(frame => frame.height))
  
  const combinedCanvas = document.createElement('canvas')
  combinedCanvas.width = totalWidth
  combinedCanvas.height = maxHeight
  const combinedCtx = combinedCanvas.getContext('2d')
  
  let xOffset = 0
  for (const frame of croppedFrames) {
    const { pixels, width, height } = frame
    const { imageData } = pixelsToImageData(pixels, width, height)
    combinedCtx.putImageData(imageData, xOffset, 0)
    xOffset += width
  }
  
  return new Promise((resolve) => {
    combinedCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'sprite.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      resolve()
    }, 'image/png')
  })
}

// Export as GIF (animated)
export const exportGIF = async (frames, gridWidth, gridHeight, fps, framesEnabled) => {
  if (!frames || frames.length === 0) {
    throw new Error('No frames to export')
  }
  
  const framesToExport = framesEnabled ? frames : [frames[0]]
  
  // Get all cropped frames
  let croppedFrames = framesToExport.map(frame => {
    const compositePixels = compositeLayers(frame.layers, gridWidth, gridHeight)
    return autoCropPixels(compositePixels, gridWidth, gridHeight)
  })
  
  // Normalize all frames to the largest frame's dimensions
  croppedFrames = normalizeFramesToLargest(croppedFrames)
  
  // All frames now have the same dimensions
  const { width: frameWidth, height: frameHeight } = croppedFrames[0]
  
  // Create GIF writer
  const gif = new GIF({
    workers: 2,
    quality: 10,
    width: frameWidth,
    height: frameHeight,
    workerScript: '/gif.worker.js'
  })
  
  // Add frames to GIF
  for (const frame of croppedFrames) {
    const { pixels } = frame
    const { imageData } = pixelsToImageData(pixels, frameWidth, frameHeight)
    
    // Add frame to GIF
    const delay = Math.round(1000 / fps) // Convert fps to delay in milliseconds
    gif.addFrame(imageData, { delay })
  }
  
  // Render GIF
  return new Promise((resolve, reject) => {
    gif.on('finished', (blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'sprite.gif'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      resolve()
    })
    
    gif.on('error', (error) => {
      reject(error)
    })
    
    gif.render()
  })
}

// Convert hex color to 15-bit RGB
const hexToRgb15 = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return {
    r: Math.min(31, Math.max(0, Math.floor(r / 8))),
    g: Math.min(31, Math.max(0, Math.floor(g / 8))),
    b: Math.min(31, Math.max(0, Math.floor(b / 8)))
  }
}

// Convert 15-bit RGB to Game Boy Color format (16-bit value)
const rgb15ToGameBoy = (r, g, b) => {
  return (b << 10) | (g << 5) | r
}

// Convert 15-bit RGB to hex string for palette
const rgb15ToHex = (r5, g5, b5) => {
  const r8 = (r5 << 3) | (r5 >> 2)
  const g8 = (g5 << 3) | (g5 >> 2)
  const b8 = (b5 << 3) | (b5 >> 2)
  return `#${((1 << 24) | (r8 << 16) | (g8 << 8) | b8).toString(16).slice(1).toUpperCase()}`
}

// Extract unique colors and create palette
const extractPalette = (pixels) => {
  const colorSet = new Set()
  pixels.forEach(color => {
    if (color) {
      colorSet.add(color.toUpperCase())
    }
  })
  
  const colors = Array.from(colorSet)
  const palette = []
  
  colors.forEach(hex => {
    const rgb15 = hexToRgb15(hex)
    palette.push(rgb15)
  })
  
  // Pad palette to 4 colors (Game Boy requirement)
  while (palette.length < 4) {
    palette.push({ r: 0, g: 0, b: 0 })
  }
  
  return palette.slice(0, 4) // Limit to 4 colors
}

// Convert pixels to Game Boy tile data
const pixelsToTileData = (pixels, width, height) => {
  const bytes = []
  
  // Game Boy tiles are 8x8, so we need to process in 8x8 blocks
  const tilesWide = Math.ceil(width / 8)
  const tilesHigh = Math.ceil(height / 8)
  
  for (let tileY = 0; tileY < tilesHigh; tileY++) {
    for (let tileX = 0; tileX < tilesWide; tileX++) {
      // Process 8x8 tile
      for (let py = 0; py < 8; py++) {
        for (let px = 0; px < 8; px++) {
          const x = tileX * 8 + px
          const y = tileY * 8 + py
          
          let gbValue = 0
          if (x < width && y < height) {
            const index = y * width + x
            const color = pixels[index]
            if (color) {
              const rgb15 = hexToRgb15(color)
              gbValue = rgb15ToGameBoy(rgb15.r, rgb15.g, rgb15.b)
            }
          }
          
          // Split 16-bit value into two bytes (little-endian)
          const lowByte = gbValue & 0xFF
          const highByte = (gbValue >> 8) & 0xFF
          bytes.push(lowByte)
          bytes.push(highByte)
        }
      }
    }
  }
  
  return bytes
}

// Generate old format C/H files (single frame, no palette)
const generateOldFormatCH = (pixels, width, height) => {
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
  const tileCount = Math.ceil((width * height) / 64)
  
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

// Export as C/H files in ZIP
export const exportCH = async (frames, gridWidth, gridHeight, framesEnabled) => {
  if (!frames || frames.length === 0) {
    throw new Error('No frames to export')
  }
  
  const framesToExport = framesEnabled ? frames : [frames[0]]
  
  // Use old format if there's only one frame or frames are disabled
  const useOldFormat = !framesEnabled || framesToExport.length === 1
  
  if (useOldFormat) {
    // Old format: single frame, simple tile data
    const frame = framesToExport[0]
    const compositePixels = compositeLayers(frame.layers, gridWidth, gridHeight)
    const cropped = autoCropPixels(compositePixels, gridWidth, gridHeight)
    
    const { c, h } = generateOldFormatCH(cropped.pixels, cropped.width, cropped.height)
    
    // Create ZIP file
    const zip = new JSZip()
    zip.file('sprite.c', c)
    zip.file('sprite.h', h)
    
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'sprite.zip'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    return
  }
  
  // New format: multi-frame with palette
  // Get all cropped frames
  let croppedFrames = framesToExport.map(frame => {
    const compositePixels = compositeLayers(frame.layers, gridWidth, gridHeight)
    return autoCropPixels(compositePixels, gridWidth, gridHeight)
  })
  
  // Normalize all frames to the largest frame's dimensions
  croppedFrames = normalizeFramesToLargest(croppedFrames)
  
  // All frames now have the same dimensions
  const { width, height } = croppedFrames[0]
  
  // Extract palette from all frames
  const allPixels = croppedFrames.flatMap(frame => frame.pixels.filter(p => p !== null))
  const palette = extractPalette(allPixels)
  
  // Convert all frames to tile data
  const allTileData = []
  for (const frame of croppedFrames) {
    const tileData = pixelsToTileData(frame.pixels, frame.width, frame.height)
    allTileData.push(...tileData)
  }
  
  // Calculate tile count per frame (8x8 tiles)
  const tilesWide = Math.ceil(width / 8)
  const tilesHigh = Math.ceil(height / 8)
  const tilesPerFrame = tilesWide * tilesHigh
  const totalTiles = tilesPerFrame * croppedFrames.length
  
  // Generate palette array - convert 15-bit to 8-bit for RGB8 macro
  const paletteArray = palette.map(c => {
    // Convert 15-bit (0-31) to 8-bit (0-255)
    const r8 = (c.r << 3) | (c.r >> 2)
    const g8 = (c.g << 3) | (c.g >> 2)
    const b8 = (c.b << 3) | (c.b >> 2)
    return `RGB8(${r8}, ${g8}, ${b8})`
  })
  
  // Generate .c file
  const cLines = []
  cLines.push('#include <gb/gb.h>')
  cLines.push('')
  cLines.push('#include <gb/cgb.h>')
  cLines.push('#include <stdint.h>')
  cLines.push('')
  cLines.push('const uint16_t sprite_pal[] = {')
  cLines.push('    ' + paletteArray.join(', ') + '')
  cLines.push('};')
  cLines.push('')
  cLines.push('/*')
  cLines.push(' * Multi-frame sprite.')
  cLines.push(' * Tiles are stored frame-by-frame in sequence.')
  cLines.push(` * Per-frame tile offset = frame_index * (${tilesPerFrame})`)
  cLines.push(' */')
  cLines.push('const unsigned char sprite_data[] = {')
  
  // Format bytes in rows of 16 (matching the template format)
  for (let i = 0; i < allTileData.length; i += 16) {
    const chunk = allTileData.slice(i, i + 16)
    const hexChunk = chunk.map(b => `0x${b.toString(16).toUpperCase().padStart(2, '0')}`)
    cLines.push('    ' + hexChunk.join(', ') + (i + 16 < allTileData.length ? ',' : ''))
  }
  
  cLines.push('};')
  cLines.push('')
  cLines.push(`#define SPRITE_TILE_COUNT ${totalTiles}`)
  cLines.push(`#define SPRITE_WIDTH ${width}`)
  cLines.push(`#define SPRITE_HEIGHT ${height}`)
  cLines.push(`#define SPRITE_FRAME_COUNT ${croppedFrames.length}`)
  cLines.push('#define SPRITE_PALETTE_SIZE 4')
  cLines.push('#define SPRITE_CGB_PAL sprite_pal')
  
  // Generate .h file
  const hLines = []
  hLines.push('#ifndef __SPRITE_H__')
  hLines.push('#define __SPRITE_H__')
  hLines.push('')
  hLines.push('#include <gb/gb.h>')
  hLines.push('#include <gb/cgb.h>')
  hLines.push('#include <stdint.h>')
  hLines.push('')
  hLines.push('extern const uint16_t sprite_pal[];')
  hLines.push('extern const unsigned char sprite_data[];')
  hLines.push('')
  hLines.push(`#define SPRITE_TILE_COUNT ${totalTiles}`)
  hLines.push(`#define SPRITE_WIDTH ${width}`)
  hLines.push(`#define SPRITE_HEIGHT ${height}`)
  hLines.push(`#define SPRITE_FRAME_COUNT ${croppedFrames.length}`)
  hLines.push('#define SPRITE_PALETTE_SIZE 4')
  hLines.push('#define SPRITE_CGB_PAL sprite_pal')
  hLines.push('')
  hLines.push('#endif')
  
  // Create ZIP file
  const zip = new JSZip()
  zip.file('sprite.c', cLines.join('\n'))
  zip.file('sprite.h', hLines.join('\n'))
  
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'sprite.zip'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Export project as JSON
export const exportJSON = (projectState) => {
  const exportData = {
    version: '1.0',
    gridWidth: projectState.gridWidth,
    gridHeight: projectState.gridHeight,
    canvasBackgroundColor: projectState.canvasBackgroundColor,
    selectedTool: projectState.selectedTool,
    currentColor: projectState.currentColor,
    brushThickness: projectState.brushThickness,
    brushOpacity: projectState.brushOpacity,
    strokeWidth: projectState.strokeWidth,
    nextLayerId: projectState.nextLayerId,
    framesEnabled: projectState.framesEnabled,
    nextFrameId: projectState.nextFrameId,
    frames: projectState.frames,
    activeFrameIndex: projectState.activeFrameIndex,
    fps: projectState.fps,
    activeLayerIndex: projectState.activeLayerIndex
  }
  
  const jsonString = JSON.stringify(exportData, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'project.json'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

