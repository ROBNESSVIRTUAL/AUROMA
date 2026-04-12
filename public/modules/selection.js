/**
 * Selection Tools Module
 * Handles selection tools (square, multipoint, circle)
 * Complete implementations extracted from editor.js
 */

import { 
  selectionState, 
  canvasRefs, 
  zoomState,
  effectStates,
  animationState,
  inputState,
  dragState,
  brushState
} from './state.js';
import { calculatePolygonBounds } from './utils.js';
import { getCanvasCoordinates } from './canvasManager.js';

// Selection canvas elements (need to be created/accessed)
let selectionCanvas = null;
let selectionCtx = null;
let selectionCacheCanvas = null;
let selectionCacheCtx = null;
let marchingAntsTimeoutId = null;
let marchingAntsFrameId = null;

/**
 * Get or create selection canvas
 */
function getSelectionCanvas() {
  if (!selectionCanvas) {
    const container = document.getElementById('canvasContainer');
    selectionCanvas = document.createElement('canvas');
    selectionCanvas.id = 'selectionCanvas';
    selectionCtx = selectionCanvas.getContext('2d', { alpha: true });
    selectionCanvas.style.position = 'absolute';
    selectionCanvas.style.zIndex = '2000';
    selectionCanvas.style.pointerEvents = 'none';
    selectionCanvas.style.display = 'none';
    if (container) container.appendChild(selectionCanvas);
  }
  return selectionCanvas;
}

/**
 * Sync selection canvas position with target canvas
 * @param {HTMLCanvasElement} targetCanvas - Target canvas to sync with
 */
export function syncSelectionCanvasPosition(targetCanvas) {
  if (!targetCanvas) return;
  
  const canvas = getSelectionCanvas();
  if (!canvas) return;

  // Hide if in zoom mode
  if (zoomState.isZooming) {
    canvas.style.display = 'none';
    canvas.style.visibility = 'hidden';
    return;
  }

  const container = document.getElementById('canvasContainer');
  if (!container) return;

  // Make sure selection canvas is in the container
  if (canvas.parentElement !== container) {
    container.appendChild(canvas);
  }

  // Get zoom state
  const canvasId = targetCanvas.id.replace('Canvas', '');
  const state = zoomState.canvasStates[canvasId];
  const zoomLevel = state ? state.zoomLevel : 1;
  const panX = state ? state.panX : 0;
  const panY = state ? state.panY : 0;

  // Don't apply zoom transform - marching ants are drawn in canvas space
  const transformStyle = 'none';

  // Position the selection canvas with the 5 pixel adjustment
  canvas.style.cssText = `
    position: absolute !important;
    left: ${targetCanvas.offsetLeft + 1}px !important;
    top: ${targetCanvas.offsetTop + 1}px !important;
    width: ${targetCanvas.offsetWidth}px !important;
    height: ${targetCanvas.offsetHeight}px !important;
    z-index: 2000 !important;
    pointer-events: none !important;
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    margin: 0 !important;
    padding: 0 !important;
    transform: ${transformStyle} !important;
    transform-origin: 0 0 !important;
  `;

  // Match internal canvas size
  canvas.width = targetCanvas.width;
  canvas.height = targetCanvas.height;
  
  if (!selectionCtx) {
    selectionCtx = canvas.getContext('2d', { alpha: true });
  }
  selectionCtx.imageSmoothingEnabled = false;

  canvas.dataset.targetCanvasId = targetCanvas.id;

  // Remove any test divs from debugging
  const testDiv = document.getElementById('selection-test-div');
  if (testDiv) {
    testDiv.remove();
  }
}

/**
 * Render marching ants animation around selection
 * Complete implementation from editor.js lines 2694-2914
 */
export function renderMarchingAnts() {
  // Add safety check: clear immediately if in zoom mode
  if (zoomState.isZooming) {
    const canvas = getSelectionCanvas();
    if (canvas) {
      canvas.style.display = 'none';
      canvas.style.visibility = 'hidden';
      if (selectionCtx) {
        selectionCtx.clearRect(0, 0, canvas.width, canvas.height);
      }
      delete canvas.dataset.targetCanvasId;
    }
    return;
  }

  // Check conditions
  const canvas = getSelectionCanvas();
  if (!canvas || !selectionCtx) {
    console.error('Selection canvas or context not initialized');
    return;
  }

  if (!selectionState.isSelecting && !selectionState.isSelectionActive && 
      !selectionState.selectionStart && !selectionState.multipointPath.length && 
      !canvas.dataset.targetCanvasId) {
    canvas.style.display = 'none';
    canvas.style.visibility = 'hidden';
    selectionCtx.clearRect(0, 0, canvas.width, canvas.height);
    console.log('Cleared marching ants - No active or pending selection');
    return;
  }

  // Determine target canvas with fallback
  let targetCanvas;
  const targetCanvasId = canvas.dataset.targetCanvasId;
  if (targetCanvasId === 'baseCanvas') targetCanvas = canvasRefs.baseCanvas;
  else if (targetCanvasId === 'paintCanvas') targetCanvas = canvasRefs.paintCanvas;
  else if (targetCanvasId === 'samplerCanvas') targetCanvas = canvasRefs.samplerCanvas;
  else {
    targetCanvas = canvasRefs.baseCanvas;
    canvas.dataset.targetCanvasId = 'baseCanvas';
    console.warn(`Invalid targetCanvasId (${targetCanvasId}), defaulting to baseCanvas`);
  }

  if (!targetCanvas) return;

  // Sync position and size
  syncSelectionCanvasPosition(targetCanvas);
  if (canvas.width !== targetCanvas.width || canvas.height !== targetCanvas.height) {
    canvas.width = targetCanvas.width;
    canvas.height = targetCanvas.height;
    selectionCtx = canvas.getContext('2d', { alpha: true });
    selectionCtx.imageSmoothingEnabled = false;
  }
  canvas.style.display = 'block';
  canvas.style.visibility = 'visible';

  // Clear canvas
  selectionCtx.clearRect(0, 0, canvas.width, canvas.height);

  // Setup styles
  const glowHue = getComputedStyle(document.documentElement).getPropertyValue('--glow-hue').trim() || '51deg';
  let strokeStyle = `hsl(${glowHue}, 75%, 65%)`;
  if (effectStates.isNeonHeld) strokeStyle = `hsl(${animationState.neonPhase}, 75%, 65%)`;
  else if (effectStates.isChromaticShiftHeld) strokeStyle = `hsl(${animationState.vhsPhase * 10}, 80%, 60%)`;
  selectionCtx.strokeStyle = strokeStyle;
  selectionCtx.lineWidth = 2;
  selectionCtx.setLineDash([8, 8]);
  const time = Date.now() / 200;
  selectionCtx.lineDashOffset = -(time % 16);
  selectionCtx.shadowColor = effectStates.isNeonHeld ? strokeStyle : '#FF1493';
  selectionCtx.shadowBlur = 8;

  try {
    if (selectionState.selectionType === 'square' && selectionState.selectionStart && 
        selectionState.selectionEnd && (selectionState.isSelecting || selectionState.isSelectionActive)) {
      const screenStartX = selectionState.selectionStart.x;
      const screenStartY = selectionState.selectionStart.y;
      const screenEndX = selectionState.selectionEnd.x;
      const screenEndY = selectionState.selectionEnd.y;

      const x = Math.min(screenStartX, screenEndX) + 0.5;
      const y = Math.min(screenStartY, screenEndY) + 0.5;
      const width = Math.abs(screenEndX - screenStartX);
      const height = Math.abs(screenEndY - screenStartY);
      selectionCtx.beginPath();
      selectionCtx.rect(x, y, Math.max(width, 1), Math.max(height, 1));
      selectionCtx.stroke();
      if (selectionState.isSelecting) {
        selectionCtx.fillStyle = '#FFD700';
        selectionCtx.shadowBlur = 0;
        [selectionState.selectionStart, selectionState.selectionEnd].forEach(point => {
          if (point.x >= 0 && point.y >= 0 && point.x <= canvas.width && point.y <= canvas.height) {
            selectionCtx.beginPath();
            selectionCtx.arc(point.x + 0.5, point.y + 0.5, 6, 0, 2 * Math.PI);
            selectionCtx.fill();
          }
        });
      }
      console.log(`Rendered square selection: x=${x}, y=${y}, width=${width}, height=${height}`);
    } else if (selectionState.selectionType === 'circle' && selectionState.selectionStart && 
               selectionState.selectionEnd && (selectionState.isSelecting || selectionState.isSelectionActive)) {
      const centerX = (selectionState.selectionStart.x + selectionState.selectionEnd.x) / 2 + 0.5;
      const centerY = (selectionState.selectionStart.y + selectionState.selectionEnd.y) / 2 + 0.5;
      const radiusX = Math.max(Math.abs(selectionState.selectionEnd.x - selectionState.selectionStart.x) / 2, 1);
      const radiusY = Math.max(Math.abs(selectionState.selectionEnd.y - selectionState.selectionStart.y) / 2, 1);
      selectionCtx.beginPath();
      selectionCtx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      selectionCtx.stroke();
      if (selectionState.isSelecting) {
        selectionCtx.fillStyle = '#FFD700';
        selectionCtx.shadowBlur = 0;
        [selectionState.selectionStart, selectionState.selectionEnd].forEach(point => {
          if (point.x >= 0 && point.y >= 0 && point.x <= canvas.width && point.y <= canvas.height) {
            selectionCtx.beginPath();
            selectionCtx.arc(point.x + 0.5, point.y + 0.5, 6, 0, 2 * Math.PI);
            selectionCtx.fill();
          }
        });
      }
      console.log(`Rendered circle selection: center=(${centerX}, ${centerY}), radiusX=${radiusX}, radiusY=${radiusY}`);
    } else if (selectionState.selectionType === 'multipoint' && selectionState.multipointPath.length > 0 && 
               (selectionState.isSelecting || selectionState.isSelectionActive)) {
      selectionCtx.beginPath();
      selectionCtx.moveTo(selectionState.multipointPath[0].x + 0.5, selectionState.multipointPath[0].y + 0.5);
      for (let i = 1; i < selectionState.multipointPath.length; i++) {
        selectionCtx.lineTo(selectionState.multipointPath[i].x + 0.5, selectionState.multipointPath[i].y + 0.5);
      }
      if (selectionState.isSelectionActive) {
        selectionCtx.closePath();
      } else if (selectionState.isSelecting && dragState.isDragging && inputState.touchPoints.length > 0) {
        // Show preview line during active drag
        const touch = inputState.touchPoints[0];
        const targetCanvas = touch.target;
        const coords = getCanvasCoordinates({ touches: [touch] }, touch);
        if (!isNaN(coords.x) && !isNaN(coords.y) && coords.valid) {
          selectionCtx.setLineDash([4, 4]);
          selectionCtx.lineTo(coords.x + 0.5, coords.y + 0.5);
        }
      }
      selectionCtx.stroke();
      if (selectionState.isSelecting) {
        selectionCtx.fillStyle = '#FFD700';
        selectionCtx.shadowBlur = 0;
        selectionState.multipointPath.forEach((point) => {
          if (point.x >= 0 && point.y >= 0 && point.x <= canvas.width && point.y <= canvas.height) {
            selectionCtx.beginPath();
            selectionCtx.arc(point.x + 0.5, point.y + 0.5, 6, 0, 2 * Math.PI);
            selectionCtx.fill();
          }
        });
      }
      console.log(`Rendered multipoint selection: points=${selectionState.multipointPath.length}, closed=${selectionState.isSelectionActive}`);
    } else {
      canvas.style.display = 'none';
      canvas.style.visibility = 'hidden';
      selectionCtx.clearRect(0, 0, canvas.width, canvas.height);
      console.log('No selection to render');
      return;
    }
  } catch (e) {
    console.error('Error rendering marching ants:', e);
    canvas.style.display = 'none';
    canvas.style.visibility = 'hidden';
    if (selectionCtx) {
      selectionCtx.clearRect(0, 0, canvas.width, canvas.height);
    }
    return;
  }

  // Reset context
  selectionCtx.shadowBlur = 0;
  selectionCtx.setLineDash([]);

  // Schedule next frame with throttling
  if (selectionState.isSelecting || selectionState.isSelectionActive) {
    // Cancel any existing scheduled calls
    if (marchingAntsTimeoutId) clearTimeout(marchingAntsTimeoutId);
    if (marchingAntsFrameId) cancelAnimationFrame(marchingAntsFrameId);

    marchingAntsTimeoutId = setTimeout(() => {
      marchingAntsFrameId = requestAnimationFrame(renderMarchingAnts);
    }, 33);
  } else {
    // Make sure to clear any pending animations
    if (marchingAntsTimeoutId) {
      clearTimeout(marchingAntsTimeoutId);
      marchingAntsTimeoutId = null;
    }
    if (marchingAntsFrameId) {
      cancelAnimationFrame(marchingAntsFrameId);
      marchingAntsFrameId = null;
    }
    canvas.style.display = 'none';
    canvas.style.visibility = 'hidden';
    if (selectionCtx) {
      selectionCtx.clearRect(0, 0, canvas.width, canvas.height);
    }
    console.log('Stopped marching ants animation');
  }
}

/**
 * Start a square selection
 * @param {number} x - Start X position
 * @param {number} y - Start Y position
 */
export function startSquareSelection(x, y) {
  selectionState.isSelecting = true;
  selectionState.isSelectionActive = false;
  selectionState.isDraggingSelection = false;
  selectionState.selectionType = 'square';
  selectionState.selectionStart = { x, y };
  selectionState.selectionEnd = { x, y };
  console.log(`Started square selection at (${x}, ${y})`);
}

/**
 * Start a circle selection
 * @param {number} x - Start X position
 * @param {number} y - Start Y position
 */
export function startCircleSelection(x, y) {
  selectionState.isSelecting = true;
  selectionState.isSelectionActive = false;
  selectionState.isDraggingSelection = false;
  selectionState.selectionType = 'circle';
  selectionState.selectionStart = { x, y };
  selectionState.selectionEnd = { x, y };
  console.log(`Started circle selection at (${x}, ${y})`);
}

/**
 * Start a multipoint selection
 * @param {number} x - Start X position
 * @param {number} y - Start Y position
 */
export function startMultipointSelection(x, y) {
  selectionState.isSelecting = true;
  selectionState.isSelectionActive = false;
  selectionState.isDraggingSelection = false;
  selectionState.selectionType = 'multipoint';
  selectionState.multipointPath = [{ x, y }];
  console.log(`Started multipoint selection at (${x}, ${y})`);
}

/**
 * Update selection during drag
 * @param {number} x - Current X position
 * @param {number} y - Current Y position
 */
export function updateSelection(x, y) {
  if (!selectionState.isSelecting) return;

  if (selectionState.selectionType === 'square' || selectionState.selectionType === 'circle') {
    selectionState.selectionEnd = { x, y };
  } else if (selectionState.selectionType === 'multipoint') {
    // Multipoint paths are updated by adding points, not by updating end
    // This function is called for square/circle selection updates
  }
  
  renderMarchingAnts();
}

/**
 * Add point to multipoint selection
 * @param {number} x - X position
 * @param {number} y - Y position
 */
export function addMultipointPoint(x, y) {
  if (selectionState.selectionType !== 'multipoint') return;
  selectionState.multipointPath.push({ x, y });
  renderMarchingAnts();
}

/**
 * Complete selection
 */
export function completeSelection() {
  if (!selectionState.isSelecting) return;

  selectionState.isSelecting = false;
  selectionState.isSelectionActive = true;

  if (selectionState.selectionType === 'square' || selectionState.selectionType === 'circle') {
    const { selectionStart, selectionEnd } = selectionState;
    selectionState.selectionBounds = {
      xMin: Math.min(selectionStart.x, selectionEnd.x),
      xMax: Math.max(selectionStart.x, selectionEnd.x),
      yMin: Math.min(selectionStart.y, selectionEnd.y),
      yMax: Math.max(selectionStart.y, selectionEnd.y)
    };
  } else if (selectionState.selectionType === 'multipoint') {
    selectionState.selectionBounds = calculatePolygonBounds(selectionState.multipointPath);
    selectionState.selectionBounds.centroidX = selectionState.multipointPath.reduce((sum, p) => sum + p.x, 0) / selectionState.multipointPath.length;
    selectionState.selectionBounds.centroidY = selectionState.multipointPath.reduce((sum, p) => sum + p.y, 0) / selectionState.multipointPath.length;
    selectionState.selectionBounds.path = selectionState.multipointPath;
  }

  console.log('Selection completed:', selectionState.selectionBounds);
  renderMarchingAnts();
}

/**
 * Clear selection
 */
export function clearSelection() {
  clearSelectionState();
}

/**
 * Clear all selection state
 */
export function clearSelectionState() {
  console.log('FORCE CLEARING ALL SELECTION STATE');

  // Cancel any pending animation frames
  if (marchingAntsTimeoutId) {
    clearTimeout(marchingAntsTimeoutId);
    marchingAntsTimeoutId = null;
  }
  if (marchingAntsFrameId) {
    cancelAnimationFrame(marchingAntsFrameId);
    marchingAntsFrameId = null;
  }

  // Clear any large canvas references
  if (selectionCacheCanvas) {
    selectionCacheCanvas.width = 0;
    selectionCacheCanvas.height = 0;
    selectionCacheCanvas = null;
    selectionCacheCtx = null;
  }

  // Force stop all selection flags
  selectionState.isSelecting = false;
  selectionState.isSelectionActive = false;
  selectionState.isDraggingSelection = false;

  // Clear all selection data
  selectionState.selectionStart = null;
  selectionState.selectionEnd = null;
  selectionState.multipointPath = [];
  selectionState.selectedImageData = null;
  selectionState.selectionBounds = null;
  selectionState.selectionType = null;

  // Thoroughly clear selection canvas
  const canvas = getSelectionCanvas();
  if (canvas) {
    if (selectionCtx) {
      selectionCtx.clearRect(0, 0, canvas.width, canvas.height);
    }
    canvas.style.display = 'none';
    canvas.style.visibility = 'hidden';
    delete canvas.dataset.targetCanvasId;
  }

  console.log('Selection state cleared');
}

/**
 * Capture selection area
 * Complete implementation from editor.js lines 5504-5599
 * @param {HTMLCanvasElement} canvas - Canvas to capture from
 * @param {Object|Array} boundsOrPath - Selection bounds or path
 * @param {string} type - Selection type ('square', 'circle', 'multipoint')
 * @returns {ImageData} - Captured image data
 */
export function captureSelection(canvas, boundsOrPath, type) {
  const canvasId = canvas === canvasRefs.baseCanvas ? 'base' : 
                   canvas === canvasRefs.paintCanvas ? 'paint' : 'sampler';
  const ctx = canvasId === 'base' ? canvasRefs.baseCtx : 
              canvasId === 'paint' ? canvasRefs.paintCtx : 
              canvasRefs.samplerCtx;
  let xMin, xMax, yMin, yMax, centroidX = 0, centroidY = 0;

  const state = zoomState.canvasStates[canvasId];

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
    selectionState.selectedImageData = finalData;
    console.log(`Captured ${type} selection on ${canvasId}: bounds=${xMin},${yMin},${xMax},${yMax}, size=${width}x${height}, centroid=(${centroidX}, ${centroidY})`);
    return finalData;
  } catch (e) {
    console.error(`Failed to capture ${type} selection on ${canvasId}:`, e);
    return null;
  }
}

/**
 * Check if a point is within the selection
 * Complete implementation from editor.js lines 5601-5631
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} brushShape - Current brush shape
 * @returns {boolean} - True if point is in selection
 */
export function isPointInSelection(x, y, brushShape) {
  if (!selectionState.selectionBounds || !selectionState.isSelectionActive) return false;

  if (brushShape === 'squareSelection') {
    // Check if point is inside rectangular bounds
    return x >= selectionState.selectionBounds.xMin && x <= selectionState.selectionBounds.xMax &&
           y >= selectionState.selectionBounds.yMin && y <= selectionState.selectionBounds.yMax;
  } else if (brushShape === 'circleSelection') {
    // Check if point is inside ellipse
    const centerX = (selectionState.selectionBounds.xMin + selectionState.selectionBounds.xMax) / 2;
    const centerY = (selectionState.selectionBounds.yMin + selectionState.selectionBounds.yMax) / 2;
    const radiusX = (selectionState.selectionBounds.xMax - selectionState.selectionBounds.xMin) / 2;
    const radiusY = (selectionState.selectionBounds.yMax - selectionState.selectionBounds.yMin) / 2;
    const normalizedX = (x - centerX) / radiusX;
    const normalizedY = (y - centerY) / radiusY;
    return (normalizedX * normalizedX + normalizedY * normalizedY) <= 1;
  } else if (brushShape === 'basquiatSelection') {
    // Check if point is inside polygon using ray-casting algorithm
    return pointInPolygon({ x, y }, selectionState.multipointPath);
  }
  return false;
}

/**
 * Point-in-polygon algorithm (ray casting)
 * @param {Object} point - { x, y }
 * @param {Array} polygon - Array of { x, y } points
 * @returns {boolean} - True if point is inside polygon
 */
function pointInPolygon(point, polygon) {
  if (!polygon || polygon.length < 3) return false;
  
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
                      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Export getSelectionCanvas for access if needed
export function getSelectionCanvasElement() {
  return getSelectionCanvas();
}

// Expose for backward compatibility
if (typeof window !== 'undefined') {
  window.startSquareSelection = startSquareSelection;
  window.startCircleSelection = startCircleSelection;
  window.startMultipointSelection = startMultipointSelection;
  window.updateSelection = updateSelection;
  window.completeSelection = completeSelection;
  window.clearSelection = clearSelection;
  window.captureSelection = captureSelection;
  window.isPointInSelection = isPointInSelection;
  window.renderMarchingAnts = renderMarchingAnts;
  window.syncSelectionCanvasPosition = syncSelectionCanvasPosition;
  window.clearSelectionState = clearSelectionState;
}
