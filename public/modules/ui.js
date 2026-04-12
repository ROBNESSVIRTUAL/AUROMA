/**
 * UI and Modals Module
 * Handles all UI interactions, modal dialogs, and button states
 */

/**
 * Custom confirm dialog
 */
let customConfirmCallback;

export function showCustomConfirm(callback) {
  const confirmEl = document.getElementById('customConfirm');
  if (confirmEl) {
    confirmEl.style.display = 'block';
    customConfirmCallback = callback;
  }
}

export function customConfirmYes() {
  const confirmEl = document.getElementById('customConfirm');
  if (confirmEl) {
    confirmEl.style.display = 'none';
  }
  if (customConfirmCallback) {
    customConfirmCallback(true);
  }
}

export function customConfirmNo() {
  const confirmEl = document.getElementById('customConfirm');
  if (confirmEl) {
    confirmEl.style.display = 'none';
  }
  if (customConfirmCallback) {
    customConfirmCallback(false);
  }
}

/**
 * Disable printer button
 */
export function disablePrinterButton() {
  const printerBtn = document.getElementById('printerBtn');
  if (printerBtn) {
    printerBtn.classList.add('printer-btn-disabled');
    printerBtn.disabled = true;
    console.log('Printer button disabled');
  }
}

/**
 * Disable selection buttons (when zoom is active)
 */
export function disableSelectionButtons() {
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

/**
 * Enable selection buttons (when zoom is deactivated)
 */
export function enableSelectionButtons() {
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

/**
 * Network/Wallet modal functions
 */
export function openNetworkModal() {
  const modal = document.getElementById('networkModal');
  if (modal) modal.style.display = 'block';
}

export function closeNetworkModal() {
  const modal = document.getElementById('networkModal');
  if (modal) modal.style.display = 'none';
}

/**
 * NFT modal functions
 * Complete implementation from editor.js lines 962-977
 */
export function openNftModal() {
  const modal = document.getElementById('nftModal');
  if (modal) {
    modal.style.display = 'block';
    // Import selectCanvas to reset selection
    import('./blockchain.js').then(({ selectCanvas }) => {
      // Reset canvas selection
      document.querySelectorAll('.canvas-option').forEach(option => {
        option.classList.remove('selected');
      });
      
      const confirmBtn = document.getElementById('confirmMintBtn');
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'SELECT CANVAS FIRST';
      }
    }).catch(() => {
      console.warn('Could not import blockchain module for openNftModal');
    });
  }
}

export function closeNftModal() {
  const modal = document.getElementById('nftModal');
  if (modal) modal.style.display = 'none';
}

/**
 * Ethereum contract selection modal
 */
export function openEthereumContractModal() {
  const modal = document.getElementById('ethereumContractModal');
  if (modal) modal.style.display = 'flex';
}

export function closeEthereumContractModal() {
  const modal = document.getElementById('ethereumContractModal');
  if (modal) modal.style.display = 'none';
}

/**
 * ERC-721 modal functions
 */
export function openErc721Modal() {
  const modal = document.getElementById('erc721Modal');
  if (modal) modal.style.display = 'flex';
}

export function closeErc721Modal() {
  const modal = document.getElementById('erc721Modal');
  if (modal) modal.style.display = 'none';
}

/**
 * ERC-1155 modal functions
 */
export function openErc1155Modal() {
  const modal = document.getElementById('erc1155Modal');
  if (modal) modal.style.display = 'flex';
}

export function closeErc1155Modal() {
  const modal = document.getElementById('erc1155Modal');
  if (modal) modal.style.display = 'none';
}

/**
 * Tezos modal functions
 */
export function openTezosModal() {
  const modal = document.getElementById('tezosModal');
  if (modal) modal.style.display = 'flex';
}

export function closeTezosModal() {
  const modal = document.getElementById('tezosModal');
  if (modal) modal.style.display = 'none';
}

/**
 * Ronin modal functions
 */
export function openRoninModal() {
  const modal = document.getElementById('roninModal');
  if (modal) modal.style.display = 'flex';
}

export function closeRoninModal() {
  const modal = document.getElementById('roninModal');
  if (modal) modal.style.display = 'none';
}

/**
 * Resolution settings modal
 */
export function openResolutionModal() {
  const modal = document.getElementById('resolutionModal');
  if (modal) modal.style.display = 'block';
}

export function closeResolutionModal() {
  const modal = document.getElementById('resolutionModal');
  if (modal) modal.style.display = 'none';
}

/**
 * Toggle view mode (single/3-canvas view)
 * @param {string} mode - 'single' or 'three'
 */
export function toggleViewMode(mode) {
  const singleBtn = document.getElementById('singleCanvasViewBtn');
  const threeBtn = document.getElementById('threeCanvasViewBtn');
  const baseCanvas = document.getElementById('baseCanvas');
  const paintCanvas = document.getElementById('paintCanvas');
  const samplerCanvas = document.getElementById('samplerCanvas');
  
  if (mode === 'single') {
    // Show only base canvas
    if (baseCanvas) baseCanvas.style.display = 'block';
    if (paintCanvas) paintCanvas.style.display = 'none';
    if (samplerCanvas) samplerCanvas.style.display = 'none';
    
    if (singleBtn) singleBtn.classList.add('active');
    if (threeBtn) threeBtn.classList.remove('active');
  } else if (mode === 'three') {
    // Show all canvases
    if (baseCanvas) baseCanvas.style.display = 'block';
    if (paintCanvas) paintCanvas.style.display = 'block';
    if (samplerCanvas) samplerCanvas.style.display = 'block';
    
    if (singleBtn) singleBtn.classList.remove('active');
    if (threeBtn) threeBtn.classList.add('active');
  }
}

/**
 * Update brush size display
 * @param {number} value - Brush size value
 */
export function updateBrushSizeDisplay(value) {
  const display = document.getElementById('brushSizeDisplay');
  if (display) {
    display.textContent = value;
  }
}

/**
 * Update hue display
 * Complete implementation from editor.js lines 2242-2250
 */
export function updateHueDisplay() {
  const display = document.getElementById('hueDisplay');
  const slider = document.getElementById('hueSlider');
  if (display && slider) {
    display.textContent = slider.value + '°';
    // Also update CSS custom property if needed
    const root = document.documentElement;
    root.style.setProperty('--glow-hue', slider.value + 'deg');
  }
}

/**
 * Show wallet connection required message
 * Complete implementation from editor.js lines 1077-1102
 */
export function showWalletConnectionRequired() {
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

/**
 * Show connected wallet state
 * Complete implementation from editor.js lines 877-922
 */
export function showConnectedState() {
  // Import walletState to get current account and network
  import('./state.js').then(({ walletState }) => {
    const walletBtn = document.getElementById('walletConnectBtn');
    if (walletBtn) {
      walletBtn.style.display = 'none';
    }

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
      const header = document.getElementById('header');
      if (header) {
        header.appendChild(addressDisplay);
      }
    }

    let networkIcon = '◈'; // Default Tezos
    if (walletState.currentNetwork === 'ethereum') networkIcon = '⟠';
    if (walletState.currentNetwork === 'ronin') networkIcon = '\u2694';
    
    const address = walletState.currentAccount || '';
    addressDisplay.textContent = `${networkIcon} ${address.slice(0,6)}...${address.slice(-4)}`;
    addressDisplay.title = `${walletState.currentNetwork?.toUpperCase() || 'UNKNOWN'} - CLICK TO DISCONNECT`;
    
    // Import disconnectWallet from blockchain module
    addressDisplay.onclick = () => {
      if (typeof window.disconnectWallet === 'function') {
        window.disconnectWallet();
      }
    };

    addressDisplay.onmouseenter = () => {
      addressDisplay.textContent = 'DISCONNECT';
      addressDisplay.style.background = 'rgba(255, 23, 157, 0.3)';
    };
    addressDisplay.onmouseleave = () => {
      addressDisplay.textContent = `${networkIcon} ${address.slice(0,6)}...${address.slice(-4)}`;
      addressDisplay.style.background = 'rgba(255, 23, 157, 0.1)';
    };
  }).catch(() => {
    // Fallback if module import fails
    console.warn('Could not import walletState for showConnectedState');
  });
}

/**
 * Show disconnected wallet state
 */
export function showDisconnectedState() {
  const connectBtn = document.getElementById('walletConnectBtn');
  const disconnectBtn = document.getElementById('disconnectWalletBtn');
  
  if (connectBtn) {
    connectBtn.style.display = 'block';
  }
  if (disconnectBtn) {
    disconnectBtn.style.display = 'none';
  }
}

/**
 * Initialize UI on page load
 */
export function initializeUI() {
  // Disable printer button by default
  disablePrinterButton();
  
  // Set up custom confirm buttons if they exist
  const yesBtn = document.getElementById('customConfirmYes');
  const noBtn = document.getElementById('customConfirmNo');
  
  if (yesBtn) {
    yesBtn.addEventListener('click', customConfirmYes);
  }
  if (noBtn) {
    noBtn.addEventListener('click', customConfirmNo);
  }
  
  console.log('UI initialized');
}

/**
 * Handle action button clicks with debouncing
 * @param {string} buttonId - Button element ID
 * @param {Function} action - Action to perform
 */
export function handleActionButton(buttonId, action) {
  const button = document.getElementById(buttonId);
  if (!button) return;
  
  let isProcessing = false;
  
  button.addEventListener('click', async () => {
    if (isProcessing) return;
    
    isProcessing = true;
    button.disabled = true;
    
    try {
      await action();
    } catch (error) {
      console.error(`Error in ${buttonId}:`, error);
    } finally {
      isProcessing = false;
      button.disabled = false;
    }
  });
}

// Expose globally for backward compatibility
if (typeof window !== 'undefined') {
  window.showCustomConfirm = showCustomConfirm;
  window.customConfirmYes = customConfirmYes;
  window.customConfirmNo = customConfirmNo;
  window.openNetworkModal = openNetworkModal;
  window.closeNetworkModal = closeNetworkModal;
  window.openNftModal = openNftModal;
  window.closeNftModal = closeNftModal;
}

