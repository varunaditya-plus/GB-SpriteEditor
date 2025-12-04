export const handleEraserDown = (index, setPixel) => {
  if (index !== null && index >= 0) {
    setPixel(index, null)
  }
}

export const handleEraserMove = (index, setPixel) => {
  if (index !== null && index >= 0) {
    setPixel(index, null)
  }
}
