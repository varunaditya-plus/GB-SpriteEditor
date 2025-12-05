export const createHistory = (initialState) => {
  return {
    history: [initialState],
    historyIndex: 0,
    isUndoRedoRef: { current: false }
  }
}

export const saveToHistory = (history, historyIndex, newPixels, isUndoRedoRef) => {
  if (isUndoRedoRef.current) return
  
  const newHistory = history.slice(0, historyIndex + 1)
  newHistory.push([...newPixels])
  const limitedHistory = newHistory.length > 50 ? newHistory.slice(-50) : newHistory
  const newIndex = Math.min(historyIndex + 1, 49)
  
  return {
    history: limitedHistory,
    historyIndex: newIndex
  }
}

export const undo = (history, historyIndex, setPixels, isUndoRedoRef) => {
  if (historyIndex > 0) {
    isUndoRedoRef.current = true
    const newIndex = historyIndex - 1
    setPixels([...history[newIndex]])
    setTimeout(() => {
      isUndoRedoRef.current = false
    }, 100)
    return newIndex
  }
  return historyIndex
}

export const redo = (history, historyIndex, setPixels, isUndoRedoRef) => {
  if (historyIndex < history.length - 1) {
    isUndoRedoRef.current = true
    const newIndex = historyIndex + 1
    setPixels([...history[newIndex]])
    setTimeout(() => {
      isUndoRedoRef.current = false
    }, 100)
    return newIndex
  }
  return historyIndex
}

export const canUndo = (historyIndex) => {
  return historyIndex > 0
}

export const canRedo = (history, historyIndex) => {
  return historyIndex < history.length - 1
}

