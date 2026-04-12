# Editor.js Extraction Notes

## File Analysis

- **Total Lines**: 14,465
- **File Size**: ~592KB
- **Functions**: ~150+ function definitions
- **Sections**: ~146 logical sections

## Module Mapping Guide

Based on function names and code analysis:

### constants.js

- Lines 186-237: effectMap, keyLabels
- All configuration constants

### utils.js

- Lines 241-271: validateImageFile
- Lines 6927-6968: rgbToHsl, hslToRgb
- Lines 8017-8237: hsvToRgb, rgbToHex, hexToRgb, rgbToHsv
- Lines 2174-2185: debounce
- Lines 7950-7961: throttle
- Lines 5494-5503: calculatePolygonBounds
- All helper/utility functions

### state.js

- Lines 1-237: All variable declarations
- All global state variables

### canvasManager.js

- Lines 335-423: Drag and drop initialization
- Lines 425-544: loadDroppedImage, loadToBaseCanvas, loadToPaintCanvas, loadToSamplerCanvas
- Lines 12933-12987: redrawCanvas
- Lines 12915-12930: compareImageData
- All canvas manipulation functions

### history.js

- Lines 9107-9220: undo, redo
- Lines 12820-12900: saveState
- Lines 12902-12911: ensureInitialState
- All undo/redo functionality

### effects.js

- Lines 6608-6926: applyEffects
- Lines 12294-12547: toggleEffect
- All visual effects logic

### drawing.js

- Lines 2970-4187: startDrag
- Lines 4188-5158: drag
- Lines 5159-5493: endDrag
- Lines 6969-7758: smearPixels
- Lines 7659-7758: smearSelection
- All drawing operations

### selection.js

- Lines 2694-2822: renderMarchingAnts
- Lines 5504-5600: captureSelection
- Lines 5601-5633: isPointInSelection
- Lines 8965-9041: clearSelectionState
- All selection tool functionality

### zoom.js

- Lines 5634-5734: handleZoomWheel
- Lines 5735-5788: handleMouseZoomDrag
- Lines 5789-5829: handleTouchpadZoom
- Lines 5830-5871: performZoom
- Lines 13297-13643: enterZoomMode, exitZoomMode
- All zoom/pan functionality

### midi.js

- Lines 2330-2347: initMIDI
- Lines 2348-2360: setupMIDIInputs
- Lines 2361-2378: handleMIDIMessage
- All MIDI functionality

### blockchain.js

- Lines 716-875: connectToEthereum, connectToTezos, connectToRonin
- Lines 877-961: showConnectedState, disconnectWallet
- Lines 962-1909: NFT minting functions (openNftModal, closeNftModal, startMinting, etc.)
- All wallet and blockchain functionality

### ui.js

- Lines 273-284: disablePrinterButton
- Lines 286-319: disableSelectionButtons, enableSelectionButtons
- Lines 322-333: showCustomConfirm, customConfirmYes, customConfirmNo
- Lines 8005-8279: Color picker functions
- Lines 14137-14232: Modal drag functionality
- Lines 14242-14381: toggleDarkMode, cycleColors
- Lines 7759-7949: handleActionButton
- All UI and modal functionality

## Dependencies to Handle

- Global variables accessed across modules need to be in state.js
- Functions that depend on DOM elements need proper initialization
- Event listeners need to be properly organized
- Canvas references need to be properly initialized

## Extraction Strategy

1. Extract constants first (no dependencies)
2. Extract utilities (minimal dependencies)
3. Extract state variables (many dependencies)
4. Extract modules in dependency order:
   - canvasManager
   - history
   - effects
   - drawing (depends on effects, canvas)
   - selection (depends on drawing, canvas)
   - zoom (depends on canvas, selection)
   - midi (depends on effects, constants)
   - blockchain (depends on canvas)
   - ui (depends on everything)
5. Create main.js that imports all and initializes
