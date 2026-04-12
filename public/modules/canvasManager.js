/**
 * Canvas Management Module
 * Handles canvas initialization, image loading, and drag-and-drop
 */

import { canvasRefs, imageState, zoomState, historyState } from './state.js';
import { validateImageFile } from './utils.js';

/**
 * Initialize drag and drop functionality for all canvases
 */
export function initializeDragAndDrop() {
  console.log('Adding drag & drop to all canvases...');

  const { baseCanvas, paintCanvas, samplerCanvas } = canvasRefs;
  const canvasContainer = document.getElementById('canvasContainer');

  const allTargets = [baseCanvas, paintCanvas, samplerCanvas, canvasContainer];

  allTargets.forEach(function(target) {
    // Allow dropping
    target.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      
      // Add visual feedback
      if (target !== canvasContainer) {
        target.style.boxShadow = '0 0 20px #00FF00';
        target.style.filter = 'brightness(1.1)';
      }
    });
    
    // Remove visual feedback when drag leaves
    target.addEventListener('dragleave', function(e) {
      e.preventDefault();
      if (target !== canvasContainer) {
        target.style.boxShadow = '';
        target.style.filter = '';
      }
    });
    
    // Handle file drop
    target.addEventListener('drop', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Remove visual feedback
      if (target !== canvasContainer) {
        target.style.boxShadow = '';
        target.style.filter = '';
      }
      
      const files = e.dataTransfer.files;
      
      if (files.length === 0) {
        alert('No files dropped!');
        return;
      }
      
      const file = files[0];
      
      if (!file.type.startsWith('image/')) {
        alert('Please drop an image file (PNG, JPG, etc.)');
        return;
      }
      
      // Determine target canvas
      let targetCanvas = 'base';
      if (target.id === 'paintCanvas') {
        targetCanvas = 'paint';
      } else if (target.id === 'samplerCanvas') {
        targetCanvas = 'sampler';
      } else if (target.id === 'baseCanvas') {
        targetCanvas = 'base';
      }
      
      loadDroppedImage(file, targetCanvas);
    });
  });

  console.log('Drag & drop ready!');
}

/**
 * Load a dropped image file to the specified canvas
 * @param {File} file - The image file to load
 * @param {string} targetCanvas - Target canvas ('base', 'paint', or 'sampler')
 */
export function loadDroppedImage(file, targetCanvas = 'base') {
  const reader = new FileReader();

  reader.onload = function(e) {
    const newImage = new Image();
    
    newImage.onload = function() {
      if (targetCanvas === 'base') {
        loadToBaseCanvas(newImage);
      } else if (targetCanvas === 'paint') {
        loadToPaintCanvas(newImage);
      } else if (targetCanvas === 'sampler') {
        loadToSamplerCanvas(newImage);
      }
    };
    
    newImage.src = e.target.result;
  };

  reader.readAsDataURL(file);
}

/**
 * Load image to Base Canvas
 * @param {Image} newImage - The image to load
 */
export function loadToBaseCanvas(newImage) {
  const canvas = canvasRefs.baseCanvas;
  const ctx = canvasRefs.baseCtx;

  // Resize canvas to match image dimensions
  canvas.width = newImage.width;
  canvas.height = newImage.height;

  // Clear and fill with white background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the image at actual size
  ctx.drawImage(newImage, 0, 0);

  // Update state
  imageState.img.src = newImage.src;
  imageState.currentImageData.base = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Save state if function is available
  if (typeof window.saveState === 'function') {
    window.saveState(true);
  }

  console.log('Image loaded to Base Canvas! Dimensions:', newImage.width + 'x' + newImage.height);
}

/**
 * Load image to Paint Canvas
 * @param {Image} newImage - The image to load
 */
export function loadToPaintCanvas(newImage) {
  const canvas = canvasRefs.paintCanvas;
  const ctx = canvasRefs.paintCtx;

  // Resize canvas to match image dimensions
  canvas.width = newImage.width;
  canvas.height = newImage.height;

  // Clear the canvas (no white background for paint canvas)
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the image at actual size
  ctx.drawImage(newImage, 0, 0);

  // Update state
  imageState.currentImageData.paint = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Save state if function is available
  if (typeof window.saveState === 'function') {
    window.saveState(true);
  }

  console.log('Image loaded to Paint Canvas! Dimensions:', newImage.width + 'x' + newImage.height);
}

/**
 * Load image to Sampler Canvas
 * @param {Image} newImage - The image to load
 */
export function loadToSamplerCanvas(newImage) {
  const canvas = canvasRefs.samplerCanvas;
  const ctx = canvasRefs.samplerCtx;

  // Resize canvas to match image dimensions
  canvas.width = newImage.width;
  canvas.height = newImage.height;

  // Clear and fill with white background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the image at actual size
  ctx.drawImage(newImage, 0, 0);

  // Make sure sampler canvas is visible
  canvas.style.display = 'block';

  // Update state
  imageState.samplerImg.src = newImage.src;
  imageState.currentImageData.sampler = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Save state if function is available
  if (typeof window.saveState === 'function') {
    window.saveState(true);
  }

  console.log('Image loaded to Sampler Canvas! Dimensions:', newImage.width + 'x' + newImage.height);
}

/**
 * Compare two ImageData objects for equality
 * Uses sampling for performance (checks every 50th pixel)
 * @param {ImageData} imageData1 - First ImageData
 * @param {ImageData} imageData2 - Second ImageData
 * @returns {boolean} - True if identical
 */
export function compareImageData(imageData1, imageData2) {
  if (!imageData1 || !imageData2) return false;
  if (imageData1.width !== imageData2.width || imageData1.height !== imageData2.height) return false;

  const data1 = imageData1.data;
  const data2 = imageData2.data;
  if (data1.length !== data2.length) return false;

  // More thorough comparison for selection drags (check every 50th pixel)
  for (let i = 0; i < data1.length; i += 200) { // 200 = 50 pixels * 4 channels
    if (data1[i] !== data2[i] || data1[i+1] !== data2[i+1] || data1[i+2] !== data2[i+2] || data1[i+3] !== data2[i+3]) {
      return false;
    }
  }
  return true;
}

/**
 * Ensure all canvases match dimensions
 * @param {number} width - Target width
 * @param {number} height - Target height
 */
export function ensureCanvasDimensions(width, height) {
  ['base', 'paint', 'sampler'].forEach(canvasId => {
    const canvas = canvasRefs[`${canvasId}Canvas`];
    const ctx = canvasRefs[`${canvasId}Ctx`];
    
    if (canvas.width !== width || canvas.height !== height) {
      // Save current content
      const currentData = imageState.currentImageData[canvasId];
      
      // Resize canvas
      canvas.width = width;
      canvas.height = height;
      
      // Fill with white background for base and sampler
      if (canvasId !== 'paint') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      }
      
      // Restore content if available
      if (currentData) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = currentData.width;
        tempCanvas.height = currentData.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(currentData, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0, currentData.width, currentData.height, 0, 0, width, height);
      }
      
      // Update image data
      imageState.currentImageData[canvasId] = ctx.getImageData(0, 0, width, height);
      if (!imageState.originalImageData[canvasId] || canvasId === 'paint') {
        imageState.originalImageData[canvasId] = ctx.getImageData(0, 0, width, height);
      }
      
      // Recreate offscreen canvas
      zoomState.canvasStates[canvasId].offscreenCanvas = document.createElement('canvas');
      zoomState.canvasStates[canvasId].offscreenCanvas.width = width;
      zoomState.canvasStates[canvasId].offscreenCanvas.height = height;
      const offscreenCtx = zoomState.canvasStates[canvasId].offscreenCanvas.getContext('2d', { alpha: true });
      offscreenCtx.imageSmoothingEnabled = true;
      offscreenCtx.imageSmoothingQuality = 'high';
      offscreenCtx.putImageData(imageState.currentImageData[canvasId], 0, 0);
      
      // Reset zoom and pan
      zoomState.canvasStates[canvasId].zoomLevel = 1;
      zoomState.canvasStates[canvasId].panX = 0;
      zoomState.canvasStates[canvasId].panY = 0;
      zoomState.canvasStates[canvasId].targetLocked = false;
    }
  });
  
  // Update offscreen canvas
  canvasRefs.offscreenCanvas.width = width;
  canvasRefs.offscreenCanvas.height = height;
}

/**
 * Get canvas and context by ID
 * @param {string} canvasId - Canvas identifier ('base', 'paint', or 'sampler')
 * @returns {Object} - { canvas, ctx }
 */
export function getCanvas(canvasId) {
  return {
    canvas: canvasRefs[`${canvasId}Canvas`],
    ctx: canvasRefs[`${canvasId}Ctx`]
  };
}

/**
 * Clear a canvas
 * @param {string} canvasId - Canvas identifier
 * @param {boolean} fillWhite - Whether to fill with white background
 */
export function clearCanvas(canvasId, fillWhite = false) {
  const { canvas, ctx } = getCanvas(canvasId);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (fillWhite) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

/**
 * Get canvas coordinates from mouse/touch event
 * Accounts for canvas borders and scaling
 * @param {Event} e - Mouse or touch event
 * @param {Object} touch - Touch object (optional)
 * @returns {Object} - { x, y, valid }
 */
export function getCanvasCoordinates(e, touch) {
  const canvas = touch?.target || e.target;
  const validCanvases = [canvasRefs.baseCanvas, canvasRefs.paintCanvas, canvasRefs.samplerCanvas];
  
  if (!validCanvases.includes(canvas)) {
    console.log('Skipping coordinate calculation for non-canvas target:', canvas?.tagName);
    return { x: 0, y: 0, valid: false };
  }

  const rect = canvas.getBoundingClientRect();
  const clientX = touch?.clientX !== undefined && !isNaN(touch.clientX) ? touch.clientX : 
                  (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX);
  const clientY = touch?.clientY !== undefined && !isNaN(touch.clientY) ? touch.clientY : 
                  (e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY);

  if (isNaN(clientX) || isNaN(clientY) || clientX === undefined || clientY === undefined) {
    console.error('Invalid client coordinates:', { clientX, clientY, touch, eventType: e.type });
    return { x: 0, y: 0, valid: false };
  }

  // Account for canvas borders properly
  const canvasStyle = getComputedStyle(canvas);
  const borderLeft = parseFloat(canvasStyle.borderLeftWidth) || 0;
  const borderTop = parseFloat(canvasStyle.borderTopWidth) || 0;
  const borderRight = parseFloat(canvasStyle.borderRightWidth) || 0;
  const borderBottom = parseFloat(canvasStyle.borderBottomWidth) || 0;

  // Calculate position relative to canvas content area (excluding borders)
  const relativeX = clientX - rect.left - borderLeft;
  const relativeY = clientY - rect.top - borderTop;

  // Canvas content dimensions (excluding borders)
  const contentWidth = rect.width - borderLeft - borderRight;
  const contentHeight = rect.height - borderTop - borderBottom;

  // Convert to canvas pixel coordinates
  const canvasX = relativeX * (canvas.width / contentWidth);
  const canvasY = relativeY * (canvas.height / contentHeight);

  if (isNaN(canvasX) || isNaN(canvasY) || !isFinite(canvasX) || !isFinite(canvasY)) {
    console.error('Invalid canvas coordinates:', { clientX, clientY, canvasX, canvasY, relativeX, relativeY, contentWidth, contentHeight });
    return { x: 0, y: 0, valid: false };
  }

  return { x: canvasX, y: canvasY, valid: true };
}

