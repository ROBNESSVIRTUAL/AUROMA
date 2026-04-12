const baseCanvas = document.getElementById('baseCanvas');
const baseCtx = baseCanvas.getContext('2d', { willReadFrequently: true });
const paintCanvas = document.getElementById('paintCanvas');
const paintCtx = paintCanvas.getContext('2d', { willReadFrequently: true });
const samplerCanvas = document.getElementById('samplerCanvas');
const samplerCtx = samplerCanvas.getContext('2d', { willReadFrequently: true });
const offscreenCanvas = new OffscreenCanvas(1, 1);
const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
// Track active effects to prevent multiple triggers
const activeEffects = new Set();
let img = new Image();
let samplerImg = new Image();
let isDragging = false;
let isDraggingOilbarrel = false;
let oilbarrelDragState = {
startX: 0,
startY: 0,
endX: 0,
endY: 0,
canvasId: null,
ctx: null,
targetCanvas: null
};
let oilbarrelRafId = null;
let hasCanvasChanged = false; // Track if canvas was modified
let shouldSaveState = true; // Controls state saving during drag
let brushSize = 200;
let stampOrder = ['sticker1', 'sticker2', 'sticker3', 'sticker4', 'sticker5'];
let isStampSelected = false;
let baseBrushSize = 200;
let brushShape = 'box';
let sweeperMode = 'off';
let anchorPoints = [];
let smearAnchor = null;
let lastX, lastY;
let touchPoints = [];
let globalMouseMoveHandler = null;
let globalTouchMoveHandler = null;
let lastTouchPoints = [];
let teleportChain = [];
let cloneButtonFingerId = null;
let undoStack = [];
let redoStack = [];
let originalImageData = { base: null, paint: null, sampler: null };
let currentImageData = { base: null, paint: null, sampler: null };
let lastStateBeforeReset = { base: null, paint: null, sampler: null };
// Selection tool states
let isSelecting = false; // True during selection creation
let selectionType = null; // 'square' or 'multipoint'
let isDraggingSelection = false;
let selectionStart = null; // { x, y } for square selection start
let selectionEnd = null; // { x, y } for square selection end
let multipointPath = []; // Array of { x, y } for multipoint selection
let isSelectionActive = false; // True when selection is complete and draggable
let selectedImageData = null; // ImageData of selected area
let selectionBounds = null; // { xMin, xMax, yMin, yMax } of selection
let lastTapTime = 0; // For double-tap detection
let selectionCanvas = document.createElement('canvas'); // Temporary canvas for marching ants
let selectionCtx = selectionCanvas.getContext('2d');
let lastDragTime = 0;
let isInResetMode = false;
const dragThrottleMs = 16; // ~60fps
let selectionCacheCanvas = null;
let selectionCacheCtx = null;
window.lastTouchTime = 0;
window.lastCloseTime = 0;
window.lastTapTime = 0;
window.lastTouchId = null;
// Initialize canvasStates for zoom and pan per canvas
let canvasStates = {
base: { zoomLevel: 1, panX: 0, panY: 0, zoomPivotX: 0, zoomPivotY: 0, hasZoomedIn: false, redrawRequest: null, redrawTimeout: null, isRedrawing: false, offscreenCanvas: null, targetLocked: false, targetX: 0, targetY: 0 },
paint: { zoomLevel: 1, panX: 0, panY: 0, zoomPivotX: 0, zoomPivotY: 0, hasZoomedIn: false, redrawRequest: null, redrawTimeout: null, isRedrawing: false, offscreenCanvas: null, targetLocked: false, targetX: 0, targetY: 0 },
sampler: { zoomLevel: 1, panX: 0, panY: 0, zoomPivotX: 0, zoomPivotY: 0, hasZoomedIn: false, redrawRequest: null, redrawTimeout: null, isRedrawing: false, offscreenCanvas: null, targetLocked: false, targetX: 0, targetY: 0 }
};
let isResetToOriginal = { base: false, paint: false, sampler: false };
const MAX_UNDO = 20;
let isLockHeld = false;
let isHyphenHeld = false;
let isBrightenHeld = false;
let isDarkenHeld = false;
let isNeonHeld = false;
let isOriginalHeld = false;
let isPaintMode = false;
let isEmojiHeld = false;
let isTrashHeld = false;
let isFlagHeld = false;
let isChromaticShiftHeld = false;
let isTeleportHeld = false;
let isCausticsHeld = false;
let isFractalStretchHeld = false;
let isNeonBendHeld = false;
let isGlitchTideHeld = false;
let marchingAntsTimeoutId = null;
let marchingAntsFrameId = null;
let isBinaryRainHeld = false;
let isPhotoCRTHeld = false;
let isPointBreakHeld = false;
let isScatterHeld = false;
let isZooming = false;
let zoomLevel = 1; // Default zoom (1 = 100%)
let panX = 0; // Horizontal pan offset
let panY = 0; // Vertical pan offset
let zoomCenterX = 0; // Center of zoom for touch/mouse
let zoomCenterY = 0;
let isFlipHorizontalActive = false;
let isFlipVerticalActive = false;
let hasFlippedHorizontalThisDrag = false;
let hasFlippedVerticalThisDrag = false;
let flippedBrushSnapshot = null;
let isDitherVibeHeld = false;
let isFlickerNegativeHeld = false;
let flickerPhase = 0;
let flippedBrushWidth = 0;
let flippedBrushHeight = 0;

let flippedStampImages = {
'sticker1': { horizontal: null, vertical: null },
'sticker2': { horizontal: null, vertical: null },
'sticker3': { horizontal: null, vertical: null },
'sticker4': { horizontal: null, vertical: null },
'sticker5': { horizontal: null, vertical: null }
};

let brushRotation = 0;
let isRotatingLeft = false;
let isIntentionalRotation = false; // Tracks deliberate rotations
let isRotatingRight = false;
let isFlippingUp = false;
let isFlippingDown = false;
let rotationSpeed = 0.005; // Radians per frame

let cloneBrushSize = 200; // For cloned stickers
let cloneBrushRotation = 0; // For cloned stickers
let verticalFlip = false; // Tracks vertical flip state (true = flipped)
let sourcePivotX = null;
let sourcePivotY = null;
let flipPivotX = null;
let flipPivotY = null;
let teleportSourceX = null;
let teleportSourceY = null;
let teleportFirstFinger = null;
let teleportSourceData = null;
let teleportCanvasId = null;
let samplerSourceX = null;
let samplerSourceY = null;
let neonPhase = 0;
let lastFlickerUpdate = 0;
let emojiPhase = 0;
let saturationLevel = 0;
let saturationStartTime = null;
let vhsPhase = 0;
let neonOriginalPixels = [];
let paintColor = { r: 255, g: 0, b: 0 };
const emojiFaces = [
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
let isRolling = false;
let rollTimeouts = [];
let rollHistory = { base: [], paint: [], sampler: [] };
let completed = 0;
let vhsNoiseLevel = 0;
let isRecording = false;
let currentMovement = null;
let recordedMovements = [];
let lastEffectRecordTime = 0; // For throttling effect recordings


let teleportDestinations = []; // Array of { canvasId, x, y, lastX, lastY, fingerId }
let crossTeleportSourceCanvas = null;
let crossTeleportSourceX = null;
let crossTeleportSourceY = null;

const effectMap = {
'lock': { midi: 48, key: 'q' },
'hyphen': { midi: 49, key: 'w' },
'brighten': { midi: 50, key: 'e' },
'darken': { midi: 51, key: 'a' },
'neon': { midi: 52, key: 's' },
'original': { midi: 53, key: 'd' },
'emoji': { midi: 54, key: 'z' },
'trash': { midi: 55, key: 'x' },
'flag': { midi: 56, key: 'c' },
'chromaticShift': { midi: 57, key: 'v' },
'teleport': { midi: 58, key: 'b' },
'caustics': { midi: 59, key: 'm' },
'fractalStretch': { midi: 60, key: 'n' },
'neonBend': { midi: 61, key: 'j' },
'glitchTide': { midi: 62, key: 'k' },
'binaryRain': { midi: 63, key: 'l' },
'photoCRT': { midi: 64, key: 'g' },
'pointBreak': { midi: 65, key: 'h' },
'scatter': { midi: 66, key: 'u' },
'flipHorizontal': { midi: 67, key: 'i' },
'flipVertical': { midi: 68, key: 'o' },
'flickerNegative': { midi: 69, key: 'p' },
'ditherVibe': { midi: 70, key: 't' }
};

const keyboardContainer = document.getElementById('virtualKeyboard');
const keyLabels = [
{ note: 'C3', effect: 'lock', class: 'white-key', key: 'Q', png: '/images/Q-GLITCHLINE.png', tooltip: 'GLITCH CROSSHAIR EFFECT' },
{ note: 'C#3', effect: 'hyphen', class: 'black-key', key: 'W', png: '/images/W-NOISESPREAD.png', tooltip: 'NOISE EFFECT' },
{ note: 'D3', effect: 'brighten', class: 'white-key', key: 'E', png: '/images/E-BRIGHTEN.png', tooltip: 'BRIGHTEN EFFECT' },
{ note: 'D#3', effect: 'darken', class: 'black-key', key: 'A', png: '/images/A-DARKEN.png', tooltip: 'DARKEN EFFECT' },
{ note: 'E3', effect: 'neon', class: 'white-key', key: 'S', png: '/images/S-RAINBOW.png', tooltip: 'RAINBOW EFFECT' },
{ note: 'F3', effect: 'original', class: 'white-key', key: 'D', png: '/images/D-ERASER.png', tooltip: 'ERASER EFFECT' },
{ note: 'F#3', effect: 'emoji', class: 'black-key', key: 'Z', png: '/images/Z-EMOJI.png', tooltip: 'EMOJI EFFECT' },
{ note: 'G3', effect: 'trash', class: 'white-key', key: 'X', png: '/images/X-DOGPILE.png', tooltip: 'TUMBLER/GLITCH EFFECT' },
{ note: 'G#3', effect: 'flag', class: 'black-key', key: 'C', png: '/images/C-BURNINGFOIL.png', tooltip: 'BURNING FOIL EFFECT' },
{ note: 'A3', effect: 'chromaticShift', class: 'white-key', key: 'V', png: '/images/V-RAINBOWGLOW.png', tooltip: 'TRANSPARENT NEON RAINBOW EFFECT' },
{ note: 'A#3', effect: 'teleport', class: 'black-key', key: 'B', png: '/images/B-TELEPORT.png', tooltip: 'CLONE EFFECT (IF YOU USE MULTIPLE FINGERS/TOUCHSCREEN YOU CAN ADD MORE COPIES OF THE BRUSH AND DRAG)' },
{ note: 'B3', effect: 'caustics', class: 'white-key', key: 'M', png: '/images/M-SWIMMING.png', tooltip: 'CAUSTICS EFFECT' },
{ note: 'C4', effect: 'fractalStretch', class: 'white-key', key: 'N', png: '/images/N-CROSSNOISE.png', tooltip: 'NOISE SWIRL (LIGHT) EFFECT' },
{ note: 'C#4', effect: 'neonBend', class: 'black-key', key: 'J', png: '/images/J-COSMOS.png', tooltip: 'NOISE SWIRL (DARK/SPACE) EFFECT' },
{ note: 'D4', effect: 'glitchTide', class: 'white-key', key: 'K', png: '/images/K-WINDOWBLINDS.png', tooltip: 'WINDOWBLINDS/GLITCH EFFECT' },
{ note: 'D#4', effect: 'binaryRain', class: 'black-key', key: 'L', png: '/images/L-BINARYRAIN.png', tooltip: 'BINARY SPREAD EFFECT' },
{ note: 'E4', effect: 'photoCRT', class: 'white-key', key: 'G', png: '/images/G-RADIOACTIVE.png', tooltip: 'RADIATION EFFECT' },
{ note: 'F4', effect: 'pointBreak', class: 'white-key', key: 'H', png: '/images/H-WAVE.png', tooltip: 'WAVE EFFECT' },
{ note: 'F#4', effect: 'scatter', class: 'black-key', key: 'U', png: '/images/U-SCATTER.png', tooltip: 'SURROUND SCATTER EFFECT' },
{ note: 'G#4', effect: 'flipHorizontal', class: 'white-key', key: 'I', png: '/images/I-HORIZONTALFLIP.png', tooltip: 'FLIP BRUSH HORIZONTAL EFFECT' },
{ note: 'A4', effect: 'flipVertical', class: 'black-key', key: 'O', png: '/images/O-VERTICALFLIP.png', tooltip: 'FLIP BRUSH VERTICAL EFFECT' },
{ note: 'A#4', effect: 'flickerNegative', class: 'white-key', key: 'P', png: '/images/P-NEGATIVE.png', tooltip: 'INVERSION/NEGATIVE EFFECT' },
{ note: 'B4', effect: 'ditherVibe', class: 'white-key', key: 'T', png: '/images/T-DITHERVIBE.png', tooltip: 'PIXEL/MATRIX DRAG EFFECT' }
];



function validateImageFile(file) {
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const maxSize = 10 * 1024 * 1024; // 10MB

if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP allowed.');
}
if (file.size > maxSize) {
    throw new Error('File too large. Maximum 10MB allowed.');
}

// Check file header (magic bytes)
return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const arr = new Uint8Array(e.target.result);
        let header = '';
        for (let i = 0; i < Math.min(4, arr.length); i++) {
            header += arr[i].toString(16).padStart(2, '0');
        }
        
        const validHeaders = ['ffd8ff', '89504e', '47494638', '52494646'];
        if (!validHeaders.some(valid => header.startsWith(valid))) {
            reject(new Error('Invalid file format detected.'));
        } else {
            resolve();
        }
    };
    reader.readAsArrayBuffer(file.slice(0, 4));
});
}

function disablePrinterButton() {
const printerBtn = document.getElementById('printerBtn');
if (printerBtn) {
    printerBtn.classList.add('printer-btn-disabled');
    printerBtn.disabled = true;
    console.log('Printer button disabled');
}
}

// Call it when page loads
window.addEventListener('load', disablePrinterButton);

// Function to disable selection buttons when zoom is active
function disableSelectionButtons() {
const selectionButtons = [
    document.getElementById('squareSelectionBtn'),
    document.getElementById('basquiatSelectionBtn'), 
    document.getElementById('circleSelectionBtn')
];

selectionButtons.forEach(button => {
    if (button) {
        button.classList.add('selection-btn-disabled');
        button.disabled = true;
        button.dataset.disabledByZoom = 'true';
        console.log(`Disabled selection button: ${button.id}`);
    }
});
}

// Function to re-enable selection buttons when zoom is deactivated
function enableSelectionButtons() {
const selectionButtons = [
    document.getElementById('squareSelectionBtn'),
    document.getElementById('basquiatSelectionBtn'),
    document.getElementById('circleSelectionBtn')
];

selectionButtons.forEach(button => {
    if (button && button.dataset.disabledByZoom === 'true') {
        button.classList.remove('selection-btn-disabled');
        button.disabled = false;
        delete button.dataset.disabledByZoom;
        console.log(`Re-enabled selection button: ${button.id}`);
    }
});
}

let customConfirmCallback;
function showCustomConfirm(callback) {
document.getElementById('customConfirm').style.display = 'block';
customConfirmCallback = callback;
}
function customConfirmYes() {
document.getElementById('customConfirm').style.display = 'none';
customConfirmCallback(true);
}
function customConfirmNo() {
document.getElementById('customConfirm').style.display = 'none';
customConfirmCallback(false);
}

window.addEventListener('load', function() {
console.log('Adding drag & drop to all canvases...');

// Get all canvases
const baseCanvas = document.getElementById('baseCanvas');
const paintCanvas = document.getElementById('paintCanvas');
const samplerCanvas = document.getElementById('samplerCanvas');
const canvasContainer = document.getElementById('canvasContainer');

// Add drag & drop to each canvas and container
const allTargets = [baseCanvas, paintCanvas, samplerCanvas, canvasContainer];

allTargets.forEach(function(target) {
    // Make it accept drops
    target.addEventListener('dragover', function(e) {
        e.preventDefault(); // This allows dropping
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
    
    // When files are dropped
    target.addEventListener('drop', function(e) {
        e.preventDefault(); // Stop browser from opening the file
        e.stopPropagation(); // STOP EVENT BUBBLING - this fixes the double loading!
        
        // Remove visual feedback
        if (target !== canvasContainer) {
            target.style.boxShadow = '';
            target.style.filter = '';
        }
        
        // Get the dropped files
        const files = e.dataTransfer.files;
        
        // Check if any files were dropped
        if (files.length === 0) {
            alert('No files dropped!');
            return;
        }
        
        // Get the first file
        const file = files[0];
        
        // Check if it's an image
        if (!file.type.startsWith('image/')) {
            alert('Please drop an image file (PNG, JPG, etc.)');
            return;
        }
        
        // Determine which canvas to load to
        let targetCanvas = 'base'; // default
        if (target.id === 'paintCanvas') {
            targetCanvas = 'paint';
            console.log('Dropped on PAINT CANVAS specifically');
        } else if (target.id === 'samplerCanvas') {
            targetCanvas = 'sampler';
            console.log('Dropped on SAMPLER CANVAS specifically');
        } else if (target.id === 'baseCanvas') {
            targetCanvas = 'base';
            console.log('Dropped on BASE CANVAS specifically');
        } else {
            console.log('Dropped on container - defaulting to BASE CANVAS');
        }
        
        // Load the image to the correct canvas
        loadDroppedImage(file, targetCanvas);
    });
});

console.log('Drag & drop ready! Drop images on any canvas:');
console.log('- Base Canvas (Canvas 1)');
console.log('- Paint Canvas (Collage)'); 
console.log('- Sampler Canvas (Canvas 2)');
});

// Function to load the dropped image to specified canvas
function loadDroppedImage(file, targetCanvas) {
targetCanvas = targetCanvas || 'base'; // default to base canvas

// Create a FileReader to read the file
const reader = new FileReader();

// When the file is loaded
reader.onload = function(e) {
    // Create a new image
    const newImage = new Image();
    
    // When the image loads
    newImage.onload = function() {
        if (targetCanvas === 'base') {
            loadToBaseCanvas(newImage);
        } else if (targetCanvas === 'paint') {
            loadToPaintCanvas(newImage);
        } else if (targetCanvas === 'sampler') {
            loadToSamplerCanvas(newImage);
        }
    };
    
    // Set the image source to the file data
    newImage.src = e.target.result;
};

// Read the file as a data URL
reader.readAsDataURL(file);
}

// Load image to Base Canvas (Canvas 1)
function loadToBaseCanvas(newImage) {
const canvas = document.getElementById('baseCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to match image dimensions
canvas.width = newImage.width;
canvas.height = newImage.height;

// Clear and fill with white background
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#FFFFFF';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Draw the image at actual size
ctx.drawImage(newImage, 0, 0);

// Update global variables if they exist
if (typeof img !== 'undefined') {
    img.src = newImage.src;
}
if (typeof currentImageData !== 'undefined') {
    currentImageData.base = ctx.getImageData(0, 0, canvas.width, canvas.height);
}
if (typeof saveState === 'function') {
    saveState(true);
}

console.log('Image loaded to Base Canvas (Canvas 1)! Dimensions:', newImage.width + 'x' + newImage.height);
}

// Load image to Paint Canvas (Collage)
function loadToPaintCanvas(newImage) {
const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to match image dimensions
canvas.width = newImage.width;
canvas.height = newImage.height;

// Clear the canvas (no white background for paint canvas)
ctx.clearRect(0, 0, canvas.width, canvas.height);

// Draw the image at actual size
ctx.drawImage(newImage, 0, 0);

// Update global variables if they exist
if (typeof currentImageData !== 'undefined') {
    currentImageData.paint = ctx.getImageData(0, 0, canvas.width, canvas.height);
}
if (typeof saveState === 'function') {
    saveState(true);
}

console.log('Image loaded to Paint Canvas (Collage)! Dimensions:', newImage.width + 'x' + newImage.height);
}

// Load image to Sampler Canvas (Canvas 2)
function loadToSamplerCanvas(newImage) {
const canvas = document.getElementById('samplerCanvas');
const ctx = canvas.getContext('2d');

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

// Update global variables if they exist
if (typeof samplerImg !== 'undefined') {
    samplerImg.src = newImage.src;
}
if (typeof currentImageData !== 'undefined') {
    currentImageData.sampler = ctx.getImageData(0, 0, canvas.width, canvas.height);
}
if (typeof saveState === 'function') {
    saveState(true);
}

console.log('Image loaded to Sampler Canvas (Canvas 2)! Dimensions:', newImage.width + 'x' + newImage.height);
}

// DEBUG SYSTEM - Add this right after your variable declarations
let debugLog = [];
let lastCanvasStates = {};



// Function to dump full debug info
function dumpDebugInfo() {
console.log('=== FULL DEBUG DUMP ===');
console.log('Recent 20 actions:', debugLog.slice(-20));
console.log('Current canvas states:', lastCanvasStates);
console.log('Current zoom states:', {
    base: { zoom: canvasStates.base.zoomLevel, pan: [canvasStates.base.panX, canvasStates.base.panY] },
    paint: { zoom: canvasStates.paint.zoomLevel, pan: [canvasStates.paint.panX, canvasStates.paint.panY] },
    sampler: { zoom: canvasStates.sampler.zoomLevel, pan: [canvasStates.sampler.panX, canvasStates.sampler.panY] }
});
console.log('isZooming:', isZooming, 'isDragging:', isDragging);
}

// Add keyboard shortcut to dump debug info
document.addEventListener('keydown', (e) => {
if (e.ctrlKey && e.key === 'd') {
    e.preventDefault();
    dumpDebugInfo();
}
});

// Define toggleEffectHandler globally
function toggleEffectHandler(e, state, key, keyElement) {
const effect = key.effect;
const keyLower = key.key.toLowerCase();
console.log(`EFFECT TRIGGER: ${effect} via ${e.type}, state=${state}, isRecording=${isRecording}, currentMovement=${!!currentMovement}, dragActive=${isDragging}`);

// Update activeEffects set
if (state) {
activeEffects.add(keyLower);
} else {
activeEffects.delete(keyLower);
}

// Call toggleEffect to apply the effect
toggleEffect(effect, state, e.type === 'click' || e.type === 'touchstart' || e.type === 'touchend' ? 'button' : 'qwertyKey');
keyElement.classList.toggle('active', state);
console.log(`Effect ${effect} ${state ? 'started' : 'ended'} via ${e.type}, activeEffects:`, [...activeEffects]);

// Record the effect if recording is active
if (isRecording) {
if (!currentMovement || !currentMovement.events || !currentMovement.smears) {
  console.log('Initializing or recovering currentMovement for effect');
  recordedMovements = recordedMovements || [];
  if (!currentMovement) {
    currentMovement = {
      shape: brushShape || 'box',
      size: brushSize || baseBrushSize || 200,
      rotation: brushRotation || 0,
      cloneSize: cloneBrushSize || brushSize || 200,
      cloneRotation: cloneBrushRotation || 0,
      paintMode: isPaintMode || false,
      paintColor: paintColor || { r: 255, g: 0, b: 0 },
      flipHorizontal: isFlipHorizontalActive || false,
      flipVertical: isFlipVerticalActive || false,
      stickerSlot: brushShape === 'stickerMode' ? stampOrder[0] : null,
      effects: {}, // Initialize effect states
      smears: [],
      events: [],
      activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e),
      targetCanvas: 'base',
      startTime: performance.now(),
      eventCount: 0,
      duration: 0
    };
    recordedMovements.push(currentMovement);
  } else {
    currentMovement.events = currentMovement.events || [];
    currentMovement.smears = currentMovement.smears || [];
    currentMovement.activeEffects = currentMovement.activeEffects || [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e);
  }
}

const timestamp = performance.now() - currentMovement.startTime;
const effectEvent = {
  type: 'effect',
  data: {
    effect: effect,
    state: state,
    timestamp: Number(timestamp.toFixed(2)),
    fingerRole: e.type === 'click' || e.type === 'touchstart' || e.type === 'touchend' ? 'button' : 'qwertyKey',
    phase: effect === 'neon' ? neonPhase :
            effect === 'flickerNegative' ? flickerPhase :
            effect === 'chromaticShift' ? vhsPhase :
            effect === 'emoji' ? emojiPhase : undefined
  },
  sequence: currentMovement.eventCount
};
currentMovement.events.push(effectEvent);
currentMovement.effects[effect] = state;

// Update activeEffects list immediately
if (state) {
  if (!currentMovement.activeEffects.includes(effect)) {
    currentMovement.activeEffects.push(effect);
  }
} else {
  currentMovement.activeEffects = currentMovement.activeEffects.filter(e => e !== effect);
}
currentMovement.eventCount = (currentMovement.eventCount || 0) + 1;
console.log(`EFFECT RECORDED: ${effect}=${state}, timestamp=${timestamp.toFixed(2)}ms, phase=${effectEvent.data.phase || 'N/A'}, activeEffects=${currentMovement.activeEffects}, events=${currentMovement.events.length}, movements=${recordedMovements.length}`);

// Apply effect immediately during drag without smearing
if (isDragging && state && lastX !== undefined && lastY !== undefined) {
  const canvasId = touchPoints[0]?.target === baseCanvas ? 'base' : touchPoints[0]?.target === paintCanvas ? 'paint' : 'sampler';
  smearPixels(lastX, lastY, canvasId); // Apply effect during drag
  console.log(`Effect ${effect} applied during drag on ${canvasId}`);
}
} else {
console.log(`EFFECT NOT RECORDED: isRecording is false`);
}
}

keyLabels.forEach(key => {
const keyElement = document.createElement('div');
keyElement.className = key.class;
keyElement.tabIndex = -1;
keyElement.title = key.tooltip; // MOVED TO PARENT DIV
keyElement.innerHTML = key.png
? `<img src="${key.png}" alt="${key.note} key" style="pointer-events: none;">` // REMOVED title from here
: `<span class="key-label">${key.key}</span>`;
keyElement.dataset.effect = key.effect;
keyElement.dataset.note = key.note;
keyboardContainer.appendChild(keyElement);

if (key.png) {
const img = keyElement.querySelector('img');
img.onload = () => console.log(`Loaded ${key.png} for ${key.effect}`);
img.onerror = () => {
  console.error(`Failed to load ${key.png} for ${key.effect}`);
  keyElement.innerHTML = `<span class="key-label">${key.key}</span>`;
};
}

// Mouse events: Toggle effect on click, persist until next click
keyElement.addEventListener('click', (e) => {
if (e.button === 0) {
  const isActive = activeEffects.has(key.key.toLowerCase());
  toggleEffectHandler(e, !isActive, key, keyElement);
}
});

// Touch events
keyElement.addEventListener('touchstart', (e) => {
e.preventDefault();
const isActive = activeEffects.has(key.key.toLowerCase());
toggleEffectHandler(e, !isActive, key, keyElement); // Toggle based on current state
}, { passive: false });
keyElement.addEventListener('touchend', (e) => {
e.preventDefault();
const isActive = activeEffects.has(key.key.toLowerCase());
toggleEffectHandler(e, !isActive, key, keyElement); // Toggle to deactivate if active
}, { passive: false });
keyElement.addEventListener('touchcancel', (e) => {
e.preventDefault();
const isActive = activeEffects.has(key.key.toLowerCase());
toggleEffectHandler(e, !isActive, key, keyElement); // Toggle to deactivate if active
}, { passive: false });
});

// Network selection and wallet connection
let currentAccount = null;
let currentNetwork = null;

function openNetworkModal() {
document.getElementById('networkModal').style.display = 'block';
}

function closeNetworkModal() {
document.getElementById('networkModal').style.display = 'none';
}

async function connectToEthereum() {
if (typeof window.ethereum !== 'undefined') {
    try {
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        currentAccount = accounts[0];
        currentNetwork = 'ethereum';
        showConnectedState();
        closeNetworkModal();
        
    } catch (error) {
        alert('ETHEREUM CONNECTION FAILED');
    }
} else {
    alert('METAMASK NOT DETECTED!');
}
}

async function connectToTezos() {
console.log('=== BEACON SDK CONNECTION ===');

// Import Beacon SDK if not available
if (typeof beacon === 'undefined') {
    console.log('Loading Beacon SDK...');
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@airgap/beacon-sdk@latest/dist/walletbeacon.min.js';
    document.head.appendChild(script);
    
    await new Promise(resolve => {
        script.onload = resolve;
    });
}

try {
    // CHECK IF CLIENT ALREADY EXISTS - DON'T CREATE DUPLICATE!
    if (!window.beaconClient) {
        console.log('Creating NEW Beacon client...');
        window.beaconClient = new beacon.DAppClient({ 
name: 'AUROMA25',
network: { type: beacon.NetworkType.MAINNET }  // ← MAINNET not GHOSTNET!
});
    } else {
        console.log('Reusing EXISTING Beacon client');
    }
    
    // Check if already connected
    const activeAccount = await window.beaconClient.getActiveAccount();
    
    if (activeAccount) {
        console.log('Already connected:', activeAccount.address);
        currentAccount = activeAccount.address;
        currentNetwork = 'tezos';
        showConnectedState();
        closeNetworkModal();
        return;
    }
    
    // Request permissions only if not connected
    const permissions = await window.beaconClient.requestPermissions();
    
    if (permissions && permissions.address) {
        currentAccount = permissions.address;
        currentNetwork = 'tezos';
        showConnectedState();
        closeNetworkModal();
        console.log('✅ Connected to TEZOS GHOSTNET:', currentAccount);
    }
    
} catch (error) {
    console.error('Beacon connection error:', error);
    alert(`TEZOS CONNECTION FAILED: ${error.message}`);
}
}

async function connectToRonin() {
const hasRoninWallet = window.ronin && window.ronin.provider;
const hasMetaMask = window.ethereum && window.ethereum.isMetaMask;

let provider;

if (hasRoninWallet) {
    console.log('Using Ronin Wallet');
    provider = window.ronin.provider;
} else if (hasMetaMask) {
    console.log('Using MetaMask');
    provider = window.ethereum;
} else {
    alert('No wallet detected! Please install Ronin Wallet or MetaMask');
    return;
}

try {
    // Request accounts first
    const accounts = await provider.request({
        method: 'eth_requestAccounts'
    });
    
    if (!accounts || accounts.length === 0) {
        alert('No accounts found. Please unlock your wallet.');
        return;
    }
    
    // Try to switch to Ronin MAINNET
    try {
        await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x7e4' }]  // ← 2020 = RONIN MAINNET
        });
        console.log('Switched to Ronin Mainnet');
    } catch (switchError) {
        // If network doesn't exist, add it
        if (switchError.code === 4902 || switchError.code === -32603) {
            try {
                await provider.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x7e4',  // ← MAINNET
                        chainName: 'Ronin Mainnet',
                        nativeCurrency: {
                            name: 'RON',
                            symbol: 'RON',
                            decimals: 18
                        },
                        rpcUrls: ['https://api.roninchain.com/rpc'],
                        blockExplorerUrls: ['https://explorer.roninchain.com']
                    }]
                });
                console.log('Added Ronin Mainnet');
            } catch (addError) {
                console.error('Failed to add network:', addError);
            }
        }
    }
    
    window.roninProvider = provider;
    currentAccount = accounts[0];
    currentNetwork = 'ronin';
    showConnectedState();
    closeNetworkModal();
    
    const walletType = hasRoninWallet ? 'Ronin Wallet' : 'MetaMask';
    console.log(`✅ Connected to RONIN MAINNET via ${walletType}: ${currentAccount}`);
    
} catch (error) {
    console.error('Connection error:', error);
    alert(`Connection failed: ${error.message || 'Unknown error'}`);
}
}



function showConnectedState() {
const walletBtn = document.getElementById('walletConnectBtn');
walletBtn.style.display = 'none';

let addressDisplay = document.getElementById('walletAddressDisplay');
if (!addressDisplay) {
    addressDisplay = document.createElement('div');
    addressDisplay.id = 'walletAddressDisplay';
    addressDisplay.style.cssText = `
        color: #ff179b;
filter: hue-rotate(var(--hue-group1)) brightness(1.2) saturate(1.5);
        font-family: 'VCR OSD Mono', monospace;
        font-size: 20px;
        background: rgba(255, 23, 157, 0.1);
        border: 1px solid #ff179b;
        border-radius: 4px;
        padding: 6px 10px;
        cursor: pointer;
        text-shadow: 0 0 8px #ff179d;
        position: absolute;
        right: 10px;
        top: 5px;
        height: 28px;
        display: flex;
        align-items: center;
        box-shadow: 0 0 10px rgba(255, 23, 155, 0.3);
    `;
    document.getElementById('header').appendChild(addressDisplay);
}

let networkIcon = '◈'; // Default Tezos
if (currentNetwork === 'ethereum') networkIcon = '⟠';
if (currentNetwork === 'ronin') networkIcon = '\u2694';
addressDisplay.textContent = `${networkIcon} ${currentAccount.slice(0,6)}...${currentAccount.slice(-4)}`;
addressDisplay.title = `${currentNetwork.toUpperCase()} - CLICK TO DISCONNECT`;
addressDisplay.onclick = disconnectWallet;

addressDisplay.onmouseenter = () => {
    addressDisplay.textContent = 'DISCONNECT';
    addressDisplay.style.background = 'rgba(255, 23, 157, 0.3)';
};
addressDisplay.onmouseleave = () => {
    addressDisplay.textContent = `${networkIcon} ${currentAccount.slice(0,6)}...${currentAccount.slice(-4)}`;
    addressDisplay.style.background = 'rgba(255, 23, 157, 0.1)';
};
}

function disconnectWallet() {
currentAccount = null;
currentNetwork = null;
window.roninProvider = null; // Add this line
const walletBtn = document.getElementById('walletConnectBtn');
walletBtn.src = '/images/WALLETCONNECT.png';
walletBtn.title = 'CONNECT WALLET';
walletBtn.style.display = 'block';
walletBtn.style.filter = 'hue-rotate(var(--hue-group1)) brightness(1.2) saturate(1.5)';

const addressDisplay = document.getElementById('walletAddressDisplay');
if (addressDisplay) addressDisplay.remove();
}

// Update wallet connect button to open network modal
document.getElementById('walletConnectBtn').addEventListener('click', openNetworkModal);

// Add network modal event listeners
document.getElementById('closeNetworkBtn').addEventListener('click', closeNetworkModal);
document.getElementById('cancelNetworkBtn').addEventListener('click', closeNetworkModal);

// Add network selection listeners
document.querySelectorAll('.network-option').forEach(option => {
option.addEventListener('click', () => {
    const network = option.dataset.network;
    if (network === 'ethereum') {
        connectToEthereum();
    } else if (network === 'tezos') {
        connectToTezos();
    } else if (network === 'ronin') {
        connectToRonin();
    }
});
});

// NFT Modal functionality
let selectedCanvas = null;

function openNftModal() {
document.getElementById('nftModal').style.display = 'block';
selectedCanvas = null;
document.getElementById('confirmMintBtn').disabled = true;
document.getElementById('confirmMintBtn').textContent = 'SELECT CANVAS FIRST';

// Remove any previous selections
document.querySelectorAll('.canvas-option').forEach(option => {
    option.classList.remove('selected');
});
}

function closeNftModal() {
document.getElementById('nftModal').style.display = 'none';
selectedCanvas = null;
}

// NFT Canvas Preview System
let selectedCanvasForMinting = null;

function updateAllNFTCanvasPreviews() {
if (!selectedCanvasForMinting) return;

const canvas = selectedCanvasForMinting === 'base' ? baseCanvas : 
               selectedCanvasForMinting === 'paint' ? paintCanvas : 
               samplerCanvas;

const dataURL = canvas.toDataURL('image/png', 0.8);

// Calculate aspect ratio
const aspectRatio = canvas.width / canvas.height;
const maxWidth = 300;
const maxHeight = 300;

let previewWidth, previewHeight;
if (aspectRatio > 1) {
    // Landscape
    previewWidth = Math.min(maxWidth, canvas.width * 0.3);
    previewHeight = previewWidth / aspectRatio;
} else {
    // Portrait or square
    previewHeight = Math.min(maxHeight, canvas.height * 0.3);
    previewWidth = previewHeight * aspectRatio;
}

const previewIds = ['erc721CanvasPreview', 'erc1155CanvasPreview', 'tezosCanvasPreview', 'roninCanvasPreview'];

previewIds.forEach(function(id) {
    const preview = document.getElementById(id);
    if (preview) {
        preview.style.width = previewWidth + 'px';
        preview.style.height = previewHeight + 'px';
        preview.style.border = '2px solid #ccc';
        preview.style.margin = '10px auto';
        preview.style.display = 'block';
        preview.innerHTML = '<img src="' + dataURL + '" style="width:100%;height:100%;object-fit:contain;">';
        console.log('Preview updated: ' + previewWidth + 'x' + previewHeight + ' (aspect: ' + aspectRatio.toFixed(2) + ')');
    }
});
}
document.addEventListener('DOMContentLoaded', function() {
document.querySelectorAll('.canvas-option').forEach(function(option) {
    option.addEventListener('click', function() {
        const canvasId = this.dataset.canvas;
        selectCanvas(canvasId);
    });
});
});

function selectCanvas(canvasId) {
selectedCanvas = canvasId;
selectedCanvasForMinting = canvasId;

document.querySelectorAll('.canvas-option').forEach(option => {
    option.classList.remove('selected');
});

document.querySelector(`[data-canvas="${canvasId}"]`).classList.add('selected');

document.getElementById('confirmMintBtn').disabled = false;
document.getElementById('confirmMintBtn').textContent = 'MINT';

updateAllNFTCanvasPreviews();
console.log('Canvas selected for minting:', canvasId);
}

function startMinting() {
forceCanvasSelection(); // Add this line

if (!selectedCanvas) return;

closeNftModal();

// Route to appropriate modal based on connected network
if (currentNetwork === 'ethereum') {
    document.getElementById('ethereumContractModal').style.display = 'block';
} else if (currentNetwork === 'tezos') {
openTezosModal();
} else if (currentNetwork === 'ronin') {
openRoninModal();
}
}

// Add NFT button listener
// Add NFT button listener
document.getElementById('nftBtn').addEventListener('click', function() {
// Check if wallet is connected
if (!currentAccount || !currentNetwork) {
    showWalletConnectionRequired();
    return;
}

openNftModal();
});

function showWalletConnectionRequired() {
const message = document.createElement('div');
message.id = 'walletRequiredMessage';
message.innerHTML = `
    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                background: var(--hue-group3); border: 3px solid hsl(var(--hue-group4), 75%, 50%); 
                border-radius: 12px; padding: 30px; z-index: 7000; text-align: center;
                box-shadow: 0 0 20px #9400D3; font-family: 'VCR OSD Mono', monospace;">
        <h3 style="color: #ff179d; margin: 0 0 15px 0;">CONNECT WALLET FIRST</h3>
        <p style="color: #ff179d; margin: 0 0 20px 0;">YOU NEED TO CONNECT TO A BLOCKCHAIN BEFORE MINTING</p>
        <button onclick="document.getElementById('walletRequiredMessage').remove(); document.getElementById('walletConnectBtn').click();" 
                style="padding: 10px 20px; background: linear-gradient(45deg, #ff179d, #9400D3); 
                       border: none; color: #FBB917; border-radius: 8px; cursor: pointer; 
                       font-family: 'VCR OSD Mono', monospace; margin-right: 10px;">
            CONNECT WALLET
        </button>
        <button onclick="document.getElementById('walletRequiredMessage').remove();" 
                style="padding: 10px 20px; background: transparent; border: 2px solid #ff179d; 
                       color: #ff179d; border-radius: 8px; cursor: pointer; 
                       font-family: 'VCR OSD Mono', monospace;">
            CANCEL
        </button>
    </div>
`;
document.body.appendChild(message);
}

// Add modal event listeners
document.getElementById('closeNftBtn').addEventListener('click', closeNftModal);
document.getElementById('cancelMintBtn').addEventListener('click', closeNftModal);
document.getElementById('confirmMintBtn').addEventListener('click', startMinting);

// Add canvas selection listeners
document.querySelectorAll('.canvas-option').forEach(option => {
option.addEventListener('click', () => {
    selectCanvas(option.dataset.canvas);
});
});

// Ethereum Contract Modal functionality
let selectedContract = null;

function openEthereumContractModal() {
document.getElementById('ethereumContractModal').style.display = 'block';
selectedContract = null;

// Remove any previous selections
document.querySelectorAll('.contract-option').forEach(option => {
    option.classList.remove('selected');
});
}

function closeEthereumContractModal() {
document.getElementById('ethereumContractModal').style.display = 'none';
selectedContract = null;
}

function selectContract(contractType) {
selectedContract = contractType;

// Remove previous selections
document.querySelectorAll('.contract-option').forEach(option => {
    option.classList.remove('selected');
});

// Select the clicked contract
document.querySelector(`[data-contract="${contractType}"]`).classList.add('selected');

console.log(`Selected contract: ${contractType}`);

// Auto-proceed to metadata modal after selection
setTimeout(() => {
    closeEthereumContractModal();
    if (contractType === 'erc721') {
openErc721Modal();
} else if (contractType === 'erc1155') {
openErc1155Modal();
}
}, 500); // Small delay to show selection
}

// Add Ethereum contract modal event listeners
document.getElementById('closeEthContractBtn').addEventListener('click', closeEthereumContractModal);
document.getElementById('cancelEthContractBtn').addEventListener('click', closeEthereumContractModal);

// Add contract selection listeners
document.querySelectorAll('.contract-option').forEach(option => {
option.addEventListener('click', () => {
    selectContract(option.dataset.contract);
});
});

// Add touch support for contract options
document.querySelectorAll('.contract-option').forEach(option => {
option.addEventListener('touchend', (e) => {
    e.preventDefault();
    selectContract(option.dataset.contract);
});
});

// ERC-721 Metadata Modal functionality
function openErc721Modal() {
document.getElementById('erc721MetadataModal').style.display = 'block';
updateErc721CanvasPreview();
validateErc721Form();
}

function closeErc721Modal() {
document.getElementById('erc721MetadataModal').style.display = 'none';
// Clear form
document.getElementById('erc721Title').value = '';
document.getElementById('erc721Description').value = '';
// Hide progress
document.getElementById('erc721Progress').style.display = 'none';
}

function updateErc721CanvasPreview() {
if (!selectedCanvas) return;

const preview = document.getElementById('erc721CanvasPreview');
const canvas = selectedCanvas === 'base' ? baseCanvas :
               selectedCanvas === 'paint' ? paintCanvas : samplerCanvas;

// Convert canvas to data URL and set as background
const dataURL = canvas.toDataURL('image/png');
preview.style.backgroundImage = `url(${dataURL})`;
}

function validateErc721Form() {
const title = document.getElementById('erc721Title').value.trim();
const mintBtn = document.getElementById('mintErc721Btn');

if (title.length > 0) {
    mintBtn.disabled = false;
    mintBtn.textContent = 'MINT NFT';
} else {
    mintBtn.disabled = true;
    mintBtn.textContent = 'ENTER TITLE FIRST';
}
}

async function startErc721Minting() {
const title = document.getElementById('erc721Title').value.trim();
const description = document.getElementById('erc721Description').value.trim();

if (!selectedCanvas && selectedCanvasForMinting) {
    selectedCanvas = selectedCanvasForMinting;
}

if (!title) {
    alert('TITLE IS REQUIRED!');
    return;
}

try {
    // Show progress
    document.getElementById('erc721Progress').style.display = 'block';
    document.getElementById('erc721Status').textContent = '🔗 Connecting to Ethereum Mainnet...';
    document.getElementById('erc721ProgressFill').style.width = '10%';
    
    // Switch to MAINNET
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x1' }]  // MAINNET
        });
    } catch (switchError) {
        console.error('Network switch error:', switchError);
    }
    
    // Get canvas data
    const canvas = selectedCanvas === 'base' ? baseCanvas :
                  selectedCanvas === 'paint' ? paintCanvas : samplerCanvas;
    const imageData = canvas.toDataURL('image/png', 0.8);
    
    // Create placeholder URI
    const timestamp = Date.now();
    const placeholderUri = 'ipfs://placeholder_' + timestamp;
    
    document.getElementById('erc721Status').textContent = '💳 Please confirm minting transaction...';
    document.getElementById('erc721ProgressFill').style.width = '25%';
    
    const provider = new window.ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    // ERC-721 ABI with updateTokenURI
    const COMPLETE_ERC721_ABI = [
        {
            "inputs": [{"internalType": "string", "name": "uri", "type": "string"}],
            "name": "mint",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [
                {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
                {"internalType": "string", "name": "newURI", "type": "string"}
            ],
            "name": "updateTokenURI",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "totalSupply",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
        }
    ];
    
    const response = await fetch('/api/get-contract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ network: 'ethereum', type: 'erc721' })
});
const { address } = await response.json();

const contract = new ethers.Contract(
    address,  
    COMPLETE_ERC721_ABI,
    signer
);
    
    // Get current token ID
    let tokenId;
    try {
        const currentSupply = await contract.totalSupply();
        tokenId = currentSupply.toNumber();
        console.log('Next token ID will be:', tokenId);
    } catch (e) {
        console.log('Cannot predict token ID');
    }
    
    // Step 1: Mint with placeholder
    let tx;
    try {
        tx = await contract.mint(placeholderUri, {
value: ethers.utils.parseEther("0.0005")  
});
        console.log('Transaction sent:', tx.hash);
    } catch (userReject) {
        console.log('User cancelled - no IPFS upload');
        document.getElementById('erc721Status').textContent = '❌ Transaction cancelled';
        setTimeout(() => {
            document.getElementById('erc721Progress').style.display = 'none';
        }, 2000);
        return;
    }
    
    // Step 2: Wait for confirmation
    document.getElementById('erc721Status').textContent = '⏳ Waiting for blockchain confirmation...';
    document.getElementById('erc721ProgressFill').style.width = '40%';
    
    await tx.wait();
    console.log('Mint confirmed! Token ID:', tokenId);
    
    // Step 3: Upload to IPFS
    document.getElementById('erc721Status').textContent = '📁 Uploading artwork to IPFS...';
    document.getElementById('erc721ProgressFill').style.width = '60%';
    
    const metadataUri = await uploadToArweave(imageData, title, description);
    console.log('IPFS upload complete:', metadataUri);
    
    // Step 4: Update token URI
    document.getElementById('erc721Status').textContent = '🔄 Updating NFT metadata...';
    document.getElementById('erc721ProgressFill').style.width = '80%';
    
    try {
        const updateTx = await contract.updateTokenURI(tokenId, metadataUri);
        console.log('Update transaction sent:', updateTx.hash);
        await updateTx.wait();
        console.log('Token URI updated successfully!');
    } catch (updateError) {
        console.error('Failed to update URI:', updateError);
        alert('NFT minted but metadata update failed. Token ID: ' + tokenId);
    }
    
    document.getElementById('erc721ProgressFill').style.width = '100%';
    document.getElementById('erc721Status').textContent = '✅ NFT MINTED SUCCESSFULLY!';
    
    setTimeout(() => {
        closeErc721Modal();
        alert('🎉 NFT MINTED!\n\nTitle: ' + title + '\nToken ID: ' + tokenId + 
              '\nTx: ' + tx.hash + '\nIPFS: ' + metadataUri + 
              '\n\nView on Etherscan:\nhttps://etherscan.io/tx/' + tx.hash);
    }, 2000);
    
} catch (error) {
    console.error('Minting error:', error);
    document.getElementById('erc721Status').textContent = '❌ Error: ' + error.message;
    setTimeout(() => {
        alert('Minting failed: ' + error.message);
        document.getElementById('erc721Progress').style.display = 'none';
    }, 2000);
}
}




// Add ERC-721 modal event listeners
document.getElementById('closeErc721Btn').addEventListener('click', closeErc721Modal);
document.getElementById('cancelErc721Btn').addEventListener('click', closeErc721Modal);
document.getElementById('mintErc721Btn').addEventListener('click', startErc721Minting);

// Add form validation listeners
document.getElementById('erc721Title').addEventListener('input', validateErc721Form);
document.getElementById('erc721Title').addEventListener('keyup', validateErc721Form);

// ERC-1155 Modal functionality
function openErc1155Modal() {
document.getElementById('erc1155MetadataModal').style.display = 'block';
updateErc1155CanvasPreview();
validateErc1155Form();
updateEditionDisplay();
}

function closeErc1155Modal() {
document.getElementById('erc1155MetadataModal').style.display = 'none';
}

function updateErc1155CanvasPreview() {
if (!selectedCanvas) return;

const preview = document.getElementById('erc1155CanvasPreview');
const canvas = selectedCanvas === 'base' ? baseCanvas :
               selectedCanvas === 'paint' ? paintCanvas : samplerCanvas;

const dataURL = canvas.toDataURL('image/png');
preview.style.backgroundImage = `url(${dataURL})`;
}

function validateErc1155Form() {
const title = document.getElementById('erc1155Title').value.trim();
const mintBtn = document.getElementById('mintErc1155Btn');

if (title.length > 0) {
    mintBtn.disabled = false;
    mintBtn.textContent = 'MINT EDITIONS';
} else {
    mintBtn.disabled = true;
    mintBtn.textContent = 'ENTER TITLE FIRST';
}
}

function updateEditionDisplay() {
const editions = document.getElementById('erc1155Editions').value || 1;
document.getElementById('editionDisplay').textContent = editions;
}

// Add ERC-1155 modal event listeners
document.getElementById('closeErc1155Btn').addEventListener('click', closeErc1155Modal);
document.getElementById('cancelErc1155Btn').addEventListener('click', closeErc1155Modal);

// Add form validation listeners - these make the button work!
document.getElementById('erc1155Title').addEventListener('input', validateErc1155Form);
document.getElementById('erc1155Title').addEventListener('keyup', validateErc1155Form);
document.getElementById('erc1155Editions').addEventListener('input', function() {
validateErc1155Form();
updateEditionDisplay();
});

// Add mint button click handler
document.getElementById('mintErc1155Btn').addEventListener('click', startErc1155Minting);

async function startErc1155Minting() {
const title = document.getElementById('erc1155Title').value.trim();
const description = document.getElementById('erc1155Description').value.trim();
const editions = parseInt(document.getElementById('erc1155Editions').value) || 1;

if (!selectedCanvas && selectedCanvasForMinting) {
    selectedCanvas = selectedCanvasForMinting;
}

if (!title) {
    alert('TITLE IS REQUIRED!');
    return;
}

try {
    // Show progress
    document.getElementById('erc1155Progress').style.display = 'block';
    document.getElementById('erc1155Status').textContent = '🔗 Connecting to Ethereum Mainnet...';
    document.getElementById('erc1155ProgressFill').style.width = '10%';
    
    // Switch to MAINNET
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x1' }]  // MAINNET
        });
    } catch (switchError) {
        console.error('Network switch error:', switchError);
    }
    
    // Get canvas data
    const canvas = selectedCanvas === 'base' ? baseCanvas :
                  selectedCanvas === 'paint' ? paintCanvas : samplerCanvas;
    const imageData = canvas.toDataURL('image/png', 0.8);
    
    // Create placeholder URI
    const timestamp = Date.now();
    const placeholderUri = 'ipfs://placeholder_' + timestamp;
    
    document.getElementById('erc1155Status').textContent = '💳 Please confirm minting transaction...';
    document.getElementById('erc1155ProgressFill').style.width = '25%';
    
    const provider = new window.ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    // ERC-1155 ABI with updateTokenURI
    const COMPLETE_ERC1155_ABI = [
        {
            "inputs": [
                {"internalType": "uint256", "name": "editions", "type": "uint256"},
                {"internalType": "string", "name": "uri", "type": "string"}
            ],
            "name": "createAndMintArtwork",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [
                {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
                {"internalType": "string", "name": "newURI", "type": "string"}
            ],
            "name": "updateTokenURI",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "totalArtworks",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
        }
    ];
    
const response = await fetch('/api/get-contract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ network: 'ethereum', type: 'erc1155' })
});
const { address } = await response.json();

const contract = new ethers.Contract(
    address,  
    COMPLETE_ERC1155_ABI,
    signer
);
    
    // Get current token ID
    let tokenId;
    try {
        const totalArtworks = await contract.totalArtworks();
        tokenId = totalArtworks.toNumber();
        console.log('Next token ID will be:', tokenId);
    } catch (e) {
        console.log('Cannot predict token ID');
    }
    
    // Step 1: Mint with placeholder
    let tx;
    try {
        tx = await contract.createAndMintArtwork(
editions,
placeholderUri,
{ value: ethers.utils.parseEther("0.0005") }  
);
        console.log('Transaction sent:', tx.hash);
    } catch (userReject) {
        console.log('User cancelled - no IPFS upload');
        document.getElementById('erc1155Status').textContent = '❌ Transaction cancelled';
        setTimeout(() => {
            document.getElementById('erc1155Progress').style.display = 'none';
        }, 2000);
        return;
    }
    
    // Step 2: Wait for confirmation
    document.getElementById('erc1155Status').textContent = '⏳ Waiting for blockchain confirmation...';
    document.getElementById('erc1155ProgressFill').style.width = '40%';
    
    await tx.wait();
    console.log('Mint confirmed! Token ID:', tokenId);
    
    // Step 3: Upload to IPFS
    document.getElementById('erc1155Status').textContent = '📁 Uploading artwork to IPFS...';
    document.getElementById('erc1155ProgressFill').style.width = '60%';
    
    const metadataUri = await uploadToArweave(imageData, title, description);
    console.log('IPFS upload complete:', metadataUri);
    
    // Step 4: Update token URI
    document.getElementById('erc1155Status').textContent = '🔄 Updating NFT metadata...';
    document.getElementById('erc1155ProgressFill').style.width = '80%';
    
    try {
        const updateTx = await contract.updateTokenURI(tokenId, metadataUri);
        console.log('Update transaction sent:', updateTx.hash);
        await updateTx.wait();
        console.log('Token URI updated successfully!');
    } catch (updateError) {
        console.error('Failed to update URI:', updateError);
        alert('NFT minted but metadata update failed. Token ID: ' + tokenId);
    }
    
    document.getElementById('erc1155ProgressFill').style.width = '100%';
    document.getElementById('erc1155Status').textContent = '✅ EDITIONS MINTED!';
    
    setTimeout(() => {
        closeErc1155Modal();
        alert('🎉 ' + editions + ' EDITIONS MINTED!\n\nTitle: ' + title + 
              '\nToken ID: ' + tokenId + '\nTx: ' + tx.hash + 
              '\nIPFS: ' + metadataUri + 
              '\n\nView on Etherscan:\nhttps://etherscan.io/tx/' + tx.hash);
    }, 2000);
    
} catch (error) {
    console.error('Minting error:', error);
    document.getElementById('erc1155Status').textContent = '❌ Error: ' + error.message;
    setTimeout(() => {
        alert('Minting failed: ' + error.message);
        document.getElementById('erc1155Progress').style.display = 'none';
    }, 2000);
}
}


// Tezos Modal functionality
function openTezosModal() {
document.getElementById('tezosMetadataModal').style.display = 'block';
updateTezosCanvasPreview();
validateTezosForm();
updateTezosEditionDisplay();
}

function closeTezosModal() {
document.getElementById('tezosMetadataModal').style.display = 'none';
// Clear form
document.getElementById('tezosTitle').value = '';
document.getElementById('tezosDescription').value = '';
document.getElementById('tezosEditions').value = '1';
updateTezosEditionDisplay();
// Hide progress
document.getElementById('tezosProgress').style.display = 'none';
}

function updateTezosCanvasPreview() {
if (!selectedCanvas) return;

const preview = document.getElementById('tezosCanvasPreview');
const canvas = selectedCanvas === 'base' ? baseCanvas :
               selectedCanvas === 'paint' ? paintCanvas : samplerCanvas;

const dataURL = canvas.toDataURL('image/png');
preview.style.backgroundImage = `url(${dataURL})`;
}

function validateTezosForm() {
const title = document.getElementById('tezosTitle').value.trim();
const editions = parseInt(document.getElementById('tezosEditions').value) || 1;
const mintBtn = document.getElementById('mintTezosBtn');

// Clamp edition count
if (editions < 1) {
    document.getElementById('tezosEditions').value = 1;
} else if (editions > 10000) {
    document.getElementById('tezosEditions').value = 10000;
}

if (title.length > 0) {
    mintBtn.disabled = false;
    mintBtn.textContent = 'MINT ON TEZOS';
} else {
    mintBtn.disabled = true;
    mintBtn.textContent = 'ENTER TITLE FIRST';
}

updateTezosEditionDisplay();
}

function updateTezosEditionDisplay() {
const editions = document.getElementById('tezosEditions').value || 1;
document.getElementById('tezosEditionDisplay').textContent = editions;
}

async function startTezosMinting() {
const title = document.getElementById('tezosTitle').value.trim();
const description = document.getElementById('tezosDescription').value.trim();

if (!title) {
    alert('TITLE IS REQUIRED!');
    return;
}

if (!selectedCanvas && selectedCanvasForMinting) {
    selectedCanvas = selectedCanvasForMinting;
}

if (!selectedCanvas) {
    console.error('No canvas selected!');
    alert('Please select a canvas first!');
    return;
}

const canvas = selectedCanvas === 'base' ? baseCanvas :
               selectedCanvas === 'paint' ? paintCanvas : 
               samplerCanvas;

console.log('Capturing canvas data from:', selectedCanvas);
const imageDataUrl = canvas.toDataURL('image/png', 0.8);

if (!imageDataUrl || imageDataUrl === 'data:,' || imageDataUrl.length < 100) {
    console.error('Canvas appears to be empty!');
    alert('Canvas is empty! Please create some artwork first.');
    return;
}

const imageBlob = await new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/png', 0.8);
});

console.log('Image data captured and stored, length:', imageDataUrl.length);

const storedMetadata = {
    title: title,
    description: description,
    imageDataUrl: imageDataUrl,
    imageBlob: imageBlob,
    canvas: selectedCanvas,
    timestamp: Date.now()
};

try {
    document.getElementById('tezosProgress').style.display = 'block';
    document.getElementById('tezosStatus').textContent = 'Connecting to Tezos Mainnet...';
    document.getElementById('tezosProgressFill').style.width = '10%';
    
    if (!window.beaconClient) {
        window.beaconClient = new beacon.DAppClient({
            name: 'AUROMA25',
            network: { 
                type: beacon.NetworkType.MAINNET,  // MAINNET!
                rpcUrl: 'https://mainnet.smartpy.io'
            }
        });
    }
    const client = window.beaconClient;
    
    await client.clearActiveAccount();
    await client.requestPermissions();  // No parameters!
    
    // YOUR MAINNET CONTRACT! 🎉
    const response = await fetch('/api/get-contract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ network: 'tezos' })
});
const { address } = await response.json();
const CONTRACT_ADDRESS = address;
    
    console.log('Getting next token ID...');
    const storageResponse = await fetch(`https://api.tzkt.io/v1/contracts/${CONTRACT_ADDRESS}/storage`);  // MAINNET API
    const storage = await storageResponse.json();
    const tokenId = storage.next_id;
    console.log('Next token ID:', tokenId);
    
    document.getElementById('tezosStatus').textContent = 'Please confirm in wallet...';
    document.getElementById('tezosProgressFill').style.width = '25%';
    
    const placeholderUri = 'ipfs://placeholder_' + Date.now();
    
    console.log('Sending mint operation...');
    let mintOp;
    
    try {
        mintOp = await client.requestOperation({
            operationDetails: [{
                kind: 'transaction',
                destination: CONTRACT_ADDRESS,
                amount: '500000',  // 0.5 tez
                parameters: {
                    entrypoint: 'mint',
                    value: {
                        string: placeholderUri
                    }
                }
            }]
        });
        
        console.log('Transaction sent:', mintOp.transactionHash);
    } catch (err) {
        console.error('Transaction cancelled by user');
        document.getElementById('tezosStatus').textContent = '❌ Transaction cancelled';
        setTimeout(() => {
            document.getElementById('tezosProgress').style.display = 'none';
        }, 2000);
        return;
    }
    
    document.getElementById('tezosStatus').textContent = 'Waiting for confirmation...';
    document.getElementById('tezosProgressFill').style.width = '40%';
    
    await new Promise(resolve => setTimeout(resolve, 20000));
    console.log('Mint confirmed!');
    
    document.getElementById('tezosStatus').textContent = 'Uploading to IPFS...';
    document.getElementById('tezosProgressFill').style.width = '60%';
    
    const metadataUri = await uploadPreservedToIPFS(
        storedMetadata.imageDataUrl,
        storedMetadata.title,
        storedMetadata.description
    );
    
    console.log('IPFS URI:', metadataUri);
    
    document.getElementById('tezosStatus').textContent = 'Updating metadata...';
    document.getElementById('tezosProgressFill').style.width = '80%';
    
    const updateOp = await client.requestOperation({
        operationDetails: [{
            kind: 'transaction',
            destination: CONTRACT_ADDRESS,
            amount: '0',
            parameters: {
                entrypoint: 'update_uri',
                value: {
                    prim: 'Pair',
                    args: [
                        { string: metadataUri },
                        { int: String(tokenId) }
                    ]
                }
            }
        }]
    });
    
    console.log('Update sent:', updateOp.transactionHash);
    
    document.getElementById('tezosProgressFill').style.width = '100%';
    document.getElementById('tezosStatus').textContent = '✅ NFT MINTED ON MAINNET!';
    
    setTimeout(() => {
        closeTezosModal();
        alert(`🎉 TEZOS MAINNET SUCCESS!\n\nToken ID: ${tokenId}\nTransaction: ${mintOp.transactionHash}\nIPFS: ${metadataUri}\n\nView on TzKT:\nhttps://tzkt.io/${mintOp.transactionHash}`);
    }, 2000);
    
} catch (error) {
    console.error('Error:', error);
    document.getElementById('tezosStatus').textContent = 'Failed: ' + error.message;
    setTimeout(() => {
        document.getElementById('tezosProgress').style.display = 'none';
    }, 2000);
}
}

async function uploadPreservedToIPFS(preservedImageData, title, description) {
return await uploadToArweave(preservedImageData, title, description);
}

// Add Tezos modal event listeners
document.getElementById('closeTezosBtn').addEventListener('click', closeTezosModal);
document.getElementById('cancelTezosBtn').addEventListener('click', closeTezosModal);
document.getElementById('mintTezosBtn').addEventListener('click', startTezosMinting);

// Add form validation listeners
document.getElementById('tezosTitle').addEventListener('input', validateTezosForm);
document.getElementById('tezosTitle').addEventListener('keyup', validateTezosForm);
document.getElementById('tezosEditions').addEventListener('input', validateTezosForm);
document.getElementById('tezosEditions').addEventListener('change', validateTezosForm);

// Ronin Modal functionality
function openRoninModal() {
document.getElementById('roninMetadataModal').style.display = 'block';
updateRoninCanvasPreview();
validateRoninForm();
updateRoninEditionDisplay();
}

function closeRoninModal() {
document.getElementById('roninMetadataModal').style.display = 'none';
// Clear form
document.getElementById('roninTitle').value = '';
document.getElementById('roninDescription').value = '';
document.getElementById('roninEditions').value = '1';
updateRoninEditionDisplay();
// Hide progress
document.getElementById('roninProgress').style.display = 'none';
}

function updateRoninCanvasPreview() {
if (!selectedCanvas) return;

const preview = document.getElementById('roninCanvasPreview');
const canvas = selectedCanvas === 'base' ? baseCanvas :
               selectedCanvas === 'paint' ? paintCanvas : samplerCanvas;

const dataURL = canvas.toDataURL('image/png');
preview.style.backgroundImage = `url(${dataURL})`;
}

function validateRoninForm() {
const title = document.getElementById('roninTitle').value.trim();
const editions = parseInt(document.getElementById('roninEditions').value) || 1;
const mintBtn = document.getElementById('mintRoninBtn');

// Clamp edition count
if (editions < 1) {
    document.getElementById('roninEditions').value = 1;
} else if (editions > 100000) {
    document.getElementById('roninEditions').value = 100000;
}

if (title.length > 0) {
    mintBtn.disabled = false;
    mintBtn.textContent = 'MINT ON RONIN';
} else {
    mintBtn.disabled = true;
    mintBtn.textContent = 'ENTER TITLE FIRST';
}

updateRoninEditionDisplay();
}

function updateRoninEditionDisplay() {
const editions = document.getElementById('roninEditions').value || 1;
document.getElementById('roninEditionDisplay').textContent = editions;
}

async function startRoninMinting() {
const title = document.getElementById('roninTitle').value.trim();
const description = document.getElementById('roninDescription').value.trim();
const editions = parseInt(document.getElementById('roninEditions').value) || 1;

if (!selectedCanvas && selectedCanvasForMinting) {
    selectedCanvas = selectedCanvasForMinting;
}

if (!title) {
    alert('TITLE IS REQUIRED!');
    return;
}

try {
    // Show progress
    document.getElementById('roninProgress').style.display = 'block';
    document.getElementById('roninStatus').textContent = '🔗 Connecting to Ronin Saigon...';
    document.getElementById('roninProgressFill').style.width = '10%';
    
    // Switch to Saigon
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x7e5' }]  // Saigon
        });
    } catch (switchError) {
        console.error('Network switch error:', switchError);
    }
    
    // Get canvas data
    const canvas = selectedCanvas === 'base' ? baseCanvas :
                  selectedCanvas === 'paint' ? paintCanvas : samplerCanvas;
    const imageData = canvas.toDataURL('image/png', 0.8);
    
    // Create placeholder URI
    const timestamp = Date.now();
    const placeholderUri = 'ipfs://placeholder_' + timestamp;
    
    document.getElementById('roninStatus').textContent = '💳 Please confirm minting transaction...';
    document.getElementById('roninProgressFill').style.width = '25%';
    
    const providerToUse = window.roninProvider || window.ronin?.provider || window.ethereum;
const provider = new window.ethers.providers.Web3Provider(providerToUse);
    const signer = provider.getSigner();
    
    // Ronin ERC-1155 ABI
    const RONIN_ABI = [
        {
            "inputs": [
                {"internalType": "uint256", "name": "editions", "type": "uint256"},
                {"internalType": "string", "name": "uri", "type": "string"}
            ],
            "name": "createAndMintArtwork",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [
                {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
                {"internalType": "string", "name": "newURI", "type": "string"}
            ],
            "name": "updateTokenURI",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "totalArtworks",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
        }
    ];
    
    const response = await fetch('/api/get-contract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ network: 'ronin' })
});
const { address } = await response.json();

const contract = new ethers.Contract(
    address,  
    RONIN_ABI,
    signer
);
    
    // Get predicted token ID
    let tokenId;
    try {
        const totalArtworks = await contract.totalArtworks();
        tokenId = totalArtworks.toNumber();
        console.log('Next token ID will be:', tokenId);
    } catch (e) {
        console.log('Cannot predict token ID');
    }
    
    // Step 1: Mint with placeholder
    let tx;
    try {
        tx = await contract.createAndMintArtwork(
            editions,
            placeholderUri,
            { value: ethers.utils.parseEther("0.001") }  // 0.001 RON
        );
        console.log('Transaction sent:', tx.hash);
    } catch (userReject) {
        console.log('User cancelled - no IPFS upload');
        document.getElementById('roninStatus').textContent = '❌ Transaction cancelled';
        setTimeout(() => {
            document.getElementById('roninProgress').style.display = 'none';
        }, 2000);
        return;
    }
    
    // Step 2: Wait for confirmation
    document.getElementById('roninStatus').textContent = '⏳ Waiting for blockchain confirmation...';
    document.getElementById('roninProgressFill').style.width = '40%';
    
    await tx.wait();
    console.log('Mint confirmed! Token ID:', tokenId);
    
    // Step 3: Upload to IPFS
    document.getElementById('roninStatus').textContent = '📁 Uploading artwork to IPFS...';
    document.getElementById('roninProgressFill').style.width = '60%';
    
    const metadataUri = await uploadToArweave(imageData, title, description);
    console.log('IPFS upload complete:', metadataUri);
    
    // Step 4: Update token URI
    document.getElementById('roninStatus').textContent = '🔄 Updating NFT metadata...';
    document.getElementById('roninProgressFill').style.width = '80%';
    
    try {
        const updateTx = await contract.updateTokenURI(tokenId, metadataUri);
        console.log('Update transaction sent:', updateTx.hash);
        await updateTx.wait();
        console.log('Token URI updated successfully!');
    } catch (updateError) {
        console.error('Failed to update URI:', updateError);
        alert('NFT minted but metadata update failed. Token ID: ' + tokenId);
    }
    
    document.getElementById('roninProgressFill').style.width = '100%';
    document.getElementById('roninStatus').textContent = '✅ RONIN NFT MINTED!';
    
    setTimeout(() => {
        closeRoninModal();
        alert('🎉 RONIN SAIGON: ' + editions + ' EDITIONS MINTED!\n\n' +
              'Title: ' + title + '\nToken ID: ' + tokenId + 
              '\nTx: ' + tx.hash + '\nIPFS: ' + metadataUri + 
              '\n\nView on Saigon Explorer:\n' +
              'https://saigon-explorer.roninchain.com/tx/' + tx.hash);
    }, 2000);
    
} catch (error) {
    console.error('Minting error:', error);
    document.getElementById('roninStatus').textContent = '❌ Error: ' + error.message;
    setTimeout(() => {
        alert('Minting failed: ' + error.message);
        document.getElementById('roninProgress').style.display = 'none';
    }, 2000);
}
}

// Add Ronin modal event listeners
document.getElementById('closeRoninBtn').addEventListener('click', closeRoninModal);
document.getElementById('cancelRoninBtn').addEventListener('click', closeRoninModal);
document.getElementById('mintRoninBtn').addEventListener('click', startRoninMinting);

// Add form validation listeners
document.getElementById('roninTitle').addEventListener('input', validateRoninForm);
document.getElementById('roninTitle').addEventListener('keyup', validateRoninForm);
document.getElementById('roninEditions').addEventListener('input', validateRoninForm);
document.getElementById('roninEditions').addEventListener('change', validateRoninForm);

async function uploadToArweave(imageData, title, description) {
const canvasToUse = selectedCanvas || selectedCanvasForMinting || 'base';
selectedCanvas = canvasToUse;

try {
    console.log('📤 Uploading to AUROMA25 via secure backend...');
    
    const artistAddress = currentAccount ? currentAccount.slice(0,8) : 'anon';
    
    // Call YOUR backend instead of Pinata directly
    const response = await fetch('/api/upload-to-pinata', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            imageData,
            title,
            description,
            artistAddress
        })
    });
    
    if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Upload complete:', result.metadataUrl);
    
    return result.metadataUrl;
    
} catch (error) {
    console.error('Upload error:', error);
    throw error;
}
}

function forceCanvasSelection() {
if (!selectedCanvas && !selectedCanvasForMinting) {
    console.log('No canvas selected, defaulting to base');
    selectCanvas('base');
}
}





document.getElementById('imageUploadBtn').addEventListener('click', () => {
document.getElementById('imageUpload').click();
});
document.getElementById('samplerUploadBtn').addEventListener('click', () => {
document.getElementById('samplerUpload').click();
});
document.getElementById('minusBtn').addEventListener('click', () => {
const brushSize = document.getElementById('brushSize');
brushSize.value = Math.max(parseInt(brushSize.value) - 10, 1);
brushSize.dispatchEvent(new Event('input'));
document.getElementById('sizeValue').textContent = brushSize.value;
});
document.getElementById('plusBtn').addEventListener('click', () => {
const brushSize = document.getElementById('brushSize');
brushSize.value = Math.min(parseInt(brushSize.value) + 10, 700);
brushSize.dispatchEvent(new Event('input'));
document.getElementById('sizeValue').textContent = brushSize.value;
});

// Update sizeValue and hueValue on slider input
document.getElementById('brushSize').addEventListener('input', () => {
document.getElementById('sizeValue').textContent = document.getElementById('brushSize').value;
});
document.getElementById('hueSlider').addEventListener('input', () => {
document.getElementById('hueValue').textContent = document.getElementById('hueSlider').value;
});
const brushSizeSlider = document.getElementById('brushSize');
const sizeValue = document.getElementById('sizeValue');
const minusBtn = document.getElementById('minusBtn');
const plusBtn = document.getElementById('plusBtn');

// Debounce function to limit rapid updates
function debounce(func, wait) {
let timeout;
return function (...args) {
clearTimeout(timeout);
timeout = setTimeout(() => func.apply(this, args), wait);
};
}

// Debounced toggleEffect to reduce rapid state changes
const debouncedToggleEffect = debounce((effect, state) => {
toggleEffect(effect, state);
}, 20); // 20ms to prevent rapid toggles

function updateBrushSize(value) {
let newSize = Math.max(1, Math.min(700, parseInt(value)));
brushSize = newSize;
baseBrushSize = newSize;
brushSizeSlider.value = newSize;
sizeValue.textContent = newSize;
if (isRecording && currentMovement) {
    recordMovement('size', { size: newSize });
}
console.log(`Brush size updated to: ${newSize}`);
}

let isGestureResizing = false;

// Debounced input handler for smooth slider updates
const debouncedUpdateBrushSize = debounce((value) => {
updateBrushSize(value);
}, 10); // 10ms delay to reduce jitter

brushSizeSlider.addEventListener('input', (e) => {
if (isGestureResizing) return;
let newSize = parseInt(e.target.value);
debouncedUpdateBrushSize(newSize);
});

// Touch support for smooth slider interaction
brushSizeSlider.addEventListener('touchmove', (e) => {
e.preventDefault(); // Prevent scrolling
if (isGestureResizing) return;
const touch = e.touches[0];
const rect = brushSizeSlider.getBoundingClientRect();
const value = Math.round(((touch.clientX - rect.left) / rect.width) * 700);
debouncedUpdateBrushSize(value);
}, { passive: false });

minusBtn.addEventListener('click', () => {
let current = Math.max(1, brushSize - 10); // Larger step for click
updateBrushSize(current);
});

plusBtn.addEventListener('click', () => {
let current = Math.min(700, brushSize + 10); // Larger step for click
updateBrushSize(current);
});
// Hue Slider Setup
const hueSlider = document.getElementById('hueSlider');
const hueValue = document.getElementById('hueValue');
const hueBaseBtn = document.getElementById('hueBaseBtn');
const huePaintBtn = document.getElementById('huePaintBtn');
const hueSamplerBtn = document.getElementById('hueSamplerBtn');

// Track hue values per canvas
let hueValues = { base: 0, paint: 0, sampler: 0 };
let selectedHueCanvas = 'base'; // Default to base

function updateHueDisplay() {
hueValue.textContent = hueValues[selectedHueCanvas];
hueSlider.value = hueValues[selectedHueCanvas];
}

function applyHueShift(canvasId, hue) {
const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
const data = imageData.data;

for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) { // Only shift non-transparent pixels
        const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
        const newH = (h + hue) % 360;
        const [r, g, b] = hslToRgb(newH, s, l);
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
    }
}

ctx.putImageData(imageData, 0, 0);
currentImageData[canvasId] = imageData;
console.log(`Applied hue ${hue} to ${canvasId}`);
}

function setHueCanvas(canvasId) {
selectedHueCanvas = canvasId;
hueBaseBtn.classList.toggle('selected', canvasId === 'base');
huePaintBtn.classList.toggle('selected', canvasId === 'paint');
hueSamplerBtn.classList.toggle('selected', canvasId === 'sampler');
updateHueDisplay();
}

hueSlider.addEventListener('input', (e) => {
const newHue = parseInt(e.target.value);
const deltaHue = newHue - hueValues[selectedHueCanvas];
hueValues[selectedHueCanvas] = newHue;
updateHueDisplay();
applyHueShift(selectedHueCanvas, deltaHue);
});

hueSlider.addEventListener('touchstart', (e) => {
const touch = e.touches[0];
const rect = hueSlider.getBoundingClientRect();
const newHue = Math.round((touch.clientX - rect.left) / rect.width * 360);
const deltaHue = newHue - hueValues[selectedHueCanvas];
hueValues[selectedHueCanvas] = Math.max(0, Math.min(360, newHue));
updateHueDisplay();
applyHueShift(selectedHueCanvas, deltaHue);
}, { passive: false });

hueBaseBtn.addEventListener('click', () => setHueCanvas('base'));
huePaintBtn.addEventListener('click', () => setHueCanvas('paint'));
hueSamplerBtn.addEventListener('click', () => setHueCanvas('sampler'));

// Initialize with base selected
setHueCanvas('base');


const fullViewBtn = document.getElementById('fullViewBtn');
fullViewBtn.addEventListener('click', () => {
saveState(true); // Save before toggling
toggleViewMode();
saveState(true); // Save after toggling
});



const brushButtons = {
box: document.getElementById('boxBtn'),
circle: document.getElementById('circleBtn'),
rectangle: document.getElementById('rectangleBtn'),
triangle: document.getElementById('triangleBtn'),
melt: document.getElementById('meltBtn'),
brokenScreen: document.getElementById('brokenScreenBtn'),
sweeper: document.getElementById('sweeperBtn'),
oilbarrel: document.getElementById('oilbarrelBtn'),
aestheticLines: document.getElementById('aestheticLinesBtn'),
tv: document.getElementById('tvBtn'),
negative: document.getElementById('negativeBtn'),
jazzScatter: document.getElementById('jazzScatterBtn'),
squareSelection: document.getElementById('squareSelectionBtn'),
basquiatSelection: document.getElementById('basquiatSelectionBtn'),
circleSelection: document.getElementById('circleSelectionBtn')
};

let midiAccess = null;
function initMIDI() {
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess().then(
            (access) => {
                midiAccess = access;
                console.log('MIDI Access Granted:', midiAccess);
                setupMIDIInputs();
            },
            (error) => {
                console.error('MIDI Access Denied:', error);
                alert('MIDI ACCESS DENIED. CHECK BROWSER PERMISSIONS OR CONNECT A MIDI DEVICE.');
            }
        );
    } else {
        console.error('Web MIDI not supported in this browser.');
        alert('YOUR BROWSER DOESN’T SUPPORT WEB MIDI. TRY CHROME OR EDGE.');
    }
}
function setupMIDIInputs() {
    const inputs = midiAccess.inputs.values();
    for (let input = inputs.next(); !input.done; input = inputs.next()) {
        input.value.onmidimessage = handleMIDIMessage;
        console.log('MIDI Input Connected:', input.value.name);
    }
    midiAccess.onstatechange = (event) => {
        console.log('MIDI State Change:', event.port.name, event.port.state);
        if (event.port.state === 'connected' && event.port.type === 'input') {
            event.port.onmidimessage = handleMIDIMessage;
        }
    };
}
function handleMIDIMessage(event) {
const [command, note, velocity] = event.data;
const isNoteOn = (command >= 144 && command <= 159) && velocity > 0;
const isNoteOff = (command >= 128 && command <= 143) || (command >= 144 && command <= 159 && velocity === 0);
for (const [effect, mapping] of Object.entries(effectMap)) {
if (note === mapping.midi) {
  if (isNoteOn) {
    toggleEffect(effect, true);
    console.log(`MIDI Note On: ${effect} (${note})`);
    if (isRecording && currentMovement) currentMovement.effects[effect] = true;
  } else if (isNoteOff) {
    toggleEffect(effect, false);
    console.log(`MIDI Note Off: ${effect} (${note})`);
    if (isRecording && currentMovement) currentMovement.effects[effect] = false;
  }
}
}
}
window.addEventListener('load', initMIDI);

function startMovementRecording() {
recordedMovements = recordedMovements || [];
if (currentMovement && (currentMovement.smears.length > 0 || currentMovement.events.length > 0)) {
    console.log('Existing movement with data, finalizing:', {
        smears: currentMovement.smears.length,
        events: currentMovement.events.length,
        effects: currentMovement.effects
    });
    endMovementRecording();
}
isRecording = true;
currentMovement = {
    shape: brushShape || 'box',
    size: brushSize || baseBrushSize || 200,
    rotation: brushRotation || 0,
    cloneSize: cloneBrushSize || brushSize || 200,
    cloneRotation: cloneBrushRotation || 0,
    paintMode: isPaintMode || false,
    paintColor: { ...paintColor } || { r: 255, g: 0, b: 0 },
    flipHorizontal: isFlipHorizontalActive || false,
    flipVertical: isFlipVerticalActive || false,
    stickerSlot: brushShape === 'stickerMode' ? stampOrder[0] : null,
    effects: {},
    smears: [],
    events: [],
    state: {
        base: baseCanvas.toDataURL('image/png'),
        paint: paintCanvas.toDataURL('image/png'),
        sampler: samplerCanvas.toDataURL('image/png')
    },
    brushState: {
        shape: brushShape,
        size: brushSize,
        rotation: brushRotation,
        cloneSize: cloneBrushSize || brushSize,
        cloneRotation: cloneBrushRotation || 0,
        paintMode: isPaintMode,
        paintColor: { ...paintColor },
        flipHorizontal: isFlipHorizontalActive,
        flipVertical: isFlipVerticalActive,
        stickerSlot: brushShape === 'stickerMode' ? stampOrder[0] : null
    },
    targetCanvas: null,
    startTime: performance.now(),
    lastSmearTime: 0,
    eventCount: 0,
    duration: 0
};
Object.keys(effectMap).forEach(effect => {
    currentMovement.effects[effect] = eval(`is${effect.charAt(0).toUpperCase() + effect.slice(1)}${effect.includes('flip') ? 'Active' : 'Held'}`) || false;
});
console.log('Started new movement recording:', {
    shape: currentMovement.shape,
    size: currentMovement.size,
    effects: Object.keys(currentMovement.effects).filter(k => currentMovement.effects[k]),
    totalMovements: recordedMovements.length
});
}
function endMovementRecording() {
if (!currentMovement) {
    console.warn('Cannot end recording: currentMovement is null');
    isRecording = false;
    return;
}
currentMovement.duration = Number((performance.now() - currentMovement.startTime).toFixed(2));
// Ensure events and smears are arrays and filter invalid entries
currentMovement.events = Array.isArray(currentMovement.events) ? 
    currentMovement.events.filter(e => e && e.type && e.data && typeof e.data === 'object' && (e.type !== 'effect' || e.data.effect)) : [];
currentMovement.smears = Array.isArray(currentMovement.smears) ? 
    currentMovement.smears.filter(s => s && typeof s === 'object' && s.lastX != null && s.currentX != null) : [];
// Update activeEffects before saving
currentMovement.activeEffects = [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e);
console.log('Ending recording:', {
    smears: currentMovement.smears.length,
    events: currentMovement.events.length,
    shape: currentMovement.shape,
    targetCanvas: currentMovement.targetCanvas,
    effects: currentMovement.effects,
    activeEffects: currentMovement.activeEffects,
    totalMovementsBefore: recordedMovements.length,
    eventsContent: currentMovement.events.map(e => ({
        type: e.type,
        effect: e.data.effect,
        state: e.data.state,
        timestamp: e.data.timestamp
    }))
});
if (currentMovement.smears.length > 0 || currentMovement.events.length > 0) {
    recordedMovements = Array.isArray(recordedMovements) ? recordedMovements : [];
    if (recordedMovements.length >= 100) {
        recordedMovements.shift();
        console.log('Max 100 movements, removed oldest');
    }
    recordedMovements.push({
        ...currentMovement,
        smears: [...currentMovement.smears],
        events: [...currentMovement.events],
        effects: { ...currentMovement.effects },
        activeEffects: [...(currentMovement.activeEffects || [])] // Preserve active effects
    });
    console.log('Saved movement:', {
        smears: currentMovement.smears.length,
        events: currentMovement.events.length,
        effects: currentMovement.effects,
        activeEffects: currentMovement.activeEffects,
        totalMovements: recordedMovements.length,
        savedEvents: recordedMovements[recordedMovements.length - 1].events.map(e => ({
            type: e.type,
            effect: e.data.effect,
            state: e.data.state,
            timestamp: e.data.timestamp
        }))
    });
} else {
    console.log('Discarded empty movement:', {
        smears: currentMovement.smears.length,
        events: currentMovement.events.length
    });
}
currentMovement = null;
isRecording = false;
}

let viewMode = 'single'; // Track current view mode

function toggleViewMode(mode) {
// Toggle between 'single' and 'triple' if no mode specified
viewMode = mode || (viewMode === 'single' ? 'triple' : 'single');

const container = document.getElementById('canvasContainer');
const canvases = [baseCanvas, paintCanvas, samplerCanvas];

// Remove all view classes
container.classList.remove('view-single', 'view-triple', 'full-view');

// Apply the new view class
container.classList.add(`view-${viewMode}`);

// Ensure all canvases are visible (except sampler if no image)
canvases.forEach(canvas => {
    canvas.classList.remove('active-canvas');
    
    // Show/hide sampler canvas based on image availability
    if (canvas === samplerCanvas && (!samplerImg.complete || samplerImg.naturalWidth === 0)) {
        canvas.style.display = 'none';
    } else {
        canvas.style.display = 'block';
    }
});

// Mark baseCanvas as active for reference
baseCanvas.classList.add('active-canvas');

// Reset scroll position when switching to single view
if (viewMode === 'single') {
    container.scrollLeft = 0;
}

// Force canvas redraw
canvases.forEach(canvas => {
    const ctx = canvas.getContext('2d');
    const canvasId = canvas.id.replace('Canvas', '');
    
    // Clear and redraw canvas content
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (currentImageData[canvasId]) {
        ctx.putImageData(currentImageData[canvasId], 0, 0);
    } else if (canvasId === 'base' && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } else if (canvasId === 'sampler' && samplerImg.complete && samplerImg.naturalWidth > 0) {
        ctx.drawImage(samplerImg, 0, 0, canvas.width, canvas.height);
    }
});

// Update the toggle button
const fullViewBtn = document.getElementById('fullViewBtn');
if (fullViewBtn) {
    fullViewBtn.src = viewMode === 'triple' ? '/images/STAMPTOGGLE.png' : '/images/3CANVASVIEW.png';
    fullViewBtn.title = viewMode === 'triple' ? 
        'RETURN TO SINGLE CANVAS VIEW' : 
        'ALL CANVASSES VIEW, DEDICATED TO BASQUIAT....OG OF MULTI-CANVAS WORKIN\'';
}

// Re-sync selection canvas if active
if (selectionCanvas && selectionCanvas.dataset.targetCanvasId) {
    const targetCanvas = document.getElementById(selectionCanvas.dataset.targetCanvasId);
    if (targetCanvas) {
        syncSelectionCanvasPosition(targetCanvas);
        if (typeof renderMarchingAnts === 'function') {
            renderMarchingAnts();
        }
    }
}

console.log(`View mode: ${viewMode}`);
}


function updateBrushOrientation() {
let updated = false;
if (!(brushShape === 'sweeper' || brushShape === 'oilbarrel') || !isDragging || !touchPoints[0]?.isMouse) {
    if (isRotatingLeft) {
        brushRotation -= rotationSpeed;
        isIntentionalRotation = true;
        updated = true;
        console.log(`Rotating counterclockwise: brushRotation=${brushRotation.toFixed(3)}`);
        if (isRecording && currentMovement) {
            recordMovement('rotation', { 
                rotation: Number(brushRotation.toFixed(3)), 
                fingerRole: 'arrowKeyLeft',
                timestamp: performance.now() - currentMovement.startTime
            });
        }
    }
    if (isRotatingRight) {
        brushRotation += rotationSpeed;
        isIntentionalRotation = true;
        updated = true;
        console.log(`Rotating clockwise: brushRotation=${brushRotation.toFixed(3)}`);
        if (isRecording && currentMovement) {
            recordMovement('rotation', { 
                rotation: Number(brushRotation.toFixed(3)), 
                fingerRole: 'arrowKeyRight',
                timestamp: performance.now() - currentMovement.startTime
            });
        }
    }
}

if (isFlippingUp || isFlippingDown) {
    if (brushShape === 'stickerMode') {
        flipStamps('vertical');
    }
    updated = true;
    console.log(`Flipping: ${isFlippingUp ? 'forward' : 'backward'}, isFlipVerticalActive=${isFlipVerticalActive}`);
    if (isRecording && currentMovement) {
        recordMovement('effect', { 
            effect: 'flipVertical', 
            state: isFlipVerticalActive,
            timestamp: performance.now() - currentMovement.startTime
        });
    }
}

if (updated && isRecording && currentMovement) {
    currentMovement.rotation = Number(brushRotation.toFixed(3));
}

if (isRotatingLeft || isRotatingRight || isFlippingUp || isFlippingDown) {
    requestAnimationFrame(updateBrushOrientation);
}
}

function startOrientationAnimation() {
if (!isRotatingLeft && !isRotatingRight && !isFlippingUp && !isFlippingDown) {
    requestAnimationFrame(updateBrushOrientation);
}
}

document.addEventListener('keydown', (e) => {
if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    startOrientationAnimation();
}
});


function applyScatterEffect(currentX, currentY, lastX, lastY, canvasId, ctx) {
if (!isScatterHeld) return;

const copyCount = Math.floor(8 + Math.random() * 5); // 8-12 copies
const scatterRadius = brushSize * 0.75; // 1.5x radius for spread
const originalBrushSize = brushSize;
const originalRotation = brushRotation;
const halfBrush = originalBrushSize / 2;

// Use the main brush's position as the source for scattered copies
const sourceX = currentX;
const sourceY = currentY;

for (let i = 0; i < copyCount; i++) {
    // Random size (5%-30% of original)
    const scale = 0.05 + Math.random() * 0.25;
    brushSize = Math.max(3, originalBrushSize * scale); // Minimum 3px for visibility
    // Position around brush, outside boundaries
    const minDistance = halfBrush + brushSize / 2; // Start outside original brush
    const distance = minDistance + Math.random() * scatterRadius;
    const offsetAngle = Math.random() * 2 * Math.PI; // Full 360° spread
    const scatterX = currentX + Math.cos(offsetAngle) * distance;
    const scatterY = currentY + Math.sin(offsetAngle) * distance;
    // Slight random rotation
    brushRotation = originalRotation + (Math.random() - 0.5) * 0.5;

    // Draw scatter point if within canvas and outside original brush
    if (scatterX >= 0 && scatterX < ctx.canvas.width && scatterY >= 0 && scatterY < ctx.canvas.height &&
        !isPixelInBrushShape(scatterX, scatterY, currentX, currentY, halfBrush)) {
        // Temporarily disable scatter to prevent recursion
        const wasScatterHeld = isScatterHeld;
        isScatterHeld = false;
        smearPixels(scatterX, scatterY, canvasId, sourceX, sourceY, undefined, ctx.canvas);
        isScatterHeld = wasScatterHeld;
    }
}

// Restore original state
brushSize = originalBrushSize;
brushRotation = originalRotation;
console.log(`Scatter applied - Copies: ${copyCount}, Radius: ${scatterRadius}`);
}



// Updated renderMarchingAnts
function renderMarchingAnts() {
// Add safety check: clear immediately if in zoom mode
if (isZooming) {
    if (selectionCanvas) {
        selectionCanvas.style.display = 'none';
        selectionCanvas.style.visibility = 'hidden';
        if (selectionCtx) {
            selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
        }
        delete selectionCanvas.dataset.targetCanvasId;
    }
    return;
}

// Check your original conditions with the problematic dataset check
if (!isSelecting && !isSelectionActive && !selectionStart && !multipointPath.length && !selectionCanvas.dataset.targetCanvasId) {
    selectionCanvas.style.display = 'none';
    selectionCanvas.style.visibility = 'hidden';
    selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
    console.log('Cleared marching ants - No active or pending selection');
    return;
}
if (!selectionCanvas || !selectionCtx) {
console.error('Selection canvas or context not initialized');
return;
}

if (selectionStart && selectionEnd) {
    const targetCanvasId = selectionCanvas.dataset.targetCanvasId;
    const canvasId = targetCanvasId === 'baseCanvas' ? 'base' : 
                    targetCanvasId === 'paintCanvas' ? 'paint' : 'sampler';
    const state = canvasStates[canvasId];
    
    console.log('MARCHING ANTS DEBUG:', {
        selectionStart: selectionStart,
        selectionEnd: selectionEnd,
        zoom: { level: state.zoomLevel, panX: state.panX, panY: state.panY },
        canvasId: canvasId,
        shouldBeAt: {
            start: {
                x: selectionStart.x * state.zoomLevel + state.panX,
                y: selectionStart.y * state.zoomLevel + state.panY
            },
            end: {
                x: selectionEnd.x * state.zoomLevel + state.panX,
                y: selectionEnd.y * state.zoomLevel + state.panY
            }
        }
    });
}


// Determine target canvas with fallback
let targetCanvas;
const targetCanvasId = selectionCanvas.dataset.targetCanvasId;
if (targetCanvasId === 'baseCanvas') targetCanvas = baseCanvas;
else if (targetCanvasId === 'paintCanvas') targetCanvas = paintCanvas;
else if (targetCanvasId === 'samplerCanvas') targetCanvas = samplerCanvas;
else {
targetCanvas = baseCanvas;
selectionCanvas.dataset.targetCanvasId = 'baseCanvas';
console.warn(`Invalid targetCanvasId (${targetCanvasId}), defaulting to baseCanvas`);
}

// Sync position and size
syncSelectionCanvasPosition(targetCanvas);
if (selectionCanvas.width !== targetCanvas.width || selectionCanvas.height !== targetCanvas.height) {
selectionCanvas.width = targetCanvas.width;
selectionCanvas.height = targetCanvas.height;
selectionCtx = selectionCanvas.getContext('2d', { alpha: true });
selectionCtx.imageSmoothingEnabled = false;
}
selectionCanvas.style.display = 'block';
selectionCanvas.style.visibility = 'visible';

// Clear canvas
selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);

// Setup styles
const glowHue = getComputedStyle(document.documentElement).getPropertyValue('--glow-hue').trim() || '51deg';
let strokeStyle = `hsl(${glowHue}, 75%, 65%)`;
if (isNeonHeld) strokeStyle = `hsl(${neonPhase}, 75%, 65%)`;
else if (isChromaticShiftHeld) strokeStyle = `hsl(${vhsPhase * 10}, 80%, 60%)`;
selectionCtx.strokeStyle = strokeStyle;
selectionCtx.lineWidth = 2;
selectionCtx.setLineDash([8, 8]);
const time = Date.now() / 200;
selectionCtx.lineDashOffset = -(time % 16);
selectionCtx.shadowColor = isNeonHeld ? strokeStyle : '#FF1493';
selectionCtx.shadowBlur = 8;

try {
if (selectionType === 'square' && selectionStart && selectionEnd && (isSelecting || isSelectionActive)) {
// Get zoom state
const targetCanvasId = selectionCanvas.dataset.targetCanvasId;
const canvasId = targetCanvasId === 'baseCanvas' ? 'base' : 
              targetCanvasId === 'paintCanvas' ? 'paint' : 'sampler';
const state = canvasStates[canvasId];
const zoomLevel = state.zoomLevel || 1;
const panX = state.panX || 0;
const panY = state.panY || 0;

// Don't transform - selection canvas handles zoom via CSS transform
const screenStartX = selectionStart.x;
const screenStartY = selectionStart.y;
const screenEndX = selectionEnd.x;
const screenEndY = selectionEnd.y;

const x = Math.min(screenStartX, screenEndX) + 0.5;
const y = Math.min(screenStartY, screenEndY) + 0.5;
const width = Math.abs(screenEndX - screenStartX);
const height = Math.abs(screenEndY - screenStartY);
selectionCtx.beginPath();
// Always draw a rectangle, even for small selections
selectionCtx.rect(x, y, Math.max(width, 1), Math.max(height, 1)); // Ensure minimum 1px
selectionCtx.stroke();
if (isSelecting) {
selectionCtx.fillStyle = '#FFD700';
selectionCtx.shadowBlur = 0;
[selectionStart, selectionEnd].forEach(point => {
  if (point.x >= 0 && point.y >= 0 && point.x <= selectionCanvas.width && point.y <= selectionCanvas.height) {
    selectionCtx.beginPath();
    selectionCtx.arc(point.x + 0.5, point.y + 0.5, 6, 0, 2 * Math.PI);
    selectionCtx.fill();
  }
});
}
console.log(`Rendered square selection: x=${x}, y=${y}, width=${width}, height=${height}`);
} else if (selectionType === 'circle' && selectionStart && selectionEnd && (isSelecting || isSelectionActive)) {
const centerX = (selectionStart.x + selectionEnd.x) / 2 + 0.5;
const centerY = (selectionStart.y + selectionEnd.y) / 2 + 0.5;
const radiusX = Math.max(Math.abs(selectionEnd.x - selectionStart.x) / 2, 1); // Minimum 1px
const radiusY = Math.max(Math.abs(selectionEnd.y - selectionStart.y) / 2, 1); // Minimum 1px
selectionCtx.beginPath();
selectionCtx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
selectionCtx.stroke();
if (isSelecting) {
selectionCtx.fillStyle = '#FFD700';
selectionCtx.shadowBlur = 0;
[selectionStart, selectionEnd].forEach(point => {
  if (point.x >= 0 && point.y >= 0 && point.x <= selectionCanvas.width && point.y <= selectionCanvas.height) {
    selectionCtx.beginPath();
    selectionCtx.arc(point.x + 0.5, point.y + 0.5, 6, 0, 2 * Math.PI);
    selectionCtx.fill();
  }
});
}
console.log(`Rendered circle selection: center=(${centerX}, ${centerY}), radiusX=${radiusX}, radiusY=${radiusY}`);
} else if (selectionType === 'multipoint' && multipointPath.length > 0 && (isSelecting || isSelectionActive)) {
  selectionCtx.beginPath();
  selectionCtx.moveTo(multipointPath[0].x + 0.5, multipointPath[0].y + 0.5);
  for (let i = 1; i < multipointPath.length; i++) {
    selectionCtx.lineTo(multipointPath[i].x + 0.5, multipointPath[i].y + 0.5);
  }
  if (isSelectionActive) {
    selectionCtx.closePath();
  } else if (isSelecting && isDragging && touchPoints.length > 0 && touchPoints[0].target === targetCanvas) {
    // Only show preview line during active drag
    const coords = getCanvasCoordinates({ touches: touchPoints }, touchPoints[0]);
    if (!isNaN(coords.x) && !isNaN(coords.y)) {
      selectionCtx.setLineDash([4, 4]);
      selectionCtx.lineTo(coords.x + 0.5, coords.y + 0.5);
    }
  }
  selectionCtx.stroke();
  if (isSelecting) {
    selectionCtx.fillStyle = '#FFD700';
    selectionCtx.shadowBlur = 0;
    multipointPath.forEach((point) => {
      if (point.x >= 0 && point.y >= 0 && point.x <= selectionCanvas.width && point.y <= selectionCanvas.height) {
        selectionCtx.beginPath();
        selectionCtx.arc(point.x + 0.5, point.y + 0.5, 6, 0, 2 * Math.PI);
        selectionCtx.fill();
      }
    });
  }
  console.log(`Rendered multipoint selection: points=${multipointPath.length}, closed=${isSelectionActive}`);
} else {
  selectionCanvas.style.display = 'none';
  selectionCanvas.style.visibility = 'hidden';
  selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
  console.log('No selection to render');
  return;
}
} catch (e) {
console.error('Error rendering marching ants:', e);
selectionCanvas.style.display = 'none';
selectionCanvas.style.visibility = 'hidden';
selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
return;
}

// Reset context
selectionCtx.shadowBlur = 0;
selectionCtx.setLineDash([]);

// Schedule next frame with throttling
if (isSelecting || isSelectionActive) {
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
selectionCanvas.style.display = 'none';
selectionCanvas.style.visibility = 'hidden';
selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
console.log('Stopped marching ants animation');
}
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

function clearZoomLocks() {
Object.keys(canvasStates).forEach(canvasId => {
    if (canvasStates[canvasId].targetLocked) {
        console.log(`Clearing targetLocked for ${canvasId} on tool switch`);
        canvasStates[canvasId].targetLocked = false;
    }
});
}

function continueDragOutsideCanvas(e) {
if (isDragging && e.buttons === 1 && touchPoints.length > 0) {
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

function endDragOutsideCanvas(e) {
if (isDragging) {
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



function startDrag(e) {
console.log('=== STARTDRAG FULL STATE ===', {
    isZooming,
    isSelectionActive,
    isSelecting,
    isDraggingSelection,
    brushShape,
    selectionStart: !!selectionStart,
    selectionEnd: !!selectionEnd,
    targetCanvas: e.target?.id
});
console.log('=== STARTDRAG DEBUG ===');
console.log('isZooming:', isZooming);
console.log('brushShape:', brushShape);
console.log('event type:', e.type);
console.log('target:', e.target?.id || e.target?.tagName);

// Add this debug block:
const debugCanvas = e.target === baseCanvas ? 'base' : 
                   e.target === paintCanvas ? 'paint' : 
                   e.target === samplerCanvas ? 'sampler' : 'unknown';
if (debugCanvas !== 'unknown') {
    const state = canvasStates[debugCanvas];
    console.log(`🔍 startDrag DEBUG: canvas=${debugCanvas}, zoom=${state.zoomLevel}, pan=(${state.panX},${state.panY}), targetLocked=${state.targetLocked}, isZooming=${isZooming}`);
}
console.log('startDrag called, isZooming:', isZooming, 'event type:', e.type, 'target:', e.target && e.target.id);

const targetCanvas = e.target === baseCanvas ? baseCanvas :
                    e.target === paintCanvas ? paintCanvas :
                    e.target === samplerCanvas ? samplerCanvas : null;

// Skip if target is a button, within leftControls, or not a canvas
if (!targetCanvas || e.target.closest('#leftControls') || e.target.classList.contains('brush-icon') || e.target.closest('.control-icon')) {
    console.log('startDrag: Skipped due to button, leftControls, or non-canvas target', e.target);
    return;
}

console.log(`startDrag: Target=${targetCanvas.id}, brushShape=${brushShape}, isSelecting=${isSelecting}`);

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
const state = canvasStates[canvasId];

if (!isZooming && state.targetLocked) {
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
            const isEffectActive = eval(`is${effect.charAt(0).toUpperCase() + effect.slice(1)}Held`);
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
const isStickerMode = brushShape === 'stickerMode';
const minTouchPoints = isStickerMode ? 3 : 4;
if (!isRotatingLeft && !isRotatingRight && validTouches.length < minTouchPoints) {
    brushRotation = 0;
    isIntentionalRotation = false;
    console.log(`startDrag - Reset brushRotation to ${brushRotation}`);
}

// Initialize recording
if (isRecording && !isDragging) {
    startMovementRecording();
    currentMovement.activeEffects = [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e);
    console.log('Started recording new drag movement:', {
        shape: currentMovement.shape,
        size: currentMovement.size,
        rotation: currentMovement.rotation,
        cloneSize: currentMovement.cloneSize,
        cloneRotation: currentMovement.cloneRotation,
        flipHorizontal: currentMovement.flipHorizontal,
        flipVertical: currentMovement.flipVertical,
        stickerSlot: currentMovement.stickerSlot,
        targetCanvas: canvasId,
        activeEffects: currentMovement.activeEffects,
        totalMovements: recordedMovements.length
    });
}

const keyboardRect = keyboardContainer.getBoundingClientRect();

// NEW: Always check if canvas is zoomed, not just if zoom tool is active
const isCanvasZoomed = state.zoomLevel !== 1;

// CRITICAL FIX: Force hide selection canvas when trying to zoom
if (isZooming && selectionCanvas) {
selectionCanvas.style.display = 'none';
selectionCanvas.style.pointerEvents = 'none';
selectionCanvas.style.zIndex = '-1'; // Force it behind everything
console.log('Force hiding selection canvas for zoom');
}

// Handle zoom tool mode (when actively zooming)
if (isZooming) {
    console.log('Zoom tool active in startDrag for', canvasId);
    if (validTouches.length > 1) { 
        isZooming = false; 
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
    
    const existingIndex = touchPoints.findIndex(tp => tp.id === newTouchPoint.id);
    if (existingIndex >= 0) {
        touchPoints[existingIndex] = newTouchPoint;
    } else {
        touchPoints.push(newTouchPoint);
    }
    lastTouchPoints = [...touchPoints];

    if (!isDragging) {
        isDragging = true;
        shouldSaveState = true;
    }
    console.log('Start drag - Zoom mode, Touches:', validTouches.length, 'TouchPoints:', touchPoints);
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
if (brushShape === 'squareSelection' || brushShape === 'basquiatSelection' || brushShape === 'circleSelection') {
// CRITICAL FIX: Check zoom mode FIRST before any selection logic
if (isZooming) {
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
            if (isDragging && !isZooming && e.buttons === 1) {
                drag(e);
            }
        };
        
        globalTouchMoveHandler = (e) => {
            if (isDragging && !isZooming) {
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

    console.log(`startDrag: brushShape=${brushShape}, selectionType=${selectionType}, targetCanvas=${targetCanvas.id}, isMouse=${isMouseEvent}`);

    if (!selectionType) {
        selectionType = brushShape === 'squareSelection' ? 'square' : brushShape === 'circleSelection' ? 'circle' : 'multipoint';
        console.log(`Set selectionType to ${selectionType}`);
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

if (isZooming) {
    console.log('BLOCKING: Not continuing with selection setup in zoom mode');
    return;
}

if (isRecording) {
    recordMovement('smear', {
        lastX: coords.x,
        lastY: coords.y,
        currentX: coords.x,
        currentY: coords.y,
        canvasId
    });
}

if (isSelectionActive && selectionCanvas.dataset.targetCanvasId === targetCanvas.id) {
const isInside = isPointInSelection(coords.x, coords.y, brushShape);
if (isInside) {
    // Save state before dragging existing selection (new line added)
    saveState(true);
    // Initialize touch point with correct lastX, lastY
    touchPoints = [{
        id: validTouches[0].identifier || 'mouse0',
        x: coords.x,
        y: coords.y,
        target: targetCanvas,
        lastX: lastTouchPoints.find(tp => tp.id === (validTouches[0].identifier || 'mouse0'))?.x || coords.x,
        lastY: lastTouchPoints.find(tp => tp.id === (validTouches[0].identifier || 'mouse0'))?.y || coords.y,
        startTime: Date.now(),
        isMouse: isMouseEvent
    }];
    lastTouchPoints = [...touchPoints];
    isDragging = true;
    isDraggingSelection = true;
    console.log(`Dragging existing ${brushShape} selection at (${coords.x}, ${coords.y}) on ${targetCanvas.id}`);
    renderMarchingAnts();
    return;
} else {
    saveState(true);
    isSelectionActive = false;
    isSelecting = true;
    isDraggingSelection = false;
    selectedImageData = null;
    selectionBounds = null;
    selectionStart = null;
    selectionEnd = null;
    multipointPath = [];
    selectionCacheCanvas = null;
    selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
    console.log(`Reset ${brushShape} selection state for new selection on ${targetCanvas.id}`);
}
}

if (brushShape === 'basquiatSelection' && validTouches.length === 1) {
console.log('>>> BASQUIAT SECTION REACHED! isZooming=', isZooming);
if (isZooming) {
    console.log('>>> BASQUIAT BLOCKED BY ZOOM MODE');
    return;
}
        const currentTime = Date.now();
        if (isNaN(coords.x) || isNaN(coords.y)) {
            console.warn('Invalid coords for multipoint selection:', coords);
            return;
        }

        console.log(`Input at (${coords.x.toFixed(2)}, ${coords.y.toFixed(2)}), multipointPath.length=${multipointPath.length}, isSelecting=${isSelecting}, isSelectionActive=${isSelectionActive}, inputType=${isMouseEvent ? 'mouse' : 'touch'}, touchId=${validTouches[0].identifier || 'mouse0'}`);

        const maxPoints = isMouseEvent ? 20 : 40;

        if (multipointPath.length > 2) {
            const firstPoint = multipointPath[0];
            const distance = Math.sqrt(
                Math.pow(coords.x - firstPoint.x, 2) + Math.pow(coords.y - firstPoint.y, 2)
            );
            const proximityThreshold = isMouseEvent ? 15 : 35;
            console.log(`Checking loop closure: distance=${distance.toFixed(2)}, threshold=${proximityThreshold}, points=${multipointPath.length}, coords=(${coords.x.toFixed(2)}, ${coords.y.toFixed(2)}), firstPoint=(${firstPoint.x.toFixed(2)}, ${firstPoint.y.toFixed(2)}), touch=${isTouchEvent}, touchId=${validTouches[0]?.identifier || 'mouse0'}`);
            if (distance < proximityThreshold) {
                console.log(`Unstoppable loop closure triggered on ${targetCanvas.id}: points=${multipointPath.length}, coords=(${coords.x.toFixed(2)}, ${coords.y.toFixed(2)}), touch=${isTouchEvent}, touchId=${validTouches[0]?.identifier || 'mouse0'}`);
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
                isSelecting = false;
                isSelectionActive = true;
                selectionBounds = calculatePolygonBounds(multipointPath);
                selectedImageData = captureSelection(targetCanvas, multipointPath, 'multipoint');
                if (!selectedImageData) {
                    console.error('Failed to capture multipoint selection');
                    isSelectionActive = false;
                    multipointPath = [];
                    return;
                }
                console.log(`Manually closed multipoint selection on ${targetCanvas.id}: ${multipointPath.length} points`);
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
            console.log(`Ignoring double-tap: timeSinceLastTap=${currentTime - window.lastTapTime}ms, points=${multipointPath.length}, coords=(${coords.x.toFixed(2)}, ${coords.y.toFixed(2)})`);
            return;
        }

        if (isTouchEvent && isSelectionActive && currentTime - window.lastCloseTime < 200) {
            console.log(`Blocking new selection after closure: timeSinceLastClose=${currentTime - window.lastCloseTime}ms, points=${multipointPath.length}, coords=(${coords.x.toFixed(2)}, ${coords.y.toFixed(2)})`);
            return;
        }

        if (multipointPath.length < maxPoints) {
            console.log(`Adding point: points=${multipointPath.length}, maxPoints=${maxPoints}, coords=(${coords.x.toFixed(2)}, ${coords.y.toFixed(2)}), isTouchEvent=${isTouchEvent}`);
            
            multipointPath.push({ x: coords.x, y: coords.y });
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
            if (isTouchEvent && multipointPath.length < maxPoints - 1) {
                multipointPath.push({ x: coords.x, y: coords.y });
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
                console.log(`Added double point for touch on ${targetCanvas.id}: (${coords.x.toFixed(2)}, ${coords.y.toFixed(2)}), total points: ${multipointPath.length}, maxPoints: ${maxPoints}`);
            } else if (isTouchEvent && multipointPath.length === maxPoints - 1) {
                console.log(`Added single point for touch (near max) on ${targetCanvas.id}: (${coords.x.toFixed(2)}, ${coords.y.toFixed(2)}), total points: ${multipointPath.length}, maxPoints: ${maxPoints}`);
            } else if (isMouseEvent) {
                console.log(`Added single point for mouse on ${targetCanvas.id}: (${coords.x.toFixed(2)}, ${coords.y.toFixed(2)}), total points: ${multipointPath.length}, maxPoints: ${maxPoints}`);
            }
            window.lastTapTime = isTouchEvent ? currentTime : 0;
            isSelecting = true;
            selectionType = 'multipoint';
            console.log(`Added multipoint on ${targetCanvas.id}: (${coords.x.toFixed(2)}, ${coords.y.toFixed(2)}), total points: ${multipointPath.length}, maxPoints: ${maxPoints}, pointsAdded=${pointsAdded}, inputType=${isMouseEvent ? 'mouse' : 'touch'}`);

            if (multipointPath.length >= maxPoints) {
                multipointPath = multipointPath.slice(0, maxPoints);
                console.log(`Max points (${maxPoints}) reached for ${isMouseEvent ? 'mouse' : 'touch'}, auto-closing multipoint selection on ${targetCanvas.id}: ${multipointPath.length} points`);
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
                isSelecting = false;
                isSelectionActive = true;
                selectionBounds = calculatePolygonBounds(multipointPath);
                selectedImageData = captureSelection(targetCanvas, multipointPath, 'multipoint');
                if (!selectedImageData) {
                    console.error('Failed to capture multipoint selection');
                    isSelectionActive = false;
                    multipointPath = [];
                    return;
                }
                console.log(`Auto-closed multipoint selection on ${targetCanvas.id}: ${multipointPath.length} points`);
                saveState(true);
                renderMarchingAnts();
                return;
            }

            renderMarchingAnts();
            if (isRecording) {
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
            multipointPath = multipointPath.slice(0, maxPoints);
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
            isSelecting = false;
            isSelectionActive = true;
            selectionBounds = calculatePolygonBounds(multipointPath);
            selectedImageData = captureSelection(targetCanvas, multipointPath, 'multipoint');
            if (!selectedImageData) {
                console.error('Failed to capture multipoint selection');
                isSelectionActive = false;
                multipointPath = [];
                return;
            }
            console.log(`Auto-closed multipoint selection on ${targetCanvas.id}: ${multipointPath.length} points`);
            saveState(true);
            renderMarchingAnts();
        }
        return;
    }



    touchPoints = [{
    id: validTouches[0].identifier || 'mouse0',
    x: coords.x,
    y: coords.y,
    target: targetCanvas,
    lastX: coords.x,
    lastY: coords.y,
    startTime: Date.now(),
    isMouse: isMouseEvent
}];
lastTouchPoints = [...touchPoints];

isSelecting = true;
isSelectionActive = false;
isDraggingSelection = false; // Reset for new selection

if (brushShape === 'squareSelection') {
    selectionStart = { x: coords.x, y: coords.y };
    selectionEnd = { x: coords.x, y: coords.y };
console.log('SELECTION COORDS SET:', {
raw: { x: coords.x, y: coords.y },
zoom: { level: state.zoomLevel, panX: state.panX, panY: state.panY },
expectedCanvasCoords: {
    x: (coords.x - state.panX) / state.zoomLevel,
    y: (coords.y - state.panY) / state.zoomLevel
}
});
    selectionType = 'square';
    console.log(`Started square selection at (${coords.x}, ${coords.y}) on ${targetCanvas.id}`);
} else if (brushShape === 'circleSelection') {
    selectionStart = { x: coords.x, y: coords.y };
    selectionEnd = { x: coords.x, y: coords.y };
    selectionType = 'circle';
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
    multipointPath = [{ x: coords.x, y: coords.y }];
    selectionType = 'multipoint';
    console.log(`Started multipoint selection at (${coords.x}, ${coords.y}) on ${targetCanvas.id}`);
}
renderMarchingAnts();
return;
}

// Existing drawing logic with enhanced filtering
touchPoints = validTouches
    .slice(0, 6)
    .filter(touch => {
        if (isDragging) return true;
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

if (touchPoints.length === 0) {
    console.log('startDrag aborted - No valid touch points after filtering');
    return;
}

if (!isDragging) {
// Save state before starting any operation
saveState(true); // Force save to ensure each drag gets its own undo state
isDragging = true;
hasCanvasChanged = false;
shouldSaveState = true;

// Add document-level mouse tracking for seamless dragging outside canvas
if (!e.touches) {
    document.addEventListener('mousemove', continueDragOutsideCanvas, { passive: false });
    document.addEventListener('mouseup', endDragOutsideCanvas, { passive: false });
}
}
lastTouchPoints = [...touchPoints];
console.log('Start drag - Brush:', brushShape, 'Canvas:', canvasId, 'TouchPoints:', touchPoints);

const normalBrushes = ['box', 'circle', 'rectangle', 'triangle', 'tv', 'negative'];
if (normalBrushes.includes(brushShape)) {
    const firstFinger = touchPoints[0];
    teleportFirstFinger = firstFinger.id;
    console.log('teleportFirstFinger set to:', teleportFirstFinger);
    if (isPaintMode) {
        lastX = firstFinger.x;
        lastY = firstFinger.y;
        smearPixels(firstFinger.x, firstFinger.y, canvasId);
        hasCanvasChanged = true;
        if (isRecording) {
            recordMovement('smear', {
                lastX: firstFinger.lastX,
                lastY: firstFinger.lastY,
                currentX: firstFinger.x,
                currentY: firstFinger.y,
                canvasId,
                activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
            });
        }
    } else if (isTeleportHeld) {
        teleportSourceX = firstFinger.x;
        teleportSourceY = firstFinger.y;
        teleportCanvasId = canvasId;
        teleportFirstFinger = firstFinger.id;
        console.log(`Teleport source set by first finger ${firstFinger.id} at (${teleportSourceX}, ${teleportSourceY}) on ${canvasId}`);

        teleportDestinations = [];
        touchPoints.forEach((point, index) => {
            if (point.id === firstFinger.id) return;
            if (point.x === 0 && point.y === 0) {
                console.log(`Skipping teleport destination for finger ${point.id}: invalid coordinates (0,0)`);
                return;
            }
            const destCanvasId = point.target === baseCanvas ? 'base' : point.target === paintCanvas ? 'paint' : 'sampler';
            teleportDestinations.push({
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

        teleportDestinations.forEach(dest => {
            const sourceCanvas = firstFinger.target;
            smearPixels(dest.x, dest.y, dest.canvasId, teleportSourceX, teleportSourceY, undefined, sourceCanvas);
            hasCanvasChanged = true;
            if (isRecording) {
                recordMovement('smear', {
                    lastX: dest.lastX,
                    lastY: dest.lastY,
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
        lastX = firstFinger.x;
        lastY = firstFinger.y;
        if (touchPoints.length >= 3 && !firstFinger.isMouse) {
            const thirdFinger = touchPoints[2];
            const sourceCanvas = thirdFinger.target;
            const sourceCanvasId = sourceCanvas === baseCanvas ? 'base' : sourceCanvas === paintCanvas ? 'paint' : 'sampler';
            if (thirdFinger.x === 0 && thirdFinger.y === 0) {
                console.log(`Skipping reverse teleport for finger ${thirdFinger.id}: invalid coordinates (0,0)`);
                smearPixels(firstFinger.x, firstFinger.y, canvasId);
                hasCanvasChanged = true;
            } else {
                const sourceCtx = sourceCanvas === baseCanvas ? baseCtx : sourceCanvas === paintCanvas ? paintCtx : samplerCtx;
                try {
                    const pixelData = sourceCtx.getImageData(Math.round(thirdFinger.x), Math.round(thirdFinger.y), 1, 1).data;
                    console.log(`Reverse teleport pixel at (${thirdFinger.x}, ${thirdFinger.y}) on ${sourceCanvasId}: RGBA(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3]})`);
                    smearPixels(firstFinger.x, firstFinger.y, canvasId, thirdFinger.x, thirdFinger.y, undefined, sourceCanvas);
                    hasCanvasChanged = true;
                    console.log(`Reverse teleport from (${thirdFinger.x}, ${thirdFinger.y}) on ${sourceCanvasId} to (${firstFinger.x}, ${firstFinger.y}) on ${canvasId}`);
                } catch (e) {
                    console.error(`Failed to get pixel data at (${thirdFinger.x}, ${thirdFinger.y}) on ${sourceCanvasId}:`, e);
                    smearPixels(firstFinger.x, firstFinger.y, canvasId);
                    hasCanvasChanged = true;
                }
            }
            thirdFinger.lastX = thirdFinger.x;
            thirdFinger.lastY = thirdFinger.y;
            if (isRecording) {
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
            hasCanvasChanged = true;
            if (isRecording) {
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
} else if (brushShape === 'sweeper' || brushShape === 'oilbarrel') {
const isTouchEvent = !!e.touches;
if (touchPoints[0].isMouse) {
    // Mouse input: Single anchor point with lag for sweeper, or oilbarrel drag
    brushRotation = 0;
    mouseAnchorStart = { x: touchPoints[0].x, y: touchPoints[0].y, target: touchPoints[0].target };
    if (brushShape === 'oilbarrel') {
        oilbarrelDragState = {
startX: touchPoints[0].x,  // Use raw coordinates
startY: touchPoints[0].y,  // Use raw coordinates
endX: touchPoints[0].x,
endY: touchPoints[0].y,
canvasId: canvasId,
ctx: ctx,
targetCanvas: targetCanvas
};

console.log('OILBARREL START DEBUG:', {
rawX: touchPoints[0].x,
rawY: touchPoints[0].y,
zoomLevel: canvasStates[canvasId].zoomLevel,
panX: canvasStates[canvasId].panX,
panY: canvasStates[canvasId].panY
});
        anchorPoints = [
            { x: touchPoints[0].x, y: touchPoints[0].y, target: touchPoints[0].target, lastX: touchPoints[0].x, lastY: touchPoints[0].y },
            { x: touchPoints[0].x, y: touchPoints[0].y, target: touchPoints[0].target, lastX: touchPoints[0].x, lastY: touchPoints[0].y }
        ];
        if (anchorPoints.every(p => !isNaN(p.x) && !isNaN(p.y) && (p.x !== 0 || p.y !== 0))) {
            isDraggingOilbarrel = true;
            if (oilbarrelRafId) cancelAnimationFrame(oilbarrelRafId);
            oilbarrelRafId = requestAnimationFrame(renderOilbarrelMouse);
            console.log('Started oilbarrel mouse drag rendering');
            if (isRecording) {
                // FIXED: Enhanced mouse recording with complete anchor state
                recordMovement('smear', {
                    lastX: anchorPoints[0]?.lastX || anchorPoints[0]?.x,
                    lastY: anchorPoints[0]?.lastY || anchorPoints[0]?.y,
                    currentX: anchorPoints[1]?.x,
                    currentY: anchorPoints[1]?.y,
                    canvasId,
                    brushShape,
                    anchorPoints: anchorPoints.map((p, index) => ({ 
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
            console.log('Oilbarrel mouse start skipped - Invalid or (0,0) anchor points:', anchorPoints);
        }
    } else {
        anchorPoints = [
            { x: touchPoints[0].x, y: touchPoints[0].y, target: touchPoints[0].target, lastX: touchPoints[0].x, lastY: touchPoints[0].y },
            { x: touchPoints[0].x, y: touchPoints[0].y, target: touchPoints[0].target, lastX: touchPoints[0].x, lastY: touchPoints[0].y }
        ];
        if (anchorPoints.every(p => !isNaN(p.x) && !isNaN(p.y) && (p.x !== 0 || p.y !== 0))) {
            drawSweeperLines(canvasId);
            hasCanvasChanged = true;
            if (isRecording) {
                // Record as single coordinated gesture
                recordMovement('smear', {
                    lastX: anchorPoints[0].x,
                    lastY: anchorPoints[0].y,
                    currentX: anchorPoints[1].x,
                    currentY: anchorPoints[1].y,
                    canvasId,
                    brushShape,
                    anchorPoints: anchorPoints.map(p => ({ x: p.x, y: p.y })),
                    fingerCount: 1,
                    inputType: 'mouse',
                    gestureId: Date.now(), // Unique ID for this gesture
                    activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                });
            }
        } else {
            console.log('Sweeper mouse start skipped - Invalid or (0,0) anchor points:', anchorPoints);
        }
    }
} else if (isTouchEvent && touchPoints.length >= 1 && touchPoints.length <= 5) {
    // Touch input: 1–5 fingers for dynamic multi-point lines
    anchorPoints = touchPoints.slice(0, 5).map(point => ({
        x: point.x,
        y: point.y,
        target: point.target,
        lastX: point.x,
        lastY: point.y,
        id: point.id
    }));
    if (anchorPoints.every(p => !isNaN(p.x) && !isNaN(p.y) && (p.x !== 0 || p.y !== 0))) {
        if (brushShape === 'oilbarrel') {
            oilbarrelDragState = {
                startX: anchorPoints[0].x,
                startY: anchorPoints[0].y,
                endX: anchorPoints[anchorPoints.length - 1].x,
                endY: anchorPoints[anchorPoints.length - 1].y,
                canvasId: canvasId,
                ctx: ctx,
                targetCanvas: targetCanvas
            };
            isDraggingOilbarrel = true;
            if (oilbarrelRafId) cancelAnimationFrame(oilbarrelRafId);
            oilbarrelRafId = requestAnimationFrame(renderOilbarrelMouse);
            console.log('Started oilbarrel touch drag rendering with', anchorPoints.length, 'fingers');
        } else {
            drawSweeperLines(canvasId);
            hasCanvasChanged = true;
        }
        if (isRecording) {
        // FIXED: Enhanced recording with complete anchor point data
        const gestureId = Date.now();
        recordMovement('smear', {
            lastX: anchorPoints[0]?.lastX || anchorPoints[0]?.x,
            lastY: anchorPoints[0]?.lastY || anchorPoints[0]?.y,
            currentX: anchorPoints[0]?.x,
            currentY: anchorPoints[0]?.y,
            canvasId,
            brushShape,
            anchorPoints: anchorPoints.map((p, index) => ({ 
                x: p.x, 
                y: p.y, 
                lastX: p.lastX || p.x, 
                lastY: p.lastY || p.y,
                fingerId: p.id || `finger_${index}`,
                target: p.target?.id || 'canvas'
            })),
            fingerCount: anchorPoints.length,
            inputType: 'touch',
            gestureId: gestureId,
            activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
        });
        console.log(`Recorded ${brushShape} gesture with ${anchorPoints.length} fingers, gestureId: ${gestureId}`);
    }
    } else {
        console.log('Sweeper/oilbarrel touch start skipped - Invalid or (0,0) anchor points:', anchorPoints);
    }
} else {
    console.log('Sweeper/oilbarrel touch start skipped - Insufficient or excessive touch points:', touchPoints.length);
}
} else if (brushShape === 'aestheticLines') {
console.log('🔴 AESTHETIC START:', {
    mouseAnchorStart_before: mouseAnchorStart,
    touchPoints: touchPoints.map(p => ({x: p.x, y: p.y})),
    isZooming: isZooming,
    zoomLevel: state.zoomLevel,
    panX: state.panX,
    panY: state.panY
});

mouseAnchorStart = { x: touchPoints[0].x, y: touchPoints[0].y, target: touchPoints[0].target };
anchorPoints = [
    { x: touchPoints[0].x, y: touchPoints[0].y, target: touchPoints[0].target, lastX: touchPoints[0].x, lastY: touchPoints[0].y },
    { x: touchPoints[0].x, y: touchPoints[0].y, target: touchPoints[0].target, lastX: touchPoints[0].x, lastY: touchPoints[0].y }
];

console.log('🔴 AESTHETIC AFTER SET:', {
    mouseAnchorStart: mouseAnchorStart,
    anchorPoints: anchorPoints
});

if (anchorPoints.every(p => !isNaN(p.x) && !isNaN(p.y) && (p.x !== 0 || p.y !== 0))) {
    drawAestheticLines(canvasId);
    hasCanvasChanged = true;
} else {
    console.log('AestheticLines start skipped - Invalid or (0,0) anchor points:', anchorPoints);
}
if (isRecording && hasCanvasChanged) {
    // FIXED: Record anchor points for initial touch
    recordMovement('smear', {
        lastX: touchPoints[0].x,
        lastY: touchPoints[0].y,
        currentX: touchPoints[0].x,
        currentY: touchPoints[0].y,
        canvasId,
        brushShape: 'aestheticLines',
        // FIXED: Include anchor points
        anchorPoints: anchorPoints.map((p, index) => ({
            x: p.x,
            y: p.y,
            lastX: p.lastX || p.x,
            lastY: p.lastY || p.y,
            fingerId: `aesthetic_start_${index}`,
            target: p.target?.id || 'canvas',
            index: index
        })),
        mouseAnchorStart: mouseAnchorStart ? {
            x: mouseAnchorStart.x,
            y: mouseAnchorStart.y,
            target: mouseAnchorStart.target?.id || 'canvas'
        } : undefined,
        fingerCount: anchorPoints.length,
        inputType: touchPoints[0]?.isMouse ? 'mouse' : 'touch',
        gestureId: Date.now(),
        activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
    });
}
} // FIXED STICKER MODE SECTION FOR STARTDRAG AND DRAG FUNCTIONS
// Replace the existing stickerMode sections with this code

else if (brushShape === 'stickerMode') {
const activeStamps = stampOrder.filter(slot => stickerImages[slot]);
console.log('Active stamps in order:', activeStamps);

if (isTeleportHeld && touchPoints.length >= 1) {
    // Separate original and clone fingers
    const maxStamps = activeStamps.length;
    const originalFingers = touchPoints.slice(0, maxStamps);
    const cloneFingers = touchPoints.slice(maxStamps);
    
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
            hasCanvasChanged = true;
            console.log(`Original stamp ${slot} at (${point.x}, ${point.y}) on ${canvasId} with finger ${i + 1}`);
            
            point.lastX = point.x;
            point.lastY = point.y;
            
            if (isRecording) {
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
                hasCanvasChanged = true;
                console.log(`Cross-canvas cloned stamp ${slot} from (${originalPoint.x}, ${originalPoint.y}) on ${originalCanvasId} to (${clonePoint.x}, ${clonePoint.y}) on ${cloneCanvasId} with finger ${maxStamps + i + 1}`);
            } else {
                // Same canvas clone - draw normally
                smearPixels(clonePoint.x, clonePoint.y, cloneCanvasId, undefined, undefined, slot);
                hasCanvasChanged = true;
                console.log(`Same-canvas cloned stamp ${slot} at (${clonePoint.x}, ${clonePoint.y}) on ${cloneCanvasId} with finger ${maxStamps + i + 1}`);
            }
            
            clonePoint.lastX = clonePoint.x;
            clonePoint.lastY = clonePoint.y;
            
            if (isRecording) {
                recordMovement('smear', {
                    lastX: clonePoint.lastX,
                    lastY: clonePoint.lastY,
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
    
    if (totalStampFingers < touchPoints.length) {
        const resizeFinger = touchPoints[totalStampFingers];
        if (resizeFinger) {
            const deltaY = (resizeFinger.y - resizeFinger.lastY) * 0.5;
            const newSize = Math.max(1, Math.min(700, brushSize + deltaY * 2));
            if (!isNaN(newSize)) {
                isGestureResizing = true;
                updateBrushSize(newSize);
                isGestureResizing = false;
                console.log(`Resize with finger ${totalStampFingers + 1} - New size: ${brushSize}, DeltaY: ${deltaY}`);
                if (isRecording && currentMovement) currentMovement.size = brushSize;
            }
            resizeFinger.lastX = resizeFinger.x;
            resizeFinger.lastY = resizeFinger.y;
        }
    }

    if (totalStampFingers + 1 < touchPoints.length) {
        const rotateFinger = touchPoints[totalStampFingers + 1];
        if (rotateFinger) {
            const rotateDeltaY = (rotateFinger.y - rotateFinger.lastY) * 0.005;
            brushRotation += rotateDeltaY;
            console.log(`Rotate with finger ${totalStampFingers + 2} - Rotation: ${brushRotation}, DeltaY: ${rotateDeltaY}`);
            if (isRecording && currentMovement) currentMovement.rotation = brushRotation;
            rotateFinger.lastX = rotateFinger.x;
            rotateFinger.lastY = rotateFinger.y;
        }
    }

} else {
    // Normal mode (no teleport) - unchanged
    const maxStamps = Math.min(activeStamps.length, touchPoints.length);
    for (let i = 0; i < maxStamps; i++) {
        const slot = activeStamps[i % activeStamps.length];
        const point = touchPoints[i];
        if (point.x === 0 && point.y === 0) {
            console.log(`StickerMode stamp skipped - (0,0) coordinates for finger ${i + 1}`);
            continue;
        }
        const canvasId = point.target === baseCanvas ? 'base' : point.target === paintCanvas ? 'paint' : 'sampler';
        if (stickerImages[slot]) {
            smearPixels(point.x, point.y, canvasId, undefined, undefined, slot);
            hasCanvasChanged = true;
            console.log(`Stamp ${slot} at (${point.x}, ${point.y}) on ${canvasId} with finger ${i + 1}`);
            point.lastX = point.x;
            point.lastY = point.y;
            if (isRecording) {
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
    if (stampCount < touchPoints.length) {
        const resizeFinger = touchPoints[stampCount];
        if (resizeFinger) {
            const deltaY = (resizeFinger.y - resizeFinger.lastY) * 0.5;
            const newSize = Math.max(1, Math.min(700, brushSize + deltaY * 2));
            if (!isNaN(newSize)) {
                isGestureResizing = true;
                updateBrushSize(newSize);
                isGestureResizing = false;
                console.log(`Resize with finger ${stampCount + 1} - New size: ${brushSize}, DeltaY: ${deltaY}`);
                if (isRecording && currentMovement) currentMovement.size = brushSize;
            }
            resizeFinger.lastX = resizeFinger.x;
            resizeFinger.lastY = resizeFinger.y;
        }
    }

    if (stampCount + 1 < touchPoints.length) {
        const rotateFinger = touchPoints[stampCount + 1];
        if (rotateFinger) {
            const rotateDeltaY = (rotateFinger.y - rotateFinger.lastY) * 0.005;
            brushRotation += rotateDeltaY;
            console.log(`Rotate with finger ${stampCount + 2} - Rotation: ${brushRotation}, DeltaY: ${rotateDeltaY}`);
            if (isRecording && currentMovement) currentMovement.rotation = brushRotation;
            rotateFinger.lastX = rotateFinger.x;
            rotateFinger.lastY = rotateFinger.y;
        }
    }
}
} else if (brushShape === 'melt' || brushShape === 'brokenScreen' || brushShape === 'jazzScatter') {
    const firstFinger = touchPoints[0];
    if (firstFinger) {
        if (firstFinger.x === 0 && firstFinger.y === 0) {
            console.log('Melt/brokenScreen/jazzScatter start skipped - (0,0) coordinates');
            return;
        }
        smearPixels(firstFinger.x, firstFinger.y, canvasId);
        hasCanvasChanged = true;
        lastX = firstFinger.x;
        lastY = firstFinger.y;
        firstFinger.lastX = firstFinger.x;
        firstFinger.lastY = firstFinger.y;

        let meltDirection = 1;
        if (brushShape !== 'jazzScatter' && touchPoints.length >= 2) {
            const secondFinger = touchPoints[1];
            meltDirection = secondFinger.y < firstFinger.y ? -1 : 1;
            console.log('Melt direction set to:', meltDirection === 1 ? 'down' : 'up');
            secondFinger.lastX = secondFinger.x;
            secondFinger.lastY = secondFinger.y;

            if (touchPoints.length >= 3) {
                const thirdFinger = touchPoints[2];
                const deltaY = (thirdFinger.y - thirdFinger.lastY) * 0.5;
                const newSize = Math.max(1, Math.min(700, brushSize + deltaY * 2));
                if (!isNaN(newSize)) {
                    isGestureResizing = true;
                    updateBrushSize(newSize);
                    isGestureResizing = false;
                    console.log('3rd finger resize - New size:', brushSize, 'DeltaY:', deltaY);
                    if (isRecording && currentMovement) currentMovement.size = brushSize;
                }
                thirdFinger.lastX = thirdFinger.x;
                thirdFinger.lastY = thirdFinger.y;

                if (touchPoints.length >= 4) {
                    const fourthFinger = touchPoints[3];
                    if (fourthFinger) {
                        const rotateDeltaY = (fourthFinger.y - fourthFinger.lastY) * 0.005;
                        brushRotation += rotateDeltaY;
                        console.log('Finger 4 rotate - Rotation:', brushRotation, 'DeltaY:', rotateDeltaY);
                        if (isRecording && currentMovement) currentMovement.rotation = brushRotation;
                        fourthFinger.lastX = fourthFinger.x;
                        fourthFinger.lastY = fourthFinger.y;
                    }
                }
            }
        }
        if (isRecording) {
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

function drag(e) {
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
touchPoints = validTouches
    .slice(0, 10)
    .map((touch, index) => {
        const coords = getCanvasCoordinates({ ...e, target: targetCanvas }, touch);
        if (isNaN(coords.x) || isNaN(coords.y) || !coords.valid) {
            console.error('Invalid drag coordinates:', coords, 'Touch:', touch);
            return null;
        }
        const existing = lastTouchPoints.find(tp => tp.id === (touch.identifier || `mouse${index}`)) || {};
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

if (touchPoints.length === 0) {
    console.log('No valid touch points in drag (all filtered out)');
    return;
}

console.log('Drag - Brush:', brushShape, 'Canvas:', canvasId, 'TouchPoints:', touchPoints.map(tp => ({
    id: tp.id,
    x: tp.x,
    y: tp.y,
    lastX: tp.lastX,
    lastY: tp.lastY
})));

// Apply active effects without triggering brush actions
if (isDragging) {
    const activeEffectList = [...activeEffects]
        .map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect)
        .filter(e => e);
    activeEffectList.forEach(effect => {
        toggleEffect(effect, true);
    });
}

// Zoom mode (keep clamping for pan/zoom)
// FIXED ZOOM TOOL WITHIN THE DRAG FUNCTION
// Replace your existing zoom mode section in the drag function with this:

if (isZooming) {
if (validTouches.length !== 1) {
    console.log('Zoom requires single finger or cursor, ignoring multi-touch:', validTouches.length);
    return;
}
const touch = validTouches[0];
const canvasKey = canvasId;
const state = canvasStates[canvasKey];

// REMOVED the re-locking logic that was keeping the pivot locked
console.log('Zoom drag handler: targetLocked is', state.targetLocked, 'pivot:', state.zoomPivotX, state.zoomPivotY);
if (!state.targetLocked) {
    console.log('Zoom drag skipped - No target locked');
    return;
}

const currentX = touch.clientX;
const currentY = touch.clientY;
const lastX = lastTouchPoints[0]?.clientX || currentX;
const lastY = lastTouchPoints[0]?.clientY || currentY;
const deltaY = currentY - lastY;
const zoomSpeed = 0.005;
const zoomFactor = deltaY > 0 ? 1 / (1 + zoomSpeed * Math.abs(deltaY)) : 1 + zoomSpeed * Math.abs(deltaY);
const imageWidth = originalWidths[canvasKey] || targetCanvas.width;
const imageHeight = originalHeights[canvasKey] || targetCanvas.height;
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
            // Ensure currentImageData is up to date
            if (!currentImageData[canvasKey] || currentImageData[canvasKey].width !== targetCanvas.width || currentImageData[canvasKey].height !== targetCanvas.height) {
                currentImageData[canvasKey] = ctx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
                console.log(`Updated currentImageData for ${canvasKey} before zoom redraw`);
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

        lastTouchPoints = [{
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
if (brushShape === 'squareSelection' || brushShape === 'basquiatSelection' || brushShape === 'circleSelection') {
if (isZooming) {
    console.log('Selection drag blocked - in zoom mode');
    return;
}
const now = Date.now();
if (now - lastDragTime < dragThrottleMs) return;
lastDragTime = now;

if (isSelecting && (brushShape === 'squareSelection' || brushShape === 'circleSelection')) {
    const coords = getCanvasCoordinates({ ...e, target: targetCanvas }, validTouches[0]);
    if (coords.x === 0 && coords.y === 0) {
        console.log('Selection skipped - (0,0) coordinates');
        return;
    }
    selectionEnd = { x: coords.x, y: coords.y };
    renderMarchingAnts();
} else if ((isSelectionActive || isDraggingSelection) && selectionCanvas.dataset.targetCanvasId === targetCanvas.id) {
let avgDeltaX = 0, avgDeltaY = 0, validPoints = 0;
touchPoints.forEach(point => {
    if (isPointInSelection(point.x, point.y, brushShape)) {
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

if (selectedImageData && selectionBounds) {
    if (!selectionCacheCanvas) {
        selectionCacheCanvas = document.createElement('canvas');
        selectionCacheCanvas.width = selectedImageData.width;
        selectionCacheCanvas.height = selectedImageData.height;
        selectionCacheCtx = selectionCacheCanvas.getContext('2d', { alpha: true });
        selectionCacheCtx.putImageData(selectedImageData, 0, 0);
    }

    const newX = selectionBounds.xMin + avgDeltaX;
    const newY = selectionBounds.yMin + avgDeltaY;

    // CRITICAL FIX: Restore the original canvas state before drawing selection at new position
    if (currentImageData[canvasId]) {
        ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
        ctx.putImageData(currentImageData[canvasId], 0, 0);
    }

    const pixels = [];
        const width = selectedImageData.width;
        const height = selectedImageData.height;
        const data = selectedImageData.data;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                if (data[i + 3] > 0) {
                    let canvasX = x + newX;
                    let canvasY = y + newY;
                    if (brushRotation !== 0) {
                        const relX = canvasX - (newX + width / 2);
                        const relY = canvasY - (newY + height / 2);
                        const cosRot = Math.cos(brushRotation);
                        const sinRot = Math.sin(brushRotation);
                        canvasX = newX + width / 2 + (relX * cosRot - relY * sinRot);
                        canvasY = newY + height / 2 + (relX * sinRot + relY * cosRot);
                    }
                    if (isFlipVerticalActive) {
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

        applyEffects(pixels, avgDeltaX, avgDeltaY, selectionBounds.xMin, selectionBounds.yMin, newX, newY);

        ctx.save();
        if (brushShape === 'basquiatSelection') {
            ctx.beginPath();
            multipointPath.forEach((point, index) => {
                const px = point.x + avgDeltaX;
                const py = point.y + avgDeltaY;
                if (index === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            });
            ctx.closePath();
            ctx.clip();
        } else if (brushShape === 'squareSelection') {
            ctx.beginPath();
            ctx.rect(newX, newY, width, height);
            ctx.clip();
        } else if (brushShape === 'circleSelection') {
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

    // CRITICAL FIX: Update currentImageData after drawing the selection
    currentImageData[canvasId] = ctx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
    hasCanvasChanged = true;

    selectionBounds.xMin += avgDeltaX;
        selectionBounds.xMax += avgDeltaX;
        selectionBounds.yMin += avgDeltaY;
        selectionBounds.yMax += avgDeltaY;
        selectionBounds.centroidX += avgDeltaX;
        selectionBounds.centroidY += avgDeltaY;
        if (brushShape === 'squareSelection' || brushShape === 'circleSelection') {
            selectionStart.x += avgDeltaX;
            selectionStart.y += avgDeltaY;
            selectionEnd.x += avgDeltaX;
            selectionEnd.y += avgDeltaY;
        } else {
            multipointPath = multipointPath.map(p => ({
                x: p.x + avgDeltaX,
                y: p.y + avgDeltaY
            }));
        }

        if (isRecording) {
            touchPoints.forEach(point => {
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

    touchPoints.forEach(point => {
        point.lastX = point.x;
        point.lastY = point.y;
    });
    lastTouchPoints = [...touchPoints];
    renderMarchingAnts();
}
return;
}

// Normal brushes
const normalBrushes = ['box', 'circle', 'rectangle', 'triangle', 'tv', 'negative'];
if (normalBrushes.includes(brushShape)) {
const firstFinger = touchPoints.find(tp => tp.id === teleportFirstFinger) || touchPoints[0];
if (firstFinger) {
    const firstCanvasId = firstFinger.target === baseCanvas ? 'base' : firstFinger.target === paintCanvas ? 'paint' : 'sampler';
    const ctx = firstCanvasId === 'base' ? baseCtx : firstCanvasId === 'paint' ? paintCtx : samplerCtx;
    if (isPaintMode && firstCanvasId === 'paint') {
        smearPixels(firstFinger.x, firstFinger.y, firstCanvasId);
        // Save paintCanvas strokes
        currentImageData[firstCanvasId] = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        hasCanvasChanged = true;
        lastX = firstFinger.x;
        lastY = firstFinger.y;
        firstFinger.lastX = firstFinger.x;
        firstFinger.lastY = firstFinger.y;
        if (isRecording) {
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
        hasCanvasChanged = true;
        lastX = firstFinger.x;
        lastY = firstFinger.y;
        firstFinger.lastX = firstFinger.x;
        firstFinger.lastY = firstFinger.y;
        if (isRecording) {
            recordMovement('smear', {
                lastX: firstFinger.lastX,
                lastY: firstFinger.lastY,
                currentX: firstFinger.x,
                currentY: firstFinger.y,
                canvasId: firstCanvasId,
                activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
            });
        }

            if (touchPoints.length >= 2 && isTeleportHeld && !firstFinger.isMouse) {
                if (firstFinger.id === teleportFirstFinger) {
                    teleportSourceX = firstFinger.x;
                    teleportSourceY = firstFinger.y;
                    teleportCanvasId = firstCanvasId;
                    console.log(`Teleport source updated to (${teleportSourceX}, ${teleportSourceY}) on ${teleportCanvasId}`);
                }

                teleportDestinations = teleportDestinations.filter(dest => 
                    touchPoints.some(tp => tp.id === dest.fingerId)
                );
                touchPoints.forEach(point => {
                    if (point.id !== teleportFirstFinger) {
                        const destCanvasId = point.target === baseCanvas ? 'base' : point.target === paintCanvas ? 'paint' : 'sampler';
                        let dest = teleportDestinations.find(d => d.fingerId === point.id);
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
                                isSameCanvas: destCanvasId === teleportCanvasId
                            };
                            teleportDestinations.push(dest);
                        } else {
                            dest.lastX = dest.x;
                            dest.lastY = dest.y;
                            dest.x = point.x;
                            dest.y = point.y;
                            dest.sourceOffsetX = point.x - firstFinger.x;
                            dest.sourceOffsetY = point.y - firstFinger.y;
                            dest.isSameCanvas = destCanvasId === teleportCanvasId;
                        }

                        if (teleportSourceX !== null && teleportSourceY !== null) {
                            smearPixels(dest.x, dest.y, dest.canvasId, teleportSourceX, teleportSourceY, undefined, firstFinger.target);
                            hasCanvasChanged = true;
                            if (isRecording) {
                                recordMovement('smear', {
                                    lastX: dest.lastX,
                                    lastY: dest.lastY,
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
            } else if (touchPoints.length >= 2) {
                const secondFinger = touchPoints[1];
                if (secondFinger) {
                    const deltaY = secondFinger.y - secondFinger.lastY;
                    const sizeAdjustment = deltaY * 0.3;
                    const newSize = Math.max(1, Math.min(700, brushSize + sizeAdjustment));
                    if (newSize !== brushSize) {
                        isGestureResizing = true;
                        updateBrushSize(newSize);
                        isGestureResizing = false;
                        if (isRecording && currentMovement && !isZooming && brushShape !== 'squareSelection' && brushShape !== 'basquiatSelection') {
                            const timestamp = performance.now() - currentMovement.startTime;
                            recordMovement('size', {
                                size: newSize,
                                fingerId: secondFinger.id,
                                timestamp: timestamp,
                                fingerRole: 'sizeAdjust'
                            });
                            currentMovement.lastSize = newSize;
                        }
                    }
                    secondFinger.lastX = secondFinger.x;
                    secondFinger.lastY = secondFinger.y;
                }

                if (touchPoints.length >= 3) {
                    if (touchPoints.length >= 4) {
                        const fourthFinger = touchPoints[3];
                        if (fourthFinger) {
                            const rotateDeltaY = (fourthFinger.y - fourthFinger.lastY) * 0.005;
                            brushRotation += rotateDeltaY;
                            isIntentionalRotation = true;
                            fourthFinger.lastX = fourthFinger.x;
                            fourthFinger.lastY = fourthFinger.y;
                        }
                    }
                }
                if (isRecording && !isZooming && brushShape !== 'squareSelection' && brushShape !== 'basquiatSelection') {
                    const firstFinger = touchPoints.find(tp => tp.id === teleportFirstFinger) || touchPoints[0];
                    if (firstFinger && (firstFinger.x !== firstFinger.lastX || firstFinger.y !== firstFinger.lastY)) {
                        const timestamp = performance.now() - currentMovement.startTime;
                        recordMovement('smear', {
                            lastX: firstFinger.lastX,
                            lastY: firstFinger.lastY,
                            currentX: firstFinger.x,
                            currentY: firstFinger.y,
                            fingerId: firstFinger.id,
                            canvasId: firstCanvasId,
                            size: brushSize,
                            rotation: brushRotation,
                            brushShape: brushShape,
                            timestamp: timestamp,
                            fingerRole: 'primary',
                            activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                        });
                    }
                }
            }
        }
    }
} else if (brushShape === 'sweeper' || brushShape === 'oilbarrel') {
    const isTouchEvent = !!e.touches;
    if (touchPoints[0].isMouse && mouseAnchorStart) {
        // Mouse input: Single anchor with lag for sweeper, or oilbarrel drag
        const cursorX = touchPoints[0].x;
        const cursorY = touchPoints[0].y;
        if (cursorX === 0 && cursorY === 0) {
            console.log('Sweeper/oilbarrel mouse drag skipped - (0,0) coordinates');
            return;
        }
        if (brushShape === 'oilbarrel') {
oilbarrelDragState.endX = cursorX;
oilbarrelDragState.endY = cursorY;

console.log('OILBARREL DRAG DEBUG:', {
original: { x: cursorX, y: cursorY },
stored: { x: oilbarrelDragState.endX, y: oilbarrelDragState.endY },
zoomLevel: canvasStates[canvasId].zoomLevel
});

touchPoints[0].lastX = cursorX;
touchPoints[0].lastY = cursorY;

console.log('OILBARREL DRAG DEBUG:', {
    original: { x: cursorX, y: cursorY },
    transformed: { x: oilbarrelDragState.endX, y: oilbarrelDragState.endY },
    dragState: { startX: oilbarrelDragState.startX, startY: oilbarrelDragState.startY },
    zoomLevel: state?.zoomLevel,
    pan: { x: state?.panX, y: state?.panY }
});

touchPoints[0].lastX = cursorX;
touchPoints[0].lastY = cursorY;
            anchorPoints = [
                { x: oilbarrelDragState.startX, y: oilbarrelDragState.startY, target: targetCanvas },
                { x: oilbarrelDragState.endX, y: oilbarrelDragState.endY, target: targetCanvas, lastX: cursorX, lastY: cursorY }
            ];
            if (anchorPoints.every(p => !isNaN(p.x) && !isNaN(p.y))) {
                hasCanvasChanged = true;
                if (isRecording) {
                    recordMovement('smear', {
                        lastX: oilbarrelDragState.startX,
                        lastY: oilbarrelDragState.startY,
                        currentX: oilbarrelDragState.endX,
                        currentY: oilbarrelDragState.endY,
                        fingerId: touchPoints[0].id,
                        canvasId,
                        brushShape,
                        anchorPoints: anchorPoints.map(p => ({ x: p.x, y: p.y })),
                        activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                    });
                }
            } else {
                console.log('Oilbarrel mouse drag skipped - Invalid anchor points:', anchorPoints);
            }
        } else {
            const firstAnchor = anchorPoints[0] || { x: cursorX, y: cursorY, target: targetCanvas };
            const dx = cursorX - firstAnchor.x;
            const dy = cursorY - firstAnchor.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const lagSpeed = 0.1 + Math.min(distance / 200, 0.4);
            firstAnchor.x += dx * lagSpeed;
            firstAnchor.y += dy * lagSpeed;
            anchorPoints = [
                firstAnchor,
                { x: cursorX, y: cursorY, target: targetCanvas, lastX: cursorX, lastY: cursorY }
            ];
            if (anchorPoints.every(p => !isNaN(p.x) && !isNaN(p.y))) {
                drawSweeperLines(canvasId);
                hasCanvasChanged = true;
                if (isRecording) {
                    recordMovement('smear', {
                        lastX: firstAnchor.x,
                        lastY: firstAnchor.y,
                        currentX: cursorX,
                        currentY: cursorY,
                        fingerId: touchPoints[0].id,
                        canvasId,
                        brushShape,
                        anchorPoints: anchorPoints.map(p => ({ x: p.x, y: p.y })),
                        activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                    });
                }
            } else {
                console.log('Sweeper mouse drag skipped - Invalid anchor points:', anchorPoints);
            }
        }
    } else if (isTouchEvent && touchPoints.length >= 1 && touchPoints.length <= 5) {
        // Touch input: 1–5 fingers for dynamic multi-point lines
        anchorPoints = touchPoints.slice(0, 5).map(point => ({
            x: point.x,
            y: point.y,
            target: point.target,
            lastX: point.lastX || point.x,
            lastY: point.lastY || point.y,
            id: point.id
        }));
        if (anchorPoints.every(p => !isNaN(p.x) && !isNaN(p.y) && (p.x !== 0 || p.y !== 0))) {
            if (brushShape === 'oilbarrel') {
                oilbarrelDragState.startX = anchorPoints[0].x;
                oilbarrelDragState.startY = anchorPoints[0].y;
                oilbarrelDragState.endX = anchorPoints[anchorPoints.length - 1].x;
                oilbarrelDragState.endY = anchorPoints[anchorPoints.length - 1].y;
                hasCanvasChanged = true;
            } else {
                drawSweeperLines(canvasId);
                hasCanvasChanged = true;
            }
            if (isRecording) {
                anchorPoints.forEach((point, i) => {
                    const nextPoint = anchorPoints[i + 1];
console.log('RECORDING DEBUG - anchorPoints:', anchorPoints);  
console.log('RECORDING DEBUG - mapped:', anchorPoints.map(p => ({ x: p.x, y: p.y })));
                    recordMovement('smear', {
                        lastX: point.lastX,
                        lastY: point.lastY,
                        currentX: point.x,
                        currentY: point.y,
                        nextX: nextPoint ? nextPoint.x : undefined,
                        nextY: nextPoint ? nextPoint.y : undefined,
                        fingerId: point.id,
                        canvasId,
                        brushShape,
                        anchorPoints: anchorPoints.map(p => ({ x: p.x, y: p.y })),
                        activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                    });
                });
            }
        } else {
            console.log('Sweeper/oilbarrel touch drag skipped - Invalid or (0,0) anchor points:', anchorPoints);
        }
    } else {
        console.log('Sweeper/oilbarrel touch drag skipped - Insufficient or excessive touch points:', touchPoints.length);
        return;
    }
    touchPoints.forEach(point => {
        point.lastX = point.x;
        point.lastY = point.y;
    });
    lastTouchPoints = [...touchPoints];
} else if (brushShape === 'aestheticLines') {
console.log('🟡 AESTHETIC DRAG:', {
    mouseAnchorStart: mouseAnchorStart,
    cursorX: touchPoints[0]?.x,
    cursorY: touchPoints[0]?.y,
    isZooming: isZooming,
    canvasId: canvasId
});
const state = canvasStates[canvasId];
if (state && state.zoomLevel !== 1) {
    // Transform anchor points to canvas space
    anchorPoints = anchorPoints.map(point => ({
        ...point,
        x: (point.x - state.panX) / state.zoomLevel,
        y: (point.y - state.panY) / state.zoomLevel
    }));
    
    // Also transform mouseAnchorStart
    mouseAnchorStart = {
        ...mouseAnchorStart,
        x: (mouseAnchorStart.x - state.panX) / state.zoomLevel,
        y: (mouseAnchorStart.y - state.panY) / state.zoomLevel
    };
}

drawAestheticLines(canvasId);
hasCanvasChanged = true;
if (isRecording) {
    // FIXED: Record anchor points like sweeper/oilbarrel do
    recordMovement('smear', {
        lastX: mouseAnchorStart.x,
        lastY: mouseAnchorStart.y,
        currentX: cursorX,
        currentY: cursorY,
        fingerId: touchPoints[0].id,
        canvasId,
        brushShape: 'aestheticLines',
        // FIXED: Include anchor points in recording
        anchorPoints: anchorPoints.map((p, index) => ({
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
            x: mouseAnchorStart.x,
            y: mouseAnchorStart.y,
            target: mouseAnchorStart.target?.id || 'canvas'
        },
        fingerCount: anchorPoints.length,
        inputType: touchPoints[0]?.isMouse ? 'mouse' : 'touch',
        gestureId: Date.now(),
        activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
    });
}
} else if (brushShape === 'stickerMode') {
    const activeStamps = stampOrder.filter(slot => stickerImages[slot]);
    console.log('Active stamps in order:', activeStamps);

    if (isTeleportHeld && touchPoints.length >= 2) {
        const firstFinger = touchPoints.find(tp => tp.id === teleportFirstFinger) || touchPoints[0];
        const sourceCanvasId = firstFinger.target === baseCanvas ? 'base' : firstFinger.target === paintCanvas ? 'paint' : 'sampler';
        if (firstFinger.id === teleportFirstFinger) {
            teleportSourceX = firstFinger.x;
            teleportSourceY = firstFinger.y;
            teleportCanvasId = sourceCanvasId;
        }
        const stampCount = Math.min(activeStamps.length, touchPoints.length);
        for (let i = 0; i < stampCount; i++) {
            const slot = activeStamps[i];
            const point = touchPoints[i];
            if (point && point.target === firstFinger.target) {
                if (point.x === 0 && point.y === 0) {
                    console.log('StickerMode stamp skipped - (0,0) coordinates for finger:', i + 1);
                    continue;
                }
                smearPixels(point.x, point.y, sourceCanvasId, undefined, undefined, slot);
                hasCanvasChanged = true;
                console.log(`Original stamp ${slot} at (${point.x}, ${point.y}) on ${sourceCanvasId} with finger ${i + 1}`);
                point.lastX = point.x;
                point.lastY = point.y;
                if (isRecording) {
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
        const maxClones = Math.min(stampCount, touchPoints.length - cloneStartIndex);
        for (let i = 0; i < maxClones; i++) {
            const clonePoint = touchPoints[cloneStartIndex + i];
            const sourcePoint = touchPoints[i];
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
                    hasCanvasChanged = true;
                    console.log(`Cloned stamp ${cloneStampSlot} from (${sourceX}, ${sourceY}) on ${sourceCanvasId} to (${clonePoint.x}, ${clonePoint.y}) on ${destCanvasId} with finger ${cloneStartIndex + i + 1}`);
                    clonePoint.lastX = clonePoint.x;
                    clonePoint.lastY = clonePoint.y;
                    if (isRecording) {
                        recordMovement('smear', {
                            lastX: clonePoint.lastX,
                            lastY: clonePoint.lastY,
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
        if (cloneResizeIndex < touchPoints.length) {
            const cloneResizeFinger = touchPoints[cloneResizeIndex];
            if (cloneResizeFinger && cloneResizeFinger.target !== firstFinger.target) {
                const deltaY = (cloneResizeFinger.y - cloneResizeFinger.lastY) * 0.5;
                const newSize = Math.max(1, Math.min(700, cloneBrushSize + deltaY * 2));
                cloneBrushSize = newSize;
                cloneResizeFinger.lastX = cloneResizeFinger.x;
                cloneResizeFinger.lastY = cloneResizeFinger.y;
            }
        }
        const cloneRotateIndex = cloneResizeIndex + 1;
        if (cloneRotateIndex < touchPoints.length) {
            const cloneRotateFinger = touchPoints[cloneRotateIndex];
            if (cloneRotateFinger && cloneRotateFinger.target !== firstFinger.target) {
                const rotateDeltaY = (cloneRotateFinger.y - cloneRotateFinger.lastY) * 0.005;
                cloneBrushRotation += rotateDeltaY;
                cloneRotateFinger.lastX = cloneRotateFinger.x;
                cloneRotateFinger.lastY = cloneRotateFinger.y;
            }
        }
    } else {
        for (let i = 0; i < activeStamps.length && i < touchPoints.length; i++) {
            const slot = activeStamps[i];
            const point = touchPoints[i];
            if (point) {
                if (point.x === 0 && point.y === 0) {
                    console.log('StickerMode stamp skipped - (0,0) coordinates for finger:', i + 1);
                    continue;
                }
                smearPixels(point.x, point.y, canvasId, undefined, undefined, slot);
                hasCanvasChanged = true;
                console.log(`Stamp ${slot} assigned to finger ${i + 1} at (${point.x}, ${point.y})`);
                point.lastX = point.x;
                point.lastY = point.y;
                if (isRecording) {
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
        if (stampCount < touchPoints.length) {
            const resizeFinger = touchPoints[stampCount];
            if (resizeFinger) {
                const deltaY = (resizeFinger.y - resizeFinger.lastY) * 0.5;
                const newSize = Math.max(1, Math.min(700, brushSize + deltaY * 2));
                isGestureResizing = true;
                updateBrushSize(newSize);
                isGestureResizing = false;
                resizeFinger.lastX = resizeFinger.x;
                resizeFinger.lastY = resizeFinger.y;
            }
        }
        if (stampCount + 1 < touchPoints.length) {
            const rotateFinger = touchPoints[stampCount + 1];
            if (rotateFinger) {
                const rotateDeltaY = (rotateFinger.y - rotateFinger.lastY) * 0.005;
                brushRotation += rotateDeltaY;
                rotateFinger.lastX = rotateFinger.x;
                rotateFinger.lastY = rotateFinger.y;
            }
        }
    }
} else if (brushShape === 'melt' || brushShape === 'brokenScreen' || brushShape === 'jazzScatter') {
    const firstFinger = touchPoints[0];
    if (firstFinger) {
        if (firstFinger.x === 0 && firstFinger.y === 0) {
            console.log('Melt/brokenScreen/jazzScatter drag skipped - (0,0) coordinates');
            return;
        }
        smearPixels(firstFinger.x, firstFinger.y, canvasId);
        hasCanvasChanged = true;
        lastX = firstFinger.x;
        lastY = firstFinger.y;
        firstFinger.lastX = firstFinger.x;
        firstFinger.lastY = firstFinger.y;

        let meltDirection = 1;
        if (brushShape !== 'jazzScatter' && touchPoints.length >= 2) {
            const secondFinger = touchPoints[1];
            meltDirection = secondFinger.y < firstFinger.y ? -1 : 1;
            secondFinger.lastX = secondFinger.x;
            secondFinger.lastY = secondFinger.y;

            if (touchPoints.length >= 3) {
                const thirdFinger = touchPoints[2];
                const deltaY = (thirdFinger.y - thirdFinger.lastY) * 0.5;
                const newSize = Math.max(1, Math.min(700, brushSize + deltaY * 2));
                isGestureResizing = true;
                updateBrushSize(newSize);
                isGestureResizing = false;
                thirdFinger.lastX = thirdFinger.x;
                thirdFinger.lastY = thirdFinger.y;

                if (touchPoints.length >= 4) {
                    const fourthFinger = touchPoints[3];
                    if (fourthFinger) {
                        const rotateDeltaY = (fourthFinger.y - fourthFinger.lastY) * 0.005;
                        brushRotation += rotateDeltaY;
                        fourthFinger.lastX = fourthFinger.x;
                        fourthFinger.lastY = fourthFinger.y;
                    }
                }
            }
        }
        if (isRecording && !isZooming && brushShape !== 'squareSelection' && brushShape !== 'basquiatSelection') {
            if (firstFinger && (firstFinger.x !== firstFinger.lastX || firstFinger.y !== firstFinger.lastY)) {
                recordMovement('smear', {
                    lastX: firstFinger.lastX,
                    lastY: firstFinger.lastY,
                    currentX: firstFinger.x,
                    currentY: firstFinger.y,
                    fingerId: firstFinger.id,
                    canvasId: canvasId,
                    size: brushSize,
                    rotation: brushRotation,
                    brushShape: brushShape,
                    timestamp: performance.now() - currentMovement.startTime,
                    fingerRole: 'primary',
                    activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                });
            }
            if (touchPoints.length >= 2) {
                const secondFinger = touchPoints[1];
                if (secondFinger && brushSize !== currentMovement.lastSize) {
                    recordMovement('size', {
                        size: brushSize,
                        fingerId: secondFinger.id,
                        timestamp: performance.now() - currentMovement.startTime
                    });
                }
            }
        }
    }
}

lastTouchPoints = [...touchPoints];
}




function endDrag(e) {
console.log('🟢 ENDDRAG STATE BEFORE CLEAR:', {
brushShape: brushShape,
mouseAnchorStart: mouseAnchorStart,
anchorPoints: anchorPoints,
isZooming: isZooming
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
if (touchPoints.length > 0) {
    targetCanvas = touchPoints[0].target;
    activeCanvasKey = targetCanvas === baseCanvas ? 'base' : targetCanvas === paintCanvas ? 'paint' : 'sampler';
}
const canvasId = activeCanvasKey;
const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : canvasId === 'sampler' ? samplerCtx : null;

if (!ctx) {
    console.error('No context for canvas:', canvasId);
    return;
}

console.log(`endDrag: Starting for canvas=${canvasId}, isZooming=${isZooming}, brushShape=${brushShape}, zoomLevel=${canvasStates[canvasId]?.zoomLevel}, targetLocked=${canvasStates[canvasId]?.targetLocked}, touchPoints=${JSON.stringify(touchPoints.map(tp => ({id: tp.id, x: tp.x, y: tp.y})))}`);

// Clear canvas backup cache when drag ends
if (brushShape === 'sweeper' || brushShape === 'oilbarrel') {
window.canvasBackupsCache = null;
window.lastBackupCanvasId = null;
}

if (isZooming) {
const canvasKey = canvasId;
const state = canvasStates[canvasKey];
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
const lastX = lastTouchPoints[0]?.clientX || state.zoomPivotX;
const lastY = lastTouchPoints[0]?.clientY || state.zoomPivotY;
const deltaY = currentY - lastY;

// Ignore small deltaY to prevent snapping
const deltaYThreshold = 2; // Pixels
if (Math.abs(deltaY) < deltaYThreshold) {
    console.log(`Ignored small deltaY=${deltaY} for ${canvasKey} to prevent snapping`);
    return;
}

const zoomSpeed = 0.02;
const zoomFactor = deltaY > 0 ? 1 / (1 + zoomSpeed * Math.abs(deltaY)) : 1 + zoomSpeed * Math.abs(deltaY);
const imageWidth = originalWidths[canvasKey] || targetCanvas.width;
const imageHeight = originalHeights[canvasKey] || targetCanvas.height;
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
lastTouchPoints = [{
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
if (isZooming && canvasId) {
    const state = canvasStates[canvasId];
    if (state && (state.zoomLevel > 1.1 || state.panX !== 0 || state.panY !== 0)) {
        console.log(`Painting while zoomed - ensuring proper state management for ${canvasId}`);
        // Don't reset zoom here - let the user control it
    }
}

if (canvasId === 'paint' && currentImageData.paint) {
    paintCtx.putImageData(currentImageData.paint, 0, 0);
    console.log('Refreshed paintCanvas with currentImageData to clear temporary brush frames');
}

if (brushShape !== 'squareSelection' && brushShape !== 'basquiatSelection' && brushShape !== 'circleSelection') {
    selectionCacheCanvas = null;
    selectionCacheCtx = null;
    selectedImageData = null;
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

if (isDragging) {
console.log('endDrag: Resetting isDragging to false');

// SIMPLE FIX: Don't reset isDragging when canvas is zoomed and we're painting
const state = canvasStates[canvasId];
const isZoomedPainting = state && state.zoomLevel > 1.1 && !isZooming;

if (isZoomedPainting) {
    console.log(`KEEPING isDragging=true for zoomed painting on ${canvasId}`);
    // Don't reset isDragging - let it persist for next stroke
    shouldSaveState = true;
} else {
    // Normal case - reset isDragging
    isDragging = false;
    shouldSaveState = true;
    console.log('isDragging reset complete, shouldSaveState=true');
}
}

if (isDraggingOilbarrel && brushShape === 'oilbarrel') {
if (oilbarrelRafId) {
    cancelAnimationFrame(oilbarrelRafId);
    oilbarrelRafId = null;
}
isDraggingOilbarrel = false;  // ADD THIS
oilbarrelDragState = null;     // AND THIS
console.log('OILBARREL CLEANUP COMPLETE');
}

const canvasContainer = document.getElementById('canvasContainer');
canvasContainer.style.touchAction = 'pan-x';
document.body.style.touchAction = 'pan-y';

if (isZooming) {
console.log('endDrag: Skipping selection finalization - in zoom mode');
// Don't finalize any selections while zooming
} else if ((isSelecting || typeof isDraggingSelection !== 'undefined' && isDraggingSelection) && (brushShape === 'squareSelection' || brushShape === 'circleSelection') && selectionStart && selectionEnd) {        
isSelecting = false;
isSelectionActive = true;
selectionBounds = {
    xMin: Math.min(selectionStart.x, selectionEnd.x),
    xMax: Math.max(selectionStart.x, selectionEnd.x),
    yMin: Math.min(selectionStart.y, selectionEnd.y),
    yMax: Math.max(selectionStart.y, selectionEnd.y)
};
selectedImageData = captureSelection(targetCanvas, selectionBounds, brushShape === 'squareSelection' ? 'square' : 'circle');
if (!selectedImageData) {
    console.error(`Failed to capture ${brushShape} selection`);
    isSelectionActive = false;
    selectionStart = null;
    selectionEnd = null;
    return;
}
if (selectionCanvas) {
    selectionCanvas.style.display = 'block';
    selectionCanvas.style.visibility = 'visible';
    syncSelectionCanvasPosition(targetCanvas);
}
console.log(`Finalized ${brushShape} selection on ${targetCanvas.id}: bounds=${JSON.stringify(selectionBounds)}, imageData=${selectedImageData.width}x${selectedImageData.height}`);
renderMarchingAnts();

// CRITICAL: Immediately save state after selection creation/drag
const targetCanvasId = targetCanvas === baseCanvas ? 'base' : targetCanvas === paintCanvas ? 'paint' : 'sampler';
saveState(true, targetCanvasId);
console.log(`Saved state after ${brushShape} selection drag on ${targetCanvasId}`);
}

// Handle basquiat selection (uses multipointPath instead of selectionStart/selectionEnd)
// Only finalize if we're dragging an existing selection, NOT if we're still adding points
if ((typeof isDraggingSelection !== 'undefined' && isDraggingSelection) && brushShape === 'basquiatSelection' && multipointPath && multipointPath.length >= 3 && isSelectionActive) {
isSelecting = false;
isSelectionActive = true;

// Calculate bounds from multipointPath
const bounds = calculatePolygonBounds(multipointPath);
selectionBounds = {
    xMin: bounds.xMin,
    xMax: bounds.xMax,
    yMin: bounds.yMin,
    yMax: bounds.yMax,
    path: multipointPath // Store the path for basquiat
};

selectedImageData = captureSelection(targetCanvas, multipointPath, 'multipoint');
if (!selectedImageData) {
    console.error(`Failed to capture basquiatSelection`);
    isSelectionActive = false;
    multipointPath = [];
    return;
}
if (selectionCanvas) {
    selectionCanvas.style.display = 'block';
    selectionCanvas.style.visibility = 'visible';
    syncSelectionCanvasPosition(targetCanvas);
}
console.log(`Finalized basquiatSelection on ${targetCanvas.id}: bounds=${JSON.stringify(selectionBounds)}, path points=${multipointPath.length}, imageData=${selectedImageData.width}x${selectedImageData.height}`);
renderMarchingAnts();

// CRITICAL: Immediately save state after basquiat selection creation/drag
const targetCanvasId = targetCanvas === baseCanvas ? 'base' : targetCanvas === paintCanvas ? 'paint' : 'sampler';
saveState(true, targetCanvasId);
console.log(`Saved state after basquiatSelection drag on ${targetCanvasId}`);
}



// Don't reset brush size - let it persist between operations
sizeValue.textContent = brushSize;


anchorPoints = [];
smearAnchor = null;
teleportChain = [];
touchPoints = [];
lastTouchPoints = [];
teleportSourceX = null;
teleportSourceY = null;
teleportCanvasId = null;
teleportDestinations = [];
crossTeleportSourceCanvas = null;
crossTeleportSourceX = null;
crossTeleportSourceY = null;
lastX = undefined;
lastY = undefined;
vhsNoiseLevel = 0;

// Update currentImageData with unzoomed data
const baseState = canvasStates['base'];
if (canvasId && !(brushShape === 'squareSelection' || brushShape === 'basquiatSelection' || brushShape === 'circleSelection')) {
const canvas = canvasId === 'base' ? baseCanvas : canvasId === 'paint' ? paintCanvas : samplerCanvas;
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const canvasState = canvasStates[canvasId];

if (ctx && canvasState && currentImageData[canvasId]) {
    // Update the offscreen canvas with the new content
    if (!canvasState.offscreenCanvas || canvasState.offscreenCanvas.width !== canvas.width || canvasState.offscreenCanvas.height !== canvas.height) {
        canvasState.offscreenCanvas = document.createElement('canvas');
        canvasState.offscreenCanvas.width = canvas.width;
        canvasState.offscreenCanvas.height = canvas.height;
    }
    const offscreenCtx = canvasState.offscreenCanvas.getContext('2d', { alpha: true });
    offscreenCtx.putImageData(currentImageData[canvasId], 0, 0);
    
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

console.log(`endDrag: Completed for canvas=${canvasId}, isZooming=${isZooming}, brushShape=${brushShape}, zoomLevel=${canvasStates[canvasId]?.zoomLevel}, targetLocked=${canvasStates[canvasId]?.targetLocked}`);
console.log('FINAL: targetLocked for', canvasId, '=', canvasStates[canvasId]?.targetLocked);
}
console.log('endDrag complete - zoom states:', {
base: { locked: canvasStates.base.targetLocked, zoom: canvasStates.base.zoomLevel },
paint: { locked: canvasStates.paint.targetLocked, zoom: canvasStates.paint.zoomLevel },
sampler: { locked: canvasStates.sampler.targetLocked, zoom: canvasStates.sampler.zoomLevel }
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

const state = canvasStates[canvasId];
console.log('CAPTURE SELECTION DEBUG:', {
  type: type,
  selectionStart: selectionStart,
  selectionEnd: selectionEnd,
  zoom: { level: state.zoomLevel, panX: state.panX, panY: state.panY },
  bounds: boundsOrPath
});

if (type === 'square' || type === 'circle') {
xMin = Math.min(selectionStart.x, selectionEnd.x);
xMax = Math.max(selectionStart.x, selectionEnd.x);
yMin = Math.min(selectionStart.y, selectionEnd.y);
yMax = Math.max(selectionStart.y, selectionEnd.y);
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
selectionBounds = { xMin, xMax, yMin, yMax, centroidX, centroidY, path: type === 'multipoint' ? boundsOrPath : null };
console.log(`Captured ${type} selection on ${canvasId}: bounds=${xMin},${yMin},${xMax},${yMax}, size=${width}x${height}, centroid=(${centroidX}, ${centroidY})`);
return finalData;
} catch (e) {
console.error(`Failed to capture ${type} selection on ${canvasId}:`, e);
return null;
}
}

function isPointInSelection(x, y, brushShape) {
if (!selectionBounds || !isSelectionActive) return false;

if (brushShape === 'squareSelection') {
// Check if point is inside rectangular bounds
return x >= selectionBounds.xMin && x <= selectionBounds.xMax &&
       y >= selectionBounds.yMin && y <= selectionBounds.yMax;
} else if (brushShape === 'circleSelection') {
// Check if point is inside ellipse
const centerX = (selectionBounds.xMin + selectionBounds.xMax) / 2;
const centerY = (selectionBounds.yMin + selectionBounds.yMax) / 2;
const radiusX = (selectionBounds.xMax - selectionBounds.xMin) / 2;
const radiusY = (selectionBounds.yMax - selectionBounds.yMin) / 2;
const normalizedX = (x - centerX) / radiusX;
const normalizedY = (y - centerY) / radiusY;
return (normalizedX * normalizedX + normalizedY * normalizedY) <= 1;
} else if (brushShape === 'basquiatSelection') {
// Check if point is inside polygon using ray-casting algorithm
let inside = false;
const points = multipointPath;
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
if (!isZooming) return;
e.preventDefault();
const targetCanvas = e.target === baseCanvas ? baseCanvas : e.target === paintCanvas ? paintCanvas : e.target === samplerCanvas ? samplerCanvas : null;
if (!targetCanvas) {
    console.log('Wheel zoom skipped - Invalid target:', { target: e.target });
    return;
}
const canvasKey = targetCanvas === baseCanvas ? 'base' : targetCanvas === paintCanvas ? 'paint' : 'sampler';
const state = canvasStates[canvasKey];
const ctx = targetCanvas.getContext('2d');
const zoomSpeed = 0.01;
const zoomFactor = e.deltaY > 0 ? 1 / (1 + zoomSpeed * Math.abs(e.deltaY)) : 1 + zoomSpeed * Math.abs(e.deltaY);
const imageWidth = originalWidths[canvasKey] || targetCanvas.width;
const imageHeight = originalHeights[canvasKey] || targetCanvas.height;
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
if (!isZooming) return;

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
if (!isZooming) return;

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
    // Keep isZooming = true so tool stays on
    return;
}
}

function performZoom(e) {
const targetCanvas = e.target;
if (!targetCanvas || (!targetCanvas === baseCanvas && !targetCanvas === paintCanvas && !targetCanvas === samplerCanvas)) return;

const canvasKey = targetCanvas === baseCanvas ? 'base' : targetCanvas === paintCanvas ? 'paint' : 'sampler';
const state = canvasStates[canvasKey];
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
const totalPoints = smearData.anchorPoints.length;
const pointsToShow = Math.max(2, Math.floor(progress * totalPoints));

// Set anchorPoints to only the progressive portion
anchorPoints = smearData.anchorPoints.slice(0, pointsToShow);
lastTouchPoints = smearData.anchorPoints.slice(0, pointsToShow).map(p => ({x: p.lastX, y: p.lastY}));

// Draw with limited anchor points
drawSweeperLines(smearData.canvasId);

if (progress < 1.0) {
    requestAnimationFrame(() => animateSweeperPlayback(smearData, startTime, duration));
}
}

function drawSweeperLines(canvasId) {
anchorPoints.slice(0, 3).forEach((point, i) => {
    console.log(`  Point ${i}: x=${point.x}, y=${point.y}`);
});

const targetCtx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
const targetCanvas = canvasId === 'base' ? baseCanvas : canvasId === 'paint' ? paintCanvas : samplerCanvas;
const state = canvasStates[canvasId];
console.log(`Sweeper on ${canvasId} - Canvas size: ${targetCtx.canvas.width}x${targetCtx.canvas.height}`);

// Get zoom parameters
const zoomLevel = state.zoomLevel || 1;
const panX = state.panX || 0;
const panY = state.panY || 0;

if (anchorPoints.length < 2) {
    console.log("Need at least 2 anchor points for sweeper line");
    if (anchorPoints.length === 1) smearPixels(anchorPoints[0].x, anchorPoints[0].y, canvasId);
    return;
}

// Transform anchor points from screen space to canvas space if zoomed
const transformedAnchorPoints = anchorPoints.map(point => {
    if (zoomLevel !== 1) {
        return {
            ...point,
            x: (point.x - panX) / zoomLevel,
            y: (point.y - panY) / zoomLevel
        };
    }
    return point;
});

// Transform lastTouchPoints as well
const transformedLastTouchPoints = lastTouchPoints.map(point => {
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
        const state = canvasStates[key];
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
    if (currentImageData[canvasId]) {
        offscreenCtx.putImageData(currentImageData[canvasId], 0, 0);
    }
}
const offscreenCtx = state.offscreenCanvas.getContext('2d', { alpha: true });

// Calculate bounds using ORIGINAL brush size (no scaling needed in canvas space)
const width = Math.max(1, brushSize);
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
            currentImageData[key] = canvasBackups[key];
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

currentImageData[canvasId] = offscreenCtx.getImageData(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);

console.log(`DISPLAY DEBUG: isDragging=${isDragging}, about to render to visible canvas`);

// Restore non-target canvases
Object.keys(canvasBackups).forEach(key => {
    if (canvasBackups[key]) {
        const restoreCtx = key === 'base' ? baseCtx : key === 'paint' ? paintCtx : samplerCtx;
        restoreCtx.putImageData(canvasBackups[key], 0, 0);
        currentImageData[key] = canvasBackups[key];
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

hasCanvasChanged = true;

if (isRecording) {
    // Record with ORIGINAL anchor points (not transformed)
    recordMovement('smear', {
        lastX: lastTouchPoints[0]?.x || anchorPoints[0]?.x,
        lastY: lastTouchPoints[0]?.y || anchorPoints[0]?.y,
        currentX: anchorPoints[0]?.x,
        currentY: anchorPoints[0]?.y,
        canvasId,
        brushShape,
        anchorPoints: anchorPoints.map((p, index) => ({
            x: p.x,
            y: p.y,
            lastX: lastTouchPoints[index]?.x || p.x,
            lastY: lastTouchPoints[index]?.y || p.y,
            fingerId: p.id || p.fingerId || `anchor_${index}`,
            target: p.target?.id || 'canvas',
            index: index
        })),
        mouseAnchorStart: mouseAnchorStart ? {
            x: mouseAnchorStart.x,
            y: mouseAnchorStart.y,
            target: mouseAnchorStart.target?.id || 'canvas'
        } : undefined,
        inputType: touchPoints[0]?.isMouse ? 'mouse' : 'touch',
        fingerCount: anchorPoints.length,
        activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
    });
    console.log(`Recorded complete sweeper gesture with ${anchorPoints.length} anchor points`);
}

console.log('SweeperLines drawn - Pixels processed, Canvas:', canvasId, 'Bounds:', { xMin, xMax, yMin, yMax });
console.log("🔵 SWEEPER COMPLETED - Drew on canvas:", canvasId);
}


function smearLine(canvasId, prevStartX, prevStartY, prevEndX, prevEndY, startX, startY, endX, endY, sourceImageData, destImageData, xMin, yMin, xMax, yMax) {
const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
const canvas = ctx.canvas;
const state = canvasStates[canvasId];
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

const width = Math.max(1, brushSize);
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
        const cosRot = Math.cos(brushRotation);
        const sinRot = Math.sin(brushRotation);
        let rotatedX = relX * cosRot - relY * sinRot;
        let rotatedY = relX * sinRot + relY * cosRot;
        x = centerX + rotatedX;
        y = centerY + rotatedY;

        if (isFlipVerticalActive) {
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
        if (brushShape === 'oilbarrel') {
console.log('OILBARREL END DEBUG:', {
    isDraggingOilbarrel: isDraggingOilbarrel,
    oilbarrelRafId: oilbarrelRafId,
    oilbarrelDragState: oilbarrelDragState,
    anchorPoints: anchorPoints,
    hasCanvasChanged: hasCanvasChanged
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

const hasPositionalEffect = isGlitchTideHeld || isHyphenHeld || isFractalStretchHeld || isNeonBendHeld || isLockHeld;
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
console.log('Sweeper smearLine - Pixels:', pixels.length, 'xMin:', xMin, 'xMax:', xMax, 'Brush:', brushShape);
}

function drawAestheticLines(canvasId) {
console.log('Drawing aesthetic lines with anchors:', anchorPoints);
const targetCtx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
const targetCanvas = canvasId === 'base' ? baseCanvas : canvasId === 'paint' ? paintCanvas : samplerCanvas;
const state = canvasStates[canvasId];
console.log(`AestheticLines on ${canvasId} - Canvas size: ${targetCtx.canvas.width}x${targetCtx.canvas.height}`);

// Get zoom parameters
const zoomLevel = state.zoomLevel || 1;
const panX = state.panX || 0;
const panY = state.panY || 0;

if (anchorPoints.length < 2) {
    console.log("Need at least 2 anchor points for aesthetic lines");
    if (anchorPoints.length === 1) smearPixels(anchorPoints[0].x, anchorPoints[0].y, canvasId);
    return;
}

// Transform anchor points from screen space to canvas space if zoomed
const transformedAnchorPoints = anchorPoints.map(point => {
    if (zoomLevel !== 1) {
        return {
            ...point,
            x: (point.x - panX) / zoomLevel,
            y: (point.y - panY) / zoomLevel
        };
    }
    return point;
});

// Transform lastTouchPoints as well
const transformedLastTouchPoints = lastTouchPoints.map(point => {
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
        const state = canvasStates[key];
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
    if (currentImageData[canvasId]) {
        offscreenCtx.putImageData(currentImageData[canvasId], 0, 0);
    }
}
const offscreenCtx = state.offscreenCanvas.getContext('2d', { alpha: true });

// Calculate bounds using transformed points
const halfBrush = Math.max(brushSize * 1.5, 5);
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
            currentImageData[key] = canvasBackups[key];
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
// Store the unzoomed content in currentImageData
currentImageData[canvasId] = offscreenCtx.getImageData(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);

// Restore non-target canvases
Object.keys(canvasBackups).forEach(key => {
    if (canvasBackups[key]) {
        const restoreCtx = key === 'base' ? baseCtx : key === 'paint' ? paintCtx : samplerCtx;
        restoreCtx.putImageData(canvasBackups[key], 0, 0);
        currentImageData[key] = canvasBackups[key];
        console.log(`Restored ${key} canvas state after drawing on ${canvasId}`);
    }
});

// ALWAYS redraw with zoom transformation (removed if (!isDragging) check)
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

hasCanvasChanged = true;

if (isRecording) {
    // Record with ORIGINAL anchor points (not transformed)
    for (let i = 0; i < anchorPoints.length - 1; i++) {
        recordMovement('smear', { 
            lastX: lastTouchPoints[i]?.x || anchorPoints[i].x, 
            lastY: lastTouchPoints[i]?.y || anchorPoints[i].y, 
            currentX: anchorPoints[i].x, 
            currentY: anchorPoints[i].y,
            nextX: anchorPoints[i + 1].x,
            nextY: anchorPoints[i + 1].y,
            canvasId
        });
    }
}
console.log('AestheticLines drawn - Pixels processed, Canvas:', canvasId, 'Bounds:', { xMin, xMax, yMin, yMax });
}


function renderOilbarrelMouse() {
if (!isDraggingOilbarrel || !oilbarrelDragState.ctx) {
    oilbarrelRafId = null;
    return;
}

const { startX, startY, endX, endY, canvasId, ctx, targetCanvas } = oilbarrelDragState;

try {
    // REMOVED: Heavy debug logging
    
    // Only update anchor points, don't recalculate everything
    anchorPoints[0].x = startX;
    anchorPoints[0].y = startY;
    anchorPoints[1].x = endX;
    anchorPoints[1].y = endY;
    
    // Use lighter drawing method
    drawSweeperLines(canvasId);
    hasCanvasChanged = true;

    // REMOVED: Heavy recording logic during animation
    
} catch (error) {
    console.error('Error in renderOilbarrelMouse:', error);
}

// Reduce frame rate to 30fps instead of 60fps
setTimeout(() => {
    oilbarrelRafId = requestAnimationFrame(renderOilbarrelMouse);
}, 33);
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

const halfBrush = Math.max(brushSize * 1.5, 5);
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
        const cosRot = Math.cos(brushRotation);
        const sinRot = Math.sin(brushRotation);
        let rotatedX = relX * cosRot - relY * sinRot;
        let rotatedY = relX * sinRot + relY * cosRot;
        x = centerX + rotatedX;
        y = centerY + rotatedY;

        // Apply vertical flip
        if (isFlipVerticalActive) {
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

const hasPositionalEffect = isGlitchTideHeld || isHyphenHeld || isFractalStretchHeld || isNeonBendHeld || isLockHeld;
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
    const isMultiFinger = (brushShape === 'sweeper' || brushShape === 'oilbarrel') && anchorPoints.length >= 2;
    const canvasId = touchPoints[0]?.target === baseCanvas ? 'base' : touchPoints[0]?.target === paintCanvas ? 'paint' : 'sampler';
    const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
    const halfBrush = brushSize / 2;

    let flipCenterX, flipCenterY;
    if (isMultiFinger) {
        flipCenterX = anchorPoints.reduce((sum, p) => sum + p.x, 0) / anchorPoints.length;
        flipCenterY = anchorPoints.reduce((sum, p) => sum + p.y, 0) / anchorPoints.length;
    } else {
        flipCenterX = currentX;
        flipCenterY = currentY;
    }

    if (isPaintMode) {
        pixels.forEach(pixel => {
            pixel.r = paintColor.r;
            pixel.g = paintColor.g;
            pixel.b = paintColor.b;
        });
    }
    if (isBrightenHeld) {
        pixels.forEach(pixel => {
            pixel.r = Math.min(255, pixel.r + 10);
            pixel.g = Math.min(255, pixel.g + 10);
            pixel.b = Math.min(255, pixel.b + 10);
        });
    }

if (isDarkenHeld) {
    pixels.forEach(pixel => {
        pixel.r = Math.max(0, pixel.r - 10);
        pixel.g = Math.max(0, pixel.g - 10);
        pixel.b = Math.max(0, pixel.b - 10);
    });
}
if (isNeonHeld) {
    neonPhase = (neonPhase + 5) % 360;
    const [r, g, b] = hslToRgb(neonPhase, 75, 65);
    pixels.forEach(pixel => {
        pixel.r = r;
        pixel.g = g;
        pixel.b = b;
    });
}
if (isOriginalHeld) {
    if (!originalImageData[canvasId]) {
        console.warn(`No original image data for ${canvasId}, skipping original effect`);
        return;
    }
    const origData = originalImageData[canvasId].data;
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
if (isLockHeld) {
    if (Math.abs(dx) > Math.abs(dy)) {
        pixels.forEach(pixel => pixel.y = lastY);
    } else {
        pixels.forEach(pixel => pixel.x = lastX);
    }
}
if (!isMultiFinger && isEmojiHeld) {
    emojiPhase = (emojiPhase + 1) % emojiFaces.length;
    ctx.font = `${Math.floor(brushSize)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.fillText(emojiFaces[emojiPhase], currentX, currentY);
    const halfBrush = brushSize / 2;
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
if (isHyphenHeld) {
    pixels.forEach(pixel => {
        const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * Math.PI / 2;
        const radius = Math.random() * brushSize * 0.5;
        pixel.x += Math.cos(angle) * radius;
        pixel.y += Math.sin(angle) * radius;
    });
}
if (isTrashHeld) {
    const tempPixels = [...pixels];
    const instanceCount = Math.min(5, Math.floor(brushSize / 20) + 1);
    for (let j = 0; j < instanceCount; j++) {
        const angle = Math.PI * 2 * j / instanceCount + Math.random() * 0.2;
        const offset = brushSize * (0.5 + Math.random() * 0.5);
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
if (isFlagHeld && saturationStartTime) {
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
if (isChromaticShiftHeld) {
    vhsPhase += 0.05;
    pixels.forEach(pixel => {
        pixel.r = Math.min(255, Math.max(0, pixel.r + Math.sin(vhsPhase) * 20));
        pixel.g = Math.min(255, Math.max(0, pixel.g + Math.cos(vhsPhase) * 20));
    });
}
if (isCausticsHeld && brushShape !== 'oilbarrel') {
    vhsPhase += 0.05;
    pixels.forEach(pixel => {
        const distX = (pixel.x - currentX) / brushSize;
        const distY = (pixel.y - currentY) / brushSize;
        const caustic = Math.sin(distX * 15 + vhsPhase) * Math.cos(distY * 15 + vhsPhase) * 20;
        pixel.r = Math.min(255, Math.max(0, pixel.r + caustic));
        pixel.g = Math.min(255, Math.max(0, pixel.g + caustic));
        pixel.b = Math.min(255, Math.max(0, pixel.b + caustic));
    });
}
if (isFractalStretchHeld) {
    const time = Date.now() * 0.001;
    const halfBrush = brushSize / 2;
    pixels.forEach(pixel => {
        const dx = pixel.x - currentX;
        const dy = pixel.y - currentY;
        if (isPixelInBrushShape(pixel.x, pixel.y, currentX, currentY, halfBrush)) {
            const angle = Math.atan2(dy, dx) + time;
            const swirlX = (brushShape === 'rectangle' ? halfBrush * 1.5 : halfBrush) * Math.sin(time + dx * 0.1) * 0.3;
            const swirlY = (brushShape === 'rectangle' ? halfBrush * 0.5 : halfBrush) * Math.cos(time + dy * 0.1) * 0.3;
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
if (isNeonBendHeld) {
    const time = Date.now() * 0.001;
    const halfBrush = brushSize / 2;
    pixels.forEach(pixel => {
        const dx = pixel.x - currentX;
        const dy = pixel.y - currentY;
        if (isPixelInBrushShape(pixel.x, pixel.y, currentX, currentY, halfBrush)) {
            const angle = Math.atan2(dy, dx) + time;
            const offsetX = (brushShape === 'rectangle' ? halfBrush * 1.5 : halfBrush) * Math.cos(time + dx * 0.1) * 0.5;
            const offsetY = (brushShape === 'rectangle' ? halfBrush * 0.5 : halfBrush) * Math.sin(time + dy * 0.1) * 0.5;
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
if (isGlitchTideHeld) {
const time = Date.now() * 0.001;
const sinTime = Math.sin(time); // Cache the calculation
const cosTime = Math.cos(time); // Cache the calculation
const shiftAmount = sinTime * brushSize * 2; // Cache this too

pixels.forEach(pixel => {
    const dy = pixel.y - currentY;
    const timeDy = time + dy * 0.3;
    
    // Bold color glitch (exactly same effect)
    pixel.r = Math.min(255, Math.max(0, pixel.r + Math.sin(timeDy) * 50));
    pixel.g = Math.min(255, Math.max(0, pixel.g + Math.cos(timeDy) * 50));
    pixel.b = Math.min(255, Math.max(0, pixel.b + Math.random() * 30));
    
    // Position shift (from the second glitchTide block)
    pixel.x += Math.sin(timeDy) * brushSize * 2;
    pixel.r = Math.min(255, Math.max(0, pixel.r + sinTime * 30));
});

// Single log instead of per-pixel logging
console.log('Glitch Tide applied to', pixels.length, 'pixels - Shift:', shiftAmount);
}
if (isPhotoCRTHeld) {
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
if (isPointBreakHeld) {
const time = Date.now() * 0.001;
pixels.forEach(pixel => {
    const dyNorm = (pixel.y - currentY) / brushSize;
    pixel.x += Math.sin(time + dyNorm * 3) * brushSize * 0.5;
    pixel.r = Math.min(255, Math.max(0, pixel.r + Math.sin(time) * 30));
});
}
if (isFlickerNegativeHeld) {
    const now = performance.now();
    if (!lastFlickerUpdate || now - lastFlickerUpdate > 16) { // ~60fps
        flickerPhase += 0.5;
        lastFlickerUpdate = now;
        const shouldInvert = Math.floor(flickerPhase) % 2 === 0;
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
        console.log(`FlickerNegative applied - Inverted: ${shouldInvert}, Phase: ${flickerPhase}, SamplePixel: ${originalRGB} -> ${modifiedRGB}`);
    }
}
if (isScatterHeld) {
// Handled by applyScatterEffect in smearPixels to avoid recursion
console.log('Scatter effect queued for smearPixels');
}
if (isBinaryRainHeld) {
const halfBrush = brushSize / 2;
const outerRadius = halfBrush * 1.8; // Extend 1.8x for a wide surrounding effect
const xMin = Math.max(0, Math.floor(currentX - outerRadius));
const xMax = Math.min(ctx.canvas.width - 1, Math.ceil(currentX + outerRadius));
const yMin = Math.max(0, Math.floor(currentY - outerRadius));
const yMax = Math.min(ctx.canvas.height - 1, Math.ceil(currentY + outerRadius));

// Set up drawing context for binary rain
ctx.font = `${Math.floor(brushSize / 3)}px monospace`;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// Calculate number of binary characters for the outer ring
const charDensity = Math.max(10, Math.floor(brushSize / 6)); // Dense but not overwhelming

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

// Update currentImageData to reflect changes
currentImageData[canvasId] = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
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

function smearPixels(currentX, currentY, canvasId, sourceX, sourceY, stickerSlot, sourceCanvas) {
const targetCtx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
const sourceCtx = sourceCanvas ? (sourceCanvas === baseCanvas ? baseCtx : sourceCanvas === paintCanvas ? paintCtx : samplerCtx) : targetCtx;
const sourceCanvasObj = sourceCanvas || targetCtx.canvas;
const state = canvasStates[canvasId];

if (isNaN(currentX) || isNaN(currentY)) {
    console.error('Invalid coordinates in smearPixels:', { currentX, currentY });
    return;
}
if (isNaN(brushSize) || brushSize <= 0) {
    console.error('Invalid brushSize in smearPixels:', brushSize);
    brushSize = baseBrushSize || 50;
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
const mappedBrushSize = brushSize;
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

// Update currentImageData with the correct unzoomed data
currentImageData[canvasId] = unzoomedData;
}
const offscreenCtx = state.offscreenCanvas.getContext('2d', { alpha: true });

// Create temporary canvas for brush application
const tempCanvas = document.createElement('canvas');
tempCanvas.width = Math.max(1, xMax - xMin);
tempCanvas.height = Math.max(1, yMax - yMin);
const tempCtx = tempCanvas.getContext('2d', { alpha: true });
tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

let pixels = [];
const isTeleportClone = isTeleportHeld && sourceCanvas && sourceCanvas !== targetCtx.canvas;
const step = isDitherVibeHeld && brushShape !== 'stickerMode' && mappedBrushSize > 50 ? Math.ceil(mappedBrushSize / 50) : 1;

if (brushShape === 'stickerMode') {
    let stampPixels = [];
    if (stickerSlot && stickerImages[stickerSlot]) {
        let stickerImg = stickerImages[stickerSlot];
        if (isFlipHorizontalActive && flippedStampImages[stickerSlot]?.horizontal) {
            stickerImg = flippedStampImages[stickerSlot].horizontal;
        } else if (isFlipVerticalActive && flippedStampImages[stickerSlot]?.vertical) {
            stickerImg = flippedStampImages[stickerSlot].vertical;
        }
        const aspectRatio = stickerImg.height / stickerImg.width;
        let stickerWidth = stickerImg.width;
        let stickerHeight = stickerImg.height;
        const effectiveSize = isTeleportClone ? cloneBrushSize : brushSize;
        const effectiveRotation = isTeleportClone ? cloneBrushRotation : brushRotation;
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
        applyEffects(stampPixels, 0, 0, lastX || mappedX, lastY || mappedY, mappedX, mappedY);
        pixels = stampPixels;
    }
} else if (brushShape === 'melt' || (brushShape === 'melt' && isTeleportHeld)) {
    const firstFinger = touchPoints.find(tp => tp.id === teleportFirstFinger) || touchPoints[0];
    let meltDirection = 1;
    let endY = targetCtx.canvas.height - 1;
    if (touchPoints.length >= 2) {
        const secondFinger = touchPoints[1];
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
    const maxPixels = isDitherVibeHeld ? 50000 : 100000;
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
        const cosRot = Math.cos(brushRotation);
        const sinRot = Math.sin(brushRotation);
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
} else if (brushShape === 'brokenScreen' || (brushShape === 'brokenScreen' && isTeleportHeld)) {
    let holdTime;
    if (isRecording && currentMovement) {
        holdTime = currentMovement.holdTime || 0.5;
    } else {
        const firstFinger = touchPoints.find(tp => tp.id === teleportFirstFinger) || touchPoints[0];
        holdTime = firstFinger ? (Date.now() - firstFinger.startTime) / 1000 : 0.5;
    }
    const meltSpeed = 5000 * holdTime;
    let meltDirection = 1;
    if (touchPoints.length >= 2) {
        const secondFinger = touchPoints[1];
        meltDirection = secondFinger.y < (touchPoints[0]?.y || mappedY) ? -1 : 1;
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
    const maxPixels = isDitherVibeHeld ? 50000 : 100000;
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
                    const cosRot = Math.cos(brushRotation);
                    const sinRot = Math.sin(brushRotation);
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
    if (isRecording && currentMovement) {
        currentMovement.holdTime = holdTime;
    }
    console.log(`BrokenScreen brush applied${isTeleportClone ? ' (cloned)' : ''}: ${pixels.length} pixels`);
} else if (brushShape === 'jazzScatter') {
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
    if (isFractalStretchHeld) {
        const dx = shapeX - drawX;
        const dy = shapeY - drawY;
        posOffsetX = Math.sin(time + dx * 0.1) * halfBrush * 0.5;
        posOffsetY = Math.cos(time + dy * 0.1) * halfBrush * 0.5;
        shapeX += posOffsetX;
        shapeY += posOffsetY;
    }
    if (isGlitchTideHeld) {
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
    tempCtx.rotate(brushRotation);
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
} else if (flippedBrushSnapshot && (isFlipHorizontalActive || isFlipVerticalActive)) {
    for (let y = 0; y < flippedBrushHeight; y += step) {
        for (let x = 0; x < flippedBrushWidth; x += step) {
            const srcIndex = (y * flippedBrushWidth + x) * 4;
            const r = flippedBrushSnapshot.data[srcIndex];
            const g = flippedBrushSnapshot.data[srcIndex + 1];
            const b = flippedBrushSnapshot.data[srcIndex + 2];
            const relX = x - flippedBrushWidth / 2;
            const relY = y - flippedBrushHeight / 2;
            const rotatedX = relX * Math.cos(brushRotation) - relY * Math.sin(brushRotation);
            const rotatedY = relX * Math.sin(brushRotation) + relY * Math.cos(brushRotation);
            const destX = Math.round(mappedX + rotatedX);
            const destY = Math.round(mappedY + rotatedY);
            if (destX >= xMin && destX < xMax && destY >= yMin && destY < yMax && 
                isPixelInBrushShape(destX, destY, mappedX, mappedY, halfBrush)) {
                pixels.push({ r, g, b, x: destX, y: destY });
            }
        }
    }
} else if (brushShape === 'tv') {
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
                const rotatedX = relX * Math.cos(brushRotation) - relY * Math.sin(brushRotation);
                const rotatedY = relX * Math.sin(brushRotation) + relY * Math.cos(brushRotation);
                const destX = Math.round(mappedX + rotatedX);
                const destY = Math.round(mappedY + rotatedY);
                if (destX >= 0 && destX < targetCtx.canvas.width && destY >= 0 && destY < targetCtx.canvas.height) {
                    pixels.push({ r: gray + noise, g: gray + noise, b: gray + noise, x: destX, y: destY });
                }
            }
        }
    }
    console.log(`TV brush applied: ${pixels.length} pixels`);
} else if (brushShape === 'negative') {
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
                const rotatedX = relX * Math.cos(brushRotation) - relY * Math.sin(brushRotation);
                const rotatedY = relX * Math.sin(brushRotation) + relY * Math.cos(brushRotation);
                const destX = Math.round(mappedX + rotatedX);
                const destY = Math.round(mappedY + rotatedY);
                if (destX >= 0 && destX < targetCtx.canvas.width && destY >= 0 && destY < targetCtx.canvas.height) {
                    pixels.push({ r, g, b, x: destX, y: destY });
                }
            }
        }
    }
    console.log(`Negative brush pixels collected: ${pixels.length}`);
} else if (isPaintMode) {
    if (!['box', 'circle', 'rectangle', 'triangle'].includes(brushShape)) {
        brushShape = 'box';
        Object.values(brushButtons).forEach(btn => btn.classList.remove('selected'));
        brushButtons.box.classList.add('selected');
        console.log('Reset brushShape to box for paint mode');
    }
    for (let y = yMin; y < yMax; y += step) {
        for (let x = xMin; x < xMax; x += step) {
            if (isPixelInBrushShape(x, y, mappedX, mappedY, halfBrush)) {
                const relX = x - mappedX;
                const relY = y - mappedY;
                const rotatedX = relX * Math.cos(brushRotation) - relY * Math.sin(brushRotation);
                const rotatedY = relX * Math.sin(brushRotation) + relY * Math.cos(brushRotation);
                const destX = Math.round(mappedX + rotatedX);
                const destY = Math.round(mappedY + rotatedY);
                if (destX >= 0 && destX < targetCtx.canvas.width && destY >= 0 && destY < targetCtx.canvas.height) {
                    pixels.push({ r: paintColor.r, g: paintColor.g, b: paintColor.b, x: destX, y: destY });
                }
            }
        }
    }
    console.log(`Paint mode applied: ${pixels.length} pixels with color rgb(${paintColor.r}, ${paintColor.g}, ${paintColor.b}) at (${mappedX}, ${mappedY})`);
} else if (mappedSourceX !== undefined && mappedSourceY !== undefined && !isTeleportClone && touchPoints.length >= 3) {
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
                const cosRot = Math.cos(brushRotation);
                const sinRot = Math.sin(brushRotation);
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
    let srcXBase = isTeleportClone ? mappedSourceX : (lastX !== undefined ? lastX : mappedX);
    let srcYBase = isTeleportClone ? mappedSourceY : (lastY !== undefined ? lastY : mappedY);
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
                if (isFlipVerticalActive) relY = -relY;
                let srcX = Math.round(srcXBase + relX);
                let srcY = Math.round(srcYBase + relY);
                srcX = Math.max(srcXMin, Math.min(srcXMax - 1, srcX));
                srcY = Math.max(srcYMin, Math.min(srcYMax - 1, srcY));
                const srcIndex = ((srcY - srcYMin) * srcWidth + (srcX - srcXMin)) * 4;
                const r = sourceData[srcIndex] || 0;
                const g = sourceData[srcIndex + 1] || 0;
                const b = sourceData[srcIndex + 2] || 0;
                if (sourceData[srcIndex + 3] > 0) {
                    const rotatedX = relX * Math.cos(brushRotation) - relY * Math.sin(brushRotation);
                    const rotatedY = relX * Math.sin(brushRotation) + relY * Math.cos(brushRotation);
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

if (pixels.length === 0 && brushShape !== 'brokenScreen') {
    console.warn('No pixels to draw in smearPixels');
    return;
}

applyEffects(pixels, mappedX - (mappedSourceX || lastX || mappedX), mappedY - (mappedSourceY || lastY || mappedY), mappedSourceX || lastX || mappedX, mappedSourceY || lastY || mappedY, mappedX, mappedY);

const destImageData = tempCtx.createImageData(tempCanvas.width, tempCanvas.height);
const destData = destImageData.data;
pixels.forEach(pixel => {
    const newX = Math.round(pixel.x - xMin);
    const newY = Math.round(pixel.y - yMin);
    if (newX >= 0 && newX < tempCanvas.width && newY >= 0 && newY < tempCanvas.height) {
        const destIndex = (newY * tempCanvas.width + newX) * 4;
        destData[destIndex] = pixel.r;
        destData[destIndex + 1] = pixel.g;
        destData[destIndex + 2] = pixel.b;
        destData[destIndex + 3] = 255;
    }
});

tempCtx.putImageData(destImageData, 0, 0);

// Update offscreen canvas with current content
// If zoomed, we need to transform the painted content back to unzoomed coordinates
if (state.zoomLevel !== 1) {
// Calculate the unzoomed position
const unzoomedXMin = (xMin - state.panX) / state.zoomLevel;
const unzoomedYMin = (yMin - state.panY) / state.zoomLevel;
const unzoomedWidth = tempCanvas.width / state.zoomLevel;
const unzoomedHeight = tempCanvas.height / state.zoomLevel;

// Draw the painted content at the correct unzoomed size and position
offscreenCtx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height,
                      unzoomedXMin, unzoomedYMin, unzoomedWidth, unzoomedHeight);
} else {
// Not zoomed, draw normally
offscreenCtx.drawImage(tempCanvas, xMin, yMin);
}
if (!isDragging) {
// Apply zoom and pan transformations
targetCtx.setTransform(1, 0, 0, 1, 0, 0);
targetCtx.clearRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
targetCtx.fillStyle = '#FFFFFF';
targetCtx.fillRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
targetCtx.save();
targetCtx.translate(panX, panY);
targetCtx.scale(zoomLevel, zoomLevel);
targetCtx.imageSmoothingEnabled = true;
targetCtx.imageSmoothingQuality = 'high';
targetCtx.drawImage(state.offscreenCanvas, 0, 0);
console.log('FINAL CANVAS SAMPLE after drawing offscreen:');
const finalSample = targetCtx.getImageData(0, 0, Math.min(10, targetCtx.canvas.width), Math.min(10, targetCtx.canvas.height));
for (let y = 0; y < 10; y++) {
let row = '';
for (let x = 0; x < 10; x++) {
    const i = (y * 10 + x) * 4;
    const r = finalSample.data[i];
    const g = finalSample.data[i + 1];
    const b = finalSample.data[i + 2];
    const a = finalSample.data[i + 3];
    row += a > 0 ? `(${r},${g},${b}) ` : '(TRANSP) ';
}
console.log(`Final Row ${y}: ${row}`);
}
targetCtx.restore();
} else {
targetCtx.drawImage(tempCanvas, xMin, yMin);
}
currentImageData[canvasId] = offscreenCtx.getImageData(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);

if (sourceX === undefined) {
    lastX = mappedX;
    lastY = mappedY;
}

applyScatterEffect(mappedX, mappedY, lastX, lastY, canvasId, targetCtx);
if (isRecording && touchPoints.length > 0) {
    touchPoints.forEach(point => recordMovement('smear', {
        lastX: point.lastX / zoomLevel,
        lastY: point.lastY / zoomLevel,
        currentX: point.x / zoomLevel,
        currentY: point.y / zoomLevel,
        canvasId,
        size: mappedBrushSize,
        rotation: brushRotation
    }));
}
}

function smearSelection(currentX, currentY, canvasId, targetCtx, imageData, bounds, brushShape) {
const width = bounds.xMax - bounds.xMin;
const height = bounds.yMax - bounds.yMin;
const padding = 10;
const xMin = Math.max(0, Math.floor(currentX - padding));
const xMax = Math.min(targetCtx.canvas.width - 1, Math.ceil(currentX + width + padding));
const yMin = Math.max(0, Math.floor(currentY - padding));
const yMax = Math.min(targetCtx.canvas.height - 1, Math.ceil(currentY + height + padding));

// Extract pixels
const pixels = [];
const data = imageData.data;
for (let y = 0; y < imageData.height; y++) {
for (let x = 0; x < imageData.width; x++) {
  const i = (y * imageData.width + x) * 4;
  if (data[i + 3] > 0) {
    let canvasX = x + currentX;
    let canvasY = y + currentY;
    // Apply rotation
    if (brushRotation !== 0) {
      const relX = canvasX - (currentX + width / 2);
      const relY = canvasY - (currentY + height / 2);
      const cosRot = Math.cos(brushRotation);
      const sinRot = Math.sin(brushRotation);
      canvasX = currentX + width / 2 + (relX * cosRot - relY * sinRot);
      canvasY = currentY + height / 2 + (relX * sinRot + relY * cosRot);
    }
    // Apply vertical flip
    if (isFlipVerticalActive) {
      canvasY = currentY + height - (canvasY - currentY);
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

// Apply all effects
applyEffects(pixels, currentX - (lastX || currentX), currentY - (lastY || currentY), 
           lastX || currentX, lastY || currentY, currentX, currentY);

// Render with clipping
targetCtx.save();
if (brushShape === 'basquiatSelection') {
targetCtx.beginPath();
bounds.path.forEach((point, index) => {
  const px = point.x + (currentX - bounds.xMin);
  const py = point.y + (currentY - bounds.yMin);
  if (index === 0) targetCtx.moveTo(px, py);
  else targetCtx.lineTo(px, py);
});
targetCtx.closePath();
targetCtx.clip();
} else {
targetCtx.beginPath();
targetCtx.rect(currentX, currentY, width, height);
targetCtx.clip();
}

// Create temporary canvas for rendering
const tempCanvas = document.createElement('canvas');
tempCanvas.width = targetCtx.canvas.width;
tempCanvas.height = targetCtx.canvas.height;
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
targetCtx.drawImage(tempCanvas, 0, 0);
targetCtx.restore();

currentImageData[canvasId] = targetCtx.getImageData(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
if (isRecording) {
touchPoints.forEach(point => recordMovement('smear', { 
  lastX: point.lastX, lastY: point.lastY, currentX: point.x, currentY: point.y 
}));
}
lastX = currentX;
lastY = currentY;
console.log(`Smeared selection on ${canvasId}: ${pixels.length} pixels at (${currentX}, ${currentY}), shape=${brushShape}`);
}


function handleActionButton(buttonId, action) {
const button = document.getElementById(buttonId);
if (!button) {
    console.error(`Button ${buttonId} not found`);
    return;
}

// Remove existing listeners to prevent duplicates
const clonedButton = button.cloneNode(true);
button.parentNode.replaceChild(clonedButton, button);
const newButton = document.getElementById(buttonId);

// Debounced action
const debouncedAction = debounce(() => {
    action();
    console.log(`Action triggered for ${buttonId} at ${new Date().toISOString()}`);
}, 50);

// Mouse/touchpad handler
newButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`Click on ${buttonId}: clientX=${e.clientX}, clientY=${e.clientY}, target=${e.target.id}`);
    newButton.classList.add('active');
    debouncedAction();
    setTimeout(() => newButton.classList.remove('active', 'selected'), 200);
}, { passive: false });

// Touchscreen handlers with diagnostics
newButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    console.log(`Touchstart on ${buttonId}: touchId=${touch.identifier}, clientX=${touch.clientX}, clientY=${touch.clientY}, target=${e.target.id}`);
    setTimeout(() => newButton.classList.add('active'), 10);
}, { passive: false });

newButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.changedTouches[0];
    console.log(`Touchend on ${buttonId}: touchId=${touch.identifier}, clientX=${touch.clientX}, clientY=${touch.clientY}, target=${e.target.id}`);
    debouncedAction();
    setTimeout(() => newButton.classList.remove('active', 'selected'), 200);
}, { passive: false });

newButton.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.changedTouches[0];
    console.log(`Touchcancel on ${buttonId}: touchId=${touch?.identifier}, clientX=${touch?.clientX}, clientY=${touch?.clientY}, target=${e.target.id}`);
    newButton.classList.remove('active', 'selected');
}, { passive: false });

// Log all events for debugging
['touchmove', 'mousedown', 'mouseup'].forEach(event => {
    newButton.addEventListener(event, (e) => {
        console.log(`${event} on ${buttonId}: target=${e.target.id}, type=${e.type}`);
        e.stopPropagation();
    }, { passive: false });
});
}

handleActionButton('undoBtn', undo);
handleActionButton('redoBtn', redo);
handleActionButton('resetBtn', () => {
console.log('Reset button triggered - A/B testing original vs current');

// COMPLETELY DISABLE ALL MONITORING AND STATE CHANGES
isInResetMode = true;
const wasRecording = isRecording;
isRecording = false;

// Temporarily override putImageData to prevent ANY monitoring during reset
const originalPutImageData = CanvasRenderingContext2D.prototype.putImageData;
CanvasRenderingContext2D.prototype.putImageData = function(imageData, dx, dy) {
    return originalPutImageData.call(this, imageData, dx, dy);
};

// Get current reset state for all canvases
const anyCanvasIsOriginal = ['base', 'paint', 'sampler'].some(id => isResetToOriginal[id]);

['base', 'paint', 'sampler'].forEach(canvasId => {
    const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : canvasId === 'sampler' ? samplerCtx : null;
    const canvas = canvasId === 'base' ? baseCanvas : canvasId === 'paint' ? paintCanvas : samplerCanvas;
    const state = canvasStates[canvasId];
    
    if (!ctx || !originalImageData[canvasId]) {
        console.warn(`Cannot reset ${canvasId} - missing context or original data`);
        return;
    }
    
    if (!anyCanvasIsOriginal) {
        // SWITCH TO ORIGINAL STATE
        // Save current work state for restoration (only if not already saved)
        if (!lastStateBeforeReset[canvasId]) {
            // Get current state by temporarily resetting transform
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            lastStateBeforeReset[canvasId] = ctx.getImageData(0, 0, canvas.width, canvas.height);
            console.log(`Saved current work state for ${canvasId}`);
        }
        
        // Draw original state with NO monitoring
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        originalPutImageData.call(ctx, originalImageData[canvasId], 0, 0);
        
        // Restore zoom if active (without triggering monitoring)
        if (state.zoomLevel !== 1 || state.panX !== 0 || state.panY !== 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(state.panX, state.panY);
            ctx.scale(state.zoomLevel, state.zoomLevel);
            originalPutImageData.call(ctx, originalImageData[canvasId], 0, 0);
            ctx.restore();
        }
        
        isResetToOriginal[canvasId] = true;
        console.log(`→ Switched to ORIGINAL state for ${canvasId}`);
        
    } else {
        // SWITCH BACK TO WORK STATE
        if (lastStateBeforeReset[canvasId]) {
            // Draw work state with NO monitoring
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            originalPutImageData.call(ctx, lastStateBeforeReset[canvasId], 0, 0);
            
            // Restore zoom if active (without triggering monitoring)
            if (state.zoomLevel !== 1 || state.panX !== 0 || state.panY !== 0) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.save();
                ctx.translate(state.panX, state.panY);
                ctx.scale(state.zoomLevel, state.zoomLevel);
                originalPutImageData.call(ctx, lastStateBeforeReset[canvasId], 0, 0);
                ctx.restore();
            }
            
            isResetToOriginal[canvasId] = false;
            console.log(`→ Switched to WORK state for ${canvasId}`);
        } else {
            console.warn(`No saved work state available for ${canvasId}`);
        }
    }
});

// Update undo/redo button states based on reset mode
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const anyOriginalState = ['base', 'paint', 'sampler'].some(id => isResetToOriginal[id]);

if (anyOriginalState) {
    // Disable undo/redo when viewing original state
    undoBtn.style.opacity = '0.3';
    redoBtn.style.opacity = '0.3';
    undoBtn.style.pointerEvents = 'none';
    redoBtn.style.pointerEvents = 'none';
    console.log('Disabled undo/redo - viewing original state');
} else {
    // Re-enable undo/redo when back to work state
    undoBtn.style.opacity = '1';
    redoBtn.style.opacity = '1';
    undoBtn.style.pointerEvents = 'auto';
    redoBtn.style.pointerEvents = 'auto';
    console.log('Re-enabled undo/redo - back to work state');
}

// CRITICAL: DO NOT update currentImageData or call saveState()
// This is pure A/B testing - no state changes should be recorded

// Restore all systems
isRecording = wasRecording;
isInResetMode = false;

console.log(`Reset A/B test complete - ${anyOriginalState ? 'ORIGINAL' : 'WORK'} state, no undo/redo impact`);
});

const paintBtn = document.getElementById('paintBtn');
const colorPickerBtn = document.getElementById('colorPickerBtn');
const colorPickerModal = document.getElementById('colorPickerModal');
const closeColorPickerBtn = document.getElementById('closeColorPickerBtn');
const saturationValueCanvas = document.getElementById('saturationValueCanvas');
const hueCanvas = document.getElementById('hueCanvas');
const colorPreview = document.getElementById('colorPreview');
const hexInput = document.getElementById('hexInput');

// Add throttle function if not already present
function throttle(func, limit) {
let lastCall = 0;
return function (...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
        lastCall = now;
        return func.apply(this, args);
    }
};
}

// Function to clear reset states when user makes new changes
function clearResetStates() {
['base', 'paint', 'sampler'].forEach(canvasId => {
    lastStateBeforeReset[canvasId] = null;
    isResetToOriginal[canvasId] = false;
});
console.log('Cleared reset states - fresh start for A/B testing');
}

// Debug function to test effect recording
function testEffectRecording(effect = 'neon', state = true) {
console.log(`Testing effect recording: ${effect}=${state}`);
isRecording = true;
recordedMovements = [];
currentMovement = null;
const fakeEvent = { stopPropagation: () => {}, preventDefault: () => {}, type: 'click' };
const key = keyLabels.find(k => k.effect === effect);
if (key) {
    const keyElement = Array.from(keyboardContainer.children).find(el => el.dataset.effect === effect);
    toggleEffectHandler(fakeEvent, state, key, keyElement);
    endMovementRecording();
    saveMovements();
} else {
    console.error(`Effect ${effect} not found in keyLabels`);
}
isRecording = false;
}

// Toggle paint mode
const togglePaintMode = throttle((e) => {
e.preventDefault();
isPaintMode = !isPaintMode;
paintBtn.classList.toggle('selected', isPaintMode);
if (isRecording && currentMovement) currentMovement.paintMode = isPaintMode;
console.log(`Paint mode toggled: ${isPaintMode}`);
}, 200); // 200ms debounce

paintBtn.addEventListener('click', togglePaintMode);
paintBtn.addEventListener('touchstart', togglePaintMode, { passive: false });
paintBtn.addEventListener('touchend', (e) => {
e.preventDefault();
paintBtn.classList.toggle('active', false);
}, { passive: false });

// Color picker state
let currentHue = 0; // 0–360
let currentSaturation = 1; // 0–1
let currentValue = 1; // 0–1
let isDraggingHue = false;
let isDraggingSV = false;

// Initialize color picker canvases
const svCtx = saturationValueCanvas.getContext('2d', { alpha: true });
const hueCtx = hueCanvas.getContext('2d', { alpha: true });

// Helper: Convert HSV to RGB
function hsvToRgb(h, s, v) {
h = h % 360;
s = Math.max(0, Math.min(1, s));
v = Math.max(0, Math.min(1, v));
let r, g, b;
const i = Math.floor(h / 60);
const f = h / 60 - i;
const p = v * (1 - s);
const q = v * (1 - f * s);
const t = v * (1 - (1 - f) * s);
switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
}
return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
};
}

// Helper: RGB to Hex
function rgbToHex(r, g, b) {
return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

// Helper: Hex to RGB
function hexToRgb(hex) {
hex = hex.replace(/^#/, '');
if (hex.length !== 6) return null;
const bigint = parseInt(hex, 16);
return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
};
}

// Update paintColor and UI
function updateColor(h, s, v, updateInput = true) {
currentHue = h;
currentSaturation = s;
currentValue = v;
const rgb = hsvToRgb(h, s, v);
paintColor.r = rgb.r;
paintColor.g = rgb.g;
paintColor.b = rgb.b;
if (isRecording && currentMovement) {
    currentMovement.paintColor = { ...paintColor };
}
colorPreview.style.backgroundColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
if (updateInput) {
    hexInput.value = rgbToHex(rgb.r, rgb.g, rgb.b);
}
drawSaturationValueCanvas();
drawHueCanvas();
console.log(`Color updated: hsv(${h}, ${s}, ${v}), rgb(${rgb.r}, ${rgb.g}, ${rgb.b}), hex=${hexInput.value}`);
}

// Draw saturation/value canvas
function drawSaturationValueCanvas() {
svCtx.clearRect(0, 0, saturationValueCanvas.width, saturationValueCanvas.height);
const gradientH = svCtx.createLinearGradient(0, 0, saturationValueCanvas.width, 0);
gradientH.addColorStop(0, `hsl(${currentHue}, 0%, 100%)`);
gradientH.addColorStop(1, `hsl(${currentHue}, 100%, 50%)`);
const gradientV = svCtx.createLinearGradient(0, 0, 0, saturationValueCanvas.height);
gradientV.addColorStop(0, 'rgba(0,0,0,0)');
gradientV.addColorStop(1, 'rgba(0,0,0,1)');
svCtx.fillStyle = gradientH;
svCtx.fillRect(0, 0, saturationValueCanvas.width, saturationValueCanvas.height);
svCtx.globalCompositeOperation = 'multiply';
svCtx.fillStyle = gradientV;
svCtx.fillRect(0, 0, saturationValueCanvas.width, saturationValueCanvas.height);
svCtx.globalCompositeOperation = 'source-over';
// Draw cursor
const x = currentSaturation * saturationValueCanvas.width;
const y = (1 - currentValue) * saturationValueCanvas.height;
svCtx.beginPath();
svCtx.arc(x, y, 5, 0, 2 * Math.PI);
svCtx.strokeStyle = 'hsl(var(--hue-group4), 75%, 50%)';
svCtx.lineWidth = 2;
svCtx.stroke();
}

// Draw hue canvas
function drawHueCanvas() {
hueCtx.clearRect(0, 0, hueCanvas.width, hueCanvas.height);
const gradient = hueCtx.createLinearGradient(0, 0, hueCanvas.width, 0);
for (let i = 0; i <= 360; i += 30) {
    gradient.addColorStop(i / 360, `hsl(${i}, 100%, 50%)`);
}
hueCtx.fillStyle = gradient;
hueCtx.fillRect(0, 0, hueCanvas.width, hueCanvas.height);
// Draw cursor
const x = (currentHue / 360) * hueCanvas.width;
hueCtx.beginPath();
hueCtx.moveTo(x, 0);
hueCtx.lineTo(x, hueCanvas.height);
hueCtx.strokeStyle = 'hsl(var(--hue-group4), 75%, 50%)';
hueCtx.lineWidth = 2;
hueCtx.stroke();
}

// Get coordinates from mouse/touch event
function getCanvasCoords(canvas, e) {
const rect = canvas.getBoundingClientRect();
const clientX = e.clientX || (e.touches && e.touches[0].clientX);
const clientY = e.clientY || (e.touches && e.touches[0].clientY);
if (!clientX || !clientY) return null;
const x = clientX - rect.left;
const y = clientY - rect.top;
return { x: Math.max(0, Math.min(canvas.width, x)), y: Math.max(0, Math.min(canvas.height, y)) };
}

// Handle hue canvas interaction
function handleHueDrag(e) {
e.preventDefault();
const coords = getCanvasCoords(hueCanvas, e);
if (!coords) return;
const hue = (coords.x / hueCanvas.width) * 360;
updateColor(hue, currentSaturation, currentValue);
}

// Handle saturation/value canvas interaction
function handleSVDrag(e) {
e.preventDefault();
const coords = getCanvasCoords(saturationValueCanvas, e);
if (!coords) return;
const saturation = coords.x / saturationValueCanvas.width;
const value = 1 - (coords.y / saturationValueCanvas.height);
updateColor(currentHue, saturation, value);
}

// Event listeners for hue canvas
hueCanvas.addEventListener('mousedown', (e) => {
isDraggingHue = true;
handleHueDrag(e);
});
hueCanvas.addEventListener('mousemove', (e) => {
if (isDraggingHue) handleHueDrag(e);
});
hueCanvas.addEventListener('mouseup', () => {
isDraggingHue = false;
});
hueCanvas.addEventListener('touchstart', (e) => {
e.preventDefault();
isDraggingHue = true;
handleHueDrag(e);
}, { passive: false });
hueCanvas.addEventListener('touchmove', (e) => {
if (isDraggingHue) handleHueDrag(e);
}, { passive: false });
hueCanvas.addEventListener('touchend', () => {
isDraggingHue = false;
}, { passive: false });

// Event listeners for saturation/value canvas
saturationValueCanvas.addEventListener('mousedown', (e) => {
isDraggingSV = true;
handleSVDrag(e);
});
saturationValueCanvas.addEventListener('mousemove', (e) => {
if (isDraggingSV) handleSVDrag(e);
});
saturationValueCanvas.addEventListener('mouseup', () => {
isDraggingSV = false;
});
saturationValueCanvas.addEventListener('touchstart', (e) => {
e.preventDefault();
isDraggingSV = true;
handleSVDrag(e);
}, { passive: false });
saturationValueCanvas.addEventListener('touchmove', (e) => {
if (isDraggingSV) handleSVDrag(e);
}, { passive: false });
saturationValueCanvas.addEventListener('touchend', () => {
isDraggingSV = false;
}, { passive: false });

// Handle hex input
hexInput.addEventListener('input', (e) => {
let value = e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
if (value.length > 6) value = value.slice(0, 6);
e.target.value = value.length >= 6 ? `#${value}` : value;
if (value.length === 6) {
    const rgb = hexToRgb(value);
    if (rgb) {
        const [h, s, v] = rgbToHsv(rgb.r, rgb.g, rgb.b);
        updateColor(h, s, v, false);
    }
}
});
hexInput.addEventListener('keydown', (e) => {
if (e.key === 'Enter' && hexInput.value.length >= 6) {
    colorPickerModal.style.display = 'none';
}
});

// Helper: RGB to HSV
function rgbToHsv(r, g, b) {
r /= 255; g /= 255; b /= 255;
const max = Math.max(r, g, b), min = Math.min(r, g, b);
let h, s, v = max;
const d = max - min;
s = max === 0 ? 0 : d / max;
if (max === min) {
    h = 0;
} else {
    switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
}
return [h * 360, s, v];
}

// Open color picker modal
const openColorPicker = throttle((e) => {
e.preventDefault();
console.log(`Color picker opened by ${e.type} on ${e.target.id}`);
colorPickerModal.style.display = 'block';
colorPickerBtn.classList.add('active');
setTimeout(() => colorPickerBtn.classList.remove('active'), 200);
// Initialize with current paintColor
const [h, s, v] = rgbToHsv(paintColor.r, paintColor.g, paintColor.b);
updateColor(h, s, v);
}, 200);

colorPickerBtn.addEventListener('click', openColorPicker);
colorPickerBtn.addEventListener('touchstart', openColorPicker, { passive: false });
colorPickerBtn.addEventListener('touchend', (e) => {
e.preventDefault();
console.log('Color picker button touchend');
}, { passive: false });
colorPickerBtn.addEventListener('keydown', (e) => {
if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    openColorPicker(e);
}
});

// Close color picker modal
closeColorPickerBtn.addEventListener('click', () => {
colorPickerModal.style.display = 'none';
console.log('Color picker modal closed');
});
closeColorPickerBtn.addEventListener('touchstart', (e) => {
e.preventDefault();
colorPickerModal.style.display = 'none';
console.log('Color picker modal closed by touch');
}, { passive: false });

// Initialize color picker on load
document.addEventListener('DOMContentLoaded', () => {
updateColor(0, 1, 1); // Default to red
});

// Add throttle function at the top of <script> (if not already present)
function throttle(func, limit) {
let lastCall = 0;
return function (...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
        lastCall = now;
        return func.apply(this, args);
    }
};
}

[baseCanvas, paintCanvas, samplerCanvas].forEach(canvas => {
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
        console.log(`Mousedown on ${canvas.id}, brushShape=${brushShape}, isSelecting=${isSelecting}, isSelectionActive=${isSelectionActive}`);
        if (brushShape === 'squareSelection' || brushShape === 'basquiatSelection') {
            e.stopPropagation();
            startDrag(e);
        } else {
            startDrag(e);
        }
    }
});
canvas.addEventListener('mousemove', (e) => {
    if (isZooming) {
        console.log(`Mousemove (zoom) on ${canvas.id}`);
        drag(e);
    } else if (e.buttons === 1) {
        console.log(`Mousemove (drag) on ${canvas.id}, brushShape=${brushShape}, isSelecting=${isSelecting}, isSelectionActive=${isSelectionActive}`);
        if (brushShape === 'squareSelection' || brushShape === 'basquiatSelection') {
            e.stopPropagation();
            drag(e);
        } else {
            drag(e);
        }
    }
});
canvas.addEventListener('mouseup', (e) => {
    console.log(`Mouseup on ${canvas.id}, brushShape=${brushShape}, isSelecting=${isSelecting}, isSelectionActive=${isSelectionActive}`);
    if (brushShape === 'squareSelection' || brushShape === 'basquiatSelection') {
        e.stopPropagation();
        endDrag(e);
    } else {
        endDrag(e);
    }
});
canvas.addEventListener('wheel', handleZoomWheel, { passive: false });
canvas.addEventListener('touchstart', (e) => {
console.log(`Touchstart on ${canvas.id}, brushShape=${brushShape}, touches=${e.touches.length}, isSelecting=${isSelecting}, isSelectionActive=${isSelectionActive}`);
if ((brushShape === 'squareSelection' || brushShape === 'circleSelection') && e.touches.length === 1) {
if (isZooming) {
  console.log('In zoom mode - passing to startDrag for zoom handling');
  startDrag(e); // LET ZOOM WORK!
  return;
}
e.stopPropagation();
e.preventDefault();
const coords = getCanvasCoordinates(e, e.touches[0]);
if (isNaN(coords.x) || isNaN(coords.y) ||
    coords.x < 0 || coords.x >= canvas.width ||
    coords.y < 0 || coords.y >= canvas.height) {
  console.error('Invalid touch coords for selection:', coords);
  return;
}
// Initialize or update selection canvas
if (!selectionCanvas || selectionCanvas.dataset.targetCanvasId !== canvas.id) {
  if (selectionCanvas && selectionCanvas.parentNode) {
    selectionCanvas.parentNode.removeChild(selectionCanvas);
  }
  selectionCanvas = document.createElement('canvas');
  selectionCanvas.id = 'selectionCanvas';
  selectionCanvas.width = canvas.width;
  selectionCanvas.height = canvas.height;
  selectionCtx = selectionCanvas.getContext('2d', { alpha: true });
  selectionCanvas.style.position = 'absolute';
  selectionCanvas.style.zIndex = '2000';
  selectionCanvas.style.pointerEvents = 'none';
  selectionCanvas.style.display = 'block';
  selectionCanvas.dataset.targetCanvasId = canvas.id;
  document.getElementById('canvasContainer').appendChild(selectionCanvas);
  syncSelectionCanvasPosition(canvas);
  selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);

if (isZooming) {
console.log('BLOCKING: Not initializing selection canvas in zoom mode');
return;
}
  console.log(`Touch-initialized selection canvas for ${canvas.id}: ${selectionCanvas.width}x${selectionCanvas.height}`);
}
// Check if touch is inside active selection
if (isSelectionActive && isPointInSelection(coords.x, coords.y, brushShape)) {
  // Start dragging existing selection - SINGLE FINGER ONLY
  touchPoints = [{
    id: e.touches[0].identifier,
    x: coords.x,
    y: coords.y,
    target: canvas,
    lastX: coords.x,
    lastY: coords.y,
    startTime: Date.now(),
    isMouse: false
  }];
  lastTouchPoints = [...touchPoints];
  isDragging = true;
  isDraggingSelection = true; // Set the selection dragging flag
  hasCanvasChanged = false;
  shouldSaveState = false;
  console.log(`Touch-dragging existing ${brushShape} at (${coords.x}, ${coords.y}) on ${canvas.id} with single finger`);
  renderMarchingAnts();
  if (isRecording) {
    recordMovement('smear', {
      lastX: coords.x,
      lastY: coords.y,
      currentX: coords.x,
      currentY: coords.y,
      canvasId: canvas.id === 'baseCanvas' ? 'base' : canvas.id === 'paintCanvas' ? 'paint' : 'sampler'
    });
  }
  return; // Exit early to prevent fallback to startDrag
} else {
// ADD ZOOM CHECK HERE
if (isZooming) {
console.log('BLOCKING: Selection coordinate setup in zoom mode');
return;
}

// Reset and start new selection
if (isSelectionActive) {
saveState(true);
isSelectionActive = false;
selectedImageData = null;
selectionBounds = null;
selectionCacheCanvas = null;
selectionCacheCtx = null;
selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
console.log(`Reset ${brushShape} for new touch on ${canvas.id}`);
}
selectionType = brushShape === 'squareSelection' ? 'square' : 'circle';
isSelecting = true;
selectionStart = { x: coords.x, y: coords.y };
selectionEnd = { x: coords.x, y: coords.y };
multipointPath = [];
  touchPoints = [{
    id: e.touches[0].identifier,
    x: coords.x,
    y: coords.y,
    target: canvas,
    lastX: coords.x,
    lastY: coords.y,
    startTime: Date.now(),
    isMouse: false
  }];
  lastTouchPoints = [...touchPoints];
  isDragging = true;
  hasCanvasChanged = false;
  shouldSaveState = false;
  console.log(`Touch-started new ${brushShape} at (${coords.x}, ${coords.y}) on ${canvas.id}`);
  renderMarchingAnts();
  if (isRecording) {
    recordMovement('smear', {
      lastX: coords.x,
      lastY: coords.y,
      currentX: coords.x,
      currentY: coords.y,
      canvasId: canvas.id === 'baseCanvas' ? 'base' : canvas.id === 'paintCanvas' ? 'paint' : 'sampler'
    });
  }
  return; // Exit early to prevent fallback to startDrag
}
} else if (brushShape === 'basquiatSelection') {
// Handle basquiat selection separately
e.stopPropagation();
startDrag(e);
} else {
// Handle all other brush shapes
startDrag(e);
}
}, { passive: false });
canvas.addEventListener('touchmove', (e) => {
    console.log(`Touchmove on ${canvas.id}, brushShape=${brushShape}, touches=${e.touches.length}, isDragging=${isDragging}`);
    if (isDragging) {
        if (brushShape === 'squareSelection' || brushShape === 'basquiatSelection') {
            e.stopPropagation();
            drag(e);
        } else {
            drag(e);
        }
    }
}, { passive: false });
canvas.addEventListener('touchend', (e) => {
    console.log(`Touchend on ${canvas.id}, brushShape=${brushShape}, touches=${e.touches.length}, isDragging=${isDragging}`);
    if (isDragging) {
        if (brushShape === 'squareSelection' || brushShape === 'basquiatSelection') {
            e.stopPropagation();
            endDrag(e);
        } else {
            endDrag(e);
        }
    }
}, { passive: false });
canvas.addEventListener('touchcancel', (e) => {
    console.log(`Touchcancel on ${canvas.id}, brushShape=${brushShape}, isDragging=${isDragging}`);
    if (isDragging) {
        endDrag(e);
    }
}, { passive: false });
});

// Handle QWERTY key presses for effects
document.addEventListener('keydown', (e) => {
const key = e.key.toLowerCase();
console.log(`Keydown detected: ${key}, Ctrl: ${e.ctrlKey}, Alt: ${e.altKey}, Shift: ${e.shiftKey}`);

// 🚫 BLOCK ALL KEYBOARD EFFECTS WHEN MODALS ARE OPEN
if (isAnyModalOpen()) {
    console.log(`🔒 Keyboard blocked - Modal(s) open: ${getOpenModals().join(', ')}`);
    return; // Exit early - don't process any effects
}

if (e.ctrlKey && key === 's') {
    e.preventDefault();
    toggleEffect('neon', false);
    document.getElementById('saveModal').style.display = 'block';
    const canvasId = document.getElementById('saveCanvas').value;
    document.getElementById('saveWidth').value = originalWidths[canvasId] || 1920;
    document.getElementById('saveHeight').value = originalHeights[canvasId] || 1080;
} else if (e.ctrlKey && key === 'z') {
    e.preventDefault();
    undo();
} else if (e.ctrlKey && key === 'y') {
    e.preventDefault();
    redo();
} else if (['1', '2', '3', '4', '5'].includes(key) && !e.ctrlKey && !e.altKey && !e.shiftKey) {
    // Check if user is typing in an input field - if so, don't trigger stamp selection
    const activeElement = document.activeElement;
    const isTypingInInput = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true' ||
        activeElement.isContentEditable
    );
    
    if (isTypingInInput) {
        console.log(`Ignoring key ${key} - user is typing in input field:`, activeElement.id || activeElement.tagName);
        return; // Don't trigger stamp selection when typing in inputs
    }
    
    const stampIndex = parseInt(key) - 1;
    const selectedStamp = `sticker${parseInt(key)}`;
    if (stickerImages[selectedStamp]) { // Only reorder if stamp exists
        // Reorder stampOrder to start with selected stamp, followed by next filled stamps
        const allStamps = ['sticker1', 'sticker2', 'sticker3', 'sticker4', 'sticker5'];
        const filledStamps = allStamps.filter(slot => stickerImages[slot]);
        const currentIndex = filledStamps.indexOf(selectedStamp);
        if (currentIndex !== -1) {
            const newOrder = [];
            newOrder.push(selectedStamp); // Selected stamp becomes first
            // Add remaining filled stamps in their relative order
            for (let i = 1; i < filledStamps.length; i++) {
                newOrder.push(filledStamps[(currentIndex + i) % filledStamps.length]);
            }
            stampOrder = newOrder;
            isStampSelected = true;
            console.log(`Stamp order updated via key ${key}: ${stampOrder}`);

            // Record stamp order change
            if (isRecording) {
                recordMovement('stampOrder', {
                    stampOrder: [...stampOrder],
                    fingerRole: 'qwertyKey',
                    activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                });
            }

            updateStampUI();
        } else {
            console.log(`Stamp ${selectedStamp} not found in filled stamps`);
        }
    } else {
        console.log(`No image in ${selectedStamp}, ignoring key ${key}`);
    }
    e.preventDefault();
} else if (key === '[' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
    // Move to previous stamp
    const filledStamps = stampOrder.filter(slot => stickerImages[slot]);
    if (filledStamps.length > 1) {
        const currentFirst = filledStamps[0];
        const currentIndex = stampOrder.indexOf(currentFirst);
        let prevIndex = (currentIndex - 1 + stampOrder.length) % stampOrder.length;
        let prevStamp = stampOrder[prevIndex];
        // Find the previous filled stamp
        while (!stickerImages[prevStamp] && prevIndex !== currentIndex) {
            prevIndex = (prevIndex - 1 + stampOrder.length) % stampOrder.length;
            prevStamp = stampOrder[prevIndex];
        }
        if (stickerImages[prevStamp] && prevStamp !== currentFirst) {
            stampOrder = [prevStamp, ...stampOrder.filter(slot => slot !== prevStamp)];
            isStampSelected = true;
            console.log(`Moved to previous stamp via '[': ${stampOrder}`);

            // Record stamp order change
            if (isRecording) {
                recordMovement('stampOrder', {
                    stampOrder: [...stampOrder],
                    fingerRole: 'qwertyKey',
                    activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                });
            }

            updateStampUI();
        }
    } else {
        console.log('Cannot cycle to previous stamp: fewer than 2 filled stamps');
    }
    e.preventDefault();
} else if (key === ']' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
    // Move to next stamp
    const filledStamps = stampOrder.filter(slot => stickerImages[slot]);
    if (filledStamps.length > 1) {
        const currentFirst = filledStamps[0];
        const currentIndex = stampOrder.indexOf(currentFirst);
        let nextIndex = (currentIndex + 1) % stampOrder.length;
        let nextStamp = stampOrder[nextIndex];
        // Find the next filled stamp
        while (!stickerImages[nextStamp] && nextIndex !== currentIndex) {
            nextIndex = (nextIndex + 1) % stampOrder.length;
            nextStamp = stampOrder[nextIndex];
        }
        if (stickerImages[nextStamp] && nextStamp !== currentFirst) {
            stampOrder = [nextStamp, ...stampOrder.filter(slot => slot !== nextStamp)];
            isStampSelected = true;
            console.log(`Moved to next stamp via ']': ${stampOrder}`);

            // Record stamp order change
            if (isRecording) {
                recordMovement('stampOrder', {
                    stampOrder: [...stampOrder],
                    fingerRole: 'qwertyKey',
                    activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
                });
            }

            updateStampUI();
        }
    } else {
        console.log('Cannot cycle to next stamp: fewer than 2 filled stamps');
    }
    e.preventDefault();
} else {
    for (const [effect, mapping] of Object.entries(effectMap)) {
        if (key === mapping.key && !activeEffects.has(key)) {
            activeEffects.add(key);
            toggleEffect(effect, true);
            console.log(`Triggering effect: ${effect} for key: ${key}`);
            if (effect === 'flag') saturationStartTime = Date.now();
            e.preventDefault();
        }
    }
}
});


document.addEventListener('keyup', (e) => {
const key = e.key.toLowerCase();
console.log(`Keyup detected: ${key}`); // Debug

// 🚫 BLOCK KEYUP EFFECTS WHEN MODALS ARE OPEN
if (isAnyModalOpen()) {
console.log(`🔒 Keyup blocked - Modal(s) open: ${getOpenModals().join(', ')}`);
return;
}

for (const [effect, mapping] of Object.entries(effectMap)) {
if (key === mapping.key && !(e.ctrlKey || e.altKey || e.shiftKey)) {
  activeEffects.delete(key);
  toggleEffect(effect, false);
  console.log(`Cleared effect: ${effect} for key: ${key}, activeEffects:`, [...activeEffects]); // Debug
  if (isRecording && currentMovement) currentMovement.effects[effect] = false;
  e.preventDefault();
}
}
});

// Directional key handlers for rotation and flip
document.addEventListener('keydown', (e) => {
// 🚫 BLOCK DIRECTIONAL KEYS WHEN MODALS OPEN
if (isAnyModalOpen()) {
    return;
}

if (e.key === 'ArrowLeft' && !isRotatingLeft) {
    isRotatingLeft = true;
    e.preventDefault();
    console.log('Started rotating counterclockwise');
} else if (e.key === 'ArrowRight' && !isRotatingRight) {
    isRotatingRight = true;
    e.preventDefault();
    console.log('Started rotating clockwise');
} else if (e.key === 'ArrowUp' && !isFlippingUp) {
    isFlippingUp = true;
    isFlipVerticalActive = true; // Enable vertical flip
    e.preventDefault();
    console.log('Started flipping forward (vertical)');
} else if (e.key === 'ArrowDown' && !isFlippingDown) {
    isFlippingDown = true;
    isFlipVerticalActive = true; // Enable vertical flip (direction handled in animation)
    e.preventDefault();
    console.log('Started flipping backward (vertical)');
}
});

document.addEventListener('keyup', (e) => {
// 🚫 BLOCK DIRECTIONAL KEYUP WHEN MODALS OPEN
if (isAnyModalOpen()) {
    return;
}

if (e.key === 'ArrowLeft') {
    isRotatingLeft = false;
    e.preventDefault();
    console.log('Stopped rotating counterclockwise');
} else if (e.key === 'ArrowRight') {
    isRotatingRight = false;
    e.preventDefault();
    console.log('Stopped rotating clockwise');
} else if (e.key === 'ArrowUp') {
    isFlippingUp = false;
    isFlipVerticalActive = false; // Reset vertical flip
    e.preventDefault();
    console.log('Stopped flipping forward');
} else if (e.key === 'ArrowDown') {
    isFlippingDown = false;
    isFlipVerticalActive = false; // Reset vertical flip
    e.preventDefault();
    console.log('Stopped flipping backward');
}
});


// Sticker image storage
let stickerImages = {
'sticker1': null,
'sticker2': null,
'sticker3': null,
'sticker4': null,
'sticker5': null
};

// Add hidden file inputs for stickers
document.body.insertAdjacentHTML('beforeend', `
<input type="file" id="sticker1Input" accept="image/*" multiple style="display: none;">
<input type="file" id="sticker2Input" accept="image/*" multiple style="display: none;">
<input type="file" id="sticker3Input" accept="image/*" multiple style="display: none;">
<input type="file" id="sticker4Input" accept="image/*" multiple style="display: none;">
<input type="file" id="sticker5Input" accept="image/*" multiple style="display: none;">
`);

// Sticker button handlers
const stickerButtons = {
'sticker1': document.getElementById('sticker1Btn'),
'sticker2': document.getElementById('sticker2Btn'),
'sticker3': document.getElementById('sticker3Btn'),
'sticker4': document.getElementById('sticker4Btn'),
'sticker5': document.getElementById('sticker5Btn')
};

const trashButtons = {
'sticker1': document.getElementById('trash1Btn'),
'sticker2': document.getElementById('trash2Btn'),
'sticker3': document.getElementById('trash3Btn'),
'sticker4': document.getElementById('trash4Btn'),
'sticker5': document.getElementById('trash5Btn')
};

Object.keys(stickerButtons).forEach(sticker => {
const input = document.getElementById(`${sticker}Input`);
const preview = document.getElementById(`${sticker}Preview`);
const trashBtn = document.getElementById(`trash${sticker.replace('sticker', '')}Btn`);
if (!stickerButtons[sticker] || !input || !preview || !trashBtn) {
    console.error(`Setup error for ${sticker}:`, {
        button: !!stickerButtons[sticker],
        input: !!input,
        preview: !!preview,
        trash: !!trashBtn
    });
    return;
}
const triggerInput = () => {
    console.log(`Clicked ${sticker}Btn`);
    setBrushShape('stickerMode');
    // Removed: stampOrder reordering to keep sticker1 as default
    isStampSelected = true;
    // Activate only this slot's trash bin
    ['sticker1', 'sticker2', 'sticker3', 'sticker4', 'sticker5'].forEach(s => {
        const btn = document.getElementById(`trash${s.replace('sticker', '')}Btn`);
        if (btn) {
            btn.classList.add('faded');
            btn.classList.remove('active-toter');
        }
    });
    trashBtn.classList.remove('faded');
    trashBtn.classList.add('active-toter');
    updateStampUI();
    input.click();
};
stickerButtons[sticker].addEventListener('click', triggerInput);
stickerButtons[sticker].addEventListener('touchstart', (e) => {
    e.preventDefault();
    triggerInput();
}, { passive: false });
input.addEventListener('change', async (e) => {
const file = e.target.files[0]; // Take only the first file
if (!file) {
    console.log(`No file selected for ${sticker}`);
    return;
}

try {
    await validateImageFile(file);
} catch (error) {
    alert(error.message);
    e.target.value = '';
    return;
}

console.log(`Loading file for ${sticker}: ${file.name}`);

// Clear only the current slot
stickerImages[sticker] = null;
flippedStampImages[sticker].horizontal = null;
flippedStampImages[sticker].vertical = null;
if (preview) {
    preview.innerHTML = '';
    preview.style.backgroundImage = '';
    preview.style.display = 'none';
}

// Load the file
const img = new Image();
img.onload = () => {
    stickerImages[sticker] = img;
    if (preview) {
        // SAFE DOM manipulation instead of innerHTML
        preview.innerHTML = '';
        const imgElement = document.createElement('img');
        imgElement.style.cssText = 'width:100%;height:100%;object-fit:cover;';
        imgElement.src = img.src;
        preview.appendChild(imgElement);
        preview.style.display = 'block';
        preview.offsetHeight; // Force reflow
        console.log(`Set preview for ${sticker}`);
    }
        if (trashBtn) {
            trashBtn.classList.remove('faded');
            trashBtn.classList.add('active-toter');
            trashBtn.offsetHeight; // Force reflow
            console.log(`Activated trash for ${sticker} (ID: ${trashBtn.id}):`, {
                faded: trashBtn.classList.contains('faded'),
                activeToter: trashBtn.classList.contains('active-toter'),
                opacity: window.getComputedStyle(trashBtn).opacity
            });
        }
        // Removed: stampOrder reordering to keep sticker1 as default
        // Record stamp loading event
        if (isRecording) {
            recordMovement('stampLoad', {
                slot: sticker,
                stampOrder: [...stampOrder],
                fingerRole: 'fileInput',
                activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e)
            });
        }
        updateStampUI();
        if (brushShape === 'stickerMode') {
            Object.values(brushButtons).forEach(btn => btn.classList.remove('selected'));
            Object.values(stickerButtons).forEach(btn => {
                if (stickerImages[btn.id.replace('Btn', '')]) {
                    btn.classList.add('selected');
                }
            });
        }
        URL.revokeObjectURL(img.src);
        console.log(`Loaded file for ${sticker}, stampOrder unchanged: ${stampOrder}`);
    };
    img.onerror = () => {
        console.error(`Failed to load ${sticker}: ${file.name}`);
        alert(`Failed to load image for ${sticker}.`);
        updateStampUI();
        URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
    e.target.value = ''; // Reset input
});

trashBtn.addEventListener('click', () => {
    stickerImages[sticker] = null;
    flippedStampImages[sticker].horizontal = null;
    flippedStampImages[sticker].vertical = null;
    if (preview) {
        preview.innerHTML = '';
        preview.style.backgroundImage = '';
        preview.style.display = 'none';
    }
    if (trashBtn) {
        trashBtn.classList.add('faded');
        trashBtn.classList.remove('active-toter');
    }
    console.log(`Trashed ${sticker}`);
    isStampSelected = Object.values(stickerImages).some(img => img);
    updateStampUI();
});
});

function updateStampUI() {
console.log('updateStampUI:', {
    stampOrder,
    filledSlots: Object.keys(stickerImages).filter(slot => stickerImages[slot])
});

// Reset sticker buttons
Object.values(stickerButtons).forEach(btn => btn?.classList.remove('first-finger', 'selected'));

// Get filled stamps in current order
const filledStamps = stampOrder.filter(slot => stickerImages[slot]);
let filledCount = 0;

// Update slots
['sticker1', 'sticker2', 'sticker3', 'sticker4', 'sticker5'].forEach(slot => {
    const trashBtn = document.getElementById(`trash${slot.replace('sticker', '')}Btn`);
    const preview = document.getElementById(`${slot}Preview`);
    const stickerBtn = stickerButtons[slot];

    if (stickerImages[slot]) {
        filledCount++;
        if (trashBtn) {
            trashBtn.classList.remove('faded');
            trashBtn.classList.add('active-toter');
            console.log(`updateStampUI: Set trash for ${slot}:`, {
                faded: trashBtn.classList.contains('faded'),
                activeToter: trashBtn.classList.contains('active-toter'),
                opacity: window.getComputedStyle(trashBtn).opacity
            });
        }
        if (preview) {
            preview.style.display = 'block';
        }
        if (stickerBtn) {
            // Prioritize sticker1 as first-finger if filled and no reordering
            if (slot === 'sticker1' && filledStamps.includes('sticker1') && stampOrder[0] === 'sticker1') {
                stickerBtn.classList.add('first-finger');
            } else if (slot === filledStamps[0]) {
                stickerBtn.classList.add('first-finger');
            }
            if (brushShape === 'stickerMode') {
                stickerBtn.classList.add('selected');
            }
        }
    } else {
        if (trashBtn) {
            trashBtn.classList.add('faded');
            trashBtn.classList.remove('active-toter');
        }
        if (preview) {
            preview.innerHTML = '';
            preview.style.backgroundImage = '';
            preview.style.display = 'none';
        }
    }
});

// Ensure sticker mode is visually indicated
if (brushShape === 'stickerMode') {
    Object.values(brushButtons).forEach(btn => btn.classList.remove('selected'));
    Object.values(stickerButtons).forEach(btn => {
        if (stickerImages[btn.id.replace('Btn', '')]) {
            btn.classList.add('selected');
        }
    });
}

console.log(`updateStampUI: ${filledCount} bins active, first stamp: ${filledStamps[0] || 'none'}`);
}

// Add this new function BEFORE setBrushShape
function clearSelectionState() {
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

if (selectedImageData) {
    selectedImageData = null;
}

// Clear any large canvas references
if (selectionCacheCanvas) {
    selectionCacheCanvas.width = 0;
    selectionCacheCanvas.height = 0;
    selectionCacheCanvas = null;
    selectionCacheCtx = null;
}

// Force stop all selection flags
isSelecting = false;
isSelectionActive = false;
isDraggingSelection = false;

// Clear all selection data
selectionStart = null;
selectionEnd = null;
multipointPath = [];
selectedImageData = null;
selectionBounds = null;
selectionType = null;

// Thoroughly clear selection canvas
if (selectionCanvas) {
    // Clear the canvas
    if (selectionCtx) {
        selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
    }
    
    // Force hide
    selectionCanvas.style.display = 'none';
    selectionCanvas.style.visibility = 'hidden';
    
    // CRITICAL: Remove the dataset attribute
    delete selectionCanvas.dataset.targetCanvasId;
    
    // Remove from DOM
    if (selectionCanvas.parentNode) {
        selectionCanvas.parentNode.removeChild(selectionCanvas);
    }
    
    // Null references
    selectionCanvas = null;
    selectionCtx = null;
}

// Clear cache
selectionCacheCanvas = null;
selectionCacheCtx = null;

// Clear multipoint window variables
if (typeof window !== 'undefined') {
    window.lastTapTime = 0;
    window.lastCloseTime = 0;
    window.lastTouchId = null;
    window.lastEffectTime = 0;
}
removeGlobalDragListeners();

console.log('Selection state forcefully cleared');
}

function logCanvasState(action, canvasId, details = {}) {
const canvas = canvasId === 'base' ? baseCanvas : canvasId === 'paint' ? paintCanvas : samplerCanvas;
const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
const state = canvasStates[canvasId];

// Check if canvas has any content
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const hasContent = imageData.data.some(v => v !== 0);

// Check currentImageData
const hasCurrentImageData = currentImageData[canvasId] && currentImageData[canvasId].data.some(v => v !== 0);

// Check offscreen canvas
let hasOffscreenContent = false;
if (state.offscreenCanvas) {
    const offscreenData = state.offscreenCanvas.getContext('2d').getImageData(0, 0, state.offscreenCanvas.width, state.offscreenCanvas.height);
    hasOffscreenContent = offscreenData.data.some(v => v !== 0);
}

const logEntry = {
    timestamp: Date.now(),
    action: action,
    canvasId: canvasId,
    hasContent: hasContent,
    hasCurrentImageData: hasCurrentImageData,
    hasOffscreenContent: hasOffscreenContent,
    zoomLevel: state.zoomLevel || 1,
    panX: state.panX || 0,
    panY: state.panY || 0,
    isZooming: isZooming,
    isDragging: isDragging,
    ...details
};

debugLog.push(logEntry);

// Keep only last 50 entries
if (debugLog.length > 50) debugLog.shift();

// CRITICAL: Log when content disappears
const prevState = lastCanvasStates[canvasId];
if (prevState && prevState.hasContent && !hasContent) {
    console.error(`🚨 CONTENT LOST on ${canvasId}! Action: ${action}`, logEntry);
    console.error('Previous state:', prevState);
    console.error('Current state:', logEntry);
    console.error('Recent actions:', debugLog.slice(-10));
}

if (prevState && prevState.hasCurrentImageData && !hasCurrentImageData) {
    console.error(`🚨 CURRENT IMAGE DATA LOST on ${canvasId}! Action: ${action}`, logEntry);
}

lastCanvasStates[canvasId] = { ...logEntry };

console.log(`DEBUG ${action} [${canvasId}]:`, {
    content: hasContent ? '✅' : '❌',
    currentData: hasCurrentImageData ? '✅' : '❌', 
    offscreen: hasOffscreenContent ? '✅' : '❌',
    zoom: state.zoomLevel?.toFixed(2) || 1,
    pan: `(${(state.panX || 0).toFixed(0)}, ${(state.panY || 0).toFixed(0)})`,
    details
});
}

function undo() {
// Block undo when viewing original state
const anyOriginalState = ['base', 'paint', 'sampler'].some(id => isResetToOriginal[id]);
if (anyOriginalState) {
    console.log('Undo blocked - currently viewing original state via reset button');
    return;
}

if (undoStack.length > 1) {
    // Capture current (post) state for redo
    const currentState = {
        base: baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height),
        paint: paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height),
        sampler: samplerCtx.getImageData(0, 0, samplerCanvas.width, samplerCanvas.height)
    };
    redoStack.push(currentState);
    
    // Pop and restore previous state
    const prevState = undoStack.pop();
    baseCtx.putImageData(prevState.base, 0, 0);
    paintCtx.putImageData(prevState.paint, 0, 0);
    samplerCtx.putImageData(prevState.sampler, 0, 0);
    currentImageData.base = prevState.base;
    currentImageData.paint = prevState.paint;
    currentImageData.sampler = prevState.sampler;
    
    // Clear reset states since we're back to normal undo/redo
    clearResetStates();
    
    console.log('Undo - Reverted to state, Undo stack:', undoStack.length, 'Redo stack:', redoStack.length);
} else {
    console.log('Undo - No previous state available');
}
}


function undo() {
// Block undo when viewing original state
const anyOriginalState = ['base', 'paint', 'sampler'].some(id => isResetToOriginal[id]);
if (anyOriginalState) {
    console.log('Undo blocked - currently viewing original state via reset button');
    return;
}

if (undoStack.length > 1) {
    // Capture current (post) state for redo
    const currentState = {
        base: baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height),
        paint: paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height),
        sampler: samplerCtx.getImageData(0, 0, samplerCanvas.width, samplerCanvas.height)
    };
    redoStack.push(currentState);
    
    // Pop and restore previous state
    const prevState = undoStack.pop();
    baseCtx.putImageData(prevState.base, 0, 0);
    paintCtx.putImageData(prevState.paint, 0, 0);
    samplerCtx.putImageData(prevState.sampler, 0, 0);
    currentImageData.base = prevState.base;
    currentImageData.paint = prevState.paint;
    currentImageData.sampler = prevState.sampler;
    
    // Clear reset states since we're back to normal undo/redo
    clearResetStates();
    
    console.log('Undo - Reverted to state, Undo stack:', undoStack.length, 'Redo stack:', redoStack.length);
} else {
    console.log('Undo - No previous state available');
}
}

// ===== ALSO UPDATE THE REDO FUNCTION TO RESPECT RESET MODE =====
// BEFORE:
function redo() {
if (redoStack.length > 0) {
    // ... existing redo code
}
}

// AFTER:
function redo() {
// Block redo when viewing original state  
const anyOriginalState = ['base', 'paint', 'sampler'].some(id => isResetToOriginal[id]);
if (anyOriginalState) {
    console.log('Redo blocked - currently viewing original state via reset button');
    return;
}

if (redoStack.length > 0) {
    // Capture current state for undo
    const currentState = {
        base: baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height),
        paint: paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height),
        sampler: samplerCtx.getImageData(0, 0, samplerCanvas.width, samplerCanvas.height)
    };
    undoStack.push(currentState);
    
    // Pop and restore redo state
    const redoState = redoStack.pop();
    baseCtx.putImageData(redoState.base, 0, 0);
    paintCtx.putImageData(redoState.paint, 0, 0);
    samplerCtx.putImageData(redoState.sampler, 0, 0);
    currentImageData.base = redoState.base;
    currentImageData.paint = redoState.paint;
    currentImageData.sampler = redoState.sampler;
    
    // Clear reset states since we're back to normal undo/redo
    clearResetStates();
    
    console.log('Redo - Restored state, Undo stack:', undoStack.length, 'Redo stack:', redoStack.length);
} else {
    console.log('Redo - No state available');
}
}

function setBrushShape(shape) {
console.log('SETBRUSHAPE DEBUG BEFORE:', {
shape,
isZooming,
zoomLevels: {
  base: canvasStates.base.zoomLevel,
  paint: canvasStates.paint.zoomLevel,
  sampler: canvasStates.sampler.zoomLevel
},
targetLocked: {
  base: canvasStates.base.targetLocked,
  paint: canvasStates.paint.targetLocked,
  sampler: canvasStates.sampler.targetLocked
}
});



brushShape = shape === 'diamond' ? 'triangle' : shape;
const toggleBtn = document.getElementById('stickerToggleBtn');
Object.values(brushButtons).forEach(btn => btn.classList.remove('selected', 'active'));
Object.values(stickerButtons).forEach(btn => btn.classList.remove('selected', 'active', 'first-finger'));
toggleBtn.classList.remove('active');

// Cancel any active selection if switching to a non-selection brush
if (shape !== 'squareSelection' && shape !== 'basquiatSelection' && shape !== 'circleSelection') {
clearSelectionState();
}

if (brushButtons[shape] || shape === 'diamond') {
if (shape !== 'sweeper') {
  sweeperMode = 'off';
  brushButtons.sweeper.classList.remove('selected', 'active');
} else {
  sweeperMode = 'on';
}
brushButtons[shape === 'diamond' ? 'triangle' : shape].classList.add('selected');
} else if (shape === 'stickerMode') {
toggleBtn.classList.add('active');
updateStampUI();
} else if (shape === 'squareSelection' || shape === 'basquiatSelection' || shape === 'circleSelection') {
clearZoomLocks();
brushButtons[shape].classList.add('selected');
selectionType = shape === 'squareSelection' ? 'square' : shape === 'circleSelection' ? 'circle' : 'multipoint';
// Reset selection state to ensure fresh start
isSelecting = true;
isSelectionActive = false;
selectionStart = null;
selectionEnd = null;
multipointPath = [];
selectedImageData = null;
selectionBounds = null;
selectionCacheCanvas = null;
selectionCacheCtx = null;
// Remove existing selection canvas if present
if (selectionCanvas && selectionCanvas.parentNode) {
  selectionCanvas.parentNode.removeChild(selectionCanvas);
  selectionCanvas = null;
  selectionCtx = null;
}
// Initialize selection canvas without defaulting to a canvas
const validCanvases = [baseCanvas, paintCanvas, samplerCanvas];
selectionCanvas = document.createElement('canvas');
selectionCanvas.id = 'selectionCanvas';
selectionCanvas.style.zIndex = '2000';
selectionCanvas.style.pointerEvents = 'none';
selectionCanvas.style.display = 'none'; // Hidden until target is confirmed
selectionCtx = selectionCanvas.getContext('2d', { alpha: true });
selectionCtx.imageSmoothingEnabled = false;
document.getElementById('canvasContainer').appendChild(selectionCanvas);
console.log('Selection canvas initialized for', shape, 'awaiting target canvas');
}

anchorPoints = [];
smearAnchor = null;
teleportChain = [];
if (!isDragging) {
lastX = null;
lastY = null;
}
if (isRecording && currentMovement) currentMovement.shape = shape;

console.log('SETBRUSHAPE DEBUG AFTER:', {
shape,
isZooming,
zoomLevels: {
  base: canvasStates.base.zoomLevel,
  paint: canvasStates.paint.zoomLevel,
  sampler: canvasStates.sampler.zoomLevel
},
targetLocked: {
  base: canvasStates.base.targetLocked,
  paint: canvasStates.paint.targetLocked,
  sampler: canvasStates.sampler.targetLocked
}
});
}


function syncSelectionCanvasPosition(targetCanvas) {
if (!targetCanvas || !selectionCanvas) return;

// Hide if in zoom mode
if (isZooming) {
    selectionCanvas.style.display = 'none';
    selectionCanvas.style.visibility = 'hidden';
    return;
}

const container = document.getElementById('canvasContainer');

// Make sure selection canvas is in the container
if (selectionCanvas.parentElement !== container) {
    container.appendChild(selectionCanvas);
}

// Get zoom state
const canvasId = targetCanvas.id.replace('Canvas', '');
const state = canvasStates[canvasId];
const zoomLevel = state ? state.zoomLevel : 1;
const panX = state ? state.panX : 0;
const panY = state ? state.panY : 0;

// Don't apply zoom transform - marching ants are drawn in canvas space
const transformStyle = 'none';

// Position the selection canvas with the 5 pixel adjustment
selectionCanvas.style.cssText = `
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
selectionCanvas.width = targetCanvas.width;
selectionCanvas.height = targetCanvas.height;

selectionCanvas.dataset.targetCanvasId = targetCanvas.id;

// Remove any test divs from debugging
const testDiv = document.getElementById('selection-test-div');
if (testDiv) {
    testDiv.remove();
}
}

// Update when scrolling
document.getElementById('canvasContainer').addEventListener('scroll', function() {
if (selectionCanvas && selectionCanvas.dataset.targetCanvasId) {
    const targetCanvas = document.getElementById(selectionCanvas.dataset.targetCanvasId);
    if (targetCanvas) {
        syncSelectionCanvasPosition(targetCanvas);
    }
}
});

// ADDITION: Call this function when container scrolls
function handleCanvasContainerScroll() {
if (selectionCanvas && selectionCanvas.dataset.targetCanvasId) {
    const targetCanvas = selectionCanvas.dataset.targetCanvasId === 'baseCanvas' ? baseCanvas :
                       selectionCanvas.dataset.targetCanvasId === 'paintCanvas' ? paintCanvas :
                       selectionCanvas.dataset.targetCanvasId === 'samplerCanvas' ? samplerCanvas : null;
    
    if (targetCanvas) {
        syncSelectionCanvasPosition(targetCanvas);
    }
}
}

// Add scroll listener to update selection canvas position
document.getElementById('canvasContainer').addEventListener('scroll', handleCanvasContainerScroll);

function updateStampUI() {
console.log('updateStampUI called - isStampSelected:', isStampSelected, 'activeStamp:', stampOrder[0]);
Object.values(stickerButtons).forEach(btn => {
if (btn) btn.classList.remove('first-finger');
});
Object.values(trashButtons).forEach(btn => {
if (btn) {
  btn.classList.add('faded');
  btn.classList.remove('active-toter');
}
});
if (isStampSelected && stampOrder.length > 0 && stickerButtons[stampOrder[0]]) {
stickerButtons[stampOrder[0]].classList.add('first-finger');
const activeStamp = stampOrder[0]; // e.g., 'sticker3'
if (trashButtons[activeStamp]) {
  trashButtons[activeStamp].classList.remove('faded');
  trashButtons[activeStamp].classList.add('active-toter');
  console.log(`Activated Toter for ${activeStamp}: trash${activeStamp.replace('sticker', '')}Btn`);
} else {
  console.error(`No trash button found for ${activeStamp}`);
}
}
}

document.getElementById('stickerToggleBtn').addEventListener('click', () => {
const toggleBtn = document.getElementById('stickerToggleBtn');
if (toggleBtn.classList.contains('active')) {
    setBrushShape('box'); // Switch to default normal brush
} else {
    setBrushShape('stickerMode'); // Switch to stamp mode
}
});

brushButtons.box.addEventListener('click', () => setBrushShape('box'));
brushButtons.circle.addEventListener('click', () => setBrushShape('circle'));
brushButtons.rectangle.addEventListener('click', () => setBrushShape('rectangle'));
brushButtons.triangle.addEventListener('click', () => setBrushShape('diamond'));
brushButtons.sweeper.addEventListener('click', () => setBrushShape('sweeper'));
brushButtons.oilbarrel.addEventListener('click', () => setBrushShape('oilbarrel'));
brushButtons.tv.addEventListener('click', () => setBrushShape('tv'));
brushButtons.negative.addEventListener('click', () => setBrushShape('negative'));
brushButtons.box.addEventListener('touchstart', (e) => { e.preventDefault(); setBrushShape('box'); });
brushButtons.circle.addEventListener('touchstart', (e) => { e.preventDefault(); setBrushShape('circle'); });
brushButtons.rectangle.addEventListener('touchstart', (e) => { e.preventDefault(); setBrushShape('rectangle'); });
brushButtons.triangle.addEventListener('touchstart', (e) => { e.preventDefault(); setBrushShape('diamond'); });
brushButtons.sweeper.addEventListener('touchstart', (e) => { e.preventDefault(); setBrushShape('sweeper'); });
brushButtons.oilbarrel.addEventListener('touchstart', (e) => { e.preventDefault(); setBrushShape('oilbarrel'); });
brushButtons.tv.addEventListener('touchstart', (e) => { e.preventDefault(); setBrushShape('tv'); });
brushButtons.negative.addEventListener('touchstart', (e) => { e.preventDefault(); setBrushShape('negative'); });
brushButtons.melt.addEventListener('click', () => setBrushShape('melt'));
brushButtons.melt.addEventListener('touchstart', (e) => { e.preventDefault(); setBrushShape('melt'); });
brushButtons.brokenScreen.addEventListener('click', () => setBrushShape('brokenScreen'));
brushButtons.brokenScreen.addEventListener('touchstart', (e) => { e.preventDefault(); setBrushShape('brokenScreen'); });
brushButtons.jazzScatter.addEventListener('click', () => {
console.log('Jazz Scatter button clicked'); // Debug
setBrushShape('jazzScatter');
});
brushButtons.jazzScatter.addEventListener('touchstart', (e) => {
e.preventDefault();
console.log('Jazz Scatter button touched'); // Debug
setBrushShape('jazzScatter');
});
brushButtons.squareSelection.addEventListener('click', () => setBrushShape('squareSelection'));
brushButtons.squareSelection.addEventListener('touchstart', (e) => { e.preventDefault(); setBrushShape('squareSelection'); });
brushButtons.basquiatSelection.addEventListener('click', () => setBrushShape('basquiatSelection'));
brushButtons.basquiatSelection.addEventListener('touchstart', (e) => { e.preventDefault(); setBrushShape('basquiatSelection'); });
brushButtons.circleSelection.addEventListener('click', () => setBrushShape('circleSelection'));
brushButtons.circleSelection.addEventListener('touchstart', (e) => { e.preventDefault(); setBrushShape('circleSelection'); });
brushButtons.aestheticLines.addEventListener('click', () => setBrushShape('aestheticLines'));
brushButtons.aestheticLines.addEventListener('touchstart', (e) => { e.preventDefault(); setBrushShape('aestheticLines'); });

let isJesusImage = false;
const flagBtn = document.getElementById('flagBtn');
flagBtn.addEventListener('click', (e) => {
e.preventDefault();
isJesusImage = !isJesusImage;
const newSrc = isJesusImage ? '/images/JESUS.png' : '/images/AMERICANFLAG.png';
flagBtn.src = newSrc;
if (!flagBtn.complete || flagBtn.naturalWidth === 0) {
console.error(`Failed to load image: ${newSrc}`);
}
});
flagBtn.addEventListener('touchstart', (e) => {
e.preventDefault();
isJesusImage = !isJesusImage;
const newSrc = isJesusImage ? '/images/JESUS.png' : '/images/AMERICANFLAG.png';
flagBtn.src = newSrc;
if (!flagBtn.complete || flagBtn.naturalWidth === 0) {
console.error(`Failed to load image: ${newSrc}`);
}
}, { passive: false });

const aboutBtn = document.getElementById('aboutBtn');
const aboutModal = document.getElementById('aboutModal');
const closeAboutBtn = document.getElementById('closeAboutBtn');
aboutBtn.addEventListener('click', () => aboutModal.style.display = 'block');
closeAboutBtn.addEventListener('click', () => aboutModal.style.display = 'none');
const auromaCoinBtn = document.getElementById('auromaCoinBtn');
auromaCoinBtn.addEventListener('click', () => {
console.log('AUROMACOIN button clicked - modal placeholder');
// Future modal logic will go here
});
auromaCoinBtn.addEventListener('touchstart', (e) => {
e.preventDefault();
console.log('AUROMACOIN button touched - modal placeholder');
// Future modal logic will go here
}, { passive: false });

const fullscreenBtn = document.getElementById('fullscreenBtn');
fullscreenBtn.addEventListener('click', () => {
if (!document.fullscreenElement) document.documentElement.requestFullscreen();
else document.exitFullscreen();
});

const imageUpload = document.getElementById('imageUpload');
let originalWidths = { base: 0, paint: 0, sampler: 0 };
let originalHeights = { base: 0, paint: 0, sampler: 0 };
imageUpload.addEventListener('change', (e) => {
const file = e.target.files[0];
if (!file) return;
document.body.style.cursor = 'wait'; // Show loading cursor
const reader = new FileReader();
reader.onload = (event) => {
    img.src = event.target.result;
    img.onload = () => {
        try {
            const isPortrait = window.matchMedia('(orientation: portrait)').matches;
            const containerElement = document.getElementById('canvasContainer');
            
            let maxHeight, maxWidth;
            if (isPortrait) {
                // Portrait mode: prioritize width usage, allow for stacked canvases
                maxWidth = containerElement.clientWidth - 20; // Account for borders/padding
                maxHeight = (containerElement.clientHeight - 20) / 3; // Space for 3 stacked canvases
            } else {
                // Landscape mode: use existing logic
                maxHeight = document.getElementById('mainContainer').clientHeight - 35;
                maxWidth = containerElement.clientWidth - 20;
            }
            
            const aspectRatio = img.width / img.height;
            let newWidth, newHeight;
            
            if (isPortrait) {
                // Start with max width, then adjust height
                newWidth = maxWidth;
                newHeight = newWidth / aspectRatio;
                // If height exceeds limit, scale down
                if (newHeight > maxHeight) {
                    newHeight = maxHeight;
                    newWidth = newHeight * aspectRatio;
                }
            } else {
                // Landscape: start with height, then adjust width
                newHeight = maxHeight;
                newWidth = newHeight * aspectRatio;
                if (newWidth > maxWidth) {
                    newWidth = maxWidth;
                    newHeight = newWidth / aspectRatio;
                }
            }
            baseCanvas.height = newHeight;
            baseCanvas.width = newWidth;
            paintCanvas.height = newHeight;
            paintCanvas.width = newWidth;
            samplerCanvas.height = newHeight;
            samplerCanvas.width = newWidth;
            offscreenCanvas.width = baseCanvas.width;
            offscreenCanvas.height = baseCanvas.height;
            originalWidths.base = img.width;
            originalHeights.base = img.height;
            originalWidths.paint = img.width;
            originalHeights.paint = img.height;
            originalWidths.sampler = img.width;
            originalHeights.sampler = img.height;
            baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
            baseCtx.drawImage(img, 0, 0, baseCanvas.width, baseCanvas.height);
            originalImageData.base = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
            currentImageData.base = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
            paintCtx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
            originalImageData.paint = paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height);
            currentImageData.paint = paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height);
            samplerCanvas.style.display = 'block';
            samplerCtx.clearRect(0, 0, samplerCanvas.width, samplerCanvas.height);
            originalImageData.sampler = samplerCtx.getImageData(0, 0, samplerCanvas.width, samplerCanvas.height);
            currentImageData.sampler = samplerCtx.getImageData(0, 0, samplerCanvas.width, samplerCanvas.height);
            undoStack = [];
            redoStack = [];
            lastStateBeforeReset.base = null;
            lastStateBeforeReset.paint = null;
            lastStateBeforeReset.sampler = null;
            isResetToOriginal.base = false;
            isResetToOriginal.paint = false;
            isResetToOriginal.sampler = false;
            ensureInitialState(); // Ensure we have initial state
            saveState(true); // Save initial canvas state
            console.log('Image loaded - originalImageData and currentImageData set for base, paint, sampler');
            // Clear cached offscreen canvases
            ['base', 'paint', 'sampler'].forEach(key => {
                if (canvasStates[key] && canvasStates[key].offscreenCanvas) {
                    canvasStates[key].offscreenCanvas = null;
                }
            });
            // Redraw for current view mode
            if (viewMode === 'triple') {
                toggleViewMode('triple'); // Refresh triple view
            } else {
                baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
                baseCtx.drawImage(img, 0, 0, baseCanvas.width, baseCanvas.height);
                currentImageData.base = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
                paintCtx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
                currentImageData.paint = paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height);
                samplerCtx.clearRect(0, 0, samplerCanvas.width, samplerCanvas.height);
                currentImageData.sampler = samplerCtx.getImageData(0, 0, samplerCanvas.width, samplerCanvas.height);
            }
        } catch (e) {
            console.error('Error loading image:', e);
        } finally {
            document.body.style.cursor = 'default'; // Always reset cursor
        }
    };
    img.onerror = () => {
        console.error('Failed to load image');
        document.body.style.cursor = 'default'; // Reset cursor on error
    };
};
reader.readAsDataURL(file);
});

const samplerUpload = document.getElementById('samplerUpload');
samplerUpload.addEventListener('change', (e) => {
const file = e.target.files[0];
if (!file) return;
const reader = new FileReader();
reader.onload = (event) => {
    samplerImg.src = event.target.result;
    samplerImg.onload = () => {
        const maxHeight = document.getElementById('mainContainer').clientHeight - 35;
        const maxWidth = document.getElementById('canvasContainer').clientWidth;
        const aspectRatio = samplerImg.width / samplerImg.height;
        let newHeight = maxHeight;
        let newWidth = newHeight * aspectRatio;
        if (newWidth > maxWidth) {
            newWidth = maxWidth;
            newHeight = newWidth / aspectRatio;
        }
        samplerCanvas.height = newHeight;
        samplerCanvas.width = newWidth;
        originalWidths.sampler = samplerImg.width;
        originalHeights.sampler = samplerImg.height;
        samplerCtx.clearRect(0, 0, samplerCanvas.width, samplerCanvas.height);
        samplerCtx.drawImage(samplerImg, 0, 0, samplerCanvas.width, samplerCanvas.height);
        samplerCanvas.style.display = 'block'; // Ensure canvas is visible
        // Force visibility in canvas container
        const canvasContainer = document.getElementById('canvasContainer');
        canvasContainer.style.display = 'flex'; // Ensure container is active
        originalImageData.sampler = samplerCtx.getImageData(0, 0, samplerCanvas.width, samplerCanvas.height);
        currentImageData.sampler = samplerCtx.getImageData(0, 0, samplerCanvas.width, samplerCanvas.height);
        // Clear cached offscreen canvas for sampler
        if (canvasStates.sampler && canvasStates.sampler.offscreenCanvas) {
            canvasStates.sampler.offscreenCanvas = null;
        }
        saveState();
        // Force high-quality redraw for all view modes
        samplerCtx.imageSmoothingEnabled = true;
        samplerCtx.imageSmoothingQuality = 'high';
        samplerCtx.clearRect(0, 0, samplerCanvas.width, samplerCanvas.height);
        samplerCtx.drawImage(samplerImg, 0, 0, samplerCanvas.width, samplerCanvas.height);
        currentImageData.sampler = samplerCtx.getImageData(0, 0, samplerCanvas.width, samplerCanvas.height);
        // Refresh view to ensure visibility
        if (isFullView) {
            toggleFullView(); // Toggle off and back on to refresh full view
            toggleFullView();
        }
    };
};
reader.readAsDataURL(file);
});

const recordBtn = document.getElementById('recordBtn');
const recordModal = document.getElementById('recordModal');
const closeRecordBtn = document.getElementById('closeRecordBtn');
const startRecordBtn = document.getElementById('startRecordBtn');
const stopRecordBtn = document.createElement('img');
stopRecordBtn.id = 'stopRecordBtn';
stopRecordBtn.src = '/images/STAMPTOGGLE.png';
stopRecordBtn.className = 'brush-icon recording-glow';
stopRecordBtn.alt = 'Stop Recording';
stopRecordBtn.title = 'STOP RECORDING';
stopRecordBtn.style.cursor = 'pointer';
stopRecordBtn.style.pointerEvents = 'auto';
stopRecordBtn.style.zIndex = '1000';
stopRecordBtn.setAttribute('role', 'button');
stopRecordBtn.setAttribute('tabindex', '0');
recordBtn.addEventListener('click', () => {
recordModal.style.display = 'block';
});
closeRecordBtn.addEventListener('click', () => {
recordModal.style.display = 'none';
});
startRecordBtn.addEventListener('click', () => {
isRecording = true;
recordedMovements = [];
currentMovement = null;
recordModal.style.display = 'none';
const recordGrid = document.getElementById('recordGrid');
recordGrid.replaceChild(stopRecordBtn, recordBtn);
console.log('Started new recording session, movements reset, count:', recordedMovements.length);
console.log('stopRecordBtn added to DOM:', stopRecordBtn.isConnected);
});

stopRecordBtn.addEventListener('click', (e) => {
e.preventDefault();
e.stopPropagation();
console.log('stopRecordBtn clicked, attempting to end recording:', {
    isRecording,
    currentMovementExists: !!currentMovement,
    smears: currentMovement?.smears?.length || 0,
    events: currentMovement?.events?.length || 0
});
isRecording = false;
if (currentMovement) {
    endMovementRecording();
} else {
    console.warn('No currentMovement to end');
}
const recordGrid = document.getElementById('recordGrid');
recordGrid.replaceChild(recordBtn, stopRecordBtn);
console.log('Recording session ended, total movements:', recordedMovements.length);
if (recordedMovements.length > 0) {
confirm('SAVE YOUR RECORDED MOVEMENTS AS A FILE?').then(result => {
    if (result) {
        saveMovements();
    }
});
}
});
stopRecordBtn.addEventListener('touchend', (e) => {
e.preventDefault();
e.stopPropagation();
console.log('stopRecordBtn touched, attempting to end recording:', {
    isRecording,
    currentMovementExists: !!currentMovement,
    smears: currentMovement?.smears?.length || 0,
    events: currentMovement?.events?.length || 0
});
isRecording = false;
if (currentMovement) {
    endMovementRecording();
} else {
    console.warn('No currentMovement to end');
}
const recordGrid = document.getElementById('recordGrid');
recordGrid.replaceChild(recordBtn, stopRecordBtn);
console.log('Recording session ended, total movements:', recordedMovements.length);
if (recordedMovements.length > 0) {
confirm('SAVE YOUR RECORDED MOVEMENTS AS A FILE?').then(result => {
    if (result) {
        saveMovements();
    }
});
}
}, { passive: false });
stopRecordBtn.addEventListener('keydown', (e) => {
if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    console.log('stopRecordBtn keydown (Enter/Space), triggering click');
    stopRecordBtn.click();
}
});


const printerBtn = document.getElementById('printerBtn');
const printerModal = document.getElementById('printerModal');
const closePrinterBtn = document.getElementById('closePrinterBtn');
const printCount = document.getElementById('printCount');
const printValue = document.getElementById('printValue');
const yesPrintBtn = document.getElementById('yesPrintBtn');
const noPrintBtn = document.getElementById('noPrintBtn');
const cancelPrintBtn = document.getElementById('cancelPrintBtn');
const printProgressContainer = document.getElementById('printProgressContainer');
const printProgressBar = document.getElementById('printProgressBar');
const printStatus = document.getElementById('printStatus');
let isPrinting = false;
let printTimeouts = [];
printerBtn.addEventListener('click', () => {
    printerModal.style.display = 'block';
    printProgressContainer.style.display = 'none';
    printStatus.style.display = 'none';
    cancelPrintBtn.style.display = 'none';
    yesPrintBtn.style.display = 'inline';
    noPrintBtn.style.display = 'inline';
});
closePrinterBtn.addEventListener('click', () => {
    printerModal.style.display = 'none';
});
printCount.addEventListener('input', () => printValue.textContent = printCount.value);
noPrintBtn.addEventListener('click', () => {
    printerModal.style.display = 'none';
});

const randomizerBtn = document.getElementById('randomizerBtn');
const randomizerModal = document.getElementById('randomizerModal');
const closeRandomizerBtn = document.getElementById('closeRandomizerBtn');
const diceRolls = document.getElementById('diceRolls');
const diceValue = document.getElementById('diceValue');
const rockNRollBtn = document.getElementById('rockNRollBtn');
const stopResumeBtn = document.getElementById('stopResumeBtn');
const reverseBtn = document.getElementById('reverseBtn');
const forwardBtn = document.getElementById('forwardBtn');
const progressBarContainer = document.getElementById('progressBarContainer');
const progressBar = document.getElementById('progressBar');

diceRolls.addEventListener('input', () => {
diceValue.textContent = diceRolls.value;
console.log(`diceRolls updated to: ${diceRolls.value}`);
});

randomizerBtn.addEventListener('click', () => {
isRolling = false;
rollTimeouts.forEach(clearTimeout);
rollTimeouts = [];
rollHistory = { base: [], paint: [], sampler: [] };
completed = 0;
progressBar.style.width = '0%';
stopResumeBtn.textContent = 'Stop';
stopResumeBtn.style.display = 'none';
reverseBtn.style.display = 'none';
forwardBtn.style.display = 'none';
progressBarContainer.style.display = 'none';
rockNRollBtn.disabled = false;
randomizerModal.style.display = 'block';
// Set default checkbox states
document.getElementById('randomizeBase').checked = true;
document.getElementById('randomizePaint').checked = false;
document.getElementById('randomizeSampler').checked = false;
console.log('Randomizer modal opened: Base checked, Collage and Second unchecked');
// Highlight if movements are loaded
if (recordedMovements.length > 0) {
    loadBrushStrokeBtn.classList.add('active');
    console.log('Randomizer opened with loaded movements:', recordedMovements.length);
} else {
    loadBrushStrokeBtn.classList.remove('active');
}
});
closeRandomizerBtn.addEventListener('click', (e) => {
e.preventDefault();
e.stopPropagation();
if (isRolling) {
    console.log('Randomizer is running, preventing modal close');
    return;
}
randomizerModal.style.display = 'none';
console.log('Closed randomizerModal via click');
});

closeRandomizerBtn.addEventListener('touchend', (e) => {
e.preventDefault();
e.stopPropagation();
if (isRolling) {
    console.log('Randomizer is running, preventing modal close');
    return;
}
randomizerModal.style.display = 'none';
console.log('Closed randomizerModal via touch');
}, { passive: false });

closeRandomizerBtn.addEventListener('keydown', (e) => {
if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    e.stopPropagation();
    if (isRolling) {
        console.log('Randomizer is running, preventing modal close');
        return;
    }
    randomizerModal.style.display = 'none';
    console.log('Closed randomizerModal via keyboard');
}
});



function yesPrintBtnHandler() {
    const count = parseInt(printCount.value);
    const targets = ['base', 'paint', 'sampler'].filter(id => originalImageData[id]);
    if (!targets.length) {
        alert('Load an image first!');
        return;
    }
    isPrinting = true;
    printTimeouts = [];
    yesPrintBtn.style.display = 'none';
    noPrintBtn.style.display = 'none';
    cancelPrintBtn.style.display = 'inline';
    printProgressContainer.style.display = 'block';
    printProgressBar.style.width = '0%';
    let completedPrints = 0;

    for (let i = 0; i < count; i++) {
        const timeout = setTimeout(() => {
            if (!isPrinting) return;
            targets.forEach(canvasId => {
                const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
                ctx.putImageData(originalImageData[canvasId], 0, 0);
                applyRandomMovements(canvasId);
                const link = document.createElement('a');
                link.download = `${canvasId}_gen_${i + 1}.png`;
                link.href = ctx.canvas.toDataURL('image/png', 1.0);
                link.click();
            });
            completedPrints++;
            printProgressBar.style.width = `${(completedPrints / count) * 100}%`;
            if (completedPrints === count) {
                printStatus.style.display = 'block';
                cancelPrintBtn.style.display = 'none';
                setTimeout(() => printerModal.style.display = 'none', 2000);
            }
        }, i * 50);
        printTimeouts.push(timeout);
    }
}
yesPrintBtn.addEventListener('click', yesPrintBtnHandler);
cancelPrintBtn.addEventListener('click', () => {
    isPrinting = false;
    printTimeouts.forEach(clearTimeout);
    printTimeouts = [];
    printerModal.style.display = 'none';
});

const movementUpload = document.getElementById('movementUpload');
function saveMovements() {
if (!recordedMovements || recordedMovements.length === 0) {
    console.warn('No movements to save: recordedMovements is empty');
    alert('No recorded movements to save! Try recording an effect or drag first.');
    return;
}
console.log('Preparing to save movements:', {
    totalMovements: recordedMovements.length,
    totalEvents: recordedMovements.reduce((sum, m) => sum + (m.events?.length || 0), 0),
    totalSmears: recordedMovements.reduce((sum, m) => sum + (m.smears?.length || 0), 0),
    movementsOverview: recordedMovements.map((m, i) => ({
        index: i,
        smears: m.smears?.length || 0,
        events: m.events?.length || 0,
        activeEffects: m.activeEffects || [],
        targetCanvas: m.targetCanvas
    }))
});
try {
    const movementsToSave = recordedMovements.map((move, index) => {
        const events = Array.isArray(move.events) ? move.events.filter(e => e && e.type && e.data && typeof e.data === 'object').map(e => ({
            type: e.type,
            data: {
                effect: e.data.effect || null,
                state: e.data.state != null ? e.data.state : null,
                timestamp: Number(e.data.timestamp?.toFixed(2) || 0),
                fingerRole: e.data.fingerRole || 'unknown',
                phase: e.data.phase != null ? e.data.phase : undefined,
                activeEffects: Array.isArray(e.data.activeEffects) ? [...e.data.activeEffects] : [] // Include active effects
            },
            timestamp: Number(e.timestamp?.toFixed(2) || 0),
            sequence: e.sequence || 0
        })) : [];
        const smears = Array.isArray(move.smears) ? move.smears.filter(s => s && typeof s === 'object' && s.lastX != null && s.currentX != null).map((s, seq) => ({
            lastX: Number(s.lastX?.toFixed(2)),
            lastY: Number(s.lastY?.toFixed(2)),
            currentX: Number(s.currentX?.toFixed(2)),
            currentY: Number(s.currentY?.toFixed(2)),
            size: Number((s.size || 200).toFixed(1)),
            rotation: Number((s.rotation || 0).toFixed(3)),
            cloneSize: Number((s.cloneSize || s.size || 200).toFixed(1)),
            cloneRotation: Number((s.cloneRotation || 0).toFixed(3)),
            paintMode: !!s.paintMode,
            paintColor: s.paintColor || { r: 255, g: 0, b: 0 },
            flipHorizontal: !!s.flipHorizontal,
            flipVertical: !!s.flipVertical,
            canvasId: s.canvasId || 'base',
            brushShape: s.brushShape || 'box',
            timestamp: Number((s.timestamp || 0).toFixed(2)),
            sequence: seq,
            duration: Number((s.duration || 0).toFixed(2)),
            isTeleportClone: !!s.isTeleportClone,
            stickerSlot: s.stickerSlot || null,
            fingerId: s.fingerId || null,
            activeEffects: Array.isArray(s.activeEffects) ? [...s.activeEffects] : [], // Include active effects
            anchorPoints: s.anchorPoints || undefined
        })) : [];
        console.log(`Saving movement ${index}:`, {
            smears: smears.length,
            events: events.length,
            activeEffects: move.activeEffects || [],
            targetCanvas: move.targetCanvas,
            eventsContent: events.map(e => ({
                type: e.type,
                effect: e.data.effect,
                state: e.data.state,
                timestamp: e.data.timestamp,
                activeEffects: e.data.activeEffects
            }))
        });
        return {
            index,
            shape: move.shape || 'box',
            size: Number((move.size || baseBrushSize || 200).toFixed(1)),
            rotation: Number((move.rotation || 0).toFixed(3)),
            cloneSize: Number((move.cloneSize || move.size || baseBrushSize || 200).toFixed(1)),
            cloneRotation: Number((move.cloneRotation || 0).toFixed(3)),
            paintMode: !!move.paintMode,
            paintColor: move.paintColor || { r: 255, g: 0, b: 0 },
            flipHorizontal: !!move.flipHorizontal,
            flipVertical: !!move.flipVertical,
            stickerSlot: move.stickerSlot || null,
            effects: move.effects ? { ...move.effects } : {},
            activeEffects: Array.isArray(move.activeEffects) ? [...move.activeEffects] : [], // Include active effects
            smears,
            events,
            brushState: move.brushState ? { ...move.brushState } : {},
            targetCanvas: move.targetCanvas || 'base',
            startTime: Number((move.startTime || performance.now()).toFixed(2)),
            duration: Number((move.duration || 0).toFixed(2)),
            eventCount: events.length
        };
    });
    const jsonString = JSON.stringify(movementsToSave, null, 2);
    console.log('JSON size:', jsonString.length, 'bytes, content (preview):', jsonString.slice(0, 1000) + (jsonString.length > 1000 ? '...' : ''));
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'my-movements.json';
    link.click();
    URL.revokeObjectURL(url);
    console.log(`Saved ${movementsToSave.length} movements, ${movementsToSave.reduce((sum, m) => sum + m.events.length, 0)} events`);
} catch (error) {
    console.error('Error saving movements:', error);
    alert('Failed to save movements. Check the console for details.');
}
}
movementUpload.addEventListener('change', (e) => {
const file = e.target.files[0];
if (!file) {
    console.log('No file selected for movement upload');
    return;
}
const reader = new FileReader();
function validateMovementData(data) {
const maxFileSize = 5 * 1024 * 1024; // 5MB
const maxMovements = 1000;
const maxSmears = 10000;

if (typeof data === 'string' && data.length > maxFileSize) {
    throw new Error('File too large');
}

const movements = Array.isArray(data) ? data : [data];

if (movements.length > maxMovements) {
    throw new Error(`Too many movements. Maximum ${maxMovements} allowed.`);
}

for (const move of movements) {
    if (!move || typeof move !== 'object') continue;
    
    // Validate structure
    if (move.smears && move.smears.length > maxSmears) {
        throw new Error(`Too many smears in movement. Maximum ${maxSmears} allowed.`);
    }
    
    // Sanitize object to prevent prototype pollution
    const cleanMove = Object.create(null);
    const allowedProps = ['index', 'shape', 'size', 'rotation', 'smears', 'events', 'targetCanvas'];
    for (const prop of allowedProps) {
        if (move.hasOwnProperty(prop)) {
            cleanMove[prop] = move[prop];
        }
    }
    
    // Validate data types
    if (cleanMove.size && (typeof cleanMove.size !== 'number' || cleanMove.size < 1 || cleanMove.size > 1000)) {
        cleanMove.size = 50; // Safe default
    }
}

return movements;
}

reader.onload = (event) => {
try {
    const jsonText = event.target.result;
    if (jsonText.length > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('JSON file too large');
    }
    
    const parsedData = JSON.parse(jsonText);
    recordedMovements = validateMovementData(parsedData);
        if (recordedMovements.length === 0) {
            console.error('No movements in JSON:', recordedMovements);
            alert('Failed to load movements: JSON is empty.');
            recordedMovements = [];
            loadBrushStrokeBtn.classList.remove('active');
            return;
        }
        recordedMovements = recordedMovements.filter((move, index) => {
            if (!move.smears && !move.events) {
                console.warn(`Movement ${index} missing smears and events:`, move);
                return false;
            }
            const targetCanvas = move.targetCanvas || 'base';
            const canvas = targetCanvas === 'base' ? baseCanvas : targetCanvas === 'paint' ? paintCanvas : samplerCanvas;
            if (!canvas || canvas.width === 0 || canvas.height == 0) {
                console.warn(`Invalid target canvas ${targetCanvas} for movement ${index}:`, move);
                return false;
            }
            const validBrushes = ['box', 'circle', 'rectangle', 'triangle', 'sweeper', 'oilbarrel', 'tv', 'negative', 'melt', 'brokenScreen', 'aestheticLines', 'jazzScatter', 'stickerMode', 'squareSelection', 'basquiatSelection', 'circleSelection'];
            if (!validBrushes.includes(move.shape)) {
                console.warn(`Invalid brush shape ${move.shape} for movement ${index}, setting to box:`, move);
                move.shape = 'box';
                move.brushState = move.brushState || {};
                move.brushState.shape = 'box';
            }
            return true;
        });
        if (recordedMovements.length === 0) {
            console.error('No valid movements after filtering');
            alert('Failed to load movements: No valid movements found.');
            loadBrushStrokeBtn.classList.remove('active');
            return;
        }
        console.log(`Successfully loaded ${recordedMovements.length} movements:`);
        recordedMovements.forEach((move, index) => {
            console.log(`Movement ${index}: shape=${move.shape}, smears=${move.smears?.length || 0}, events=${move.events?.length || 0}, targetCanvas=${move.targetCanvas}, stickerSlot=${move.stickerSlot}, flipHorizontal=${move.flipHorizontal}, flipVertical=${move.flipVertical}`);
        });
        alert(`Loaded ${recordedMovements.length} movement(s)! Use the randomizer to play them.`);
        loadBrushStrokeBtn.classList.add('active');
    } catch (error) {
        console.error('Error parsing JSON:', error);
        alert('Failed to load movements: Invalid JSON format.');
        recordedMovements = [];
        loadBrushStrokeBtn.classList.remove('active');
    }
};
reader.onerror = () => {
    console.error('Error reading file');
    alert('Error reading the JSON file.');
    recordedMovements = [];
    loadBrushStrokeBtn.classList.remove('active');
};
reader.readAsText(file);
});
const loadBrushStrokeBtn = document.getElementById('loadBrushStrokeBtn');
// Ensure debounce is defined (already in your codebase)
function debounce(func, wait) {
let timeout;
return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
};
}

// Define the load brush stroke logic
const loadBrushStrokes = () => {
console.log('Load Brush Stroke button triggered');
const movementUpload = document.getElementById('movementUpload');
movementUpload.click();
// Ensure active class is removed after trigger
loadBrushStrokeBtn.classList.remove('active');
console.log('loadBrushStrokeBtn active class removed after trigger');
};

// Debounced handler for reliable interactions
const debouncedLoadBrushStrokes = debounce(loadBrushStrokes, 300);

// Helper to reset button state
const resetButtonState = () => {
loadBrushStrokeBtn.classList.remove('active');
// Update has-movements based on recordedMovements
if (recordedMovements.length > 0) {
    loadBrushStrokeBtn.classList.add('has-movements');
} else {
    loadBrushStrokeBtn.classList.remove('has-movements');
}
console.log('loadBrushStrokeBtn state reset: classList:', loadBrushStrokeBtn.classList.toString());
};

// Update loadBrushStrokeBtn event listeners
loadBrushStrokeBtn.addEventListener('click', (e) => {
e.preventDefault();
e.stopPropagation();
console.log('loadBrushStrokeBtn clicked');
loadBrushStrokeBtn.classList.add('active');
debouncedLoadBrushStrokes();
setTimeout(() => loadBrushStrokeBtn.classList.remove('active'), 200);
});

loadBrushStrokeBtn.addEventListener('touchstart', (e) => {
e.preventDefault();
e.stopPropagation();
console.log('loadBrushStrokeBtn touchstart, Touch ID:', e.touches[0]?.identifier);
loadBrushStrokeBtn.classList.add('active');
}, { passive: false });

loadBrushStrokeBtn.addEventListener('touchend', (e) => {
e.preventDefault();
e.stopPropagation();
console.log('loadBrushStrokeBtn touchend, Touch ID:', e.changedTouches[0]?.identifier);
debouncedLoadBrushStrokes();
setTimeout(() => loadBrushStrokeBtn.classList.remove('active'), 200);
}, { passive: false });

loadBrushStrokeBtn.addEventListener('touchcancel', (e) => {
e.preventDefault();
e.stopPropagation();
console.log('loadBrushStrokeBtn touchcancel');
loadBrushStrokeBtn.classList.remove('active');
}, { passive: false });

// Add keyboard support
loadBrushStrokeBtn.setAttribute('role', 'button');
loadBrushStrokeBtn.setAttribute('tabindex', '0');
loadBrushStrokeBtn.addEventListener('keydown', (e) => {
if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    console.log('loadBrushStrokeBtn keydown (Enter/Space)');
    loadBrushStrokeBtn.classList.add('active');
    debouncedLoadBrushStrokes();
    setTimeout(() => loadBrushStrokeBtn.classList.remove('active'), 200);
}
});

// Update randomizerBtn to use has-movements
randomizerBtn.addEventListener('click', () => {
isRolling = false;
rollTimeouts.forEach(clearTimeout);
rollTimeouts = [];
rollHistory = { base: [], paint: [], sampler: [] };
completed = 0;
progressBar.style.width = '0%';
stopResumeBtn.textContent = 'Stop';
stopResumeBtn.style.display = 'none';
reverseBtn.style.display = 'none';
forwardBtn.style.display = 'none';
progressBarContainer.style.display = 'none';
rockNRollBtn.disabled = false;
randomizerModal.style.display = 'block';
// Update button state
resetButtonState();
console.log('Randomizer opened, recorded movements:', recordedMovements.length);
});

// Update closeRandomizerBtn to reset state
closeRandomizerBtn.addEventListener('click', (e) => {
e.preventDefault();
resetButtonState();
if (isRolling) {
    console.log('Randomizer is running, preventing modal close');
    return;
}
randomizerModal.style.display = 'none';
console.log('Closed randomizerModal via click');
});

closeRandomizerBtn.addEventListener('touchend', (e) => {
e.preventDefault();
resetButtonState();
if (isRolling) {
    console.log('Randomizer is running, preventing modal close');
    return;
}
randomizerModal.style.display = 'none';
console.log('Closed randomizerModal via touch');
}, { passive: false });

// Update movementUpload to reset state
movementUpload.addEventListener('change', (e) => {
resetButtonState();
const file = e.target.files[0];
if (!file) {
    console.log('No file selected for movement upload');
    return;
}
const reader = new FileReader();
reader.onload = (event) => {
    try {
        const parsedData = JSON.parse(event.target.result);
        console.log('Raw parsed JSON:', parsedData);
        recordedMovements = Array.isArray(parsedData) ? parsedData : [parsedData];
        if (recordedMovements.length === 0) {
            console.error('No movements in JSON:', recordedMovements);
            alert('Failed to load movements: JSON is empty.');
            recordedMovements = [];
            loadBrushStrokeBtn.classList.remove('has-movements');
            return;
        }
        recordedMovements = recordedMovements.filter((move, index) => {
            if (!move.smears && !move.events) {
                console.warn(`Movement ${index} missing smears and events:`, move);
                return false;
            }
            const targetCanvas = move.targetCanvas || 'base';
            const canvas = targetCanvas === 'base' ? baseCanvas : targetCanvas === 'paint' ? paintCanvas : samplerCanvas;
            if (!canvas || canvas.width === 0 || canvas.height == 0) {
                console.warn(`Invalid target canvas ${targetCanvas} for movement ${index}:`, move);
                return false;
            }
            const validBrushes = ['box', 'circle', 'rectangle', 'triangle', 'sweeper', 'oilbarrel', 'tv', 'negative', 'melt', 'brokenScreen', 'aestheticLines', 'jazzScatter', 'stickerMode', 'squareSelection', 'basquiatSelection'];
            if (!validBrushes.includes(move.shape)) {
                console.warn(`Invalid brush shape ${move.shape} for movement ${index}, setting to box:`, move);
                move.shape = 'box';
                move.brushState = move.brushState || {};
                move.brushState.shape = 'box';
            }
            return true;
        });
        if (recordedMovements.length === 0) {
            console.error('No valid movements after filtering');
            alert('Failed to load movements: No valid movements found.');
            loadBrushStrokeBtn.classList.remove('has-movements');
            return;
        }
        console.log(`Successfully loaded ${recordedMovements.length} movements:`);
        recordedMovements.forEach((move, index) => {
            console.log(`Movement ${index}: shape=${move.shape}, smears=${move.smears?.length || 0}, events=${move.events?.length || 0}, targetCanvas=${move.targetCanvas}, stickerSlot=${move.stickerSlot}, flipHorizontal=${move.flipHorizontal}, flipVertical=${move.flipVertical}`);
        });
        alert(`Loaded ${recordedMovements.length} movement(s)! Use the randomizer to play them.`);
        loadBrushStrokeBtn.classList.add('has-movements');
    } catch (error) {
        console.error('Error parsing JSON:', error);
        alert('Failed to load movements: Invalid JSON format.');
        recordedMovements = [];
        loadBrushStrokeBtn.classList.remove('has-movements');
    }
};
reader.onerror = () => {
    console.error('Error reading file');
    alert('Error reading the JSON file.');
    recordedMovements = [];
    loadBrushStrokeBtn.classList.remove('has-movements');
};
reader.readAsText(file);
});

function replayRecordedMovement(canvasId, offsetX = 0, offsetY = 0, instantStrokes = false) {
if (recordedMovements.length === 0) {
    console.error('No recorded movements for', canvasId);
    return Promise.resolve(false);
}
const move = recordedMovements[Math.floor(Math.random() * recordedMovements.length)];
if (!move || (!move.smears.length && !move.events.length)) {
    console.error('Invalid movement:', move);
    return Promise.resolve(false);
}
const targetCanvas = move.targetCanvas || 'base';
if (canvasId !== targetCanvas) {
    return Promise.resolve(true);
}

console.log(`Replaying movement on ${canvasId}: shape=${move.shape}, smears=${move.smears.length}, events=${move.events?.length || 0}, duration=${move.duration}ms, offset=(${offsetX}, ${offsetY}), instant=${instantStrokes}`);

const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
const canvas = canvasId === 'base' ? baseCanvas : canvasId === 'paint' ? paintCanvas : samplerCanvas;

const prevState = {
    base: baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height),
    paint: paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height),
    sampler: samplerCtx.getImageData(0, 0, samplerCanvas.width, samplerCanvas.height)
};

currentImageData[canvasId] = ctx.getImageData(0, 0, canvas.width, canvas.height);

const initialState = move.brushState || {};
brushShape = initialState.shape || move.shape || 'box';
brushSize = initialState.size || move.size || baseBrushSize;
brushRotation = initialState.rotation || move.rotation || 0;
cloneBrushSize = initialState.cloneSize || move.cloneSize || brushSize;
cloneBrushRotation = initialState.cloneRotation || move.cloneRotation || 0;
isPaintMode = initialState.paintMode !== undefined ? initialState.paintMode : move.paintMode || false;
paintColor = initialState.paintColor || move.paintColor || { r: 255, g: 0, b: 0 };
isFlipHorizontalActive = initialState.flipHorizontal !== undefined ? initialState.flipHorizontal : move.flipHorizontal || false;
isFlipVerticalActive = initialState.flipVertical !== undefined ? initialState.flipVertical : move.flipVertical || false;
updateBrushSize(brushSize);
const initialEffects = move.effects || {};
Object.keys(initialEffects).forEach(effect => toggleEffect(effect, initialEffects[effect], 'playback'));
console.log(`Initial state: shape=${brushShape}, size=${brushSize}, rotation=${brushRotation}, cloneSize=${cloneBrushSize}, cloneRotation=${cloneBrushRotation}, paintMode=${isPaintMode}, flipHorizontal=${isFlipHorizontalActive}, flipVertical=${isFlipVerticalActive}, stickerSlot=${initialState.stickerSlot}, effects=`, Object.keys(initialEffects).filter(k => initialEffects[k]));

const targetCanvasId = move.targetCanvas || 'base';
const srcCanvas = targetCanvasId === 'base' ? baseCanvas : targetCanvasId === 'paint' ? paintCanvas : samplerCanvas;
const xScale = canvas.width / srcCanvas.width;
const yScale = canvas.height / srcCanvas.height;

const allEvents = [
    ...(move.smears || []).map(s => ({ type: 'smear', data: s, timestamp: s.timestamp || 0 })),
    ...(move.events || []).map(e => ({ type: e.type, data: e.data, timestamp: e.data.timestamp || 0 }))
].sort((a, b) => a.timestamp - b.timestamp);

let lastEffects = { ...initialEffects };
let lastSize = brushSize;
let lastRotation = brushRotation;
let lastCloneSize = cloneBrushSize;
let lastCloneRotation = cloneBrushRotation;
let lastPaintMode = isPaintMode;
let lastPaintColor = { ...paintColor };
let lastFlipHorizontal = isFlipHorizontalActive;
let lastFlipVertical = isFlipVerticalActive;
let activeEffectsState = new Set();

// Helper function to toggle UI button
function toggleEffectButton(effect, state) {
    const keyLabel = keyLabels.find(k => k.effect === effect);
    if (!keyLabel) {
        console.warn(`No keyLabel found for effect: ${effect}`);
        return;
    }
    const key = keyLabel.key.toLowerCase();
    const keyElement = document.querySelector(`#virtualKeyboard .${keyLabel.class}[data-effect="${effect}"]`);
    if (!keyElement) {
        console.warn(`No UI element found for effect: ${effect}, selector=#virtualKeyboard .${keyLabel.class}[data-effect="${effect}"]`);
        return;
    }
    keyElement.classList.toggle('active', state);
    console.log(`Toggled UI button for effect ${effect}: active=${state}, key=${key}, elementClasses=${keyElement.classList.toString()}`);
    if (state) {
        activeEffectsState.add(key);
        activeEffects.add(key);
    } else {
        activeEffectsState.delete(key);
        activeEffects.delete(key);
    }
}

// Log initial keyboard state
console.log('Initial keyboard elements:', Array.from(keyboardContainer.children).map(el => ({
    effect: el.dataset.effect,
    classList: el.classList.toString(),
    active: el.classList.contains('active')
})));

return new Promise(resolve => {
    function processEvent(event, index) {
        if (!isRolling) {
            console.log('Replay stopped: isRolling is false, index=', index, 'event=', event);
            return false;
        }
        try {
            console.log(`Processing event ${index + 1}/${allEvents.length}: type=${event.type}, timestamp=${event.timestamp}ms`);
            if (event.type === 'effect') {
                const effectData = event.data;
                if (effectData.phase !== undefined) {
                    if (effectData.effect === 'neon') neonPhase = effectData.phase;
                    if (effectData.effect === 'flickerNegative') flickerPhase = effectData.phase;
                    if (effectData.effect === 'chromaticShift') vhsPhase = effectData.phase;
                    if (effectData.effect === 'emoji') emojiPhase = effectData.phase;
                }
                toggleEffect(effectData.effect, effectData.state, 'playback');
                toggleEffectButton(effectData.effect, effectData.state);
                lastEffects[effectData.effect] = effectData.state;
                console.log(`Replayed effect: ${effectData.effect} = ${effectData.state}, phase=${effectData.phase || 'N/A'}, activeEffects:`, [...activeEffectsState]);
            } else if (event.type === 'smear') {
const smear = event.data;
const validBrushes = ['box', 'circle', 'rectangle', 'triangle', 'sweeper', 'oilbarrel', 'tv', 'negative', 'melt', 'brokenScreen', 'aestheticLines', 'jazzScatter', 'stickerMode', 'squareSelection', 'basquiatSelection'];
brushShape = validBrushes.includes(smear.brushShape) ? smear.brushShape : 'box';
if (smear.size && !move.events.some(e => e.type === 'size')) {
    brushSize = smear.size;
    updateBrushSize(brushSize);
    lastSize = brushSize;
}
if (smear.rotation !== undefined && smear.rotation !== lastRotation) {
    brushRotation = smear.rotation;
    lastRotation = brushRotation;
} else if (smear.rotation === undefined) {
    brushRotation = 0;
    lastRotation = 0;
}
if (smear.cloneSize !== lastCloneSize) {
    cloneBrushSize = smear.cloneSize || lastCloneSize;
    lastCloneSize = cloneBrushSize;
}
if (smear.cloneRotation !== lastCloneRotation) {
    cloneBrushRotation = smear.cloneRotation || lastCloneRotation;
    lastCloneRotation = cloneBrushRotation;
}
if (smear.paintMode !== lastPaintMode) {
    isPaintMode = smear.paintMode !== undefined ? smear.paintMode : lastPaintMode;
    lastPaintMode = isPaintMode;
}
if (smear.paintColor && (smear.paintColor.r !== lastPaintColor.r || smear.paintColor.g !== lastPaintColor.g || smear.paintColor.b !== lastPaintColor.b)) {
    paintColor = { ...smear.paintColor };
    lastPaintColor = { ...paintColor };
}
if (smear.flipHorizontal !== lastFlipHorizontal) {
    isFlipHorizontalActive = smear.flipHorizontal !== undefined ? smear.flipHorizontal : lastFlipHorizontal;
    lastFlipHorizontal = isFlipHorizontalActive;
}
if (smear.flipVertical !== lastFlipVertical) {
    isFlipVerticalActive = smear.flipVertical !== undefined ? smear.flipVertical : lastFlipVertical;
    lastFlipVertical = isFlipVerticalActive;
}
// Apply active effects from smear record
if (smear.activeEffects && Array.isArray(smear.activeEffects)) {
    const currentEffects = new Set(smear.activeEffects);
    activeEffects.forEach(key => {
        const effect = keyLabels.find(k => k.key.toLowerCase() === key)?.effect;
        if (effect && !currentEffects.has(effect) && lastEffects[effect]) {
            toggleEffect(effect, false, 'playback');
            const keyElement = Array.from(keyboardContainer.children).find(el => el.dataset.effect === effect);
            if (keyElement) keyElement.classList.remove('active');
            lastEffects[effect] = false;
            console.log(`Disabled effect ${effect} for smear ${index}`);
        }
    });
    smear.activeEffects.forEach(effect => {
        const key = keyLabels.find(k => k.effect === effect)?.key.toLowerCase();
        if (key && !activeEffects.has(key)) {
            activeEffects.add(key);
            toggleEffect(effect, true, 'playback');
            const keyElement = Array.from(keyboardContainer.children).find(el => el.dataset.effect === effect);
            if (keyElement) keyElement.classList.add('active');
            lastEffects[effect] = true;
            console.log(`Enabled effect ${effect} for smear ${index}`);
        }
    });
    console.log(`Smear activeEffects applied: ${smear.activeEffects.join(', ')}, activeEffects set:`, [...activeEffects]);
}
lastX = smear.lastX !== undefined ? smear.lastX * xScale + offsetX : lastX;
lastY = smear.lastY !== undefined ? smear.lastY * yScale + offsetY : lastY;
const currentX = smear.currentX * xScale + offsetX;
const currentY = smear.currentY * yScale + offsetY;
if (lastX === currentX && lastY === currentY) {
    console.log(`Skipped smear with no movement: (${lastX}, ${lastY})`);
    return true;
}
if (smear.anchorPoints) {
    anchorPoints = smear.anchorPoints.map(p => ({
        x: p.x * xScale + offsetX,
        y: p.y * yScale + offsetY,
        target: canvas
    }));
}
if (smear.brushShape === 'sweeper' || smear.brushShape === 'oilbarrel') {
if (smear.anchorPoints) {
    // Check if this is sweeper and not instant mode
console.log(`SWEEPER ANIMATION CHECK: smear.brushShape="${smear.brushShape}", instantStrokes=${instantStrokes}`);
    if (smear.brushShape === 'sweeper' && !instantStrokes) {
console.log(`ANIMATING sweeper in replay - adding delay`);
// Use setTimeout instead of await
setTimeout(() => {
    drawSweeperLines(canvasId);
    console.log(`Replay sweeper animation completed`);
}, 100); // 100ms delay before drawing
} else {
// Instant mode or oilbarrel - draw immediately
drawSweeperLines(canvasId);
}
    console.log(`Replayed ${smear.brushShape} smear with ${smear.anchorPoints.length} anchors: (${lastX}, ${lastY}) to (${currentX}, ${currentY}), size=${brushSize}, rotation=${brushRotation}, effects=${smear.activeEffects || 'none'}`);
}
} else if (smear.brushShape === 'aestheticLines') {
// FIXED: Better handling for aestheticLines with anchor points
if (smear.anchorPoints && smear.anchorPoints.length >= 2) {
    // Set up anchor points for line drawing
    anchorPoints = smear.anchorPoints.map(p => ({
        x: Math.max(0, Math.min(canvas.width - 1, p.x * xScale + offsetX)),
        y: Math.max(0, Math.min(canvas.height - 1, p.y * yScale + offsetY)),
        lastX: Math.max(0, Math.min(canvas.width - 1, (p.lastX !== undefined ? p.lastX : p.x) * xScale + offsetX)),
        lastY: Math.max(0, Math.min(canvas.height - 1, (p.lastY !== undefined ? p.lastY : p.y) * yScale + offsetY)),
        target: canvas,
        id: p.fingerId || `replay_aesthetic_${index}`
    }));
    
    // Set up mouseAnchorStart if present
    if (smear.mouseAnchorStart) {
        mouseAnchorStart = {
            x: smear.mouseAnchorStart.x * xScale + offsetX,
            y: smear.mouseAnchorStart.y * yScale + offsetY,
            target: canvas
        };
    } else if (anchorPoints.length >= 2) {
        mouseAnchorStart = {
            x: anchorPoints[0].x,
            y: anchorPoints[0].y,
            target: canvas
        };
    }
    
    // Draw the aesthetic line
    drawAestheticLines(canvasId);
    console.log(`Replayed aestheticLines LINE: anchor points=${smear.anchorPoints.length}`);
} else {
    // Single point mode - use regular smear
    smearPixels(currentX, currentY, canvasId);
    console.log(`Replayed aestheticLines BRUSH: (${lastX}, ${lastY}) to (${currentX}, ${currentY})`);
}
} else if (smear.brushShape === 'stickerMode' && smear.stickerSlot) {
    if (stickerImages[smear.stickerSlot]) {
        smearPixels(currentX, currentY, canvasId, undefined, undefined, smear.stickerSlot);
        console.log(`Replayed stickerMode smear with slot ${smear.stickerSlot}: (${lastX}, ${lastY}) to (${currentX}, ${currentY}), size=${brushSize}, rotation=${brushRotation}, effects=${smear.activeEffects || 'none'}`);
    } else {
        console.warn(`Sticker slot ${smear.stickerSlot} not loaded, skipping smear`);
    }
} else if (smear.brushShape === 'squareSelection' || smear.brushShape === 'basquiatSelection') {
    console.log(`Skipping selection smear for playback: (${lastX}, ${lastY}) to (${currentX}, ${currentY})`);
    return true;
} else {
    smearPixels(currentX, currentY, canvasId);
    console.log(`Replayed ${smear.brushShape} smear: (${lastX}, ${lastY}) to (${currentX}, ${currentY}), size=${brushSize}, rotation=${brushRotation}, effects=${smear.activeEffects || 'none'}`);
}
} else if (event.type === 'size') {
                brushSize = event.data.size;
                updateBrushSize(brushSize);
                lastSize = brushSize;
                console.log(`Replayed size change: ${brushSize}, timestamp=${event.timestamp}ms`);
            } else if (event.type === 'rotation') {
                brushRotation = event.data.rotation || 0;
                lastRotation = brushRotation;
                console.log(`Replayed rotation: ${brushRotation}`);
            } else if (event.type === 'shape') {
                const validBrushes = ['box', 'circle', 'rectangle', 'triangle', 'sweeper', 'oilbarrel', 'tv', 'negative', 'melt', 'brokenScreen', 'aestheticLines', 'jazzScatter', 'stickerMode', 'squareSelection', 'basquiatSelection'];
                brushShape = validBrushes.includes(event.data.shape) ? event.data.shape : 'box';
                console.log(`Replayed shape change: ${brushShape}`);
            }
            currentImageData[canvasId] = ctx.getImageData(0, 0, canvas.width, canvas.height);
            return true;
        } catch (error) {
            console.error(`Error processing event ${index + 1}:`, error, event);
            return true;
        }
    }

    function processNonSmearEvent(event) {
        if (!isRolling) return false;
        if (event.type === 'effect') {
            const effectData = event.data;
            if (effectData.phase !== undefined) {
                if (effectData.effect === 'neon') neonPhase = effectData.phase;
                if (effectData.effect === 'flickerNegative') flickerPhase = effectData.phase;
                if (effectData.effect === 'chromaticShift') vhsPhase = effectData.phase;
                if (effectData.effect === 'emoji') emojiPhase = effectData.phase;
            }
            toggleEffect(effectData.effect, effectData.state, 'playback');
            toggleEffectButton(effectData.effect, effectData.state);
            lastEffects[effectData.effect] = effectData.state;
            console.log(`Processed non-smear effect: ${effectData.effect} = ${effectData.state}, phase=${effectData.phase || 'N/A'}, activeEffects:`, [...activeEffectsState]);
        } else if (event.type === 'size') {
            brushSize = event.data.size;
            updateBrushSize(brushSize);
            lastSize = brushSize;
            console.log(`Processed non-smear size change: ${brushSize}, timestamp=${event.timestamp}ms`);
        } else if (event.type === 'rotation') {
            brushRotation = event.data.rotation || 0;
            lastRotation = brushRotation;
            console.log(`Processed non-smear rotation: ${brushRotation}`);
        } else if (event.type === 'shape') {
            const validBrushes = ['box', 'circle', 'rectangle', 'triangle', 'sweeper', 'oilbarrel', 'tv', 'negative', 'melt', 'brokenScreen', 'aestheticLines', 'jazzScatter', 'stickerMode', 'squareSelection', 'basquiatSelection'];
            brushShape = validBrushes.includes(event.data.shape) ? event.data.shape : 'box';
            console.log(`Processed non-smear shape change: ${brushShape}`);
        }
        return true;
    }

    if (instantStrokes) {
        const brushBatches = {};
        const validBrushes = ['box', 'circle', 'rectangle', 'triangle', 'sweeper', 'oilbarrel', 'tv', 'negative', 'melt', 'brokenScreen', 'aestheticLines', 'jazzScatter', 'stickerMode'];
        let index = 0;
        for (const event of allEvents) {
            if (event.type !== 'smear') {
                processNonSmearEvent(event);
                continue;
            }
            const smear = event.data;
            if (!validBrushes.includes(smear.brushShape) || (smear.brushShape === 'stickerMode' && !smear.stickerSlot) || (smear.brushShape === 'stickerMode' && !stickerImages[smear.stickerSlot])) {
                index++;
                continue;
            }
            if (smear.lastX === smear.currentX && smear.lastY === smear.currentY) {
                index++;
                continue;
            }
            const currentX = Math.max(0, Math.min(canvas.width - 1, smear.currentX * xScale + offsetX));
            const currentY = Math.max(0, Math.min(canvas.height - 1, smear.currentY * yScale + offsetY));
            const brushKey = smear.brushShape + (smear.stickerSlot ? `_${smear.stickerSlot}` : '') + `_${smear.sequence || index}`;
            if (!brushBatches[brushKey]) {
                brushBatches[brushKey] = {
                    coords: [],
                    state: {
                        size: smear.size || brushSize,
                        rotation: smear.rotation || lastRotation,
                        cloneSize: smear.cloneSize || lastCloneSize,
                        cloneRotation: smear.cloneRotation || lastCloneRotation,
                        paintMode: smear.paintMode !== undefined ? smear.paintMode : lastPaintMode,
                        paintColor: smear.paintColor || { ...lastPaintColor },
                        flipHorizontal: smear.flipHorizontal !== undefined ? smear.flipHorizontal : lastFlipHorizontal,
                        flipVertical: smear.flipVertical !== undefined ? smear.flipVertical : lastFlipVertical,
                        activeEffects: smear.activeEffects || []
                    },
                    anchors: []
                };
            }
            const batch = brushBatches[brushKey];
            batch.coords.push(currentX, currentY);
            if (smear.rotation && smear.rotation !== batch.state.rotation) {
                brushRotation = smear.rotation;
                batch.state.rotation = brushRotation;
            }
            if (smear.cloneSize && smear.cloneSize !== batch.state.cloneSize) {
                cloneBrushSize = smear.cloneSize;
                batch.state.cloneSize = cloneBrushSize;
            }
            if (smear.cloneRotation && smear.cloneRotation !== batch.state.cloneRotation) {
                cloneBrushRotation = smear.cloneRotation;
                batch.state.cloneRotation = cloneBrushRotation;
            }
            if (smear.paintMode !== batch.state.paintMode) {
                isPaintMode = smear.paintMode !== undefined ? smear.paintMode : batch.state.paintMode;
                batch.state.paintMode = isPaintMode;
            }
            if (smear.paintColor && (smear.paintColor.r !== batch.state.paintColor.r || smear.paintColor.g !== batch.state.paintColor.g || smear.paintColor.b !== batch.state.paintColor.b)) {
                paintColor = { ...smear.paintColor };
                batch.state.paintColor = { ...paintColor };
            }
            if (smear.flipHorizontal !== batch.state.flipHorizontal) {
                isFlipHorizontalActive = smear.flipHorizontal !== undefined ? smear.flipHorizontal : batch.state.flipHorizontal;
                batch.state.flipHorizontal = isFlipHorizontalActive;
            }
            if (smear.flipVertical !== batch.state.flipVertical) {
                isFlipVerticalActive = smear.flipVertical !== undefined ? smear.flipVertical : batch.state.flipVertical;
                batch.state.flipVertical = isFlipVerticalActive;
            }
            if (smear.anchorPoints) {
                batch.anchors.push(smear.anchorPoints.map(p => ({
                    x: Math.max(0, Math.min(canvas.width - 1, p.x * xScale + offsetX)),
                    y: Math.max(0, Math.min(canvas.height - 1, p.y * yScale + offsetY)),
                    target: canvas
                })));
            }
            // Update activeEffects for the batch
            if (smear.activeEffects && Array.isArray(smear.activeEffects)) {
                batch.state.activeEffects = [...smear.activeEffects];
            }
            index++;
        }

        // Render in one pass per brush type
        for (const brushKey in brushBatches) {
            const [brushType, stickerSlot] = brushKey.split('_').slice(0, 2);
            const batch = brushBatches[brushKey];
            brushShape = brushType;
            brushSize = batch.state.size;
            brushRotation = batch.state.rotation;
            cloneBrushSize = batch.state.cloneSize;
            cloneBrushRotation = batch.state.cloneRotation;
            isPaintMode = batch.state.paintMode;
            paintColor = batch.state.paintColor;
            isFlipHorizontalActive = batch.state.flipHorizontal;
            isFlipVerticalActive = batch.state.flipVertical;
            // Reset all effects before applying batch effects
            Object.keys(lastEffects).forEach(effect => {
                if (lastEffects[effect]) {
                    toggleEffect(effect, false, 'playback');
                    toggleEffectButton(effect, false);
                    lastEffects[effect] = false;
                }
            });
            activeEffectsState.clear();
            // Apply active effects for this batch
            batch.state.activeEffects.forEach(effect => {
                toggleEffect(effect, true, 'playback');
                toggleEffectButton(effect, true);
                lastEffects[effect] = true;
            });
            console.log(`Applied batch activeEffects for ${brushKey}: ${batch.state.activeEffects.join(', ')}, activeEffects:`, [...activeEffectsState]);
            updateBrushSize(brushSize);
            if (brushType === 'sweeper' || brushType === 'oilbarrel') {
                for (let i = 0; i < batch.anchors.length; i++) {
                    anchorPoints = batch.anchors[i];
                    drawSweeperLines(canvasId);
                }
            } else if (brushType === 'aestheticLines') {
                for (let i = 0; i < batch.anchors.length; i++) {
                    anchorPoints = batch.anchors[i];
                    drawAestheticLines(canvasId);
                }
            } else if (brushType === 'stickerMode' && stickerSlot) {
                smearPixelsBatch(batch.coords, canvasId, undefined, undefined, stickerSlot);
            } else if (brushType !== 'squareSelection' && brushType !== 'basquiatSelection') {
                smearPixelsBatch(batch.coords, canvasId);
            }
        }

        // Clean up effects after rendering
        Object.keys(lastEffects).forEach(effect => {
            if (lastEffects[effect]) {
                toggleEffect(effect, false, 'playback');
                toggleEffectButton(effect, false);
                lastEffects[effect] = false;
            }
        });
        lastX = undefined;
        lastY = undefined;
        anchorPoints = [];
        currentImageData[canvasId] = ctx.getImageData(0, 0, canvas.width, canvas.height);
        ['base', 'paint', 'sampler'].forEach(otherId => {
            if (otherId !== canvasId) {
                const otherCtx = otherId === 'base' ? baseCtx : otherId === 'paint' ? paintCtx : samplerCtx;
                otherCtx.putImageData(prevState[otherId], 0, 0);
                currentImageData[otherId] = prevState[otherId];
            }
        });
        console.log('Completed instant movement replay on', canvasId, 'events processed:', allEvents.length, 'isRolling:', isRolling);
        resolve(true);
    } else {
        function processEvents(index) {
            if (index >= allEvents.length || !isRolling) {
                // Clean up effects after playback
                Object.keys(lastEffects).forEach(effect => {
                    if (lastEffects[effect]) {
                        toggleEffect(effect, false, 'playback');
                        toggleEffectButton(effect, false);
                        lastEffects[effect] = false;
                    }
                });
                lastX = undefined;
                lastY = undefined;
                anchorPoints = [];
                currentImageData[canvasId] = ctx.getImageData(0, 0, canvas.width, canvas.height);
                ['base', 'paint', 'sampler'].forEach(otherId => {
                    if (otherId !== canvasId) {
                        const otherCtx = otherId === 'base' ? baseCtx : otherId === 'paint' ? paintCtx : samplerCtx;
                        otherCtx.putImageData(prevState[otherId], 0, 0);
                        currentImageData[otherId] = prevState[otherId];
                    }
                });
                console.log('Completed animated movement replay on', canvasId, 'events processed:', index, 'isRolling:', isRolling);
                resolve(true);
                return;
            }

            const event = allEvents[index];
            const delay = index === 0 ? event.timestamp : event.timestamp - allEvents[index - 1].timestamp;

            setTimeout(() => {
                if (processEvent(event, index)) {
                    processEvents(index + 1);
                } else {
                    resolve(true);
                }
            }, delay);
        }

        processEvents(0);
    }
});
}

// Define the randomization logic as a reusable function
const startRandomization = () => {
if (isRolling) return;
const rolls = parseInt(diceRolls.value);
if (isNaN(rolls) || rolls < 1 || rolls > 10000) {
    alert('Please set a valid number of rolls (1–10000).');
    diceRolls.value = 100; // Reset to default
    diceValue.textContent = 100;
    return;
}
console.log('Randomizer started with rolls:', rolls);
const targets = [];
if (document.getElementById('randomizeBase').checked) targets.push('base');
if (document.getElementById('randomizePaint').checked) targets.push('paint');
if (document.getElementById('randomizeSampler').checked) targets.push('sampler');
if (!targets.length) {
    alert('SELECT AT LEAST ONE CANVAS TO RANDOMIZE!');
    return;
}
if (recordedMovements.length === 0) {
    alert('NO RECORDED MOVEMENTS LOADED! Please load a .json file first.');
    return;
}
progressBarContainer.style.display = 'block';
stopResumeBtn.style.display = 'block';
stopResumeBtn.textContent = 'Stop';
rockNRollBtn.disabled = true;
isRolling = true;
completed = 0;
rollTimeouts = [];
rollHistory = { base: [], paint: [], sampler: [] };

console.log('Starting randomizer with', rolls, 'steps, recorded movements:', recordedMovements.length);

async function runStep(step) {
window.isRandomizerRunning = true;  // Add at the start of runStep
    if (step >= rolls || !isRolling) {
        // Cleanup
        const effects = Object.keys(effectMap);
        effects.forEach(effect => toggleEffect(effect, false));
        brushShape = 'box';
        sweeperMode = 'off';
        Object.values(brushButtons).forEach(btn => btn.classList.remove('selected'));
        brushButtons.box.classList.add('selected');
        brushSize = baseBrushSize;
        sizeValue.textContent = brushSize;
        randomizerModal.style.display = 'none';
        rockNRollBtn.disabled = false;
        isRolling = false;
        stopResumeBtn.style.display = 'none';
        reverseBtn.style.display = 'none';
        forwardBtn.style.display = 'none';
        rollTimeouts = [];
        console.log('Randomizer finished, rollHistory:', rollHistory);
        return;
    }

    // Cycle through movements
    const useSequence = document.getElementById('strokesInSequence').checked;
const movementIndex = useSequence 
? step % recordedMovements.length  // Sequential
: Math.floor(Math.random() * recordedMovements.length);  // Random
    const move = recordedMovements[movementIndex];
    const targetCanvas = move.targetCanvas || 'base';
    if (!targets.includes(targetCanvas)) {
        console.log(`Skipping step ${step + 1}: targetCanvas ${targetCanvas} not selected`);
        completed++;
        progressBar.style.width = `${(completed / rolls) * 100}%`;
        rollTimeouts.push(setTimeout(() => runStep(step + 1), 100));
        return;
    }

    const ctx = targetCanvas === 'base' ? baseCtx : targetCanvas === 'paint' ? paintCtx : samplerCtx;
    const canvas = ctx.canvas;
    const prevState = {
        base: baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height),
        paint: paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height),
        sampler: samplerCtx.getImageData(0, 0, samplerCanvas.width, samplerCanvas.height)
    };

    // Initialize movement state
    const initialState = move.brushState || {};
    brushShape = initialState.shape || move.shape || 'box';
    brushSize = initialState.size || move.size || baseBrushSize;
    brushRotation = initialState.rotation || move.rotation || 0;
    isPaintMode = initialState.paintMode !== undefined ? initialState.paintMode : move.paintMode || false;
    paintColor = initialState.paintColor || move.paintColor || { r: 255, g: 0, b: 0 };
    isFlipHorizontalActive = initialState.flipHorizontal !== undefined ? initialState.flipHorizontal : move.flipHorizontal || false;
    isFlipVerticalActive = initialState.flipVertical !== undefined ? initialState.flipVertical : move.flipVertical || false;
    updateBrushSize(brushSize);
    const initialEffects = move.effects || {};
    Object.keys(initialEffects).forEach(effect => toggleEffect(effect, initialEffects[effect]));
    console.log(`Step ${step + 1}/${rolls}: Initialized movement ${movementIndex}, shape=${brushShape}, initialSize=${brushSize}, smears=${move.smears?.length || 0}, events=${move.events?.length || 0}`);

    // Prepare events
    const allEvents = [
        ...(move.smears || []).map(s => ({ type: 'smear', data: s, timestamp: s.timestamp || 0 })),
        ...(move.events || []).map(e => ({ type: e.type, data: e, timestamp: e.timestamp || 0 }))
    ].sort((a, b) => a.timestamp - b.timestamp);

    // Scaling for canvas size
    const xScale = canvas.width / (initialState.canvasWidth || canvas.width);
    const yScale = canvas.height / (initialState.canvasHeight || canvas.height);
    // Large random offset to spread strokes across canvas
    const offsetX = (Math.random() - 0.5) * canvas.width * 2; // Range: [-width, width]
    const offsetY = (Math.random() - 0.5) * canvas.height * 2; // Range: [-height, height]


// SPECIAL HANDLING FOR LINE BRUSHES
if (brushShape === 'sweeper' || brushShape === 'oilbarrel' || brushShape === 'aestheticLines') {
console.log(`Line brush detected: ${brushShape}, processing anchor points`);

const processedSmears = move.smears || [];

if (brushShape === 'sweeper') {
    console.log(`Processing ${processedSmears.length} sweeper smears sequentially`);
    
    // FIXED: Add instantStrokes definition
    const instantStrokes = document.getElementById('instantStrokes').checked;
    console.log(`DEBUG: Sweeper instantStrokes is ${instantStrokes ? 'CHECKED (instant)' : 'UNCHECKED (animate)'}`);
    
    // FIXED: Process all smears as a single cumulative operation
    let cumulativeCanvas = document.createElement('canvas');
    cumulativeCanvas.width = canvas.width;
    cumulativeCanvas.height = canvas.height;
    let cumulativeCtx = cumulativeCanvas.getContext('2d', { alpha: true });
    
    // Start with current canvas state
    if (currentImageData[targetCanvas]) {
        cumulativeCtx.putImageData(currentImageData[targetCanvas], 0, 0);
    }
    
    let validSmearCount = 0;

const smallOffsetX = (Math.random() - 0.5) * canvas.width * 2;
const smallOffsetY = (Math.random() - 0.5) * canvas.height * 2;
    
    for (let i = 0; i < processedSmears.length && isRolling; i++) {
        const smear = processedSmears[i];
        
        if (smear.anchorPoints && smear.anchorPoints.length >= 2) {
            const validAnchorPoints = smear.anchorPoints.filter(p => 
                p.x != null && p.y != null && !isNaN(p.x) && !isNaN(p.y)
            );
            if (validAnchorPoints.length < 2) {
                console.warn(`Skipping sweeper smear ${i} - insufficient valid anchor points:`, validAnchorPoints.length);
                continue;
            }
            
            console.log(`Processing smear ${i}: anchor points from JSON:`, validAnchorPoints.map(p => `(${p.x}, ${p.y})`));
            
            
            anchorPoints = validAnchorPoints.map((p, index) => ({
x: (p.x * xScale) + smallOffsetX,
y: (p.y * yScale) + smallOffsetY,
lastX: ((p.lastX !== undefined ? p.lastX : p.x) * xScale) + smallOffsetX,
lastY: ((p.lastY !== undefined ? p.lastY : p.y) * yScale) + smallOffsetY,
                target: canvas,
                id: p.fingerId || `randomizer_${i}_${index}`,
                fingerId: p.fingerId || `randomizer_${i}_${index}`
            }));
            
            console.log(`Transformed smear ${i} anchor points:`, anchorPoints.map(p => `(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`));
            
            // Set up state for this smear
            lastTouchPoints = anchorPoints.map(p => ({
                x: p.lastX,
                y: p.lastY,
                lastX: p.lastX,
                lastY: p.lastY,
                target: p.target,
                id: p.id,
                fingerId: p.fingerId
            }));
            
            if (smear.mouseAnchorStart || smear.inputType === 'mouse') {
                mouseAnchorStart = smear.mouseAnchorStart ? {
                    x: (smear.mouseAnchorStart.x * xScale) + smallOffsetX,
                    y: (smear.mouseAnchorStart.y * yScale) + smallOffsetY,
                    target: canvas
                } : {
                    x: anchorPoints[0].x,
                    y: anchorPoints[0].y,
                    target: canvas
                };
            } else {
                mouseAnchorStart = null;
            }
            
            // FIXED: Temporarily replace the main canvas context with our cumulative one
            const originalCtx = ctx;
            const originalCanvas = canvas;
            
            // Set up canvas states to use our cumulative canvas
            const tempState = canvasStates[targetCanvas];
            tempState.offscreenCanvas = cumulativeCanvas;
            
            // Temporarily redirect drawing to cumulative canvas
            if (targetCanvas === 'base') {
                window.baseCtx = cumulativeCtx;
                window.baseCanvas = cumulativeCanvas;
            } else if (targetCanvas === 'paint') {
                window.paintCtx = cumulativeCtx;
                window.paintCanvas = cumulativeCanvas;
            } else {
                window.samplerCtx = cumulativeCtx;
                window.samplerCanvas = cumulativeCanvas;
            }
            
            // Update currentImageData to current cumulative state
            currentImageData[targetCanvas] = cumulativeCtx.getImageData(0, 0, cumulativeCanvas.width, cumulativeCanvas.height);
            
            // FIXED: Check if we should animate or draw instantly
            if (!instantStrokes) {
                console.log(`ANIMATING sweeper smear ${i} - adding delay`);
            } else {
                console.log(`INSTANT drawing sweeper smear ${i}`);
            }
            drawSweeperLines(targetCanvas);
            
            // Restore original canvas references
            if (targetCanvas === 'base') {
                window.baseCtx = originalCtx;
                window.baseCanvas = originalCanvas;
            } else if (targetCanvas === 'paint') {
                window.paintCtx = originalCtx;
                window.paintCanvas = originalCanvas;
            } else {
                window.samplerCtx = originalCtx;
                window.samplerCanvas = originalCanvas;
            }
            
            validSmearCount++;
            console.log(`Drew sweeper smear ${i + 1}/${processedSmears.length} with ${validAnchorPoints.length} anchors, line from (${anchorPoints[0].x.toFixed(1)}, ${anchorPoints[0].y.toFixed(1)}) to (${anchorPoints[1].x.toFixed(1)}, ${anchorPoints[1].y.toFixed(1)})`);
            
            // REMOVED: The broken await line
        } else {
            console.warn(`Skipping sweeper smear ${i} - no valid anchor points:`, smear.anchorPoints?.length || 0);
        }
    }
    
    // FIXED: Apply final cumulative result to actual canvas
    if (validSmearCount > 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(cumulativeCanvas, 0, 0);
        currentImageData[targetCanvas] = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Force update offscreen canvas state
        const state = canvasStates[targetCanvas];
        if (state.offscreenCanvas) {
            const offscreenCtx = state.offscreenCanvas.getContext('2d', { alpha: true });
            offscreenCtx.clearRect(0, 0, state.offscreenCanvas.width, state.offscreenCanvas.height);
            offscreenCtx.drawImage(cumulativeCanvas, 0, 0);
        }
        
        console.log(`Applied ${validSmearCount} cumulative sweeper lines to ${targetCanvas} canvas`);
    }
    
} else {
// oilbarrel and aestheticLines use the original logic
const allAnchorPoints = [];

processedSmears.forEach(smear => {
    if (smear.anchorPoints && Array.isArray(smear.anchorPoints)) {
        smear.anchorPoints.forEach(anchor => {
            const transformedAnchor = {
                x: (anchor.x * xScale) + offsetX,
                y: (anchor.y * yScale) + offsetY,
                lastX: ((anchor.lastX || anchor.x) * xScale) + offsetX,
                lastY: ((anchor.lastY || anchor.y) * yScale) + offsetY,
                target: canvas
            };
            allAnchorPoints.push(transformedAnchor);
        });
    }
});

const uniqueAnchorPoints = allAnchorPoints.filter((anchor, index, arr) => 
    index === arr.findIndex(a => Math.abs(a.x - anchor.x) < 1 && Math.abs(a.y - anchor.y) < 1)
);

console.log(`${brushShape}: Found ${uniqueAnchorPoints.length} unique anchor points`);

if (uniqueAnchorPoints.length >= 2) {
    anchorPoints = uniqueAnchorPoints;
    
    if (brushShape === 'oilbarrel') {
console.log('OILBARREL START DEBUG:', {
    isDraggingOilbarrel: isDraggingOilbarrel,
    oilbarrelRafId: oilbarrelRafId,
    oilbarrelDragState: oilbarrelDragState,
    anchorPoints: anchorPoints,
    zoomLevel: state?.zoomLevel,
    panX: state?.panX,
    panY: state?.panY
});
        drawSweeperLines(targetCanvas);
    } else if (brushShape === 'aestheticLines') {
        // FIXED: Check the actual anchor points we found, not undefined smear
        if (uniqueAnchorPoints.length >= 2) {
            // 2-finger mode: use anchor points
            drawAestheticLines(targetCanvas);
            console.log(`Replayed aestheticLines LINE: anchor points=${uniqueAnchorPoints.length}`);
        } else {
            // 1-finger mode: fallback to regular smear (shouldn't happen with the check above)
            console.warn(`aestheticLines: Not enough anchor points, using fallback`);
            const firstSmear = processedSmears[0];
            if (firstSmear) {
                const currentX = (firstSmear.currentX * xScale) + offsetX;
                const currentY = (firstSmear.currentY * yScale) + offsetY;
                smearPixels(currentX, currentY, targetCanvas);
            }
        }
    }
    
    // Update state after drawing
    currentImageData[targetCanvas] = ctx.getImageData(0, 0, canvas.width, canvas.height);
    console.log(`${brushShape} line drawn with ${uniqueAnchorPoints.length} anchor points`);
} else {
    console.warn(`${brushShape}: Not enough anchor points (${uniqueAnchorPoints.length}) to draw line`);
    // FIXED: Fallback for aestheticLines when no anchor points
    if (brushShape === 'aestheticLines' && processedSmears.length > 0) {
        console.log('aestheticLines: Falling back to individual smears');
        processedSmears.forEach(smear => {
            const currentX = (smear.currentX * xScale) + offsetX;
            const currentY = (smear.currentY * yScale) + offsetY;
            smearPixels(currentX, currentY, targetCanvas);
        });
        currentImageData[targetCanvas] = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
}
}

console.log(`Step ${step + 1}/${rolls}: Completed line brush ${brushShape} on ${targetCanvas}`);
completed++;
progressBar.style.width = `${(completed / rolls) * 100}%`;
rollTimeouts.push(setTimeout(() => runStep(step + 1), 0)); // Always 0ms
return; // EXIT EARLY
}
    try {
        let currentBrushSize = brushSize;
        const instantStrokes = document.getElementById('instantStrokes').checked;
console.log(`DEBUG: instantStrokes checkbox is ${instantStrokes ? 'CHECKED (ON)' : 'UNCHECKED (OFF)'}`);


        for (let i = 0; i < allEvents.length && isRolling; i++) {
            const event = allEvents[i];
            if (event.type === 'size') {
                currentBrushSize = event.data.size;
                brushSize = currentBrushSize;
                updateBrushSize(brushSize);
                console.log(`Step ${step + 1}: Applied size change to ${brushSize}, timestamp=${event.timestamp}ms`);
            } else if (event.type === 'smear') {
                const smear = event.data;
                if (!smear.currentX || !smear.currentY) continue;
                brushSize = smear.size !== undefined ? smear.size : currentBrushSize;
                updateBrushSize(brushSize);
                const currentX = (smear.currentX * xScale) + offsetX;
const currentY = (smear.currentY * yScale) + offsetY;
lastX = smear.lastX !== undefined ? (smear.lastX * xScale) + offsetX : currentX;
lastY = smear.lastY !== undefined ? (smear.lastY * yScale) + offsetY : currentY;
                if (lastX === currentX && lastY === currentY) continue;

                smearPixels(currentX, currentY, targetCanvas);
                console.log(`Step ${step + 1}: Applied smear ${i + 1}/${allEvents.length}, size=${brushSize}, pos=(${currentX.toFixed(2)}, ${currentY.toFixed(2)}), offset=(${offsetX.toFixed(2)}, ${offsetY.toFixed(2)}), timestamp=${event.timestamp}ms`);

                if (!instantStrokes) {
                    await new Promise(resolve => setTimeout(resolve, 50)); // Short delay for visibility
                }
            }
        }

        rollHistory[targetCanvas].push({
            imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
            movementIndex,
            offsetX,
            offsetY,
            strokeCount: move.smears?.length || 0,
            brushSize: brushSize,
            movement: { ...move }
        });
        // Restore other canvases
        ['base', 'paint', 'sampler'].forEach(otherId => {
            if (otherId !== targetCanvas) {
                const otherCtx = otherId === 'base' ? baseCtx : otherId === 'paint' ? paintCtx : samplerCtx;
                otherCtx.putImageData(prevState[otherId], 0, 0);
                currentImageData[otherId] = prevState[otherId];
            }
        });
        console.log(`Step ${step + 1}/${rolls}: Completed movement ${movementIndex} on ${targetCanvas}, strokes=${move.smears?.length || 0}, finalSize=${brushSize}`);
    } catch (error) {
        console.error(`Step ${step + 1}: Error in movement ${movementIndex} on ${targetCanvas}:`, error);
    }

    completed++;
    progressBar.style.width = `${(completed / rolls) * 100}%`;
    rollTimeouts.push(setTimeout(() => runStep(step + 1), instantStrokes ? 0 : 200)); // Longer delay for visibility
}

runStep(0);
};

// Throttled handler to prevent rapid taps
const throttledStartRandomization = throttle(startRandomization, 200);

// Attach event listeners
rockNRollBtn.addEventListener('click', (e) => {
e.preventDefault();
e.stopPropagation();
console.log('rockNRollBtn clicked');
throttledStartRandomization();
rockNRollBtn.classList.add('active');
setTimeout(() => rockNRollBtn.classList.remove('active'), 200);
});

rockNRollBtn.addEventListener('touchstart', (e) => {
e.preventDefault();
e.stopPropagation();
console.log('rockNRollBtn touchstart, Touch ID:', e.touches[0]?.identifier);
rockNRollBtn.classList.add('active');
}, { passive: false });

rockNRollBtn.addEventListener('touchend', (e) => {
e.preventDefault();
e.stopPropagation();
console.log('rockNRollBtn touchend, Touch ID:', e.changedTouches[0]?.identifier);
throttledStartRandomization();
setTimeout(() => rockNRollBtn.classList.remove('active'), 200);
}, { passive: false });

rockNRollBtn.addEventListener('touchcancel', (e) => {
e.preventDefault();
e.stopPropagation();
console.log('rockNRollBtn touchcancel');
rockNRollBtn.classList.remove('active');
}, { passive: false });

async function replayRecordedMovement(canvasId, offsetX = 0, offsetY = 0, instantStrokes = false) {
if (recordedMovements.length === 0) {
    console.error('No recorded movements for', canvasId);
    return Promise.resolve(false);
}
const move = recordedMovements[Math.floor(Math.random() * recordedMovements.length)];
if (!move || (!move.smears.length && !move.events.length)) {
    console.error('Invalid movement:', move);
    return Promise.resolve(false);
}
const targetCanvas = move.targetCanvas || 'base';
if (canvasId !== targetCanvas) {
    return Promise.resolve(true);
}

console.log(`Replaying movement on ${canvasId}: shape=${move.shape}, smears=${move.smears.length}, events=${move.events?.length || 0}, duration=${move.duration}ms, offset=(${offsetX}, ${offsetY}), instant=${instantStrokes}`);

const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
const canvas = canvasId === 'base' ? baseCanvas : canvasId === 'paint' ? paintCanvas : samplerCanvas;

const prevState = {
    base: baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height),
    paint: paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height),
    sampler: samplerCtx.getImageData(0, 0, samplerCanvas.width, samplerCanvas.height)
};

currentImageData[canvasId] = ctx.getImageData(0, 0, canvas.width, canvas.height);

const initialState = move.brushState || {};
brushShape = initialState.shape || move.shape || 'box';
brushSize = initialState.size || move.size || baseBrushSize;
brushRotation = initialState.rotation || move.rotation || 0;
cloneBrushSize = initialState.cloneSize || move.cloneSize || brushSize;
cloneBrushRotation = initialState.cloneRotation || move.cloneRotation || 0;
isPaintMode = initialState.paintMode !== undefined ? initialState.paintMode : move.paintMode || false;
paintColor = initialState.paintColor || move.paintColor || { r: 255, g: 0, b: 0 };
isFlipHorizontalActive = initialState.flipHorizontal !== undefined ? initialState.flipHorizontal : move.flipHorizontal || false;
isFlipVerticalActive = initialState.flipVertical !== undefined ? initialState.flipVertical : move.flipVertical || false;
updateBrushSize(brushSize);
const initialEffects = move.effects || {};
Object.keys(initialEffects).forEach(effect => toggleEffect(effect, initialEffects[effect]));
console.log(`Initial state: shape=${brushShape}, size=${brushSize}, rotation=${brushRotation}, cloneSize=${cloneBrushSize}, cloneRotation=${cloneBrushRotation}, paintMode=${isPaintMode}, flipHorizontal=${isFlipHorizontalActive}, flipVertical=${isFlipVerticalActive}, stickerSlot=${initialState.stickerSlot}, effects=`, Object.keys(initialEffects).filter(k => initialEffects[k]));

const targetCanvasId = move.targetCanvas || 'base';
const srcCanvas = targetCanvasId === 'base' ? baseCanvas : targetCanvasId === 'paint' ? paintCanvas : samplerCanvas;
const xScale = canvas.width / srcCanvas.width;
const yScale = canvas.height / srcCanvas.height;

const allEvents = [
    ...(move.smears || []).map(s => ({ type: 'smear', data: s, timestamp: s.timestamp || 0 })),
    ...(move.events || []).map(e => ({ type: e.type, data: e.data, timestamp: e.data.timestamp || 0 }))
].sort((a, b) => a.timestamp - b.timestamp);

let lastEffects = { ...initialEffects };
let lastSize = brushSize;
let lastRotation = brushRotation;
let lastCloneSize = cloneBrushSize;
let lastCloneRotation = cloneBrushRotation;
let lastPaintMode = isPaintMode;
let lastPaintColor = { ...paintColor };
let lastFlipHorizontal = isFlipHorizontalActive;
let lastFlipVertical = isFlipVerticalActive;

return new Promise(resolve => {
    function processEvent(event, index) {
if (!isRolling) {
    console.log('Replay stopped: isRolling is false, index=', index, 'event=', event);
    return false;
}
try {
    console.log(`Processing event ${index + 1}/${allEvents.length}: type=${event.type}, timestamp=${event.timestamp}ms`);
    if (event.type === 'smear') {
        const smear = event.data;
        const validBrushes = ['box', 'circle', 'rectangle', 'triangle', 'sweeper', 'oilbarrel', 'tv', 'negative', 'melt', 'brokenScreen', 'aestheticLines', 'jazzScatter', 'stickerMode', 'squareSelection', 'basquiatSelection'];
        brushShape = validBrushes.includes(smear.brushShape) ? smear.brushShape : 'box';
        if (smear.size && !allEvents.some(e => e.type === 'size')) {
            brushSize = smear.size;
            updateBrushSize(brushSize);
            lastSize = brushSize;
        }
        if (smear.rotation !== undefined && smear.rotation !== lastRotation) {
            brushRotation = smear.rotation;
            lastRotation = brushRotation;
        } else if (smear.rotation === undefined) {
            brushRotation = 0;
            lastRotation = 0;
        }
        if (smear.cloneSize !== lastCloneSize) {
            cloneBrushSize = smear.cloneSize || lastCloneSize;
            lastCloneSize = cloneBrushSize;
        }
        if (smear.cloneRotation !== lastCloneRotation) {
            cloneBrushRotation = smear.cloneRotation || lastCloneRotation;
            lastCloneRotation = cloneBrushRotation;
        }
        if (smear.paintMode !== lastPaintMode) {
            isPaintMode = smear.paintMode !== undefined ? smear.paintMode : lastPaintMode;
            lastPaintMode = isPaintMode;
        }
        if (smear.paintColor && (smear.paintColor.r !== lastPaintColor.r || smear.paintColor.g !== lastPaintColor.g || smear.paintColor.b !== lastPaintColor.b)) {
            paintColor = { ...smear.paintColor };
            lastPaintColor = { ...paintColor };
        }
        if (smear.flipHorizontal !== lastFlipHorizontal) {
            isFlipHorizontalActive = smear.flipHorizontal !== undefined ? smear.flipHorizontal : lastFlipHorizontal;
            lastFlipHorizontal = isFlipHorizontalActive;
        }
        if (smear.flipVertical !== lastFlipVertical) {
            isFlipVerticalActive = smear.flipVertical !== undefined ? smear.flipVertical : lastFlipVertical;
            lastFlipVertical = isFlipVerticalActive;
        }
        // Apply active effects from smear record or maintain last known state
        if (smear.activeEffects && Array.isArray(smear.activeEffects)) {
            // Update activeEffects incrementally
            const currentEffects = new Set(smear.activeEffects);
            // Disable effects that are no longer active
            activeEffects.forEach(key => {
                const effect = keyLabels.find(k => k.key.toLowerCase() === key)?.effect;
                if (effect && !currentEffects.has(effect) && lastEffects[effect]) {
                    toggleEffect(effect, false, 'playback');
                    const keyElement = Array.from(keyboardContainer.children).find(el => el.dataset.effect === effect);
                    if (keyElement) keyElement.classList.remove('active');
                    lastEffects[effect] = false;
                    console.log(`Disabled effect ${effect} for smear ${index}`);
                }
            });
            // Enable recorded active effects
            smear.activeEffects.forEach(effect => {
                const key = keyLabels.find(k => k.effect === effect)?.key.toLowerCase();
                if (key && !activeEffects.has(key)) {
                    activeEffects.add(key);
                    toggleEffect(effect, true, 'playback');
                    const keyElement = Array.from(keyboardContainer.children).find(el => el.dataset.effect === effect);
                    if (keyElement) keyElement.classList.add('active');
                    lastEffects[effect] = true;
                    console.log(`Enabled effect ${effect} for smear ${index}`);
                }
            });
            console.log(`Smear activeEffects applied: ${smear.activeEffects.join(', ')}, activeEffects set:`, [...activeEffects]);
        } else {
            // Maintain last known effect states if no activeEffects provided
            Object.keys(lastEffects).forEach(effect => {
                const key = keyLabels.find(k => k.effect === effect)?.key.toLowerCase();
                if (key && lastEffects[effect] && !activeEffects.has(key)) {
                    activeEffects.add(key);
                    toggleEffect(effect, true, 'playback');
                    const keyElement = Array.from(keyboardContainer.children).find(el => el.dataset.effect === effect);
                    if (keyElement) keyElement.classList.add('active');
                    console.log(`Maintained effect ${effect} for smear ${index}`);
                }
            });
            console.log('No activeEffects in smear, maintained last effect states:', Object.keys(lastEffects).filter(e => lastEffects[e]));
        }
        lastX = smear.lastX !== undefined ? Math.max(0, Math.min(canvas.width - 1, smear.lastX * xScale + offsetX)) : lastX;
        lastY = smear.lastY !== undefined ? Math.max(0, Math.min(canvas.height - 1, smear.lastY * yScale + offsetY)) : lastY;
        const currentX = Math.max(0, Math.min(canvas.width - 1, smear.currentX * xScale + offsetX));
        const currentY = Math.max(0, Math.min(canvas.height - 1, smear.currentY * yScale + offsetY));
        if (lastX === currentX && lastY === currentY) {
            console.log(`Skipped smear with no movement: (${lastX}, ${lastY})`);
            return true;
        }
        if (smear.anchorPoints) {
            anchorPoints = smear.anchorPoints.map(p => ({
                x: Math.max(0, Math.min(canvas.width - 1, p.x * xScale + offsetX)),
                y: Math.max(0, Math.min(canvas.height - 1, p.y * yScale + offsetY)),
                target: canvas
            }));
        }
if (smear.brushShape === 'sweeper' || smear.brushShape === 'oilbarrel') {
if (smear.anchorPoints && smear.anchorPoints.length >= 2) {
    // Validation and setup code (keep existing)
    const validAnchorPoints = smear.anchorPoints.filter(p => 
        p.x != null && p.y != null && !isNaN(p.x) && !isNaN(p.y)
    );
    if (validAnchorPoints.length < 2) {
        console.warn(`Skipping ${smear.brushShape} smear - insufficient valid anchor points:`, validAnchorPoints.length);
        return true;
    }
    
    anchorPoints = validAnchorPoints.map(p => ({
        x: Math.max(0, Math.min(canvas.width - 1, p.x * xScale + offsetX)),
        y: Math.max(0, Math.min(canvas.height - 1, p.y * yScale + offsetY)),
        lastX: Math.max(0, Math.min(canvas.width - 1, (p.lastX !== undefined ? p.lastX : p.x) * xScale + offsetX)),
        lastY: Math.max(0, Math.min(canvas.height - 1, (p.lastY !== undefined ? p.lastY : p.y) * yScale + offsetY)),
        target: canvas,
        id: p.fingerId || `replay_${index}`
    }));
    
    lastTouchPoints = anchorPoints.map(p => ({
        x: p.lastX,
        y: p.lastY,
        lastX: p.lastX,
        lastY: p.lastY,
        target: p.target,
        id: p.id
    }));
    
    // Set up mouseAnchorStart if present
    if (smear.mouseAnchorStart) {
        mouseAnchorStart = {
            x: smear.mouseAnchorStart.x * xScale + offsetX,
            y: smear.mouseAnchorStart.y * yScale + offsetY,
            target: anchorPoints[0].target
        };
    } else if (smear.inputType === 'mouse' && anchorPoints.length >= 2) {
        mouseAnchorStart = {
            x: anchorPoints[0].x,
            y: anchorPoints[0].y,
            target: anchorPoints[0].target
        };
    } else {
        mouseAnchorStart = null;
    }
    
    // Initialize canvas state
    const state = canvasStates[canvasId];
    if (!state.offscreenCanvas || state.offscreenCanvas.width !== canvas.width || state.offscreenCanvas.height !== canvas.height) {
        state.offscreenCanvas = document.createElement('canvas');
        state.offscreenCanvas.width = canvas.width;
        state.offscreenCanvas.height = canvas.height;
        const offscreenCtx = state.offscreenCanvas.getContext('2d', { alpha: true });
        offscreenCtx.imageSmoothingEnabled = true;
        offscreenCtx.imageSmoothingQuality = 'high';
        if (currentImageData[canvasId]) {
            offscreenCtx.putImageData(currentImageData[canvasId], 0, 0);
        }
    }
    
    // FIXED: Proper animation vs instant handling
    if (smear.brushShape === 'sweeper' && !instantStrokes) {
        console.log(`ANIMATING sweeper replay - progressive line drawing`);
        // Use the existing animateSweeperPlayback function or create progressive animation
        animateSweeperLine(canvasId, anchorPoints, 500) // 500ms total animation time
            .then(() => {
                console.log(`Sweeper animation completed for replay`);
            })
            .catch(err => {
                console.error('Sweeper animation error:', err);
                // Fallback to instant draw
                drawSweeperLines(canvasId);
            });
    } else {
        // Instant mode or oilbarrel - draw immediately
        drawSweeperLines(canvasId);
    }
    
    console.log(`Replayed ${smear.brushShape} smear with ${validAnchorPoints.length} anchors: size=${brushSize}, rotation=${brushRotation}, effects=${smear.activeEffects || 'none'}`);
} else {
    console.warn(`Skipping ${smear.brushShape} smear - insufficient anchor points:`, smear.anchorPoints?.length || 0);
    return true;
}
} else if (smear.brushShape === 'aestheticLines') {
            if (smear.anchorPoints) {
                drawAestheticLines(canvasId);
                console.log(`Replayed aestheticLines smear: (${lastX}, ${lastY}) to (${currentX}, ${currentY}), size=${brushSize}, rotation=${brushRotation}, effects=${smear.activeEffects || 'none'}`);
}
} else if (smear.brushShape === 'stickerMode' && smear.stickerSlot) {
if (stickerImages[smear.stickerSlot]) {
    smearPixels(currentX, currentY, canvasId, undefined, undefined, smear.stickerSlot);
    console.log(`Replayed stickerMode smear with slot ${smear.stickerSlot}: (${lastX}, ${lastY}) to (${currentX}, ${currentY}), size=${brushSize}, rotation=${brushRotation}, effects=${smear.activeEffects || 'none'}`);
} else {
    console.warn(`Sticker slot ${smear.stickerSlot} not loaded, skipping smear`);
}
} else if (smear.brushShape === 'squareSelection' || smear.brushShape === 'basquiatSelection') {
console.log(`Skipping selection smear for playback: (${lastX}, ${lastY}) to (${currentX}, ${currentY})`);
return true;
} else {
smearPixels(currentX, currentY, canvasId);
console.log(`Replayed ${smear.brushShape} smear: (${lastX}, ${lastY}) to (${currentX}, ${currentY}), size=${brushSize}, rotation=${brushRotation}, effects=${smear.activeEffects || 'none'}`);
        }
    } else if (event.type === 'effect') {
        const effectData = event.data;
        if (effectData.phase !== undefined) {
            if (effectData.effect === 'neon') neonPhase = effectData.phase;
            if (effectData.effect === 'flickerNegative') flickerPhase = effectData.phase;
            if (effectData.effect === 'chromaticShift') vhsPhase = effectData.phase;
            if (effectData.effect === 'emoji') emojiPhase = effectData.phase;
        }
        const key = keyLabels.find(k => k.effect === effectData.effect)?.key.toLowerCase();
        if (key) {
            if (effectData.state) {
                activeEffects.add(key);
            } else {
                activeEffects.delete(key);
            }
        }
        toggleEffect(effectData.effect, effectData.state, 'playback');
        const keyElement = Array.from(keyboardContainer.children).find(el => el.dataset.effect === effectData.effect);
        if (keyElement) {
            keyElement.classList.toggle('active', effectData.state);
            console.log(`UI updated for effect ${effectData.effect}: active=${effectData.state}`);
        }
        lastEffects[effectData.effect] = effectData.state;
        console.log(`Replayed effect: ${effectData.effect} = ${effectData.state}, phase=${effectData.phase || 'N/A'}, activeEffects:`, [...activeEffects]);
    } else if (event.type === 'size') {
        brushSize = event.data.size;
        updateBrushSize(brushSize);
        lastSize = brushSize;
        console.log(`Replayed size change: ${brushSize}, timestamp=${event.timestamp}ms`);
    } else if (event.type === 'rotation') {
        brushRotation = event.data.rotation || 0;
        lastRotation = brushRotation;
        console.log(`Replayed rotation: ${brushRotation}`);
    } else if (event.type === 'shape') {
        const validBrushes = ['box', 'circle', 'rectangle', 'triangle', 'sweeper', 'oilbarrel', 'tv', 'negative', 'melt', 'brokenScreen', 'aestheticLines', 'jazzScatter', 'stickerMode', 'squareSelection', 'basquiatSelection'];
        brushShape = validBrushes.includes(event.data.shape) ? event.data.shape : 'box';
        console.log(`Replayed shape change: ${brushShape}`);
    }
    currentImageData[canvasId] = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return true;
} catch (error) {
    console.error(`Error processing event ${index + 1}:`, error, event);
    return true;
}
}

async function animateSweeperLine(canvasId, anchorPoints, totalDuration = 500) {
return new Promise((resolve) => {
    if (!anchorPoints || anchorPoints.length < 2) {
        console.warn('animateSweeperLine: insufficient anchor points');
        resolve();
        return;
    }
    
    const canvas = canvasId === 'base' ? baseCanvas : 
                  canvasId === 'paint' ? paintCanvas : samplerCanvas;
    const ctx = canvasId === 'base' ? baseCtx : 
               canvasId === 'paint' ? paintCtx : samplerCtx;
    
    console.log(`Starting sweeper line animation with ${anchorPoints.length} points over ${totalDuration}ms`);
    
    // Save the current state
    const startImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Animation parameters
    const animationSteps = 20; // Number of animation frames
    const stepDuration = totalDuration / animationSteps;
    let currentStep = 0;
    
    const animateStep = () => {
        if (!isRolling || currentStep >= animationSteps) {
            // Animation complete - draw final result
            ctx.putImageData(startImageData, 0, 0);
            drawSweeperLines(canvasId);
            currentImageData[canvasId] = ctx.getImageData(0, 0, canvas.width, canvas.height);
            console.log('Sweeper line animation completed');
            resolve();
            return;
        }
        
        // Calculate animation progress (0 to 1)
        const progress = currentStep / animationSteps;
        
        // Restore starting state
        ctx.putImageData(startImageData, 0, 0);
        
        // Draw partial line based on progress
        if (progress > 0.1) { // Start drawing after 10% of animation
            const drawProgress = Math.min(1, (progress - 0.1) / 0.9); // Map 0.1-1.0 to 0.0-1.0
            drawPartialSweeperLine(canvasId, anchorPoints, drawProgress);
        }
        
        currentStep++;
        setTimeout(animateStep, stepDuration);
    };
    
    // Start the animation
    setTimeout(animateStep, 0);
});
}

// Add this helper function for drawing partial sweeper lines
function drawPartialSweeperLine(canvasId, anchorPoints, progress) {
if (!anchorPoints || anchorPoints.length < 2) return;

const canvas = canvasId === 'base' ? baseCanvas : 
              canvasId === 'paint' ? paintCanvas : samplerCanvas;
const ctx = canvasId === 'base' ? baseCtx : 
           canvasId === 'paint' ? paintCtx : samplerCtx;

// Calculate the end point based on progress
const totalLength = Math.sqrt(
    Math.pow(anchorPoints[1].x - anchorPoints[0].x, 2) + 
    Math.pow(anchorPoints[1].y - anchorPoints[0].y, 2)
);

const partialLength = totalLength * progress;
const direction = {
    x: (anchorPoints[1].x - anchorPoints[0].x) / totalLength,
    y: (anchorPoints[1].y - anchorPoints[0].y) / totalLength
};

const endX = anchorPoints[0].x + (direction.x * partialLength);
const endY = anchorPoints[0].y + (direction.y * partialLength);

// Create temporary anchor points for partial line
const tempAnchorPoints = [
    { ...anchorPoints[0] },
    { x: endX, y: endY, lastX: endX, lastY: endY, target: canvas }
];

// Temporarily set global anchor points and draw
const originalAnchorPoints = [...anchorPoints];
anchorPoints = tempAnchorPoints;

// Draw the partial line with current brush settings
drawSweeperLines(canvasId);

// Restore original anchor points
anchorPoints = originalAnchorPoints;
}

    function processNonSmearEvent(event) {
        if (!isRolling) return false;
        if (event.type === 'effect') {
            const effectData = event.data;
            if (effectData.phase !== undefined) {
                if (effectData.effect === 'neon') neonPhase = effectData.phase;
                if (effectData.effect === 'flickerNegative') flickerPhase = effectData.phase;
                if (effectData.effect === 'chromaticShift') vhsPhase = effectData.phase;
                if (effectData.effect === 'emoji') emojiPhase = effectData.phase;
            }
            toggleEffect(effectData.effect, effectData.state);
            lastEffects[effectData.effect] = effectData.state;
            console.log(`Processed non-smear effect: ${effectData.effect} = ${effectData.state}, phase=${effectData.phase || 'N/A'}`);
        } else if (event.type === 'size') {
            brushSize = event.data.size;
            updateBrushSize(brushSize);
            lastSize = brushSize;
            console.log(`Processed non-smear size change: ${brushSize}, timestamp=${event.timestamp}ms`);
        } else if (event.type === 'rotation') {
            brushRotation = event.data.rotation || 0;
            lastRotation = brushRotation;
            console.log(`Processed non-smear rotation: ${brushRotation}`);
        } else if (event.type === 'shape') {
            const validBrushes = ['box', 'circle', 'rectangle', 'triangle', 'sweeper', 'oilbarrel', 'tv', 'negative', 'melt', 'brokenScreen', 'aestheticLines', 'jazzScatter', 'stickerMode', 'squareSelection', 'basquiatSelection'];
            brushShape = validBrushes.includes(event.data.shape) ? event.data.shape : 'box';
            console.log(`Processed non-smear shape change: ${brushShape}`);
        }
        return true;
    }

    if (instantStrokes) {
        const brushBatches = {};
        const validBrushes = ['box', 'circle', 'rectangle', 'triangle', 'sweeper', 'oilbarrel', 'tv', 'negative', 'melt', 'brokenScreen', 'aestheticLines', 'jazzScatter', 'stickerMode'];
        for (const event of allEvents) {
            if (event.type !== 'smear') {
                processNonSmearEvent(event);
                continue;
            }
            const smear = event.data;
            if (!validBrushes.includes(smear.brushShape) || (smear.brushShape === 'stickerMode' && !smear.stickerSlot) || (smear.brushShape === 'stickerMode' && !stickerImages[smear.stickerSlot])) {
                continue;
            }
            if (smear.lastX === smear.currentX && smear.lastY === smear.currentY) {
                continue;
            }
            const currentX = Math.max(0, Math.min(canvas.width - 1, smear.currentX * xScale + offsetX));
            const currentY = Math.max(0, Math.min(canvas.height - 1, smear.currentY * yScale + offsetY));
            const brushKey = smear.brushShape + (smear.stickerSlot ? `_${smear.stickerSlot}` : '');
            if (!brushBatches[brushKey]) {
                brushBatches[brushKey] = {
                    coords: [],
                    state: {
                        size: brushSize,
                        rotation: lastRotation,
                        cloneSize: lastCloneSize,
                        cloneRotation: lastCloneRotation,
                        paintMode: lastPaintMode,
                        paintColor: { ...lastPaintColor },
                        flipHorizontal: lastFlipHorizontal,
                        flipVertical: lastFlipVertical,
                        activeEffects: smear.activeEffects || []
                    },
                    anchors: []
                };
            }
            const batch = brushBatches[brushKey];
            batch.coords.push(currentX, currentY);
            if (smear.rotation && smear.rotation !== batch.state.rotation) {
                brushRotation = smear.rotation;
                batch.state.rotation = brushRotation;
            }
            if (smear.cloneSize && smear.cloneSize !== batch.state.cloneSize) {
                cloneBrushSize = smear.cloneSize;
                batch.state.cloneSize = cloneBrushSize;
            }
            if (smear.cloneRotation && smear.cloneRotation !== batch.state.cloneRotation) {
                cloneBrushRotation = smear.cloneRotation;
                batch.state.cloneRotation = cloneBrushRotation;
            }
            if (smear.paintMode !== batch.state.paintMode) {
                isPaintMode = smear.paintMode !== undefined ? smear.paintMode : batch.state.paintMode;
                batch.state.paintMode = isPaintMode;
            }
            if (smear.paintColor && (smear.paintColor.r !== batch.state.paintColor.r || smear.paintColor.g !== batch.state.paintColor.g || smear.paintColor.b !== batch.state.paintColor.b)) {
                paintColor = { ...smear.paintColor };
                batch.state.paintColor = { ...paintColor };
            }
            if (smear.flipHorizontal !== batch.state.flipHorizontal) {
                isFlipHorizontalActive = smear.flipHorizontal !== undefined ? smear.flipHorizontal : batch.state.flipHorizontal;
                batch.state.flipHorizontal = isFlipHorizontalActive;
            }
            if (smear.flipVertical !== batch.state.flipVertical) {
                isFlipVerticalActive = smear.flipVertical !== undefined ? smear.flipVertical : batch.state.flipVertical;
                batch.state.flipVertical = isFlipVerticalActive;
            }
            if (smear.anchorPoints) {
                batch.anchors.push(smear.anchorPoints.map(p => ({
                    x: Math.max(0, Math.min(canvas.width - 1, p.x * xScale + offsetX)),
                    y: Math.max(0, Math.min(canvas.height - 1, p.y * yScale + offsetY)),
                    target: canvas
                })));
            }
            // Update activeEffects for the batch
            if (smear.activeEffects && Array.isArray(smear.activeEffects)) {
                batch.state.activeEffects = [...smear.activeEffects];
            }
        }

        // Render in one pass per brush type
        for (const brushKey in brushBatches) {
            const [brushType, stickerSlot] = brushKey.split('_');
            const batch = brushBatches[brushKey];
            brushShape = brushType;
            brushSize = batch.state.size;
            brushRotation = batch.state.rotation;
            cloneBrushSize = batch.state.cloneSize;
            cloneBrushRotation = batch.state.cloneRotation;
            isPaintMode = batch.state.paintMode;
            paintColor = batch.state.paintColor;
            isFlipHorizontalActive = batch.state.flipHorizontal;
            isFlipVerticalActive = batch.state.flipVertical;
            // Apply active effects for this batch
            Object.keys(lastEffects).forEach(effect => {
                if (lastEffects[effect]) {
                    toggleEffect(effect, false);
                    lastEffects[effect] = false;
                }
            });
            batch.state.activeEffects.forEach(effect => {
                toggleEffect(effect, true);
                lastEffects[effect] = true;
            });
            console.log(`Applied batch activeEffects for ${brushKey}: ${batch.state.activeEffects.join(', ')}`);
            updateBrushSize(brushSize);
            if (brushType === 'sweeper' || brushType === 'oilbarrel') {
                for (let i = 0; i < batch.anchors.length; i++) {
                    anchorPoints = batch.anchors[i];
                    drawSweeperLines(canvasId);
                }
            } else if (brushType === 'aestheticLines') {
                for (let i = 0; i < batch.anchors.length; i++) {
                    anchorPoints = batch.anchors[i];
                    drawAestheticLines(canvasId);
                }
            } else if (brushType === 'stickerMode' && stickerSlot) {
                smearPixelsBatch(batch.coords, canvasId, undefined, undefined, stickerSlot);
            } else if (brushType !== 'squareSelection' && brushType !== 'basquiatSelection') {
                smearPixelsBatch(batch.coords, canvasId);
            }
        }

        // Clean up effects after rendering
        Object.keys(lastEffects).forEach(effect => {
            if (lastEffects[effect]) {
                toggleEffect(effect, false);
                lastEffects[effect] = false;
            }
        });
        lastX = undefined;
        lastY = undefined;
        anchorPoints = [];
        currentImageData[canvasId] = ctx.getImageData(0, 0, canvas.width, canvas.height);
        ['base', 'paint', 'sampler'].forEach(otherId => {
            if (otherId !== canvasId) {
                const otherCtx = otherId === 'base' ? baseCtx : otherId === 'paint' ? paintCtx : samplerCtx;
                otherCtx.putImageData(prevState[otherId], 0, 0);
                currentImageData[otherId] = prevState[otherId];
            }
        });
        console.log('Completed instant movement replay on', canvasId, 'events processed:', allEvents.length, 'isRolling:', isRolling);
        resolve(true);
    } else {
        function processEvents(index) {
            if (index >= allEvents.length || !isRolling) {
                // Clean up effects after playback
                Object.keys(lastEffects).forEach(effect => {
                    if (lastEffects[effect]) {
                        toggleEffect(effect, false);
                        lastEffects[effect] = false;
                    }
                });
                lastX = undefined;
                lastY = undefined;
                anchorPoints = [];
                currentImageData[canvasId] = ctx.getImageData(0, 0, canvas.width, canvas.height);
                ['base', 'paint', 'sampler'].forEach(otherId => {
                    if (otherId !== canvasId) {
                        const otherCtx = otherId === 'base' ? baseCtx : otherId === 'paint' ? paintCtx : samplerCtx;
                        otherCtx.putImageData(prevState[otherId], 0, 0);
                        currentImageData[otherId] = prevState[otherId];
                    }
                });
                console.log('Completed animated movement replay on', canvasId, 'events processed:', index, 'isRolling:', isRolling);
                resolve(true);
                return;
            }

            const event = allEvents[index];
            const delay = index === 0 ? event.timestamp : event.timestamp - allEvents[index - 1].timestamp;

            setTimeout(() => {
                if (processEvent(event, index)) {
                    processEvents(index + 1);
                } else {
                    resolve(true);
                }
            }, delay);
        }

        processEvents(0);
    }
});
}

async function animateSweeperPlayback(smearData, startTime, duration, targetCanvasId) {
return new Promise((resolve) => {
    if (!smearData.anchorPoints || smearData.anchorPoints.length < 2) {
        console.warn('animateSweeperPlayback: insufficient anchor points');
        resolve();
        return;
    }

    const canvas = targetCanvasId === 'base' ? baseCanvas : 
                  targetCanvasId === 'paint' ? paintCanvas : samplerCanvas;
    const ctx = targetCanvasId === 'base' ? baseCtx : 
               targetCanvasId === 'paint' ? paintCtx : samplerCtx;

    // Set up the sweeper state
    const originalAnchorPoints = [...anchorPoints];
    const originalLastTouchPoints = [...lastTouchPoints];
    const originalMouseAnchorStart = mouseAnchorStart;

    // Apply the recorded anchor points
    anchorPoints = [...smearData.anchorPoints];
    
    // Set up lastTouchPoints for the animation
    lastTouchPoints = anchorPoints.map(p => ({
        x: p.lastX || p.x,
        y: p.lastY || p.y,
        lastX: p.lastX || p.x,
        lastY: p.lastY || p.y,
        target: p.target || canvas,
        id: p.id || p.fingerId || `anim_${Math.random()}`
    }));

    // Set up mouseAnchorStart if present
    if (smearData.mouseAnchorStart) {
        mouseAnchorStart = {
            x: smearData.mouseAnchorStart.x,
            y: smearData.mouseAnchorStart.y,
            target: smearData.mouseAnchorStart.target || canvas
        };
    } else if (anchorPoints.length >= 2) {
        mouseAnchorStart = {
            x: anchorPoints[0].x,
            y: anchorPoints[0].y,
            target: canvas
        };
    }

    console.log(`Starting sweeper animation with ${anchorPoints.length} points over ${duration}ms`);
    
    // Ensure canvas state is set up
    const state = canvasStates[targetCanvasId];
    if (!state.offscreenCanvas || state.offscreenCanvas.width !== canvas.width || state.offscreenCanvas.height !== canvas.height) {
        state.offscreenCanvas = document.createElement('canvas');
        state.offscreenCanvas.width = canvas.width;
        state.offscreenCanvas.height = canvas.height;
        const offscreenCtx = state.offscreenCanvas.getContext('2d', { alpha: true });
        offscreenCtx.imageSmoothingEnabled = true;
        offscreenCtx.imageSmoothingQuality = 'high';
        if (currentImageData[targetCanvasId]) {
            offscreenCtx.putImageData(currentImageData[targetCanvasId], 0, 0);
        }
    }

    // Animate the sweeper drawing
    const animationSteps = 20; // Number of animation frames
    const stepDuration = duration / animationSteps;
    let currentStep = 0;

    const animateStep = () => {
        if (!isRolling || currentStep >= animationSteps) {
            // Animation complete - draw final result
            drawSweeperLines(targetCanvasId);
            
            // Restore original state
            anchorPoints = originalAnchorPoints;
            lastTouchPoints = originalLastTouchPoints;
            mouseAnchorStart = originalMouseAnchorStart;
            
            console.log('Sweeper animation completed');
            resolve();
            return;
        }

        // Calculate animation progress (0 to 1)
        const progress = currentStep / animationSteps;
        
        // For now, just do a simple approach - draw the line gradually
        // You could make this more sophisticated by interpolating between points
        if (progress >= 0.5) { // Draw in the second half of animation
            drawSweeperLines(targetCanvasId);
        }

        currentStep++;
        setTimeout(animateStep, stepDuration);
    };

    // Start the animation
    setTimeout(animateStep, 0);
});
}

// New function to batch-render smears
function smearPixelsBatch(coords, canvasId, sourceX, sourceY, stickerSlot) {
const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
for (let i = 0; i < coords.length; i += 2) {
    smearPixels(coords[i], coords[i + 1], canvasId, sourceX, sourceY, stickerSlot);
}
}

stopResumeBtn.addEventListener('click', () => {
    if (isRolling) {
        isRolling = false;
        rollTimeouts.forEach(clearTimeout);
        rollTimeouts = [];
        stopResumeBtn.textContent = 'Resume';
        reverseBtn.style.display = 'inline-block';
        forwardBtn.style.display = 'inline-block';
    } else {
        isRolling = true;
        stopResumeBtn.textContent = 'Stop';
        const rolls = parseInt(diceRolls.value);
        if (isNaN(rolls) || rolls < 1 || rolls > 10000) {
            alert('Please set a valid number of rolls (1–10000).');
            diceRolls.value = 100; // Reset to default
            diceValue.textContent = 100;
            return;
        }
        console.log('Resuming randomizer with rolls:', rolls);
        const effects = Object.keys(effectMap);
        const shapes = Object.keys(brushButtons);
        const targets = [];
        if (document.getElementById('randomizeBase').checked) targets.push('base');
        if (document.getElementById('randomizePaint').checked) targets.push('paint');
        if (document.getElementById('randomizeSampler').checked) targets.push('sampler');
        const remainingRolls = rolls - completed;
        const useRecorded = recordedMovements.length > 0 && confirm('USE RECORDED MOVEMENTS INSTEAD OF RANDOM ONES?');
        let cumulativeDelay = 0;

        console.log('Resuming randomizer with', remainingRolls, 'remaining steps');
        for (let i = 0; i < remainingRolls; i++) {
            const strokeDelay = Math.min(50, Math.random() * 95 + 5);
            cumulativeDelay += strokeDelay;
            const timeout = setTimeout(() => {
                if (!isRolling) return;
                if (useRecorded && recordedMovements.length > 0) {
                    const move = recordedMovements[(completed + i) % recordedMovements.length];
                    const targetCanvas = move.targetCanvas || 'base';
                    if (targets.includes(targetCanvas)) {
                        const ctx = targetCanvas === 'base' ? baseCtx : targetCanvas === 'paint' ? paintCtx : samplerCtx;
                        const canvas = ctx.canvas;
                        const prevState = {
                            base: baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height),
                            paint: paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height),
                            sampler: samplerCtx.getImageData(0, 0, samplerCanvas.width, samplerCanvas.height)
                        };
                        const offsetX = Math.random() * canvas.width;
                        const offsetY = Math.random() * canvas.height;
                        const instantStrokes = document.getElementById('instantStrokes').checked;
                        replayRecordedMovement(targetCanvas, offsetX, offsetY, instantStrokes).then(success => {
                            if (success) {
                                rollHistory[targetCanvas].push({
                                    imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
                                    movementIndex: (completed + i) % recordedMovements.length,
                                    offsetX,
                                    offsetY
                                });
                                // Restore other canvases
                                ['base', 'paint', 'sampler'].forEach(otherId => {
                                    if (otherId !== targetCanvas) {
                                        const otherCtx = otherId === 'base' ? baseCtx : otherId === 'paint' ? paintCtx : samplerCtx;
                                        otherCtx.putImageData(prevState[otherId], 0, 0);
                                        currentImageData[otherId] = prevState[otherId];
                                    }
                                });
                                console.log(`Resumed step ${completed + 1}: Replayed movement ${(completed + i) % recordedMovements.length} on ${targetCanvas} at offset (${offsetX}, ${offsetY})`);
                            } else {
                                console.warn(`Resumed step ${completed + 1}: Failed to replay movement on ${targetCanvas}`);
                            }
                            completed++;
                            progressBar.style.width = `${(completed / rolls) * 100}%`;
                            if (completed === rolls) {
                                effects.forEach(effect => toggleEffect(effect, false));
                                brushShape = 'box';
                                sweeperMode = 'off';
                                Object.values(brushButtons).forEach(btn => btn.classList.remove('selected'));
                                brushButtons.box.classList.add('selected');
                                brushSize = baseBrushSize;
                                sizeValue.textContent = brushSize;
                                randomizerModal.style.display = 'none';
                                rockNRollBtn.disabled = false;
                                isRolling = false;
                                stopResumeBtn.style.display = 'none';
                                reverseBtn.style.display = 'none';
                                forwardBtn.style.display = 'none';
                                rollTimeouts = [];
                                console.log('Randomizer resumed and finished, rollHistory:', rollHistory);
                            }
                        });
                    } else {
                        completed++;
                        progressBar.style.width = `${(completed / rolls) * 100}%`;
                        if (completed === rolls) {
                            effects.forEach(effect => toggleEffect(effect, false));
                            brushShape = 'box';
                            sweeperMode = 'off';
                            Object.values(brushButtons).forEach(btn => btn.classList.remove('selected'));
                            brushButtons.box.classList.add('selected');
                            brushSize = baseBrushSize;
                            sizeValue.textContent = brushSize;
                            randomizerModal.style.display = 'none';
                            rockNRollBtn.disabled = false;
                            isRolling = false;
                            stopResumeBtn.style.display = 'none';
                            reverseBtn.style.display = 'none';
                            forwardBtn.style.display = 'none';
                            rollTimeouts = [];
                            console.log('Randomizer resumed and finished, rollHistory:', rollHistory);
                        }
                    }
                } else {
                    effects.forEach(effect => toggleEffect(effect, false));
                    const randomEffect = effects[Math.floor(Math.random() * effects.length)];
                    toggleEffect(randomEffect, true);
                    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
                    brushShape = randomShape;
                    if (brushShape === 'sweeper') sweeperMode = 'on'; else sweeperMode = 'off';
                    Object.values(brushButtons).forEach(btn => btn.classList.remove('selected'));
                    brushButtons[brushShape].classList.add('selected');
                    brushSize = Math.random() * 500 + 10;
                    targets.forEach(canvasId => {
                        const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
                        lastX = Math.random() * ctx.canvas.width;
                        lastY = Math.random() * ctx.canvas.height;
                        const currentX = Math.random() * ctx.canvas.width;
                        const currentY = Math.random() * ctx.canvas.height;
                        if (brushShape === 'sweeper' || brushShape === 'oilbarrel') {
                            anchorPoints = [
                                { x: lastX, y: lastY, target: ctx.canvas },
                                { x: currentX, y: currentY, target: ctx.canvas }
                            ];
                            if (brushShape === 'sweeper') drawSweeperLines(canvasId);
                            else drawOilBarrelLines(canvasId);
                        } else {
                            smearPixels(currentX, currentY, canvasId);
                        }
                        rollHistory[canvasId].push({
                            effect: randomEffect,
                            shape: brushShape,
                            size: brushSize,
                            lastX,
                            lastY,
                            currentX,
                            currentY,
                            imageData: ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
                        });
                    });
                    const effectDuration = Math.random() * 450 + 50;
                    setTimeout(() => toggleEffect(randomEffect, false), effectDuration);
                    completed++;
                    progressBar.style.width = `${(completed / rolls) * 100}%`;
                    if (completed === rolls) {
                        effects.forEach(effect => toggleEffect(effect, false));
                        brushShape = 'box';
                        sweeperMode = 'off';
                        Object.values(brushButtons).forEach(btn => btn.classList.remove('selected'));
                        brushButtons.box.classList.add('selected');
                        brushSize = baseBrushSize;
                        sizeValue.textContent = brushSize;
                        randomizerModal.style.display = 'none';
                        rockNRollBtn.disabled = false;
                        isRolling = false;
                        stopResumeBtn.style.display = 'none';
                        reverseBtn.style.display = 'none';
                        forwardBtn.style.display = 'none';
                        rollTimeouts = [];
                        console.log('Randomizer resumed and finished, rollHistory:', rollHistory);
                    }
                }
            }, cumulativeDelay);
            rollTimeouts.push(timeout);
        }
    }
});

reverseBtn.addEventListener('click', () => {
    if (completed > 0) {
        completed--;
        const targets = [];
        if (document.getElementById('randomizeBase').checked) targets.push('base');
        if (document.getElementById('randomizePaint').checked) targets.push('paint');
        if (document.getElementById('randomizeSampler').checked) targets.push('sampler');
        targets.forEach(canvasId => {
            const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
            const prevState = rollHistory[canvasId][completed - 1] || { imageData: originalImageData[canvasId] };
            ctx.putImageData(prevState.imageData, 0, 0);
            currentImageData[canvasId] = prevState.imageData;
        });
        progressBar.style.width = `${(completed / parseInt(diceRolls.value)) * 100}%`;
    }
});

forwardBtn.addEventListener('click', () => {
    const rolls = parseInt(diceRolls.value);
    const targets = [];
    if (document.getElementById('randomizeBase').checked) targets.push('base');
    if (document.getElementById('randomizePaint').checked) targets.push('paint');
    if (document.getElementById('randomizeSampler').checked) targets.push('sampler');
    if (completed < rolls) {
        targets.forEach(canvasId => {
            const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
            if (completed < rollHistory[canvasId].length) {
                const nextState = rollHistory[canvasId][completed];
                ctx.putImageData(nextState.imageData, 0, 0);
                currentImageData[canvasId] = nextState.imageData;
            }
        });
        completed++;
        progressBar.style.width = `${(completed / rolls) * 100}%`;
        if (completed === rolls) {
            effects.forEach(effect => toggleEffect(effect, false));
            brushShape = 'box';
            sweeperMode = 'off';
            Object.values(brushButtons).forEach(btn => btn.classList.remove('selected'));
            brushButtons.box.classList.add('selected');
            brushSize = baseBrushSize;
            sizeValue.textContent = brushSize;
            randomizerModal.style.display = 'none';
            rockNRollBtn.disabled = false;
            isRolling = false;
            stopResumeBtn.style.display = 'none';
            reverseBtn.style.display = 'none';
            forwardBtn.style.display = 'none';
            rollTimeouts = [];
        }
    }
});

function captureNeonOriginal(canvasId) {
    const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
    const halfBrush = brushSize / 2;
    const xMin = Math.max(0, lastX - halfBrush * 1.5);
    const xMax = Math.min(ctx.canvas.width - 1, lastX + halfBrush * 1.5);
    const yMin = Math.max(0, lastY - halfBrush * 1.5);
    const yMax = Math.min(ctx.canvas.height - 1, lastY + halfBrush * 1.5);
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    neonOriginalPixels = [];
    for (let y = Math.floor(yMin); y <= Math.floor(yMax); y++) {
        for (let x = Math.floor(xMin); x <= Math.floor(xMax); x++) {
            if (isPixelInBrushShape(x, y, lastX, lastY, halfBrush)) {
                const i = (y * ctx.canvas.width + x) * 4;
                neonOriginalPixels.push({ r: data[i], g: data[i + 1], b: data[i + 2], x, y });
            }
        }
    }
}

function restoreNeonOriginal(canvasId) {
    if (!neonOriginalPixels.length) return;
    const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    neonOriginalPixels.forEach(pixel => {
        const halfBrush = brushSize / 2;
        if (isPixelInBrushShape(pixel.x, pixel.y, lastX, lastY, halfBrush)) {
            const newI = (pixel.y * ctx.canvas.width + pixel.x) * 4;
            data[newI] = pixel.r;
            data[newI + 1] = pixel.g;
            data[newI + 2] = pixel.b;
        }
    });
    ctx.putImageData(imageData, 0, 0);
    currentImageData[canvasId] = imageData;
    neonOriginalPixels = [];
}

function toggleEffect(effect, state, inputSource = 'qwertyKey') {
    console.log(`toggleEffect called: effect=${effect}, state=${state}, inputSource=${inputSource}, isRecording=${isRecording}, currentMovement=${!!currentMovement}`);

    // Ensure effect is valid
    if (!Object.keys(effectMap).includes(effect)) {
        console.warn(`Invalid effect: ${effect}, skipping toggle`);
        return;
    }

    // Clear canvases before toggling effect to remove lingering frames
    if (state && inputSource === 'button') {
        const targetCanvas = baseCanvas; // Default; adjust if needed
        if (selectionCanvas && selectionCtx && selectionCanvas.dataset.targetCanvasId === targetCanvas.id) {
            selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
            console.log(`Cleared selection canvas for ${targetCanvas.id} before toggling ${effect}`);
        }
        if (paintCtx && currentImageData.paint) {
            paintCtx.putImageData(currentImageData.paint, 0, 0);
            console.log('Refreshed paintCanvas before toggling effect');
        }
    }

    // Prevent rendering if isDragging is true but no active drag
    if (isDragging && inputSource === 'button' && touchPoints.length === 0) {
        console.warn(`toggleEffect: Skipped rendering for ${effect} due to stale isDragging state`);
        lastX = undefined;
        lastY = undefined;
        return;
    }

    // Record effect toggle
    if (isRecording) {
        if (!currentMovement) {
            console.warn('No currentMovement, initializing new movement for effect recording');
            currentMovement = {
                smears: [],
                events: [],
                effects: {},
                eventCount: 0,
                startTime: performance.now(),
                targetCanvas: 'base' // Default canvas
            };
            recordedMovements.push(currentMovement);
        }
        const effectData = { 
            effect, 
            state,
            phase: (
                effect === 'neon' ? neonPhase :
                effect === 'flickerNegative' ? flickerPhase :
                effect === 'chromaticShift' ? vhsPhase :
                effect === 'emoji' ? emojiPhase : undefined
            ),
            timestamp: performance.now() - currentMovement.startTime,
            fingerRole: inputSource
        };
        recordMovement('effect', effectData);
        currentMovement.effects = currentMovement.effects || {};
        currentMovement.effects[effect] = state;
        console.log(`Effect recorded: ${effect}, state=${state}, timestamp=${effectData.timestamp}`);
    }

    const canvasChangingEffects = [
        'neon', 'original', 'emoji', 'trash', 'flag', 'chromaticShift', 'teleport',
        'caustics', 'fractalStretch', 'neonBend', 'glitchTide', 'binaryRain',
        'photoCRT', 'pointBreak', 'scatter', 'flipHorizontal', 'flipVertical', 'flickerNegative'
    ];
    if (canvasChangingEffects.includes(effect) && state && !isDragging) {
        saveState(true);
    }

    switch (effect) {
        case 'lock':
            isLockHeld = state;
            break;
        case 'hyphen':
            isHyphenHeld = state;
            break;
        case 'brighten':
            isBrightenHeld = state;
            break;
        case 'darken':
            isDarkenHeld = state;
            break;
        case 'neon':
            isNeonHeld = state;
            if (state && lastX !== undefined && lastY !== undefined) {
                const canvasId = touchPoints[0]?.target === baseCanvas ? 'base' : touchPoints[0]?.target === paintCanvas ? 'paint' : 'sampler';
                captureNeonOriginal(canvasId);
            } else {
                const canvasId = touchPoints[0]?.target === baseCanvas ? 'base' : touchPoints[0]?.target === paintCanvas ? 'paint' : 'sampler';
                restoreNeonOriginal(canvasId);
            }
            break;
        case 'original':
            isOriginalHeld = state;
            break;
        case 'emoji':
            isEmojiHeld = state;
            break;
        case 'trash':
            isTrashHeld = state;
            break;
        case 'flag':
            isFlagHeld = state;
            if (state) saturationStartTime = Date.now();
            else {
                saturationLevel = 0;
                saturationStartTime = null;
            }
            break;
        case 'chromaticShift':
            isChromaticShiftHeld = state;
            break;
        case 'teleport':
            isTeleportHeld = state;
            if (!state) {
                teleportSourceX = null;
                teleportSourceY = null;
                crossTeleportSourceCanvas = null;
                crossTeleportSourceX = null;
                crossTeleportSourceY = null;
                teleportFirstFinger = null;
                teleportChain = [];
                console.log('Teleport reset');
            }
            break;
        case 'caustics':
            isCausticsHeld = state;
            break;
        case 'fractalStretch':
            isFractalStretchHeld = state;
            break;
        case 'neonBend':
            isNeonBendHeld = state;
            break;
        case 'glitchTide':
            isGlitchTideHeld = state;
            break;
        case 'binaryRain':
            isBinaryRainHeld = state;
            break;
        case 'photoCRT':
            isPhotoCRTHeld = state;
            break;
        case 'pointBreak':
            isPointBreakHeld = state;
            break;
        case 'scatter':
            isScatterHeld = state;
            break;
        case 'flipHorizontal':
            if (state) {
                isFlipHorizontalActive = true;
                hasFlippedHorizontalThisDrag = isDragging;
                flipStamps('horizontal');
                console.log(`flipHorizontal toggled to ${isFlipHorizontalActive}`);
                if (lastX !== undefined && lastY !== undefined) {
                    flipPivotX = lastX;
                    flipPivotY = lastY;
                    captureFlippedSnapshot('horizontal');
                }
            } else {
                isFlipHorizontalActive = false;
                hasFlippedHorizontalThisDrag = false;
                flipPivotX = null;
                flipPivotY = null;
                flippedBrushSnapshot = null;
                console.log(`flipHorizontal turned off`);
            }
            break;
        case 'flipVertical':
            if (state) {
                isFlipVerticalActive = true;
                hasFlippedVerticalThisDrag = isDragging;
                flipStamps('vertical');
                console.log(`flipVertical toggled to ${isFlipVerticalActive}`);
                if (lastX !== undefined && lastY !== undefined) {
                    flipPivotX = lastX;
                    flipPivotY = lastY;
                    captureFlippedSnapshot('vertical');
                }
            } else {
                isFlipVerticalActive = false;
                hasFlippedVerticalThisDrag = false;
                flipPivotX = null;
                flipPivotY = null;
                flippedBrushSnapshot = null;
                console.log(`flipVertical turned off`);
            }
            break;
        case 'ditherVibe':
            isDitherVibeHeld = state;
            console.log(`ditherVibe toggled to ${isDitherVibeHeld}`);
            break;
        case 'flickerNegative':
            isFlickerNegativeHeld = state;
            if (!state) flickerPhase = 0;
            console.log(`flickerNegative toggled to ${isFlickerNegativeHeld}`);
            break;
        default:
            console.warn(`Unknown effect: ${effect}`);
            return;
    }

    const keyElement = Array.from(keyboardContainer.children).find(el => el.dataset.effect === effect);
if (keyElement) {
const effectStates = {
    'lock': isLockHeld,
    'hyphen': isHyphenHeld,
    'brighten': isBrightenHeld,
    'darken': isDarkenHeld,
    'neon': isNeonHeld,
    'original': isOriginalHeld,
    'emoji': isEmojiHeld,
    'trash': isTrashHeld,
    'flag': isFlagHeld,
    'chromaticShift': isChromaticShiftHeld,
    'teleport': isTeleportHeld,
    'caustics': isCausticsHeld,
    'fractalStretch': isFractalStretchHeld,
    'neonBend': isNeonBendHeld,
    'glitchTide': isGlitchTideHeld,
    'binaryRain': isBinaryRainHeld,
    'photoCRT': isPhotoCRTHeld,
    'pointBreak': isPointBreakHeld,
    'scatter': isScatterHeld,
    'flipHorizontal': isFlipHorizontalActive,
    'flipVertical': isFlipVerticalActive,
    'ditherVibe': isDitherVibeHeld,
    'flickerNegative': isFlickerNegativeHeld
};
const isActive = effectStates[effect] || false;
keyElement.classList.toggle('active', isActive);
console.log(`UI updated for ${effect}: active=${isActive}`);
} else {
console.warn(`No key element found for effect: ${effect}`);
}

    // Only render during active drag with valid touch points
    if (state && isDragging && touchPoints.length > 0 && lastX !== undefined && lastY !== undefined && effect !== 'flipHorizontal' && effect !== 'flipVertical') {
        const canvasId = touchPoints[0].target === baseCanvas ? 'base' : touchPoints[0].target === paintCanvas ? 'paint' : 'sampler';
        smearPixels(lastX, lastY, canvasId);
        saveState();
    }

    // Reset lastX, lastY when deactivating effect to prevent stale rendering
    if (!state && inputSource === 'button') {
        lastX = undefined;
        lastY = undefined;
        console.log('Reset lastX, lastY to prevent stale effect rendering');
    }
}

function captureFlippedSnapshot(direction) {
    const canvasId = touchPoints[0]?.target === baseCanvas ? 'base' : touchPoints[0]?.target === paintCanvas ? 'paint' : 'sampler';
    const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
    const halfBrush = brushSize / 2;
    const xMin = Math.max(0, Math.floor(lastX - halfBrush));
    const xMax = Math.min(ctx.canvas.width - 1, Math.ceil(lastX + halfBrush));
    const yMin = Math.max(0, Math.floor(lastY - halfBrush));
    const yMax = Math.min(ctx.canvas.height - 1, Math.ceil(lastY + halfBrush));
    flippedBrushWidth = xMax - xMin;
    flippedBrushHeight = yMax - yMin;

    // Create an offscreen canvas for the snapshot
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = flippedBrushWidth;
    tempCanvas.height = flippedBrushHeight;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(ctx.canvas, xMin, yMin, flippedBrushWidth, flippedBrushHeight, 0, 0, flippedBrushWidth, flippedBrushHeight);

    // Flip the snapshot
    tempCtx.save();
    if (direction === 'horizontal') {
        tempCtx.scale(-1, 1);
        tempCtx.drawImage(tempCanvas, 0, 0, flippedBrushWidth, flippedBrushHeight, -flippedBrushWidth, 0, flippedBrushWidth, flippedBrushHeight);
    } else if (direction === 'vertical') {
        tempCtx.scale(1, -1);
        tempCtx.drawImage(tempCanvas, 0, 0, flippedBrushWidth, flippedBrushHeight, 0, -flippedBrushHeight, flippedBrushWidth, flippedBrushHeight);
    }
    tempCtx.restore();

    flippedBrushSnapshot = tempCtx.getImageData(0, 0, flippedBrushWidth, flippedBrushHeight);
}

function flipStamps(direction) {
    Object.keys(stickerImages).forEach(key => {
        const img = stickerImages[key];
        if (img) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.save();
            if (direction === 'horizontal') {
                tempCtx.scale(-1, 1);
                tempCtx.drawImage(img, -img.width, 0);
            } else if (direction === 'vertical') {
                tempCtx.scale(1, -1);
                tempCtx.drawImage(img, 0, -img.height);
            }
            tempCtx.restore();
            const flippedImg = new Image();
            flippedImg.src = tempCanvas.toDataURL('image/png');
            flippedImg.onload = () => {
                flippedStampImages[key][direction] = flippedImg;
                console.log(`Flipped ${key} ${direction}`);
            };
        }
    });
}

function isPixelInBrushShape(px, py, centerX, centerY, halfBrush) {
    // Adjust for rotation
    const relX = px - centerX;
    const relY = py - centerY;
    const cosRot = Math.cos(-brushRotation); // Inverse rotation
    const sinRot = Math.sin(-brushRotation);
    let adjX = relX * cosRot - relY * sinRot;
    let adjY = relX * sinRot + relY * cosRot;

    // Apply flipping
    if (isFlipVerticalActive) {
        adjY = -adjY;
    }
    if (isFlipHorizontalActive) {
        adjX = -adjX;
    }

    const dx = Math.abs(adjX);
    const dy = Math.abs(adjY);

    if (brushShape === 'box') return dx <= halfBrush && dy <= halfBrush;
    if (brushShape === 'circle') return Math.sqrt(dx * dx + dy * dy) <= halfBrush;
    if (brushShape === 'rectangle') return dx <= halfBrush * 1.5 && dy <= halfBrush * 0.5;
    if (brushShape === 'triangle') {
        const height = halfBrush * 1.414;
        const slope = height / halfBrush;
        return dy <= height / 2 && dy >= -height / 2 && dx <= (height / 2 - Math.abs(dy)) / slope;
    }
    if (brushShape === 'melt') return dx <= halfBrush && dy <= halfBrush;
    if (brushShape === 'tv') return dx <= halfBrush && dy <= halfBrush;
    if (brushShape === 'negative') return dx <= halfBrush && dy <= halfBrush;
    if (brushShape === 'brokenScreen') return dx <= halfBrush && dy <= halfBrush;
    if (brushShape === 'jazzScatter') return dx <= halfBrush && dy <= halfBrush;
    return false; // Sweeper and oilbarrel handled separately
}

// Save button (💾) opens modal
document.getElementById('saveBtn').addEventListener('click', () => {
    document.getElementById('saveModal').style.display = 'block';
    // Set default resolution based on current canvas
    const canvasId = document.getElementById('saveCanvas').value;
    document.getElementById('saveWidth').value = originalWidths[canvasId] || 1920;
    document.getElementById('saveHeight').value = originalHeights[canvasId] || 1080;
});

// Save modal handlers
document.getElementById('closeSaveBtn').addEventListener('click', () => {
    document.getElementById('saveModal').style.display = 'none';
});
document.getElementById('cancelSaveBtn').addEventListener('click', () => {
    document.getElementById('saveModal').style.display = 'none';
});
document.getElementById('confirmSaveBtn').addEventListener('click', () => {
    const canvasId = document.getElementById('saveCanvas').value;
    const format = document.getElementById('saveFormat').value;
    const width = parseInt(document.getElementById('saveWidth').value);
    const height = parseInt(document.getElementById('saveHeight').value);

    if (!width || !height || width <= 0 || height <= 0 || width > 10000 || height > 10000) {
        alert('PLEASE ENTER VALID WIDTH AND HEIGHT (1-10000).');
        return;
    }

    const canvasMap = {
        base: baseCanvas,
        paint: paintCanvas,
        sampler: samplerCanvas
    };
    const canvas = canvasMap[canvasId];
    if (!canvas) {
        alert('INVALID CANVAS SELECTED.');
        return;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d', { alpha: true, willReadFrequently: true });
    tempCtx.imageSmoothingEnabled = true; // Enable smoothing for better scaling

    // Draw current canvas content at user-defined resolution
    tempCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, width, height);

    const link = document.createElement('a');
link.download = `${canvasId}_smeared_image.${format}`;
link.href = tempCanvas.toDataURL(`image/${format}`, format === 'png' ? 1.0 : 0.9);
link.click();

document.getElementById('saveModal').style.display = 'none';
});
// Set Resolution Button and Modal Handlers
document.getElementById('setResolutionBtn').addEventListener('click', () => {
document.getElementById('resolutionModal').style.display = 'block';
// Set default values based on current canvas
const canvasId = 'base'; // Default to base canvas
document.getElementById('canvasWidth').value = originalWidths[canvasId] || 1920;
document.getElementById('canvasHeight').value = originalHeights[canvasId] || 1080;
});

document.getElementById('closeResolutionBtn').addEventListener('click', () => {
document.getElementById('resolutionModal').style.display = 'none';
});

document.getElementById('cancelResolutionBtn').addEventListener('click', () => {
document.getElementById('resolutionModal').style.display = 'none';
});

document.getElementById('confirmResolutionBtn').addEventListener('click', () => {
const width = parseInt(document.getElementById('canvasWidth').value);
const height = parseInt(document.getElementById('canvasHeight').value);

// Validate input
if (!width || !height || width <= 0 || height <= 0 || width > 10000 || height > 10000) {
    alert('Please enter valid width and height (1-10000).');
    return;
}

// Save current canvas states before resizing
saveState(true);

// Resize all canvases and redraw content
['base', 'paint', 'sampler'].forEach(canvasId => {
    const canvas = canvasId === 'base' ? baseCanvas : canvasId === 'paint' ? paintCanvas : samplerCanvas;
    const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;

    // Store current content
    const currentData = currentImageData[canvasId];
    const originalData = originalImageData[canvasId];

    // Update canvas dimensions
    canvas.width = width;
    canvas.height = height;
    originalWidths[canvasId] = width;
    originalHeights[canvasId] = height;

    // Redraw content with high quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, width, height);
    
    // Fill with white background to ensure we have a drawing surface
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    if (currentData) {
        // Create temporary canvas to hold current data
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = currentData.width;
        tempCanvas.height = currentData.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(currentData, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0, currentData.width, currentData.height, 0, 0, width, height);
    } else if (canvasId === 'base' && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, width, height);
    } else if (canvasId === 'sampler' && samplerImg.complete && samplerImg.naturalWidth > 0) {
        ctx.drawImage(samplerImg, 0, 0, width, height);
    }

    // Update image data AFTER drawing
    currentImageData[canvasId] = ctx.getImageData(0, 0, width, height);
    if (!originalImageData[canvasId] || canvasId === 'paint') {
        originalImageData[canvasId] = ctx.getImageData(0, 0, width, height);
    }

    // CRITICAL: Recreate offscreen canvas with new dimensions
    canvasStates[canvasId].offscreenCanvas = document.createElement('canvas');
    canvasStates[canvasId].offscreenCanvas.width = width;
    canvasStates[canvasId].offscreenCanvas.height = height;
    const offscreenCtx = canvasStates[canvasId].offscreenCanvas.getContext('2d', { alpha: true });
    offscreenCtx.imageSmoothingEnabled = true;
    offscreenCtx.imageSmoothingQuality = 'high';
    
    // Copy current canvas content to offscreen canvas
    offscreenCtx.putImageData(currentImageData[canvasId], 0, 0);
    
    console.log(`Recreated offscreen canvas for ${canvasId}: ${width}x${height}`);

    // Reset zoom and pan
    canvasStates[canvasId].zoomLevel = 1;
    canvasStates[canvasId].panX = 0;
    canvasStates[canvasId].panY = 0;
    canvasStates[canvasId].targetLocked = false;
});

// Update offscreen canvas
offscreenCanvas.width = width;
offscreenCanvas.height = height;

// Save new state and close modal
saveState(true);
document.getElementById('resolutionModal').style.display = 'none';
console.log(`Resolution set to ${width}x${height} for all canvases`);
});

// Update resolution inputs when canvas selection changes
document.getElementById('saveCanvas').addEventListener('change', () => {
const canvasId = document.getElementById('saveCanvas').value;
document.getElementById('saveWidth').value = originalWidths[canvasId] || 1920;
document.getElementById('saveHeight').value = originalHeights[canvasId] || 1080;
});
const zoomBtn = document.getElementById('zoomBtn');

// Store canvas event handlers for cleanup
const zoomEventHandlers = {
dblclick: null,
mousedown: null,
mousemove: null,
mouseup: null,
touchstart: null,
touchmove: null,
touchend: null
};

function saveState(forceSave = false, changedCanvasId = null) {
// Skip save during active drag/zoom unless forced
if ((isDragging || isZooming) && !forceSave) {
    console.log('Skipped saveState during active operation - waiting for forceSave');
    return;
}

const canvases = {
    base: { canvas: baseCanvas, ctx: baseCtx },
    paint: { canvas: paintCanvas, ctx: paintCtx },
    sampler: { canvas: samplerCanvas, ctx: samplerCtx }
};

const newState = {};
let hasAnyChanges = false;

Object.keys(canvases).forEach(key => {
    const { canvas, ctx } = canvases[key];
    const state = canvasStates[key];
    
    // Always get unzoomed content from display canvas to ensure we don't save zoomed state
    const tempCtx = ctx;
    tempCtx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to get raw content
    const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
    
    newState[key] = imageData;
    
    // Update currentImageData
    currentImageData[key] = imageData;
    
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
    if (forceSave || !undoStack.length || !compareImageData(undoStack[undoStack.length - 1]?.[key], imageData)) {
        hasAnyChanges = true;
    }
});

// Only save if there are actual changes or it's forced
if (forceSave || hasAnyChanges) {
    // Limit stack size and clear redo stack
    if (undoStack.length >= 50) undoStack.shift();
    redoStack = []; // Clear redo stack on new state
    undoStack.push(newState);

    hasCanvasChanged = false; // Reset after saving
    
    if (isRecording) {
        recordMovement('state', { canvasId: changedCanvasId });
    }
    
    console.log('Saved state - Changed canvas:', changedCanvasId, 'Undo stack size:', undoStack.length, 'Forced:', forceSave);
    
    // Clear reset states when user makes new changes (not during reset operations)
    if (hasAnyChanges && !forceSave) {
        clearResetStates();
    }
    
    // Trim empty states after push
    trimEmptyStates(undoStack);
} else {
    console.log('Skipped saveState - No changes detected and not forced');
}

console.log('Saved state - Changed canvas:', changedCanvasId, 'Undo stack size:', undoStack.length, 'Forced:', forceSave);

// Clear reset states when user makes new changes (not during reset operations)
if (hasAnyChanges && !forceSave) {
    clearResetStates();
}
}

function ensureInitialState() {
if (undoStack.length === 0) {
    const initialState = {
        base: baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height),
        paint: paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height),
        sampler: samplerCtx.getImageData(0, 0, samplerCanvas.width, samplerCanvas.height)
    };
    undoStack.push(initialState);
    console.log('Created initial undo state');
}
}

// Helper function to compare image data
function compareImageData(imageData1, imageData2) {
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


function redrawCanvas(canvasKey, canvas, ctx, state) {
if (!state.offscreenCanvas || state.offscreenCanvas.width !== canvas.width || state.offscreenCanvas.height !== canvas.height) {
    console.warn(`Invalid offscreenCanvas for ${canvasKey}, reinitializing`);
    state.offscreenCanvas = document.createElement('canvas');
    state.offscreenCanvas.width = canvas.width;
    state.offscreenCanvas.height = canvas.height;
    const offscreenCtx = state.offscreenCanvas.getContext('2d', { alpha: true });
    offscreenCtx.imageSmoothingEnabled = true;
    offscreenCtx.imageSmoothingQuality = 'high';
}
const offscreenCtx = state.offscreenCanvas.getContext('2d', { alpha: true });

// Sync offscreen canvas
let imageData = currentImageData[canvasKey];
if (!imageData || imageData.width !== canvas.width || imageData.height !== canvas.height) {
    // Get unzoomed content by resetting transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    currentImageData[canvasKey] = imageData;
    console.log(`Refreshed currentImageData for ${canvasKey} in redrawCanvas with unzoomed data`);
    
    // Restore transform if needed
    if (state.zoomLevel !== 1 || state.panX !== 0 || state.panY !== 0) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(state.panX, state.panY);
        ctx.scale(state.zoomLevel, state.zoomLevel);
        ctx.putImageData(imageData, 0, 0);
        ctx.restore();
    }
}
offscreenCtx.clearRect(0, 0, canvas.width, canvas.height);
offscreenCtx.putImageData(imageData, 0, 0);

// Draw with transformations
ctx.setTransform(1, 0, 0, 1, 0, 0);
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#FFFFFF';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.save();
ctx.translate(state.panX || 0, state.panY || 0);
const appliedZoomLevel = state.zoomLevel || 1;
ctx.scale(appliedZoomLevel, appliedZoomLevel);
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';
ctx.drawImage(state.offscreenCanvas, 0, 0);
ctx.restore();

// Enhanced logging
console.log(`Redraw for ${canvasKey}: zoomLevel=${appliedZoomLevel.toFixed(6)}, pan=(${state.panX || 0}, ${state.panY || 0}), hasContent=${imageData.data.some(v => v !== 0)}`);
}

function handleTouchMove(e) {
console.log(`TouchMove: touches=${e.touches.length}, clientY=${e.touches[0]?.clientY}, lastY=${lastTouchPoints[0]?.clientY}, deltaY=${e.touches[0]?.clientY - lastTouchPoints[0]?.clientY}`);
// Existing touchmove logic
}


function getCanvasCoordinates(e, touch) {
const canvas = touch.target || e.target;
const validCanvases = [baseCanvas, paintCanvas, samplerCanvas];
if (!validCanvases.includes(canvas)) {
    console.log('Skipping coordinate calculation for non-canvas target:', canvas.tagName);
    return { x: 0, y: 0, valid: false };
}

const rect = canvas.getBoundingClientRect();
const clientX = touch.clientX !== undefined && !isNaN(touch.clientX) ? touch.clientX : 
                (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX);
const clientY = touch.clientY !== undefined && !isNaN(touch.clientY) ? touch.clientY : 
                (e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY);

if (isNaN(clientX) || isNaN(clientY) || clientX === undefined || clientY === undefined) {
    console.error('Invalid client coordinates:', { clientX, clientY, touch, eventType: e.type });
    return { x: 0, y: 0, valid: false };
}

// FIXED: Account for canvas borders properly
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

console.log('getCanvasCoordinates (BORDER-AWARE):', {
    client: { x: clientX, y: clientY },
    relative: { x: relativeX, y: relativeY },
    canvas: { x: canvasX, y: canvasY },
    rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
    borders: { left: borderLeft, top: borderTop, right: borderRight, bottom: borderBottom },
    content: { width: contentWidth, height: contentHeight },
    canvasSize: { width: canvas.width, height: canvas.height },
    scale: { x: canvas.width / contentWidth, y: canvas.height / contentHeight }
});

return { x: canvasX, y: canvasY, valid: true };
}

function clampView(state, canvas, cursorX = null, cursorY = null) {
const zoomLevel = state.zoomLevel;
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

// Calculate the scaled dimensions of the canvas content
const scaledWidth = canvasWidth * zoomLevel;
const scaledHeight = canvasHeight * zoomLevel;

// Viewport is the canvas display area
const viewportWidth = canvasWidth;
const viewportHeight = canvasHeight;

let panX = state.panX;
let panY = state.panY;

// FIXED: Special handling for zoom level 1 (full view)
if (state.zoomLevel <= 1.01) {
    // Center the canvas at full view
    panX = 0;
    panY = 0;
    return { panX, panY };
}

// Calculate pan bounds to allow all canvas edges in the viewport
const maxPanX = Math.max(0, scaledWidth - viewportWidth);
const minPanX = Math.min(0, viewportWidth - scaledWidth);
const maxPanY = scaledHeight - viewportHeight + 10;
const minPanY = Math.min(0, viewportHeight - scaledHeight);

// Clamp pan to keep content within viewport
panX = Math.max(minPanX, Math.min(maxPanX, panX));
panY = Math.max(minPanY, Math.min(maxPanY, panY));

// Adjust pan to keep cursor's content point in view if provided
if (cursorX !== null && cursorY !== null && state.zoomLevel > 1.01) {
    const contentX = (cursorX - panX) / state.zoomLevel;
    const contentY = (cursorY - panY) / state.zoomLevel;

    // Prioritize edge visibility when cursor is near them
    if (contentY > canvasHeight - 20 || contentY < 20 || contentX < 20 || contentX > canvasWidth - 20) {
        const desiredPanX = cursorX - contentX * state.zoomLevel;
        let desiredPanY = cursorY - contentY * state.zoomLevel;
        // Allow extra panning for bottom edge
        if (contentY > canvasHeight - 20) {
            desiredPanY = Math.min(desiredPanY, maxPanY);
        }
        panX = Math.max(minPanX, Math.min(maxPanX, desiredPanX));
        panY = Math.max(minPanY, Math.min(maxPanY, desiredPanY));
    }
}

return { panX, panY };
}


function saveState(forceSave = false, changedCanvasId = null) {
// Always save state before operations, or after complete operations (forceSave)
if (isDragging && !forceSave) {
    console.log('Skipped saveState during drag - waiting for forceSave');
    return;
}
if (isZooming && !forceSave) {
    console.log('Skipped saveState during zoom - waiting for forceSave');
    return;
}

const canvases = {
    base: { canvas: baseCanvas, ctx: baseCtx },
    paint: { canvas: paintCanvas, ctx: paintCtx },
    sampler: { canvas: samplerCanvas, ctx: samplerCtx }
};

const newState = {};
let hasAnyChanges = false;

Object.keys(canvases).forEach(key => {
    const { canvas, ctx } = canvases[key];
    const state = canvasStates[key];
    
    // Get unzoomed content from display canvas by resetting transform
    const tempCtx = ctx;
    tempCtx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to get raw content
    const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
    
    newState[key] = imageData;
    
    // Update currentImageData
    currentImageData[key] = imageData;
    
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
    if (forceSave || !undoStack.length || !compareImageData(undoStack[undoStack.length - 1]?.[key], imageData)) {
        hasAnyChanges = true;
    }
});

// Only save if there are actual changes or it's forced
if (!hasAnyChanges && !forceSave) {
    console.log('Skipped saveState - No changes detected');
    return;
}

// Limit stack size and clear redo stack
if (undoStack.length >= 50) undoStack.shift();
redoStack.length = 0; // Clear redo stack on new state
undoStack.push(newState);

hasCanvasChanged = false; // Reset after saving

if (isRecording) {
    recordMovement('state', { canvasId: changedCanvasId });
}

console.log('Saved state - Changed canvas:', changedCanvasId, 'Undo stack size:', undoStack.length, 'Forced:', forceSave);
}

// Add a flag to track mouse anchor state
let mouseAnchorStart = null; // Stores { x, y, target } for mouse start point


function commitActiveSelectionDrags() {
console.log('Committing any active selection drags before zoom...');

// Check if we have an active selection that was being dragged
if (isSelectionActive && selectedImageData && selectionBounds && selectionCanvas && selectionCanvas.dataset.targetCanvasId) {
if (isSelectionActive && multipointPath && multipointPath.length >= 3 && selectionCanvas && selectionCanvas.dataset.targetCanvasId) {
const targetCanvasId = selectionCanvas.dataset.targetCanvasId.replace('Canvas', '');
const targetCanvas = targetCanvasId === 'base' ? baseCanvas : 
                   targetCanvasId === 'paint' ? paintCanvas : samplerCanvas;
const targetCtx = targetCanvasId === 'base' ? baseCtx : 
                 targetCanvasId === 'paint' ? paintCtx : samplerCtx;

if (targetCanvas && targetCtx) {
    console.log(`Committing basquiatSelection drag on ${targetCanvasId}`);
    
    // Get the current visual state (including any dragged selections)
    const currentVisualState = targetCtx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
    
    // Update currentImageData with the visual state
    currentImageData[targetCanvasId] = currentVisualState;
    
    // Update offscreen canvas to match
    const state = canvasStates[targetCanvasId];
    if (!state.offscreenCanvas || state.offscreenCanvas.width !== targetCanvas.width || state.offscreenCanvas.height !== targetCanvas.height) {
        state.offscreenCanvas = document.createElement('canvas');
        state.offscreenCanvas.width = targetCanvas.width;
        state.offscreenCanvas.height = targetCanvas.height;
    }
    const offscreenCtx = state.offscreenCanvas.getContext('2d', { alpha: true });
    offscreenCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    offscreenCtx.putImageData(currentVisualState, 0, 0);
    
    // Save this state to undo stack
    saveState(true, targetCanvasId);
    
    console.log(`Committed basquiatSelection drag to ${targetCanvasId} and saved to undo stack`);
}
}
    const targetCanvasId = selectionCanvas.dataset.targetCanvasId.replace('Canvas', '');
    const targetCanvas = targetCanvasId === 'base' ? baseCanvas : 
                       targetCanvasId === 'paint' ? paintCanvas : samplerCanvas;
    const targetCtx = targetCanvasId === 'base' ? baseCtx : 
                     targetCanvasId === 'paint' ? paintCtx : samplerCtx;
    
    if (targetCanvas && targetCtx) {
        console.log(`Committing selection drag on ${targetCanvasId}`);
        
        // Get the current visual state (including any dragged selections)
        const currentVisualState = targetCtx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
        
        // Update currentImageData with the visual state
        currentImageData[targetCanvasId] = currentVisualState;
        
        // Update offscreen canvas to match
        const state = canvasStates[targetCanvasId];
        if (!state.offscreenCanvas || state.offscreenCanvas.width !== targetCanvas.width || state.offscreenCanvas.height !== targetCanvas.height) {
            state.offscreenCanvas = document.createElement('canvas');
            state.offscreenCanvas.width = targetCanvas.width;
            state.offscreenCanvas.height = targetCanvas.height;
        }
        const offscreenCtx = state.offscreenCanvas.getContext('2d', { alpha: true });
        offscreenCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
        offscreenCtx.putImageData(currentVisualState, 0, 0);
        
        // Save this state to undo stack
        saveState(true, targetCanvasId);
        
        console.log(`Committed selection drag to ${targetCanvasId} and saved to undo stack`);
    }
}

// Also check for any other visual changes that need committing
['base', 'paint', 'sampler'].forEach(canvasId => {
    const canvas = canvasId === 'base' ? baseCanvas : canvasId === 'paint' ? paintCanvas : samplerCanvas;
    const ctx = canvasId === 'base' ? baseCtx : canvasId === 'paint' ? paintCtx : samplerCtx;
    const state = canvasStates[canvasId];
    
    // Get current visual state
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to get raw content
    const currentVisual = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Check if visual state differs from stored state
    if (!currentImageData[canvasId] || !compareImageData(currentImageData[canvasId], currentVisual)) {
        console.log(`Detected uncommitted visual changes on ${canvasId}, committing...`);
        
        // Update stored state
        currentImageData[canvasId] = currentVisual;
        
        // Update offscreen canvas
        if (!state.offscreenCanvas || state.offscreenCanvas.width !== canvas.width || state.offscreenCanvas.height !== canvas.height) {
            state.offscreenCanvas = document.createElement('canvas');
            state.offscreenCanvas.width = canvas.width;
            state.offscreenCanvas.height = canvas.height;
        }
        const offscreenCtx = state.offscreenCanvas.getContext('2d', { alpha: true });
        offscreenCtx.clearRect(0, 0, canvas.width, canvas.height);
        offscreenCtx.putImageData(currentVisual, 0, 0);
    }
    
    // Restore zoom transform if needed
    if (state.zoomLevel !== 1 || state.panX !== 0 || state.panY !== 0) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(state.panX, state.panY);
        ctx.scale(state.zoomLevel, state.zoomLevel);
        ctx.putImageData(currentImageData[canvasId], 0, 0);
        ctx.restore();
    }
});
}

function enterZoomMode(e) {
if (isZooming) return;

// CRITICAL: Commit any active selection drags before entering zoom mode
commitActiveSelectionDrags();

// Store the current selection state before entering zoom mode (optional, but kept for potential future use)
window.wasSelecting = isSelecting;
window.previousSelectionShape = brushShape;

// Fully clear selection state to cancel marching ants
clearSelectionState();

// Temporarily disable selection mode if active (redundant after clear, but safe)
if (isSelecting) {
    isSelecting = false;
    isSelectionActive = false;
    console.log('Temporarily disabled selection mode for zoom');
}

// DISABLE SELECTION BUTTONS
disableSelectionButtons();

isZooming = true;
zoomBtn.classList.add('active');
console.log('Zoom mode ON - Selection tools disabled, active drags committed');
touchPoints = [];
lastTouchPoints = [];

// Reset target locks for all canvases
Object.keys(canvasStates).forEach(canvasKey => {
    canvasStates[canvasKey].targetLocked = false;
    canvasStates[canvasKey].targetX = 0;
    canvasStates[canvasKey].targetY = 0;
    canvasStates[canvasKey].zoomPivotX = 0;
    canvasStates[canvasKey].zoomPivotY = 0;
});

// Helper function to apply zoom
const applyZoom = (canvas, canvasKey, zoomFactor, x, y) => {
    const state = canvasStates[canvasKey];
    state.zoomPivotX = x;
    state.zoomPivotY = y;
    state.targetLocked = true;
    state.zoomLevel *= zoomFactor;
    state.zoomLevel = Math.max(0.1, Math.min(state.zoomLevel, 10)); // Clamp zoom
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(state.panX + x, state.panY + y);
    ctx.scale(state.zoomLevel, state.zoomLevel);
    ctx.translate(-x, -y);
    if (currentImageData[canvasKey]) {
        ctx.putImageData(currentImageData[canvasKey], 0, 0);
    }
    console.log(`Zoom on ${canvasKey}, level: ${state.zoomLevel}, pivot: (${x}, ${y})`);
    saveState();
};

// Mouse/touchpad double-click and hold handler
let lastY = null;
zoomEventHandlers.dblclick = (e) => {
    if (isZooming && e.button === 0) {
        const canvas = e.target;
        const canvasKey = canvas === baseCanvas ? 'base' : canvas === paintCanvas ? 'paint' : 'sampler';
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / (rect.width / canvas.width);
        const y = (e.clientY - rect.top) / (rect.height / canvas.height);
        canvasStates[canvasKey].zoomPivotX = x;
        canvasStates[canvasKey].zoomPivotY = y;
        console.log(`Double-click on ${canvasKey}, pivot set: (${x}, ${y})`);
        e.stopPropagation();
    }
};

zoomEventHandlers.mousedown = (e) => {
    if (isZooming && e.button === 0) {
        const canvas = e.target;
        const canvasKey = canvas === baseCanvas ? 'base' : canvas === paintCanvas ? 'paint' : 'sampler';
        if (canvasStates[canvasKey].zoomPivotX !== 0 && canvasStates[canvasKey].zoomPivotY !== 0) {
            lastY = e.clientY;
            console.log(`Mousedown after double-click on ${canvasKey}, tracking zoom`);
            e.stopPropagation();
        }
    }
};

zoomEventHandlers.mousemove = (e) => {
    if (isZooming && lastY !== null) {
        const canvas = e.target;
        const canvasKey = canvas === baseCanvas ? 'base' : canvas === paintCanvas ? 'paint' : 'sampler';
        const deltaY = lastY - e.clientY; // Positive = upward, negative = downward
        const zoomFactor = 1 + (deltaY * 0.01); // Adjust zoom sensitivity
        applyZoom(canvas, canvasKey, zoomFactor, canvasStates[canvasKey].zoomPivotX, canvasStates[canvasKey].zoomPivotY);
        lastY = e.clientY;
        e.stopPropagation();
    }
};

zoomEventHandlers.mouseup = (e) => {
    if (isZooming) {
        const canvas = e.target;
        const canvasKey = canvas === baseCanvas ? 'base' : canvas === paintCanvas ? 'paint' : 'sampler';
        canvasStates[canvasKey].targetLocked = false; // Allow new double-click
        lastY = null;
        console.log(`Mouseup on ${canvasKey}, ready for new pivot`);
        e.stopPropagation();
    }
};

// Touchscreen tap and hold handler
zoomEventHandlers.touchstart = (e) => {
    if (isZooming && e.touches.length === 1) {
        const canvas = e.target;
        const canvasKey = canvas === baseCanvas ? 'base' : canvas === paintCanvas ? 'paint' : 'sampler';
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches[0].clientX - rect.left) / (rect.width / canvas.width);
        const y = (e.touches[0].clientY - rect.top) / (rect.height / canvas.height);
        canvasStates[canvasKey].zoomPivotX = x;
        canvasStates[canvasKey].zoomPivotY = y;
        lastY = e.touches[0].clientY;
        console.log(`Touchstart on ${canvasKey}, pivot set: (${x}, ${y})`);
        e.stopPropagation();
    }
};

zoomEventHandlers.touchmove = (e) => {
    if (isZooming && e.touches.length === 1) {
        const canvas = e.target;
        const canvasKey = canvas === baseCanvas ? 'base' : canvas === paintCanvas ? 'paint' : 'sampler';
        const deltaY = lastY - e.touches[0].clientY; // Positive = upward, negative = downward
        const zoomFactor = 1 + (deltaY * 0.01); // Adjust zoom sensitivity
        applyZoom(canvas, canvasKey, zoomFactor, canvasStates[canvasKey].zoomPivotX, canvasStates[canvasKey].zoomPivotY);
        lastY = e.touches[0].clientY;
        e.stopPropagation();
    }
};

zoomEventHandlers.touchend = (e) => {
    if (isZooming) {
        const canvas = e.target;
        const canvasKey = canvas === baseCanvas ? 'base' : canvas === paintCanvas ? 'paint' : 'sampler';
        canvasStates[canvasKey].targetLocked = false; // Allow new tap
        lastY = null;
        console.log(`Touchend on ${canvasKey}, ready for new pivot`);
        e.stopPropagation();
    }
};

// Attach handlers to canvases
[baseCanvas, paintCanvas, samplerCanvas].forEach(canvas => {
    canvas.addEventListener('dblclick', zoomEventHandlers.dblclick, { capture: true });
    canvas.addEventListener('mousedown', zoomEventHandlers.mousedown, { capture: true });
    canvas.addEventListener('mousemove', zoomEventHandlers.mousemove, { capture: true });
    canvas.addEventListener('mouseup', zoomEventHandlers.mouseup, { capture: true });
    canvas.addEventListener('touchstart', zoomEventHandlers.touchstart, { capture: true, passive: false });
    canvas.addEventListener('touchmove', zoomEventHandlers.touchmove, { capture: true, passive: false });
    canvas.addEventListener('touchend', zoomEventHandlers.touchend, { capture: true, passive: false });
    canvas.addEventListener('mousedown', handleMouseZoomDrag);
    canvas.addEventListener('mousemove', handleMouseZoomDrag);
    canvas.addEventListener('mouseup', handleMouseZoomDrag);
    canvas.addEventListener('touchstart', handleTouchpadZoom);
    canvas.addEventListener('touchmove', handleTouchpadZoom);
    canvas.addEventListener('touchend', handleTouchpadZoom);
});
}

// Global zoom reset listeners - catches releases outside canvas
document.addEventListener('mouseup', (e) => {
if (isZooming && isDragging) {
    // Only reset targetLocked, not the pivot points or zoom level
    Object.keys(canvasStates).forEach(canvasKey => {
        canvasStates[canvasKey].targetLocked = false;
    });
    console.log('Global mouseup - Unlocked zoom targets');
}
});

document.addEventListener('touchend', (e) => {
if (isZooming && isDragging && e.touches.length === 0) {
    // Only reset targetLocked, not the pivot points or zoom level
    Object.keys(canvasStates).forEach(canvasKey => {
        canvasStates[canvasKey].targetLocked = false;
    });
    console.log('Global touchend - Unlocked zoom targets');
}
});

function exitZoomMode(preserveZoom = false, restoreSelection = false) {
if (!isZooming) return;
isZooming = false;
zoomBtn.classList.remove('active');
console.log('Zoom mode OFF - preserveZoom:', preserveZoom, 'restoreSelection:', restoreSelection);

// RE-ENABLE SELECTION BUTTONS
enableSelectionButtons();

// Always clear selection state when exiting zoom
clearSelectionState();

// Clear event handlers
[baseCanvas, paintCanvas, samplerCanvas].forEach(canvas => {
    // Remove zoom-specific handlers
    canvas.removeEventListener('dblclick', zoomEventHandlers.dblclick, { capture: true });
    canvas.removeEventListener('mousedown', zoomEventHandlers.mousedown, { capture: true });
    canvas.removeEventListener('mousemove', zoomEventHandlers.mousemove, { capture: true });
    canvas.removeEventListener('mouseup', zoomEventHandlers.mouseup, { capture: true });
    canvas.removeEventListener('touchstart', zoomEventHandlers.touchstart, { capture: true });
    canvas.removeEventListener('touchmove', zoomEventHandlers.touchmove, { capture: true });
    canvas.removeEventListener('touchend', zoomEventHandlers.touchend, { capture: true });
});

if (preserveZoom) {
    // Preserve zoom view but clear locks
    Object.keys(canvasStates).forEach(canvasKey => {
        const state = canvasStates[canvasKey];
        state.targetLocked = false;
        state.zoomPivotX = 0;
        state.zoomPivotY = 0;
        state.targetX = 0;
        state.targetY = 0;
    });
    touchPoints = [];
    lastTouchPoints = [];
    console.log('Zoom mode OFF - Zoom view preserved for painting');
    return;
}

// Reset view if not preserving
Object.keys(canvasStates).forEach(canvasKey => {
    const state = canvasStates[canvasKey];
    const canvas = canvasKey === 'base' ? baseCanvas : canvasKey === 'paint' ? paintCanvas : samplerCanvas;
    const ctx = canvas.getContext('2d');
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    state.zoomLevel = 1;
    state.panX = 0;
    state.panY = 0;
    state.hasZoomedIn = false;
    state.targetLocked = false;
    state.zoomPivotX = 0;
    state.zoomPivotY = 0;
    state.targetX = 0;
    state.targetY = 0;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (currentImageData[canvasKey]) {
        ctx.putImageData(currentImageData[canvasKey], 0, 0);
    }
    
    // Update offscreen
    if (state.offscreenCanvas) {
        const offscreenCtx = state.offscreenCanvas.getContext('2d', { alpha: true });
        offscreenCtx.clearRect(0, 0, canvas.width, canvas.height);
        if (currentImageData[canvasKey]) {
            offscreenCtx.putImageData(currentImageData[canvasKey], 0, 0);
        }
    }
});

touchPoints = [];
lastTouchPoints = [];
saveState(true);
console.log('Zoom mode OFF - All canvases reset to full view');
}

// Remove the old click listener and add hold-based listeners
zoomBtn.addEventListener('click', (e) => {
if (e.button === 0) {
    e.preventDefault();
    isZooming = !isZooming;
    if (isZooming) {
disableSelectionButtons();
        enterZoomMode(e);
        zoomBtn.classList.add('active');
    } else {
enableSelectionButtons();
        exitZoomMode(true);  // Preserve zoom view
        zoomBtn.classList.remove('active');
    }
}
});


zoomBtn.addEventListener('touchstart', (e) => {
e.preventDefault();
console.log('zoomBtn touchstart - Preparing tap, Touch ID:', e.touches[0]?.identifier);
zoomBtn.classList.add('active'); // Visual feedback
}, { passive: false });

zoomBtn.addEventListener('touchend', (e) => {
e.preventDefault();
isZooming = !isZooming;
if (isZooming) {
disableSelectionButtons();
    enterZoomMode(e);
    zoomBtn.classList.add('active');
} else {
enableSelectionButtons();
    exitZoomMode(true);  // Preserve zoom view
    zoomBtn.classList.remove('active');
}
}, { passive: false });

zoomBtn.addEventListener('touchcancel', () => {
exitZoomMode(); // Handle interrupted touches
});

// Global click handler to detoggle zoom mode
document.addEventListener('click', (e) => {
if (isZooming && e.button === 0 && e.target !== zoomBtn && !zoomBtn.contains(e.target)) {
    // Skip exiting zoom mode if the target is a canvas
if (e.target === baseCanvas || e.target === paintCanvas || e.target === samplerCanvas || !e.target.closest('#leftControls')) {
        return;
    }
    exitZoomMode();
    console.log('Zoom mode detoggled by global click, target:', e.target.id || e.target.tagName);
    zoomBtn.classList.remove('active');
}
});

document.addEventListener('keydown', (e) => {
// 🚫 BLOCK ALT ZOOM WHEN MODALS OPEN
if (isAnyModalOpen()) {
    return;
}

if (e.key === 'Alt') {
    e.preventDefault();
    isZooming = !isZooming;
    if (isZooming) {
        enterZoomMode(e);
        console.log('Alt key toggled - Zoom mode ON, isZooming:', isZooming);
        zoomBtn.classList.add('active');
    } else {
        exitZoomMode();
        console.log('Alt key toggled - Zoom mode OFF, isZooming:', isZooming);
        zoomBtn.classList.remove('active');
    }
}
});


// New function to attach detoggle logic to leftControls buttons
function attachZoomDetoggleListeners() {
const leftControlButtonIds = [
'boxBtn', 'circleBtn', 'rectangleBtn', 'triangleBtn', 'sweeperBtn',
'oilbarrelBtn', 'tvBtn', 'negativeBtn', 'jazzScatterBtn',
'meltBtn', 'brokenScreenBtn', 'aestheticLinesBtn',
'sticker1Btn', 'sticker2Btn', 'sticker3Btn', 'sticker4Btn', 'sticker5Btn',
'trash1Btn', 'trash2Btn', 'trash3Btn', 'trash4Btn', 'trash5Btn',
'stickerToggleBtn', 'paintBtn', 'undoBtn', 'redoBtn', 'resetBtn',
'colorPickerBtn', 'squareSelectionBtn', 'basquiatSelectionBtn', 'circleSelectionBtn',
'fullscreenBtn', 'randomizerBtn', 'recordBtn', 'printerBtn',
'flagBtn', 'auromaCoinBtn', 'aboutBtn'
];

// Brush buttons that should preserve zoom
const brushButtons = [
'boxBtn', 'circleBtn', 'rectangleBtn', 'triangleBtn', 'sweeperBtn',
'oilbarrelBtn', 'tvBtn', 'negativeBtn', 'jazzScatterBtn',
'meltBtn', 'brokenScreenBtn', 'aestheticLinesBtn',
'sticker1Btn', 'sticker2Btn', 'sticker3Btn', 'sticker4Btn', 'sticker5Btn',
'trash1Btn', 'trash2Btn', 'trash3Btn', 'trash4Btn', 'trash5Btn',
'stickerToggleBtn'  // Add this line
];

// Selection tools that should also preserve zoom
const selectionButtons = [
'squareSelectionBtn', 'basquiatSelectionBtn', 'circleSelectionBtn'
];

leftControlButtonIds.forEach(id => {
    const button = document.getElementById(id);
    if (!button) {
        console.warn(`Button ${id} not found in leftControls`);
        return;
    }
    
    // Determine if this button should preserve zoom
    const shouldPreserveZoom = brushButtons.includes(id) || selectionButtons.includes(id);
    const isSelectionTool = selectionButtons.includes(id);
    
    // Touchscreen detoggle
    button.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (isZooming && id !== 'zoomBtn') {
            exitZoomMode(shouldPreserveZoom, false); // Don't restore selection when clicking buttons
            console.log(`Zoom mode detoggled by ${id} touch, preserveZoom: ${shouldPreserveZoom}`);
            zoomBtn.classList.remove('active');
        }
        button.dispatchEvent(new Event('click'));
    }, { passive: false });
    
    // Mouse click detoggle
    button.addEventListener('click', (e) => {
        if (isZooming && id !== 'zoomBtn') {
            exitZoomMode(shouldPreserveZoom, false); // Don't restore selection when clicking buttons
            console.log(`Zoom mode detoggled by ${id} click, preserveZoom: ${shouldPreserveZoom}`);
            zoomBtn.classList.remove('active');
        }
    });
});
}

document.getElementById('auromaCoinBtn').addEventListener('click', function() {
document.getElementById('auroma25Modal').style.display = 'block';
});

document.getElementById('closeAuroma25Btn').addEventListener('click', function() {
document.getElementById('auroma25Modal').style.display = 'none';
});

document.getElementById('enterVoidBtn').addEventListener('click', function() {
window.open('https://https://etherscan.io/token/0xe9e0bac70e1fa1f609d5899fbc0539844de184ff', '_blank'); // Replace with your actual link
});

// Call the function after DOM is loaded
document.addEventListener('DOMContentLoaded', attachZoomDetoggleListeners);
function getRandomHSL() {
const hue = Math.floor(Math.random() * 360);
const saturation = Math.floor(Math.random() * 31) + 70;
const lightness = Math.floor(Math.random() * 31) + 40;
return { hue, hsl: `hsl(${hue}, ${saturation}%, ${lightness}%)` };
}

function toggleColorScheme() {
const uiHue = Math.floor(Math.random() * 360);
const borderHueLight = uiHue; // Same hue, lightness adjusted in CSS
let bgHue = (uiHue + Math.floor(Math.random() * 181) + 90) % 360;
const bgColor = `hsl(${bgHue}, ${Math.floor(Math.random() * 31) + 70}%, ${Math.floor(Math.random() * 31) + 40}%)`;

document.documentElement.style.setProperty('--ui-hue', `${uiHue}deg`);
document.documentElement.style.setProperty('--ui-background', bgColor);
document.documentElement.style.setProperty('--border-hue-light', `${borderHueLight}deg`);

console.log(`Switched to random UI: uiHue=${uiHue}deg, borderHueLight=${borderHueLight}deg, uiBackground=${bgColor}`);
}

document.getElementById('colorToggleBtn').addEventListener('click', toggleColorScheme);

// Add sampling rate limiter
const MIN_SMEAR_INTERVAL = 10; // Minimum 10ms between smears (100 Hz max)

function recordMovement(type, data) {
if (!isRecording) {
    console.warn('Cannot record: isRecording=', isRecording);
    return;
}

if (!currentMovement) {
    console.log('Initializing currentMovement for recording:', type);
    currentMovement = {
        shape: brushShape || 'box',
        size: brushSize || baseBrushSize || 200,
        rotation: brushRotation || 0,
        cloneSize: cloneBrushSize || brushSize || 200,
        cloneRotation: cloneBrushRotation || 0,
        paintMode: isPaintMode || false,
        paintColor: paintColor || { r: 255, g: 0, b: 0 },
        flipHorizontal: isFlipHorizontalActive || false,
        flipVertical: isFlipVerticalActive || false,
        stickerSlot: brushShape === 'stickerMode' ? stampOrder[0] : null,
        effects: {},
        activeEffects: [...activeEffects].map(k => keyLabels.find(kl => kl.key.toLowerCase() === k)?.effect).filter(e => e),
        smears: [],
        events: [],
        targetCanvas: data.canvasId || 'base',
        startTime: performance.now(),
        lastSmearTime: 0,
        eventCount: 0,
        duration: 0
    };
    recordedMovements = recordedMovements || [];
    recordedMovements.push(currentMovement);
}

const timestamp = data.timestamp || (performance.now() - currentMovement.startTime);
const sequence = currentMovement.eventCount || 0;
currentMovement.eventCount = sequence + 1;

// Update duration
currentMovement.duration = Math.max(currentMovement.duration, timestamp);

if (type === 'effect' && data.effect) {
    const effect = data.effect;
    if (data.state) {
        if (!currentMovement.activeEffects.includes(effect)) {
            currentMovement.activeEffects.push(effect);
        }
    } else {
        currentMovement.activeEffects = currentMovement.activeEffects.filter(e => e !== effect);
    }
    currentMovement.effects[effect] = data.state;
    const event = {
        type: 'effect',
        data: {
            effect,
            state: data.state,
            phase: (
                effect === 'neon' ? neonPhase :
                effect === 'flickerNegative' ? flickerPhase :
                effect === 'chromaticShift' ? vhsPhase :
                effect === 'emoji' ? emojiPhase : undefined
            ),
            timestamp: Number(timestamp.toFixed(2)),
            fingerRole: data.fingerRole || 'unknown',
            activeEffects: [...currentMovement.activeEffects]
        },
        timestamp: Number(timestamp.toFixed(2)),
        sequence
    };
    currentMovement.events.push(event);
    console.log('Recorded effect:', {
        effect,
        state: data.state,
        phase: event.data.phase,
        sequence,
        timestamp,
        activeEffects: event.data.activeEffects,
        totalEvents: currentMovement.events.length
    });
} else if (type === 'smear') {
    const lastSmearTime = currentMovement.lastSmearTime || 0;
    const minInterval = (brushShape === 'sweeper' || brushShape === 'oilbarrel' || brushShape === 'aestheticLines') ? 5 : MIN_SMEAR_INTERVAL;
    if (timestamp - lastSmearTime < minInterval) {
        console.log('Skipped smear due to sampling rate limit:', { timestamp, lastSmearTime, sequence });
        return;
    }
    currentMovement.lastSmearTime = timestamp;

    // Validate brush shape
    const validBrushes = [
        'box', 'circle', 'rectangle', 'triangle', 'sweeper', 'oilbarrel', 'tv',
        'negative', 'melt', 'brokenScreen', 'aestheticLines', 'jazzScatter',
        'stickerMode', 'squareSelection', 'basquiatSelection', 'circleSelection'
    ];
    const currentBrushShape = validBrushes.includes(data.brushShape || brushShape) ? (data.brushShape || brushShape) : 'box';

    // Process anchor points for multi-finger interactions
    let processedAnchorPoints = undefined;
    if ((currentBrushShape === 'sweeper' || currentBrushShape === 'oilbarrel' || currentBrushShape === 'aestheticLines') && data.anchorPoints) {
        processedAnchorPoints = data.anchorPoints.map((p, index) => ({
            x: Number(p.x?.toFixed(2)),
            y: Number(p.y?.toFixed(2)),
            lastX: Number((p.lastX !== undefined ? p.lastX : p.x)?.toFixed(2)),
            lastY: Number((p.lastY !== undefined ? p.lastY : p.y)?.toFixed(2)),
            fingerId: p.fingerId || p.id || `anchor_${index}`,
            target: p.target?.id || p.target?.tagName || 'canvas',
            index
        }));
    }

    // Create smear object
    const smear = {
        lastX: Number(data.lastX?.toFixed(2)),
        lastY: Number(data.lastY?.toFixed(2)),
        currentX: Number(data.currentX?.toFixed(2)),
        currentY: Number(data.currentY?.toFixed(2)),
        size: Number((data.size || brushSize || 200).toFixed(1)),
        rotation: Number((isIntentionalRotation ? data.rotation || brushRotation : 0).toFixed(3)),
        cloneSize: Number((data.cloneSize || cloneBrushSize || brushSize || 200).toFixed(1)),
        cloneRotation: Number((data.cloneRotation || cloneBrushRotation || 0).toFixed(3)),
        paintMode: isPaintMode,
        paintColor: data.paintColor || { r: paintColor.r, g: paintColor.g, b: paintColor.b },
        flipHorizontal: isFlipHorizontalActive,
        flipVertical: isFlipVerticalActive,
        canvasId: data.canvasId || 'base',
        brushShape: currentBrushShape,
        fingerId: data.fingerId || null,
        timestamp: Number(timestamp.toFixed(2)),
        sequence,
        duration: Number((data.duration || 0).toFixed(2)),
        anchorPoints: processedAnchorPoints,
        fingerCount: data.fingerCount || 1,
        inputType: data.inputType || 'unknown',
        gestureId: data.gestureId || null,
        nextX: data.nextX ? Number(data.nextX.toFixed(2)) : undefined,
        nextY: data.nextY ? Number(data.nextY.toFixed(2)) : undefined,
        mouseAnchorStart: (currentBrushShape === 'sweeper' || currentBrushShape === 'oilbarrel' || currentBrushShape === 'aestheticLines') && mouseAnchorStart ? {
            x: Number(mouseAnchorStart.x?.toFixed(2)),
            y: Number(mouseAnchorStart.y?.toFixed(2)),
            target: mouseAnchorStart.target?.id || 'canvas'
        } : undefined,
        stickerSlot: currentBrushShape === 'stickerMode' ? (data.stickerSlot || stampOrder[0] || null) : null,
        isTeleportClone: !!data.isTeleportClone,
        isReverseTeleport: !!data.isReverseTeleport,
        isSameCanvas: data.isSameCanvas,
        sourceX: data.sourceX ? Number(data.sourceX.toFixed(2)) : undefined,
        sourceY: data.sourceY ? Number(data.sourceY.toFixed(2)) : undefined,
        sourceCanvasId: data.sourceCanvasId || undefined,
        activeEffects: [...currentMovement.activeEffects]
    };

    // Only record valid smears
    if (currentBrushShape === 'stickerMode' && !smear.stickerSlot) {
        console.warn('Skipping stickerMode smear: no stickerSlot defined', smear);
        return;
    }
    if ((smear.lastX === smear.currentX && smear.lastY === smear.currentY) && !smear.anchorPoints) {
        console.log('Skipped smear with no movement and no anchor points:', smear);
        return;
    }

    currentMovement.smears.push(smear);
    currentMovement.targetCanvas = smear.canvasId || currentMovement.targetCanvas || 'base';

    console.log('Recorded smear:', {
        position: `(${smear.lastX}, ${smear.lastY}) to (${smear.currentX}, ${smear.currentY})`,
        canvasId: smear.canvasId,
        brushShape: smear.brushShape,
        stickerSlot: smear.stickerSlot,
        anchorPoints: smear.anchorPoints?.length || 0,
        fingerCount: smear.fingerCount,
        inputType: smear.inputType,
        gestureId: smear.gestureId,
        mouseAnchorStart: smear.mouseAnchorStart ? `(${smear.mouseAnchorStart.x}, ${smear.mouseAnchorStart.y})` : 'none',
        sequence: smear.sequence,
        timestamp: smear.timestamp,
        activeEffects: smear.activeEffects,
        totalSmears: currentMovement.smears.length
    });
} else if (type === 'stampOrder') {
    const event = {
        type: 'stampOrder',
        data: {
            stampOrder: [...data.stampOrder],
            fingerRole: data.fingerRole || 'qwertyKey',
            activeEffects: [...currentMovement.activeEffects],
            timestamp: Number(timestamp.toFixed(2))
        },
        timestamp: Number(timestamp.toFixed(2)),
        sequence
    };
    currentMovement.events.push(event);
    currentMovement.stickerSlot = brushShape === 'stickerMode' ? data.stampOrder[0] : currentMovement.stickerSlot;
    console.log('Recorded stampOrder event:', {
        stampOrder: event.data.stampOrder,
        fingerRole: event.data.fingerRole,
        sequence,
        timestamp,
        activeEffects: event.data.activeEffects,
        totalEvents: currentMovement.events.length
    });
} else if (type === 'stampLoad') {
    const event = {
        type: 'stampLoad',
        data: {
            slot: data.slot,
            stampOrder: [...data.stampOrder],
            fingerRole: data.fingerRole || 'fileInput',
            activeEffects: [...currentMovement.activeEffects],
            timestamp: Number(timestamp.toFixed(2))
        },
        timestamp: Number(timestamp.toFixed(2)),
        sequence
    };
    currentMovement.events.push(event);
    if (brushShape === 'stickerMode' && !currentMovement.stickerSlot) {
        currentMovement.stickerSlot = stampOrder[0];
    }
    console.log('Recorded stampLoad event:', {
        slot: event.data.slot,
        stampOrder: event.data.stampOrder,
        fingerRole: event.data.fingerRole,
        sequence,
        timestamp,
        activeEffects: event.data.activeEffects,
        totalEvents: currentMovement.events.length
    });
} else {
    const event = {
        type,
        data: {
            ...data,
            effect: data.effect || null,
            state: data.state != null ? data.state : null,
            timestamp: Number(timestamp.toFixed(2)),
            fingerRole: data.fingerRole || 'unknown',
            phase: data.phase != null ? data.phase : undefined,
            rotation: type === 'rotation' ? Number((data.rotation || 0).toFixed(3)) : undefined,
            size: type === 'size' ? Number((data.size || brushSize).toFixed(1)) : undefined,
            shape: type === 'shape' ? data.shape : undefined,
            activeEffects: [...currentMovement.activeEffects]
        },
        timestamp: Number(timestamp.toFixed(2)),
        sequence
    };
    currentMovement.events.push(event);
    console.log('Recorded event:', {
        type: event.type,
        effect: event.data.effect,
        state: event.data.state,
        sequence,
        timestamp,
        activeEffects: event.data.activeEffects,
        totalEvents: currentMovement.events.length,
        currentEffects: { ...currentMovement.effects }
    });
}
}




function randomizeMovements() {
if (!recordedMovements || recordedMovements.length === 0) {
    console.log('No recorded movements to randomize');
    randomizerModal.style.display = 'block';
    return;
}
const movement = recordedMovements[Math.floor(Math.random() * recordedMovements.length)];
console.log('Randomizing movement:', movement);

// Set initial state
brushShape = movement.shape;
brushSize = movement.size;
brushRotation = movement.rotation || 0;
paintMode = movement.paintMode;
paintColor = movement.paintColor;
const targetCanvas = movement.targetCanvas || 'base';
const ctx = targetCanvas === 'base' ? baseCtx : targetCanvas === 'paint' ? paintCtx : samplerCtx;
const canvas = targetCanvas === 'base' ? baseCanvas : targetCanvas === 'paint' ? paintCanvas : samplerCanvas;

// Apply initial effects
Object.keys(movement.effects).forEach(effect => {
    toggleEffect(effect, movement.effects[effect]);
});

// Restore initial canvas state if available
if (movement.state) {
    baseCtx.putImageData(movement.state.base, 0, 0);
    paintCtx.putImageData(movement.state.paint, 0, 0);
    samplerCtx.putImageData(movement.state.sampler, 0, 0);
    currentImageData.base = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
    currentImageData.paint = paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height);
    currentImageData.sampler = samplerCtx.getImageData(0, 0, samplerCanvas.width, samplerCanvas.height);
}

// In your randomizer, replace the smears loop:
movement.smears.forEach((smear, index) => {
// Update brush state
brushSize = smear.size || movement.size;
brushRotation = smear.rotation || movement.rotation || 0;
Object.keys(smear.effects).forEach(effect => {
    toggleEffect(effect, smear.effects[effect]);
});

if (smear.brushShape === "sweeper" && smear.anchorPoints && smear.anchorPoints.length >= 2) {
    // Set the global state the sweeper expects
    touchPoints = smear.anchorPoints;
    anchorPoints = smear.anchorPoints; 
    isDragging = true;
    
    // Call the actual sweeper function (not smearPixels!)
    drawSweeperLines(targetCanvas);
} else {
    // Regular brush behavior
    const clampedCurrentX = Math.max(0, Math.min(smear.currentX, canvas.width - 1));
    const clampedCurrentY = Math.max(0, Math.min(smear.currentY, canvas.height - 1));
    const clampedLastX = Math.max(0, Math.min(smear.lastX, canvas.width - 1));
    const clampedLastY = Math.max(0, Math.min(smear.lastY, canvas.height - 1));

    lastX = clampedLastX;
    lastY = clampedLastY;
    smearPixels(clampedCurrentX, clampedCurrentY, targetCanvas);
}
});

// Update canvas data and save state
currentImageData.base = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
currentImageData.paint = paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height);
currentImageData.sampler = samplerCtx.getImageData(0, 0, samplerCanvas.width, samplerCanvas.height);
saveState(true);

// Reset brush state
lastX = undefined;
lastY = undefined;
brushSize = movement.size;
brushRotation = movement.rotation || 0;
console.log('Completed movement playback');
}

// Draggable modal functionality
const modals = [
'aboutModal', 'randomizerModal', 'recordModal', 
'printerModal', 'saveModal', 'resolutionModal',
'colorPickerModal', 'nftModal', 'networkModal',
'ethereumContractModal', 'erc721MetadataModal', 
'erc1155MetadataModal', 'tezosMetadataModal', 
'roninMetadataModal'
];

if (!('ontouchstart' in window)) {
modals.push('auroma25Modal');  // Only draggable on desktop
}

// Function to check if any modal is currently open
function isAnyModalOpen() {
const allModalIds = [
    'aboutModal', 'randomizerModal', 'recordModal', 
    'printerModal', 'saveModal', 'resolutionModal',
    'colorPickerModal', 'nftModal', 'networkModal',
    'ethereumContractModal', 'erc721MetadataModal', 
    'erc1155MetadataModal', 'tezosMetadataModal', 
    'roninMetadataModal', 'auroma25Modal'
];

return allModalIds.some(modalId => {
    const modal = document.getElementById(modalId);
    if (!modal) return false;
    
    const computedStyle = getComputedStyle(modal);
    return computedStyle.display !== 'none';
});
}

// Helper function for debugging
function getOpenModals() {
const allModalIds = [
    'aboutModal', 'randomizerModal', 'recordModal', 
    'printerModal', 'saveModal', 'resolutionModal',
    'colorPickerModal', 'nftModal', 'networkModal',
    'ethereumContractModal', 'erc721MetadataModal', 
    'erc1155MetadataModal', 'tezosMetadataModal', 
    'roninMetadataModal', 'auroma25Modal'
];

const openModals = allModalIds.filter(modalId => {
    const modal = document.getElementById(modalId);
    if (!modal) return false;
    return getComputedStyle(modal).display !== 'none';
});

return openModals;
}

modals.forEach(modalId => {
const modal = document.getElementById(modalId);
if (!modal) {
    console.error(`Modal ${modalId} not found`);
    return;
}

let isDraggingModal = false;
let startX, startY, initialLeft, initialTop;

const startDrag = (e) => {
// Ignore interactive elements
if (['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'CANVAS'].includes(e.target.tagName) || 
    e.target.id.includes('close') || e.target.closest('button') ||
    e.target.closest('.network-option')) {
    console.log(`Drag ignored on interactive element: ${e.target.tagName}, id=${e.target.id}`);
    return;
}

    // Only allow dragging from the modal-header for colorPickerModal
    if (modalId === 'colorPickerModal' && !e.target.closest('.modal-header')) {
        console.log(`Drag ignored on ${modalId}: not targeting modal-header`);
        return;
    }

    e.preventDefault();
    e.stopPropagation();

    isDraggingModal = true;
    modal.style.cursor = 'grabbing';
    modal.style.zIndex = '6000';

    startX = e.clientX || (e.touches && e.touches[0].clientX);
    startY = e.clientY || (e.touches && e.touches[0].clientY);
    initialLeft = parseFloat(getComputedStyle(modal).left) || 100;
    initialTop = parseFloat(getComputedStyle(modal).top) || 100;

    console.log(`Start drag ${modalId}: start=(${startX}, ${startY}), initial=(${initialLeft}, ${initialTop})`);
};

const drag = (e) => {
    if (!isDraggingModal) return;

    e.preventDefault();
    e.stopPropagation();

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    if (!clientX || !clientY) {
        console.warn(`Invalid drag coordinates: (${clientX}, ${clientY})`);
        return;
    }

    const deltaX = clientX - startX;
    const deltaY = clientY - startY;
    let newLeft = initialLeft + deltaX;
    let newTop = initialTop + deltaY;

    const rect = modal.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;
    newLeft = Math.max(0, Math.min(newLeft, maxX));
    newTop = Math.max(0, Math.min(newTop, maxY));

    modal.style.left = `${newLeft}px`;
    modal.style.top = `${newTop}px`;

    console.log(`Dragging ${modalId} to (${newLeft}, ${newTop})`);
};

const stopDrag = (e) => {
    if (!isDraggingModal) return;

    e.preventDefault();
    e.stopPropagation();

    isDraggingModal = false;
    modal.style.cursor = 'default';
    modal.style.zIndex = '5000';

    console.log(`Stopped dragging ${modalId}`);
};

if (!modal.style.left || !modal.style.top) {
    modal.style.left = '100px';
    modal.style.top = '100px';
}

modal.addEventListener('mousedown', startDrag, { passive: false });
modal.addEventListener('touchstart', startDrag, { passive: false });
document.addEventListener('mousemove', drag, { passive: false });
document.addEventListener('touchmove', drag, { passive: false });
document.addEventListener('mouseup', stopDrag);
document.addEventListener('touchend', stopDrag);
document.addEventListener('touchcancel', stopDrag);
});

// Dark mode state and timers
let isDarkMode = false;
let holdTimer = null;
let isHolding = false;
let didTriggerDarkMode = false;
const originalBackground = '#FBB917';

// Toggle dark mode function
function toggleDarkMode() {
isDarkMode = !isDarkMode;

if (isDarkMode) {
    // Dark mode: black backgrounds
    document.documentElement.style.setProperty('--hue-group3', '#000000');
    console.log('Dark mode ON');
} else {
    // Light mode: restore original color
    document.documentElement.style.setProperty('--hue-group3', originalBackground);
    console.log('Dark mode OFF');
}

// Visual feedback on button
const brainlickerBtn = document.querySelector('.brainlicker-logo');
brainlickerBtn.style.filter = isDarkMode ? 
    'hue-rotate(var(--hue-group1)) brightness(0.6) saturate(1.5)' : 
    'hue-rotate(var(--hue-group1)) brightness(1.2) saturate(1.5)';
}

// Color cycle function (preserves existing functionality)
function cycleColors() {
if (!isDarkMode) {
    // Normal color cycle
    document.documentElement.style.setProperty('--hue-group1', `${Math.random() * 360}deg`);
    document.documentElement.style.setProperty('--hue-group2', `${Math.random() * 360}deg`);
    document.documentElement.style.setProperty('--hue-group3', `hsl(${Math.random() * 360}, 75%, 50%)`);
    document.documentElement.style.setProperty('--hue-group4', `${Math.random() * 360}deg`);
} else {
    // In dark mode, cycle other colors but keep background black
    document.documentElement.style.setProperty('--hue-group1', `${Math.random() * 360}deg`);
    document.documentElement.style.setProperty('--hue-group2', `${Math.random() * 360}deg`);
    document.documentElement.style.setProperty('--hue-group4', `${Math.random() * 360}deg`);
    // Keep group3 black
    document.documentElement.style.setProperty('--hue-group3', '#000000');
}

document.documentElement.setAttribute('hue-changed', '');
setTimeout(() => document.documentElement.removeAttribute('hue-changed'), 100);
}

// Get the Brainlicker button
const brainlickerBtn = document.querySelector('.brainlicker-logo');

// Prevent mobile context menu on long press
brainlickerBtn.addEventListener('contextmenu', (e) => {
e.preventDefault();
return false;
});

// Mouse events
brainlickerBtn.addEventListener('mousedown', (e) => {
e.preventDefault();
isHolding = true;
didTriggerDarkMode = false;

// Start 2-second timer for dark mode
holdTimer = setTimeout(() => {
    if (isHolding) {
        toggleDarkMode();
        didTriggerDarkMode = true;
        // Haptic feedback for mobile (if supported)
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }
    }
}, 2000);
});

brainlickerBtn.addEventListener('mouseup', (e) => {
e.preventDefault();
clearTimeout(holdTimer);

// Only cycle colors if we didn't trigger dark mode
if (!didTriggerDarkMode && isHolding) {
    cycleColors();
}

isHolding = false;
didTriggerDarkMode = false;
});

brainlickerBtn.addEventListener('mouseleave', (e) => {
clearTimeout(holdTimer);
isHolding = false;
didTriggerDarkMode = false;
});

// Touch events (for mobile)
brainlickerBtn.addEventListener('touchstart', (e) => {
e.preventDefault();
isHolding = true;
didTriggerDarkMode = false;

// Start 2-second timer for dark mode
holdTimer = setTimeout(() => {
    if (isHolding) {
        toggleDarkMode();
        didTriggerDarkMode = true;
        // Haptic feedback
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }
    }
}, 2000);
}, { passive: false });

brainlickerBtn.addEventListener('touchend', (e) => {
e.preventDefault();
clearTimeout(holdTimer);

// Only cycle colors if we didn't trigger dark mode
if (!didTriggerDarkMode && isHolding) {
    cycleColors();
}

isHolding = false;
didTriggerDarkMode = false;
}, { passive: false });

brainlickerBtn.addEventListener('touchcancel', (e) => {
clearTimeout(holdTimer);
isHolding = false;
didTriggerDarkMode = false;
});

// Prevent text selection on button
brainlickerBtn.style.userSelect = 'none';
brainlickerBtn.style.webkitUserSelect = 'none';
brainlickerBtn.style.webkitTouchCallout = 'none';

// Disable right-click context menu on all canvases
const canvases = [baseCanvas, paintCanvas, samplerCanvas];
canvases.forEach(canvas => {
canvas.addEventListener('contextmenu', (e) => {
e.preventDefault();
});
});

// SAFE DEBUG MONITORING - Add this after all your existing functions
// Monitor canvas changes without breaking existing code

// Override the critical functions safely
const originalPutImageData = CanvasRenderingContext2D.prototype.putImageData;
CanvasRenderingContext2D.prototype.putImageData = function(imageData, dx, dy) {
// Find which canvas this is
const canvasId = this.canvas === baseCanvas ? 'base' : 
                 this.canvas === paintCanvas ? 'paint' : 
                 this.canvas === samplerCanvas ? 'sampler' : 'unknown';

if (canvasId !== 'unknown') {
    logCanvasState('PUT_IMAGE_DATA', canvasId, { 
        dx: dx, 
        dy: dy, 
        dataSize: `${imageData.width}x${imageData.height}`,
        hasData: imageData.data.some(v => v !== 0)
    });
}

return originalPutImageData.call(this, imageData, dx, dy);
};

// Monitor when currentImageData gets updated
const originalCurrentImageData = { ...currentImageData };
Object.keys(currentImageData).forEach(canvasId => {
let value = currentImageData[canvasId];
Object.defineProperty(currentImageData, canvasId, {
    get() { return value; },
    set(newValue) {
        const hasData = newValue && newValue.data && newValue.data.some(v => v !== 0);
        logCanvasState('CURRENT_IMAGE_DATA_SET', canvasId, { 
            hasData: hasData,
            size: newValue ? `${newValue.width}x${newValue.height}` : 'null'
        });
        value = newValue;
    }
});
});

// Add a manual check function you can call
window.checkCanvasHealth = function() {
console.log('=== CANVAS HEALTH CHECK ===');
['base', 'paint', 'sampler'].forEach(canvasId => {
    logCanvasState('HEALTH_CHECK', canvasId);
});
dumpDebugInfo();
};

window.originalConfirm = window.confirm;
window.confirm = function(message) {
return new Promise((resolve) => {
    const modal = document.createElement('div');
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = "position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); width:400px; padding:20px; background:var(--hue-group3); border:3px solid hsl(var(--hue-group4),75%,50%); border-radius:12px; z-index:9999; color:#FFFFFF; text-align:center; font-family:'VCR OSD Mono',monospace;";
    
    const messageP = document.createElement('p');
    messageP.textContent = message; // Safe text insertion
    
    const yesButton = document.createElement('button');
    yesButton.textContent = 'YES';
    yesButton.style.cssText = "padding:10px 20px; margin:10px; border:2px solid hsl(var(--hue-group4), 75%, 50%); border-radius:8px; background:var(--hue-group3); color:#FFFFFF; font-family:'VCR OSD Mono',monospace; cursor:pointer;";
    
    const noButton = document.createElement('button');
    noButton.textContent = 'NO';
    noButton.style.cssText = "padding:10px 20px; margin:10px; border:2px solid hsl(var(--hue-group4), 75%, 50%); border-radius:8px; background:var(--hue-group3); color:#FFFFFF; font-family:'VCR OSD Mono',monospace; cursor:pointer;";
    
    yesButton.onclick = () => {
        document.body.removeChild(modal);
        resolve(true);
    };
    
    noButton.onclick = () => {
        document.body.removeChild(modal);
        resolve(false);
    };
    
    modalContent.appendChild(messageP);
    modalContent.appendChild(yesButton);
    modalContent.appendChild(noButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
});
};