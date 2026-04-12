/**
 * Constants and Configuration Module
 * Contains all effect mappings, keyboard layouts, and configuration constants
 * Extracted from editor.js
 */

// Effect map for MIDI and keyboard controls
export const effectMap = {
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

// Virtual keyboard layout and effect mapping
export const keyLabels = [
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

// File validation constants
export const FILE_VALIDATION = {
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  VALID_HEADERS: ['ffd8ff', '89504e', '47494638', '52494646']
};

// Performance constants
export const PERFORMANCE = {
  DRAG_THROTTLE_MS: 16, // ~60fps
  MAX_UNDO: 20
};

// Get keyboard container element
export function getKeyboardContainer() {
  return document.getElementById('virtualKeyboard');
}

