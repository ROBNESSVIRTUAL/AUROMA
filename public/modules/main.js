/**
 * AUROMA NFT Image Editor - Main Entry Point
 * This file imports all modules and initializes the application
 */

// Import all modules
import * as State from './state.js';
import * as Constants from './constants.js';
import * as Utils from './utils.js';
import * as CanvasManager from './canvasManager.js';
import * as History from './history.js';
import * as Effects from './effects.js';
import * as Drawing from './drawing.js';
import * as Selection from './selection.js';
import * as Zoom from './zoom.js';
import * as MIDI from './midi.js';
import * as Blockchain from './blockchain.js';
import * as UI from './ui.js';

// Initialize state first
State.initializeCanvasRefs();
State.initializeWindowGlobals();

// Make modules available globally for backward compatibility
window.AUROMA = {
  // State
  ...State,
  // Constants
  ...Constants,
  // Utils
  ...Utils,
  // Canvas
  ...CanvasManager,
  // History
  ...History,
  // Effects
  ...Effects,
  // Drawing
  ...Drawing,
  // Selection
  ...Selection,
  // Zoom
  ...Zoom,
  // MIDI
  ...MIDI,
  // Blockchain
  ...Blockchain,
  // UI
  ...UI
};

// Initialize modules when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

function initialize() {
  console.log('AUROMA Initializing...');
  
  // Initialize canvas manager
  CanvasManager.initializeDragAndDrop();
  
  // Initialize MIDI if available
  if (navigator.requestMIDIAccess) {
    MIDI.initMIDI();
  }
  
  // Initialize UI
  UI.initializeUI();
  
  // Initialize blockchain/wallet UI
  Blockchain.initializeWallet();
  
  // Initialize zoom
  Zoom.initializeZoom();
  
  // Initialize selection
  Selection.initializeSelection();
  
  // Ensure initial state
  History.ensureInitialState();
  
  console.log('AUROMA Initialized!');
}

// Export for use in other modules if needed
export { State, Constants, Utils, CanvasManager, History, Effects, Drawing, Selection, Zoom, MIDI, Blockchain, UI };