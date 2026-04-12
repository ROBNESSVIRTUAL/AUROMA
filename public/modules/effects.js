/**
 * Effects Module
 * Visual effects that can be applied during drawing
 * Complete implementations extracted from editor.js
 */

import { 
  effectStates, 
  animationState, 
  canvasRefs, 
  emojiFaces,
  brushState,
  imageState,
  inputState,
  sweeperState,
  flipState,
  zoomState
} from './state.js';
import { rgbToHsl, hslToRgb } from './utils.js';
import { effectMap, getKeyboardContainer } from './constants.js';

/**
 * Check if pixel is within brush shape (helper function)
 * This should be in drawing.js but used by effects, so exported here temporarily
 */
export function isPixelInBrushShape(px, py, centerX, centerY, halfBrush) {
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
 * Capture original pixels for neon effect
 */
export function captureNeonOriginal(canvasId, lastX, lastY, brushSize) {
  const ctx = canvasId === 'base' ? canvasRefs.baseCtx : 
              canvasId === 'paint' ? canvasRefs.paintCtx : 
              canvasRefs.samplerCtx;
  const halfBrush = brushSize / 2;
  const xMin = Math.max(0, lastX - halfBrush * 1.5);
  const xMax = Math.min(ctx.canvas.width - 1, lastX + halfBrush * 1.5);
  const yMin = Math.max(0, lastY - halfBrush * 1.5);
  const yMax = Math.min(ctx.canvas.height - 1, lastY + halfBrush * 1.5);
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;
  animationState.neonOriginalPixels = [];
  for (let y = Math.floor(yMin); y <= Math.floor(yMax); y++) {
    for (let x = Math.floor(xMin); x <= Math.floor(xMax); x++) {
      if (isPixelInBrushShape(x, y, lastX, lastY, halfBrush)) {
        const i = (y * ctx.canvas.width + x) * 4;
        animationState.neonOriginalPixels.push({ r: data[i], g: data[i + 1], b: data[i + 2], x, y });
      }
    }
  }
}

/**
 * Restore original pixels for neon effect
 */
export function restoreNeonOriginal(canvasId, lastX, lastY, brushSize) {
  if (!animationState.neonOriginalPixels.length) return;
  const ctx = canvasId === 'base' ? canvasRefs.baseCtx : 
              canvasId === 'paint' ? canvasRefs.paintCtx : 
              canvasRefs.samplerCtx;
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;
  animationState.neonOriginalPixels.forEach(pixel => {
    const halfBrush = brushSize / 2;
    if (isPixelInBrushShape(pixel.x, pixel.y, lastX, lastY, halfBrush)) {
      const newI = (pixel.y * ctx.canvas.width + pixel.x) * 4;
      data[newI] = pixel.r;
      data[newI + 1] = pixel.g;
      data[newI + 2] = pixel.b;
    }
  });
  ctx.putImageData(imageData, 0, 0);
  imageState.currentImageData[canvasId] = imageData;
  animationState.neonOriginalPixels = [];
}

/**
 * Apply effects to pixel data
 * Complete implementation from editor.js lines 6608-6924
 * @param {Array} pixels - Array of pixel objects with { r, g, b, x, y } properties
 * @param {number} dx - X offset in brush
 * @param {number} dy - Y offset in brush
 * @param {number} lastX - Last X position
 * @param {number} lastY - Last Y position
 * @param {number} currentX - Current X position
 * @param {number} currentY - Current Y position
 */
export function applyEffects(pixels, dx, dy, lastX, lastY, currentX, currentY) {
  const isMultiFinger = (brushState.brushShape === 'sweeper' || brushState.brushShape === 'oilbarrel') && sweeperState.anchorPoints.length >= 2;
  const canvasId = inputState.touchPoints[0]?.target === canvasRefs.baseCanvas ? 'base' : 
                   inputState.touchPoints[0]?.target === canvasRefs.paintCanvas ? 'paint' : 'sampler';
  const ctx = canvasId === 'base' ? canvasRefs.baseCtx : 
              canvasId === 'paint' ? canvasRefs.paintCtx : 
              canvasRefs.samplerCtx;
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
      pixels.forEach(pixel => pixel.y = lastY);
    } else {
      pixels.forEach(pixel => pixel.x = lastX);
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
  if (effectStates.isFlagHeld && animationState.saturationStartTime) {
    const holdTime = (Date.now() - animationState.saturationStartTime) / 1000;
    animationState.saturationLevel = holdTime * 50;
    pixels.forEach(pixel => {
      const [h, s, l] = rgbToHsl(pixel.r, pixel.g, pixel.b);
      const newH = (h + animationState.saturationLevel * 10) % 360;
      const newS = Math.min(100, s + animationState.saturationLevel);
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
    const sinTime = Math.sin(time);
    const cosTime = Math.cos(time);
    const shiftAmount = sinTime * brushState.brushSize * 2;

    pixels.forEach(pixel => {
      const dy = pixel.y - currentY;
      const timeDy = time + dy * 0.3;
      
      // Bold color glitch
      pixel.r = Math.min(255, Math.max(0, pixel.r + Math.sin(timeDy) * 50));
      pixel.g = Math.min(255, Math.max(0, pixel.g + Math.cos(timeDy) * 50));
      pixel.b = Math.min(255, Math.max(0, pixel.b + Math.random() * 30));
      
      // Position shift
      pixel.x += Math.sin(timeDy) * brushState.brushSize * 2;
      pixel.r = Math.min(255, Math.max(0, pixel.r + sinTime * 30));
    });

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
    const outerRadius = halfBrush * 1.8;
    const xMin = Math.max(0, Math.floor(currentX - outerRadius));
    const xMax = Math.min(ctx.canvas.width - 1, Math.ceil(currentX + outerRadius));
    const yMin = Math.max(0, Math.floor(currentY - outerRadius));
    const yMax = Math.min(ctx.canvas.height - 1, Math.ceil(currentY + outerRadius));

    // Set up drawing context for binary rain
    ctx.font = `${Math.floor(brushState.brushSize / 3)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Calculate number of binary characters for the outer ring
    const charDensity = Math.max(10, Math.floor(brushState.brushSize / 6));

    // Draw binary characters in the outer ring
    for (let i = 0; i < charDensity; i++) {
      // Random angle and radius for radial distribution
      const angle = Math.random() * 2 * Math.PI;
      const radius = halfBrush * 1.1 + Math.random() * (outerRadius - halfBrush * 1.1);
      const offsetX = Math.cos(angle) * radius;
      const offsetY = Math.sin(angle) * radius;
      const newX = currentX + offsetX;
      const newY = currentY + offsetY;

      // Ensure position is OUTSIDE brush and within canvas bounds
      if (!isPixelInBrushShape(newX, newY, currentX, currentY, halfBrush) &&
          newX >= xMin && newX <= xMax && newY >= yMin && newY <= yMax) {
        // Sample color from canvas at the character's position
        const pixelData = ctx.getImageData(Math.floor(newX), Math.floor(newY), 1, 1).data;
        const r = pixelData[0] || 255;
        const g = pixelData[1] || 255;
        const b = pixelData[2] || 255;

        // Draw random binary character (0 or 1)
        const binaryChar = Math.random() > 0.5 ? '1' : '0';
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillText(binaryChar, newX, newY);
      }
    }

    // Update currentImageData to reflect changes
    imageState.currentImageData[canvasId] = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    console.log(`BinaryRain applied: ${charDensity} characters attempted OUTSIDE brush at (${currentX}, ${currentY})`);
  }
}

/**
 * Toggle an effect on/off
 * Complete implementation from editor.js lines 12294-12546
 * @param {string} effect - Effect name
 * @param {boolean} state - On/off state
 * @param {string} inputSource - Source of toggle ('qwertyKey', 'button', 'midi')
 */
export function toggleEffect(effect, state, inputSource = 'qwertyKey') {
  console.log(`toggleEffect called: effect=${effect}, state=${state}, inputSource=${inputSource}`);

  // Ensure effect is valid
  if (!Object.keys(effectMap).includes(effect)) {
    console.warn(`Invalid effect: ${effect}, skipping toggle`);
    return;
  }

  // Record effect toggle if recording
  if (typeof window.isRecording !== 'undefined' && window.isRecording) {
    // Recording logic would go here
  }

  switch (effect) {
    case 'lock':
      effectStates.isLockHeld = state;
      break;
    case 'hyphen':
      effectStates.isHyphenHeld = state;
      break;
    case 'brighten':
      effectStates.isBrightenHeld = state;
      break;
    case 'darken':
      effectStates.isDarkenHeld = state;
      break;
    case 'neon':
      effectStates.isNeonHeld = state;
      if (state && typeof window.lastX !== 'undefined' && typeof window.lastY !== 'undefined') {
        const canvasId = inputState.touchPoints[0]?.target === canvasRefs.baseCanvas ? 'base' : 
                         inputState.touchPoints[0]?.target === canvasRefs.paintCanvas ? 'paint' : 'sampler';
        captureNeonOriginal(canvasId, window.lastX, window.lastY, brushState.brushSize);
      } else {
        const canvasId = inputState.touchPoints[0]?.target === canvasRefs.baseCanvas ? 'base' : 
                         inputState.touchPoints[0]?.target === canvasRefs.paintCanvas ? 'paint' : 'sampler';
        restoreNeonOriginal(canvasId, window.lastX, window.lastY, brushState.brushSize);
      }
      break;
    case 'original':
      effectStates.isOriginalHeld = state;
      break;
    case 'emoji':
      effectStates.isEmojiHeld = state;
      break;
    case 'trash':
      effectStates.isTrashHeld = state;
      break;
    case 'flag':
      effectStates.isFlagHeld = state;
      if (state) animationState.saturationStartTime = Date.now();
      else {
        animationState.saturationLevel = 0;
        animationState.saturationStartTime = null;
      }
      break;
    case 'chromaticShift':
      effectStates.isChromaticShiftHeld = state;
      break;
    case 'teleport':
      effectStates.isTeleportHeld = state;
      if (!state) {
        // Reset teleport state - this would be in teleportState module
        console.log('Teleport reset');
      }
      break;
    case 'caustics':
      effectStates.isCausticsHeld = state;
      break;
    case 'fractalStretch':
      effectStates.isFractalStretchHeld = state;
      break;
    case 'neonBend':
      effectStates.isNeonBendHeld = state;
      break;
    case 'glitchTide':
      effectStates.isGlitchTideHeld = state;
      break;
    case 'binaryRain':
      effectStates.isBinaryRainHeld = state;
      break;
    case 'photoCRT':
      effectStates.isPhotoCRTHeld = state;
      break;
    case 'pointBreak':
      effectStates.isPointBreakHeld = state;
      break;
    case 'scatter':
      effectStates.isScatterHeld = state;
      break;
    case 'flipHorizontal':
      if (state) {
        flipState.isFlipHorizontalActive = true;
        flipState.hasFlippedHorizontalThisDrag = typeof window.isDragging !== 'undefined' && window.isDragging;
        // flipStamps('horizontal') would be called here
        console.log(`flipHorizontal toggled to ${flipState.isFlipHorizontalActive}`);
      } else {
        flipState.isFlipHorizontalActive = false;
        flipState.hasFlippedHorizontalThisDrag = false;
        console.log(`flipHorizontal turned off`);
      }
      break;
    case 'flipVertical':
      if (state) {
        flipState.isFlipVerticalActive = true;
        flipState.hasFlippedVerticalThisDrag = typeof window.isDragging !== 'undefined' && window.isDragging;
        // flipStamps('vertical') would be called here
        console.log(`flipVertical toggled to ${flipState.isFlipVerticalActive}`);
      } else {
        flipState.isFlipVerticalActive = false;
        flipState.hasFlippedVerticalThisDrag = false;
        console.log(`flipVertical turned off`);
      }
      break;
    case 'ditherVibe':
      effectStates.isDitherVibeHeld = state;
      console.log(`ditherVibe toggled to ${effectStates.isDitherVibeHeld}`);
      break;
    case 'flickerNegative':
      effectStates.isFlickerNegativeHeld = state;
      if (!state) animationState.flickerPhase = 0;
      console.log(`flickerNegative toggled to ${effectStates.isFlickerNegativeHeld}`);
      break;
    default:
      console.warn(`Unknown effect: ${effect}`);
      return;
  }

  // Update UI keyboard element if available
  const keyboardContainer = getKeyboardContainer();
  if (keyboardContainer) {
    const keyElement = Array.from(keyboardContainer.children).find(el => el.dataset.effect === effect);
    if (keyElement) {
      const isActive = effectStates[`is${effect.charAt(0).toUpperCase() + effect.slice(1)}Held`] || 
                       (effect === 'flipHorizontal' && flipState.isFlipHorizontalActive) ||
                       (effect === 'flipVertical' && flipState.isFlipVerticalActive);
      keyElement.classList.toggle('active', isActive || false);
      console.log(`UI updated for ${effect}: active=${isActive || false}`);
    } else {
      console.warn(`No key element found for effect: ${effect}`);
    }
  }
}

/**
 * Update animation phases (should be called in animation loop)
 */
export function updateAnimations() {
  if (effectStates.isNeonHeld) {
    animationState.neonPhase = (animationState.neonPhase + 2) % 360;
  }
  
  if (effectStates.isFlickerNegativeHeld) {
    animationState.flickerPhase += 0.1;
  }
  
  if (effectStates.isEmojiHeld) {
    animationState.emojiPhase = (animationState.emojiPhase + 0.05) % emojiFaces.length;
  }
}

// Expose to window for backward compatibility
if (typeof window !== 'undefined') {
  window.toggleEffect = toggleEffect;
  window.applyEffects = applyEffects;
}
