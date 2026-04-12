/**
 * State Management Module
 * Centralizes all application state variables
 */

// Canvas references and contexts
export const canvasRefs = {
  baseCanvas: null,
  baseCtx: null,
  paintCanvas: null,
  paintCtx: null,
  samplerCanvas: null,
  samplerCtx: null,
  offscreenCanvas: null,
  offscreenCtx: null
};

// Effect tracking
export const activeEffects = new Set();

// Image state
export const imageState = {
  img: new Image(),
  samplerImg: new Image(),
  originalImageData: { base: null, paint: null, sampler: null },
  currentImageData: { base: null, paint: null, sampler: null },
  lastStateBeforeReset: { base: null, paint: null, sampler: null }
};

// Drag state
export const dragState = {
  isDragging: false,
  isDraggingOilbarrel: false,
  oilbarrelDragState: {
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    canvasId: null,
    ctx: null,
    targetCanvas: null
  },
  oilbarrelRafId: null,
  hasCanvasChanged: false,
  shouldSaveState: true,
  lastX: null,
  lastY: null
};

// Brush state
export const brushState = {
  brushSize: 200,
  baseBrushSize: 200,
  brushShape: 'box',
  brushRotation: 0,
  cloneBrushSize: 200,
  cloneBrushRotation: 0,
  paintColor: { r: 255, g: 0, b: 0 },
  isStampSelected: false,
  stampOrder: ['sticker1', 'sticker2', 'sticker3', 'sticker4', 'sticker5'],
  flippedBrushSnapshot: null,
  flippedBrushWidth: 0,
  flippedBrushHeight: 0,
  flippedStampImages: {
    'sticker1': { horizontal: null, vertical: null },
    'sticker2': { horizontal: null, vertical: null },
    'sticker3': { horizontal: null, vertical: null },
    'sticker4': { horizontal: null, vertical: null },
    'sticker5': { horizontal: null, vertical: null }
  }
};

// Rotation state
export const rotationState = {
  isRotatingLeft: false,
  isRotatingRight: false,
  isFlippingUp: false,
  isFlippingDown: false,
  isIntentionalRotation: false,
  rotationSpeed: 0.005
};

// Flip state
export const flipState = {
  isFlipHorizontalActive: false,
  isFlipVerticalActive: false,
  hasFlippedHorizontalThisDrag: false,
  hasFlippedVerticalThisDrag: false,
  verticalFlip: false,
  sourcePivotX: null,
  sourcePivotY: null,
  flipPivotX: null,
  flipPivotY: null
};

// Selection tool state
export const selectionState = {
  isSelecting: false,
  selectionType: null, // 'square' or 'multipoint'
  isDraggingSelection: false,
  selectionStart: null,
  selectionEnd: null,
  multipointPath: [],
  isSelectionActive: false,
  selectedImageData: null,
  selectionBounds: null,
  lastTapTime: 0,
  selectionCanvas: null,
  selectionCtx: null,
  selectionCacheCanvas: null,
  selectionCacheCtx: null,
  lastDragTime: 0,
  dragThrottleMs: 16
};

// Sweeper/smear state
export const sweeperState = {
  sweeperMode: 'off',
  anchorPoints: [],
  smearAnchor: null
};

// Touch/input state
export const inputState = {
  touchPoints: [],
  lastTouchPoints: [],
  globalMouseMoveHandler: null,
  globalTouchMoveHandler: null,
  lastTouchTime: 0,
  lastCloseTime: 0,
  lastTapTime: 0,
  lastTouchId: null
};

// Teleport state
export const teleportState = {
  teleportChain: [],
  cloneButtonFingerId: null,
  teleportSourceX: null,
  teleportSourceY: null,
  teleportFirstFinger: null,
  teleportSourceData: null,
  teleportCanvasId: null,
  teleportDestinations: [],
  crossTeleportSourceCanvas: null,
  crossTeleportSourceX: null,
  crossTeleportSourceY: null
};

// Sampler state
export const samplerState = {
  samplerSourceX: null,
  samplerSourceY: null
};

// Undo/Redo state
export const historyState = {
  undoStack: [],
  redoStack: [],
  MAX_UNDO: 20
};

// Zoom and pan state
export const zoomState = {
  isZooming: false,
  zoomLevel: 1,
  panX: 0,
  panY: 0,
  zoomCenterX: 0,
  zoomCenterY: 0,
  canvasStates: {
    base: { 
      zoomLevel: 1, panX: 0, panY: 0, zoomPivotX: 0, zoomPivotY: 0, 
      hasZoomedIn: false, redrawRequest: null, redrawTimeout: null, 
      isRedrawing: false, offscreenCanvas: null, targetLocked: false, 
      targetX: 0, targetY: 0 
    },
    paint: { 
      zoomLevel: 1, panX: 0, panY: 0, zoomPivotX: 0, zoomPivotY: 0, 
      hasZoomedIn: false, redrawRequest: null, redrawTimeout: null, 
      isRedrawing: false, offscreenCanvas: null, targetLocked: false, 
      targetX: 0, targetY: 0 
    },
    sampler: { 
      zoomLevel: 1, panX: 0, panY: 0, zoomPivotX: 0, zoomPivotY: 0, 
      hasZoomedIn: false, redrawRequest: null, redrawTimeout: null, 
      isRedrawing: false, offscreenCanvas: null, targetLocked: false, 
      targetX: 0, targetY: 0 
    }
  },
  isResetToOriginal: { base: false, paint: false, sampler: false }
};

// Effect toggle states
export const effectStates = {
  isLockHeld: false,
  isHyphenHeld: false,
  isBrightenHeld: false,
  isDarkenHeld: false,
  isNeonHeld: false,
  isOriginalHeld: false,
  isPaintMode: false,
  isEmojiHeld: false,
  isTrashHeld: false,
  isFlagHeld: false,
  isChromaticShiftHeld: false,
  isTeleportHeld: false,
  isCausticsHeld: false,
  isFractalStretchHeld: false,
  isNeonBendHeld: false,
  isGlitchTideHeld: false,
  isBinaryRainHeld: false,
  isPhotoCRTHeld: false,
  isPointBreakHeld: false,
  isScatterHeld: false,
  isDitherVibeHeld: false,
  isFlickerNegativeHeld: false
};

// Effect animation states
export const animationState = {
  neonPhase: 0,
  lastFlickerUpdate: 0,
  emojiPhase: 0,
  saturationLevel: 0,
  saturationStartTime: null,
  vhsPhase: 0,
  flickerPhase: 0,
  neonOriginalPixels: [],
  marchingAntsTimeoutId: null,
  marchingAntsFrameId: null
};

// Recording state
export const recordingState = {
  isRecording: false,
  currentMovement: null,
  recordedMovements: [],
  lastEffectRecordTime: 0
};

// Roll/dice state
export const rollState = {
  isRolling: false,
  rollTimeouts: [],
  rollHistory: { base: [], paint: [], sampler: [] },
  completed: 0,
  vhsNoiseLevel: 0
};

// Reset mode
export const resetState = {
  isInResetMode: false
};

// Sticker images
export const stickerImages = {
  'sticker1': null,
  'sticker2': null,
  'sticker3': null,
  'sticker4': null,
  'sticker5': null
};

// Canvas original dimensions
export const originalDimensions = {
  originalWidths: { base: 0, paint: 0, sampler: 0 },
  originalHeights: { base: 0, paint: 0, sampler: 0 }
};

// Wallet/Blockchain state (to be used by blockchain.js)
export const walletState = {
  currentAccount: null,
  currentNetwork: null,
  walletProvider: null,
  roninProvider: null
};

// MIDI state (to be used by midi.js)
export const midiState = {
  midiAccess: null
};

// Color picker state
export const colorPickerState = {
  currentHue: 0,
  currentSaturation: 1,
  currentValue: 1,
  isDraggingHue: false,
  isDraggingSV: false
};

// Emoji list
export const emojiFaces = [
  '💩', '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊',
  '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙',
  '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎',
  '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁',
  '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
  '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥',
  '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '🫥', '😶‍🌫️', '😐',
  '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴',
  '🤤', '😪', '😵', '😵‍💫', '🤐', '🥴', '🤢', '🤮', '🤧', '😷',
  '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '👻',
  '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻',
  '😼', '😽', '🙀', '😿', '😾', '🐶', '🐵', '🦁', '🐯', '🐺',
  '🦊', '🦝', '🐷', '🐗', '🐮', '🐻', '🐼', '🐨', '🐭', '🐹',
  '🐰', '🐸', '🦒', '🦄', '🐲'
];

/**
 * Initialize canvas references
 * Should be called after DOM is loaded
 */
export function initializeCanvasRefs() {
  canvasRefs.baseCanvas = document.getElementById('baseCanvas');
  canvasRefs.baseCtx = canvasRefs.baseCanvas?.getContext('2d', { willReadFrequently: true });
  canvasRefs.paintCanvas = document.getElementById('paintCanvas');
  canvasRefs.paintCtx = canvasRefs.paintCanvas?.getContext('2d', { willReadFrequently: true });
  canvasRefs.samplerCanvas = document.getElementById('samplerCanvas');
  canvasRefs.samplerCtx = canvasRefs.samplerCanvas?.getContext('2d', { willReadFrequently: true });
  canvasRefs.offscreenCanvas = new OffscreenCanvas(1, 1);
  canvasRefs.offscreenCtx = canvasRefs.offscreenCanvas.getContext('2d', { willReadFrequently: true });
  
  // Initialize selection canvases
  selectionState.selectionCanvas = document.createElement('canvas');
  selectionState.selectionCtx = selectionState.selectionCanvas.getContext('2d');
}

/**
 * Initialize window globals
 * Some variables are attached to window for cross-scope access
 */
export function initializeWindowGlobals() {
  window.lastTouchTime = 0;
  window.lastCloseTime = 0;
  window.lastTapTime = 0;
  window.lastTouchId = null;
}

