export const handleColorPickerDown = (index, pixels, onColorChange) => {
  if (index === null || index < 0 || index >= pixels.length) {
    return
  }

  const color = pixels[index]
  
  if (color) {
    onColorChange(color)
  }
}
