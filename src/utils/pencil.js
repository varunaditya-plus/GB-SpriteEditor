export const handlePencilDown = (index, color, setPixel) => {
  if (index !== null && index >= 0) {
    setPixel(index, color)
  }
}

export const handlePencilMove = (index, color, setPixel) => {
  if (index !== null && index >= 0) {
    setPixel(index, color)
  }
}
