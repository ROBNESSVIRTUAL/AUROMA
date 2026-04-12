/**
 * MIDI Controller Module
 * Handles MIDI input for controlling effects
 * Complete implementations extracted from editor.js
 */

import { effectMap } from './constants.js';
import { toggleEffect } from './effects.js';
import { midiState, recordingState } from './state.js';

let midiInputs = [];

/**
 * Initialize MIDI support
 * Complete implementation from editor.js lines 2330-2347
 */
export async function initMIDI() {
  if (!navigator.requestMIDIAccess) {
    console.log('Web MIDI API not supported in this browser');
    return;
  }

  try {
    midiState.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
    console.log('MIDI Access Granted:', midiState.midiAccess);
    setupMIDIInputs();
  } catch (error) {
    console.error('MIDI Access Denied:', error);
    alert('MIDI ACCESS DENIED. CHECK BROWSER PERMISSIONS OR CONNECT A MIDI DEVICE.');
  }
}

/**
 * Set up MIDI input devices
 * Complete implementation from editor.js lines 2348-2360
 */
export function setupMIDIInputs() {
  if (!midiState.midiAccess) return;

  const inputs = midiState.midiAccess.inputs.values();
  midiInputs = [];
  
  for (let input = inputs.next(); !input.done; input = inputs.next()) {
    input.value.onmidimessage = handleMIDIMessage;
    midiInputs.push(input.value);
    console.log('MIDI Input Connected:', input.value.name);
  }
  
  // Handle MIDI device state changes
  midiState.midiAccess.onstatechange = (event) => {
    console.log('MIDI State Change:', event.port.name, event.port.state);
    if (event.port.state === 'connected' && event.port.type === 'input') {
      event.port.onmidimessage = handleMIDIMessage;
      if (!midiInputs.includes(event.port)) {
        midiInputs.push(event.port);
        console.log('MIDI Input Connected:', event.port.name);
      }
    } else if (event.port.state === 'disconnected' && event.port.type === 'input') {
      const index = midiInputs.indexOf(event.port);
      if (index > -1) {
        midiInputs.splice(index, 1);
        console.log('MIDI Input Disconnected:', event.port.name);
      }
    }
  };
}

/**
 * Handle incoming MIDI messages
 * Complete implementation from editor.js lines 2361-2378
 * @param {MIDIMessageEvent} event - MIDI message event
 */
export function handleMIDIMessage(event) {
  const [command, note, velocity] = event.data;
  const isNoteOn = (command >= 144 && command <= 159) && velocity > 0;
  const isNoteOff = (command >= 128 && command <= 143) || (command >= 144 && command <= 159 && velocity === 0);
  
  for (const [effect, mapping] of Object.entries(effectMap)) {
    if (note === mapping.midi) {
      if (isNoteOn) {
        toggleEffect(effect, true, 'midi');
        console.log(`MIDI Note On: ${effect} (${note})`);
        
        // Record effect toggle if recording
        if (recordingState.isRecording && typeof window.currentMovement !== 'undefined' && window.currentMovement) {
          window.currentMovement.effects = window.currentMovement.effects || {};
          window.currentMovement.effects[effect] = true;
        }
      } else if (isNoteOff) {
        toggleEffect(effect, false, 'midi');
        console.log(`MIDI Note Off: ${effect} (${note})`);
        
        // Record effect toggle if recording
        if (recordingState.isRecording && typeof window.currentMovement !== 'undefined' && window.currentMovement) {
          window.currentMovement.effects = window.currentMovement.effects || {};
          window.currentMovement.effects[effect] = false;
        }
      }
    }
  }
}

/**
 * Get MIDI connection status
 * @returns {Object} - MIDI status information
 */
export function getMIDIStatus() {
  return {
    supported: !!navigator.requestMIDIAccess,
    connected: !!midiState.midiAccess,
    inputCount: midiInputs.length,
    inputs: midiInputs.map(input => ({
      name: input.name,
      manufacturer: input.manufacturer,
      state: input.state
    }))
  };
}

// Auto-initialize MIDI on module load
if (typeof window !== 'undefined') {
  window.addEventListener('load', initMIDI);
}

// Expose for backward compatibility
if (typeof window !== 'undefined') {
  window.initMIDI = initMIDI;
  window.handleMIDIMessage = handleMIDIMessage;
  window.getMIDIStatus = getMIDIStatus;
}
