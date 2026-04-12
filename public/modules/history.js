/**
 * History Module (Undo/Redo)
 * Manages canvas state history for undo/redo functionality
 */

import { canvasRefs, imageState, historyState, dragState, zoomState, resetState, recordingState } from './state.js';
import { compareImageData } from './canvasManager.js';

/**
 * Save current state to undo stack
 * @param {boolean} forceSave - Force save even during drag/zoom
 * @param {string} changedCanvasId - ID of canvas that changed
 */
export function saveState(forceSave = false, changedCanvasId = null) {
  // Skip save during active drag/zoom unless forced
  if ((dragState.isDragging || zoomState.isZooming) && !forceSave) {
    console.log('Skipped saveState during active operation - waiting for forceSave');
    return;
  }

  const canvases = {
    base: { canvas: canvasRefs.baseCanvas, ctx: canvasRefs.baseCtx },
    paint: { canvas: canvasRefs.paintCanvas, ctx: canvasRefs.paintCtx },
    sampler: { canvas: canvasRefs.samplerCanvas, ctx: canvasRefs.samplerCtx }
  };

  const newState = {};
  let hasAnyChanges = false;

  Object.keys(canvases).forEach(key => {
    const { canvas, ctx } = canvases[key];
    const state = zoomState.canvasStates[key];
    
    // Always get unzoomed content from display canvas to ensure we don't save zoomed state
    const tempCtx = ctx;
    tempCtx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to get raw content
    const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
    
    newState[key] = imageData;
    
    // Update currentImageData
    imageState.currentImageData[key] = imageData;
    
    // Ensure offscreen canvas is up to date
    if (!state.offscreenCanvas || state.offscreenCanvas.width !== canvas.width || state.offscreenCanvas.height !== canvas.height) {
      state.offscreenCanvas = document.createElement('canvas');
      state.offscreenCanvas.width = canvas.width;
      state.offscreenCanvas.height = canvas.height;
    }
    const offscreenCtx = state.offscreenCanvas.getContext('2d', { alpha: true });
    offscreenCtx.imageSmoothingEnabled = true;
    offscreenCtx.imageSmoothingQuality = 'high';
    offscreenCtx.clearRect(0, 0, canvas.width, canvas.height);
    offscreenCtx.putImageData(imageData, 0, 0);
    
    // Check if this canvas has changes
    if (forceSave || !historyState.undoStack.length || !compareImageData(historyState.undoStack[historyState.undoStack.length - 1]?.[key], imageData)) {
      hasAnyChanges = true;
    }
  });

  // Only save if there are actual changes or it's forced
  if (forceSave || hasAnyChanges) {
    // Limit stack size and clear redo stack
    if (historyState.undoStack.length >= 50) historyState.undoStack.shift();
    historyState.redoStack = []; // Clear redo stack on new state
    historyState.undoStack.push(newState);

    dragState.hasCanvasChanged = false; // Reset after saving
    
    if (recordingState.isRecording && typeof window.recordMovement === 'function') {
      window.recordMovement('state', { canvasId: changedCanvasId });
    }
    
    console.log('Saved state - Changed canvas:', changedCanvasId, 'Undo stack size:', historyState.undoStack.length, 'Forced:', forceSave);
    
    // Clear reset states when user makes new changes (not during reset operations)
    if (hasAnyChanges && !forceSave) {
      clearResetStates();
    }
    
    // Trim empty states after push
    trimEmptyStates(historyState.undoStack);
  } else {
    console.log('Skipped saveState - No changes detected and not forced');
  }
}

/**
 * Undo last action
 */
export function undo() {
  // Block undo when viewing original state
  const anyOriginalState = ['base', 'paint', 'sampler'].some(id => zoomState.isResetToOriginal[id]);
  if (anyOriginalState) {
    console.log('Undo blocked - currently viewing original state via reset button');
    return;
  }

  if (historyState.undoStack.length > 1) {
    // Capture current (post) state for redo
    const currentState = {
      base: canvasRefs.baseCtx.getImageData(0, 0, canvasRefs.baseCanvas.width, canvasRefs.baseCanvas.height),
      paint: canvasRefs.paintCtx.getImageData(0, 0, canvasRefs.paintCanvas.width, canvasRefs.paintCanvas.height),
      sampler: canvasRefs.samplerCtx.getImageData(0, 0, canvasRefs.samplerCanvas.width, canvasRefs.samplerCanvas.height)
    };
    historyState.redoStack.push(currentState);
    
    // Pop and restore previous state
    const prevState = historyState.undoStack.pop();
    canvasRefs.baseCtx.putImageData(prevState.base, 0, 0);
    canvasRefs.paintCtx.putImageData(prevState.paint, 0, 0);
    canvasRefs.samplerCtx.putImageData(prevState.sampler, 0, 0);
    imageState.currentImageData.base = prevState.base;
    imageState.currentImageData.paint = prevState.paint;
    imageState.currentImageData.sampler = prevState.sampler;
    
    // Clear reset states since we're back to normal undo/redo
    clearResetStates();
    
    console.log('Undo - Reverted to state, Undo stack:', historyState.undoStack.length, 'Redo stack:', historyState.redoStack.length);
  } else {
    console.log('Undo - No previous state available');
  }
}

/**
 * Redo last undone action
 */
export function redo() {
  // Block redo when viewing original state  
  const anyOriginalState = ['base', 'paint', 'sampler'].some(id => zoomState.isResetToOriginal[id]);
  if (anyOriginalState) {
    console.log('Redo blocked - currently viewing original state via reset button');
    return;
  }

  if (historyState.redoStack.length > 0) {
    // Capture current state for undo
    const currentState = {
      base: canvasRefs.baseCtx.getImageData(0, 0, canvasRefs.baseCanvas.width, canvasRefs.baseCanvas.height),
      paint: canvasRefs.paintCtx.getImageData(0, 0, canvasRefs.paintCanvas.width, canvasRefs.paintCanvas.height),
      sampler: canvasRefs.samplerCtx.getImageData(0, 0, canvasRefs.samplerCanvas.width, canvasRefs.samplerCanvas.height)
    };
    historyState.undoStack.push(currentState);
    
    // Pop and restore redo state
    const redoState = historyState.redoStack.pop();
    canvasRefs.baseCtx.putImageData(redoState.base, 0, 0);
    canvasRefs.paintCtx.putImageData(redoState.paint, 0, 0);
    canvasRefs.samplerCtx.putImageData(redoState.sampler, 0, 0);
    imageState.currentImageData.base = redoState.base;
    imageState.currentImageData.paint = redoState.paint;
    imageState.currentImageData.sampler = redoState.sampler;
    
    // Clear reset states since we're back to normal undo/redo
    clearResetStates();
    
    console.log('Redo - Restored state, Undo stack:', historyState.undoStack.length, 'Redo stack:', historyState.redoStack.length);
  } else {
    console.log('Redo - No state available');
  }
}

/**
 * Ensure there's an initial state in the undo stack
 */
export function ensureInitialState() {
  if (historyState.undoStack.length === 0) {
    const initialState = {
      base: canvasRefs.baseCtx.getImageData(0, 0, canvasRefs.baseCanvas.width, canvasRefs.baseCanvas.height),
      paint: canvasRefs.paintCtx.getImageData(0, 0, canvasRefs.paintCanvas.width, canvasRefs.paintCanvas.height),
      sampler: canvasRefs.samplerCtx.getImageData(0, 0, canvasRefs.samplerCanvas.width, canvasRefs.samplerCanvas.height)
    };
    historyState.undoStack.push(initialState);
    console.log('Ensured initial state in undo stack');
  }
}

/**
 * Clear reset states for all canvases
 */
export function clearResetStates() {
  zoomState.isResetToOriginal.base = false;
  zoomState.isResetToOriginal.paint = false;
  zoomState.isResetToOriginal.sampler = false;
  resetState.isInResetMode = false;
  console.log('Reset states cleared');
}

/**
 * Trim empty states from the undo stack
 * @param {Array} stack - The stack to trim
 */
export function trimEmptyStates(stack) {
  let trimmed = 0;
  for (let i = stack.length - 1; i >= 0; i--) {
    const state = stack[i];
    const isEmpty = ['base', 'paint', 'sampler'].every(key => {
      if (!state[key]) return true;
      const data = state[key].data;
      return data.every(v => v === 0);
    });
    
    if (isEmpty) {
      stack.splice(i, 1);
      trimmed++;
    }
  }
  
  if (trimmed > 0) {
    console.log(`Trimmed ${trimmed} empty states from history`);
  }
}

/**
 * Clear all history
 */
export function clearHistory() {
  historyState.undoStack = [];
  historyState.redoStack = [];
  console.log('History cleared');
}

/**
 * Get history stats
 * @returns {Object} - Stats about history state
 */
export function getHistoryStats() {
  return {
    undoCount: historyState.undoStack.length,
    redoCount: historyState.redoStack.length,
    maxUndo: historyState.MAX_UNDO
  };
}

// Expose saveState globally for backward compatibility
if (typeof window !== 'undefined') {
  window.saveState = saveState;
}

