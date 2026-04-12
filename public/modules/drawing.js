/**
 * Drawing and Smearing Tools Module
 * Handles all drawing operations, brush tools, and pixel smearing
 * Complete implementations extracted from editor.js
 */

import {
  brushState,
  dragState,
  canvasRefs,
  imageState,
  zoomState,
  selectionState,
  sweeperState,
  inputState,
  teleportState,
  recordingState,
  effectStates,
  animationState,
  activeEffects,
  rotationState,
  flipState,
  stickerImages,
  originalDimensions,
  recordingState as recState
} from './state.js';

import { applyEffects, toggleEffect, isPixelInBrushShape as effectsIsPixelInBrushShape } from './effects.js';
import { saveState } from './history.js';
import { getCanvasCoordinates } from './canvasManager.js';
import { effectMap, keyLabels, getKeyboardContainer } from './constants.js';
import { rgbToHsl, hslToRgb } from './utils.js';
import { redrawCanvas, clampView } from './zoom.js';
import { renderMarchingAnts, syncSelectionCanvasPosition, captureSelection, isPointInSelection, calculatePolygonBounds } from './selection.js';

// Global handlers for recording (these may need to be imported or defined elsewhere)
// For now, we'll assume they're available via window or need to be imported
let recordMovement, startMovementRecording, playPianoEffect;

// Initialize global handlers if available
if (typeof window !== 'undefined') {
  recordMovement = window.recordMovement || (() => {});
  startMovementRecording = window.startMovementRecording || (() => {});
  playPianoEffect = window.playPianoEffect || (() => {});
}

// Helper to access state variables
const getStateValue = (path) => {
  const parts = path.split('.');
  let value = window;
  for (const part of parts) {
    value = value?.[part];
    if (value === undefined) break;
  }
  return value;
};

// Helper functions to access state (use these instead of direct aliases for mutation)
// For reading, we can use direct references. For mutation, always use state objects.

// Canvas references - these are direct references to objects, safe to use
const { baseCanvas, baseCtx, paintCanvas, paintCtx, samplerCanvas, samplerCtx } = canvasRefs;

// Selection canvas elements (module-level variables)
let selectionCanvas = null;
let selectionCtx = null;
let selectionCacheCanvas = null;
let selectionCacheCtx = null;

// Get keyboard container
const keyboardContainer = getKeyboardContainer();

// Helper function to get effect state value
function getEffectState(effectName) {
  const effectMap = {
    'lock': effectStates.isLockHeld,
    'hyphen': effectStates.isHyphenHeld,
    'brighten': effectStates.isBrightenHeld,
    'darken': effectStates.isDarkenHeld,
    'neon': effectStates.isNeonHeld,
    'original': effectStates.isOriginalHeld,
    'emoji': effectStates.isEmojiHeld,
    'trash': effectStates.isTrashHeld,
    'flag': effectStates.isFlagHeld,
    'chromaticShift': effectStates.isChromaticShiftHeld,
    'teleport': effectStates.isTeleportHeld,
    'caustics': effectStates.isCausticsHeld,
    'fractalStretch': effectStates.isFractalStretchHeld,
    'neonBend': effectStates.isNeonBendHeld,
    'glitchTide': effectStates.isGlitchTideHeld,
    'binaryRain': effectStates.isBinaryRainHeld,
    'photoCRT': effectStates.isPhotoCRTHeld,
    'pointBreak': effectStates.isPointBreakHeld,
    'scatter': effectStates.isScatterHeld,
    'ditherVibe': effectStates.isDitherVibeHeld,
    'flickerNegative': effectStates.isFlickerNegativeHeld
  };
  return effectMap[effectName] || false;
}

/**
 * Update brush size
 * @param {number} value - New brush size
 */
export function updateBrushSize(value) {
  let newSize = Math.max(1, Math.min(700, parseInt(value)));
  brushState.brushSize = newSize;
  brushState.baseBrushSize = newSize;
  if (document.getElementById('brushSizeSlider')) {
    document.getElementById('brushSizeSlider').value = newSize;
  }
  if (document.getElementById('sizeValue')) {
    document.getElementById('sizeValue').textContent = newSize;
  }
  if (isRecording && currentMovement) {
    if (recordMovement) {
      recordMovement('size', { size: newSize });
    }
  }
  console.log(`Brush size updated to: ${newSize}`);
}

/**
 * Check if pixel is within brush shape
 * This version is used by drawing functions
 */
export function isPixelInBrushShape(px, py, centerX, centerY, halfBrush) {
  // Adjust for rotation
  const relX = px - centerX;
  const relY = py - centerY;
  const cosRot = Math.cos(-brushState.brushRotation); // Inverse rotation
  const sinRot = Math.sin(-brushState.brushRotation);
  let adjX = relX * cosRot - relY * sinRot;
  let adjY = relX * sinRot + relY * cosRot;

  // Apply flipping
  if (flipState.isFlipVerticalActive) {
    adjY = -adjY;
  }
  if (flipState.isFlipHorizontalActive) {
    adjX = -adjX;
  }

  const dx = Math.abs(adjX);
  const dy = Math.abs(adjY);

  if (brushState.brushShape === 'box') return dx <= halfBrush && dy <= halfBrush;
  if (brushState.brushShape === 'circle') return Math.sqrt(dx * dx + dy * dy) <= halfBrush;
  if (brushState.brushShape === 'rectangle') return dx <= halfBrush * 1.5 && dy <= halfBrush * 0.5;
  if (brushState.brushShape === 'triangle') {
    const height = halfBrush * 1.414;
    const slope = height / halfBrush;
    return dy <= height / 2 && dy >= -height / 2 && dx <= (height / 2 - Math.abs(dy)) / slope;
  }
  if (brushState.brushShape === 'melt') return dx <= halfBrush && dy <= halfBrush;
  if (brushState.brushShape === 'tv') return dx <= halfBrush && dy <= halfBrush;
  if (brushState.brushShape === 'negative') return dx <= halfBrush && dy <= halfBrush;
  if (brushState.brushShape === 'brokenScreen') return dx <= halfBrush && dy <= halfBrush;
  if (brushState.brushShape === 'jazzScatter') return dx <= halfBrush && dy <= halfBrush;
  return false; // Sweeper and oilbarrel handled separately
}

/**
 * Apply scatter effect by drawing multiple smaller copies
 */
export function applyScatterEffect(currentX, currentY, lastX, lastY, canvasId, ctx) {
  if (!isScatterHeld) return;

  const copyCount = Math.floor(8 + Math.random() * 5); // 8-12 copies
  const scatterRadius = brushState.brushSize * 0.75; // 1.5x radius for spread
  const originalBrushSize = brushState.brushSize;
  const originalRotation = brushState.brushRotation;
  const halfBrush = originalBrushSize / 2;

  // Use the main brush's position as the source for scattered copies
  const sourceX = currentX;
  const sourceY = currentY;

  for (let i = 0; i < copyCount; i++) {
    // Random size (5%-30% of original)
    const scale = 0.05 + Math.random() * 0.25;
    brushState.brushSize = Math.max(3, originalBrushSize * scale); // Minimum 3px for visibility
    // Position around brush, outside boundaries
    const minDistance = halfBrush + brushState.brushSize / 2; // Start outside original brush
    const distance = minDistance + Math.random() * scatterRadius;
    const offsetAngle = Math.random() * 2 * Math.PI; // Full 360° spread
    const scatterX = currentX + Math.cos(offsetAngle) * distance;
    const scatterY = currentY + Math.sin(offsetAngle) * distance;
    // Slight random rotation
    brushState.brushRotation = originalRotation + (Math.random() - 0.5) * 0.5;

    // Draw scatter point if within canvas and outside original brush
    if (scatterX >= 0 && scatterX < ctx.canvas.width && scatterY >= 0 && scatterY < ctx.canvas.height &&
        !isPixelInBrushShape(scatterX, scatterY, currentX, currentY, halfBrush)) {
      // Temporarily disable scatter to prevent recursion
      const wasScatterHeld = isScatterHeld;
      effectStates.isScatterHeld = false;
      smearPixels(scatterX, scatterY, canvasId, sourceX, sourceY, undefined, ctx.canvas);
      effectStates.isScatterHeld = wasScatterHeld;
    }
  }

  // Restore original state
  brushState.brushSize = originalBrushSize;
  brushState.brushRotation = originalRotation;
  console.log(`Scatter applied - Copies: ${copyCount}, Radius: ${scatterRadius}`);
}

/**
 * Continue drag outside canvas (for mouse events)
 */
export function continueDragOutsideCanvas(e) {
  if (dragState.isDragging && e.buttons === 1 && touchPoints.length > 0) {
    const targetCanvas = touchPoints[0].target;
    const fakeEvent = {
      clientX: e.clientX,
      clientY: e.clientY,
      target: targetCanvas,
      type: 'mousemove',
      preventDefault: function() {},
      touches: null
    };
    drag(fakeEvent);
  }
}

/**
 * End drag outside canvas (for mouse events)
 */
export function endDragOutsideCanvas(e) {
  if (dragState.isDragging) {
    document.removeEventListener('mousemove', continueDragOutsideCanvas);
    document.removeEventListener('mouseup', endDragOutsideCanvas);
    const targetCanvas = touchPoints.length > 0 ? touchPoints[0].target : baseCanvas;
    const fakeEvent = {
      clientX: e.clientX,
      clientY: e.clientY,
      target: targetCanvas,
      type: 'mouseup',
      preventDefault: function() {},
      touches: []
    };
    endDrag(fakeEvent);
  }
}




// Large drawing functions with state references updated




/**
 * startDrag
 */
export function startDrag(e) {
console.log('=== STARTDRAG FULL STATE ===', {
    isZooming: zoomState.isZooming,
    isSelectionActive: selectionState.isSelectionActive,
    isSelecting: selectionState.isSelecting,
    isDraggingSelection: selectionState.isDraggingSelection,
    brushShape: brushState.brushShape,
    selectionStart: !!selectionState.selectionStart,
    selectionEnd: !!selectionState.selectionEnd,
    targetCanvas: e.target?.id
});
console.log('=== STARTDRAG DEBUG ===');
console.log('isZooming: ', zoomState.isZooming);
console.log('brushShape: ', brushState.brushShape);
console.log('event type:', e.type);
console.log('target:', e.target?.id || e.target?.tagName);

// Add this debug block:
const debugCanvas = e.target === baseCanvas ? 'base' : 
                   e.target === paintCanvas ? 'paint' : 
                   e.target === samplerCanvas ? 'sampler' : 'unknown';
if (debugCanvas !== 'unknown') {
    const state = zoomState.canvasStates[debugCanvas];
    console.log(`🔍 startDrag DEBUG: canvas=${debugCanvas}, zoom=${state.zoomLevel}, pan=(${state.panX},${state.panY}), targetLocked=${state.targetLocked}, zoomState.isZooming=${zoomState.isZooming}`);
}
console.log('startDrag called, isZooming: ', zoomState.isZooming, 'event type:', e.type, 'target:', e.target && e.target.id);

const targetCanvas = e.target === baseCanvas ? baseCanvas :
                    e.target === paintCanvas ? paintCanvas :
                    e.target === samplerCanvas ? samplerCanvas : null;

// Skip if target is a button, within leftControls, or not a canvas
if (!targetCanvas || e.target.closest('#leftControls') || e.target.classList.contains('brush-icon') || e.target.closest('.control-icon')) {
    console.log('startDrag: Skipped due to button, leftControls, or non-canvas target', e.target);
    return;
}

console.log(`startDrag: Target=${targetCanvas.id}, brushState.brushShape=${brushState.brushShape}, selectionState.isSelecting=${selectionState.isSelecting}`);

e.preventDefault();
const touches = e.touches || (e.type === 'mousedown' ? [e] : []);
console.log('Start drag - Event type:', e.type, 'Touches:', touches.length);

// Filter touches to only those targeting canvases
const validTouches = Array.from(touches).filter(touch => 
    touch.target === baseCanvas || touch.target === paintCanvas || touch.target === samplerCanvas
);

if (validTouches.length === 0) {
    console.log('startDrag skipped - No valid canvas touches:', { targets: touches.map(t => t.target?.tagName || 'unknown') });
    return;
}

const canvasId = targetCanvas === baseCanvas ? 'base' : targetCanvas === paintCanvas ? 'paint' : 'sampler';
const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : canvasId === 'sampler' ? samplerCtx : null;
const state = zoomState.canvasStates[canvasId];

if (!zoomState.isZooming && state.targetLocked) {
console.log(`Clearing stuck targetLocked for ${canvasId} - was ${state.targetLocked}`);
state.targetLocked = false;
// Don't clear zoom pivot if canvas is still zoomed
if (state.zoomLevel === 1) {
    state.zoomPivotX = 0;
    state.zoomPivotY = 0;
}
}

if (!ctx) {
    console.error('No context for canvas:', canvasId);
    return;
}

// Ensure mouse-toggled effects are applied for touch drags
const isTouchEvent = !!e.touches;
const isMouseEvent = !isTouchEvent && e.type === 'mousedown';
if (isTouchEvent && activeEffects.size > 0) {
    activeEffects.forEach(key => {
        const effect = Object.keys(effectMap).find(e => effectMap[e].key.toLowerCase() === key);
        if (effect) {
            const effectName = effect.charAt(0).toUpperCase() + effect.slice(1);
            const isEffectActive = getEffectState(effectName.toLowerCase());
            if (!isEffectActive) {
                toggleEffect(effect, true);
                console.log(`Applied mouse-toggled effect ${effect} for touch drag`);
            }
        }
    });
}

// Prevent default behaviors
const canvasContainer = document.getElementById('canvasContainer');
canvasContainer.style.touchAction = 'none';
document.body.style.touchAction = 'none';

// Reset rotation unless arrow keys or multi-finger gesture
const isStickerMode = brushState.brushShape === 'stickerMode';
const minTouchPoints = isStickerMode ? 3 : 4;
if (!rotationState.isRotatingLeft && !rotationState.isRotatingRight && validTouches.length < minTouchPoints) {
    brushState.brushRotation = 0;
    rotationState.isIntentionalRotation = false;
    console.log(`startDrag - Reset brushState.brushRotation to ${brushState.brushRotation}`);
}

// Initialize recording
if (recordingState.isRecording && !dragState.isDragging) {
    startMovementRecording();
    recordingState.currentMovement.activeEffects = [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e);
    console.log('Started recording new drag movement:', {
        shape: recordingState.currentMovement.shape,
        size: recordingState.currentMovement.size,
        rotation: recordingState.currentMovement.rotation,
        cloneSize: recordingState.currentMovement.cloneSize,
        cloneRotation: recordingState.currentMovement.cloneRotation,
        flipHorizontal: recordingState.currentMovement.flipHorizontal,
        flipVertical: recordingState.currentMovement.flipVertical,
        stickerSlot: recordingState.currentMovement.stickerSlot,
        targetCanvas: canvasId,
        activeEffects: recordingState.currentMovement.activeEffects,
        totalMovements: recordingState.recordedMovements.length
    });
}

const keyboardRect = keyboardContainer.getBoundingClientRect();

// NEW: Always check if canvas is zoomed, not just if zoom tool is active
const isCanvasZoomed = state.zoomLevel !== 1;

// CRITICAL FIX: Force hide selection canvas when trying to zoom
if (zoomState.isZooming && selectionCanvas) {
selectionCanvas.style.display = 'none';
selectionCanvas.style.pointerEvents = 'none';
selectionCanvas.style.zIndex = '-1'; // Force it behind everything
console.log('Force hiding selection canvas for zoom');
}

// Handle zoom tool mode (when actively zooming)
if (zoomState.isZooming) {
    console.log('Zoom tool active in startDrag for', canvasId);
    if (validTouches.length > 1) { 
        zoomState.isZooming = false; 
        zoomBtn.classList.remove('active'); 
    }

    let canvasTouch = validTouches[0];
    if (canvasTouch.target.id === 'zoomBtn' && validTouches.length > 1) {
        canvasTouch = validTouches[1];
    }
    if (!canvasTouch || canvasTouch.target !== targetCanvas) {
        console.log('Zoom target lock skipped - No canvas touch');
        if (validTouches.length > 1) {
            setTimeout(() => {
                console.log('Retrying canvas touch detection after 50ms');
                startDrag(e);
            }, 50);
        }
        return;
    }

    const coords = getCanvasCoordinates(e, canvasTouch);
    if (isNaN(coords.x) || isNaN(coords.y) || (coords.x === 0 && coords.y === 0)) {
        console.warn('Invalid or (0,0) zoom target coords:', coords);
        return;
    }

    state.targetLocked = true;
    console.log('targetLocked set to TRUE for', canvasId, 'pivot:', state.zoomPivotX, state.zoomPivotY);

    state.targetX = coords.x;
    state.targetY = coords.y;
    state.zoomPivotX = coords.x;
    state.zoomPivotY = coords.y;
    console.log(`Zoom pivot locked for ${canvasId} at (${state.zoomPivotX}, ${state.zoomPivotY})`);

    const newTouchPoint = {
        id: canvasTouch.identifier || `mouse0`,
        x: coords.x,
        y: coords.y,
        clientX: canvasTouch.clientX,
        clientY: canvasTouch.clientY,
        target: canvasTouch.target,
        lastX: coords.x,
        lastY: coords.y,
        startTime: Date.now(),
        isMouse: !e.touches
    };
    
    const existingIndex = inputState.touchPoints.findIndex(tp => tp.id === newTouchPoint.id);
    if (existingIndex >= 0) {
        inputState.touchPoints[existingIndex] = newTouchPoint;
    } else {
        inputState.touchPoints.push(newTouchPoint);
    }
    inputState.lastTouchPoints = [...inputState.touchPoints];

    if (!dragState.isDragging) {
        dragState.isDragging = true;
        dragState.shouldSaveState = true;
    }
    console.log('Start drag - Zoom mode, Touches:', validTouches.length, 'TouchPoints:', inputState.touchPoints);
    return;
}

// NEW: If canvas is zoomed but we're not in zoom tool mode, 
// we need to ensure coordinates are properly transformed
if (isCanvasZoomed) {
    console.log(`Canvas ${canvasId} is zoomed (${state.zoomLevel}x) - ensuring proper coordinate handling`);
    // The getCanvasCoordinates function should handle zoom transformation
    // but we need to verify zoom pivot is set
    if (!state.zoomPivotX || !state.zoomPivotY) {
        console.warn('Canvas is zoomed but zoom pivot not set - using canvas center');
        state.zoomPivotX = targetCanvas.width / 2;
        state.zoomPivotY = targetCanvas.height / 2;
    }
}

// Handle selection tools
if (brushState.brushShape === 'squareSelection' || brushState.brushShape === 'basquiatSelection' || brushState.brushShape === 'circleSelection') {
// CRITICAL FIX: Check zoom mode FIRST before any selection logic
if (zoomState.isZooming) {
    console.log('Selection tool active but in zoom mode - skipping ALL selection handling');
    return; // Exit early - don't process selection when zooming
}

const coords = getCanvasCoordinates(e, validTouches[0]);
if (isNaN(coords.x) || isNaN(coords.y) || !coords.valid) {
    console.error('Invalid selection coords:', coords);
    return;
}

    // Allow brush strokes to continue even when dragging outside canvas bounds
    function addGlobalDragListeners() {
        removeGlobalDragListeners();
        
        globalMouseMoveHandler = (e) => {
            if (dragState.isDragging && !zoomState.isZooming && e.buttons === 1) {
                drag(e);
            }
        };
        
        globalTouchMoveHandler = (e) => {
            if (dragState.isDragging && !zoomState.isZooming) {
                drag(e);
            }
        };
        
        document.addEventListener('mousemove', globalMouseMoveHandler, { passive: false });
        document.addEventListener('touchmove', globalTouchMoveHandler, { passive: false });
    }

    function removeGlobalDragListeners() {
        if (globalMouseMoveHandler) {
            document.removeEventListener('mousemove', globalMouseMoveHandler);
            globalMouseMoveHandler = null;
        }
        if (globalTouchMoveHandler) {
            document.removeEventListener('touchmove', globalTouchMoveHandler);
            globalTouchMoveHandler = null;
        }
    }

    console.log(`startDrag: brushState.brushShape=${brushState.brushShape}, selectionState.selectionType=${selectionState.selectionType}, targetCanvas=${targetCanvas.id}, isMouse=${isMouseEvent}`);

    if (!selectionState.selectionType) {
        selectionState.selectionType = brushState.brushShape === 'squareSelection' ? 'square' : brushState.brushShape === 'circleSelection' ? 'circle' : 'multipoint';
        console.log(`Set selectionState.selectionType to ${selectionState.selectionType}`);
    }

if (!selectionCanvas || selectionCanvas.dataset.targetCanvasId !== targetCanvas.id) {
    if (selectionCanvas && selectionCanvas.parentNode) {
        selectionCanvas.parentNode.removeChild(selectionCanvas);
    }
    selectionCanvas = document.createElement('canvas');
    selectionCanvas.id = 'selectionCanvas';
    selectionCanvas.width = targetCanvas.width;
    selectionCanvas.height = targetCanvas.height;
    selectionCtx = selectionCanvas.getContext('2d', { alpha: true });
    selectionCanvas.style.position = 'absolute';
    selectionCanvas.style.zIndex = '2000';
    selectionCanvas.style.pointerEvents = 'none';
    selectionCanvas.style.display = 'block';
    selectionCanvas.dataset.targetCanvasId = targetCanvas.id;
    document.getElementById('canvasContainer').appendChild(selectionCanvas);
    syncSelectionCanvasPosition(targetCanvas);
    selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
    console.log(`Initialized selection canvas for ${targetCanvas.id}: ${selectionCanvas.width}x${selectionCanvas.height}`);
} else {
    selectionCanvas.width = targetCanvas.width;
    selectionCanvas.height = targetCanvas.height;
    selectionCanvas.dataset.targetCanvasId = targetCanvas.id;
    syncSelectionCanvasPosition(targetCanvas);
    selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
    console.log(`Updated selection canvas for ${targetCanvas.id}`);
}

if (zoomState.isZooming) {
    console.log('BLOCKING: Not continuing with selection setup in zoom mode');
    return;
}

if (recordingState.isRecording) {
    recordMovement('smear', {
        lastX: coords.x,
        lastY: coords.y,
        currentX: coords.x,
        currentY: coords.y,
        canvasId
    });
}

if (selectionState.isSelectionActive && selectionCanvas.dataset.targetCanvasId === targetCanvas.id) {
const isInside = isPointInSelection(coords.x, coords.y, brushState.brushShape);
if (isInside) {
    // Save state before dragging existing selection (new line added)
    saveState(true);
    // Initialize touch point with correct dragState.lastX, dragState.lastY
    inputState.touchPoints = [{
        id: validTouches[0].identifier || 'mouse0',
        x: coords.x,
        y: coords.y,
        target: targetCanvas,
        lastX: inputState.lastTouchPoints.find(tp => tp.id === (validTouches[0].identifier || 'mouse0'))?.x || coords.x,
        lastY: inputState.lastTouchPoints.find(tp => tp.id === (validTouches[0].identifier || 'mouse0'))?.y || coords.y,
        startTime: Date.now(),
        isMouse: isMouseEvent
    }];
    inputState.lastTouchPoints = [...inputState.touchPoints];
    dragState.isDragging = true;
    selectionState.isDraggingSelection = true;
    console.log(`Dragging existing ${brushState.brushShape} selection at (${coords.x}, ${coords.y}) on ${targetCanvas.id}`);
    renderMarchingAnts();
    return;
} else {
    saveState(true);
    selectionState.isSelectionActive = false;
    selectionState.isSelecting = true;
    selectionState.isDraggingSelection = false;
    selectionState.selectedImageData = null;
    selectionState.selectionBounds = null;
    selectionState.selectionStart = null;
    selectionState.selectionEnd = null;
    selectionState.multipointPath = [];
    selectionCacheCanvas = null;
    selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
    console.log(`Reset ${brushState.brushShape} selection state for new selection on ${targetCanvas.id}`);
}
}

if (brushState.brushShape === 'basquiatSelection' && validTouches.length === 1) {
console.log('>>> BASQUIAT SECTION REACHED! zoomState.isZooming=', zoomState.isZooming);
if (zoomState.isZooming) {
    console.log('>>> BASQUIAT BLOCKED BY ZOOM MODE');
    return;
}
        const currentTime = Date.now();
        if (isNaN(coords.x) || isNaN(coords.y)) {
            console.warn('Invalid coords for multipoint selection:', coords);
            return;
        }

        console.log(`Input at (${coords.x.toFixed(2)}, ${coords.y.toFixed(2)}), selectionState.multipointPath.length=${selectionState.multipointPath.length}, selectionState.isSelecting=${selectionState.isSelecting}, selectionState.isSelectionActive=${selectionState.isSelectionActive}, inputType=${isMouseEvent ? 'mouse' : 'touch'}, touchId=${validTouches[0].identifier || 'mouse0'}`);

        const maxPoints = isMouseEvent ? 20 : 40;

        if (selectionState.multipointPath.length > 2) {
            const firstPoint = selectionState.multipointPath[0];
            const distance = Math.sqrt(
                Math.pow(coords.x - firstPoint.x, 2) + Math.pow(coords.y - firstPoint.y, 2)
            );
            const proximityThreshold = isMouseEvent ? 15 : 35;
            console.log(`Checking loop closure: distance=${distance.toFixed(2)}, threshold=${proximityThreshold}, points=${selectionState.multipointPath.length}, coords=(${coords.x.toFixed(2)}, ${coords.y.toFixed(2)}), firstPoint=(${firstPoint.x.toFixed(2)}, ${firstPoint.y.toFixed(2)}), touch=${isTouchEvent}, touchId=${validTouches[0]?.identifier || 'mouse0'}`);
            if (distance < proximityThreshold) {
                console.log(`Unstoppable loop closure triggered on ${targetCanvas.id}: points=${selectionState.multipointPath.length}, coords=(${coords.x.toFixed(2)}, ${coords.y.toFixed(2)}), touch=${isTouchEvent}, touchId=${validTouches[0]?.identifier || 'mouse0'}`);
                window.lastCloseTime = currentTime;
                window.lastTapTime = currentTime;
                window.lastTouchId = isTouchEvent ? validTouches[0].identifier : 'mouse0';
                if (!window.lastEffectTime || currentTime - window.lastEffectTime >= 50) {
                    try {
                        playPianoEffect({ note: 64, velocity: 100, articulation: 'legato' }, currentTime);
                        console.log('Played closure piano effect: note=64 (E4), velocity=100, legato');
                        window.lastEffectTime = currentTime;
                    } catch (e) {
                        console.error('Failed to play closure piano effect:', e);
                    }
                }
                selectionState.isSelecting = false;
                selectionState.isSelectionActive = true;
                selectionState.selectionBounds = calculatePolygonBounds(selectionState.multipointPath);
                selectionState.selectedImageData = captureSelection(targetCanvas, selectionState.multipointPath, 'multipoint');
                if (!selectionState.selectedImageData) {
                    console.error('Failed to capture multipoint selection');
                    selectionState.isSelectionActive = false;
                    selectionState.multipointPath = [];
                    return;
                }
                console.log(`Manually closed multipoint selection on ${targetCanvas.id}: ${selectionState.multipointPath.length} points`);
                saveState(true);
                renderMarchingAnts();
                return;
            }
        }

        if (isTouchEvent && window.lastTouchId === validTouches[0].identifier && currentTime - window.lastTouchTime < 200) {
            console.log('Ignoring duplicate touch event:', validTouches[0].identifier, `timeSinceLast=${currentTime - window.lastTouchTime}ms`);
            return;
        }
        window.lastTouchId = isTouchEvent ? validTouches[0].identifier : 'mouse0';
        window.lastTouchTime = currentTime;

        if (isTouchEvent && window.lastTapTime && currentTime - window.lastTapTime < 200) {
            console.log(`Ignoring double-tap: timeSinceLastTap=${currentTime - window.lastTapTime}ms, points=${selectionState.multipointPath.length}, coords=(${coords.x.toFixed(2)}, ${coords.y.toFixed(2)})`);
            return;
        }

        if (isTouchEvent && selectionState.isSelectionActive && currentTime - window.lastCloseTime < 200) {
            console.log(`Blocking new selection after closure: timeSinceLastClose=${currentTime - window.lastCloseTime}ms, points=${selectionState.multipointPath.length}, coords=(${coords.x.toFixed(2)}, ${coords.y.toFixed(2)})`);
            return;
        }

        if (selectionState.multipointPath.length < maxPoints) {
            console.log(`Adding point: points=${selectionState.multipointPath.length}, maxPoints=${maxPoints}, coords=(${coords.x.toFixed(2)}, ${coords.y.toFixed(2)}), isTouchEvent=${isTouchEvent}`);
            
            selectionState.multipointPath.push({ x: coords.x, y: coords.y });
            let pointsAdded = 1;
            if (!window.lastEffectTime || currentTime - window.lastEffectTime >= 50) {
                try {
                    playPianoEffect({ note: 60, velocity: 60, articulation: 'staccato' }, currentTime);
                    console.log('Played point piano effect: note=60 (C4), velocity=60, staccato');
                    window.lastEffectTime = currentTime;
                } catch (e) {
                    console.error('Failed to play point piano effect:', e);
                }
            }
            if (isTouchEvent && selectionState.multipointPath.length < maxPoints - 1) {
                selectionState.multipointPath.push({ x: coords.x, y: coords.y });
                pointsAdded = 2;
                if (!window.lastEffectTime || currentTime - window.lastEffectTime >= 50) {
                    try {
                        playPianoEffect({ note: 60, velocity: 60, articulation: 'staccato' }, currentTime);
                        console.log('Played second point piano effect: note=60 (C4), velocity=60, staccato');
                        window.lastEffectTime = currentTime;
                    } catch (e) {
                        console.error('Failed to play second point piano effect:', e);
                    }
                }
                console.log(`Added double point for touch on ${targetCanvas.id}: (${coords.x.toFixed(2)}, ${coords.y.toFixed(2)}), total points: ${selectionState.multipointPath.length}, maxPoints: ${maxPoints}`);
            } else if (isTouchEvent && selectionState.multipointPath.length === maxPoints - 1) {
                console.log(`Added single point for touch (near max) on ${targetCanvas.id}: (${coords.x.toFixed(2)}, ${coords.y.toFixed(2)}), total points: ${selectionState.multipointPath.length}, maxPoints: ${maxPoints}`);
            } else if (isMouseEvent) {
                console.log(`Added single point for mouse on ${targetCanvas.id}: (${coords.x.toFixed(2)}, ${coords.y.toFixed(2)}), total points: ${selectionState.multipointPath.length}, maxPoints: ${maxPoints}`);
            }
            window.lastTapTime = isTouchEvent ? currentTime : 0;
            selectionState.isSelecting = true;
            selectionState.selectionType = 'multipoint';
            console.log(`Added multipoint on ${targetCanvas.id}: (${coords.x.toFixed(2)}, ${coords.y.toFixed(2)}), total points: ${selectionState.multipointPath.length}, maxPoints: ${maxPoints}, pointsAdded=${pointsAdded}, inputType=${isMouseEvent ? 'mouse' : 'touch'}`);

            if (selectionState.multipointPath.length >= maxPoints) {
                selectionState.multipointPath = selectionState.multipointPath.slice(0, maxPoints);
                console.log(`Max points (${maxPoints}) reached for ${isMouseEvent ? 'mouse' : 'touch'}, auto-closing multipoint selection on ${targetCanvas.id}: ${selectionState.multipointPath.length} points`);
                if (!window.lastEffectTime || currentTime - window.lastEffectTime >= 50) {
                    try {
                        playPianoEffect({ note: 64, velocity: 100, articulation: 'legato' }, currentTime);
                        console.log('Played auto-closure piano effect: note=64 (E4), velocity=100, legato');
                        window.lastEffectTime = currentTime;
                    } catch (e) {
                        console.error('Failed to play auto-closure piano effect:', e);
                    }
                }
                window.lastCloseTime = currentTime;
                window.lastTapTime = currentTime;
                selectionState.isSelecting = false;
                selectionState.isSelectionActive = true;
                selectionState.selectionBounds = calculatePolygonBounds(selectionState.multipointPath);
                selectionState.selectedImageData = captureSelection(targetCanvas, selectionState.multipointPath, 'multipoint');
                if (!selectionState.selectedImageData) {
                    console.error('Failed to capture multipoint selection');
                    selectionState.isSelectionActive = false;
                    selectionState.multipointPath = [];
                    return;
                }
                console.log(`Auto-closed multipoint selection on ${targetCanvas.id}: ${selectionState.multipointPath.length} points`);
                saveState(true);
                renderMarchingAnts();
                return;
            }

            renderMarchingAnts();
            if (recordingState.isRecording) {
                recordMovement('smear', {
                    lastX: coords.x,
                    lastY: coords.y,
                    currentX: coords.x,
                    currentY: coords.y,
                    canvasId
                });
            }
        } else if (isTouchEvent) {
            console.log(`Max ${maxPoints} points reached for touch input, auto-closing selection`);
            selectionState.multipointPath = selectionState.multipointPath.slice(0, maxPoints);
            if (!window.lastEffectTime || currentTime - window.lastEffectTime >= 50) {
                try {
                    playPianoEffect({ note: 64, velocity: 100, articulation: 'legato' }, currentTime);
                    console.log('Played auto-closure piano effect: note=64 (E4), velocity=100, legato');
                    window.lastEffectTime = currentTime;
                } catch (e) {
                    console.error('Failed to play auto-closure piano effect:', e);
                }
            }
            window.lastCloseTime = currentTime;
            window.lastTapTime = currentTime;
            selectionState.isSelecting = false;
            selectionState.isSelectionActive = true;
            selectionState.selectionBounds = calculatePolygonBounds(selectionState.multipointPath);
            selectionState.selectedImageData = captureSelection(targetCanvas, selectionState.multipointPath, 'multipoint');
            if (!selectionState.selectedImageData) {
                console.error('Failed to capture multipoint selection');
                selectionState.isSelectionActive = false;
                selectionState.multipointPath = [];
                return;
            }
            console.log({
                x: coords.x,
                y: coords.y,
                target: targetCanvas,
                lastX: coords.x,
                lastY: coords.y,
                startTime: Date.now(),
                isMouse: isMouseEvent
            });
inputState.lastTouchPoints = [...inputState.touchPoints];

selectionState.isSelecting = true;
selectionState.isSelectionActive = false;
selectionState.isDraggingSelection = false; // Reset for new selection

if (brushState.brushShape === 'squareSelection') {
    selectionState.selectionStart = { x: coords.x, y: coords.y };
    selectionState.selectionEnd = { x: coords.x, y: coords.y };
console.log('SELECTION COORDS SET:', {
raw: { x: coords.x, y: coords.y },
zoom: { level: state.zoomLevel, panX: state.panX, panY: state.panY },
expectedCanvasCoords: {
    x: (coords.x - state.panX) / state.zoomLevel,
    y: (coords.y - state.panY) / state.zoomLevel
}
});
    selectionState.selectionType = 'square';
    console.log(`Started square selection at (${coords.x}, ${coords.y}) on ${targetCanvas.id}`);
} else if (brushState.brushShape === 'circleSelection') {
    selectionState.selectionStart = { x: coords.x, y: coords.y };
    selectionState.selectionEnd = { x: coords.x, y: coords.y };
    selectionState.selectionType = 'circle';
    // Ensure selection canvas is properly initialized
    if (selectionCanvas) {
        selectionCanvas.width = targetCanvas.width;
        selectionCanvas.height = targetCanvas.height;
        selectionCanvas.dataset.targetCanvasId = targetCanvas.id;
        syncSelectionCanvasPosition(targetCanvas);
        selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
        console.log(`Updated selection canvas for circle selection on ${targetCanvas.id}`);
    }
    console.log(`Started circle selection at (${coords.x}, ${coords.y}) on ${targetCanvas.id}`);
} else {
    selectionState.multipointPath = [{ x: coords.x, y: coords.y }];
    selectionState.selectionType = 'multipoint';
    console.log(`Started multipoint selection at (${coords.x}, ${coords.y}) on ${targetCanvas.id}`);
}
renderMarchingAnts();
return;
}

// Existing drawing logic with enhanced filtering
inputState.touchPoints = validTouches
    .slice(0, 6)
    .filter(touch => {
        if (dragState.isDragging) return true;
        const clientX = touch.clientX;
        const clientY = touch.clientY;
        const isOverKeys = clientX >= keyboardRect.left && clientX <= keyboardRect.right && 
                          clientY >= keyboardRect.top && clientY <= keyboardRect.bottom;
        return !isOverKeys && touch.target === targetCanvas;
    })
    .map((touch, index) => {
        const coords = getCanvasCoordinates(e, touch);
        if (isNaN(coords.x) || isNaN(coords.y) || !coords.valid) {
            console.error('Invalid touch coords:', coords, 'Touch:', touch);
            return null;
        }
        return {
            id: touch.identifier || `mouse${index}`,
            x: coords.x,
            y: coords.y,
            target: touch.target,
            lastX: coords.x,
            lastY: coords.y,
            startTime: Date.now(),
            isMouse: !e.touches
        };
    })
    .filter(tp => tp !== null);

if (inputState.touchPoints.length === 0) {
    console.log('startDrag aborted - No valid touch points after filtering');
    return;
}

if (!dragState.isDragging) {
// Save state before starting any operation
saveState(true); // Force save to ensure each drag gets its own undo state
dragState.isDragging = true;
dragState.hasCanvasChanged = false;
dragState.shouldSaveState = true;

// Add document-level mouse tracking for seamless dragging outside canvas
if (!e.touches) {
    document.addEventListener('mousemove', continueDragOutsideCanvas, { passive: false });
    document.addEventListener('mouseup', endDragOutsideCanvas, { passive: false });
}
}
inputState.lastTouchPoints = [...inputState.touchPoints];
console.log('Start drag - Brush:', brushState.brushShape, 'Canvas:', canvasId, 'TouchPoints:', inputState.touchPoints);

const normalBrushes = ['box', 'circle', 'rectangle', 'triangle', 'tv', 'negative'];
if (normalBrushes.includes(brushState.brushShape)) {
    const firstFinger = inputState.touchPoints[0];
    teleportState.teleportFirstFinger = firstFinger.id;
    console.log('teleportState.teleportFirstFinger set to:', teleportState.teleportFirstFinger);
    if (effectStates.isPaintMode) {
        dragState.lastX = firstFinger.x;
        dragState.lastY = firstFinger.y;
        smearPixels(firstFinger.x, firstFinger.y, canvasId);
        dragState.hasCanvasChanged = true;
        if (recordingState.isRecording) {
            recordMovement('smear', {
                lastX: firstFinger.lastX,
                lastY: firstFinger.lastY,
                currentX: firstFinger.x,
                currentY: firstFinger.y,
                canvasId,
                activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
            });
        }
    } else if (effectStates.isTeleportHeld) {
        teleportState.teleportSourceX = firstFinger.x;
        teleportState.teleportSourceY = firstFinger.y;
        teleportState.teleportCanvasId = canvasId;
        teleportState.teleportFirstFinger = firstFinger.id;
        console.log(`Teleport source set by first finger ${firstFinger.id} at (${teleportState.teleportSourceX}, ${teleportState.teleportSourceY}) on ${canvasId}`);

        teleportState.teleportDestinations = [];
        inputState.touchPoints.forEach((point, index) => {
            if (point.id === firstFinger.id) return;
            if (point.x === 0 && point.y === 0) {
                console.log(`Skipping teleport destination for finger ${point.id}: invalid coordinates (0,0)`);
                return;
            }
            const destCanvasId = point.target === baseCanvas ? 'base' : point.target === paintCanvas ? 'paint' : 'sampler';
            teleportState.teleportDestinations.push({
                canvasId: destCanvasId,
                x: point.x,
                y: point.y,
                lastX: point.x,
                lastY: point.y,
                fingerId: point.id,
                sourceOffsetX: point.x - firstFinger.x,
                sourceOffsetY: point.y - firstFinger.y,
                isSameCanvas: destCanvasId === canvasId
            });
            console.log(`Teleport destination added for finger ${point.id} at (${point.x}, ${point.y}) on ${destCanvasId}`);
        });

        teleportState.teleportDestinations.forEach(dest => {
            const sourceCanvas = firstFinger.target;
            smearPixels(dest.x, dest.y, dest.canvasId, teleportState.teleportSourceX, teleportState.teleportSourceY, undefined, sourceCanvas);
            dragState.hasCanvasChanged = true;
            if (recordingState.isRecording) {
                recordMovement('smear', {
                    lastX: dest.lastX || dest.x,
                    lastY: dest.lastY || dest.y,
                    currentX: dest.x,
                    currentY: dest.y,
                    canvasId: dest.canvasId,
                    fingerId: dest.fingerId,
                    isTeleportClone: true,
                    isSameCanvas: dest.isSameCanvas,
                    activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                });
            }
        });
    } else {
        dragState.lastX = firstFinger.x;
        dragState.lastY = firstFinger.y;
        if (inputState.touchPoints.length >= 3 && !firstFinger.isMouse) {
            const thirdFinger = inputState.touchPoints[2];
            const sourceCanvas = thirdFinger.target;
            const sourceCanvasId = sourceCanvas === baseCanvas ? 'base' : sourceCanvas === paintCanvas ? 'paint' : 'sampler';
            if (thirdFinger.x === 0 && thirdFinger.y === 0) {
                console.log(`Skipping reverse teleport for finger ${thirdFinger.id}: invalid coordinates (0,0)`);
                smearPixels(firstFinger.x, firstFinger.y, canvasId);
                dragState.hasCanvasChanged = true;
            } else {
                const sourceCtx = sourceCanvas === baseCanvas ? baseCtx : sourceCanvas === paintCanvas ? paintCtx : samplerCtx;
                try {
                    const pixelData = sourceCtx.getImageData(Math.round(thirdFinger.x), Math.round(thirdFinger.y), 1, 1).data;
                    console.log(`Reverse teleport pixel at (${thirdFinger.x}, ${thirdFinger.y}) on ${sourceCanvasId}: RGBA(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3]})`);
                    smearPixels(firstFinger.x, firstFinger.y, canvasId, thirdFinger.x, thirdFinger.y, undefined, sourceCanvas);
                    dragState.hasCanvasChanged = true;
                    console.log(`Reverse teleport from (${thirdFinger.x}, ${thirdFinger.y}) on ${sourceCanvasId} to (${firstFinger.x}, ${firstFinger.y}) on ${canvasId}`);
                } catch (e) {
                    console.error(`Failed to get pixel data at (${thirdFinger.x}, ${thirdFinger.y}) on ${sourceCanvasId}:`, e);
                    smearPixels(firstFinger.x, firstFinger.y, canvasId);
                    dragState.hasCanvasChanged = true;
                }
            }
            thirdFinger.lastX = thirdFinger.x;
            thirdFinger.lastY = thirdFinger.y;
            if (recordingState.isRecording) {
                recordMovement('smear', {
                    lastX: firstFinger.lastX,
                    lastY: firstFinger.lastY,
                    currentX: firstFinger.x,
                    currentY: firstFinger.y,
                    sourceX: thirdFinger.x,
                    sourceY: thirdFinger.y,
                    sourceCanvasId: sourceCanvasId,
                    canvasId,
                    isReverseTeleport: true,
                    activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                });
            }
        } else {
            smearPixels(firstFinger.x, firstFinger.y, canvasId);
            dragState.hasCanvasChanged = true;
            if (recordingState.isRecording) {
                recordMovement('smear', {
                    lastX: firstFinger.lastX,
                    lastY: firstFinger.lastY,
                    currentX: firstFinger.x,
                    currentY: firstFinger.y,
                    canvasId,
                    activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                });
            }
        }
    }
} else if (brushState.brushShape === 'sweeper' || brushState.brushShape === 'oilbarrel') {
const isTouchEvent = !!e.touches;
if (inputState.touchPoints[0].isMouse) {
    // Mouse input: Single anchor point with lag for sweeper, or oilbarrel drag
    brushState.brushRotation = 0;
    sweeperState.mouseAnchorStart = { x: inputState.touchPoints[0].x, y: inputState.touchPoints[0].y, target: inputState.touchPoints[0].target };
    if (brushState.brushShape === 'oilbarrel') {
        dragState.oilbarrelDragState = {
startX: inputState.touchPoints[0].x,  // Use raw coordinates
startY: inputState.touchPoints[0].y,  // Use raw coordinates
endX: inputState.touchPoints[0].x,
endY: inputState.touchPoints[0].y,
canvasId: canvasId,
ctx: ctx,
targetCanvas: targetCanvas
};

console.log('OILBARREL START DEBUG:', {
rawX: inputState.touchPoints[0].x,
rawY: inputState.touchPoints[0].y,
zoomLevel: zoomState.canvasStates[canvasId].zoomLevel,
panX: zoomState.canvasStates[canvasId].panX,
panY: zoomState.canvasStates[canvasId].panY
});
        sweeperState.anchorPoints = [
            { x: inputState.touchPoints[0].x, y: inputState.touchPoints[0].y, target: inputState.touchPoints[0].target, lastX: inputState.touchPoints[0].x, lastY: inputState.touchPoints[0].y },
            { x: inputState.touchPoints[0].x, y: inputState.touchPoints[0].y, target: inputState.touchPoints[0].target, lastX: inputState.touchPoints[0].x, lastY: inputState.touchPoints[0].y }
        ];
        if (sweeperState.anchorPoints.every(p => !isNaN(p.x) && !isNaN(p.y) && (p.x !== 0 || p.y !== 0))) {
            dragState.isDraggingOilbarrel = true;
            if (dragState.oilbarrelRafId) cancelAnimationFrame(dragState.oilbarrelRafId);
            dragState.oilbarrelRafId = requestAnimationFrame(renderOilbarrelMouse);
            console.log('Started oilbarrel mouse drag rendering');
            if (recordingState.isRecording) {
                // FIXED: Enhanced mouse recording with complete anchor state
                recordMovement('smear', {
                    lastX: sweeperState.anchorPoints[0]?.lastX || sweeperState.anchorPoints[0]?.x,
                    lastY: sweeperState.anchorPoints[0]?.lastY || sweeperState.anchorPoints[0]?.y,
                    currentX: sweeperState.anchorPoints[1]?.x,
                    currentY: sweeperState.anchorPoints[1]?.y,
                    canvasId,
                    brushShape: brushState.brushShape,
                    anchorPoints: sweeperState.anchorPoints.map((p, index) => ({ 
                        x: p.x, 
                        y: p.y, 
                        lastX: p.lastX || p.x,
                        lastY: p.lastY || p.y,
                        fingerId: `mouse_${index}`,
                        target: p.target?.id || 'canvas'
                    })),
                    fingerCount: 1,
                    inputType: 'mouse',
                    gestureId: Date.now(),
                    activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                });
            }
        } else {
            console.log('Oilbarrel mouse start skipped - Invalid or (0,0) anchor points:', sweeperState.anchorPoints);
        }
    } else {
        sweeperState.anchorPoints = [
            { x: inputState.touchPoints[0].x, y: inputState.touchPoints[0].y, target: inputState.touchPoints[0].target, lastX: inputState.touchPoints[0].x, lastY: inputState.touchPoints[0].y },
            { x: inputState.touchPoints[0].x, y: inputState.touchPoints[0].y, target: inputState.touchPoints[0].target, lastX: inputState.touchPoints[0].x, lastY: inputState.touchPoints[0].y }
        ];
        if (sweeperState.anchorPoints.every(p => !isNaN(p.x) && !isNaN(p.y) && (p.x !== 0 || p.y !== 0))) {
            drawSweeperLines(canvasId);
            dragState.hasCanvasChanged = true;
            if (recordingState.isRecording) {
                // Record as single coordinated gesture
                recordMovement('smear', {
                    lastX: sweeperState.anchorPoints[0].x,
                    lastY: sweeperState.anchorPoints[0].y,
                    currentX: sweeperState.anchorPoints[1].x,
                    currentY: sweeperState.anchorPoints[1].y,
                    canvasId,
                    brushShape: brushState.brushShape,
                    anchorPoints: sweeperState.anchorPoints.map(p => ({ x: p.x, y: p.y })),
                    fingerCount: 1,
                    inputType: 'mouse',
                    gestureId: Date.now(), // Unique ID for this gesture
                    activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                });
            }
        } else {
            console.log('Sweeper mouse start skipped - Invalid or (0,0) anchor points:', sweeperState.anchorPoints);
        }
    }
} else if (isTouchEvent && inputState.touchPoints.length >= 1 && inputState.touchPoints.length <= 5) {
    // Touch input: 1–5 fingers for dynamic multi-point lines
    sweeperState.anchorPoints = inputState.touchPoints.slice(0, 5).map(point => ({
        x: point.x,
        y: point.y,
        target: point.target,
        lastX: point.x,
        lastY: point.y,
        id: point.id
    }));
    if (sweeperState.anchorPoints.every(p => !isNaN(p.x) && !isNaN(p.y) && (p.x !== 0 || p.y !== 0))) {
        if (brushState.brushShape === 'oilbarrel') {
            dragState.oilbarrelDragState = {
                startX: sweeperState.anchorPoints[0].x,
                startY: sweeperState.anchorPoints[0].y,
                endX: sweeperState.anchorPoints[sweeperState.anchorPoints.length - 1].x,
                endY: sweeperState.anchorPoints[sweeperState.anchorPoints.length - 1].y,
                canvasId: canvasId,
                ctx: ctx,
                targetCanvas: targetCanvas
            };
            dragState.isDraggingOilbarrel = true;
            if (dragState.oilbarrelRafId) cancelAnimationFrame(dragState.oilbarrelRafId);
            dragState.oilbarrelRafId = requestAnimationFrame(renderOilbarrelMouse);
            console.log('Started oilbarrel touch drag rendering with', sweeperState.anchorPoints.length, 'fingers');
        } else {
            drawSweeperLines(canvasId);
            dragState.hasCanvasChanged = true;
        }
        if (recordingState.isRecording) {
        // FIXED: Enhanced recording with complete anchor point data
        const gestureId = Date.now();
        recordMovement('smear', {
            lastX: sweeperState.anchorPoints[0]?.lastX || sweeperState.anchorPoints[0]?.x,
            lastY: sweeperState.anchorPoints[0]?.lastY || sweeperState.anchorPoints[0]?.y,
            currentX: sweeperState.anchorPoints[0]?.x,
            currentY: sweeperState.anchorPoints[0]?.y,
            canvasId,
            brushShape: brushState.brushShape,
            anchorPoints: sweeperState.anchorPoints.map((p, index) => ({ 
                x: p.x, 
                y: p.y, 
                lastX: p.lastX || p.x, 
                lastY: p.lastY || p.y,
                fingerId: p.id || `finger_${index}`,
                target: p.target?.id || 'canvas'
            })),
            fingerCount: sweeperState.anchorPoints.length,
            inputType: 'touch',
            gestureId: gestureId,
            activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
        });
        console.log(`Recorded ${brushState.brushShape} gesture with ${sweeperState.anchorPoints.length} fingers, gestureId: ${gestureId}`);
    }
    } else {
        console.log('Sweeper/oilbarrel touch start skipped - Invalid or (0,0) anchor points:', sweeperState.anchorPoints);
    }
} else {
    console.log('Sweeper/oilbarrel touch start skipped - Insufficient or excessive touch points:', inputState.touchPoints.length);
}
} else if (brushState.brushShape === 'aestheticLines') {
console.log('🔴 AESTHETIC START:', {
    mouseAnchorStart_before: sweeperState.mouseAnchorStart,
    touchPoints: inputState.touchPoints.map(p => ({x: p.x, y: p.y})),
    isZooming: zoomState.isZooming,
    zoomLevel: state.zoomLevel,
    panX: state.panX,
    panY: state.panY
});

sweeperState.mouseAnchorStart = { x: inputState.touchPoints[0].x, y: inputState.touchPoints[0].y, target: inputState.touchPoints[0].target };
sweeperState.anchorPoints = [
    { x: inputState.touchPoints[0].x, y: inputState.touchPoints[0].y, target: inputState.touchPoints[0].target, lastX: inputState.touchPoints[0].x, lastY: inputState.touchPoints[0].y },
    { x: inputState.touchPoints[0].x, y: inputState.touchPoints[0].y, target: inputState.touchPoints[0].target, lastX: inputState.touchPoints[0].x, lastY: inputState.touchPoints[0].y }
];

console.log('🔴 AESTHETIC AFTER SET:', {
    mouseAnchorStart: sweeperState.mouseAnchorStart,
    anchorPoints: sweeperState.anchorPoints
});

if (sweeperState.anchorPoints.every(p => !isNaN(p.x) && !isNaN(p.y) && (p.x !== 0 || p.y !== 0))) {
    drawAestheticLines(canvasId);
    dragState.hasCanvasChanged = true;
} else {
    console.log('AestheticLines start skipped - Invalid or (0,0) anchor points:', sweeperState.anchorPoints);
}
if (recordingState.isRecording && dragState.hasCanvasChanged) {
    // FIXED: Record anchor points for initial touch
    recordMovement('smear', {
        lastX: inputState.touchPoints[0].x,
        lastY: inputState.touchPoints[0].y,
        currentX: inputState.touchPoints[0].x,
        currentY: inputState.touchPoints[0].y,
        canvasId,
        brushShape: 'aestheticLines',
        // FIXED: Include anchor points
        anchorPoints: sweeperState.anchorPoints.map((p, index) => ({
            x: p.x,
            y: p.y,
            lastX: p.lastX || p.x,
            lastY: p.lastY || p.y,
            fingerId: `aesthetic_start_${index}`,
            target: p.target?.id || 'canvas',
            index: index
        })),
        mouseAnchorStart: sweeperState.mouseAnchorStart ? {
            x: sweeperState.mouseAnchorStart.x,
            y: sweeperState.mouseAnchorStart.y,
            target: sweeperState.mouseAnchorStart.target?.id || 'canvas'
        } : undefined,
        fingerCount: sweeperState.anchorPoints.length,
        inputType: inputState.touchPoints[0]?.isMouse ? 'mouse' : 'touch',
        gestureId: Date.now(),
        activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
    });
}
} // FIXED STICKER MODE SECTION FOR STARTDRAG AND DRAG FUNCTIONS
// Replace the existing stickerMode sections with this code

else if (brushState.brushShape === 'stickerMode') {
const activeStamps = brushState.stampOrder.filter(slot => stickerImages[slot]);
console.log('Active stamps in order:', activeStamps);

if (effectStates.isTeleportHeld && inputState.touchPoints.length >= 1) {
    // Separate original and clone fingers
    const maxStamps = activeStamps.length;
    const originalFingers = inputState.touchPoints.slice(0, maxStamps);
    const cloneFingers = inputState.touchPoints.slice(maxStamps);
    
    console.log(`StickerMode teleport: ${originalFingers.length} originals, ${cloneFingers.length} clones`);

    // Process original stamps first
    for (let i = 0; i < originalFingers.length && i < activeStamps.length; i++) {
        const point = originalFingers[i];
        const slot = activeStamps[i];
        
        if (point.x === 0 && point.y === 0) {
            console.log(`StickerMode original finger ${i + 1} skipped - (0,0) coordinates`);
            continue;
        }
        
        const canvasId = point.target === baseCanvas ? 'base' : point.target === paintCanvas ? 'paint' : 'sampler';
        
        if (stickerImages[slot]) {
            smearPixels(point.x, point.y, canvasId, undefined, undefined, slot);
            dragState.hasCanvasChanged = true;
            console.log(`Original stamp ${slot} at (${point.x}, ${point.y}) on ${canvasId} with finger ${i + 1}`);
            
            point.lastX = point.x;
            point.lastY = point.y;
            
            if (recordingState.isRecording) {
                recordMovement('smear', {
                    lastX: point.lastX,
                    lastY: point.lastY,
                    currentX: point.x,
                    currentY: point.y,
                    canvasId,
                    stickerSlot: slot,
                    brushShape: 'stickerMode',
                    fingerIndex: i + 1,
                    activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                });
            }
        }
    }

    // Process clone stamps - each clone corresponds to an original
    for (let i = 0; i < cloneFingers.length && i < activeStamps.length; i++) {
        const clonePoint = cloneFingers[i];
        const originalPoint = originalFingers[i]; // Corresponding original
        const slot = activeStamps[i];
        
        if (!originalPoint || !clonePoint) continue;
        
        if (clonePoint.x === 0 && clonePoint.y === 0) {
            console.log(`StickerMode clone finger ${i + 1} skipped - (0,0) coordinates`);
            continue;
        }
        
        const cloneCanvasId = clonePoint.target === baseCanvas ? 'base' : clonePoint.target === paintCanvas ? 'paint' : 'sampler';
        const originalCanvasId = originalPoint.target === baseCanvas ? 'base' : originalPoint.target === paintCanvas ? 'paint' : 'sampler';
        
        if (stickerImages[slot]) {
            if (cloneCanvasId !== originalCanvasId) {
                // Cross-canvas clone - use original position as source
                smearPixels(clonePoint.x, clonePoint.y, cloneCanvasId, originalPoint.x, originalPoint.y, slot, originalPoint.target);
                dragState.hasCanvasChanged = true;
                console.log(`Cross-canvas cloned stamp ${slot} from (${originalPoint.x}, ${originalPoint.y}) on ${originalCanvasId} to (${clonePoint.x}, ${clonePoint.y}) on ${cloneCanvasId} with finger ${maxStamps + i + 1}`);
            } else {
                // Same canvas clone - draw normally
                smearPixels(clonePoint.x, clonePoint.y, cloneCanvasId, undefined, undefined, slot);
                dragState.hasCanvasChanged = true;
                console.log(`Same-canvas cloned stamp ${slot} at (${clonePoint.x}, ${clonePoint.y}) on ${cloneCanvasId} with finger ${maxStamps + i + 1}`);
            }
            
            clonePoint.dragState.lastX = clonePoint.x;
            clonePoint.dragState.lastY = clonePoint.y;
            
            if (recordingState.isRecording) {
                recordMovement('smear', {
                    lastX: clonePoint.dragState.lastX,
                    lastY: clonePoint.dragState.lastY,
                    currentX: clonePoint.x,
                    currentY: clonePoint.y,
                    canvasId: cloneCanvasId,
                    stickerSlot: slot,
                    brushShape: 'stickerMode',
                    isTeleportClone: cloneCanvasId !== originalCanvasId,
                    sourceCanvasId: originalCanvasId,
                    sourceX: originalPoint.x,
                    sourceY: originalPoint.y,
                    fingerIndex: maxStamps + i + 1,
                    activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                });
            }
        }
    }

    // Handle resize and rotation fingers (after stamps and clones)
    const totalStampFingers = originalFingers.length + cloneFingers.length;
    
    if (totalStampFingers < inputState.touchPoints.length) {
        const resizeFinger = inputState.touchPoints[totalStampFingers];
        if (resizeFinger) {
            const deltaY = (resizeFinger.y - resizeFinger.dragState.lastY) * 0.5;
            const newSize = Math.max(1, Math.min(700, brushState.brushSize + deltaY * 2));
            if (!isNaN(newSize)) {
                isGestureResizing = true;
                updateBrushSize(newSize);
                isGestureResizing = false;
                console.log(`Resize with finger ${totalStampFingers + 1} - New size: ${brushState.brushSize}, DeltaY: ${deltaY}`);
                if (recordingState.isRecording && recordingState.currentMovement) recordingState.currentMovement.size = brushState.brushSize;
            }
            resizeFinger.dragState.lastX = resizeFinger.x;
            resizeFinger.dragState.lastY = resizeFinger.y;
        }
    }

    if (totalStampFingers + 1 < inputState.touchPoints.length) {
        const rotateFinger = inputState.touchPoints[totalStampFingers + 1];
        if (rotateFinger) {
            const rotateDeltaY = (rotateFinger.y - rotateFinger.dragState.lastY) * 0.005;
            brushState.brushRotation += rotateDeltaY;
            console.log(`Rotate with finger ${totalStampFingers + 2} - Rotation: ${brushState.brushRotation}, DeltaY: ${rotateDeltaY}`);
            if (recordingState.isRecording && recordingState.currentMovement) recordingState.currentMovement.rotation = brushState.brushRotation;
            rotateFinger.dragState.lastX = rotateFinger.x;
            rotateFinger.dragState.lastY = rotateFinger.y;
        }
    }

} else {
    // Normal mode (no teleport) - unchanged
    const maxStamps = Math.min(activeStamps.length, inputState.touchPoints.length);
    for (let i = 0; i < maxStamps; i++) {
        const slot = activeStamps[i % activeStamps.length];
        const point = inputState.touchPoints[i];
        if (point.x === 0 && point.y === 0) {
            console.log(`StickerMode stamp skipped - (0,0) coordinates for finger ${i + 1}`);
            continue;
        }
        const canvasId = point.target === baseCanvas ? 'base' : point.target === paintCanvas ? 'paint' : 'sampler';
        if (stickerImages[slot]) {
            smearPixels(point.x, point.y, canvasId, undefined, undefined, slot);
            dragState.hasCanvasChanged = true;
            console.log(`Stamp ${slot} at (${point.x}, ${point.y}) on ${canvasId} with finger ${i + 1}`);
            point.lastX = point.x;
            point.lastY = point.y;
            if (recordingState.isRecording) {
                recordMovement('smear', {
                    lastX: point.lastX,
                    lastY: point.lastY,
                    currentX: point.x,
                    currentY: point.y,
                    canvasId,
                    stickerSlot: slot,
                    brushShape: 'stickerMode',
                    fingerIndex: i + 1,
                    activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                });
            }
        }
    }

    const stampCount = maxStamps;
    if (stampCount < inputState.touchPoints.length) {
        const resizeFinger = inputState.touchPoints[stampCount];
        if (resizeFinger) {
            const deltaY = (resizeFinger.y - resizeFinger.dragState.lastY) * 0.5;
            const newSize = Math.max(1, Math.min(700, brushState.brushSize + deltaY * 2));
            if (!isNaN(newSize)) {
                isGestureResizing = true;
                updateBrushSize(newSize);
                isGestureResizing = false;
                console.log(`Resize with finger ${stampCount + 1} - New size: ${brushState.brushSize}, DeltaY: ${deltaY}`);
                if (recordingState.isRecording && recordingState.currentMovement) recordingState.currentMovement.size = brushState.brushSize;
            }
            resizeFinger.dragState.lastX = resizeFinger.x;
            resizeFinger.dragState.lastY = resizeFinger.y;
        }
    }

    if (stampCount + 1 < inputState.touchPoints.length) {
        const rotateFinger = inputState.touchPoints[stampCount + 1];
        if (rotateFinger) {
            const rotateDeltaY = (rotateFinger.y - rotateFinger.dragState.lastY) * 0.005;
            brushState.brushRotation += rotateDeltaY;
            console.log(`Rotate with finger ${stampCount + 2} - Rotation: ${brushState.brushRotation}, DeltaY: ${rotateDeltaY}`);
            if (recordingState.isRecording && recordingState.currentMovement) recordingState.currentMovement.rotation = brushState.brushRotation;
            rotateFinger.dragState.lastX = rotateFinger.x;
            rotateFinger.dragState.lastY = rotateFinger.y;
        }
    }
}
} else if (brushState.brushShape === 'melt' || brushState.brushShape === 'brokenScreen' || brushState.brushShape === 'jazzScatter') {
    const firstFinger = inputState.touchPoints[0];
    if (firstFinger) {
        if (firstFinger.x === 0 && firstFinger.y === 0) {
            console.log('Melt/brokenScreen/jazzScatter start skipped - (0,0) coordinates');
            return;
        }
        smearPixels(firstFinger.x, firstFinger.y, canvasId);
        dragState.hasCanvasChanged = true;
        dragState.lastX = firstFinger.x;
        dragState.lastY = firstFinger.y;
        firstFinger.lastX = firstFinger.x;
        firstFinger.lastY = firstFinger.y;

        let meltDirection = 1;
        if (brushState.brushShape !== 'jazzScatter' && inputState.touchPoints.length >= 2) {
            const secondFinger = inputState.touchPoints[1];
            meltDirection = secondFinger.y < firstFinger.y ? -1 : 1;
            console.log('Melt direction set to:', meltDirection === 1 ? 'down' : 'up');
            secondFinger.dragState.lastX = secondFinger.x;
            secondFinger.dragState.lastY = secondFinger.y;

            if (inputState.touchPoints.length >= 3) {
                const thirdFinger = inputState.touchPoints[2];
                const deltaY = (thirdFinger.y - thirdFinger.dragState.lastY) * 0.5;
                const newSize = Math.max(1, Math.min(700, brushState.brushSize + deltaY * 2));
                if (!isNaN(newSize)) {
                    isGestureResizing = true;
                    updateBrushSize(newSize);
                    isGestureResizing = false;
                    console.log('3rd finger resize - New size:', brushState.brushSize, 'DeltaY:', deltaY);
                    if (recordingState.isRecording && recordingState.currentMovement) recordingState.currentMovement.size = brushState.brushSize;
                }
                thirdFinger.dragState.lastX = thirdFinger.x;
                thirdFinger.dragState.lastY = thirdFinger.y;

                if (inputState.touchPoints.length >= 4) {
                    const fourthFinger = inputState.touchPoints[3];
                    if (fourthFinger) {
                        const rotateDeltaY = (fourthFinger.y - fourthFinger.dragState.lastY) * 0.005;
                        brushState.brushRotation += rotateDeltaY;
                        console.log('Finger 4 rotate - Rotation:', brushState.brushRotation, 'DeltaY:', rotateDeltaY);
                        if (recordingState.isRecording && recordingState.currentMovement) recordingState.currentMovement.rotation = brushState.brushRotation;
                        fourthFinger.dragState.lastX = fourthFinger.x;
                        fourthFinger.dragState.lastY = fourthFinger.y;
                    }
                }
            }
        }
        if (recordingState.isRecording) {
            recordMovement('smear', {
                lastX: firstFinger.lastX,
                lastY: firstFinger.lastY,
                currentX: firstFinger.x,
                currentY: firstFinger.y,
                canvasId,
                activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
            });
        }
    }
}
}


/**
 * drag
 */
export function drag(e) {
e.preventDefault();
const touches = e.touches || [e];
console.log('Drag - Event type:', e.type, 'Touches:', touches.length);

// Filter touches to only those targeting canvases
const validTouches = Array.from(touches).filter(touch => 
    touch.target === baseCanvas || touch.target === paintCanvas || touch.target === samplerCanvas
);

if (validTouches.length === 0) {
    console.log('Drag skipped - No valid canvas touches:', { targets: touches.map(t => t.target?.tagName || 'unknown') });
    return;
}

const targetCanvas = validTouches[0].target;
const canvasId = targetCanvas === baseCanvas ? 'base' : targetCanvas === paintCanvas ? 'paint' : 'sampler';
const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : canvasId === 'sampler' ? samplerCtx : null;

if (!ctx) {
    console.error('No context for canvas:', canvasId);
    return;
}

// Update touch points, only rejecting truly invalid coordinates (not (0,0) which could be valid)
inputState.touchPoints = validTouches
    .slice(0, 10)
    .map((touch, index) => {
        const coords = getCanvasCoordinates({ ...e, target: targetCanvas }, touch);
        if (isNaN(coords.x) || isNaN(coords.y) || !coords.valid) {
            console.error('Invalid drag coordinates:', coords, 'Touch:', touch);
            return null;
        }
        const existing = inputState.lastTouchPoints.find(tp => tp.id === (touch.identifier || `mouse${index}`)) || {};
        return {
            id: touch.identifier || `mouse${index}`,
            x: coords.x, // No clamping
            y: coords.y, // No clamping
            clientX: touch.clientX,
            clientY: touch.clientY,
            target: targetCanvas,
            lastX: existing.x !== undefined ? existing.x : coords.x,
            lastY: existing.y !== undefined ? existing.y : coords.y,
            startTime: existing.startTime || Date.now(),
            isMouse: !e.touches
        };
    })
    .filter(tp => tp !== null);

if (inputState.touchPoints.length === 0) {
    console.log({
        brushShape: brushState.brushShape,
        canvas: canvasId,
        touchPoints: inputState.touchPoints.map(tp => ({
            id: tp.id,
            x: tp.x,
            y: tp.y,
            lastX: tp.lastX,
            lastY: tp.lastY
        }))
    });

// Apply active effects without triggering brush actions
if (dragState.isDragging) {
    const activeEffectList = [...activeEffects]
        .map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect)
        .filter(e => e);
    activeEffectList.forEach(effect => {
        toggleEffect(effect, true);
    });
}

// Zoom mode (keep clamping for pan/zoom)
// FIXED ZOOM TOOL WITHIN THE DRAG FUNCTION

if (zoomState.isZooming) {
if (validTouches.length !== 1) {
    console.log('Zoom requires single finger or cursor, ignoring multi-touch:', validTouches.length);
    return;
}
const touch = validTouches[0];
const canvasKey = canvasId;
const state = zoomState.canvasStates[canvasKey];

// REMOVED the re-locking logic that was keeping the pivot locked
console.log('Zoom drag handler: targetLocked is', state.targetLocked, 'pivot:', state.zoomPivotX, state.zoomPivotY);
if (!state.targetLocked) {
    console.log('Zoom drag skipped - No target locked');
    return;
}

const currentX = touch.clientX;
const currentY = touch.clientY;
const lastX = inputState.lastTouchPoints[0]?.clientX || currentX;
const lastY = inputState.lastTouchPoints[0]?.clientY || currentY;
const deltaY = currentY - lastY;
const zoomSpeed = 0.005;
const zoomFactor = deltaY > 0 ? 1 / (1 + zoomSpeed * Math.abs(deltaY)) : 1 + zoomSpeed * Math.abs(deltaY);
const imageWidth = originalDimensions.originalWidths[canvasKey] || targetCanvas.width;
const imageHeight = originalDimensions.originalHeights[canvasKey] || targetCanvas.height;
const maxZoom = Math.min(imageWidth / targetCanvas.width, imageHeight / targetCanvas.height) * 4;
const minZoom = 0.1;
const oldZoomLevel = state.zoomLevel;
let newZoomLevel = state.zoomLevel * zoomFactor;

// Safety: Ensure zoom bounds are enforced
newZoomLevel = Math.max(minZoom, Math.min(maxZoom, newZoomLevel));

// Additional safety: Prevent infinite zooming
if (newZoomLevel > 100) {
    console.warn(`Zoom level ${newZoomLevel} too high, clamping to 100`);
    newZoomLevel = 100;
}

console.log(`ZOOM DEBUG: deltaY=${deltaY}, zoomFactor=${zoomFactor}, oldZoom=${oldZoomLevel}, newZoom=${newZoomLevel}, minZoom=${minZoom}, maxZoom=${maxZoom}`);

state.hasZoomedIn = newZoomLevel > 1;

// FIXED: Check if we're approaching zoom level 1 (full view)
const isReturningToFullView = newZoomLevel <= 1.1 && oldZoomLevel > 1.1;

if (isReturningToFullView) {
    // Reset to full view
    state.zoomLevel = 1;
    state.panX = 0;
    state.panY = 0;
    // Clear the zoom pivot to prevent re-locking
    state.zoomPivotX = 0;
    state.zoomPivotY = 0;
    state.targetLocked = false;
    console.log(`Returned to full view for ${canvasKey}`);
} else if (oldZoomLevel !== newZoomLevel && oldZoomLevel !== 0) {
    const pivotX = state.zoomPivotX;
    const pivotY = state.zoomPivotY;
    const contentX = (pivotX - state.panX) / oldZoomLevel;
    const contentY = (pivotY - state.panY) / oldZoomLevel;
    state.zoomLevel = newZoomLevel;
    state.panX = pivotX - contentX * newZoomLevel;
    state.panY = pivotY - contentY * newZoomLevel;
    const { panX, panY } = clampView(state, targetCanvas, pivotX, pivotY);
    state.panX = panX;
    state.panY = panY;
    console.log(`Zoom drag on ${canvasKey}: zoomLevel=${newZoomLevel}, pivot=(${pivotX}, ${pivotY}), pan=(${state.panX}, ${state.panY})`);
} else {
    state.zoomLevel = newZoomLevel;
}

// FIXED: Use the dedicated redrawCanvas function instead of inline drawing
if (!state.isRedrawing) {
    state.isRedrawing = true;
    if (state.redrawRequest) cancelAnimationFrame(state.redrawRequest);
    state.redrawRequest = requestAnimationFrame(() => {
        try {
            // Ensure imageState.currentImageData is up to date
            if (!imageState.currentImageData[canvasKey] || imageState.currentImageData[canvasKey].width !== targetCanvas.width || imageState.currentImageData[canvasKey].height !== targetCanvas.height) {
                imageState.currentImageData[canvasKey] = ctx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
                console.log(`Updated imageState.currentImageData for ${canvasKey} before zoom redraw`);
            }
            
            // Use the centralized redraw function
            redrawCanvas(canvasKey, targetCanvas, ctx, state);
            
        } catch (error) {
            console.error('Error during zoom redraw:', error);
        } finally {
            state.redrawRequest = null;
            state.isRedrawing = false;
        }
    });
}

        inputState.lastTouchPoints = [{
        id: touch.identifier || `mouse0`,
        clientX: currentX,
        clientY: currentY,
        x: getCanvasCoordinates(e, touch)?.x || 0,
        y: getCanvasCoordinates(e, touch)?.y || 0,
        target: targetCanvas,
        lastX: getCanvasCoordinates(e, touch)?.x || 0,
        lastY: getCanvasCoordinates(e, touch)?.y || 0,
        startTime: Date.now(),
        isMouse: !e.touches
    }];
return;
}


// Selection tools
if (brushState.brushShape === 'squareSelection' || brushState.brushShape === 'basquiatSelection' || brushState.brushShape === 'circleSelection') {
if (zoomState.isZooming) {
    console.log('Selection drag blocked - in zoom mode');
    return;
}
const now = Date.now();
if (now - selectionState.lastDragTime < selectionState.dragThrottleMs) return;
selectionState.lastDragTime = now;

if (selectionState.isSelecting && (brushState.brushShape === 'squareSelection' || brushState.brushShape === 'circleSelection')) {
    const coords = getCanvasCoordinates({ ...e, target: targetCanvas }, validTouches[0]);
    if (coords.x === 0 && coords.y === 0) {
        console.log('Selection skipped - (0,0) coordinates');
        return;
    }
    selectionState.selectionEnd = { x: coords.x, y: coords.y };
    renderMarchingAnts();
} else if ((selectionState.isSelectionActive || selectionState.isDraggingSelection) && selectionCanvas.dataset.targetCanvasId === targetCanvas.id) {
let avgDeltaX = 0, avgDeltaY = 0, validPoints = 0;
inputState.touchPoints.forEach(point => {
    if (isPointInSelection(point.x, point.y, brushState.brushShape)) {
        avgDeltaX += point.x - point.lastX;
        avgDeltaY += point.y - point.lastY;
        validPoints++;
    }
});
if (validPoints === 0) {
    console.log('No valid points inside selection for dragging');
    return;
}
avgDeltaX /= validPoints;
avgDeltaY /= validPoints;

if (selectionState.selectedImageData && selectionState.selectionBounds) {
    if (!selectionCacheCanvas) {
        selectionCacheCanvas = document.createElement('canvas');
        selectionCacheCanvas.width = selectionState.selectedImageData.width;
        selectionCacheCanvas.height = selectionState.selectedImageData.height;
        selectionCacheCtx = selectionCacheCanvas.getContext('2d', { alpha: true });
        selectionCacheCtx.putImageData(selectionState.selectedImageData, 0, 0);
    }

    const newX = selectionState.selectionBounds.xMin + avgDeltaX;
    const newY = selectionState.selectionBounds.yMin + avgDeltaY;

    // CRITICAL FIX: Restore the original canvas state before drawing selection at new position
    if (imageState.currentImageData[canvasId]) {
        ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
        ctx.putImageData(imageState.currentImageData[canvasId], 0, 0);
    }

    const pixels = [];
        const width = selectionState.selectedImageData.width;
        const height = selectionState.selectedImageData.height;
        const data = selectionState.selectedImageData.data;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                if (data[i + 3] > 0) {
                    let canvasX = x + newX;
                    let canvasY = y + newY;
                    if (brushState.brushRotation !== 0) {
                        const relX = canvasX - (newX + width / 2);
                        const relY = canvasY - (newY + height / 2);
                        const cosRot = Math.cos(brushState.brushRotation);
                        const sinRot = Math.sin(brushState.brushRotation);
                        canvasX = newX + width / 2 + (relX * cosRot - relY * sinRot);
                        canvasY = newY + height / 2 + (relX * sinRot + relY * cosRot);
                    }
                    if (flipState.isFlipVerticalActive) {
                        canvasY = newY + height - (canvasY - newY);
                    }
                    pixels.push({
                        r: data[i],
                        g: data[i + 1],
                        b: data[i + 2],
                        x: canvasX,
                        y: canvasY
                    });
                }
            }
        }

        applyEffects(pixels, avgDeltaX, avgDeltaY, selectionState.selectionBounds.xMin, selectionState.selectionBounds.yMin, newX, newY);

        ctx.save();
        if (brushState.brushShape === 'basquiatSelection') {
            ctx.beginPath();
            selectionState.multipointPath.forEach((point, index) => {
                const px = point.x + avgDeltaX;
                const py = point.y + avgDeltaY;
                if (index === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            });
            ctx.closePath();
            ctx.clip();
        } else if (brushState.brushShape === 'squareSelection') {
            ctx.beginPath();
            ctx.rect(newX, newY, width, height);
            ctx.clip();
        } else if (brushState.brushShape === 'circleSelection') {
            ctx.beginPath();
            ctx.ellipse(
                newX + width / 2,
                newY + height / 2,
                width / 2,
                height / 2,
                0,
                0,
                2 * Math.PI
            );
            ctx.clip();
        }

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = targetCanvas.width;
        tempCanvas.height = targetCanvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        const tempImageData = tempCtx.createImageData(tempCanvas.width, tempCanvas.height);
        const tempData = tempImageData.data;

        pixels.forEach(pixel => {
            const px = Math.round(pixel.x);
            const py = Math.round(pixel.y);
            if (px >= 0 && px < tempCanvas.width && py >= 0 && py < tempCanvas.height) {
                const i = (py * tempCanvas.width + px) * 4;
                tempData[i] = pixel.r;
                tempData[i + 1] = pixel.g;
                tempData[i + 2] = pixel.b;
                tempData[i + 3] = 255;
            }
        });

tempCtx.putImageData(tempImageData, 0, 0);
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.restore();

    // CRITICAL FIX: Update imageState.currentImageData after drawing the selection
    imageState.currentImageData[canvasId] = ctx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
    dragState.hasCanvasChanged = true;

    selectionState.selectionBounds.xMin += avgDeltaX;
        selectionState.selectionBounds.xMax += avgDeltaX;
        selectionState.selectionBounds.yMin += avgDeltaY;
        selectionState.selectionBounds.yMax += avgDeltaY;
        selectionState.selectionBounds.centroidX += avgDeltaX;
        selectionState.selectionBounds.centroidY += avgDeltaY;
        if (brushState.brushShape === 'squareSelection' || brushState.brushShape === 'circleSelection') {
            selectionState.selectionStart.x += avgDeltaX;
            selectionState.selectionStart.y += avgDeltaY;
            selectionState.selectionEnd.x += avgDeltaX;
            selectionState.selectionEnd.y += avgDeltaY;
        } else {
            selectionState.multipointPath = selectionState.multipointPath.map(p => ({
                x: p.x + avgDeltaX,
                y: p.y + avgDeltaY
            }));
        }

        if (recordingState.isRecording) {
            inputState.touchPoints.forEach(point => {
                recordMovement('smear', {
                    lastX: point.lastX,
                    lastY: point.lastY,
                    currentX: point.x,
                    currentY: point.y,
                    fingerId: point.id,
                    canvasId,
                    activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                });
            });
        }
    }

    inputState.touchPoints.forEach(point => {
        point.lastX = point.x;
        point.lastY = point.y;
    });
    inputState.lastTouchPoints = [...inputState.touchPoints];
    renderMarchingAnts();
}
return;
}

// Normal brushes
const normalBrushes = ['box', 'circle', 'rectangle', 'triangle', 'tv', 'negative'];
if (normalBrushes.includes(brushState.brushShape)) {
const firstFinger = inputState.touchPoints.find(tp => tp.id === teleportState.teleportFirstFinger) || inputState.touchPoints[0];
if (firstFinger) {
    const firstCanvasId = firstFinger.target === baseCanvas ? 'base' : firstFinger.target === paintCanvas ? 'paint' : 'sampler';
    const ctx = firstCanvasId === 'base' ? baseCtx : firstCanvasId === 'paint' ? paintCtx : samplerCtx;
    if (effectStates.isPaintMode && firstCanvasId === 'paint') {
        smearPixels(firstFinger.x, firstFinger.y, firstCanvasId);
        // Save paintCanvas strokes
        imageState.currentImageData[firstCanvasId] = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        dragState.hasCanvasChanged = true;
        dragState.lastX = firstFinger.x;
        dragState.lastY = firstFinger.y;
        firstFinger.lastX = firstFinger.x;
        firstFinger.lastY = firstFinger.y;
        if (recordingState.isRecording) {
            recordMovement('smear', {
                lastX: firstFinger.lastX,
                lastY: firstFinger.lastY,
                currentX: firstFinger.x,
                currentY: firstFinger.y,
                canvasId: firstCanvasId,
                activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
            });
        }
    } else {
        smearPixels(firstFinger.x, firstFinger.y, firstCanvasId);
        dragState.hasCanvasChanged = true;
        dragState.lastX = firstFinger.x;
        dragState.lastY = firstFinger.y;
        firstFinger.lastX = firstFinger.x;
        firstFinger.lastY = firstFinger.y;
        if (recordingState.isRecording) {
            recordMovement('smear', {
                lastX: firstFinger.lastX,
                lastY: firstFinger.lastY,
                currentX: firstFinger.x,
                currentY: firstFinger.y,
                canvasId: firstCanvasId,
                activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
            });
        }

            if (inputState.touchPoints.length >= 2 && effectStates.isTeleportHeld && !firstFinger.isMouse) {
                if (firstFinger.id === teleportState.teleportFirstFinger) {
                    teleportState.teleportSourceX = firstFinger.x;
                    teleportState.teleportSourceY = firstFinger.y;
                    teleportState.teleportCanvasId = firstCanvasId;
                    console.log(`Teleport source updated to (${teleportState.teleportSourceX}, ${teleportState.teleportSourceY}) on ${teleportState.teleportCanvasId}`);
                }

                teleportState.teleportDestinations = teleportState.teleportDestinations.filter(dest => 
                    inputState.touchPoints.some(tp => tp.id === dest.fingerId)
                );
                inputState.touchPoints.forEach(point => {
                    if (point.id !== teleportState.teleportFirstFinger) {
                        const destCanvasId = point.target === baseCanvas ? 'base' : point.target === paintCanvas ? 'paint' : 'sampler';
                        let dest = teleportState.teleportDestinations.find(d => d.fingerId === point.id);
                        if (!dest) {
                            dest = {
                                canvasId: destCanvasId,
                                x: point.x,
                                y: point.y,
                                lastX: point.x,
                                lastY: point.y,
                                fingerId: point.id,
                                sourceOffsetX: point.x - firstFinger.x,
                                sourceOffsetY: point.y - firstFinger.y,
                                isSameCanvas: destCanvasId === teleportState.teleportCanvasId
                            };
                            teleportState.teleportDestinations.push(dest);
                        } else {
                            dest.dragState.lastX = dest.x;
                            dest.dragState.lastY = dest.y;
                            dest.x = point.x;
                            dest.y = point.y;
                            dest.sourceOffsetX = point.x - firstFinger.x;
                            dest.sourceOffsetY = point.y - firstFinger.y;
                            dest.isSameCanvas = destCanvasId === teleportState.teleportCanvasId;
                        }

                        if (teleportState.teleportSourceX !== null && teleportState.teleportSourceY !== null) {
                            smearPixels(dest.x, dest.y, dest.canvasId, teleportState.teleportSourceX, teleportState.teleportSourceY, undefined, firstFinger.target);
                            dragState.hasCanvasChanged = true;
                            if (recordingState.isRecording) {
                                recordMovement('smear', {
                                    lastX: dest.dragState.lastX,
                                    lastY: dest.dragState.lastY,
                                    currentX: dest.x,
                                    currentY: dest.y,
                                    canvasId: dest.canvasId,
                                    fingerId: dest.fingerId,
                                    isTeleportClone: true,
                                    isSameCanvas: dest.isSameCanvas,
                                    activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                                });
                            }
                        }
                        point.lastX = point.x;
                        point.lastY = point.y;
                    }
                });
            } else if (inputState.touchPoints.length >= 2) {
                const secondFinger = inputState.touchPoints[1];
                if (secondFinger) {
                    const deltaY = secondFinger.y - secondFinger.dragState.lastY;
                    const sizeAdjustment = deltaY * 0.3;
                    const newSize = Math.max(1, Math.min(700, brushState.brushSize + sizeAdjustment));
                    if (newSize !== brushState.brushSize) {
                        isGestureResizing = true;
                        updateBrushSize(newSize);
                        isGestureResizing = false;
                        if (recordingState.isRecording && recordingState.currentMovement && !zoomState.isZooming && brushState.brushShape !== 'squareSelection' && brushState.brushShape !== 'basquiatSelection') {
                            const timestamp = performance.now() - recordingState.currentMovement.startTime;
                            recordMovement('size', {
                                size: newSize,
                                fingerId: secondFinger.id,
                                timestamp: timestamp,
                                fingerRole: 'sizeAdjust'
                            });
                            recordingState.currentMovement.lastSize = newSize;
                        }
                    }
                    secondFinger.dragState.lastX = secondFinger.x;
                    secondFinger.dragState.lastY = secondFinger.y;
                }

                if (inputState.touchPoints.length >= 3) {
                    if (inputState.touchPoints.length >= 4) {
                        const fourthFinger = inputState.touchPoints[3];
                        if (fourthFinger) {
                            const rotateDeltaY = (fourthFinger.y - fourthFinger.dragState.lastY) * 0.005;
                            brushState.brushRotation += rotateDeltaY;
                            rotationState.isIntentionalRotation = true;
                            fourthFinger.dragState.lastX = fourthFinger.x;
                            fourthFinger.dragState.lastY = fourthFinger.y;
                        }
                    }
                }
                if (recordingState.isRecording && !zoomState.isZooming && brushState.brushShape !== 'squareSelection' && brushState.brushShape !== 'basquiatSelection') {
                    const firstFinger = inputState.touchPoints.find(tp => tp.id === teleportState.teleportFirstFinger) || inputState.touchPoints[0];
                    if (firstFinger && (firstFinger.x !== firstFinger.lastX || firstFinger.y !== firstFinger.lastY)) {
                        const timestamp = performance.now() - recordingState.currentMovement.startTime;
                        recordMovement('smear', {
                            lastX: firstFinger.lastX,
                            lastY: firstFinger.lastY,
                            currentX: firstFinger.x,
                            currentY: firstFinger.y,
                            fingerId: firstFinger.id,
                            canvasId: firstCanvasId,
                            size: brushState.brushSize,
                            rotation: brushState.brushRotation,
                            brushShape: brushState.brushShape,
                            timestamp: timestamp,
                            fingerRole: 'primary',
                            activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                        });
                    }
                }
            }
        }
    }
} else if (brushState.brushShape === 'sweeper' || brushState.brushShape === 'oilbarrel') {
    const isTouchEvent = !!e.touches;
    if (inputState.touchPoints[0].isMouse && sweeperState.mouseAnchorStart) {
        // Mouse input: Single anchor with lag for sweeper, or oilbarrel drag
        const cursorX = inputState.touchPoints[0].x;
        const cursorY = inputState.touchPoints[0].y;
        if (cursorX === 0 && cursorY === 0) {
            console.log('Sweeper/oilbarrel mouse drag skipped - (0,0) coordinates');
            return;
        }
        if (brushState.brushShape === 'oilbarrel') {
dragState.oilbarrelDragState.endX = cursorX;
dragState.oilbarrelDragState.endY = cursorY;

console.log('OILBARREL DRAG DEBUG:', {
original: { x: cursorX, y: cursorY },
stored: { x: dragState.oilbarrelDragState.endX, y: dragState.oilbarrelDragState.endY },
zoomLevel: zoomState.canvasStates[canvasId].zoomLevel
});

inputState.touchPoints[0].dragState.lastX = cursorX;
inputState.touchPoints[0].dragState.lastY = cursorY;

console.log('OILBARREL DRAG DEBUG:', {
    original: { x: cursorX, y: cursorY },
    transformed: { x: dragState.oilbarrelDragState.endX, y: dragState.oilbarrelDragState.endY },
    dragState: { startX: dragState.oilbarrelDragState.startX, startY: dragState.oilbarrelDragState.startY },
    zoomLevel: state?.zoomLevel,
    pan: { x: state?.panX, y: state?.panY }
});

inputState.touchPoints[0].dragState.lastX = cursorX;
inputState.touchPoints[0].dragState.lastY = cursorY;
            sweeperState.anchorPoints = [
                { x: dragState.oilbarrelDragState.startX, y: dragState.oilbarrelDragState.startY, target: targetCanvas },
                { x: dragState.oilbarrelDragState.endX, y: dragState.oilbarrelDragState.endY, target: targetCanvas, lastX: cursorX, lastY: cursorY }
            ];
            if (sweeperState.anchorPoints.every(p => !isNaN(p.x) && !isNaN(p.y))) {
                dragState.hasCanvasChanged = true;
                if (recordingState.isRecording) {
                    recordMovement('smear', {
                        lastX: dragState.oilbarrelDragState.startX,
                        lastY: dragState.oilbarrelDragState.startY,
                        currentX: dragState.oilbarrelDragState.endX,
                        currentY: dragState.oilbarrelDragState.endY,
                        fingerId: inputState.touchPoints[0].id,
                        canvasId,
                        brushShape: brushState.brushShape,
                        anchorPoints: sweeperState.anchorPoints.map(p => ({ x: p.x, y: p.y })),
                        activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                    });
                }
            } else {
                console.log('Oilbarrel mouse drag skipped - Invalid anchor points:', sweeperState.anchorPoints);
            }
        } else {
            const firstAnchor = sweeperState.anchorPoints[0] || { x: cursorX, y: cursorY, target: targetCanvas };
            const dx = cursorX - firstAnchor.x;
            const dy = cursorY - firstAnchor.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const lagSpeed = 0.1 + Math.min(distance / 200, 0.4);
            firstAnchor.x += dx * lagSpeed;
            firstAnchor.y += dy * lagSpeed;
            sweeperState.anchorPoints = [
                firstAnchor,
                { x: cursorX, y: cursorY, target: targetCanvas, lastX: cursorX, lastY: cursorY }
            ];
            if (sweeperState.anchorPoints.every(p => !isNaN(p.x) && !isNaN(p.y))) {
                drawSweeperLines(canvasId);
                dragState.hasCanvasChanged = true;
                if (recordingState.isRecording) {
                    recordMovement('smear', {
                        lastX: firstAnchor.x,
                        lastY: firstAnchor.y,
                        currentX: cursorX,
                        currentY: cursorY,
                        fingerId: inputState.touchPoints[0].id,
                        canvasId,
                        brushShape: brushState.brushShape,
                        anchorPoints: sweeperState.anchorPoints.map(p => ({ x: p.x, y: p.y })),
                        activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                    });
                }
            } else {
                console.log('Sweeper mouse drag skipped - Invalid anchor points:', sweeperState.anchorPoints);
            }
        }
    } else if (isTouchEvent && inputState.touchPoints.length >= 1 && inputState.touchPoints.length <= 5) {
        // Touch input: 1–5 fingers for dynamic multi-point lines
        sweeperState.anchorPoints = inputState.touchPoints.slice(0, 5).map(point => ({
            x: point.x,
            y: point.y,
            target: point.target,
            lastX: point.lastX || point.x,
            lastY: point.lastY || point.y,
            id: point.id
        }));
        if (sweeperState.anchorPoints.every(p => !isNaN(p.x) && !isNaN(p.y) && (p.x !== 0 || p.y !== 0))) {
            if (brushState.brushShape === 'oilbarrel') {
                dragState.oilbarrelDragState.startX = sweeperState.anchorPoints[0].x;
                dragState.oilbarrelDragState.startY = sweeperState.anchorPoints[0].y;
                dragState.oilbarrelDragState.endX = sweeperState.anchorPoints[sweeperState.anchorPoints.length - 1].x;
                dragState.oilbarrelDragState.endY = sweeperState.anchorPoints[sweeperState.anchorPoints.length - 1].y;
                dragState.hasCanvasChanged = true;
            } else {
                drawSweeperLines(canvasId);
                dragState.hasCanvasChanged = true;
            }
            if (recordingState.isRecording) {
                sweeperState.anchorPoints.forEach((point, i) => {
                    const nextPoint = sweeperState.anchorPoints[i + 1];
console.log('RECORDING DEBUG - anchorPoints: ', sweeperState.anchorPoints);  
console.log('RECORDING DEBUG - mapped:', sweeperState.anchorPoints.map(p => ({ x: p.x, y: p.y })));
                    recordMovement('smear', {
                        lastX: point.lastX,
                        lastY: point.lastY,
                        currentX: point.x,
                        currentY: point.y,
                        nextX: nextPoint ? nextPoint.x : undefined,
                        nextY: nextPoint ? nextPoint.y : undefined,
                        fingerId: point.id,
                        canvasId,
                        brushShape: brushState.brushShape,
                        anchorPoints: sweeperState.anchorPoints.map(p => ({ x: p.x, y: p.y })),
                        activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                    });
                });
            }
        } else {
            console.log('Sweeper/oilbarrel touch drag skipped - Invalid or (0,0) anchor points:', sweeperState.anchorPoints);
        }
    } else {
        console.log('Sweeper/oilbarrel touch drag skipped - Insufficient or excessive touch points:', inputState.touchPoints.length);
        return;
    }
    inputState.touchPoints.forEach(point => {
        point.lastX = point.x;
        point.lastY = point.y;
    });
    inputState.lastTouchPoints = [...inputState.touchPoints];
} else if (brushState.brushShape === 'aestheticLines') {
console.log('🟡 AESTHETIC DRAG:', {
    mouseAnchorStart: sweeperState.mouseAnchorStart,
    cursorX: inputState.touchPoints[0]?.x,
    cursorY: inputState.touchPoints[0]?.y,
    isZooming: zoomState.isZooming,
    canvasId: canvasId
});
const state = zoomState.canvasStates[canvasId];
if (state && state.zoomLevel !== 1) {
    // Transform anchor points to canvas space
    sweeperState.anchorPoints = sweeperState.anchorPoints.map(point => ({
        ...point,
        x: (point.x - state.panX) / state.zoomLevel,
        y: (point.y - state.panY) / state.zoomLevel
    }));
    
    // Also transform sweeperState.mouseAnchorStart
    sweeperState.mouseAnchorStart = {
        ...sweeperState.mouseAnchorStart,
        x: (sweeperState.mouseAnchorStart.x - state.panX) / state.zoomLevel,
        y: (sweeperState.mouseAnchorStart.y - state.panY) / state.zoomLevel
    };
}

drawAestheticLines(canvasId);
dragState.hasCanvasChanged = true;
if (recordingState.isRecording) {
    // FIXED: Record anchor points like sweeper/oilbarrel do
    recordMovement('smear', {
        lastX: sweeperState.mouseAnchorStart.x,
        lastY: sweeperState.mouseAnchorStart.y,
        currentX: cursorX,
        currentY: cursorY,
        fingerId: inputState.touchPoints[0].id,
        canvasId,
        brushShape: 'aestheticLines',
        // FIXED: Include anchor points in recording
        anchorPoints: sweeperState.anchorPoints.map((p, index) => ({
            x: p.x,
            y: p.y,
            lastX: p.lastX || p.x,
            lastY: p.lastY || p.y,
            fingerId: p.id || `aesthetic_${index}`,
            target: p.target?.id || 'canvas',
            index: index
        })),
        // FIXED: Include mouse anchor state for proper replay
        mouseAnchorStart: {
            x: sweeperState.mouseAnchorStart.x,
            y: sweeperState.mouseAnchorStart.y,
            target: sweeperState.mouseAnchorStart.target?.id || 'canvas'
        },
        fingerCount: sweeperState.anchorPoints.length,
        inputType: inputState.touchPoints[0]?.isMouse ? 'mouse' : 'touch',
        gestureId: Date.now(),
        activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
    });
}
} else if (brushState.brushShape === 'stickerMode') {
    const activeStamps = brushState.stampOrder.filter(slot => stickerImages[slot]);
    console.log('Active stamps in order:', activeStamps);

    if (effectStates.isTeleportHeld && inputState.touchPoints.length >= 2) {
        const firstFinger = inputState.touchPoints.find(tp => tp.id === teleportState.teleportFirstFinger) || inputState.touchPoints[0];
        const sourceCanvasId = firstFinger.target === baseCanvas ? 'base' : firstFinger.target === paintCanvas ? 'paint' : 'sampler';
        if (firstFinger.id === teleportState.teleportFirstFinger) {
            teleportState.teleportSourceX = firstFinger.x;
            teleportState.teleportSourceY = firstFinger.y;
            teleportState.teleportCanvasId = sourceCanvasId;
        }
        const stampCount = Math.min(activeStamps.length, inputState.touchPoints.length);
        for (let i = 0; i < stampCount; i++) {
            const slot = activeStamps[i];
            const point = inputState.touchPoints[i];
            if (point && point.target === firstFinger.target) {
                if (point.x === 0 && point.y === 0) {
                    console.log('StickerMode stamp skipped - (0,0) coordinates for finger:', i + 1);
                    continue;
                }
                smearPixels(point.x, point.y, sourceCanvasId, undefined, undefined, slot);
                dragState.hasCanvasChanged = true;
                console.log(`Original stamp ${slot} at (${point.x}, ${point.y}) on ${sourceCanvasId} with finger ${i + 1}`);
                point.lastX = point.x;
                point.lastY = point.y;
                if (recordingState.isRecording) {
                    recordMovement('smear', {
                        lastX: point.lastX,
                        lastY: point.lastY,
                        currentX: point.x,
                        currentY: point.y,
                        fingerId: point.id,
                        canvasId: sourceCanvasId,
                        stickerSlot: slot,
                        brushShape: 'stickerMode',
                        activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                    });
                }
            }
        }
        const cloneStartIndex = stampCount;
        const maxClones = Math.min(stampCount, inputState.touchPoints.length - cloneStartIndex);
        for (let i = 0; i < maxClones; i++) {
            const clonePoint = inputState.touchPoints[cloneStartIndex + i];
            const sourcePoint = inputState.touchPoints[i];
            const cloneStampSlot = activeStamps[i];
            if (clonePoint && sourcePoint && cloneStampSlot !== undefined && stickerImages[cloneStampSlot]) {
                if (clonePoint.x === 0 && clonePoint.y === 0) {
                    console.log('StickerMode clone skipped - (0,0) coordinates for clone finger:', cloneStartIndex + i + 1);
                    continue;
                }
                const destCanvasId = clonePoint.target === baseCanvas ? 'base' : clonePoint.target === paintCanvas ? 'paint' : 'sampler';
                const sourceX = sourcePoint.x;
                const sourceY = sourcePoint.y;
                if (!isNaN(sourceX) && !isNaN(sourceY)) {
                    smearPixels(clonePoint.x, clonePoint.y, destCanvasId, sourceX, sourceY, cloneStampSlot, sourcePoint.target);
                    dragState.hasCanvasChanged = true;
                    console.log(`Cloned stamp ${cloneStampSlot} from (${sourceX}, ${sourceY}) on ${sourceCanvasId} to (${clonePoint.x}, ${clonePoint.y}) on ${destCanvasId} with finger ${cloneStartIndex + i + 1}`);
                    clonePoint.dragState.lastX = clonePoint.x;
                    clonePoint.dragState.lastY = clonePoint.y;
                    if (recordingState.isRecording) {
                        recordMovement('smear', {
                            lastX: clonePoint.dragState.lastX,
                            lastY: clonePoint.dragState.lastY,
                            currentX: clonePoint.x,
                            currentY: clonePoint.y,
                            fingerId: clonePoint.id,
                            canvasId: destCanvasId,
                            stickerSlot: cloneStampSlot,
                            brushShape: 'stickerMode',
                            isTeleportClone: true,
                            sourceCanvasId: sourceCanvasId,
                            sourceX: sourceX,
                            sourceY: sourceY,
                            fingerIndex: cloneStartIndex + i + 1,
                            activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                        });
                    }
                } else {
                    console.warn(`Invalid source coordinates for clone stamp ${cloneStampSlot}: (${sourceX}, ${sourceY})`);
                }
            }
        }
        const cloneResizeIndex = cloneStartIndex + maxClones;
        if (cloneResizeIndex < inputState.touchPoints.length) {
            const cloneResizeFinger = inputState.touchPoints[cloneResizeIndex];
            if (cloneResizeFinger && cloneResizeFinger.target !== firstFinger.target) {
                const deltaY = (cloneResizeFinger.y - cloneResizeFinger.dragState.lastY) * 0.5;
                const newSize = Math.max(1, Math.min(700, brushState.cloneBrushSize + deltaY * 2));
                brushState.cloneBrushSize = newSize;
                cloneResizeFinger.dragState.lastX = cloneResizeFinger.x;
                cloneResizeFinger.dragState.lastY = cloneResizeFinger.y;
            }
        }
        const cloneRotateIndex = cloneResizeIndex + 1;
        if (cloneRotateIndex < inputState.touchPoints.length) {
            const cloneRotateFinger = inputState.touchPoints[cloneRotateIndex];
            if (cloneRotateFinger && cloneRotateFinger.target !== firstFinger.target) {
                const rotateDeltaY = (cloneRotateFinger.y - cloneRotateFinger.dragState.lastY) * 0.005;
                brushState.cloneBrushRotation += rotateDeltaY;
                cloneRotateFinger.dragState.lastX = cloneRotateFinger.x;
                cloneRotateFinger.dragState.lastY = cloneRotateFinger.y;
            }
        }
    } else {
        for (let i = 0; i < activeStamps.length && i < inputState.touchPoints.length; i++) {
            const slot = activeStamps[i];
            const point = inputState.touchPoints[i];
            if (point) {
                if (point.x === 0 && point.y === 0) {
                    console.log('StickerMode stamp skipped - (0,0) coordinates for finger:', i + 1);
                    continue;
                }
                smearPixels(point.x, point.y, canvasId, undefined, undefined, slot);
                dragState.hasCanvasChanged = true;
                console.log(`Stamp ${slot} assigned to finger ${i + 1} at (${point.x}, ${point.y})`);
                point.lastX = point.x;
                point.lastY = point.y;
                if (recordingState.isRecording) {
                    recordMovement('smear', {
                        lastX: point.lastX,
                        lastY: point.lastY,
                        currentX: point.x,
                        currentY: point.y,
                        fingerId: point.id,
                        canvasId,
                        stickerSlot: slot,
                        brushShape: 'stickerMode',
                        activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                    });
                }
            }
        }
        const stampCount = activeStamps.length;
        if (stampCount < inputState.touchPoints.length) {
            const resizeFinger = inputState.touchPoints[stampCount];
            if (resizeFinger) {
                const deltaY = (resizeFinger.y - resizeFinger.dragState.lastY) * 0.5;
                const newSize = Math.max(1, Math.min(700, brushState.brushSize + deltaY * 2));
                isGestureResizing = true;
                updateBrushSize(newSize);
                isGestureResizing = false;
                resizeFinger.dragState.lastX = resizeFinger.x;
                resizeFinger.dragState.lastY = resizeFinger.y;
            }
        }
        if (stampCount + 1 < inputState.touchPoints.length) {
            const rotateFinger = inputState.touchPoints[stampCount + 1];
            if (rotateFinger) {
                const rotateDeltaY = (rotateFinger.y - rotateFinger.dragState.lastY) * 0.005;
                brushState.brushRotation += rotateDeltaY;
                rotateFinger.dragState.lastX = rotateFinger.x;
                rotateFinger.dragState.lastY = rotateFinger.y;
            }
        }
    }
} else if (brushState.brushShape === 'melt' || brushState.brushShape === 'brokenScreen' || brushState.brushShape === 'jazzScatter') {
    const firstFinger = inputState.touchPoints[0];
    if (firstFinger) {
        if (firstFinger.x === 0 && firstFinger.y === 0) {
            console.log('Melt/brokenScreen/jazzScatter drag skipped - (0,0) coordinates');
            return;
        }
        smearPixels(firstFinger.x, firstFinger.y, canvasId);
        dragState.hasCanvasChanged = true;
        dragState.lastX = firstFinger.x;
        dragState.lastY = firstFinger.y;
        firstFinger.lastX = firstFinger.x;
        firstFinger.lastY = firstFinger.y;

        let meltDirection = 1;
        if (brushState.brushShape !== 'jazzScatter' && inputState.touchPoints.length >= 2) {
            const secondFinger = inputState.touchPoints[1];
            meltDirection = secondFinger.y < firstFinger.y ? -1 : 1;
            secondFinger.dragState.lastX = secondFinger.x;
            secondFinger.dragState.lastY = secondFinger.y;

            if (inputState.touchPoints.length >= 3) {
                const thirdFinger = inputState.touchPoints[2];
                const deltaY = (thirdFinger.y - thirdFinger.dragState.lastY) * 0.5;
                const newSize = Math.max(1, Math.min(700, brushState.brushSize + deltaY * 2));
                isGestureResizing = true;
                updateBrushSize(newSize);
                isGestureResizing = false;
                thirdFinger.dragState.lastX = thirdFinger.x;
                thirdFinger.dragState.lastY = thirdFinger.y;

                if (inputState.touchPoints.length >= 4) {
                    const fourthFinger = inputState.touchPoints[3];
                    if (fourthFinger) {
                        const rotateDeltaY = (fourthFinger.y - fourthFinger.dragState.lastY) * 0.005;
                        brushState.brushRotation += rotateDeltaY;
                        fourthFinger.lastX = fourthFinger.x;
                        fourthFinger.lastY = fourthFinger.y;
                    }
                }
            }
        }
        if (recordingState.isRecording && !zoomState.isZooming && brushState.brushShape !== 'squareSelection' && brushState.brushShape !== 'basquiatSelection') {
            if (firstFinger && (firstFinger.x !== firstFinger.lastX || firstFinger.y !== firstFinger.lastY)) {
                recordMovement('smear', {
                    lastX: firstFinger.lastX,
                    lastY: firstFinger.lastY,
                    currentX: firstFinger.x,
                    currentY: firstFinger.y,
                    fingerId: firstFinger.id,
                    canvasId: canvasId,
                    size: brushState.brushSize,
                    rotation: brushState.brushRotation,
                    brushShape: brushState.brushShape,
                    timestamp: performance.now() - recordingState.currentMovement.startTime,
                    fingerRole: 'primary',
                    activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                });
            }
            if (inputState.touchPoints.length >= 2) {
                const secondFinger = inputState.touchPoints[1];
                if (secondFinger && brushState.brushSize !== recordingState.currentMovement.lastSize) {
                    recordMovement('size', {
                        size: brushState.brushSize,
                        fingerId: secondFinger.id,
                        timestamp: performance.now() - recordingState.currentMovement.startTime
                    });
                }
            }
        }
    }
}

inputState.lastTouchPoints = [...inputState.touchPoints];
}
}


/**
 * endDrag
 */
export function endDrag(e) {
console.log('🟢 ENDDRAG STATE BEFORE CLEAR:', {
brushShape: brushState.brushShape,
mouseAnchorStart: sweeperState.mouseAnchorStart,
anchorPoints: sweeperState.anchorPoints,
isZooming: zoomState.isZooming
});
const paintBefore = paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height);
console.log('paintCanvas before endDrag:', paintBefore.data.some(v => v !== 0));

e.preventDefault();


const touches = e.touches || (e.type === 'mouseup' ? [] : e.touches);
if (touches.length > 0) {
    console.log('endDrag: Multiple touches detected, skipping');
    return;
}

// Define canvasId early
let activeCanvasKey = 'base';
let targetCanvas = baseCanvas;
if (inputState.touchPoints.length > 0) {
    targetCanvas = inputState.touchPoints[0].target;
    activeCanvasKey = targetCanvas === baseCanvas ? 'base' : targetCanvas === paintCanvas ? 'paint' : 'sampler';
}
const canvasId = activeCanvasKey;
const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : canvasId === 'sampler' ? samplerCtx : null;

if (!ctx) {
    console.error('No context for canvas:', canvasId);
    return;
}

console.log(`endDrag: Starting for canvas=${canvasId}, zoomState.isZooming=${zoomState.isZooming}, brushState.brushShape=${brushState.brushShape}, zoomLevel=${zoomState.canvasStates[canvasId]?.zoomLevel}, targetLocked=${zoomState.canvasStates[canvasId]?.targetLocked}, inputState.touchPoints=${JSON.stringify(inputState.touchPoints.map(tp => ({id: tp.id, x: tp.x, y: tp.y})))}`);

// Clear canvas backup cache when drag ends
if (brushState.brushShape === 'sweeper' || brushState.brushShape === 'oilbarrel') {
window.canvasBackupsCache = null;
window.lastBackupCanvasId = null;
}

if (zoomState.isZooming) {
const canvasKey = canvasId;
const state = zoomState.canvasStates[canvasKey];
if (!state) {
    console.log('ZOOM LOCK: Invalid state for canvas:', canvasKey);
    return;
}
// Safety check: if targetLocked is stuck, reset it
if (!state.targetLocked && (state.zoomLevel > 1.1 || state.panX !== 0 || state.panY !== 0)) {
    console.log('ZOOM LOCK: Resetting stuck targetLocked state for canvas:', canvasKey);
    state.targetLocked = false;
    state.zoomPivotX = 0;
    state.zoomPivotY = 0;
    return;
}
if (!state.targetLocked) {
    console.log('ZOOM LOCK: Zoom drag skipped - No target locked');
    return;
}

const touch = e.changedTouches ? e.changedTouches[0] : { clientX: e.clientX, clientY: e.clientY };
const currentX = touch.clientX;
const currentY = touch.clientY;
const lastX = inputState.lastTouchPoints[0]?.clientX || state.zoomPivotX;
const lastY = inputState.lastTouchPoints[0]?.clientY || state.zoomPivotY;
const deltaY = currentY - lastY;

// Ignore small deltaY to prevent snapping
const deltaYThreshold = 2; // Pixels
if (Math.abs(deltaY) < deltaYThreshold) {
    console.log(`Ignored small deltaY=${deltaY} for ${canvasKey} to prevent snapping`);
    return;
}

const zoomSpeed = 0.02;
const zoomFactor = deltaY > 0 ? 1 / (1 + zoomSpeed * Math.abs(deltaY)) : 1 + zoomSpeed * Math.abs(deltaY);
const imageWidth = originalDimensions.originalWidths[canvasKey] || targetCanvas.width;
const imageHeight = originalDimensions.originalHeights[canvasKey] || targetCanvas.height;
const maxZoom = Math.min(imageWidth / targetCanvas.width, imageHeight / targetCanvas.height) * 4;
const minZoom = 0.1;
const oldZoomLevel = state.zoomLevel;
let newZoomLevel = state.zoomLevel * zoomFactor;

// Apply zoom
newZoomLevel = Math.max(minZoom, Math.min(maxZoom, newZoomLevel));
console.log(`ZOOM DEBUG: deltaY=${deltaY}, zoomFactor=${zoomFactor}, oldZoom=${oldZoomLevel}, newZoom=${newZoomLevel}, minZoom=${minZoom}, maxZoom=${maxZoom}`);
state.hasZoomedIn = newZoomLevel > 1;

// FIXED: Only update pan if zoom actually changed
if (Math.abs(oldZoomLevel - newZoomLevel) > 0.001 && oldZoomLevel > 0) {
    const pivotX = state.zoomPivotX;
    const pivotY = state.zoomPivotY;
    const contentX = (pivotX - state.panX) / oldZoomLevel;
    const contentY = (pivotY - state.panY) / oldZoomLevel;
    state.zoomLevel = newZoomLevel;
    state.panX = pivotX - contentX * newZoomLevel;
    state.panY = pivotY - contentY * newZoomLevel;
    const { panX, panY } = clampView(state, targetCanvas, pivotX, pivotY);
    state.panX = panX;
    state.panY = panY;
    console.log(`Zoom drag on ${canvasKey}: zoomLevel=${newZoomLevel}, pivot=(${pivotX}, ${pivotY}), pan=(${state.panX}, ${state.panY})`);
    
    // Redraw immediately
    redrawCanvas(canvasKey, targetCanvas, ctx, state);
} else {
    // Zoom didn't change enough - just update the level without touching pan
    state.zoomLevel = newZoomLevel;
    console.log(`ZOOM UNCHANGED: zoomLevel=${newZoomLevel}, deltaY=${deltaY} - pan preserved`);
}

// Update touch points
inputState.lastTouchPoints = [{
    id: touch.identifier || `mouse0`,
    clientX: currentX,
    clientY: currentY,
    x: getCanvasCoordinates(e, touch)?.x || 0,
    y: getCanvasCoordinates(e, touch)?.y || 0,
    target: targetCanvas,
    lastX: currentX,
    lastY: currentY,
    startTime: Date.now(),
    isMouse: !e.touches
}];

return;
}

// Handle painting case
if (selectionCanvas && selectionCtx && selectionCanvas.dataset.targetCanvasId === targetCanvas.id) {
    selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
    console.log(`Cleared selection canvas for ${targetCanvas.id} to remove lingering effect frames`);
}

// Safety: Ensure zoom state is properly managed when switching from zoom to painting
if (zoomState.isZooming && canvasId) {
    const state = zoomState.canvasStates[canvasId];
    if (state && (state.zoomLevel > 1.1 || state.panX !== 0 || state.panY !== 0)) {
        console.log(`Painting while zoomed - ensuring proper state management for ${canvasId}`);
        // Don't reset zoom here - let the user control it
    }
}

if (canvasId === 'paint' && imageState.currentImageData.paint) {
    paintCtx.putImageData(imageState.currentImageData.paint, 0, 0);
    console.log('Refreshed paintCanvas with imageState.currentImageData to clear temporary brush frames');
}

if (brushState.brushShape !== 'squareSelection' && brushState.brushShape !== 'basquiatSelection' && brushState.brushShape !== 'circleSelection') {
    selectionCacheCanvas = null;
    selectionCacheCtx = null;
    selectionState.selectedImageData = null;
    activeEffects.forEach(key => {
        const effect = Object.keys(effectMap).find(e => effectMap[e].key.toLowerCase() === key);
        if (effect) {
            toggleEffect(effect, false);
            console.log(`Deactivated effect ${effect} to reset state`);
        }
    });
    activeEffects.clear();
    console.log('Cleared activeEffects and effect-related state for non-selection brushes');
}

if (dragState.isDragging) {
console.log('endDrag: Resetting dragState.isDragging to false');

// SIMPLE FIX: Don't reset dragState.isDragging when canvas is zoomed and we're painting
const state = zoomState.canvasStates[canvasId];
const isZoomedPainting = state && state.zoomLevel > 1.1 && !zoomState.isZooming;

if (isZoomedPainting) {
    console.log(`KEEPING dragState.isDragging=true for zoomed painting on ${canvasId}`);
    // Don't reset dragState.isDragging - let it persist for next stroke
    dragState.shouldSaveState = true;
} else {
    // Normal case - reset dragState.isDragging
    dragState.isDragging = false;
    dragState.shouldSaveState = true;
    console.log('dragState.isDragging reset complete, dragState.shouldSaveState=true');
}
}

if (dragState.isDraggingOilbarrel && brushState.brushShape === 'oilbarrel') {
if (dragState.oilbarrelRafId) {
    cancelAnimationFrame(dragState.oilbarrelRafId);
    dragState.oilbarrelRafId = null;
}
dragState.isDraggingOilbarrel = false;  // ADD THIS
dragState.oilbarrelDragState = null;     // AND THIS
console.log('OILBARREL CLEANUP COMPLETE');
}

const canvasContainer = document.getElementById('canvasContainer');
canvasContainer.style.touchAction = 'pan-x';
document.body.style.touchAction = 'pan-y';

if (zoomState.isZooming) {
console.log('endDrag: Skipping selection finalization - in zoom mode');
// Don't finalize any selections while zooming
} else if ((selectionState.isSelecting || typeof selectionState.isDraggingSelection !== 'undefined' && selectionState.isDraggingSelection) && (brushState.brushShape === 'squareSelection' || brushState.brushShape === 'circleSelection') && selectionState.selectionStart && selectionState.selectionEnd) {        
selectionState.isSelecting = false;
selectionState.isSelectionActive = true;
selectionState.selectionBounds = {
    xMin: Math.min(selectionState.selectionStart.x, selectionState.selectionEnd.x),
    xMax: Math.max(selectionState.selectionStart.x, selectionState.selectionEnd.x),
    yMin: Math.min(selectionState.selectionStart.y, selectionState.selectionEnd.y),
    yMax: Math.max(selectionState.selectionStart.y, selectionState.selectionEnd.y)
};
selectionState.selectedImageData = captureSelection(targetCanvas, selectionState.selectionBounds, brushState.brushShape === 'squareSelection' ? 'square' : 'circle');
if (!selectionState.selectedImageData) {
    console.error(`Failed to capture ${brushState.brushShape} selection`);
    selectionState.isSelectionActive = false;
    selectionState.selectionStart = null;
    selectionState.selectionEnd = null;
    return;
}
if (selectionCanvas) {
    selectionCanvas.style.display = 'block';
    selectionCanvas.style.visibility = 'visible';
    syncSelectionCanvasPosition(targetCanvas);
}
console.log(`Finalized ${brushState.brushShape} selection on ${targetCanvas.id}: bounds=${JSON.stringify(selectionState.selectionBounds)}, imageData=${selectionState.selectedImageData.width}x${selectionState.selectedImageData.height}`);
renderMarchingAnts();

// CRITICAL: Immediately save state after selection creation/drag
const targetCanvasId = targetCanvas === baseCanvas ? 'base' : targetCanvas === paintCanvas ? 'paint' : 'sampler';
saveState(true, targetCanvasId);
console.log(`Saved state after ${brushState.brushShape} selection drag on ${targetCanvasId}`);
}

// Handle basquiat selection (uses selectionState.multipointPath instead of selectionState.selectionStart/selectionState.selectionEnd)
// Only finalize if we're dragging an existing selection, NOT if we're still adding points
if ((typeof selectionState.isDraggingSelection !== 'undefined' && selectionState.isDraggingSelection) && brushState.brushShape === 'basquiatSelection' && selectionState.multipointPath && selectionState.multipointPath.length >= 3 && selectionState.isSelectionActive) {
selectionState.isSelecting = false;
selectionState.isSelectionActive = true;

// Calculate bounds from selectionState.multipointPath
const bounds = calculatePolygonBounds(selectionState.multipointPath);
selectionState.selectionBounds = {
    xMin: bounds.xMin,
    xMax: bounds.xMax,
    yMin: bounds.yMin,
    yMax: bounds.yMax,
    path: selectionState.multipointPath // Store the path for basquiat
};

selectionState.selectedImageData = captureSelection(targetCanvas, selectionState.multipointPath, 'multipoint');
if (!selectionState.selectedImageData) {
    console.error(`Failed to capture basquiatSelection`);
    selectionState.isSelectionActive = false;
    selectionState.multipointPath = [];
    return;
}
if (selectionCanvas) {
    selectionCanvas.style.display = 'block';
    selectionCanvas.style.visibility = 'visible';
    syncSelectionCanvasPosition(targetCanvas);
}
console.log(`Finalized basquiatSelection on ${targetCanvas.id}: bounds=${JSON.stringify(selectionState.selectionBounds)}, path points=${selectionState.multipointPath.length}, imageData=${selectionState.selectedImageData.width}x${selectionState.selectedImageData.height}`);
renderMarchingAnts();

// CRITICAL: Immediately save state after basquiat selection creation/drag
const targetCanvasId = targetCanvas === baseCanvas ? 'base' : targetCanvas === paintCanvas ? 'paint' : 'sampler';
saveState(true, targetCanvasId);
console.log(`Saved state after basquiatSelection drag on ${targetCanvasId}`);
}



// Don't reset brush size - let it persist between operations
sizeValue.textContent = brushState.brushSize;


sweeperState.anchorPoints = [];
smearAnchor = null;
teleportChain = [];
inputState.touchPoints = [];
inputState.lastTouchPoints = [];
teleportState.teleportSourceX = null;
teleportState.teleportSourceY = null;
teleportState.teleportCanvasId = null;
teleportState.teleportDestinations = [];
crossTeleportSourceCanvas = null;
crossTeleportSourceX = null;
crossTeleportSourceY = null;
dragState.lastX = undefined;
dragState.lastY = undefined;
vhsNoiseLevel = 0;

// Update imageState.currentImageData with unzoomed data
const baseState = zoomState.canvasStates['base'];
if (canvasId && !(brushState.brushShape === 'squareSelection' || brushState.brushShape === 'basquiatSelection' || brushState.brushShape === 'circleSelection')) {
const canvas = canvasId === 'base' ? baseCanvas : canvasId === 'paint' ? paintCanvas : samplerCanvas;
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const canvasState = zoomState.canvasStates[canvasId];

if (ctx && canvasState && imageState.currentImageData[canvasId]) {
    // Update the offscreen canvas with the new content
    if (!canvasState.offscreenCanvas || canvasState.offscreenCanvas.width !== canvas.width || canvasState.offscreenCanvas.height !== canvas.height) {
        canvasState.offscreenCanvas = document.createElement('canvas');
        canvasState.offscreenCanvas.width = canvas.width;
        canvasState.offscreenCanvas.height = canvas.height;
    }
    const offscreenCtx = canvasState.offscreenCanvas.getContext('2d', { alpha: true });
    offscreenCtx.putImageData(imageState.currentImageData[canvasId], 0, 0);
    
    // Only redraw if zoom level has changed or if we need to update the display
    if (canvasState.zoomLevel !== 1 || canvasState.panX !== 0 || canvasState.panY !== 0) {
        // Maintain the current zoom view
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvasState.panX, canvasState.panY);
        ctx.scale(canvasState.zoomLevel, canvasState.zoomLevel);
        ctx.drawImage(canvasState.offscreenCanvas, 0, 0);
        ctx.restore();
    }
    
    console.log(`Post-paint maintained zoom for ${canvasId}: zoomLevel=${canvasState.zoomLevel}, pan=(${canvasState.panX}, ${canvasState.panY})`);
}
}
removeGlobalDragListeners();

console.log(`endDrag: Completed for canvas=${canvasId}, zoomState.isZooming=${zoomState.isZooming}, brushState.brushShape=${brushState.brushShape}, zoomLevel=${zoomState.canvasStates[canvasId]?.zoomLevel}, targetLocked=${zoomState.canvasStates[canvasId]?.targetLocked}`);
console.log('FINAL: targetLocked for', canvasId, '=', zoomState.canvasStates[canvasId]?.targetLocked);
}
console.log('endDrag complete - zoom states:', {
base: { locked: zoomState.canvasStates.base.targetLocked, zoom: zoomState.canvasStates.base.zoomLevel },
paint: { locked: zoomState.canvasStates.paint.targetLocked, zoom: zoomState.canvasStates.paint.zoomLevel },
sampler: { locked: zoomState.canvasStates.sampler.targetLocked, zoom: zoomState.canvasStates.sampler.zoomLevel }
});

function calculatePolygonBounds(points) {
const xMin = Math.min(...points.map(p => p.x));
const xMax = Math.max(...points.map(p => p.x));
const yMin = Math.min(...points.map(p => p.y));
const yMax = Math.max(...points.map(p => p.y));
return { xMin, xMax, yMin, yMax };
}



function captureSelection(canvas, boundsOrPath, type) {
const canvasId = canvas === baseCanvas ? 'base' : canvas === paintCanvas ? 'paint' : 'sampler';
const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
let xMin, xMax, yMin, yMax, centroidX = 0, centroidY = 0;

const state = zoomState.canvasStates[canvasId];
console.log('CAPTURE SELECTION DEBUG:', {
  type: type,
  selectionStart: selectionState.selectionStart,
  selectionEnd: selectionState.selectionEnd,
  zoom: { level: state.zoomLevel, panX: state.panX, panY: state.panY },
  bounds: boundsOrPath
});

if (type === 'square' || type === 'circle') {
xMin = Math.min(selectionState.selectionStart.x, selectionState.selectionEnd.x);
xMax = Math.max(selectionState.selectionStart.x, selectionState.selectionEnd.x);
yMin = Math.min(selectionState.selectionStart.y, selectionState.selectionEnd.y);
yMax = Math.max(selectionState.selectionStart.y, selectionState.selectionEnd.y);
centroidX = (xMin + xMax) / 2;
centroidY = (yMin + yMax) / 2;
} else {
const bounds = calculatePolygonBounds(boundsOrPath);
xMin = bounds.xMin;
xMax = bounds.xMax;
yMin = bounds.yMin;
yMax = bounds.yMax;
centroidX = boundsOrPath.reduce((sum, p) => sum + p.x, 0) / boundsOrPath.length;
centroidY = boundsOrPath.reduce((sum, p) => sum + p.y, 0) / boundsOrPath.length;
}

xMin = Math.max(0, Math.round(Math.min(xMin, canvas.width - 1)));
xMax = Math.min(canvas.width - 1, Math.round(Math.max(xMax, 0)));
yMin = Math.max(0, Math.round(Math.min(yMin, canvas.height - 1)));
yMax = Math.min(canvas.height - 1, Math.round(Math.max(yMax, 0)));

const width = Math.max(1, xMax - xMin + 1);
const height = Math.max(1, yMax - yMin + 1);

const tempCanvas = document.createElement('canvas');
tempCanvas.width = width;
tempCanvas.height = height;
const tempCtx = tempCanvas.getContext('2d', { alpha: true });

try {
const imageData = ctx.getImageData(xMin, yMin, width, height);
tempCtx.clearRect(0, 0, width, height);
if (type === 'multipoint') {
  tempCtx.save();
  tempCtx.beginPath();
  boundsOrPath.forEach((point, index) => {
    const px = point.x - xMin;
    const py = point.y - yMin;
    if (index === 0) tempCtx.moveTo(px, py);
    else tempCtx.lineTo(px, py);
  });
  tempCtx.closePath();
  tempCtx.clip();
  tempCtx.globalCompositeOperation = 'source-over';
  tempCtx.putImageData(imageData, 0, 0);
  tempCtx.globalCompositeOperation = 'destination-in';
  tempCtx.fillStyle = 'rgba(255, 255, 255, 1)';
  tempCtx.fill();
  tempCtx.restore();
} else if (type === 'circle') {
  tempCtx.save();
  tempCtx.beginPath();
  tempCtx.ellipse(
    width / 2,
    height / 2,
    width / 2,
    height / 2,
    0,
    0,
    2 * Math.PI
  );
  tempCtx.clip();
  tempCtx.globalCompositeOperation = 'source-over';
  tempCtx.putImageData(imageData, 0, 0);
  tempCtx.globalCompositeOperation = 'destination-in';
  tempCtx.fillStyle = 'rgba(255, 255, 255, 1)';
  tempCtx.fill();
  tempCtx.restore();
} else {
  tempCtx.putImageData(imageData, 0, 0);
}

const finalData = tempCtx.getImageData(0, 0, width, height);
selectionState.selectionBounds = { xMin, xMax, yMin, yMax, centroidX, centroidY, path: type === 'multipoint' ? boundsOrPath : null };
console.log(`Captured ${type} selection on ${canvasId}: bounds=${xMin},${yMin},${xMax},${yMax}, size=${width}x${height}, centroid=(${centroidX}, ${centroidY})`);
return finalData;
} catch (e) {
console.error(`Failed to capture ${type} selection on ${canvasId}:`, e);
return null;
}
}

function isPointInSelection(x, y, brushShape) {
if (!selectionState.selectionBounds || !selectionState.isSelectionActive) return false;

if (brushState.brushShape === 'squareSelection') {
// Check if point is inside rectangular bounds
return x >= selectionState.selectionBounds.xMin && x <= selectionState.selectionBounds.xMax &&
       y >= selectionState.selectionBounds.yMin && y <= selectionState.selectionBounds.yMax;
} else if (brushState.brushShape === 'circleSelection') {
// Check if point is inside ellipse
const centerX = (selectionState.selectionBounds.xMin + selectionState.selectionBounds.xMax) / 2;
const centerY = (selectionState.selectionBounds.yMin + selectionState.selectionBounds.yMax) / 2;
const radiusX = (selectionState.selectionBounds.xMax - selectionState.selectionBounds.xMin) / 2;
const radiusY = (selectionState.selectionBounds.yMax - selectionState.selectionBounds.yMin) / 2;
const normalizedX = (x - centerX) / radiusX;
const normalizedY = (y - centerY) / radiusY;
return (normalizedX * normalizedX + normalizedY * normalizedY) <= 1;
} else if (brushState.brushShape === 'basquiatSelection') {
// Check if point is inside polygon using ray-casting algorithm
let inside = false;
const points = selectionState.multipointPath;
for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
  const xi = points[i].x, yi = points[i].y;
  const xj = points[j].x, yj = points[j].y;
  const intersect = ((yi > y) !== (yj > y)) &&
                    (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
  if (intersect) inside = !inside;
}
return inside;
}
return false;
}

// Handle mouse wheel/touchpad zoom
function handleZoomWheel(e) {
if (!zoomState.isZooming) return;
e.preventDefault();
const targetCanvas = e.target === baseCanvas ? baseCanvas : e.target === paintCanvas ? paintCanvas : e.target === samplerCanvas ? samplerCanvas : null;
if (!targetCanvas) {
    console.log('Wheel zoom skipped - Invalid target:', { target: e.target });
    return;
}
const canvasKey = targetCanvas === baseCanvas ? 'base' : targetCanvas === paintCanvas ? 'paint' : 'sampler';
const state = zoomState.canvasStates[canvasKey];
const ctx = targetCanvas.getContext('2d');
const zoomSpeed = 0.01;
const zoomFactor = e.deltaY > 0 ? 1 / (1 + zoomSpeed * Math.abs(e.deltaY)) : 1 + zoomSpeed * Math.abs(e.deltaY);
const imageWidth = originalDimensions.originalWidths[canvasKey] || targetCanvas.width;
const imageHeight = originalDimensions.originalHeights[canvasKey] || targetCanvas.height;
const maxZoom = Math.min(imageWidth / targetCanvas.width, imageHeight / targetCanvas.height) * 4;
const minZoom = 0.1;
const oldZoomLevel = state.zoomLevel;
let newZoomLevel = state.zoomLevel * zoomFactor;

// Safety: Ensure zoom bounds are enforced
newZoomLevel = Math.max(minZoom, Math.min(maxZoom, newZoomLevel));

// Additional safety: Prevent infinite zooming
if (newZoomLevel > 100) {
    console.warn(`Zoom level ${newZoomLevel} too high, clamping to 100`);
    newZoomLevel = 100;
}

state.hasZoomedIn = newZoomLevel > 1;

// FIXED: Check if returning to full view
const isReturningToFullView = newZoomLevel <= 1.1 && oldZoomLevel > 1.1;

if (isReturningToFullView) {
    // Reset to full view
    state.zoomLevel = 1;
    state.panX = 0;
    state.panY = 0;
    state.zoomPivotX = 0;
    state.zoomPivotY = 0;
    state.targetLocked = false;
    console.log(`Wheel zoom returned to full view for ${canvasKey}`);
} else if (oldZoomLevel !== newZoomLevel && oldZoomLevel !== 0) {
    // Get cursor position in canvas coordinates
    const rect = targetCanvas.getBoundingClientRect();
    const style = getComputedStyle(targetCanvas);
    const borderLeft = parseFloat(style.borderLeftWidth) || 0;
    const borderTop = parseFloat(style.borderTopWidth) || 0;
    const scaleX = targetCanvas.width / (rect.width - borderLeft - parseFloat(style.borderRightWidth));
    const scaleY = targetCanvas.height / (rect.height - borderTop - parseFloat(style.borderBottomWidth));
    const cursorX = (e.clientX - rect.left - borderLeft) * scaleX;
    const cursorY = (e.clientY - rect.top - borderTop) * scaleY;

    // Calculate the content point under the cursor
    const contentX = (cursorX - state.panX) / oldZoomLevel;
    const contentY = (cursorY - state.panY) / oldZoomLevel;

    // Update zoom and pan to keep the content point fixed
    state.zoomLevel = newZoomLevel;
    state.panX = cursorX - contentX * newZoomLevel;
    state.panY = cursorY - contentY * newZoomLevel;

    // Clamp with cursor awareness
    const { panX, panY } = clampView(state, targetCanvas, cursorX, cursorY);
    state.panX = panX;
    state.panY = panY;
} else {
    state.zoomLevel = newZoomLevel;
}

console.log(`Wheel zoom on ${canvasKey}: zoomLevel=${state.zoomLevel}, panX=${state.panX}, panY=${state.panY}`);

if (!state.isRedrawing) {
    state.isRedrawing = true;
    if (state.redrawRequest) cancelAnimationFrame(state.redrawRequest);
    state.redrawRequest = requestAnimationFrame(() => {
        try {
            redrawCanvas(canvasKey, targetCanvas, ctx, state);
            console.log(`Wheel zoom redraw for ${canvasKey}: zoomLevel=${state.zoomLevel}, panX=${state.panX}, panY=${state.panY}`);
        } catch (error) {
            console.error('Error during wheel zoom redraw:', error);
        } finally {
            state.redrawRequest = null;
            state.isRedrawing = false;
        }
    });
}
}

// Add wheel event listeners to canvases
[baseCanvas, paintCanvas, samplerCanvas].forEach(canvas => {
canvas.addEventListener('wheel', handleZoomWheel, { passive: false });
});

let mouseZoomState = {
isMouseZooming: false,
startY: 0,
lastZoomTime: 0
};

function handleMouseZoomDrag(e) {
if (!zoomState.isZooming) return;

if (e.type === 'mousedown' && e.button === 0) {
    mouseZoomState.isMouseZooming = true;
    mouseZoomState.startY = e.clientY;
    e.preventDefault();
    console.log('Mouse zoom STARTED - Click+drag to zoom');
    return;
}

if (e.type === 'mousemove') {
    // Only zoom if actively mouse-zooming
    if (!mouseZoomState.isMouseZooming) {
        console.log('Mouse move ignored - not actively zooming');
        return;
    }
    
    const deltaY = e.clientY - mouseZoomState.startY;
    const now = Date.now();
    
    if (now - mouseZoomState.lastZoomTime < 16) return;
    mouseZoomState.lastZoomTime = now;
    
    const targetCanvas = e.target;
    if (targetCanvas === baseCanvas || targetCanvas === paintCanvas || targetCanvas === samplerCanvas) {
        const zoomEvent = {
            target: targetCanvas,
            deltaY: deltaY * 0.5,
            clientX: e.clientX,
            clientY: e.clientY,
            preventDefault: () => {}
        };
        performZoom(zoomEvent);
        console.log('Mouse zoom action applied');
    }
    e.preventDefault();
    return;
}

if (e.type === 'mouseup') {
    mouseZoomState.isMouseZooming = false;
    console.log('Mouse zoom STOPPED - Click+hold again to resume');
    return;
}
}

let touchpadState = {
isDoubleTapping: false,
lastTapTime: 0,
startY: 0,
isActivelyZooming: false
};

function handleTouchpadZoom(e) {
if (!zoomState.isZooming) return;

if (e.type === 'touchstart' && e.touches.length === 1) {
    const now = Date.now();
    const timeSinceLastTap = now - touchpadState.lastTapTime;
    
    if (timeSinceLastTap < 300) { // Double-tap detected
        touchpadState.isActivelyZooming = true;
        touchpadState.startY = e.touches[0].clientY;
        e.preventDefault();
        console.log('Double-tap zoom actions started');
    }
    touchpadState.lastTapTime = now;
    return;
}

if (e.type === 'touchmove' && touchpadState.isActivelyZooming && e.touches.length === 1) {
    const deltaY = e.touches[0].clientY - touchpadState.startY;
    
    const zoomEvent = {
        target: e.target,
        deltaY: deltaY * 0.3,
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
        preventDefault: () => {}
    };
    
    performZoom(zoomEvent);
    e.preventDefault();
    return;
}

if (e.type === 'touchend') {
    touchpadState.isActivelyZooming = false;
    console.log('Touchpad zoom actions stopped - Double-tap again to resume');
    // Keep zoomState.isZooming = true so tool stays on
    return;
}
}

function performZoom(e) {
const targetCanvas = e.target;
if (!targetCanvas || (!targetCanvas === baseCanvas && !targetCanvas === paintCanvas && !targetCanvas === samplerCanvas)) return;

const canvasKey = targetCanvas === baseCanvas ? 'base' : targetCanvas === paintCanvas ? 'paint' : 'sampler';
const state = zoomState.canvasStates[canvasKey];
const ctx = targetCanvas.getContext('2d');

const zoomSpeed = 0.01;
const zoomFactor = e.deltaY > 0 ? 1 / (1 + zoomSpeed * Math.abs(e.deltaY)) : 1 + zoomSpeed * Math.abs(e.deltaY);

const oldZoomLevel = state.zoomLevel;
const newZoomLevel = Math.max(0.1, Math.min(4, state.zoomLevel * zoomFactor));
state.hasZoomedIn = newZoomLevel > 1;

if (oldZoomLevel !== newZoomLevel && oldZoomLevel !== 0) {
    const rect = targetCanvas.getBoundingClientRect();
    const cursorX = (e.clientX - rect.left) * (targetCanvas.width / rect.width);
    const cursorY = (e.clientY - rect.top) * (targetCanvas.height / rect.height);
    
    const contentX = (cursorX - state.panX) / oldZoomLevel;
    const contentY = (cursorY - state.panY) / oldZoomLevel;
    
    state.zoomLevel = newZoomLevel;
    state.panX = cursorX - contentX * newZoomLevel;
    state.panY = cursorY - contentY * newZoomLevel;
    
    const { panX, panY } = clampView(state, targetCanvas, cursorX, cursorY);
    state.panX = panX;
    state.panY = panY;
    
    // Trigger redraw
    if (!state.isRedrawing) {
        state.isRedrawing = true;
        requestAnimationFrame(() => {
            // Use existing redraw logic from handleZoomWheel
            state.isRedrawing = false;
        });
    }
}
}

function animateSweeperPlayback(smearData, startTime, duration) {
const currentTime = Date.now();
const elapsed = currentTime - startTime;
const progress = Math.min(elapsed / duration, 1.0);

// Calculate how many anchor points to show
const totalPoints = smearData.sweeperState.anchorPoints.length;
const pointsToShow = Math.max(2, Math.floor(progress * totalPoints));

// Set sweeperState.anchorPoints to only the progressive portion
sweeperState.anchorPoints = smearData.sweeperState.anchorPoints.slice(0, pointsToShow);
inputState.lastTouchPoints = smearData.sweeperState.anchorPoints.slice(0, pointsToShow).map(p => ({x: p.lastX, y: p.lastY}));

// Draw with limited anchor points
drawSweeperLines(smearData.canvasId);

if (progress < 1.0) {
    requestAnimationFrame(() => animateSweeperPlayback(smearData, startTime, duration));
}
}

function drawSweeperLines(canvasId) {
sweeperState.anchorPoints.slice(0, 3).forEach((point, i) => {
    console.log(`  Point ${i}: x=${point.x}, y=${point.y}`);
});

const targetCtx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
const targetCanvas = canvasId === 'base' ? baseCanvas : canvasId === 'paint' ? paintCanvas : samplerCanvas;
const state = zoomState.canvasStates[canvasId];
console.log(`Sweeper on ${canvasId} - Canvas size: ${targetCtx.canvas.width}x${targetCtx.canvas.height}`);

// Get zoom parameters
const zoomLevel = state.zoomLevel || 1;
const panX = state.panX || 0;
const panY = state.panY || 0;

if (sweeperState.anchorPoints.length < 2) {
    console.log("Need at least 2 anchor points for sweeper line");
    if (sweeperState.anchorPoints.length === 1) smearPixels(sweeperState.anchorPoints[0].x, sweeperState.anchorPoints[0].y, canvasId);
    return;
}

// Transform anchor points from screen space to canvas space if zoomed
const transformedAnchorPoints = sweeperState.anchorPoints.map(point => {
    if (zoomLevel !== 1) {
        return {
            ...point,
            x: (point.x - panX) / zoomLevel,
            y: (point.y - panY) / zoomLevel
        };
    }
    return point;
});

// Transform inputState.lastTouchPoints as well
const transformedLastTouchPoints = inputState.lastTouchPoints.map(point => {
    if (!point) return null;
    if (zoomLevel !== 1) {
        return {
            ...point,
            x: (point.x - panX) / zoomLevel,
            y: (point.y - panY) / zoomLevel
        };
    }
    return point;
});

// Cache canvas backups (only create once per drag)
if (!window.canvasBackupsCache || window.lastBackupCanvasId !== canvasId) {
window.canvasBackupsCache = {};
['base', 'paint', 'sampler'].forEach(key => {
    if (key !== canvasId) {
        const ctx = key === 'base' ? baseCtx : key === 'paint' ? paintCtx : samplerCtx;
        const state = zoomState.canvasStates[key];
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        window.canvasBackupsCache[key] = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        // Restore zoom if needed
        if (state.zoomLevel !== 1 || state.panX !== 0 || state.panY !== 0) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.save();
            ctx.translate(state.panX, state.panY);
            ctx.scale(state.zoomLevel, state.zoomLevel);
            ctx.putImageData(window.canvasBackupsCache[key], 0, 0);
            ctx.restore();
        }
    }
});
window.lastBackupCanvasId = canvasId;
}
const canvasBackups = window.canvasBackupsCache;
console.log(`Stored non-target canvas states for ${canvasId} with zoom awareness`);

// Initialize offscreen canvas for zoom-aware painting
if (!state.offscreenCanvas || state.offscreenCanvas.width !== targetCtx.canvas.width || state.offscreenCanvas.height !== targetCtx.canvas.height) {
    state.offscreenCanvas = document.createElement('canvas');
    state.offscreenCanvas.width = targetCtx.canvas.width;
    state.offscreenCanvas.height = targetCtx.canvas.height;
    const offscreenCtx = state.offscreenCanvas.getContext('2d', { alpha: true });
    offscreenCtx.imageSmoothingEnabled = true;
    offscreenCtx.imageSmoothingQuality = 'high';
    if (imageState.currentImageData[canvasId]) {
        offscreenCtx.putImageData(imageState.currentImageData[canvasId], 0, 0);
    }
}
const offscreenCtx = state.offscreenCanvas.getContext('2d', { alpha: true });

// Calculate bounds using ORIGINAL brush size (no scaling needed in canvas space)
const width = Math.max(1, brushState.brushSize);
const halfWidth = Math.floor(width / 2);
let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;

// Use transformed points for bounds calculation
transformedAnchorPoints.forEach(point => {
    if (isNaN(point.x) || isNaN(point.y)) {
        console.error('NaN in anchor point:', point);
        return;
    }
    xMin = Math.min(xMin, Math.floor(point.x - halfWidth));
    xMax = Math.max(xMax, Math.ceil(point.x + halfWidth));
    yMin = Math.min(yMin, Math.floor(point.y - halfWidth));
    yMax = Math.max(yMax, Math.ceil(point.y + halfWidth));
});

xMin = Math.floor(xMin);
xMax = Math.ceil(xMax);
yMin = Math.floor(yMin);
yMax = Math.ceil(yMax);

const canvas = targetCtx.canvas;
xMin = Math.max(0, xMin);
yMin = Math.max(0, yMin);
xMax = Math.min(canvas.width, xMax);
yMax = Math.min(canvas.height, yMax);
console.log(`CLAMP FIX: Bounds clamped to canvas: xMin=${xMin} yMin=${yMin} xMax=${xMax} yMax=${yMax}`);

if (xMax <= xMin || yMax <= yMin) {
    console.error('Invalid bounds in drawSweeperLines:', { xMin, xMax, yMin, yMax });
    // Restore non-target canvases
    Object.keys(canvasBackups).forEach(key => {
        if (canvasBackups[key]) {
            const restoreCtx = key === 'base' ? baseCtx : key === 'paint' ? paintCtx : samplerCtx;
            restoreCtx.putImageData(canvasBackups[key], 0, 0);
            imageState.currentImageData[key] = canvasBackups[key];
            console.log(`Restored ${key} canvas due to invalid bounds`);
        }
    });
    return;
}

// Create temporary canvas for line rendering
const tempCanvas = document.createElement('canvas');
tempCanvas.width = Math.max(1, xMax - xMin);
tempCanvas.height = Math.max(1, yMax - yMin);
const tempCtx = tempCanvas.getContext('2d', { alpha: true });
tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

// Get source data from offscreen canvas
const sourceImageData = offscreenCtx.getImageData(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
const destImageData = tempCtx.createImageData(tempCanvas.width, tempCanvas.height);

// Use transformed points for smear operations
for (let i = 0; i < transformedAnchorPoints.length - 1; i++) {
    const start = transformedLastTouchPoints[i] || transformedAnchorPoints[i];
    const end = transformedLastTouchPoints[i + 1] || transformedAnchorPoints[i + 1];
    const newStart = transformedAnchorPoints[i];
    const newEnd = transformedAnchorPoints[i + 1];
    smearLine(canvasId, start.x, start.y, end.x, end.y, newStart.x, newStart.y, newEnd.x, newEnd.y, sourceImageData, destImageData, xMin, yMin, xMax, yMax);
}

// Apply result to temporary canvas
tempCtx.putImageData(destImageData, 0, 0);

// Update offscreen canvas
const visibleLeft = Math.max(0, xMin);
const visibleTop = Math.max(0, yMin);
const visibleRight = Math.min(targetCtx.canvas.width, xMax);
const visibleBottom = Math.min(targetCtx.canvas.height, yMax);

console.log(`RENDER DEBUG: xMin=${xMin} xMax=${xMax} yMin=${yMin} yMax=${yMax}`);
console.log(`RENDER DEBUG: visibleLeft=${visibleLeft} visibleRight=${visibleRight} visibleTop=${visibleTop} visibleBottom=${visibleBottom}`);
console.log(`RENDER DEBUG: condition=${visibleRight > visibleLeft && visibleBottom > visibleTop}`);

if (visibleRight > visibleLeft && visibleBottom > visibleTop) {
    const sourceX = visibleLeft - xMin;
    const sourceY = visibleTop - yMin;
    const sourceWidth = visibleRight - visibleLeft;
    const sourceHeight = visibleBottom - visibleTop;

    console.log(`RENDER DEBUG: Drawing visible portion!`);
    console.log(`RENDER DEBUG: sourceX=${sourceX} sourceY=${sourceY} sourceWidth=${sourceWidth} sourceHeight=${sourceHeight}`);
    console.log(`RENDER DEBUG: destX=${visibleLeft} destY=${visibleTop}`);

    // Check if tempCanvas has visible content
    const tempImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    let nonTransparentPixels = 0;
    for (let i = 3; i < tempImageData.data.length; i += 4) {
        if (tempImageData.data[i] > 0) nonTransparentPixels++;
    }
    console.log(`RENDER DEBUG: tempCanvas size=${tempCanvas.width}×${tempCanvas.height}, nonTransparentPixels=${nonTransparentPixels}`);

    offscreenCtx.drawImage(
        tempCanvas,
        sourceX, sourceY, sourceWidth, sourceHeight,
        visibleLeft, visibleTop, sourceWidth, sourceHeight
    );
    console.log(`RENDER DEBUG: drawImage completed`);
}

imageState.currentImageData[canvasId] = offscreenCtx.getImageData(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);

console.log(`DISPLAY DEBUG: dragState.isDragging=${dragState.isDragging}, about to render to visible canvas`);

// Restore non-target canvases
Object.keys(canvasBackups).forEach(key => {
    if (canvasBackups[key]) {
        const restoreCtx = key === 'base' ? baseCtx : key === 'paint' ? paintCtx : samplerCtx;
        restoreCtx.putImageData(canvasBackups[key], 0, 0);
        imageState.currentImageData[key] = canvasBackups[key];
        console.log(`Restored ${key} canvas state after drawing on ${canvasId}`);
    }
});

// Update the offscreen canvas with the new content
offscreenCtx.drawImage(tempCanvas, xMin, yMin);

// Always redraw with zoom transformation
targetCtx.setTransform(1, 0, 0, 1, 0, 0);
targetCtx.clearRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
targetCtx.fillStyle = '#FFFFFF';
targetCtx.fillRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
targetCtx.save();
targetCtx.beginPath();
targetCtx.rect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
targetCtx.clip();
targetCtx.translate(panX, panY);
targetCtx.scale(zoomLevel, zoomLevel);
targetCtx.imageSmoothingEnabled = true;
targetCtx.imageSmoothingQuality = 'high';
targetCtx.drawImage(state.offscreenCanvas, 0, 0);
targetCtx.restore();

dragState.hasCanvasChanged = true;

if (recordingState.isRecording) {
    // Record with ORIGINAL anchor points (not transformed)
    recordMovement('smear', {
        lastX: inputState.lastTouchPoints[0]?.x || sweeperState.anchorPoints[0]?.x,
        lastY: inputState.lastTouchPoints[0]?.y || sweeperState.anchorPoints[0]?.y,
        currentX: sweeperState.anchorPoints[0]?.x,
        currentY: sweeperState.anchorPoints[0]?.y,
        canvasId,
        brushShape: brushState.brushShape,
        anchorPoints: sweeperState.anchorPoints.map((p, index) => ({
            x: p.x,
            y: p.y,
            lastX: inputState.lastTouchPoints[index]?.x || p.x,
            lastY: inputState.lastTouchPoints[index]?.y || p.y,
            fingerId: p.id || p.fingerId || `anchor_${index}`,
            target: p.target?.id || 'canvas',
            index: index
        })),
        mouseAnchorStart: sweeperState.mouseAnchorStart ? {
            x: sweeperState.mouseAnchorStart.x,
            y: sweeperState.mouseAnchorStart.y,
            target: sweeperState.mouseAnchorStart.target?.id || 'canvas'
        } : undefined,
        inputType: inputState.touchPoints[0]?.isMouse ? 'mouse' : 'touch',
        fingerCount: sweeperState.anchorPoints.length,
        activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
    });
    console.log(`Recorded complete sweeper gesture with ${sweeperState.anchorPoints.length} anchor points`);
}

console.log('SweeperLines drawn - Pixels processed, Canvas:', canvasId, 'Bounds:', { xMin, xMax, yMin, yMax });
console.log("🔵 SWEEPER COMPLETED - Drew on canvas:", canvasId);
}


function smearLine(canvasId, prevStartX, prevStartY, prevEndX, prevEndY, startX, startY, endX, endY, sourceImageData, destImageData, xMin, yMin, xMax, yMax) {
const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
const canvas = ctx.canvas;
const state = zoomState.canvasStates[canvasId];
const zoomLevel = Math.max(0.1, state.zoomLevel || 1);
const panX = state.panX || 0;
const panY = state.panY || 0;

const mappedPrevStartX = prevStartX;
const mappedPrevStartY = prevStartY;
const mappedPrevEndX = prevEndX;
const mappedPrevEndY = prevEndY;
const mappedStartX = startX;
const mappedStartY = startY;
const mappedEndX = endX;
const mappedEndY = endY;

const dx = mappedPrevEndX - mappedPrevStartX;
const dy = mappedPrevEndY - mappedPrevStartY;
const length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
const steps = Math.ceil(length);
const stepX = dx / steps;
const stepY = dy / steps;

const width = Math.max(1, brushState.brushSize);
const halfWidth = Math.floor(width / 2);
const normX = length ? -dy / length : 0;
const normY = length ? dx / length : 0;

const deltaX = mappedStartX - mappedPrevStartX;
const deltaY = mappedStartY - mappedPrevStartY;

const sourceData = sourceImageData.data;
const destData = destImageData.data;

let pixels = [];
for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const baseX = mappedPrevStartX + t * dx;
    const baseY = mappedPrevStartY + t * dy;
    for (let w = -halfWidth; w <= halfWidth; w++) {
        let x = baseX + w * normX;
        let y = baseY + w * normY;

        const centerX = (mappedPrevStartX + mappedPrevEndX) / 2;
        const centerY = (mappedPrevStartY + mappedPrevEndY) / 2;
        const relX = x - centerX;
        const relY = y - centerY;
        const cosRot = Math.cos(brushState.brushRotation);
        const sinRot = Math.sin(brushState.brushRotation);
        let rotatedX = relX * cosRot - relY * sinRot;
        let rotatedY = relX * sinRot + relY * cosRot;
        x = centerX + rotatedX;
        y = centerY + rotatedY;

        if (flipState.isFlipVerticalActive) {
            y = centerY + (centerY - y);
        }

        const srcX = Math.round(x);
const srcY = Math.round(y);
// SAFE SAMPLING - use edge pixels when outside canvas
const safeSrcX = Math.max(0, Math.min(srcX, canvas.width - 1));
const safeSrcY = Math.max(0, Math.min(srcY, canvas.height - 1));
const pixelI = (safeSrcY * canvas.width + safeSrcX) * 4;;

        if (sourceData[pixelI + 3] === 0) {
            continue;
        }

        let r = sourceData[pixelI] || 0;
        let g = sourceData[pixelI + 1] || 0;
        let b = sourceData[pixelI + 2] || 0;
        let a = sourceData[pixelI + 3] || 255;

        // Remove iridescent color effect for sweeper
        if (brushState.brushShape === 'oilbarrel') {
console.log('OILBARREL END DEBUG:', {
    isDraggingOilbarrel: dragState.isDraggingOilbarrel,
    oilbarrelRafId: dragState.oilbarrelRafId,
    oilbarrelDragState: dragState.oilbarrelDragState,
    anchorPoints: sweeperState.anchorPoints,
    hasCanvasChanged: dragState.hasCanvasChanged
});

            const dist = Math.abs(w) / halfWidth;
            const [h, s, l] = rgbToHsl(r, g, b);
            const hueShift = Math.sin(t * 2 + w * 0.1) * 30 + 16.24;
            const satShift = Math.cos(t * 2) * 20 + 51.87;
            const lightShift = Math.sin(w * 0.1) * 15 + 44.61;
            [r, g, b] = hslToRgb((h + hueShift) % 360, Math.min(100, s + satShift), Math.max(10, Math.min(90, l + lightShift)));
            r = Math.min(255, r + Math.sin(t) * 20);
            g = Math.min(255, g + Math.cos(t) * 20);
        }

        pixels.push({ r, g, b, a, x: srcX, y: srcY });
    }
}

applyEffects(pixels, deltaX, deltaY, mappedPrevStartX, mappedPrevStartY, mappedStartX, mappedStartY);

const hasPositionalEffect = effectStates.isGlitchTideHeld || effectStates.isHyphenHeld || effectStates.isFractalStretchHeld || effectStates.isNeonBendHeld || effectStates.isLockHeld;
pixels.forEach(pixel => {
    let newX = hasPositionalEffect ? Math.round(pixel.x) : Math.round(pixel.x + deltaX);
    let newY = hasPositionalEffect ? Math.round(pixel.y) : Math.round(pixel.y + deltaY);
    newX = Math.max(xMin, Math.min(xMax - 1, newX));
    newY = Math.max(yMin, Math.min(yMax - 1, newY));
    if (newX >= xMin && newX <= xMax && newY >= yMin && newY <= yMax) {
        const destIndex = ((newY - yMin) * (xMax - xMin) + (newX - xMin)) * 4;
        destData[destIndex] = pixel.r;
        destData[destIndex + 1] = pixel.g;
        destData[destIndex + 2] = pixel.b;
        destData[destIndex + 3] = pixel.a;
    }
});
console.log('Sweeper smearLine - Pixels:', pixels.length, 'xMin:', xMin, 'xMax:', xMax, 'Brush:', brushState.brushShape);
}

function drawAestheticLines(canvasId) {
console.log('Drawing aesthetic lines with anchors:', sweeperState.anchorPoints);
const targetCtx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
const targetCanvas = canvasId === 'base' ? baseCanvas : canvasId === 'paint' ? paintCanvas : samplerCanvas;
const state = zoomState.canvasStates[canvasId];
console.log(`AestheticLines on ${canvasId} - Canvas size: ${targetCtx.canvas.width}x${targetCtx.canvas.height}`);

// Get zoom parameters
const zoomLevel = state.zoomLevel || 1;
const panX = state.panX || 0;
const panY = state.panY || 0;

if (sweeperState.anchorPoints.length < 2) {
    console.log("Need at least 2 anchor points for aesthetic lines");
    if (sweeperState.anchorPoints.length === 1) smearPixels(sweeperState.anchorPoints[0].x, sweeperState.anchorPoints[0].y, canvasId);
    return;
}

// Transform anchor points from screen space to canvas space if zoomed
const transformedAnchorPoints = sweeperState.anchorPoints.map(point => {
    if (zoomLevel !== 1) {
        return {
            ...point,
            x: (point.x - panX) / zoomLevel,
            y: (point.y - panY) / zoomLevel
        };
    }
    return point;
});

// Transform inputState.lastTouchPoints as well
const transformedLastTouchPoints = inputState.lastTouchPoints.map(point => {
    if (!point) return null;
    if (zoomLevel !== 1) {
        return {
            ...point,
            x: (point.x - panX) / zoomLevel,
            y: (point.y - panY) / zoomLevel
        };
    }
    return point;
});

// Store non-target canvas states with zoom awareness
const canvasBackups = {};
['base', 'paint', 'sampler'].forEach(key => {
    if (key !== canvasId) {
        const ctx = key === 'base' ? baseCtx : key === 'paint' ? paintCtx : samplerCtx;
        const state = zoomState.canvasStates[key];
        // Get unzoomed content for backup
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        canvasBackups[key] = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        // Restore zoom transform if needed
        if (state.zoomLevel !== 1 || state.panX !== 0 || state.panY !== 0) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.save();
            ctx.translate(state.panX, state.panY);
            ctx.scale(state.zoomLevel, state.zoomLevel);
            ctx.putImageData(canvasBackups[key], 0, 0);
            ctx.restore();
        }
    }
});
console.log(`Stored non-target canvas states for ${canvasId} with zoom awareness`);

// Initialize offscreen canvas for zoom-aware painting
if (!state.offscreenCanvas || state.offscreenCanvas.width !== targetCtx.canvas.width || state.offscreenCanvas.height !== targetCtx.canvas.height) {
    state.offscreenCanvas = document.createElement('canvas');
    state.offscreenCanvas.width = targetCtx.canvas.width;
    state.offscreenCanvas.height = targetCtx.canvas.height;
    const offscreenCtx = state.offscreenCanvas.getContext('2d', { alpha: true });
    offscreenCtx.imageSmoothingEnabled = true;
    offscreenCtx.imageSmoothingQuality = 'high';
    if (imageState.currentImageData[canvasId]) {
        offscreenCtx.putImageData(imageState.currentImageData[canvasId], 0, 0);
    }
}
const offscreenCtx = state.offscreenCanvas.getContext('2d', { alpha: true });

// Calculate bounds using transformed points
const halfBrush = Math.max(brushState.brushSize * 1.5, 5);
let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
transformedAnchorPoints.forEach(point => {
    if (isNaN(point.x) || isNaN(point.y)) {
        console.error('NaN in anchor point:', point);
        return;
    }
    xMin = Math.min(xMin, Math.floor(point.x - halfBrush));
    xMax = Math.max(xMax, Math.ceil(point.x + halfBrush));
    yMin = Math.min(yMin, Math.floor(point.y - halfBrush));
    yMax = Math.max(yMax, Math.ceil(point.y + halfBrush));
});

const visibleXMin = Math.max(0, xMin);
const visibleXMax = Math.min(targetCtx.canvas.width, xMax);
const visibleYMin = Math.max(0, yMin);
const visibleYMax = Math.min(targetCtx.canvas.height, yMax);

// Only fail if completely invalid or no visible area
if (isNaN(xMin) || isNaN(xMax) || isNaN(yMin) || isNaN(yMax) || 
    visibleXMax <= visibleXMin || visibleYMax <= visibleYMin) {
    console.error('Invalid bounds in drawAestheticLines:', { xMin, xMax, yMin, yMax, visibleXMin, visibleXMax, visibleYMin, visibleYMax });
    // Restore non-target canvases
    Object.keys(canvasBackups).forEach(key => {
        if (canvasBackups[key]) {
            const restoreCtx = key === 'base' ? baseCtx : key === 'paint' ? paintCtx : samplerCtx;
            restoreCtx.putImageData(canvasBackups[key], 0, 0);
            imageState.currentImageData[key] = canvasBackups[key];
            console.log(`Restored ${key} canvas due to invalid bounds`);
        }
    });
    return;
}

// Create temp canvas for visible area only
const tempCanvas = document.createElement('canvas');
tempCanvas.width = Math.max(1, visibleXMax - visibleXMin);
tempCanvas.height = Math.max(1, visibleYMax - visibleYMin);
const tempCtx = tempCanvas.getContext('2d', { alpha: true });
tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

// Get source data from offscreen canvas
const sourceImageData = offscreenCtx.getImageData(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
const destImageData = offscreenCtx.getImageData(xMin, yMin, xMax - xMin, yMax - yMin);

// Use transformed points for smear operations
for (let i = 0; i < transformedAnchorPoints.length - 1; i++) {
    const start = transformedLastTouchPoints[i] || transformedAnchorPoints[i];
    const end = transformedLastTouchPoints[i + 1] || transformedAnchorPoints[i + 1];
    const newStart = transformedAnchorPoints[i];
    const newEnd = transformedAnchorPoints[i + 1];
    smearAestheticLines(canvasId, start.x, start.y, end.x, end.y, newStart.x, newStart.y, newEnd.x, newEnd.y, sourceImageData, destImageData, xMin, yMin, xMax, yMax);
}

// Apply result to temporary canvas
tempCtx.putImageData(destImageData, 0, 0);

console.log('TEMP CANVAS SAMPLE - Top-left 10x10 pixels:');
const tempSample = tempCtx.getImageData(0, 0, Math.min(10, tempCanvas.width), Math.min(10, tempCanvas.height));
for (let y = 0; y < Math.min(10, tempCanvas.height); y++) {
    let row = '';
    for (let x = 0; x < Math.min(10, tempCanvas.width); x++) {
        const i = (y * Math.min(10, tempCanvas.width) + x) * 4;
        const r = tempSample.data[i];
        const g = tempSample.data[i + 1]; 
        const b = tempSample.data[i + 2];
        const a = tempSample.data[i + 3];
        row += a > 0 ? `(${r},${g},${b}) ` : '(TRANSP) ';
    }
    console.log(`Row ${y}: ${row}`);
}

// Update offscreen canvas
offscreenCtx.drawImage(tempCanvas, xMin, yMin);
// Store the unzoomed content in imageState.currentImageData
imageState.currentImageData[canvasId] = offscreenCtx.getImageData(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);

// Restore non-target canvases
Object.keys(canvasBackups).forEach(key => {
    if (canvasBackups[key]) {
        const restoreCtx = key === 'base' ? baseCtx : key === 'paint' ? paintCtx : samplerCtx;
        restoreCtx.putImageData(canvasBackups[key], 0, 0);
        imageState.currentImageData[key] = canvasBackups[key];
        console.log(`Restored ${key} canvas state after drawing on ${canvasId}`);
    }
});

// ALWAYS redraw with zoom transformation (removed if (!dragState.isDragging) check)
targetCtx.setTransform(1, 0, 0, 1, 0, 0);
targetCtx.clearRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
targetCtx.fillStyle = '#FFFFFF';
targetCtx.fillRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
targetCtx.save();
targetCtx.beginPath();
targetCtx.rect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
targetCtx.clip();
targetCtx.translate(panX, panY);
targetCtx.scale(zoomLevel, zoomLevel);
targetCtx.imageSmoothingEnabled = true;
targetCtx.imageSmoothingQuality = 'high';
targetCtx.drawImage(state.offscreenCanvas, 0, 0);


targetCtx.restore();

dragState.hasCanvasChanged = true;

if (recordingState.isRecording) {
    // Record with ORIGINAL anchor points (not transformed)
    for (let i = 0; i < sweeperState.anchorPoints.length - 1; i++) {
        recordMovement('smear', { 
            lastX: inputState.lastTouchPoints[i]?.x || sweeperState.anchorPoints[i].x, 
            lastY: inputState.lastTouchPoints[i]?.y || sweeperState.anchorPoints[i].y, 
            currentX: sweeperState.anchorPoints[i].x, 
            currentY: sweeperState.anchorPoints[i].y,
            nextX: sweeperState.anchorPoints[i + 1].x,
            nextY: sweeperState.anchorPoints[i + 1].y,
            canvasId
        });
    }
}
console.log('AestheticLines drawn - Pixels processed, Canvas:', canvasId, 'Bounds:', { xMin, xMax, yMin, yMax });
}

function smearAestheticLines(canvasId, prevStartX, prevStartY, prevEndX, prevEndY, startX, startY, endX, endY, sourceImageData, destImageData, xMin, yMin, xMax, yMax) {
const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
const canvas = ctx.canvas;

const dx = prevEndX - prevStartX;
const dy = prevEndY - prevStartY;
const length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
const steps = Math.ceil(length);
const stepX = dx / steps;
const stepY = dy / steps;

const halfBrush = Math.max(brushState.brushSize * 1.5, 5);
const normX = length ? -dy / length : 0;
const normY = length ? dx / length : 0;

const deltaX = startX - prevStartX;
const deltaY = startY - prevStartY;
const time = Date.now() * 0.005;

const sourceData = sourceImageData.data;
const destData = destImageData.data;

let pixels = [];
for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const baseX = prevStartX + t * dx;
    const baseY = prevStartY + t * dy;
    for (let w = -halfBrush; w <= halfBrush; w++) {
        const swirlAngle = time + (w / halfBrush) * Math.PI;
        const swirlRadius = Math.sin(time + t * Math.PI) * halfBrush * 0.2;
        const swirlX = Math.cos(swirlAngle) * swirlRadius;
        const swirlY = Math.sin(swirlAngle) * swirlRadius;
        let x = baseX + w * normX + swirlX;
        let y = baseY + w * normY + swirlY;

        // Apply rotation
        const centerX = (prevStartX + prevEndX) / 2;
        const centerY = (prevStartY + prevEndY) / 2;
        const relX = x - centerX;
        const relY = y - centerY;
        const cosRot = Math.cos(brushState.brushRotation);
        const sinRot = Math.sin(brushState.brushRotation);
        let rotatedX = relX * cosRot - relY * sinRot;
        let rotatedY = relX * sinRot + relY * cosRot;
        x = centerX + rotatedX;
        y = centerY + rotatedY;

        // Apply vertical flip
        if (flipState.isFlipVerticalActive) {
            y = centerY + (centerY - y); // Flip around center Y
        }

        const srcX = Math.round(Math.max(0, Math.min(canvas.width - 1, x)));
        const srcY = Math.round(Math.max(0, Math.min(canvas.height - 1, y)));
        const pixelI = (srcY * canvas.width + srcX) * 4;
        let r = sourceData[pixelI] || 0;
        let g = sourceData[pixelI + 1] || 0;
        let b = sourceData[pixelI + 2] || 0;

        const dist = Math.abs(w) / halfBrush;
        const [h, s, l] = rgbToHsl(r, g, b);
        const hueShift = Math.sin(time + t * 3 + w * 0.2) * 50 + 20;
        const satShift = Math.cos(time + t * 3) * 30 + 60;
        const lightShift = Math.sin(time + w * 0.2) * 20 + 50;
        [r, g, b] = hslToRgb((h + hueShift) % 360, Math.min(100, s + satShift), Math.max(20, Math.min(90, l + lightShift)));
        r = Math.min(255, r + Math.sin(time + t * 2) * 30);
        g = Math.min(255, g + Math.cos(time + t * 2) * 30);

        pixels.push({ r, g, b, x: srcX, y: srcY });
    }
}

applyEffects(pixels, deltaX, deltaY, prevStartX, prevStartY, startX, startY);

const hasPositionalEffect = effectStates.isGlitchTideHeld || effectStates.isHyphenHeld || effectStates.isFractalStretchHeld || effectStates.isNeonBendHeld || effectStates.isLockHeld;
pixels.forEach(pixel => {
    let newX = hasPositionalEffect ? Math.round(pixel.x) : Math.round(pixel.x + deltaX);
    let newY = hasPositionalEffect ? Math.round(pixel.y) : Math.round(pixel.y + deltaY);
    newX = Math.max(xMin, Math.min(xMax - 1, newX));
    newY = Math.max(yMin, Math.min(yMax - 1, newY));
    if (newX >= xMin && newX <= xMax && newY >= yMin && newY <= yMax) {
        const destIndex = ((newY - yMin) * (xMax - xMin) + (newX - xMin)) * 4;
        destData[destIndex] = pixel.r;
        destData[destIndex + 1] = pixel.g;
        destData[destIndex + 2] = pixel.b;
        destData[destIndex + 3] = 255;
    }
});
console.log('AestheticLines smear - Pixels:', pixels.length, 'xMin:', xMin, 'xMax:', xMax);
}


function applyEffects(pixels, dx, dy, lastX, lastY, currentX, currentY) {
    const isMultiFinger = (brushState.brushShape === 'sweeper' || brushState.brushShape === 'oilbarrel') && sweeperState.anchorPoints.length >= 2;
    const canvasId = inputState.touchPoints[0]?.target === baseCanvas ? 'base' : inputState.touchPoints[0]?.target === paintCanvas ? 'paint' : 'sampler';
    const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
    const halfBrush = brushState.brushSize / 2;

    let flipCenterX, flipCenterY;
    if (isMultiFinger) {
        flipCenterX = sweeperState.anchorPoints.reduce((sum, p) => sum + p.x, 0) / sweeperState.anchorPoints.length;
        flipCenterY = sweeperState.anchorPoints.reduce((sum, p) => sum + p.y, 0) / sweeperState.anchorPoints.length;
    } else {
        flipCenterX = currentX;
        flipCenterY = currentY;
    }

    if (effectStates.isPaintMode) {
        pixels.forEach(pixel => {
            pixel.r = brushState.paintColor.r;
            pixel.g = brushState.paintColor.g;
            pixel.b = brushState.paintColor.b;
        });
    }
    if (effectStates.isBrightenHeld) {
        pixels.forEach(pixel => {
            pixel.r = Math.min(255, pixel.r + 10);
            pixel.g = Math.min(255, pixel.g + 10);
            pixel.b = Math.min(255, pixel.b + 10);
        });
    }

if (effectStates.isDarkenHeld) {
    pixels.forEach(pixel => {
        pixel.r = Math.max(0, pixel.r - 10);
        pixel.g = Math.max(0, pixel.g - 10);
        pixel.b = Math.max(0, pixel.b - 10);
    });
}
if (effectStates.isNeonHeld) {
    animationState.neonPhase = (animationState.neonPhase + 5) % 360;
    const [r, g, b] = hslToRgb(animationState.neonPhase, 75, 65);
    pixels.forEach(pixel => {
        pixel.r = r;
        pixel.g = g;
        pixel.b = b;
    });
}
if (effectStates.isOriginalHeld) {
    if (!imageState.originalImageData[canvasId]) {
        console.warn(`No original image data for ${canvasId}, skipping original effect`);
        return;
    }
    const origData = imageState.originalImageData[canvasId].data;
    const canvasWidth = ctx.canvas.width;
    pixels.forEach(pixel => {
        const srcX = Math.round(pixel.x);
        const srcY = Math.round(pixel.y);
        if (srcX >= 0 && srcX < canvasWidth && srcY >= 0 && srcY < ctx.canvas.height) {
            const i = (srcY * canvasWidth + srcX) * 4;
            if (i >= 0 && i < origData.length) {
                pixel.r = origData[i];
                pixel.g = origData[i + 1];
                pixel.b = origData[i + 2];
                pixel.a = origData[i + 3]; // Preserve original alpha
            }
        }
    });
    console.log(`Original effect applied to ${pixels.length} pixels on ${canvasId}`);
}
if (effectStates.isLockHeld) {
    if (Math.abs(dx) > Math.abs(dy)) {
        pixels.forEach(pixel => pixel.y = dragState.lastY);
    } else {
        pixels.forEach(pixel => pixel.x = dragState.lastX);
    }
}
if (!isMultiFinger && effectStates.isEmojiHeld) {
    animationState.emojiPhase = (animationState.emojiPhase + 1) % emojiFaces.length;
    ctx.font = `${Math.floor(brushState.brushSize)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.fillText(emojiFaces[animationState.emojiPhase], currentX, currentY);
    const halfBrush = brushState.brushSize / 2;
    const xMin = Math.max(0, Math.floor(currentX - halfBrush));
    const xMax = Math.min(ctx.canvas.width - 1, Math.ceil(currentX + halfBrush));
    const yMin = Math.max(0, Math.floor(currentY - halfBrush));
    const yMax = Math.min(ctx.canvas.height - 1, Math.ceil(currentY + halfBrush));
    const updatedImageData = ctx.getImageData(xMin, yMin, xMax - xMin, yMax - yMin);
    pixels.forEach(pixel => {
        const i = ((pixel.y - yMin) * (xMax - xMin) + (pixel.x - xMin)) * 4;
        if (i >= 0 && i < updatedImageData.data.length && updatedImageData.data[i + 3] > 0) {
            pixel.r = updatedImageData.data[i];
            pixel.g = updatedImageData.data[i + 1];
            pixel.b = updatedImageData.data[i + 2];
        }
    });
}
if (effectStates.isHyphenHeld) {
    pixels.forEach(pixel => {
        const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * Math.PI / 2;
        const radius = Math.random() * brushState.brushSize * 0.5;
        pixel.x += Math.cos(angle) * radius;
        pixel.y += Math.sin(angle) * radius;
    });
}
if (effectStates.isTrashHeld) {
    const tempPixels = [...pixels];
    const instanceCount = Math.min(5, Math.floor(brushState.brushSize / 20) + 1);
    for (let j = 0; j < instanceCount; j++) {
        const angle = Math.PI * 2 * j / instanceCount + Math.random() * 0.2;
        const offset = brushState.brushSize * (0.5 + Math.random() * 0.5);
        tempPixels.forEach(pixel => {
            pixels.push({
                r: pixel.r,
                g: pixel.g,
                b: pixel.b,
                x: pixel.x + Math.cos(angle) * offset,
                y: pixel.y + Math.sin(angle) * offset
            });
        });
    }
}
if (effectStates.isFlagHeld && saturationStartTime) {
    const holdTime = (Date.now() - saturationStartTime) / 1000;
    saturationLevel = holdTime * 50;
    pixels.forEach(pixel => {
        const [h, s, l] = rgbToHsl(pixel.r, pixel.g, pixel.b);
        const newH = (h + saturationLevel * 10) % 360;
        const newS = Math.min(100, s + saturationLevel);
        const newL = Math.max(10, Math.min(90, l));
        [pixel.r, pixel.g, pixel.b] = hslToRgb(newH, newS, newL);
    });
}
if (effectStates.isChromaticShiftHeld) {
    animationState.vhsPhase += 0.05;
    pixels.forEach(pixel => {
        pixel.r = Math.min(255, Math.max(0, pixel.r + Math.sin(animationState.vhsPhase) * 20));
        pixel.g = Math.min(255, Math.max(0, pixel.g + Math.cos(animationState.vhsPhase) * 20));
    });
}
if (effectStates.isCausticsHeld && brushState.brushShape !== 'oilbarrel') {
    animationState.vhsPhase += 0.05;
    pixels.forEach(pixel => {
        const distX = (pixel.x - currentX) / brushState.brushSize;
        const distY = (pixel.y - currentY) / brushState.brushSize;
        const caustic = Math.sin(distX * 15 + animationState.vhsPhase) * Math.cos(distY * 15 + animationState.vhsPhase) * 20;
        pixel.r = Math.min(255, Math.max(0, pixel.r + caustic));
        pixel.g = Math.min(255, Math.max(0, pixel.g + caustic));
        pixel.b = Math.min(255, Math.max(0, pixel.b + caustic));
    });
}
if (effectStates.isFractalStretchHeld) {
    const time = Date.now() * 0.001;
    const halfBrush = brushState.brushSize / 2;
    pixels.forEach(pixel => {
        const dx = pixel.x - currentX;
        const dy = pixel.y - currentY;
        if (isPixelInBrushShape(pixel.x, pixel.y, currentX, currentY, halfBrush)) {
            const angle = Math.atan2(dy, dx) + time;
            const swirlX = (brushState.brushShape === 'rectangle' ? halfBrush * 1.5 : halfBrush) * Math.sin(time + dx * 0.1) * 0.3;
            const swirlY = (brushState.brushShape === 'rectangle' ? halfBrush * 0.5 : halfBrush) * Math.cos(time + dy * 0.1) * 0.3;
            const newX = currentX + Math.cos(angle) * Math.abs(dx) + swirlX;
            const newY = currentY + Math.sin(angle) * Math.abs(dy) + swirlY;
            if (isPixelInBrushShape(newX, newY, currentX, currentY, halfBrush)) {
                pixel.x = newX;
                pixel.y = newY;
                pixel.r = Math.min(255, Math.max(0, pixel.r + Math.sin(dx * 0.02 + time) * 30));
                pixel.g = Math.min(255, Math.max(0, pixel.g + Math.cos(dy * 0.02 + time) * 30));
                pixel.b = Math.min(255, Math.max(0, pixel.b + Math.sin(time) * 20));
            }
        }
    });
}
if (effectStates.isNeonBendHeld) {
    const time = Date.now() * 0.001;
    const halfBrush = brushState.brushSize / 2;
    pixels.forEach(pixel => {
        const dx = pixel.x - currentX;
        const dy = pixel.y - currentY;
        if (isPixelInBrushShape(pixel.x, pixel.y, currentX, currentY, halfBrush)) {
            const angle = Math.atan2(dy, dx) + time;
            const offsetX = (brushState.brushShape === 'rectangle' ? halfBrush * 1.5 : halfBrush) * Math.cos(time + dx * 0.1) * 0.5;
            const offsetY = (brushState.brushShape === 'rectangle' ? halfBrush * 0.5 : halfBrush) * Math.sin(time + dy * 0.1) * 0.5;
            const newX = currentX + Math.cos(angle) * Math.abs(dx) + offsetX;
            const newY = currentY + Math.sin(angle) * Math.abs(dy) + offsetY;
            if (isPixelInBrushShape(newX, newY, currentX, currentY, halfBrush)) {
                pixel.x = newX;
                pixel.y = newY;
                if (Math.random() < 0.01) {
                    pixel.r = 255;
                    pixel.g = 255;
                    pixel.b = 255;
                } else {
                    pixel.r = Math.max(0, Math.min(255, pixel.r * 0.7 + Math.sin(time + dx * 0.01) * 15));
                    pixel.g = Math.max(0, Math.min(255, pixel.g * 0.6 + Math.cos(time + dy * 0.01) * 10));
                    pixel.b = Math.max(0, Math.min(255, pixel.b * 0.8 + Math.sin(time + 2) * 20));
                }
            }
        }
    });
}
if (effectStates.isGlitchTideHeld) {
const time = Date.now() * 0.001;
const sinTime = Math.sin(time); // Cache the calculation
const cosTime = Math.cos(time); // Cache the calculation
const shiftAmount = sinTime * brushState.brushSize * 2; // Cache this too

pixels.forEach(pixel => {
    const dy = pixel.y - currentY;
    const timeDy = time + dy * 0.3;
    
    // Bold color glitch (exactly same effect)
    pixel.r = Math.min(255, Math.max(0, pixel.r + Math.sin(timeDy) * 50));
    pixel.g = Math.min(255, Math.max(0, pixel.g + Math.cos(timeDy) * 50));
    pixel.b = Math.min(255, Math.max(0, pixel.b + Math.random() * 30));
    
    // Position shift (from the second glitchTide block)
    pixel.x += Math.sin(timeDy) * brushState.brushSize * 2;
    pixel.r = Math.min(255, Math.max(0, pixel.r + sinTime * 30));
});

// Single log instead of per-pixel logging
console.log('Glitch Tide applied to', pixels.length, 'pixels - Shift:', shiftAmount);
}
if (effectStates.isPhotoCRTHeld) {
    const time = Date.now() * 0.005;
    pixels.forEach(pixel => {
        const shift = Math.floor(Math.random() * 4 - 2);
        pixel.r = Math.min(255, pixel.r + shift * 10);
        pixel.g = Math.max(0, pixel.g - shift * 8);
        pixel.b = Math.min(255, pixel.b + shift * 12);
        if (Math.floor(pixel.y) % 5 === 0) {
            pixel.x += Math.sin(pixel.y * 0.3 + time) * 5;
        }
        if (Math.floor(pixel.x) % 20 === 0) {
            pixel.y += Math.cos(pixel.x * 0.1 + time) * 4;
        }
    });
}
if (effectStates.isPointBreakHeld) {
const time = Date.now() * 0.001;
pixels.forEach(pixel => {
    const dyNorm = (pixel.y - currentY) / brushState.brushSize;
    pixel.x += Math.sin(time + dyNorm * 3) * brushState.brushSize * 0.5;
    pixel.r = Math.min(255, Math.max(0, pixel.r + Math.sin(time) * 30));
});
}
if (effectStates.isFlickerNegativeHeld) {
    const now = performance.now();
    if (!animationState.lastFlickerUpdate || now - animationState.lastFlickerUpdate > 16) { // ~60fps
        animationState.flickerPhase += 0.5;
        animationState.lastFlickerUpdate = now;
        const shouldInvert = Math.floor(animationState.flickerPhase) % 2 === 0;
        const samplePixel = pixels[0] || { r: 0, g: 0, b: 0 };
        const originalRGB = `(${samplePixel.r}, ${samplePixel.g}, ${samplePixel.b})`;
        pixels.forEach(pixel => {
            if (shouldInvert) {
                pixel.r = 255 - pixel.r;
                pixel.g = 255 - pixel.g;
                pixel.b = 255 - pixel.b;
            }
        });
        const modifiedRGB = pixels[0] ? `(${pixels[0].r}, ${pixels[0].g}, ${pixels[0].b})` : 'N/A';
        console.log(`FlickerNegative applied - Inverted: ${shouldInvert}, Phase: ${animationState.flickerPhase}, SamplePixel: ${originalRGB} -> ${modifiedRGB}`);
    }
}
if (effectStates.isScatterHeld) {
// Handled by applyScatterEffect in smearPixels to avoid recursion
console.log('Scatter effect queued for smearPixels');
}
if (effectStates.isBinaryRainHeld) {
const halfBrush = brushState.brushSize / 2;
const outerRadius = halfBrush * 1.8; // Extend 1.8x for a wide surrounding effect
const xMin = Math.max(0, Math.floor(currentX - outerRadius));
const xMax = Math.min(ctx.canvas.width - 1, Math.ceil(currentX + outerRadius));
const yMin = Math.max(0, Math.floor(currentY - outerRadius));
const yMax = Math.min(ctx.canvas.height - 1, Math.ceil(currentY + outerRadius));

// Set up drawing context for binary rain
ctx.font = `${Math.floor(brushState.brushSize / 3)}px monospace`;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// Calculate number of binary characters for the outer ring
const charDensity = Math.max(10, Math.floor(brushState.brushSize / 6)); // Dense but not overwhelming

// Draw binary characters in the outer ring
for (let i = 0; i < charDensity; i++) {
    // Random angle and radius for radial distribution
    const angle = Math.random() * 2 * Math.PI;
    const radius = halfBrush * 1.1 + Math.random() * (outerRadius - halfBrush * 1.1); // Start just outside brush
    const offsetX = Math.cos(angle) * radius;
    const offsetY = Math.sin(angle) * radius;
    const newX = currentX + offsetX;
    const newY = currentY + offsetY;

    // Ensure position is OUTSIDE brush and within canvas bounds
    if (!isPixelInBrushShape(newX, newY, currentX, currentY, halfBrush) &&
        newX >= xMin && newX <= xMax && newY >= yMin && newY <= yMax) {
        // Sample color from canvas at the character's position
        const pixelData = ctx.getImageData(Math.floor(newX), Math.floor(newY), 1, 1).data;
        const r = pixelData[0] || 255; // Fallback to white if no data
        const g = pixelData[1] || 255;
        const b = pixelData[2] || 255;

        // Draw random binary character (0 or 1)
        const binaryChar = Math.random() > 0.5 ? '1' : '0';
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillText(binaryChar, newX, newY);
    }
}

// Update imageState.currentImageData to reflect changes
imageState.currentImageData[canvasId] = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
console.log(`BinaryRain applied: ${charDensity} characters attempted OUTSIDE brush at (${currentX}, ${currentY})`);
}
}


function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s * 100, l * 100];
}

function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}


/**
 * Smear pixels from one location to another
 * @param {number} currentX - Current X position
 * @param {number} currentY - Current Y position
 * @param {string} canvasId - Canvas identifier
 * @param {number} sourceX - Source X position (optional)
 * @param {number} sourceY - Source Y position (optional)
 * @param {string} stickerSlot - Sticker slot identifier (optional)
 * @param {HTMLCanvasElement} sourceCanvas - Source canvas element (optional)
 */
export function smearPixels(currentX, currentY, canvasId, sourceX, sourceY, stickerSlot, sourceCanvas) {
const targetCtx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
const sourceCtx = sourceCanvas ? (sourceCanvas === baseCanvas ? baseCtx : sourceCanvas === paintCanvas ? paintCtx : samplerCtx) : targetCtx;
const sourceCanvasObj = sourceCanvas || targetCtx.canvas;
const state = zoomState.canvasStates[canvasId];

if (isNaN(currentX) || isNaN(currentY)) {
    console.error('Invalid coordinates in smearPixels:', { currentX, currentY });
    return;
}
if (isNaN(brushState.brushSize) || brushState.brushSize <= 0) {
    console.error('Invalid brushState.brushSize in smearPixels:', brushState.brushSize);
    brushState.brushSize = brushState.baseBrushSize || 50;
}

// Get zoom and pan from canvas state
const zoomLevel = Math.max(0.1, state.zoomLevel || 1);
const panX = state.panX || 0;
const panY = state.panY || 0;

// Transform input coordinates to canvas space (already done in getCanvasCoordinates)
// CurrentX and currentY are in canvas space, so no further transformation needed here
const mappedX = currentX;
const mappedY = currentY;

// Transform source coordinates to canvas space if provided
let mappedSourceX = sourceX;
let mappedSourceY = sourceY;
if (sourceX !== undefined && sourceY !== undefined) {
    // Source coordinates are in screen space, transform to canvas space
    mappedSourceX = (sourceX - panX) / zoomLevel;
    mappedSourceY = (sourceY - panY) / zoomLevel;
}

// Use brush size directly - coordinates are already transformed
const mappedBrushSize = brushState.brushSize;
const halfBrush = mappedBrushSize / 2;

// Calculate bounds in canvas space
const xMin = Math.max(0, Math.floor(mappedX - halfBrush));
const xMax = Math.min(targetCtx.canvas.width - 1, Math.ceil(mappedX + halfBrush));
const yMin = Math.max(0, Math.floor(mappedY - halfBrush));
const yMax = Math.min(targetCtx.canvas.height - 1, Math.ceil(mappedY + halfBrush));

// Initialize offscreen canvas for painting
if (!state.offscreenCanvas || state.offscreenCanvas.width !== targetCtx.canvas.width || state.offscreenCanvas.height !== targetCtx.canvas.height) {
state.offscreenCanvas = document.createElement('canvas');
state.offscreenCanvas.width = targetCtx.canvas.width;
state.offscreenCanvas.height = targetCtx.canvas.height;
const offscreenCtx = state.offscreenCanvas.getContext('2d', { alpha: true });
offscreenCtx.imageSmoothingEnabled = true;
offscreenCtx.imageSmoothingQuality = 'high';

// Get unzoomed content from the display canvas
targetCtx.save();
targetCtx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
const unzoomedData = targetCtx.getImageData(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
targetCtx.restore();

// Initialize offscreen with unzoomed content
offscreenCtx.putImageData(unzoomedData, 0, 0);

// Update imageState.currentImageData with the correct unzoomed data
imageState.currentImageData[canvasId] = unzoomedData;
}
const offscreenCtx = state.offscreenCanvas.getContext('2d', { alpha: true });

// Create temporary canvas for brush application
const tempCanvas = document.createElement('canvas');
tempCanvas.width = Math.max(1, xMax - xMin);
tempCanvas.height = Math.max(1, yMax - yMin);
const tempCtx = tempCanvas.getContext('2d', { alpha: true });
tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

let pixels = [];
const isTeleportClone = effectStates.isTeleportHeld && sourceCanvas && sourceCanvas !== targetCtx.canvas;
const step = effectStates.isDitherVibeHeld && brushState.brushShape !== 'stickerMode' && mappedBrushSize > 50 ? Math.ceil(mappedBrushSize / 50) : 1;

if (brushState.brushShape === 'stickerMode') {
    let stampPixels = [];
    if (stickerSlot && stickerImages[stickerSlot]) {
        let stickerImg = stickerImages[stickerSlot];
        if (flipState.isFlipHorizontalActive && flippedStampImages[stickerSlot]?.horizontal) {
            stickerImg = flippedStampImages[stickerSlot].horizontal;
        } else if (flipState.isFlipVerticalActive && flippedStampImages[stickerSlot]?.vertical) {
            stickerImg = flippedStampImages[stickerSlot].vertical;
        }
        const aspectRatio = stickerImg.height / stickerImg.width;
        let stickerWidth = stickerImg.width;
        let stickerHeight = stickerImg.height;
        const effectiveSize = isTeleportClone ? brushState.cloneBrushSize : brushState.brushSize;
        const effectiveRotation = isTeleportClone ? brushState.cloneBrushRotation : brushState.brushRotation;
        if (stickerWidth > stickerHeight) {
stickerWidth = effectiveSize;
stickerHeight = effectiveSize * aspectRatio;
} else {
stickerHeight = effectiveSize;
stickerWidth = effectiveSize / aspectRatio;
}
        const drawX = mappedX;
        const drawY = mappedY;
        const offsetX = Math.round(drawX - stickerWidth / 2);
        const offsetY = Math.round(drawY - stickerHeight / 2);

        if (isTeleportClone && (isNaN(mappedSourceX) || isNaN(mappedSourceY) || 
            mappedSourceX < 0 || mappedSourceY < 0 || mappedSourceX >= sourceCanvasObj.width || mappedSourceY >= sourceCanvasObj.height)) {
            console.warn('Invalid teleport source coordinates for stamp cloning, skipping:', { mappedSourceX, mappedSourceY, canvasId });
            return;
        }

        tempCtx.save();
        tempCtx.translate(drawX - offsetX, drawY - offsetY);
        tempCtx.rotate(effectiveRotation);
        tempCtx.drawImage(stickerImg, -stickerWidth / 2, -stickerHeight / 2, stickerWidth, stickerHeight);
        tempCtx.restore();

        console.log(`Drawing ${stickerSlot} at X: ${drawX}, Y: ${drawY}, Size: ${stickerWidth}x${stickerHeight}, Rotation: ${effectiveRotation}, Clone: ${isTeleportClone}`);

        const stampData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        for (let y = 0; y < tempCanvas.height; y++) {
            for (let x = 0; x < tempCanvas.width; x++) {
                const i = (y * tempCanvas.width + x) * 4;
                if (stampData.data[i + 3] > 0) {
                    const canvasX = x + offsetX;
                    const canvasY = y + offsetY;
                    if (canvasX >= 0 && canvasX < targetCtx.canvas.width && canvasY >= 0 && canvasY < targetCtx.canvas.height) {
                        stampPixels.push({
                            r: stampData.data[i],
                            g: stampData.data[i + 1],
                            b: stampData.data[i + 2],
                            x: canvasX,
                            y: canvasY
                        });
                    }
                }
            }
        }
    }
    if (stampPixels.length > 0) {
        applyEffects(stampPixels, 0, 0, dragState.lastX || mappedX, dragState.lastY || mappedY, mappedX, mappedY);
        pixels = stampPixels;
    }
} else if (brushState.brushShape === 'melt' || (brushState.brushShape === 'melt' && effectStates.isTeleportHeld)) {
    const firstFinger = inputState.touchPoints.find(tp => tp.id === teleportState.teleportFirstFinger) || inputState.touchPoints[0];
    let meltDirection = 1;
    let endY = targetCtx.canvas.height - 1;
    if (inputState.touchPoints.length >= 2) {
        const secondFinger = inputState.touchPoints[1];
        meltDirection = secondFinger.y < firstFinger.y ? -1 : 1;
        endY = meltDirection === 1 ? targetCtx.canvas.height - 1 : 0;
    }
    const drawX = isTeleportClone ? mappedSourceX : mappedX;
    const drawY = isTeleportClone ? mappedSourceY : mappedY;
    const effectiveHalfBrush = Math.max(halfBrush, 3);
    const effectiveXMin = Math.max(0, Math.floor(drawX - effectiveHalfBrush));
    const effectiveXMax = Math.min(sourceCanvasObj.width - 1, Math.ceil(drawX + effectiveHalfBrush));
    const effectiveYMin = Math.max(0, Math.floor(drawY - effectiveHalfBrush));
    const effectiveYMax = Math.min(sourceCanvasObj.height - 1, Math.ceil(drawY + effectiveHalfBrush));

    const renderYMin = Math.max(0, Math.floor(drawY - effectiveHalfBrush));
    const renderYMax = meltDirection === 1 ? sourceCanvasObj.height : Math.ceil(drawY + effectiveHalfBrush);
    tempCanvas.width = effectiveXMax - effectiveXMin;
    tempCanvas.height = renderYMax - renderYMin;
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

    let sourceImageData;
    try {
        sourceImageData = sourceCtx.getImageData(effectiveXMin, effectiveYMin, effectiveXMax - effectiveXMin, effectiveYMax - effectiveYMin);
    } catch (e) {
        console.error(`Failed to get sourceImageData for melt:`, e);
        return;
    }
    const sourceData = sourceImageData.data;
    const maxPixels = effectStates.isDitherVibeHeld ? 50000 : 100000;
    let pixelCount = 0;
    let sourcePixels = [];
    for (let y = 0; y < effectiveYMax - effectiveYMin; y += step) {
        for (let x = 0; x < effectiveXMax - effectiveXMin; x += step) {
            if (pixelCount >= maxPixels) break;
            const canvasX = x + effectiveXMin;
            const canvasY = y + effectiveYMin;
            if (isPixelInBrushShape(canvasX, canvasY, drawX, drawY, effectiveHalfBrush)) {
                const srcIndex = (y * (effectiveXMax - effectiveXMin) + x) * 4;
                const r = sourceData[srcIndex] || 0;
                const g = sourceData[srcIndex + 1] || 0;
                const b = sourceData[srcIndex + 2] || 0;
                if (r || g || b || sourceData[srcIndex + 3] > 0) {
                    sourcePixels.push({ r, g, b, x: canvasX, y: canvasY });
                    pixelCount++;
                }
            }
        }
    }
    pixelCount = 0;
    sourcePixels.forEach(pixel => {
        if (pixelCount >= maxPixels) return;
        const cosRot = Math.cos(brushState.brushRotation);
        const sinRot = Math.sin(brushState.brushRotation);
        const relX = pixel.x - drawX;
        const relY = pixel.y - drawY;
        const rotatedX = relX * cosRot - relY * sinRot;
        const rotatedY = relX * sinRot + relY * cosRot;
        const baseDestX = Math.round(drawX + rotatedX);
        const baseDestY = Math.round(drawY + rotatedY);
        const bleedDistance = Math.abs(endY - baseDestY);
        const steps = Math.ceil(bleedDistance / 5);
        const stepY = meltDirection * bleedDistance / steps;
        for (let i = 0; i <= steps; i += step) {
            if (pixelCount >= maxPixels) break;
            const destX = baseDestX;
            let destY = Math.round(baseDestY + stepY * i);
            if (meltDirection === -1 && destY < 0) destY = 0;
            const finalX = isTeleportClone ? mappedX + (destX - mappedSourceX) : destX;
            const finalY = isTeleportClone ? mappedY + (destY - mappedSourceY) : destY;
            if (finalX >= 0 && finalX < targetCtx.canvas.width && finalY >= 0 && finalY < targetCtx.canvas.height) {
                pixels.push({ r: pixel.r, g: pixel.b, b: pixel.b, x: finalX, y: finalY });
                pixelCount++;
            }
        }
    });
    console.log(`Melt brush applied${isTeleportClone ? ' (cloned)' : ''}: ${pixels.length} pixels, direction: ${meltDirection}`);
} else if (brushState.brushShape === 'brokenScreen' || (brushState.brushShape === 'brokenScreen' && effectStates.isTeleportHeld)) {
    let holdTime;
    if (recordingState.isRecording && recordingState.currentMovement) {
        holdTime = recordingState.currentMovement.holdTime || 0.5;
    } else {
        const firstFinger = inputState.touchPoints.find(tp => tp.id === teleportState.teleportFirstFinger) || inputState.touchPoints[0];
        holdTime = firstFinger ? (Date.now() - firstFinger.startTime) / 1000 : 0.5;
    }
    const meltSpeed = 5000 * holdTime;
    let meltDirection = 1;
    if (inputState.touchPoints.length >= 2) {
        const secondFinger = inputState.touchPoints[1];
        meltDirection = secondFinger.y < (inputState.touchPoints[0]?.y || mappedY) ? -1 : 1;
    }
    const drawX = isTeleportClone ? mappedSourceX : mappedX;
    const drawY = isTeleportClone ? mappedSourceY : mappedY;
    let sourceImageData;
    try {
        sourceImageData = sourceCtx.getImageData(xMin, yMin, xMax - xMin, yMax - yMin);
    } catch (e) {
        console.error(`Failed to get sourceImageData for brokenScreen:`, e);
        return;
    }
    const sourceData = sourceImageData.data;
    const maxPixels = effectStates.isDitherVibeHeld ? 50000 : 100000;
    let pixelCount = 0;
    for (let y = 0; y < yMax - yMin; y += step) {
        for (let x = 0; x < xMax - xMin; x += step) {
            if (pixelCount >= maxPixels) break;
            const canvasX = x + xMin;
            const canvasY = y + yMin;
            if (isPixelInBrushShape(canvasX, canvasY, drawX, drawY, halfBrush)) {
                const srcIndex = (y * (xMax - xMin) + x) * 4;
                const r = sourceData[srcIndex] || 0;
                const g = sourceData[srcIndex + 1] || 0;
                const b = sourceData[srcIndex + 2] || 0;
                if (r || g || b || sourceData[srcIndex + 3] > 0) {
                    const cosRot = Math.cos(brushState.brushRotation);
                    const sinRot = Math.sin(brushState.brushRotation);
                    const relX = canvasX - drawX;
                    const relY = canvasY - drawY;
                    const rotatedX = relX * cosRot - relY * sinRot;
                    const rotatedY = relX * sinRot + relY * cosRot;
                    const baseDestX = Math.round(drawX + rotatedX);
                    const baseDestY = Math.round(drawY + rotatedY);
                    const baseYForDistance = drawY + relY;
                    const endY = meltDirection === 1 ? sourceCanvasObj.height - 1 : 0;
                    const bleedDistance = Math.min(meltSpeed, Math.abs(endY - baseYForDistance));
                    const steps = Math.ceil(bleedDistance);
                    const stepY = meltDirection * bleedDistance / steps;
                    for (let i = 0; i <= steps; i += step) {
                        if (pixelCount >= maxPixels) break;
                        const destX = baseDestX;
                        let destY = Math.round(baseDestY + stepY * i);
                        if (meltDirection === 1 && destY > endY) destY = endY;
                        if (meltDirection === -1 && destY < endY) destY = endY;
                        const finalX = isTeleportClone ? mappedX + (destX - mappedSourceX) : destX;
                        const finalY = isTeleportClone ? mappedY + (destY - mappedSourceY) : destY;
                        if (finalX >= 0 && finalX < targetCtx.canvas.width && finalY >= 0 && finalY < targetCtx.canvas.height) {
                            pixels.push({ r, g, b, x: finalX, y: finalY });
                            pixelCount++;
                        }
                    }
                }
            }
        }
    }
    if (recordingState.isRecording && recordingState.currentMovement) {
        recordingState.currentMovement.holdTime = holdTime;
    }
    console.log(`BrokenScreen brush applied${isTeleportClone ? ' (cloned)' : ''}: ${pixels.length} pixels`);
} else if (brushState.brushShape === 'jazzScatter') {
const drawX = isTeleportClone ? mappedSourceX : mappedX;
const drawY = isTeleportClone ? mappedSourceY : mappedY;
console.log(`Jazz Scatter triggered - Canvas: ${canvasId}, Position: (${drawX}, ${drawY}), BrushSize: ${mappedBrushSize}, Clone: ${isTeleportClone}`);
const sampleRadius = halfBrush * 0.5;
const sampleXMin = Math.max(0, Math.floor(drawX - sampleRadius));
const sampleXMax = Math.min(sourceCanvasObj.width - 1, Math.ceil(drawX + sampleRadius));
const sampleYMin = Math.max(0, Math.floor(drawY - sampleRadius));
const sampleYMax = Math.min(sourceCanvasObj.height - 1, Math.ceil(drawY + sampleRadius));
let sourceImageData;
try {
    console.log(`Sampling colors from (${sampleXMin}, ${sampleYMin}) to (${sampleXMax}, ${sampleYMax}) on ${sourceCanvasObj.id}`);
    sourceImageData = sourceCtx.getImageData(sampleXMin, sampleYMin, sampleXMax - sampleXMin, sampleYMax - sampleYMin);
} catch (e) {
    console.error('Failed to get sourceImageData for jazzScatter:', e);
    sourceImageData = sourceCtx.createImageData(sampleXMax - sampleXMin, sampleYMax - sampleYMin);
    for (let i = 0; i < sourceImageData.data.length; i += 4) {
        sourceImageData.data[i] = 255;
        sourceImageData.data[i + 1] = 20;
        sourceImageData.data[i + 2] = 147;
        sourceImageData.data[i + 3] = 255;
    }
}
const sourceData = sourceImageData.data;
const colorCounts = {};
for (let i = 0; i < sourceData.length; i += 4) {
    if (sourceData[i + 3] > 0) {
        const r = sourceData[i];
        const g = sourceData[i + 1];
        const b = sourceData[i + 2];
        const colorKey = `${r},${g},${b}`;
        colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
    }
}
const sortedColors = Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([colorKey]) => {
        const [r, g, b] = colorKey.split(',').map(Number);
        return { r, g, b };
    });
const dominantColors = sortedColors.length > 0 ? sortedColors : [{ r: 255, g: 20, b: 147 }];
const numShapes = Math.floor(Math.random() * 20) + 5; // Reduced to 5-25 for sparse scatter
const scatterRadius = halfBrush * 5.0; // Increased to 5.0 for very wide scatter
for (let i = 0; i < numShapes; i++) {
    const width = mappedBrushSize * (0.1 + Math.random() * 0.3);
    const height = mappedBrushSize * (0.1 + Math.random() * 0.3);
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.pow(Math.random(), 2.0) * scatterRadius; // Stronger bias for irregular spread
    let shapeX = drawX + Math.cos(angle) * distance;
    let shapeY = drawY + Math.sin(angle) * distance;
    let posOffsetX = 0;
    let posOffsetY = 0;
    const time = Date.now() * 0.001;
    if (effectStates.isFractalStretchHeld) {
        const dx = shapeX - drawX;
        const dy = shapeY - drawY;
        posOffsetX = Math.sin(time + dx * 0.1) * halfBrush * 0.5;
        posOffsetY = Math.cos(time + dy * 0.1) * halfBrush * 0.5;
        shapeX += posOffsetX;
        shapeY += posOffsetY;
    }
    if (effectStates.isGlitchTideHeld) {
        const dy = shapeY - drawY;
        posOffsetX = Math.sin(time + dy * 0.3) * mappedBrushSize * 0.5;
        posOffsetY = Math.random() * halfBrush * 0.2;
        shapeX += posOffsetX;
        shapeY += posOffsetY;
    }
    const finalX = isTeleportClone ? mappedX + (shapeX - mappedSourceX) : shapeX;
    const finalY = isTeleportClone ? mappedY + (shapeY - mappedSourceY) : shapeY;
    if (finalX < 0 || finalX >= targetCtx.canvas.width || finalY < 0 || finalY >= targetCtx.canvas.height) {
        console.log(`Skipping shape ${i + 1} - Outside target canvas: (${finalX}, ${finalY})`);
        continue;
    }
    const color = dominantColors[i % dominantColors.length];
    const effectPixel = [{ r: color.r, g: color.g, b: color.b, x: finalX, y: finalY, a: 255 }];
    applyEffects(effectPixel, 0, 0, drawX, drawY, mappedX, mappedY);
    const effectColor = effectPixel[0];
    tempCtx.fillStyle = `rgb(${effectColor.r},${effectColor.g},${effectColor.b})`;
    tempCtx.save();
    tempCtx.translate(finalX - xMin, finalY - yMin);
    tempCtx.rotate(brushState.brushRotation);
    tempCtx.fillRect(-width / 2, -height / 2, width, height);
    tempCtx.restore();
}
const shapeData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
for (let y = 0; y < tempCanvas.height; y += step) {
    for (let x = 0; x < tempCanvas.width; x += step) {
        const i = (y * tempCanvas.width + x) * 4;
        if (shapeData.data[i + 3] > 0) {
            const canvasX = x + xMin;
            const canvasY = y + yMin;
            pixels.push({ r: shapeData.data[i], g: shapeData.data[i + 1], b: shapeData.data[i + 2], x: canvasX, y: canvasY });
        }
    }
}
console.log(`Jazz Scatter rendered${isTeleportClone ? ' (cloned)' : ''}: ${numShapes} shapes, ${pixels.length} pixels`);
} else if (flippedBrushSnapshot && (flipState.isFlipHorizontalActive || flipState.isFlipVerticalActive)) {
    for (let y = 0; y < flippedBrushHeight; y += step) {
        for (let x = 0; x < flippedBrushWidth; x += step) {
            const srcIndex = (y * flippedBrushWidth + x) * 4;
            const r = flippedBrushSnapshot.data[srcIndex];
            const g = flippedBrushSnapshot.data[srcIndex + 1];
            const b = flippedBrushSnapshot.data[srcIndex + 2];
            const relX = x - flippedBrushWidth / 2;
            const relY = y - flippedBrushHeight / 2;
            const rotatedX = relX * Math.cos(brushState.brushRotation) - relY * Math.sin(brushState.brushRotation);
            const rotatedY = relX * Math.sin(brushState.brushRotation) + relY * Math.cos(brushState.brushRotation);
            const destX = Math.round(mappedX + rotatedX);
            const destY = Math.round(mappedY + rotatedY);
            if (destX >= xMin && destX < xMax && destY >= yMin && destY < yMax && 
                isPixelInBrushShape(destX, destY, mappedX, mappedY, halfBrush)) {
                pixels.push({ r, g, b, x: destX, y: destY });
            }
        }
    }
} else if (brushState.brushShape === 'tv') {
    let sourceImageData;
    try {
        sourceImageData = sourceCtx.getImageData(xMin, yMin, xMax - xMin, yMax - yMin);
    } catch (e) {
        console.error(`Failed to get sourceImageData for tv:`, e);
        return;
    }
    const sourceData = sourceImageData.data;
    for (let y = 0; y < yMax - yMin; y += step) {
        for (let x = 0; x < xMax - xMin; x += step) {
            const canvasX = x + xMin;
            const canvasY = y + yMin;
            if (isPixelInBrushShape(canvasX, canvasY, mappedX, mappedY, halfBrush)) {
                const srcIndex = (y * (xMax - xMin) + x) * 4;
                let gray = 128;
                if (sourceData[srcIndex + 3] > 0) {
                    gray = (sourceData[srcIndex] + sourceData[srcIndex + 1] + sourceData[srcIndex + 2]) / 3;
                }
                const noise = (Math.random() - 0.5) * 50;
                const relX = canvasX - mappedX;
                const relY = canvasY - mappedY;
                const rotatedX = relX * Math.cos(brushState.brushRotation) - relY * Math.sin(brushState.brushRotation);
                const rotatedY = relX * Math.sin(brushState.brushRotation) + relY * Math.cos(brushState.brushRotation);
                const destX = Math.round(mappedX + rotatedX);
                const destY = Math.round(mappedY + rotatedY);
                if (destX >= 0 && destX < targetCtx.canvas.width && destY >= 0 && destY < targetCtx.canvas.height) {
                    pixels.push({ r: gray + noise, g: gray + noise, b: gray + noise, x: destX, y: destY });
                }
            }
        }
    }
    console.log(`TV brush applied: ${pixels.length} pixels`);
} else if (brushState.brushShape === 'negative') {
    let sourceImageData;
    try {
        sourceImageData = sourceCtx.getImageData(xMin, yMin, xMax - xMin, yMax - yMin);
    } catch (e) {
        console.error(`Failed to get sourceImageData for negative:`, e);
        return;
    }
    const sourceData = sourceImageData.data;
    for (let y = 0; y < yMax - yMin; y += step) {
        for (let x = 0; x < xMax - xMin; x += step) {
            const canvasX = x + xMin;
            const canvasY = y + yMin;
            if (isPixelInBrushShape(canvasX, canvasY, mappedX, mappedY, halfBrush)) {
                const srcIndex = (y * (xMax - xMin) + x) * 4;
                const r = 255 - (sourceData[srcIndex] || 0);
                const g = 255 - (sourceData[srcIndex + 1] || 0);
                const b = 255 - (sourceData[srcIndex + 2] || 0);
                const relX = canvasX - mappedX;
                const relY = canvasY - mappedY;
                const rotatedX = relX * Math.cos(brushState.brushRotation) - relY * Math.sin(brushState.brushRotation);
                const rotatedY = relX * Math.sin(brushState.brushRotation) + relY * Math.cos(brushState.brushRotation);
                const destX = Math.round(mappedX + rotatedX);
                const destY = Math.round(mappedY + rotatedY);
                if (destX >= 0 && destX < targetCtx.canvas.width && destY >= 0 && destY < targetCtx.canvas.height) {
                    pixels.push({ r, g, b, x: destX, y: destY });
                }
            }
        }
    }
    console.log(`Negative brush pixels collected: ${pixels.length}`);
} else if (effectStates.isPaintMode) {
    if (!['box', 'circle', 'rectangle', 'triangle'].includes(brushState.brushShape)) {
        brushState.brushShape = 'box';
        Object.values(brushButtons).forEach(btn => btn.classList.remove('selected'));
        brushButtons.box.classList.add('selected');
        console.log('Reset brushState.brushShape to box for paint mode');
    }
    for (let y = yMin; y < yMax; y += step) {
        for (let x = xMin; x < xMax; x += step) {
            if (isPixelInBrushShape(x, y, mappedX, mappedY, halfBrush)) {
                const relX = x - mappedX;
                const relY = y - mappedY;
                const rotatedX = relX * Math.cos(brushState.brushRotation) - relY * Math.sin(brushState.brushRotation);
                const rotatedY = relX * Math.sin(brushState.brushRotation) + relY * Math.cos(brushState.brushRotation);
                const destX = Math.round(mappedX + rotatedX);
                const destY = Math.round(mappedY + rotatedY);
                if (destX >= 0 && destX < targetCtx.canvas.width && destY >= 0 && destY < targetCtx.canvas.height) {
                    pixels.push({ r: brushState.paintColor.r, g: brushState.paintColor.g, b: brushState.paintColor.b, x: destX, y: destY });
                }
            }
        }
    }
    console.log(`Paint mode applied: ${pixels.length} pixels with color rgb(${brushState.paintColor.r}, ${brushState.paintColor.g}, ${brushState.paintColor.b}) at (${mappedX}, ${mappedY})`);
} else if (mappedSourceX !== undefined && mappedSourceY !== undefined && !isTeleportClone && inputState.touchPoints.length >= 3) {
    const srcXMin = Math.max(0, Math.floor(mappedSourceX - halfBrush));
    const srcXMax = Math.min(sourceCanvasObj.width, Math.ceil(mappedSourceX + halfBrush));
    const srcYMin = Math.max(0, Math.floor(mappedSourceY - halfBrush));
    const srcYMax = Math.min(sourceCanvasObj.height, Math.ceil(mappedSourceY + halfBrush));
    const srcWidth = srcXMax - srcXMin;
    const srcHeight = srcYMax - srcYMin;

    if (srcWidth <= 0 || srcHeight <= 0) {
        console.warn('Invalid reverse teleport source dimensions:', { srcXMin, srcXMax, srcYMin, srcYMax, canvasId });
        return;
    }

    let sourceImageData;
    try {
        sourceImageData = sourceCtx.getImageData(srcXMin, srcYMin, srcWidth, srcHeight);
    } catch (e) {
        console.error('Failed to get source image data for reverse teleport:', e);
        return;
    }

    const sourceData = sourceImageData.data;
    let pixelCount = 0;
    for (let y = yMin; y < yMax; y += step) {
        for (let x = xMin; x < xMax; x += step) {
            if (isPixelInBrushShape(x, y, mappedX, mappedY, halfBrush)) {
                const relX = x - mappedX;
                const relY = y - mappedY;
                const cosRot = Math.cos(brushState.brushRotation);
                const sinRot = Math.sin(brushState.brushRotation);
                const rotatedX = relX * cosRot - relY * sinRot;
                const rotatedY = relX * sinRot + relY * cosRot;
                const srcX = Math.round(mappedSourceX + rotatedX - srcXMin);
                const srcY = Math.round(mappedSourceY + rotatedY - srcYMin);

                if (srcX >= 0 && srcX < srcWidth && srcY >= 0 && srcY < srcHeight) {
                    const srcIndex = (srcY * srcWidth + srcX) * 4;
                    if (sourceData[srcIndex + 3] > 0) {
                        const r = sourceData[srcIndex] || 0;
                        const g = sourceData[srcIndex + 1] || 0;
                        const b = sourceData[srcIndex + 2] || 0;
                        pixels.push({ r, g, b, x, y });
                        pixelCount++;
                    }
                }
            }
        }
    }
    console.log(`Reverse teleport: Copied ${pixelCount} pixels from (${mappedSourceX}, ${mappedSourceY}) to brush at (${mappedX}, ${mappedY})`);
} else {
    let srcXBase = isTeleportClone ? mappedSourceX : (dragState.lastX !== undefined ? dragState.lastX : mappedX);
    let srcYBase = isTeleportClone ? mappedSourceY : (dragState.lastY !== undefined ? dragState.lastY : mappedY);
    if (isTeleportClone && (isNaN(srcXBase) || isNaN(srcYBase) || srcXBase < 0 || srcYBase < 0 || 
        srcXBase >= sourceCanvasObj.width || srcYBase >= sourceCanvasObj.height)) {
        console.log('No pixels to draw in smearPixels: invalid teleport source coordinates', { srcXBase, srcYBase });
        return;
    }
    const srcXMin = Math.max(0, Math.floor(srcXBase - halfBrush));
    const srcXMax = Math.min(sourceCanvasObj.width - 1, Math.ceil(srcXBase + halfBrush));
    const srcYMin = Math.max(0, Math.floor(srcYBase - halfBrush));
    const srcYMax = Math.min(sourceCanvasObj.height - 1, Math.ceil(srcYBase + halfBrush));
    const srcWidth = srcXMax - srcXMin;
    const srcHeight = srcYMax - srcYMin;
    let sourceImageData;
    try {
        sourceImageData = sourceCtx.getImageData(srcXMin, srcYMin, srcWidth, srcHeight);
    } catch (e) {
        console.error(`Failed to get sourceImageData:`, e);
        return;
    }
    const sourceData = sourceImageData.data;
    let pixelCount = 0;
    for (let y = 0; y < yMax - yMin; y += step) {
        for (let x = 0; x < xMax - xMin; x += step) {
            const canvasX = x + xMin;
            const canvasY = y + yMin;
            if (isPixelInBrushShape(canvasX, canvasY, mappedX, mappedY, halfBrush)) {
                let relX = canvasX - mappedX;
                let relY = canvasY - mappedY;
                if (flipState.isFlipVerticalActive) relY = -relY;
                let srcX = Math.round(srcXBase + relX);
                let srcY = Math.round(srcYBase + relY);
                srcX = Math.max(srcXMin, Math.min(srcXMax - 1, srcX));
                srcY = Math.max(srcYMin, Math.min(srcYMax - 1, srcY));
                const srcIndex = ((srcY - srcYMin) * srcWidth + (srcX - srcXMin)) * 4;
                const r = sourceData[srcIndex] || 0;
                const g = sourceData[srcIndex + 1] || 0;
                const b = sourceData[srcIndex + 2] || 0;
                if (sourceData[srcIndex + 3] > 0) {
                    const rotatedX = relX * Math.cos(brushState.brushRotation) - relY * Math.sin(brushState.brushRotation);
                    const rotatedY = relX * Math.sin(brushState.brushRotation) + relY * Math.cos(brushState.brushRotation);
                    const destX = Math.round(mappedX + rotatedX);
                    const destY = Math.round(mappedY + rotatedY);
                    if (destX >= xMin && destX < xMax && destY >= yMin && destY < yMax) {
                        pixels.push({ r, g, b, x: destX, y: destY });
                        pixelCount++;
                    }
                }
            }
        }
    }
    console.log(`Normal brush pixels collected: ${pixelCount}, Clone: ${isTeleportClone}`);
}
}


/**
 * drawSweeperLines
 */
export function drawSweeperLines(canvasId) {
sweeperState.anchorPoints.slice(0, 3).forEach((point, i) => {
    console.log(`  Point ${i}: x=${point.x}, y=${point.y}`);
});

const targetCtx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
const targetCanvas = canvasId === 'base' ? baseCanvas : canvasId === 'paint' ? paintCanvas : samplerCanvas;
const state = zoomState.canvasStates[canvasId];
console.log(`Sweeper on ${canvasId} - Canvas size: ${targetCtx.canvas.width}x${targetCtx.canvas.height}`);

// Get zoom parameters
const zoomLevel = state.zoomLevel || 1;
const panX = state.panX || 0;
const panY = state.panY || 0;

if (sweeperState.anchorPoints.length < 2) {
    console.log("Need at least 2 anchor points for sweeper line");
    if (sweeperState.anchorPoints.length === 1) smearPixels(sweeperState.anchorPoints[0].x, sweeperState.anchorPoints[0].y, canvasId);
    return;
}

// Transform anchor points from screen space to canvas space if zoomed
const transformedAnchorPoints = sweeperState.anchorPoints.map(point => {
    if (zoomLevel !== 1) {
        return {
            ...point,
            x: (point.x - panX) / zoomLevel,
            y: (point.y - panY) / zoomLevel
        };
    }
    return point;
});

// Transform inputState.lastTouchPoints as well
const transformedLastTouchPoints = inputState.lastTouchPoints.map(point => {
    if (!point) return null;
    if (zoomLevel !== 1) {
        return {
            ...point,
            x: (point.x - panX) / zoomLevel,
            y: (point.y - panY) / zoomLevel
        };
    }
    return point;
});

// Cache canvas backups (only create once per drag)
if (!window.canvasBackupsCache || window.lastBackupCanvasId !== canvasId) {
window.canvasBackupsCache = {};
['base', 'paint', 'sampler'].forEach(key => {
    if (key !== canvasId) {
        const ctx = key === 'base' ? baseCtx : key === 'paint' ? paintCtx : samplerCtx;
        const state = zoomState.canvasStates[key];
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        window.canvasBackupsCache[key] = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        // Restore zoom if needed
        if (state.zoomLevel !== 1 || state.panX !== 0 || state.panY !== 0) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.save();
            ctx.translate(state.panX, state.panY);
            ctx.scale(state.zoomLevel, state.zoomLevel);
            ctx.putImageData(window.canvasBackupsCache[key], 0, 0);
            ctx.restore();
        }
    }
});
window.lastBackupCanvasId = canvasId;
}
const canvasBackups = window.canvasBackupsCache;
console.log(`Stored non-target canvas states for ${canvasId} with zoom awareness`);

// Initialize offscreen canvas for zoom-aware painting
if (!state.offscreenCanvas || state.offscreenCanvas.width !== targetCtx.canvas.width || state.offscreenCanvas.height !== targetCtx.canvas.height) {
    state.offscreenCanvas = document.createElement('canvas');
    state.offscreenCanvas.width = targetCtx.canvas.width;
    state.offscreenCanvas.height = targetCtx.canvas.height;
    const offscreenCtx = state.offscreenCanvas.getContext('2d', { alpha: true });
    offscreenCtx.imageSmoothingEnabled = true;
    offscreenCtx.imageSmoothingQuality = 'high';
    if (imageState.currentImageData[canvasId]) {
        offscreenCtx.putImageData(imageState.currentImageData[canvasId], 0, 0);
    }
}
const offscreenCtx = state.offscreenCanvas.getContext('2d', { alpha: true });

// Calculate bounds using ORIGINAL brush size (no scaling needed in canvas space)
const width = Math.max(1, brushState.brushSize);
const halfWidth = Math.floor(width / 2);
let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;

// Use transformed points for bounds calculation
transformedAnchorPoints.forEach(point => {
    if (isNaN(point.x) || isNaN(point.y)) {
        console.error('NaN in anchor point:', point);
        return;
    }
    xMin = Math.min(xMin, Math.floor(point.x - halfWidth));
    xMax = Math.max(xMax, Math.ceil(point.x + halfWidth));
    yMin = Math.min(yMin, Math.floor(point.y - halfWidth));
    yMax = Math.max(yMax, Math.ceil(point.y + halfWidth));
});

xMin = Math.floor(xMin);
xMax = Math.ceil(xMax);
yMin = Math.floor(yMin);
yMax = Math.ceil(yMax);

const canvas = targetCtx.canvas;
xMin = Math.max(0, xMin);
yMin = Math.max(0, yMin);
xMax = Math.min(canvas.width, xMax);
yMax = Math.min(canvas.height, yMax);
console.log(`CLAMP FIX: Bounds clamped to canvas: xMin=${xMin} yMin=${yMin} xMax=${xMax} yMax=${yMax}`);

if (xMax <= xMin || yMax <= yMin) {
    console.error('Invalid bounds in drawSweeperLines:', { xMin, xMax, yMin, yMax });
    // Restore non-target canvases
    Object.keys(canvasBackups).forEach(key => {
        if (canvasBackups[key]) {
            const restoreCtx = key === 'base' ? baseCtx : key === 'paint' ? paintCtx : samplerCtx;
            restoreCtx.putImageData(canvasBackups[key], 0, 0);
            imageState.currentImageData[key] = canvasBackups[key];
            console.log(`Restored ${key} canvas due to invalid bounds`);
        }
    });
    return;
}

// Create temporary canvas for line rendering
const tempCanvas = document.createElement('canvas');
tempCanvas.width = Math.max(1, xMax - xMin);
tempCanvas.height = Math.max(1, yMax - yMin);
const tempCtx = tempCanvas.getContext('2d', { alpha: true });
tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

// Get source data from offscreen canvas
const sourceImageData = offscreenCtx.getImageData(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
const destImageData = tempCtx.createImageData(tempCanvas.width, tempCanvas.height);

// Use transformed points for smear operations
for (let i = 0; i < transformedAnchorPoints.length - 1; i++) {
    const start = transformedLastTouchPoints[i] || transformedAnchorPoints[i];
    const end = transformedLastTouchPoints[i + 1] || transformedAnchorPoints[i + 1];
    const newStart = transformedAnchorPoints[i];
    const newEnd = transformedAnchorPoints[i + 1];
    smearLine(canvasId, start.x, start.y, end.x, end.y, newStart.x, newStart.y, newEnd.x, newEnd.y, sourceImageData, destImageData, xMin, yMin, xMax, yMax);
}

// Apply result to temporary canvas
tempCtx.putImageData(destImageData, 0, 0);

// Update offscreen canvas
const visibleLeft = Math.max(0, xMin);
const visibleTop = Math.max(0, yMin);
const visibleRight = Math.min(targetCtx.canvas.width, xMax);
const visibleBottom = Math.min(targetCtx.canvas.height, yMax);

console.log(`RENDER DEBUG: xMin=${xMin} xMax=${xMax} yMin=${yMin} yMax=${yMax}`);
console.log(`RENDER DEBUG: visibleLeft=${visibleLeft} visibleRight=${visibleRight} visibleTop=${visibleTop} visibleBottom=${visibleBottom}`);
console.log(`RENDER DEBUG: condition=${visibleRight > visibleLeft && visibleBottom > visibleTop}`);

if (visibleRight > visibleLeft && visibleBottom > visibleTop) {
    const sourceX = visibleLeft - xMin;
    const sourceY = visibleTop - yMin;
    const sourceWidth = visibleRight - visibleLeft;
    const sourceHeight = visibleBottom - visibleTop;

    console.log(`RENDER DEBUG: Drawing visible portion!`);
    console.log(`RENDER DEBUG: sourceX=${sourceX} sourceY=${sourceY} sourceWidth=${sourceWidth} sourceHeight=${sourceHeight}`);
    console.log(`RENDER DEBUG: destX=${visibleLeft} destY=${visibleTop}`);

    // Check if tempCanvas has visible content
    const tempImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    let nonTransparentPixels = 0;
    for (let i = 3; i < tempImageData.data.length; i += 4) {
        if (tempImageData.data[i] > 0) nonTransparentPixels++;
    }
    console.log(`RENDER DEBUG: tempCanvas size=${tempCanvas.width}×${tempCanvas.height}, nonTransparentPixels=${nonTransparentPixels}`);

    offscreenCtx.drawImage(
        tempCanvas,
        sourceX, sourceY, sourceWidth, sourceHeight,
        visibleLeft, visibleTop, sourceWidth, sourceHeight
    );
    console.log(`RENDER DEBUG: drawImage completed`);
}

imageState.currentImageData[canvasId] = offscreenCtx.getImageData(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);

console.log(`DISPLAY DEBUG: dragState.isDragging=${dragState.isDragging}, about to render to visible canvas`);

// Restore non-target canvases
Object.keys(canvasBackups).forEach(key => {
    if (canvasBackups[key]) {
        const restoreCtx = key === 'base' ? baseCtx : key === 'paint' ? paintCtx : samplerCtx;
        restoreCtx.putImageData(canvasBackups[key], 0, 0);
        imageState.currentImageData[key] = canvasBackups[key];
        console.log(`Restored ${key} canvas state after drawing on ${canvasId}`);
    }
});

// Update the offscreen canvas with the new content
offscreenCtx.drawImage(tempCanvas, xMin, yMin);

// Always redraw with zoom transformation
targetCtx.setTransform(1, 0, 0, 1, 0, 0);
targetCtx.clearRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
targetCtx.fillStyle = '#FFFFFF';
targetCtx.fillRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
targetCtx.save();
targetCtx.beginPath();
targetCtx.rect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
targetCtx.clip();
targetCtx.translate(panX, panY);
targetCtx.scale(zoomLevel, zoomLevel);
targetCtx.imageSmoothingEnabled = true;
targetCtx.imageSmoothingQuality = 'high';
targetCtx.drawImage(state.offscreenCanvas, 0, 0);
targetCtx.restore();

dragState.hasCanvasChanged = true;

if (recordingState.isRecording) {
    // Record with ORIGINAL anchor points (not transformed)
    recordMovement('smear', {
        lastX: inputState.lastTouchPoints[0]?.x || sweeperState.anchorPoints[0]?.x,
        lastY: inputState.lastTouchPoints[0]?.y || sweeperState.anchorPoints[0]?.y,
        currentX: sweeperState.anchorPoints[0]?.x,
        currentY: sweeperState.anchorPoints[0]?.y,
        canvasId,
        brushShape: brushState.brushShape,
        anchorPoints: sweeperState.anchorPoints.map((p, index) => ({
            x: p.x,
            y: p.y,
            lastX: inputState.lastTouchPoints[index]?.x || p.x,
            lastY: inputState.lastTouchPoints[index]?.y || p.y,
            fingerId: p.id || p.fingerId || `anchor_${index}`,
            target: p.target?.id || 'canvas',
            index: index
        })),
        mouseAnchorStart: sweeperState.mouseAnchorStart ? {
            x: sweeperState.mouseAnchorStart.x,
            y: sweeperState.mouseAnchorStart.y,
            target: sweeperState.mouseAnchorStart.target?.id || 'canvas'
        } : undefined,
        inputType: inputState.touchPoints[0]?.isMouse ? 'mouse' : 'touch',
        fingerCount: sweeperState.anchorPoints.length,
        activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
    });
    console.log(`Recorded complete sweeper gesture with ${sweeperState.anchorPoints.length} anchor points`);
}

console.log('SweeperLines drawn - Pixels processed, Canvas:', canvasId, 'Bounds:', { xMin, xMax, yMin, yMax });
console.log("🔵 SWEEPER COMPLETED - Drew on canvas:", canvasId);
}

/**
 * smearLine
 */
export function smearLine(canvasId, prevStartX, prevStartY, prevEndX, prevEndY, startX, startY, endX, endY, sourceImageData, destImageData, xMin, yMin, xMax, yMax) {
const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
const canvas = ctx.canvas;
const state = zoomState.canvasStates[canvasId];
const zoomLevel = Math.max(0.1, state.zoomLevel || 1);
const panX = state.panX || 0;
const panY = state.panY || 0;

const mappedPrevStartX = prevStartX;
const mappedPrevStartY = prevStartY;
const mappedPrevEndX = prevEndX;
const mappedPrevEndY = prevEndY;
const mappedStartX = startX;
const mappedStartY = startY;
const mappedEndX = endX;
const mappedEndY = endY;

const dx = mappedPrevEndX - mappedPrevStartX;
const dy = mappedPrevEndY - mappedPrevStartY;
const length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
const steps = Math.ceil(length);
const stepX = dx / steps;
const stepY = dy / steps;

const width = Math.max(1, brushState.brushSize);
const halfWidth = Math.floor(width / 2);
const normX = length ? -dy / length : 0;
const normY = length ? dx / length : 0;

const deltaX = mappedStartX - mappedPrevStartX;
const deltaY = mappedStartY - mappedPrevStartY;

const sourceData = sourceImageData.data;
const destData = destImageData.data;

let pixels = [];
for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const baseX = mappedPrevStartX + t * dx;
    const baseY = mappedPrevStartY + t * dy;
    for (let w = -halfWidth; w <= halfWidth; w++) {
        let x = baseX + w * normX;
        let y = baseY + w * normY;

        const centerX = (mappedPrevStartX + mappedPrevEndX) / 2;
        const centerY = (mappedPrevStartY + mappedPrevEndY) / 2;
        const relX = x - centerX;
        const relY = y - centerY;
        const cosRot = Math.cos(brushState.brushRotation);
        const sinRot = Math.sin(brushState.brushRotation);
        let rotatedX = relX * cosRot - relY * sinRot;
        let rotatedY = relX * sinRot + relY * cosRot;
        x = centerX + rotatedX;
        y = centerY + rotatedY;

        if (flipState.isFlipVerticalActive) {
            y = centerY + (centerY - y);
        }

        const srcX = Math.round(x);
const srcY = Math.round(y);
// SAFE SAMPLING - use edge pixels when outside canvas
const safeSrcX = Math.max(0, Math.min(srcX, canvas.width - 1));
const safeSrcY = Math.max(0, Math.min(srcY, canvas.height - 1));
const pixelI = (safeSrcY * canvas.width + safeSrcX) * 4;;

        if (sourceData[pixelI + 3] === 0) {
            continue;
        }

        let r = sourceData[pixelI] || 0;
        let g = sourceData[pixelI + 1] || 0;
        let b = sourceData[pixelI + 2] || 0;
        let a = sourceData[pixelI + 3] || 255;

        // Remove iridescent color effect for sweeper
        if (brushState.brushShape === 'oilbarrel') {
console.log('OILBARREL END DEBUG:', {
    isDraggingOilbarrel: dragState.isDraggingOilbarrel,
    oilbarrelRafId: dragState.oilbarrelRafId,
    oilbarrelDragState: dragState.oilbarrelDragState,
    anchorPoints: sweeperState.anchorPoints,
    hasCanvasChanged: dragState.hasCanvasChanged
});

            const dist = Math.abs(w) / halfWidth;
            const [h, s, l] = rgbToHsl(r, g, b);
            const hueShift = Math.sin(t * 2 + w * 0.1) * 30 + 16.24;
            const satShift = Math.cos(t * 2) * 20 + 51.87;
            const lightShift = Math.sin(w * 0.1) * 15 + 44.61;
            [r, g, b] = hslToRgb((h + hueShift) % 360, Math.min(100, s + satShift), Math.max(10, Math.min(90, l + lightShift)));
            r = Math.min(255, r + Math.sin(t) * 20);
            g = Math.min(255, g + Math.cos(t) * 20);
        }

        pixels.push({ r, g, b, a, x: srcX, y: srcY });
    }
}

applyEffects(pixels, deltaX, deltaY, mappedPrevStartX, mappedPrevStartY, mappedStartX, mappedStartY);

const hasPositionalEffect = effectStates.isGlitchTideHeld || effectStates.isHyphenHeld || effectStates.isFractalStretchHeld || effectStates.isNeonBendHeld || effectStates.isLockHeld;
pixels.forEach(pixel => {
    let newX = hasPositionalEffect ? Math.round(pixel.x) : Math.round(pixel.x + deltaX);
    let newY = hasPositionalEffect ? Math.round(pixel.y) : Math.round(pixel.y + deltaY);
    newX = Math.max(xMin, Math.min(xMax - 1, newX));
    newY = Math.max(yMin, Math.min(yMax - 1, newY));
    if (newX >= xMin && newX <= xMax && newY >= yMin && newY <= yMax) {
        const destIndex = ((newY - yMin) * (xMax - xMin) + (newX - xMin)) * 4;
        destData[destIndex] = pixel.r;
        destData[destIndex + 1] = pixel.g;
        destData[destIndex + 2] = pixel.b;
        destData[destIndex + 3] = pixel.a;
    }
});
console.log('Sweeper smearLine - Pixels:', pixels.length, 'xMin:', xMin, 'xMax:', xMax, 'Brush:', brushState.brushShape);
}


/**
 * drawAestheticLines
 */
export function drawAestheticLines(canvasId) {
console.log('Drawing aesthetic lines with anchors:', sweeperState.anchorPoints);
const targetCtx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
const targetCanvas = canvasId === 'base' ? baseCanvas : canvasId === 'paint' ? paintCanvas : samplerCanvas;
const state = zoomState.canvasStates[canvasId];
console.log(`AestheticLines on ${canvasId} - Canvas size: ${targetCtx.canvas.width}x${targetCtx.canvas.height}`);

// Get zoom parameters
const zoomLevel = state.zoomLevel || 1;
const panX = state.panX || 0;
const panY = state.panY || 0;

if (sweeperState.anchorPoints.length < 2) {
    console.log("Need at least 2 anchor points for aesthetic lines");
    if (sweeperState.anchorPoints.length === 1) smearPixels(sweeperState.anchorPoints[0].x, sweeperState.anchorPoints[0].y, canvasId);
    return;
}

// Transform anchor points from screen space to canvas space if zoomed
const transformedAnchorPoints = sweeperState.anchorPoints.map(point => {
    if (zoomLevel !== 1) {
        return {
            ...point,
            x: (point.x - panX) / zoomLevel,
            y: (point.y - panY) / zoomLevel
        };
    }
    return point;
});

// Transform inputState.lastTouchPoints as well
const transformedLastTouchPoints = inputState.lastTouchPoints.map(point => {
    if (!point) return null;
    if (zoomLevel !== 1) {
        return {
            ...point,
            x: (point.x - panX) / zoomLevel,
            y: (point.y - panY) / zoomLevel
        };
    }
    return point;
});

// Store non-target canvas states with zoom awareness
const canvasBackups = {};
['base', 'paint', 'sampler'].forEach(key => {
    if (key !== canvasId) {
        const ctx = key === 'base' ? baseCtx : key === 'paint' ? paintCtx : samplerCtx;
        const state = zoomState.canvasStates[key];
        // Get unzoomed content for backup
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        canvasBackups[key] = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        // Restore zoom transform if needed
        if (state.zoomLevel !== 1 || state.panX !== 0 || state.panY !== 0) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.save();
            ctx.translate(state.panX, state.panY);
            ctx.scale(state.zoomLevel, state.zoomLevel);
            ctx.putImageData(canvasBackups[key], 0, 0);
            ctx.restore();
        }
    }
});
console.log(`Stored non-target canvas states for ${canvasId} with zoom awareness`);

// Initialize offscreen canvas for zoom-aware painting
if (!state.offscreenCanvas || state.offscreenCanvas.width !== targetCtx.canvas.width || state.offscreenCanvas.height !== targetCtx.canvas.height) {
    state.offscreenCanvas = document.createElement('canvas');
    state.offscreenCanvas.width = targetCtx.canvas.width;
    state.offscreenCanvas.height = targetCtx.canvas.height;
    const offscreenCtx = state.offscreenCanvas.getContext('2d', { alpha: true });
    offscreenCtx.imageSmoothingEnabled = true;
    offscreenCtx.imageSmoothingQuality = 'high';
    if (imageState.currentImageData[canvasId]) {
        offscreenCtx.putImageData(imageState.currentImageData[canvasId], 0, 0);
    }
}
const offscreenCtx = state.offscreenCanvas.getContext('2d', { alpha: true });

// Calculate bounds using transformed points
const halfBrush = Math.max(brushState.brushSize * 1.5, 5);
let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
transformedAnchorPoints.forEach(point => {
    if (isNaN(point.x) || isNaN(point.y)) {
        console.error('NaN in anchor point:', point);
        return;
    }
    xMin = Math.min(xMin, Math.floor(point.x - halfBrush));
    xMax = Math.max(xMax, Math.ceil(point.x + halfBrush));
    yMin = Math.min(yMin, Math.floor(point.y - halfBrush));
    yMax = Math.max(yMax, Math.ceil(point.y + halfBrush));
});

const visibleXMin = Math.max(0, xMin);
const visibleXMax = Math.min(targetCtx.canvas.width, xMax);
const visibleYMin = Math.max(0, yMin);
const visibleYMax = Math.min(targetCtx.canvas.height, yMax);

// Only fail if completely invalid or no visible area
if (isNaN(xMin) || isNaN(xMax) || isNaN(yMin) || isNaN(yMax) || 
    visibleXMax <= visibleXMin || visibleYMax <= visibleYMin) {
    console.error('Invalid bounds in drawAestheticLines:', { xMin, xMax, yMin, yMax, visibleXMin, visibleXMax, visibleYMin, visibleYMax });
    // Restore non-target canvases
    Object.keys(canvasBackups).forEach(key => {
        if (canvasBackups[key]) {
            const restoreCtx = key === 'base' ? baseCtx : key === 'paint' ? paintCtx : samplerCtx;
            restoreCtx.putImageData(canvasBackups[key], 0, 0);
            imageState.currentImageData[key] = canvasBackups[key];
            console.log(`Restored ${key} canvas due to invalid bounds`);
        }
    });
    return;
}

// Create temp canvas for visible area only
const tempCanvas = document.createElement('canvas');
tempCanvas.width = Math.max(1, visibleXMax - visibleXMin);
tempCanvas.height = Math.max(1, visibleYMax - visibleYMin);
const tempCtx = tempCanvas.getContext('2d', { alpha: true });
tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

// Get source data from offscreen canvas
const sourceImageData = offscreenCtx.getImageData(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
const destImageData = offscreenCtx.getImageData(xMin, yMin, xMax - xMin, yMax - yMin);

// Use transformed points for smear operations
for (let i = 0; i < transformedAnchorPoints.length - 1; i++) {
    const start = transformedLastTouchPoints[i] || transformedAnchorPoints[i];
    const end = transformedLastTouchPoints[i + 1] || transformedAnchorPoints[i + 1];
    const newStart = transformedAnchorPoints[i];
    const newEnd = transformedAnchorPoints[i + 1];
    smearAestheticLines(canvasId, start.x, start.y, end.x, end.y, newStart.x, newStart.y, newEnd.x, newEnd.y, sourceImageData, destImageData, xMin, yMin, xMax, yMax);
}

// Apply result to temporary canvas
tempCtx.putImageData(destImageData, 0, 0);

console.log('TEMP CANVAS SAMPLE - Top-left 10x10 pixels:');
const tempSample = tempCtx.getImageData(0, 0, Math.min(10, tempCanvas.width), Math.min(10, tempCanvas.height));
for (let y = 0; y < Math.min(10, tempCanvas.height); y++) {
    let row = '';
    for (let x = 0; x < Math.min(10, tempCanvas.width); x++) {
        const i = (y * Math.min(10, tempCanvas.width) + x) * 4;
        const r = tempSample.data[i];
        const g = tempSample.data[i + 1]; 
        const b = tempSample.data[i + 2];
        const a = tempSample.data[i + 3];
        row += a > 0 ? `(${r},${g},${b}) ` : '(TRANSP) ';
    }
    console.log(`Row ${y}: ${row}`);
}

// Update offscreen canvas
offscreenCtx.drawImage(tempCanvas, xMin, yMin);
// Store the unzoomed content in imageState.currentImageData
imageState.currentImageData[canvasId] = offscreenCtx.getImageData(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);

// Restore non-target canvases
Object.keys(canvasBackups).forEach(key => {
    if (canvasBackups[key]) {
        const restoreCtx = key === 'base' ? baseCtx : key === 'paint' ? paintCtx : samplerCtx;
        restoreCtx.putImageData(canvasBackups[key], 0, 0);
        imageState.currentImageData[key] = canvasBackups[key];
        console.log(`Restored ${key} canvas state after drawing on ${canvasId}`);
    }
});

// ALWAYS redraw with zoom transformation (removed if (!dragState.isDragging) check)
targetCtx.setTransform(1, 0, 0, 1, 0, 0);
targetCtx.clearRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
targetCtx.fillStyle = '#FFFFFF';
targetCtx.fillRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
targetCtx.save();
targetCtx.beginPath();
targetCtx.rect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
targetCtx.clip();
targetCtx.translate(panX, panY);
targetCtx.scale(zoomLevel, zoomLevel);
targetCtx.imageSmoothingEnabled = true;
targetCtx.imageSmoothingQuality = 'high';
targetCtx.drawImage(state.offscreenCanvas, 0, 0);


targetCtx.restore();

dragState.hasCanvasChanged = true;

if (recordingState.isRecording) {
    // Record with ORIGINAL anchor points (not transformed)
    for (let i = 0; i < sweeperState.anchorPoints.length - 1; i++) {
        recordMovement('smear', { 
            lastX: inputState.lastTouchPoints[i]?.x || sweeperState.anchorPoints[i].x, 
            lastY: inputState.lastTouchPoints[i]?.y || sweeperState.anchorPoints[i].y, 
            currentX: sweeperState.anchorPoints[i].x, 
            currentY: sweeperState.anchorPoints[i].y,
            nextX: sweeperState.anchorPoints[i + 1].x,
            nextY: sweeperState.anchorPoints[i + 1].y,
            canvasId
        });
    }
}
console.log('AestheticLines drawn - Pixels processed, Canvas:', canvasId, 'Bounds:', { xMin, xMax, yMin, yMax });
}


/**
 * smearAestheticLines
 */
export function smearAestheticLines(canvasId, prevStartX, prevStartY, prevEndX, prevEndY, startX, startY, endX, endY, sourceImageData, destImageData, xMin, yMin, xMax, yMax) {
const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
const canvas = ctx.canvas;

const dx = prevEndX - prevStartX;
const dy = prevEndY - prevStartY;
const length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
const steps = Math.ceil(length);
const stepX = dx / steps;
const stepY = dy / steps;

const halfBrush = Math.max(brushState.brushSize * 1.5, 5);
const normX = length ? -dy / length : 0;
const normY = length ? dx / length : 0;

const deltaX = startX - prevStartX;
const deltaY = startY - prevStartY;
const time = Date.now() * 0.005;

const sourceData = sourceImageData.data;
const destData = destImageData.data;

let pixels = [];
for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const baseX = prevStartX + t * dx;
    const baseY = prevStartY + t * dy;
    for (let w = -halfBrush; w <= halfBrush; w++) {
        const swirlAngle = time + (w / halfBrush) * Math.PI;
        const swirlRadius = Math.sin(time + t * Math.PI) * halfBrush * 0.2;
        const swirlX = Math.cos(swirlAngle) * swirlRadius;
        const swirlY = Math.sin(swirlAngle) * swirlRadius;
        let x = baseX + w * normX + swirlX;
        let y = baseY + w * normY + swirlY;

        // Apply rotation
        const centerX = (prevStartX + prevEndX) / 2;
        const centerY = (prevStartY + prevEndY) / 2;
        const relX = x - centerX;
        const relY = y - centerY;
        const cosRot = Math.cos(brushState.brushRotation);
        const sinRot = Math.sin(brushState.brushRotation);
        let rotatedX = relX * cosRot - relY * sinRot;
        let rotatedY = relX * sinRot + relY * cosRot;
        x = centerX + rotatedX;
        y = centerY + rotatedY;

        // Apply vertical flip
        if (flipState.isFlipVerticalActive) {
            y = centerY + (centerY - y); // Flip around center Y
        }

        const srcX = Math.round(Math.max(0, Math.min(canvas.width - 1, x)));
        const srcY = Math.round(Math.max(0, Math.min(canvas.height - 1, y)));
        const pixelI = (srcY * canvas.width + srcX) * 4;
        let r = sourceData[pixelI] || 0;
        let g = sourceData[pixelI + 1] || 0;
        let b = sourceData[pixelI + 2] || 0;

        const dist = Math.abs(w) / halfBrush;
        const [h, s, l] = rgbToHsl(r, g, b);
        const hueShift = Math.sin(time + t * 3 + w * 0.2) * 50 + 20;
        const satShift = Math.cos(time + t * 3) * 30 + 60;
        const lightShift = Math.sin(time + w * 0.2) * 20 + 50;
        [r, g, b] = hslToRgb((h + hueShift) % 360, Math.min(100, s + satShift), Math.max(20, Math.min(90, l + lightShift)));
        r = Math.min(255, r + Math.sin(time + t * 2) * 30);
        g = Math.min(255, g + Math.cos(time + t * 2) * 30);

        pixels.push({ r, g, b, x: srcX, y: srcY });
    }
}

applyEffects(pixels, deltaX, deltaY, prevStartX, prevStartY, startX, startY);

const hasPositionalEffect = effectStates.isGlitchTideHeld || effectStates.isHyphenHeld || effectStates.isFractalStretchHeld || effectStates.isNeonBendHeld || effectStates.isLockHeld;
pixels.forEach(pixel => {
    let newX = hasPositionalEffect ? Math.round(pixel.x) : Math.round(pixel.x + deltaX);
    let newY = hasPositionalEffect ? Math.round(pixel.y) : Math.round(pixel.y + deltaY);
    newX = Math.max(xMin, Math.min(xMax - 1, newX));
    newY = Math.max(yMin, Math.min(yMax - 1, newY));
    if (newX >= xMin && newX <= xMax && newY >= yMin && newY <= yMax) {
        const destIndex = ((newY - yMin) * (xMax - xMin) + (newX - xMin)) * 4;
        destData[destIndex] = pixel.r;
        destData[destIndex + 1] = pixel.g;
        destData[destIndex + 2] = pixel.b;
        destData[destIndex + 3] = 255;
    }
});
console.log('AestheticLines smear - Pixels:', pixels.length, 'xMin:', xMin, 'xMax:', xMax);
}


/**
 * renderOilbarrelMouse
 */
export function renderOilbarrelMouse() {
if (!dragState.isDraggingOilbarrel || !dragState.oilbarrelDragState.ctx) {
    dragState.oilbarrelRafId = null;
    return;
}

const { startX, startY, endX, endY, canvasId, ctx, targetCanvas } = dragState.oilbarrelDragState;

try {
    // REMOVED: Heavy debug logging
    
    // Only update anchor points, don't recalculate everything
    sweeperState.anchorPoints[0].x = startX;
    sweeperState.anchorPoints[0].y = startY;
    sweeperState.anchorPoints[1].x = endX;
    sweeperState.anchorPoints[1].y = endY;
    
    // Use lighter drawing method
    drawSweeperLines(canvasId);
    dragState.hasCanvasChanged = true;

    // REMOVED: Heavy recording logic during animation
    
} catch (error) {
    console.error('Error in renderOilbarrelMouse:', error);
}

// Reduce frame rate to 30fps instead of 60fps
setTimeout(() => {
    dragState.oilbarrelRafId = requestAnimationFrame(renderOilbarrelMouse);
}, 33);
}
